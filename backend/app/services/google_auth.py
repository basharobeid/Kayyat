"""Google Sign-In: verify the ID token the browser received from Google Identity Services.

The browser never sends us a Google password, only a short-lived ID token that Google
signed. We check its signature, issuer, expiry and audience (our client ID) before trusting
the email inside it.
"""

from app.core.config import settings
from app.core.exceptions import ProblemError, Unauthorized


def verify_id_token(token: str) -> dict:
    if not settings.google_client_id:
        raise ProblemError(503, "Service Unavailable", "Google sign-in is not configured",
                           type_="google-not-configured")
    # Imported lazily so the app starts without these packages when Google is off.
    from google.auth.transport import requests as google_requests
    from google.oauth2 import id_token

    try:
        claims = id_token.verify_oauth2_token(
            token, google_requests.Request(), audience=settings.google_client_id
        )
    except ValueError as exc:
        raise Unauthorized("Google sign-in failed, please try again") from exc
    if claims.get("iss") not in ("accounts.google.com", "https://accounts.google.com"):
        raise Unauthorized("Google sign-in failed, please try again")
    if not claims.get("email") or not claims.get("email_verified"):
        raise Unauthorized("Your Google account email is not verified")
    return claims
