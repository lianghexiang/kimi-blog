import json
from io import BytesIO

from minio import Minio
from minio.error import S3Error

from app.config import settings


def _build_client() -> Minio:
    return Minio(
        settings.minio_endpoint,
        access_key=settings.minio_access_key,
        secret_key=settings.minio_secret_key,
        secure=settings.minio_secure,
    )


def _ensure_bucket(client: Minio) -> None:
    if not client.bucket_exists(settings.minio_bucket):
        client.make_bucket(settings.minio_bucket)
        # 允许公开读取，便于图片直接通过 URL 访问
        policy = {
            "Version": "2012-10-17",
            "Statement": [
                {
                    "Effect": "Allow",
                    "Principal": {"AWS": "*"},
                    "Action": ["s3:GetObject"],
                    "Resource": [f"arn:aws:s3:::{settings.minio_bucket}/*"],
                }
            ],
        }
        client.set_bucket_policy(settings.minio_bucket, json.dumps(policy))


def _object_url(object_name: str) -> str:
    if settings.minio_public_url:
        base = settings.minio_public_url.rstrip("/")
        return f"{base}/{settings.minio_bucket}/{object_name}"

    protocol = "https" if settings.minio_secure else "http"
    endpoint = settings.minio_endpoint.rstrip("/")
    return f"{protocol}://{endpoint}/{settings.minio_bucket}/{object_name}"


def put_object(object_name: str, data: bytes, content_type: str = "application/octet-stream") -> str:
    """上传对象到 MinIO，返回可公开访问的 URL。"""
    client = _build_client()
    _ensure_bucket(client)
    client.put_object(
        settings.minio_bucket,
        object_name,
        data=BytesIO(data),
        length=len(data),
        content_type=content_type,
    )
    return _object_url(object_name)


def get_object(object_name: str) -> bytes:
    """从 MinIO 读取对象内容。"""
    client = _build_client()
    try:
        response = client.get_object(settings.minio_bucket, object_name)
        return response.read()
    finally:
        response.close()
        response.release_conn()


def remove_object(object_name: str) -> None:
    """从 MinIO 删除对象（不存在时不报错）。"""
    client = _build_client()
    try:
        client.remove_object(settings.minio_bucket, object_name)
    except S3Error as err:
        if err.code != "NoSuchKey":
            raise


def object_name_from_url(url: str) -> str | None:
    """从 MinIO 公开 URL 中解析 object_name。"""
    prefix = f"/{settings.minio_bucket}/"
    if prefix in url:
        return url.split(prefix, 1)[1]
    return None
