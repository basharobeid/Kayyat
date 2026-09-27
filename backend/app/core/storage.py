"""Media storage behind a small interface so S3/R2/MinIO can replace local disk later."""

import uuid
from datetime import UTC, datetime
from pathlib import Path
from typing import Protocol

from app.core.config import settings
from app.core.exceptions import ProblemError

# Identify images by their magic bytes, never by the client-supplied name or content type.
_SIGNATURES: list[tuple[bytes, int, str]] = [
    (b"\xff\xd8\xff", 0, "jpg"),
    (b"\x89PNG\r\n\x1a\n", 0, "png"),
    (b"WEBP", 8, "webp"),  # "RIFF....WEBP"
]


def detect_image_type(data: bytes) -> str | None:
    for signature, offset, ext in _SIGNATURES:
        if data[offset:offset + len(signature)] == signature:
            if ext == "webp" and not data.startswith(b"RIFF"):
                continue
            return ext
    return None


class Storage(Protocol):
    def save(self, data: bytes, ext: str) -> str:
        """Persist bytes and return a public URL."""
        ...


class LocalStorage:
    def __init__(self, root: str, base_url: str):
        self.root = Path(root)
        self.base_url = base_url.rstrip("/")

    def save(self, data: bytes, ext: str) -> str:
        now = datetime.now(UTC)
        relative = Path(f"{now:%Y}", f"{now:%m}", f"{uuid.uuid4().hex}.{ext}")
        target = self.root / relative
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_bytes(data)
        return f"{self.base_url}/{relative.as_posix()}"


storage: Storage = LocalStorage(settings.media_dir, settings.media_base_url)


def store_image(data: bytes) -> str:
    if len(data) > settings.max_upload_bytes:
        raise ProblemError(413, "File Too Large",
                           f"Images must be under {settings.max_upload_bytes // (1024 * 1024)} MB",
                           type_="file-too-large")
    ext = detect_image_type(data)
    if ext is None:
        raise ProblemError(415, "Unsupported Media Type", "Upload a JPEG, PNG or WebP image",
                           type_="unsupported-media-type")
    return storage.save(data, ext)


def is_own_media_url(url: str) -> bool:
    return url.startswith(settings.media_base_url.rstrip("/") + "/")
