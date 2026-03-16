"""
Centralised email service using Resend.
All email sending goes through this module.
Never raises — logs failures and returns False so callers are never blocked.
"""
from config import settings


# ─── Shared HTML wrapper ────────────────────────────────────────────────────

def _wrap(title: str, body: str) -> str:
    return f"""<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{title}</title>
</head>
<body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;background:#0d0d14;color:#e0e0f0;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0d0d14;padding:40px 20px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#111118;border-radius:16px;border:1px solid rgba(255,255,255,0.07);overflow:hidden;">

        <!-- Header -->
        <tr>
          <td style="padding:32px 40px 24px;background:linear-gradient(135deg,#6d28d9 0%,#a21caf 100%);text-align:center;">
            <p style="margin:0;font-size:11px;font-weight:700;letter-spacing:3px;color:rgba(255,255,255,0.7);text-transform:uppercase;">StoreMyBottle</p>
            <h1 style="margin:8px 0 0;font-size:22px;font-weight:700;color:#fff;">{title}</h1>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="padding:36px 40px;">
            {body}
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="padding:24px 40px;background:rgba(255,255,255,0.03);border-top:1px solid rgba(255,255,255,0.06);text-align:center;">
            <p style="margin:0 0 6px;font-size:12px;color:#6b6b8a;">🍷 Please drink responsibly. For adults 25+ only.</p>
            <p style="margin:0;font-size:11px;color:#4a4a6a;">© 2026 StoreMyBottle · Pune, Maharashtra · support@storemybottle.in</p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>"""


def _btn(text: str, url: str) -> str:
    return f"""<table width="100%" cellpadding="0" cellspacing="0">
  <tr><td align="center" style="padding:24px 0;">
    <a href="{url}" style="display:inline-block;padding:14px 36px;background:linear-gradient(135deg,#6d28d9,#a21caf);color:#fff;text-decoration:none;border-radius:10px;font-size:15px;font-weight:700;letter-spacing:0.3px;">
      {text}
    </a>
  </td></tr>
</table>"""


def _p(text: str, muted: bool = False) -> str:
    color = "#8a8aaa" if muted else "#c0c0d8"
    return f'<p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:{color};">{text}</p>'


def _label(text: str) -> str:
    return f'<p style="margin:0 0 4px;font-size:11px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:#6d28d9;">{text}</p>'


def _value(text: str) -> str:
    return f'<p style="margin:0 0 16px;font-size:16px;font-weight:600;color:#e0e0f0;">{text}</p>'


def _divider() -> str:
    return '<hr style="border:none;border-top:1px solid rgba(255,255,255,0.07);margin:24px 0;">'


# ─── Send helper ────────────────────────────────────────────────────────────

def _send(to: str, subject: str, html: str) -> bool:
    """Send via Resend. Falls back to console in dev. Never raises."""
    if not settings.RESEND_API_KEY:
        print(f"\n📧 [EMAIL — no API key] To: {to} | Subject: {subject}\n")
        return True
    try:
        import resend
        resend.api_key = settings.RESEND_API_KEY
        resp = resend.Emails.send({
            "from": settings.FROM_EMAIL,
            "to": [to],
            "subject": subject,
            "html": html,
        })
        print(f"✅ Email sent to {to} (id={resp.get('id','?')})")
        return True
    except Exception as e:
        print(f"❌ Email failed to {to}: {e}")
        return False


# ─── Email functions ─────────────────────────────────────────────────────────

def send_welcome_email(email: str, user_name: str) -> bool:
    body = (
        _p(f"Hi {user_name}, welcome to StoreMyBottle! 🎉")
        + _p("You can now browse venues, purchase bottles, and redeem pegs whenever you're out. Here's how it works:")
        + f"""<table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 20px;">
  <tr>
    <td style="padding:12px 16px;background:rgba(109,40,217,0.1);border-radius:8px;margin-bottom:8px;">
      <p style="margin:0;font-size:14px;color:#c0c0d8;"><strong style="color:#a78bfa;">1. Buy</strong> — Purchase a bottle at any partner venue.</p>
    </td>
  </tr>
  <tr><td style="height:8px;"></td></tr>
  <tr>
    <td style="padding:12px 16px;background:rgba(109,40,217,0.1);border-radius:8px;">
      <p style="margin:0;font-size:14px;color:#c0c0d8;"><strong style="color:#a78bfa;">2. Store</strong> — We keep it safe at the venue for up to 90 days.</p>
    </td>
  </tr>
  <tr><td style="height:8px;"></td></tr>
  <tr>
    <td style="padding:12px 16px;background:rgba(109,40,217,0.1);border-radius:8px;">
      <p style="margin:0;font-size:14px;color:#c0c0d8;"><strong style="color:#a78bfa;">3. Redeem</strong> — Show your QR code to the bartender and enjoy your peg.</p>
    </td>
  </tr>
</table>"""
        + _btn("Browse Venues", f"{settings.FRONTEND_URL}/")
        + _p("Drink responsibly. 🍷", muted=True)
    )
    return _send(email, "Welcome to StoreMyBottle 🍾", _wrap("Welcome!", body))


