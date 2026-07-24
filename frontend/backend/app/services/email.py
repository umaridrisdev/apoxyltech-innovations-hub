"""
Transactional email sending, via Resend's HTTP API.

Originally used raw SMTP, but managed hosts like Railway (and Render,
Heroku) commonly block outbound SMTP ports (25/465/587) by default to
prevent their platform being used for spam relay — see the
"Network is unreachable" error this produced in production. Resend's API
is a plain HTTPS POST (port 443), which isn't subject to that block.

Falls back to console logging if RESEND_API_KEY isn't set, so local dev
without any email provider configured still works exactly as before.
"""
import httpx

from app.core.config import get_settings

settings = get_settings()

RESEND_API_URL = "https://api.resend.com/emails"


def _send(to: str, subject: str, body: str) -> None:
    if not settings.resend_api_key:
        # No provider configured (local dev, or not yet set up): log instead
        # of failing, exactly as before.
        print(f"[email:dev-noop] to={to} subject={subject!r}\n{body}")
        return

    try:
        response = httpx.post(
            RESEND_API_URL,
            headers={"Authorization": f"Bearer {settings.resend_api_key}"},
            json={
                "from": settings.email_from_address,
                "to": [to],
                "subject": subject,
                "text": body,
            },
            timeout=10.0,
        )
        response.raise_for_status()
    except httpx.HTTPError as exc:
        # Don't let a transactional-email failure break the calling request
        # (e.g. registration should still succeed even if the verification
        # email bounces) — log it server-side instead.
        print(f"[email:send-failed] to={to} subject={subject!r} error={exc}")


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