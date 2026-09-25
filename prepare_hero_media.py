"""Build the selected ENUMA homepage hero clips from untouched source footage."""

from __future__ import annotations

import argparse
import json
import shutil
import subprocess
from pathlib import Path


SITE = Path(__file__).resolve().parent
WORKSPACE = SITE.parent
ASSETS = SITE / "assets"
EDIT = WORKSPACE / "video demo/edit/hero_site_sequence"
FFMPEG = Path("/Users/bytedance/Library/Python/3.9/lib/python/site-packages/imageio_ffmpeg/binaries/ffmpeg-macos-aarch64-v7.1")
if not FFMPEG.exists():
    FFMPEG = Path(shutil.which("ffmpeg") or "ffmpeg")


def run(*args: object) -> None:
    subprocess.run([str(FFMPEG), "-hide_banner", "-loglevel", "error", "-y", *map(str, args)], check=True)


def publish(name: str, source: Path, *, frames: int | None = None, poster_frame: int = 80) -> None:
    video = EDIT / f"{name}.mp4"
    poster = EDIT / f"{name}.jpg"
    command: list[object] = ["-i", source, "-an", "-vf", "scale=960:-2:flags=lanczos"]
    if frames is not None:
        command += ["-frames:v", frames]
    command += ["-c:v", "libx264", "-preset", "medium", "-crf", "22", "-pix_fmt", "yuv420p", "-movflags", "+faststart", video]
    run(*command)
    run("-i", source, "-vf", f"select=eq(n\\,{poster_frame}),scale=960:-2:flags=lanczos", "-frames:v", 1, "-q:v", 2, poster)
    shutil.copy2(video, ASSETS / video.name)
    shutil.copy2(poster, ASSETS / poster.name)


def publish_teaser(final: str) -> tuple[str, Path, int]:
    name = f"hero-teaser-{final}"
    if final == "mosaic":
        source = WORKSPACE / "video demo/edit/animations/slot_enuma_teaser_stonelion_motion_v1/render.mp4"
        end = 120
        poster_source = WORKSPACE / "video demo/edit/animations/slot_enuma_teaser_stonelion_motion_v1/frame_119.png"
    else:
        source = WORKSPACE / "video demo/edit/enuma_teaser_title_bridge_v1/enuma_teaser_title_bridge_v1_stable.mp4"
        end = 240
        poster_source = WORKSPACE / "video demo/edit/animations/slot_enuma_teaser_title_bridge_v1/phase_239.png"
    video = EDIT / f"{name}.mp4"
    poster = EDIT / f"{name}.jpg"
    run("-i", source, "-an", "-vf", f"trim=start_frame=66:end_frame={end},setpts=PTS-STARTPTS,scale=1280:-2:flags=lanczos",
        "-c:v", "libx264", "-preset", "medium", "-crf", "21", "-pix_fmt", "yuv420p", "-movflags", "+faststart", video)
    run("-i", poster_source, "-frames:v", 1, "-vf", "scale=1280:-2:flags=lanczos", "-q:v", 2, poster)
    shutil.copy2(video, ASSETS / video.name)
    shutil.copy2(poster, ASSETS / poster.name)
    return name, source, end


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--final", choices=("mosaic", "title"), default="mosaic")
    args = parser.parse_args()
    EDIT.mkdir(parents=True, exist_ok=True)
    ASSETS.mkdir(parents=True, exist_ok=True)
    sources = [
        ("hero-autumn", "knight_autumn_celestial.mp4", None, 80),
        ("hero-tree", "knight_tree_kindom.mp4", None, 80),
        ("hero-mingjie", "knight_event_mingjie.mp4", None, 80),
        ("hero-zigurat", "knight_event_zigurat.mp4", None, 80),
        ("hero-stonelion", "knight_event_stonelion.mp4", 80, 79),
    ]
    for name, filename, frames, poster_frame in sources:
        publish(name, WORKSPACE / "video demo" / filename, frames=frames, poster_frame=poster_frame)
    teaser, teaser_source, teaser_end = publish_teaser(args.final)
    manifest_path = SITE / "media-manifest.json"
    manifest = json.loads(manifest_path.read_text())
    generated = {name for name, *_ in sources} | {teaser}
    manifest = [entry for entry in manifest if entry.get("asset") not in generated]
    manifest.extend(
        {"asset": name, "bytes": (ASSETS / f"{name}.mp4").stat().st_size, "source": f"video demo/{filename}"}
        for name, filename, *_ in sources
    )
    manifest.append({"asset": teaser, "bytes": (ASSETS / f"{teaser}.mp4").stat().st_size,
                     "source": str(teaser_source.relative_to(WORKSPACE)), "frames": f"66-{teaser_end - 1}"})
    manifest_path.write_text(json.dumps(manifest, indent=2) + "\n")
    print(f"Built five selected knight clips and {teaser} in {ASSETS}")


if __name__ == "__main__":
    main()
