import logging
import os
from typing import Optional
from app.config import settings

logger = logging.getLogger("S3Storage")

class S3StorageService:
    """
    AWS S3 / Supabase Bucket Object Storage Manager.
    Uploads inspection images & defect cropped snippets asynchronously.
    """
    def __init__(self):
        self.bucket_name = settings.S3_BUCKET_NAME
        self.client = None
        self._init_s3()

    def _init_s3(self):
        try:
            import boto3
            self.client = boto3.client(
                's3',
                aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
                aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
                region_name=settings.AWS_REGION
            )
            logger.info("Initialized S3 Storage client")
        except Exception as e:
            logger.warning(f"S3 Client initialization skipped / mock mode: {e}")

    def upload_bytes(self, file_bytes: bytes, destination_key: str, content_type: str = "image/jpeg") -> Optional[str]:
        """
        Uploads raw frame bytes to Cloud Storage bucket.
        Returns public URL or mock URL string.
        """
        if self.client is None or settings.AWS_ACCESS_KEY_ID == "mock_key":
            # Return local static URL fallback for mock / edge operational environment
            return f"/static/images/{os.path.basename(destination_key)}"

        try:
            self.client.put_object(
                Bucket=self.bucket_name,
                Key=destination_key,
                Body=file_bytes,
                ContentType=content_type
            )
            url = f"https://{self.bucket_name}.s3.{settings.AWS_REGION}.amazonaws.com/{destination_key}"
            return url
        except Exception as e:
            logger.error(f"Failed to upload {destination_key} to S3: {e}")
            return f"/static/images/{os.path.basename(destination_key)}"

s3_storage = S3StorageService()
