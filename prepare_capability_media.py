"""Make web-sized copies for the five capability sections; source media stays untouched."""

from __future__ import annotations

import json
import shutil
import subprocess
from pathlib import Path

from PIL import Image, ImageOps


SITE = Path(__file__).resolve().parent
WORKSPACE = SITE.parent
ASSETS = SITE / "dist/assets"
FFMPEG = Path("/Users/bytedance/Library/Python/3.9/lib/python/site-packages/imageio_ffmpeg/binaries/ffmpeg-macos-aarch64-v7.1")
if not FFMPEG.exists():
    FFMPEG = Path(shutil.which("ffmpeg") or "ffmpeg")

REF2VID_8S = ("01", "02", "05", "07", "08", "15", "16", "19")
REF_EVENT_8S = ("01", "03", "06", "07", "09")
REF_EVENT_NEW = ("new-01", "new-02", "new-03")
REF_EVENT_ASSETS = tuple(f"refevent-{n}" for n in (*REF_EVENT_NEW, *REF_EVENT_8S))
NEW_REF_EVENT_ASSETS = tuple(f"refevent-{n}" for n in REF_EVENT_NEW)
NEW_REF_EVENT_ORIGINALS = {
    f"refevent-{n}": (f"RefEvent/new case/ref_video_{int(n[-2:])}-ezremove.mp4"
                         if n == "new-01" else f"RefEvent/new case/ref_video_{int(n[-2:])}-ez.mp4")
    for n in REF_EVENT_NEW
}
REF_EVENT_SOURCES = {
    **{f"refevent-{n}": f"RefEvent/edit/i_key_restore/ref_video_{int(n[-2:])}_ez_i_restored.mp4"
       for n in REF_EVENT_NEW},
    **{f"refevent-{n}": f"RefEvent/8s/case{int(n)}/generated_with_controls.mp4"
       for n in REF_EVENT_8S},
}
TEXT_EVENT_8S = {
    "text-short-stained-glass": "text event/stained_glass_world_8s.mp4",
    "text-short-embroidered": "text event/embroidered_tapestry_world_8s.mp4",
    "text-short-lighthouse-meteor": "text event/edit/lighthouse_meteor_8s.mp4",
    "text-short-xianxia-crane": "text event/xianxia_crane.mp4",
    "text-short-karst-beacon": "text event/turn1_karst_golden_beacon_v1.mp4",
}

REF2VID_30S = {
    "ref2vid-0243": ("Ref2Vid/30s/r2v_0243_broad_horned_bison_golden_savanna/generated_with_controls.mp4", 3, 5),
    "ref2vid-0256": ("Ref2Vid/30s/r2v_0256_lunar_rescue_astro_lavender_lunar_pla/generated_with_controls.mp4", 5, 6),
    "ref2vid-0264": ("Ref2Vid/30s/r2v_0264_azure_wyvern_bright_floating_ga/generated_with_controls.mp4", 12, 14),
    "ref2vid-0412": ("Ref2Vid/30s/r2v_0412_highland_warden_ri_alpine_lake_basin/generated_with_controls.mp4", 10, 12),
    "ref2vid-0679": ("Ref2Vid/30s/r2v_0679_copper_automaton_s_giant_sequoia_clea/generated_with_controls.mp4", 10, 16),
    "ref2vid-0757": ("Ref2Vid/30s/r2v_0757_coastal_cartograph_flowering_coastal/generated_with_controls.mp4", 11, 14),
    "ref2vid-0825": ("Ref2Vid/30s/r2v_0825_desert_scout_ridin_crystal_desert_sky/generated_with_controls.mp4", 11, 14),
    "ref2vid-0988": ("Ref2Vid/30s/r2v_0988_sky_ranger_riding_bright_floating_ga/generated_with_controls.mp4", 10, 14),
}

