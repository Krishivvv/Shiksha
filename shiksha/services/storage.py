"""Artifact storage abstraction.

Generated videos and PDFs are written to the local filesystem by the pipeline.
In production we additionally push them to object storage (S3 / Cloudflare R2)
so artifacts survive instance restarts and can be served from many workers /
the CDN edge instead of the origin's local disk.

Backend is chosen with STORAGE_BACKEND=local|s3. When ``s3`` is configured the
download endpoints redirect to short-lived presigned URLs.
"""

import logging
import mimetypes
import os

from shiksha import config

logger = logging.getLogger(__name__)

_s3_client = None


def is_s3() -> bool:
    return config.STORAGE_BACKEND == "s3" and bool(config.S3_BUCKET)


def _client():
    global _s3_client
    if _s3_client is None:
        import boto3  # imported lazily so the dep is optional for local dev
        _s3_client = boto3.client(
            "s3",
            endpoint_url=config.S3_ENDPOINT_URL,
            region_name=config.S3_REGION,
            aws_access_key_id=config.AWS_ACCESS_KEY_ID,
            aws_secret_access_key=config.AWS_SECRET_ACCESS_KEY,
        )
    return _s3_client


def save_file(local_path: str, key: str) -> str:
    """Persist a freshly generated local file to the configured backend.

    For the local backend this is a no-op (the file already lives on disk).
    Returns the storage key.
    """
    if is_s3():
        content_type = mimetypes.guess_type(key)[0] or "application/octet-stream"
        _client().upload_file(
            local_path, config.S3_BUCKET, key, ExtraArgs={"ContentType": content_type}
        )
        logger.info("Uploaded %s -> s3://%s/%s", local_path, config.S3_BUCKET, key)
    return key


def exists(key: str, local_path: str) -> bool:
    if is_s3():
        try:
            _client().head_object(Bucket=config.S3_BUCKET, Key=key)
            return True
        except Exception:
            return False
    return os.path.exists(local_path)


def presigned_url(key: str, download_name: str | None = None, expires: int = 3600) -> str:
    params = {"Bucket": config.S3_BUCKET, "Key": key}
    if download_name:
        params["ResponseContentDisposition"] = f'attachment; filename="{download_name}"'
    return _client().generate_presigned_url("get_object", Params=params, ExpiresIn=expires)
