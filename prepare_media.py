"""Prepare local showcase media; source videos and interactive case masters stay untouched."""

from __future__ import annotations

import json
import shutil
import subprocess
from pathlib import Path


ROOT = Path(__file__).resolve().parent
WORKSPACE = ROOT.parent
DIST = ROOT
ASSETS = DIST / "assets"
FFMPEG = Path("/Users/bytedance/Library/Python/3.9/lib/python/site-packages/imageio_ffmpeg/binaries/ffmpeg-macos-aarch64-v7.1")
if not FFMPEG.exists():
    FFMPEG = Path(shutil.which("ffmpeg") or "ffmpeg")


def run(*args: object) -> None:
    subprocess.run([str(FFMPEG), "-hide_banner", "-loglevel", "error", "-y", *map(str, args)], check=True)


def encode(source: Path, name: str, *, start: float = 0, duration: float | None = None,
           poster_at: float = 6.5, fps: int = 16) -> None:
    output = ASSETS / f"{name}.mp4"
    args: list[object] = []
    if start:
        args += ["-ss", start]
    args += ["-i", source]
    if duration is not None:
        args += ["-t", duration]
    args += ["-vf", f"scale=960:-2:flags=lanczos,fps={fps}", "-an", "-c:v", "libx264",
             "-preset", "medium", "-crf", "22", "-pix_fmt", "yuv420p",
             "-movflags", "+faststart", output]
    run(*args)
    run("-ss", poster_at, "-i", source, "-frames:v", "1", "-vf",
        "scale=960:-2:flags=lanczos", "-q:v", "2", ASSETS / f"{name}.jpg")


def main() -> None:
    ASSETS.mkdir(parents=True, exist_ok=True)
    sources = [
        ("ice-lava", WORKSPACE / "text event/ice_to_lava.mp4", 0, None, 6.6, 16),
        ("palace-neon", WORKSPACE / "text event/palace_to_cyberpunk.mp4", 0, None, 6.5, 16),
        ("road-sandstorm", WORKSPACE / "text event/road_sandstorm.mp4", 0, None, 5.5, 16),
        ("phoenix", WORKSPACE / "video demo/knight_event_phoenix.mp4", 0, None, 6.5, 16),
        ("spacecraft", WORKSPACE / "video demo/knight_event_spacecraft.mp4", 0, None, 6.5, 16),
        ("portal-preview", WORKSPACE / "video_tobe_concated/obsidian_portal/edit/final.mp4", 24.2, 6.6, 29, 24),
        ("dragon-preview", WORKSPACE / "video_tobe_concated/sword_chain_drawbridge/edit/final.mp4", 25.5, 6.65, 31, 16),
        ("magic-fireball-preview", WORKSPACE / "video_tobe_concated/magic_fireball_brazier/edit/final.mp4", 11, 6.5, 14.5, 16),
        ("car-wash-preview", WORKSPACE / "video_tobe_concated/car_wash/edit/final.mp4", 9, 6.5, 13, 16),
        ("street-preview", WORKSPACE / "video_tobe_concated/residential_street/edit/final.mp4", 18, 6.1, 23.5, 16),
    ]
    for name, path, start, duration, poster_at, fps in sources:
        encode(path, name, start=start, duration=duration, poster_at=poster_at, fps=fps)
    interactive = DIST / "interactive"
    interactive_sources = [
        ("obsidian-portal", WORKSPACE / "video_tobe_concated/obsidian_portal/edit/interactive", "obsidian-portal"),
        ("drawbridge-dragon", WORKSPACE / "video_tobe_concated/sword_chain_drawbridge/edit/interactive", "drawbridge-dragon"),
        ("magic-fireball-brazier", WORKSPACE / "video_tobe_concated/magic_fireball_brazier/edit/interactive", "magic-fireball-brazier"),
        ("car-wash", WORKSPACE / "video_tobe_concated/car_wash/edit/interactive", "car-wash"),
        ("residential-street", WORKSPACE / "video_tobe_concated/residential_street/edit/interactive", "residential-street"),
    ]
    # Keep the turn timing and 720p frames, while capping unusually high bitrates
    # in the web copies. Original interactive masters remain in their edit folders.
    interactive_web_encodes = {
        "magic-fireball-brazier": (21, "6000k"),
        "residential-street": (18, "12000k"),
    }
    for slug, source, _ in interactive_sources:
        shutil.copytree(source, interactive / slug, dirs_exist_ok=True)
        if slug in interactive_web_encodes:
            crf, maxrate = interactive_web_encodes[slug]
            output = interactive / slug / "assets" / f"{slug}.mp4"
            encoded = output.with_name(f"{slug}-web.mp4")
            run("-i", source / "assets" / f"{slug}.mp4", "-an", "-c:v", "libx264",
                "-preset", "medium", "-crf", crf, "-maxrate", maxrate,
                "-bufsize", f"{int(maxrate[:-1]) * 2}k", "-g", 32,
                "-keyint_min", 16, "-sc_threshold", 0, "-pix_fmt", "yuv420p",
                "-movflags", "+faststart", encoded)
            encoded.replace(output)
        page = interactive / slug / "index.html"
        page.write_text(page.read_text().replace('preload="auto"', 'preload="metadata"').replace(
            '<span class="brand">ENUMA<span class="brand-dot">.</span></span>',
            '<a class="brand" href="../../" aria-label="Back to ENUMA">ENUMA<span class="brand-dot">.</span></a>',
        ))
        style = interactive / slug / "styles.css"
        brand_link_style = ".brand { color: inherit; text-decoration: none; }"
        if brand_link_style not in style.read_text():
            style.write_text(style.read_text() + f"\n{brand_link_style}\n")
    manifest = json.loads((ROOT / "media-manifest.json").read_text())
    generated = {name for name, *_ in sources} | {f"interactive/{slug}" for slug, _, _ in interactive_sources}
    manifest = [entry for entry in manifest if entry.get("asset") not in generated]
    manifest.extend({"asset": name, "bytes": (ASSETS / f"{name}.mp4").stat().st_size,
                     "source": str(path.relative_to(WORKSPACE))}
                    for name, path, *_ in sources)
    for slug, source, asset in interactive_sources:
        record = {"asset": f"interactive/{slug}",
                  "bytes": (interactive / slug / "assets" / f"{asset}.mp4").stat().st_size,
                  "source": str(source.relative_to(WORKSPACE)) + "/"}
        if slug in interactive_web_encodes:
            record["web_encoding"] = "720p H.264 faststart; original timing retained"
        manifest.append(record)
    (ROOT / "media-manifest.json").write_text(json.dumps(manifest, indent=2) + "\n")


if __name__ == "__main__":
    main()
