"""
Cloudflare R2 storage, via boto3's S3-compatible client.

Used by the project-files upload endpoint. Returns signed, time-limited
URLs — never permanent public links — per the OpenAPI spec's ProjectFile
schema description.
"""
import uuid

import boto3
from botocore.config import Config

from app.core.config import get_settings

settings = get_settings()


def _client():
    return boto3.client(
        "s3",
        endpoint_url=f"https://{settings.r2_account_id}.r2.cloudflarestorage.com",
        aws_access_key_id=settings.r2_access_key_id,
        aws_secret_access_key=settings.r2_secret_access_key,
        config=Config(signature_version="s3v4"),
        region_name="auto",
    )


async def upload_file(file_bytes: bytes, filename: str, content_type: str) -> str:
    """Uploads a file and returns a signed, time-limited GET URL (1 hour)."""
    key = f"{uuid.uuid4()}-{filename}"
    client = _client()
    client.put_object(
        Bucket=settings.r2_bucket_name,
        Key=key,
        Body=file_bytes,
        ContentType=content_type,
    )
    url = client.generate_presigned_url(
        "get_object",
        Params={"Bucket": settings.r2_bucket_name, "Key": key},
        ExpiresIn=3600,
    )
    return url
