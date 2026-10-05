import logging
import smtplib
from email.message import EmailMessage

from app.utils.settings import settings

logger = logging.getLogger("coursedesk.email")


def send_verification_email(to_email: str, user_name: str, verification_link: str) -> bool:
    """Dispatches an email verification link to the user.

    If SMTP is configured via settings, sends real email via SMTP.
    Otherwise, logs the verification link clearly to the application console.
    """
    subject = "Verify your email address for CourseDesk"
    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <style>
            body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; color: #1e293b; margin: 0; padding: 24px; }}
            .container {{ max-width: 540px; margin: 0 auto; background: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; padding: 36px 32px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); }}
            .logo {{ font-size: 20px; font-weight: 700; color: #1a73e8; margin-bottom: 24px; }}
            h1 {{ font-size: 22px; font-weight: 700; color: #0f172a; margin-top: 0; margin-bottom: 12px; }}
            p {{ font-size: 14px; line-height: 1.6; color: #475569; margin: 12px 0; }}
            .btn {{ display: inline-block; background-color: #1a73e8; color: #ffffff !important; text-decoration: none; font-size: 14px; font-weight: 600; padding: 12px 28px; border-radius: 10px; margin: 24px 0; text-align: center; }}
            .footer {{ font-size: 12px; color: #94a3b8; margin-top: 32px; border-top: 1px solid #f1f5f9; pt: 16px; }}
            .link-text {{ word-break: break-all; color: #64748b; font-size: 12px; }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="logo">CourseDesk</div>
            <h1>Confirm your email address</h1>
            <p>Hi {user_name or "there"},</p>
            <p>Thank you for signing up for CourseDesk. Please confirm your email address by clicking the button below to activate your learner account:</p>
            <div style="text-align: center;">
                <a href="{verification_link}" class="btn">Verify Email Address</a>
            </div>
            <p>This verification link will expire in 24 hours.</p>
            <p>If you didn't create an account with CourseDesk, you can safely ignore this email.</p>
            <div class="footer">
                <p>If the button doesn't work, copy and paste this link into your browser:</p>
                <p class="link-text">{verification_link}</p>
            </div>
        </div>
    </body>
    </html>
    """

    plain_text = f"""Hi {user_name or "there"},

Thank you for signing up for CourseDesk. Please verify your email address by visiting the link below:

{verification_link}

This link is valid for 24 hours.

If you did not sign up for CourseDesk, please ignore this email.
"""

    if settings.SMTP_HOST:
        try:
            msg = EmailMessage()
            msg["Subject"] = subject
            msg["From"] = settings.SMTP_FROM
            msg["To"] = to_email
            msg.set_content(plain_text)
            msg.add_alternative(html_content, subtype="html")

            with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT, timeout=10) as server:
                if settings.SMTP_PORT == 587:
                    server.starttls()
                if settings.SMTP_USER and settings.SMTP_PASSWORD:
                    server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
                server.send_message(msg)
            logger.info("Verification email sent to %s via SMTP", to_email)
            return True
        except Exception as exc:
            logger.error("Failed to send verification email via SMTP to %s: %s", to_email, exc)

    # Development fallback: log banner to console so developer/tester can access it immediately
    print("\n" + "=" * 76)
    print(" [COURSEDESK EMAIL SERVICE] Verification Email Dispatched")
    print(f" To: {to_email}")
    print(f" Subject: {subject}")
    print(f" Verification Link: {verification_link}")
    print(" Link Validity: 24 hours")
    print("=" * 76 + "\n", flush=True)

    return True