def send_password_reset_email(email: str, token: str, user_name: str) -> bool:
    reset_url = f"{settings.FRONTEND_URL}/reset-password?token={token}"
    body = (
        _p(f"Hi {user_name},")
        + _p("We received a request to reset your password. Click the button below — the link expires in <strong>1 hour</strong>.")
        + _btn("Reset Password", reset_url)
        + _divider()
        + _p(f'Or copy this link: <span style="color:#a78bfa;word-break:break-all;">{reset_url}</span>', muted=True)
        + _p("If you didn't request this, you can safely ignore this email.", muted=True)
    )
    return _send(email, "Reset Your Password — StoreMyBottle", _wrap("Reset Your Password", body))


def send_purchase_confirmation_email(
    email: str,
    user_name: str,
    bottle_name: str,
    bottle_brand: str,
    venue_name: str,
    amount: str,
    volume_ml: int,
    expires_at: str,
    purchase_id: str,
) -> bool:
    body = (
        _p(f"Hi {user_name}, your purchase is confirmed! 🎉")
        + _divider()
        + _label("Bottle")
        + _value(f"{bottle_brand} — {bottle_name}")
        + _label("Venue")
        + _value(venue_name)
        + _label("Amount Paid")
        + _value(f"₹{amount}")
        + _label("Volume")
        + _value(f"{volume_ml} ml")
        + _label("Expires On")
        + _value(expires_at)
        + _label("Reference")
        + _value(f"#{purchase_id[:8].upper()}")
        + _divider()
        + _p("Your bottle is stored safely at the venue. Show your QR code to the bartender when you're ready to redeem a peg.")
        + _btn("View My Bottles", f"{settings.FRONTEND_URL}/my-bottles")
    )
    return _send(email, f"Purchase Confirmed — {bottle_brand} {bottle_name}", _wrap("Purchase Confirmed", body))


def send_redemption_receipt_email(
    email: str,
    user_name: str,
    bottle_name: str,
    bottle_brand: str,
    venue_name: str,
    peg_size_ml: int,
    remaining_ml: int,
    redeemed_at: str,
) -> bool:
    body = (
        _p(f"Hi {user_name}, here's your redemption receipt.")
        + _divider()
        + _label("Bottle")
        + _value(f"{bottle_brand} — {bottle_name}")
        + _label("Venue")
        + _value(venue_name)
        + _label("Peg Redeemed")
        + _value(f"{peg_size_ml} ml")
        + _label("Remaining Balance")
        + _value(f"{remaining_ml} ml")
        + _label("Redeemed At")
        + _value(redeemed_at)
        + _divider()
        + (
            _p("Your bottle is now empty. Visit any partner venue to purchase a new one.", muted=True)
            if remaining_ml == 0
            else _p(f"You still have <strong style='color:#a78bfa;'>{remaining_ml} ml</strong> remaining. Enjoy!", muted=True)
        )
        + _btn("View My Bottles", f"{settings.FRONTEND_URL}/my-bottles")
    )
    return _send(email, f"Peg Redeemed — {bottle_brand} {bottle_name}", _wrap("Redemption Receipt", body))


def send_expiry_warning_email(
    email: str,
    user_name: str,
    bottles: list,  # list of dicts: {brand, name, venue_name, remaining_ml, expires_at, days_left}
    days_left: int,
) -> bool:
    urgency = "⚠️ Urgent:" if days_left <= 1 else "Reminder:"
    subject = f"{urgency} Your bottle{'s' if len(bottles) > 1 else ''} expire{'s' if len(bottles) == 1 else ''} in {days_left} day{'s' if days_left != 1 else ''}"

    rows = ""
    for b in bottles:
        rows += f"""<tr>
  <td style="padding:14px 16px;border-bottom:1px solid rgba(255,255,255,0.05);">
    <p style="margin:0 0 2px;font-size:15px;font-weight:600;color:#e0e0f0;">{b['brand']} — {b['name']}</p>
    <p style="margin:0;font-size:13px;color:#8a8aaa;">{b['venue_name']} · {b['remaining_ml']} ml remaining · Expires {b['expires_at']}</p>
  </td>
</tr>"""

    color = "#ef4444" if days_left <= 1 else "#f59e0b"
    body = (
        _p(f"Hi {user_name},")
        + f'<p style="margin:0 0 20px;font-size:15px;line-height:1.7;color:{color};font-weight:600;">Your stored bottle{"s" if len(bottles) > 1 else ""} will expire in <strong>{days_left} day{"s" if days_left != 1 else ""}</strong>. Redeem before they\'re gone!</p>'
        + f'<table width="100%" cellpadding="0" cellspacing="0" style="background:rgba(255,255,255,0.03);border-radius:10px;border:1px solid rgba(255,255,255,0.07);margin-bottom:24px;">{rows}</table>'
        + _btn("Redeem Now", f"{settings.FRONTEND_URL}/my-bottles")
        + _p("Unredeemed bottles are forfeited after expiry.", muted=True)
    )
    return _send(email, subject, _wrap("Bottle Expiry Reminder", body))
