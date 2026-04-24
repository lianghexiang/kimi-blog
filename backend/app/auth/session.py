from jose import jwt, JWTError
from datetime import datetime, timezone, timedelta
from app.config import settings

JWT_ALG = "HS256"
MAX_AGE_SECONDS = 365 * 24 * 60 * 60  # 1 year


def sign_session(user_id: int) -> str:
    now = datetime.now(timezone.utc)
    to_encode = {
        "user_id": user_id,
        "iat": now,
        "exp": now + timedelta(seconds=MAX_AGE_SECONDS),
    }
    return jwt.encode(to_encode, settings.app_secret, algorithm=JWT_ALG)


def verify_session(token: str) -> dict | None:
    if not token:
        return None
    try:
        payload = jwt.decode(token, settings.app_secret, algorithms=[JWT_ALG])
        user_id = payload.get("user_id")
        if not user_id:
            return None
        return {"user_id": user_id}
    except JWTError:
        return None