VIDEOS = {
    **{f"ref2vid-{n}": f"Ref2Vid/8s/case{int(n)}/generated_with_controls.mp4"
       for n in REF2VID_8S},
    **REF_EVENT_SOURCES,
    **TEXT_EVENT_8S,
    "interaction-open-door": "interaction/open_door.mp4",
    "interaction-magic-box": "interaction/magic_box.mp4",
    "interaction-sword-cut": "interaction/sword_cut.mp4",
    "embodied-lift": "embodied/lift_right_lower.mp4",
    "embodied-warehouse": "embodied/warehouse_amr.mp4",
    "embodied-greenhouse": "embodied/greenhouse_inspection.mp4",
    "embodied-humanoid": "embodied/humannoid_carry.mp4",
    "embodied-mining": "embodied/mining_crawler.mp4",
    "embodied-bimanual": "embodied/bimanual_pregrasp.mp4",
    "embodied-drone": "embodied/drone_flight.mp4",
    "embodied-underwater": "embodied/underwater_rov.mp4",
}

TEXT_EVENTS = {
    "text-eclipse": ("text event/30s/16_eclipse_desert_observatory/generated_with_controls.mp4", 14, 23),
    "text-0152": ("text event/30s/physical_0152_entity_arrival/generated_with_controls.mp4", 12, 22),
    "text-0558": ("text event/30s/physical_0558_terrain_structure/generated_with_controls.mp4", 15, 22),
    "text-0584": ("text event/30s/physical_0584_weather_celestial/generated_with_controls.mp4", 16, 23),
    "text-0601": ("text event/30s/physical_0601_weather_celestial/generated_with_controls.mp4", 10, 22),
    "text-0627": ("text event/30s/physical_0627_weather_celestial/generated_with_controls.mp4", 14, 21),
    "text-spire": ("text event/30s/physical_0756_surreal_physics_ev/generated_with_controls.mp4", 14, 25),
    "text-0131": ("text event/30s/style_0131_bold_limited_palet/generated_with_controls.mp4", 12, 21),
}

IMAGES = {
    **{f"ref2vid-{n}-{i}": f"Ref2Vid/8s/case{int(n)}/input_reference_{i}.jpg"
       for n in REF2VID_8S for i in (1, 2)},
    **{f"{name}-{i}": f"{source.rsplit('/', 1)[0]}/input_reference_{i}.jpg"
       for name, (source, _, _) in REF2VID_30S.items() for i in (1, 2)},
    **{f"refevent-{n}-start": f"RefEvent/8s/case{int(n)}/input_first_image.jpg"
       for n in REF_EVENT_8S},
    **{f"refevent-{n}-reference": f"RefEvent/8s/case{int(n)}/input_reference_1.jpg"
       for n in REF_EVENT_8S},
    **{f"refevent-{n}-reference": f"RefEvent/new case/input_reference_{int(n[-2:])}.jpg"
       for n in REF_EVENT_NEW},
}

NEW_REF_EVENT_STARTS = {
    f"refevent-{n}-start": REF_EVENT_SOURCES[f"refevent-{n}"]
    for n in REF_EVENT_NEW
}
POSTER_TIMES = {
    **{f"refevent-{n}": 5.2 for n in REF_EVENT_8S},
    **{f"refevent-{n}": 6 for n in REF_EVENT_NEW},
    **{name: 5.5 for name in TEXT_EVENT_8S},
}


def run(*args: object) -> None:
    subprocess.run([str(FFMPEG), "-hide_banner", "-loglevel", "error", "-y", *map(str, args)], check=True)


