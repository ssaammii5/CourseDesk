import logging
import mimetypes
import os
import tempfile
import uuid
from typing import Any

import boto3
from botocore.config import Config
from botocore.exceptions import ClientError
from fastapi import HTTPException, UploadFile, status

from app.utils.settings import settings

logger = logging.getLogger("coursedesk.storage")

_r2_client: Any = None


def is_r2_configured() -> bool:
    """Check if all necessary Cloudflare R2 credentials are set."""
    return bool(
        settings.R2_ACCOUNT_ID.strip()
        and settings.R2_ACCESS_KEY_ID.strip()
        and settings.R2_SECRET_ACCESS_KEY.strip()
        and settings.R2_BUCKET_NAME.strip()
    )


def get_r2_client() -> Any:
    """Get or lazily initialize the S3-compatible client for Cloudflare R2."""
    global _r2_client
    if _r2_client is None:
        if not is_r2_configured():
            raise RuntimeError("Cloudflare R2 is not fully configured in settings.")
        
        endpoint = f"https://{settings.R2_ACCOUNT_ID.strip()}.r2.cloudflarestorage.com"
        _r2_client = boto3.client(
            service_name="s3",
            endpoint_url=endpoint,
            aws_access_key_id=settings.R2_ACCESS_KEY_ID.strip(),
            aws_secret_access_key=settings.R2_SECRET_ACCESS_KEY.strip(),
            region_name="auto",
            config=Config(
                signature_version="s3v4",
                retries={"max_attempts": 3, "mode": "standard"},
            ),
        )
    return _r2_client


def human_readable_size(num_bytes: int) -> str:
    """Format bytes into human-readable string (e.g. 1.5 MB)."""
    size = float(num_bytes)
    for unit in ("B", "KB", "MB", "GB"):
        if size < 1024 or unit == "GB":
            return f"{int(size)} {unit}" if unit == "B" else f"{size:.1f} {unit}"
        size /= 1024
    return f"{size:.1f} GB"


def upload_to_r2(
    file: UploadFile,
    subdir: str,
    max_size_bytes: int = 50 * 1024 * 1024,
) -> tuple[str, str, str]:
    """Upload an uploaded file stream to Cloudflare R2.
    
    Returns (file_url, file_type, file_size_human).
    """

    safe_name = os.path.basename(file.filename or "file")
    raw_ext = os.path.splitext(safe_name)[1].lower()
    ext = "".join(c for c in raw_ext if c.isalnum() or c == ".")
    unique_name = f"{uuid.uuid4().hex}{ext}"
    clean_subdir = os.path.normpath(subdir).lstrip("/\\").replace("\\", "/")
    object_key = f"{clean_subdir}/{unique_name}" if clean_subdir and clean_subdir != "." else unique_name

    content_type = file.content_type or mimetypes.guess_type(safe_name)[0] or "application/octet-stream"

    status_413 = getattr(
        status, "HTTP_413_CONTENT_TOO_LARGE", status.HTTP_413_REQUEST_ENTITY_TOO_LARGE
    )

    # Use a spooled temporary file (spills to disk beyond 5MB) to protect RAM during large uploads
    spooled_file = tempfile.SpooledTemporaryFile(max_size=5 * 1024 * 1024)
    total_read = 0
    chunk_size = 1024 * 1024  # 1MB chunk

    try:
        while True:
            chunk = file.file.read(chunk_size)
            if not chunk:
                break
            total_read += len(chunk)
            if total_read > max_size_bytes:
                raise HTTPException(
                    status_413,
                    detail=f"File exceeds maximum allowed size of {human_readable_size(max_size_bytes)}",
                )
            spooled_file.write(chunk)

        spooled_file.seek(0)
        client = get_r2_client()

        bucket = settings.R2_BUCKET_NAME.strip()
        client.upload_fileobj(
            Fileobj=spooled_file,
            Bucket=bucket,
            Key=object_key,
            ExtraArgs={
                "ContentType": content_type,
            },
        )
    except HTTPException:
        raise
    except Exception as exc:
        logger.error("Failed to upload file to Cloudflare R2: %s", exc, exc_info=True)
        raise HTTPException(
            status.HTTP_502_BAD_GATEWAY,
            detail="Failed to upload file to storage service",
        ) from exc
    finally:
        spooled_file.close()

    # Determine URL
    public_base = settings.R2_PUBLIC_URL.strip()
    if public_base:
        file_url = f"{public_base.rstrip('/')}/{object_key}"
    else:
        # Generate presigned download URL (7 days) if no public custom domain is configured
        try:
            file_url = client.generate_presigned_url(
                "get_object",
                Params={"Bucket": settings.R2_BUCKET_NAME.strip(), "Key": object_key},
                ExpiresIn=604800,
            )
        except Exception:
            file_url = f"https://{settings.R2_BUCKET_NAME.strip()}.{settings.R2_ACCOUNT_ID.strip()}.r2.cloudflarestorage.com/{object_key}"

    file_type = (ext.lstrip(".") or "FILE").upper()
    return file_url, file_type, human_readable_size(total_read)


def delete_from_r2(file_url_or_key: str) -> bool:
    """Delete an object from Cloudflare R2 given its public URL or object key."""
    if not is_r2_configured():
        return False

    key = file_url_or_key
    public_base = settings.R2_PUBLIC_URL.strip()
    if public_base and key.startswith(public_base):
        key = key[len(public_base) :].lstrip("/")
    elif "r2.cloudflarestorage.com/" in key:
        key = key.split("r2.cloudflarestorage.com/", 1)[1].lstrip("/")
        if "/" in key:
            # strip bucket name prefix if included in path
            key = key.split("/", 1)[1]

    try:
        client = get_r2_client()
        client.delete_object(
            Bucket=settings.R2_BUCKET_NAME.strip(),
            Key=key,
        )
        return True
    except Exception as exc:
        logger.warning("Failed to delete object '%s' from R2: %s", key, exc)
        return False
