"""Inline CSS and JavaScript into one portable HTML file."""

from __future__ import annotations

import base64
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
HTML_PATH = ROOT / "index.html"
OUTPUT_PATH = ROOT / "dist" / "demo-bank.html"


def main() -> None:
    html = HTML_PATH.read_text(encoding="utf-8")
    css = (ROOT / "src" / "css" / "style.css").read_text(encoding="utf-8")
    mock = (ROOT / "src" / "js" / "mockData.js").read_text(encoding="utf-8")
    app = (ROOT / "src" / "js" / "app.js").read_text(encoding="utf-8")

    icon = (ROOT / "assets" / "demo-bank-logo.svg").read_bytes()
    icon_uri = "data:image/svg+xml;base64," + base64.b64encode(icon).decode("ascii")
    html = html.replace(
        '<link rel="stylesheet" href="src/css/style.css">',
        f"<style>\n{css}\n</style>",
    )
    html = html.replace(
        '<script src="src/js/mockData.js"></script>\n  <script src="src/js/app.js"></script>',
        f"<script>\n{mock}\n{app}\n</script>",
    )
    html = html.replace(
        '<link rel="apple-touch-icon" href="assets/demo-bank-logo.svg">',
        f'<link rel="apple-touch-icon" href="{icon_uri}">',
    )
    html = html.replace(
        '<link rel="icon" href="assets/demo-bank-logo.svg" type="image/svg+xml">',
        f'<link rel="icon" href="{icon_uri}" type="image/svg+xml">',
    )

    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT_PATH.write_text(html, encoding="utf-8")
    (OUTPUT_PATH.parent / "manifest.json").write_text(
        (ROOT / "manifest.json").read_text(encoding="utf-8"),
        encoding="utf-8",
    )
    print(f"Wrote {OUTPUT_PATH}")


if __name__ == "__main__":
    main()