def main() -> None:
    ASSETS.mkdir(parents=True, exist_ok=True)
    manifest_path = SITE / "media-manifest.json"
    manifest = [item for item in json.loads(manifest_path.read_text())
                if not item.get("asset", "").startswith("ref2vid-")
                and not item.get("asset", "").startswith("text-")
                and not item.get("asset", "").startswith("refevent-")
                and not item.get("asset", "").startswith("embodied-")
                and item.get("asset") not in VIDEOS and item.get("asset") not in TEXT_EVENTS
                and item.get("asset") not in {f"{name}-preview" for name in TEXT_EVENTS}
                and item.get("asset") not in IMAGES
                and item.get("asset") not in {f"{name}-full" for name in IMAGES}]
    long_previews = {**REF2VID_30S, **TEXT_EVENTS}
    all_videos = {**VIDEOS, **{name: data[0] for name, data in long_previews.items()}}
    for name, source in all_videos.items():
        refresh = name in NEW_REF_EVENT_ASSETS
        output = ASSETS / f"{name}.mp4"
        poster = ASSETS / f"{name}.jpg"
        if not output.exists() or refresh:
            video_filter = ("scale=960:-2:flags=lanczos" if refresh
                            else "scale=960:-2:flags=lanczos,fps=16")
            run("-i", WORKSPACE / source, "-an", "-vf", video_filter,
                "-c:v", "libx264", "-preset", "medium", "-crf", "23", "-pix_fmt", "yuv420p",
                "-movflags", "+faststart", output)
        if not poster.exists() or name in POSTER_TIMES or refresh:
            run("-ss", long_previews[name][2] if name in long_previews else POSTER_TIMES.get(name, 3),
                "-i", output, "-frames:v", 1, "-q:v", 2, poster)
        video_record = {"asset": name, "bytes": output.stat().st_size, "source": source}
        if name in NEW_REF_EVENT_ORIGINALS:
            video_record.update({"source_original": NEW_REF_EVENT_ORIGINALS[name],
                                 "modification": "restore translucent I key only"})
        if name == "text-short-lighthouse-meteor":
            video_record.update({"source_original": "text event/generated_with_controls.mp4",
                                 "clip_start_seconds": 10, "clip_duration_seconds": 8.0625})
        manifest.append(video_record)
        print(f"{name}: {output.stat().st_size / 1_000_000:.1f} MB", flush=True)
        if name in long_previews:
            preview = ASSETS / f"{name}-preview.mp4"
            if not preview.exists():
                run("-ss", long_previews[name][1], "-i", WORKSPACE / source, "-t", 8, "-an",
                    "-vf", "scale=960:-2:flags=lanczos,fps=16", "-c:v", "libx264",
                    "-preset", "medium", "-crf", "25", "-pix_fmt", "yuv420p",
                    "-movflags", "+faststart", preview)
            manifest.append({"asset": f"{name}-preview", "bytes": preview.stat().st_size,
                             "source": source,
                             "clip_start_seconds": long_previews[name][1],
                             "clip_duration_seconds": 8})
    for name, source in IMAGES.items():
        output = ASSETS / f"{name}.jpg"
        with Image.open(WORKSPACE / source) as raw:
            image = ImageOps.exif_transpose(raw).convert("RGB")
            image.thumbnail((700, 700), Image.Resampling.LANCZOS)
            image.save(output, quality=86, optimize=True)
        record = {"asset": name, "bytes": output.stat().st_size, "source": source}
        if name == "refevent-new-02-reference":
            record["provenance"] = "reference image recreated from output video frames"
        manifest.append(record)
        full = ASSETS / f"{name}-full.jpg"
        if not full.exists():
            shutil.copyfile(WORKSPACE / source, full)
        full_record = {"asset": f"{name}-full", "bytes": full.stat().st_size,
                       "source": source}
        if name == "refevent-new-02-reference":
            full_record["provenance"] = "reference image recreated from output video frames"
        manifest.append(full_record)
    for name, source in NEW_REF_EVENT_STARTS.items():
        full = ASSETS / f"{name}-full.jpg"
        run("-i", WORKSPACE / source, "-frames:v", 1, "-q:v", 2, full)
        output = ASSETS / f"{name}.jpg"
        with Image.open(full) as raw:
            image = ImageOps.exif_transpose(raw).convert("RGB")
            image.thumbnail((700, 700), Image.Resampling.LANCZOS)
            image.save(output, quality=86, optimize=True)
        for asset, path in ((name, output), (f"{name}-full", full)):
            manifest.append({"asset": asset, "bytes": path.stat().st_size,
                             "source": source, "frame": 0})
    used_refevent = {item["asset"] for item in manifest if item["asset"].startswith("refevent-")}
    for path in ASSETS.glob("refevent-*"):
        if path.is_file() and path.stem not in used_refevent:
            path.unlink()
    used_ref2vid = {item["asset"] for item in manifest if item["asset"].startswith("ref2vid-")}
    for path in ASSETS.glob("ref2vid-*"):
        if path.is_file() and path.stem not in used_ref2vid:
            path.unlink()
    used_embodied = {item["asset"] for item in manifest if item["asset"].startswith("embodied-")}
    for path in ASSETS.glob("embodied-*"):
        if path.is_file() and path.stem not in used_embodied:
            path.unlink()
    manifest_path.write_text(json.dumps(manifest, indent=2) + "\n")


if __name__ == "__main__":
    main()
