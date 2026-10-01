import json
from urllib.request import Request, urlopen
from django.conf import settings
from django.core.mail.backends.base import BaseEmailBackend

class ResendBackend(BaseEmailBackend):
    """Optional HTTPS email delivery for hosts that block SMTP."""
    def send_messages(self, email_messages):
        sent = 0
        for message in email_messages:
            try:
                if not settings.RESEND_API_KEY:
                    raise ValueError("Configure RESEND_API_KEY")
                request = Request(
                    "https://api.resend.com/emails",
                    data=json.dumps({"from": message.from_email, "to": message.to,
                                     "subject": message.subject, "text": message.body}).encode(),
                    headers={"Authorization": "Bearer " + settings.RESEND_API_KEY,
                             "Content-Type": "application/json", "User-Agent": "NeuroLift/1.0"},
                    method="POST",
                )
                with urlopen(request, timeout=10) as response:
                    if response.status not in (200, 201, 202):
                        raise OSError("Email provider rejected the message")
                sent += 1
            except Exception:
                if not self.fail_silently:
                    raise
        return sent
