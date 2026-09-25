"""Prepare the full ENUMA film and the shared cow decision shot for the site."""

from __future__ import annotations

import json
import shutil
import subprocess
from pathlib import Path


SITE = Path(__file__).resolve().parent
WORKSPACE = SITE.parent
ASSETS = SITE / "assets"
EDIT = WORKSPACE / "video demo/edit/site_feature_media"
FFMPEG = Path("/Users/bytedance/Library/Python/3.9/lib/python/site-packages/imageio_ffmpeg/binaries/ffmpeg-macos-aarch64-v7.1")
if not FFMPEG.exists():
    FFMPEG = Path(shutil.which("ffmpeg") or "ffmpeg")


def run(*args: object) -> None:
    subprocess.run([str(FFMPEG), "-hide_banner", "-loglevel", "error", "-y", *map(str, args)], check=True)


def main() -> None:
    ASSETS.mkdir(parents=True, exist_ok=True)
    EDIT.mkdir(parents=True, exist_ok=True)
    film_source = WORKSPACE / "video demo/edit/enuma_demo_current_v6/enuma_demo_current_v6_stable.mp4"
    cow_source = WORKSPACE / "video demo/doll_cow_event.mp4"

    film = EDIT / "enuma-demo.mp4"
    run("-i", film_source, "-an", "-vf", "scale=1280:720:flags=lanczos", "-c:v", "libx264",
        "-preset", "medium", "-crf", "24", "-pix_fmt", "yuv420p", "-movflags", "+faststart", film)
    poster = EDIT / "enuma-demo.jpg"
    run("-i", WORKSPACE / "video demo/edit/enuma_front_opener_v1/cover.png", "-frames:v", 1,
        "-vf", "scale=1280:720:flags=lanczos", "-q:v", 2, poster)

    cow = EDIT / "cow-event.mp4"
    run("-i", cow_source, "-an", "-vf", "scale=1248:720:flags=lanczos", "-c:v", "libx264",
        "-preset", "medium", "-crf", "22", "-pix_fmt", "yuv420p", "-movflags", "+faststart", cow)
    for frame, name in ((0, "cow-start.jpg"), (100, "cow-event.jpg"), (128, "cow-decision.jpg")):
        run("-i", cow_source, "-vf", f"select=eq(n\\,{frame}),scale=1248:720:flags=lanczos",
            "-frames:v", 1, "-q:v", 2, EDIT / name)

    for name in ("enuma-demo.mp4", "enuma-demo.jpg", "cow-event.mp4", "cow-start.jpg", "cow-event.jpg", "cow-decision.jpg"):
        shutil.copy2(EDIT / name, ASSETS / name)

    manifest_path = SITE / "media-manifest.json"
    manifest = json.loads(manifest_path.read_text())
    manifest = [item for item in manifest if item.get("asset") not in {"enuma-demo", "cow-event"}]
    manifest.extend([
        {"asset": "enuma-demo", "bytes": film.stat().st_size, "source": str(film_source.relative_to(WORKSPACE))},
        {"asset": "cow-event", "bytes": cow.stat().st_size, "source": str(cow_source.relative_to(WORKSPACE))},
    ])
    manifest_path.write_text(json.dumps(manifest, indent=2) + "\n")
    print(f"Prepared {film.stat().st_size / 1_000_000:.1f} MB film and {cow.stat().st_size / 1_000_000:.1f} MB cow event")


if __name__ == "__main__":
    main()
