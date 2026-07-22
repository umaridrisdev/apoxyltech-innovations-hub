"""
Transactional email sending.

Kept as a thin, swappable module (per the MVP spec's "don't stand up
infra you're not using yet" principle) — start with SMTP directly; swap in
a provider SDK (Postmark, SES, Resend, etc.) later without touching callers.
"""
import smtplib
from email.message import EmailMessage

from app.core.config import get_settings

settings = get_settings()


def _send(to: str, subject: str, body: str) -> None:
    if not settings.smtp_host:
        # Local dev without SMTP configured: log instead of failing.
        print(f"[email:dev-noop] to={to} subject={subject!r}\n{body}")
        return

    msg = EmailMessage()
    msg["From"] = settings.email_from_address
    msg["To"] = to
    msg["Subject"] = subject
    msg.set_content(body)

    with smtplib.SMTP(settings.smtp_host, settings.smtp_port) as server:
        server.starttls()
        server.login(settings.smtp_user, settings.smtp_password)
        server.send_message(msg)


def send_verification_email(to: str, token: str) -> None:
    _send(
        to,
        "Verify your ApoxylTech account",
        f"Verify your email using this token: {token}\n\n"
        "This token is single-use and expires in 24 hours.",
    )


def send_password_reset_email(to: str, token: str) -> None:
    _send(
        to,
        "Reset your ApoxylTech password",
        f"Reset your password using this token: {token}\n\n"
        "This token is single-use and expires in 1 hour. "
        "If you didn't request this, you can ignore this email.",
    )


def send_lead_notification_email(admin_to: str, lead_name: str, lead_email: str, message: str) -> None:
    _send(
        admin_to,
        f"New contact form lead: {lead_name}",
        f"From: {lead_name} <{lead_email}>\n\n{message}",
    )
