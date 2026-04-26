#!/usr/bin/env bash
set -euo pipefail

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BINARY="$PROJECT_DIR/pai-data-ui"
TRAY_SCRIPT="$PROJECT_DIR/scripts/tray.py"
UV="$(which uv 2>/dev/null || echo "$HOME/.local/bin/uv")"
SERVICE_NAME="pai-data-ui"
SERVICE_DIR="$HOME/.config/systemd/user"
DESKTOP_DIR="$HOME/.local/share/applications"

echo "PAI Data UI — install script"
echo "Project: $PROJECT_DIR"
echo ""

# Build if needed
if [ ! -f "$BINARY" ]; then
    echo "Building server..."
    cd "$PROJECT_DIR"
    bun run build
    bun run build:binary
fi

# Install Python deps via uv (cached — fast on repeat runs)
echo "Fetching Python dependencies..."
"$UV" run --with pystray --with pillow python3 -c "import pystray, PIL; print('  pystray OK')"

# Systemd user service
mkdir -p "$SERVICE_DIR"
cat > "$SERVICE_DIR/$SERVICE_NAME.service" <<EOF
[Unit]
Description=PAI Data UI
After=graphical-session.target
PartOf=graphical-session.target

[Service]
Type=simple
WorkingDirectory=$PROJECT_DIR
Environment=PORT=4173
ExecStart=$UV run --with pystray --with pillow $TRAY_SCRIPT
Restart=on-failure
RestartSec=3

[Install]
WantedBy=graphical-session.target
EOF

echo "Systemd service written to $SERVICE_DIR/$SERVICE_NAME.service"

systemctl --user daemon-reload
systemctl --user enable "$SERVICE_NAME"
echo "Service enabled (starts automatically with graphical session)"

# .desktop file for double-click / app menu
mkdir -p "$DESKTOP_DIR"
cat > "$DESKTOP_DIR/$SERVICE_NAME.desktop" <<EOF
[Desktop Entry]
Version=1.0
Type=Application
Name=PAI Data UI
Comment=PAI Data Layer UI
Exec=$UV run --with pystray --with pillow $TRAY_SCRIPT
Icon=network-server
Terminal=false
Categories=Utility;
StartupNotify=false
EOF

echo ".desktop file written to $DESKTOP_DIR/$SERVICE_NAME.desktop"
update-desktop-database "$DESKTOP_DIR" 2>/dev/null || true

echo ""
echo "Done. Start now with:"
echo "  systemctl --user start $SERVICE_NAME"
echo ""
echo "Or double-click PAI Data UI in your application launcher."
