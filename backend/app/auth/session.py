from jose import jwt, JWTError
from datetime import datetime, timezone, timedelta
from app.config import settings

JWT_ALG = "HS256"
MAX_AGE_SECONDS = 365 * 24 * 60 * 60  # 1 year


def sign_session(payload: dict) -> str:
    now = datetime.now(timezone.utc)
    to_encode = {
        "union_id": payload.get("union_id"),
        "client_id": payload.get("client_id"),
        "iat": now,
        "exp": now + timedelta(seconds=MAX_AGE_SECONDS),
    }
    return jwt.encode(to_encode, settings.app_secret, algorithm=JWT_ALG)


def verify_session(token: str) -> dict | None:
    if not token:
        return None
    try:
        payload = jwt.decode(token, settings.app_secret, algorithms=[JWT_ALG])
        union_id = payload.get("union_id")
        client_id = payload.get("client_id")
        if not union_id or not client_id:
            return None
        return {"union_id": union_id, "client_id": client_id}
    except JWTError:
        return None
