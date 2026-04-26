#!/usr/bin/env python3
"""PAI Data UI system tray manager."""

import os
import signal
import subprocess
import sys
import webbrowser
from pathlib import Path

try:
    import pystray
    from PIL import Image, ImageDraw
except ImportError:
    print("Missing dependencies. Run: uv run --with pystray --with pillow scripts/tray.py")
    sys.exit(1)

PROJECT_DIR = Path(__file__).parent.parent.resolve()
BINARY = PROJECT_DIR / "pai-data-ui"
PORT = os.environ.get("PORT", "4173")
URL = f"http://localhost:{PORT}"

_server_proc: subprocess.Popen | None = None


def make_icon() -> Image.Image:
    img = Image.new("RGBA", (64, 64), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    draw.rounded_rectangle([4, 4, 60, 60], radius=12, fill=(30, 58, 138))
    draw.text((20, 20), "P", fill=(147, 197, 253))
    return img


def start_server() -> None:
    global _server_proc
    if _server_proc and _server_proc.poll() is None:
        return
    env = {**os.environ, "PORT": PORT}
    _server_proc = subprocess.Popen(
        [str(BINARY)],
        env=env,
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
    )


def stop_server() -> None:
    global _server_proc
    if _server_proc and _server_proc.poll() is None:
        _server_proc.send_signal(signal.SIGTERM)
        try:
            _server_proc.wait(timeout=5)
        except subprocess.TimeoutExpired:
            _server_proc.kill()
    _server_proc = None


def open_browser(_icon=None, _item=None) -> None:
    webbrowser.open(URL)


def restart_server(_icon=None, _item=None) -> None:
    stop_server()
    start_server()


def quit_app(icon: pystray.Icon, _item=None) -> None:
    stop_server()
    icon.stop()


def main() -> None:
    if not BINARY.exists():
        print(f"Binary not found: {BINARY}")
        print("Run: bun run build && bun run build:binary")
        sys.exit(1)

    start_server()

    menu = pystray.Menu(
        pystray.MenuItem("Open in Browser", open_browser, default=True),
        pystray.MenuItem("Restart Server", restart_server),
        pystray.Menu.SEPARATOR,
        pystray.MenuItem("Quit", quit_app),
    )

    icon = pystray.Icon("pai-data-ui", make_icon(), "PAI Data UI", menu)
    icon.run()


if __name__ == "__main__":
    main()
