import logging
import smtplib
from email.message import EmailMessage

from app.utils.settings import settings

logger = logging.getLogger("coursedesk.email")


def send_otp_email(to_email: str, user_name: str, otp_code: str) -> bool:
    """Dispatches a 6-digit OTP code email to the user.

    If SMTP is configured via settings, sends real email via SMTP.
    Otherwise, logs the OTP code clearly to the application console.
    """
    subject = f"{otp_code} is your CourseDesk verification code"
    formatted_code = f"{otp_code[:3]} {otp_code[3:]}"

    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <style>
            body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; color: #1e293b; margin: 0; padding: 24px; }}
            .container {{ max-width: 520px; margin: 0 auto; background: #ffffff; border-radius: 20px; border: 1px solid #e2e8f0; padding: 40px 32px; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05); }}
            .logo {{ font-size: 22px; font-weight: 700; color: #1a73e8; margin-bottom: 24px; letter-spacing: -0.02em; }}
            h1 {{ font-size: 22px; font-weight: 700; color: #0f172a; margin-top: 0; margin-bottom: 12px; }}
            p {{ font-size: 14px; line-height: 1.6; color: #475569; margin: 12px 0; }}
            .code-box {{ text-align: center; margin: 28px 0; }}
            .code {{ display: inline-block; font-size: 36px; font-weight: 800; letter-spacing: 6px; color: #1a73e8; background: #eff6ff; padding: 14px 32px; border-radius: 14px; border: 2px dashed #bfdbfe; font-family: 'Courier New', Courier, monospace; }}
            .expiry {{ font-size: 13px; font-weight: 500; color: #64748b; margin-top: 8px; }}
            .security-notice {{ background: #f8fafc; border-left: 4px solid #94a3b8; padding: 12px 16px; margin: 24px 0; border-radius: 4px; }}
            .footer {{ font-size: 12px; color: #94a3b8; margin-top: 32px; border-top: 1px solid #f1f5f9; padding-top: 16px; }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="logo">CourseDesk</div>
            <h1>Your Verification Code</h1>
            <p>Hi {user_name or "there"},</p>
            <p>Welcome to CourseDesk! To verify your email address and activate your learner account, enter this 6-digit code on the registration screen:</p>
            
            <div class="code-box">
                <div class="code">{formatted_code}</div>
                <div class="expiry">Valid for 15 minutes</div>
            </div>

            <div class="security-notice">
                <p style="margin: 0; font-size: 12px; color: #475569;">
                    <strong>Security Notice:</strong> Never share this code with anyone. If you didn't create a CourseDesk account, you can safely ignore this email.
                </p>
            </div>

            <div class="footer">
                <p>© CourseDesk Platform. All rights reserved.</p>
            </div>
        </div>
    </body>
    </html>
    """

    plain_text = f"""Hi {user_name or "there"},

Welcome to CourseDesk!

Your 6-digit verification code is: {otp_code}

This code is valid for 15 minutes. Enter it on the registration screen to complete your account setup.

If you did not sign up for CourseDesk, please ignore this email.
"""

    if settings.RESEND_API_KEY:
        try:
            import resend

            resend.api_key = settings.RESEND_API_KEY
            resend.Emails.send({
                "from": settings.RESEND_FROM or "onboarding@resend.dev",
                "to": to_email,
                "subject": subject,
                "html": html_content,
            })
            logger.info("Verification code sent to %s via Resend API", to_email)
            return True
        except Exception as exc:
            logger.error("Failed to send OTP email via Resend to %s: %s", to_email, exc)

    if settings.SMTP_HOST:
        try:
            msg = EmailMessage()
            msg["Subject"] = subject
            msg["From"] = settings.SMTP_FROM
            msg["To"] = to_email
            msg.set_content(plain_text)
            msg.add_alternative(html_content, subtype="html")

            with smtplib.SMTP(settings.SMTP_PORT == 587 and settings.SMTP_HOST or settings.SMTP_HOST, settings.SMTP_PORT, timeout=10) as server:
                if settings.SMTP_PORT == 587:
                    server.starttls()
                if settings.SMTP_USER and settings.SMTP_PASSWORD:
                    server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
                server.send_message(msg)
            logger.info("Verification code sent to %s via SMTP", to_email)
            return True
        except Exception as exc:
            logger.error("Failed to send OTP email via SMTP to %s: %s", to_email, exc)

    # Development fallback: log prominent banner to console for fast local testing
    print("\n" + "=" * 76)
    print(" [COURSEDESK EMAIL SERVICE] Verification Code (OTP)")
    print(f" To: {to_email}")
    print(f" Verification Code: {otp_code}")
    print(" Validity: 15 minutes")
    print("=" * 76 + "\n", flush=True)

    return True


def send_resend_email(
    to: str,
    subject: str,
    html: str,
    from_email: str | None = None,
) -> dict | None:
    """Send an arbitrary email via Resend.
    
    Returns response dict if sent successfully, or None if failed or API key missing.
    """
    if not settings.RESEND_API_KEY:
        logger.warning("Resend API key not configured")
        return None

    import resend

    resend.api_key = settings.RESEND_API_KEY
    return resend.Emails.send({
        "from": from_email or settings.RESEND_FROM or "onboarding@resend.dev",
        "to": to,
        "subject": subject,
        "html": html,
    })


# Backwards compatibility alias
send_verification_email = send_otp_email

