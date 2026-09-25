"""Check that dist/ can be served unchanged at a GitHub Pages project URL."""

from __future__ import annotations

import posixpath
import re
import struct
from html.parser import HTMLParser
from pathlib import Path, PurePosixPath
from urllib.parse import unquote, urlsplit


ROOT = Path(__file__).resolve().parent
SITE = ROOT / "dist"
SITE_LIMIT = 1_000_000_000
FILE_LIMIT = 100_000_000


class References(HTMLParser):
    def __init__(self) -> None:
        super().__init__()
        self.values: list[str] = []
        self.videos: list[str] = []

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        values = dict(attrs)
        self.values.extend(values[key] for key in ("href", "src", "poster", "data-poster", "data-src", "data-full-src")
                           if values.get(key))
        if tag == "button" and values.get("data-video"):
            self.videos.append(values["data-video"])


def exact_path(path: PurePosixPath) -> bool:
    current = SITE
    for part in path.parts:
        if not current.is_dir() or part not in {child.name for child in current.iterdir()}:
            return False
        current /= part
    return current.exists()


def has_faststart_metadata(path: Path) -> bool:
    """Allow progressive playback before the browser has downloaded the whole MP4."""
    size = path.stat().st_size
    offset = 0
    with path.open("rb") as video:
        while offset + 8 <= size:
            video.seek(offset)
            atom_size, atom_type = struct.unpack(">I4s", video.read(8))
            header_size = 8
            if atom_size == 1:
                atom_size = struct.unpack(">Q", video.read(8))[0]
                header_size = 16
            elif atom_size == 0:
                atom_size = size - offset
            if atom_size < header_size or offset + atom_size > size:
                return False
            if atom_type == b"moov":
                return True
            if atom_type == b"mdat":
                return False
            offset += atom_size
    return False


def verify_reference(page: Path, reference: str) -> None:
    parsed = urlsplit(reference)
    if parsed.scheme or parsed.netloc:
        return
    if parsed.path.startswith("/"):
        raise AssertionError(f"root-relative URL breaks project sites: {page}: {reference}")
    relative_page = page.relative_to(SITE).as_posix()
    path = PurePosixPath(posixpath.normpath(posixpath.join(
        posixpath.dirname(relative_page), unquote(parsed.path)))) if parsed.path else PurePosixPath(relative_page)
    if path.parts and path.parts[0] == "..":
        raise AssertionError(f"URL escapes the Pages artifact: {page}: {reference}")
    if parsed.path.endswith("/"):
        path /= "index.html"
    if not exact_path(path):
        raise AssertionError(f"missing or case-mismatched Pages asset: {page}: {reference}")
    if parsed.fragment and str(path).endswith(".html"):
        target_html = (SITE / path).read_text()
        if not re.search(r'\bid=["\']' + re.escape(unquote(parsed.fragment)) + r'["\']', target_html):
            raise AssertionError(f"missing anchor in Pages link: {page}: {reference}")


def main() -> None:
    assert (SITE / "index.html").is_file(), "Pages artifact needs index.html at its root"
    files = [path for path in SITE.rglob("*") if path.is_file()]
    assert files and not any(path.is_symlink() or path.stat().st_nlink > 1 for path in files), \
        "Pages artifact must not contain symbolic or hard links"
    total = sum(path.stat().st_size for path in files)
    assert total < SITE_LIMIT, f"Pages artifact exceeds 1 GB: {total} bytes"
    large = [path for path in files if path.stat().st_size >= FILE_LIMIT]
    assert not large, f"GitHub rejects files at or above 100 MB: {large}"
    videos = [path for path in files if path.suffix.lower() == ".mp4"]
    non_progressive = [path for path in videos if not has_faststart_metadata(path)]
    assert not non_progressive, f"MP4 metadata must precede video data: {non_progressive}"

    cases = 0
    for page in SITE.rglob("*.html"):
        parser = References()
        parser.feed(page.read_text())
        for reference in parser.values:
            verify_reference(page, reference)
        for video in parser.videos:
            verify_reference(page, f"assets/{video}.mp4")
        cases += len(parser.videos)

    app = (SITE / "app.js").read_text()
    match = re.search(r"const heroClips\s*=\s*\[([^\]]+)\]", app)
    assert match, "hero clip list not found"
    for clip in re.findall(r"'([^']+)'", match.group(1)):
        verify_reference(SITE / "index.html", f"assets/{clip}.mp4")
        verify_reference(SITE / "index.html", f"assets/{clip}.jpg")

    cow_page = SITE / "interactive/doll-cow/index.html"
    for clip in ("cow-event", "pat", "lift", "drag"):
        verify_reference(cow_page, f"../../assets/{clip}.mp4")
    for slug, turns in (("obsidian-portal", 4), ("drawbridge-dragon", 4),
                        ("magic-fireball-brazier", 3), ("car-wash", 3),
                        ("residential-street", 3)):
        case = SITE / "interactive" / slug
        selectors = re.findall(r'<button\b[^>]*\bdata-chapter="(\d+)"',
                               (case / "index.html").read_text())
        assert selectors == [str(index) for index in range(turns)], \
            f"{slug} needs {turns} clickable turn selectors"
        assert "jumpToChapter" in (case / "app.js").read_text(), \
            f"{slug} has no turn-jump handler"
    home_html = (SITE / "index.html").read_text()
    def carousel_cases(carousel_id: str) -> list[str]:
        marker = f'id="carousel-{carousel_id}"'
        start = home_html.index(">", home_html.index(marker)) + 1
        end = home_html.index("\n      </div>", start)
        return re.findall(r'data-video="([^"]+)"', home_html[start:end])

    expected_carousel_order = {
        "ref2vid-long": ["ref2vid-0264", "ref2vid-0412", "ref2vid-0256", "ref2vid-0243",
                         "ref2vid-0825", "ref2vid-0679", "ref2vid-0757", "ref2vid-0988"],
        "text-event-short": ["text-short-stained-glass", "text-short-lighthouse-meteor",
                             "text-short-embroidered", "text-short-xianxia-crane", "ice-lava",
                             "text-short-karst-beacon", "road-sandstorm", "palace-neon"],
        "embodied": ["embodied-lift", "embodied-humanoid", "embodied-mining",
                     "embodied-bimanual", "embodied-warehouse", "embodied-underwater",
                     "embodied-greenhouse", "embodied-drone"],
    }
    for carousel_id, expected in expected_carousel_order.items():
        actual = carousel_cases(carousel_id)
        assert actual == expected, f"unexpected {carousel_id} order: {actual}"
    bench_page = SITE / "benchmark/index.html"
    for asset in re.findall(r"\basset:'([^']+)'", (SITE / "benchmark/data.js").read_text()):
        verify_reference(bench_page, f"../assets/{asset}.mp4")
        verify_reference(bench_page, f"../assets/{asset}.jpg")

    print(f"GitHub Pages artifact OK: {len(files)} files, {total / 1_000_000:.1f} MB, {len(videos)} progressive MP4s, {cases} capability videos")


if __name__ == "__main__":
    main()
