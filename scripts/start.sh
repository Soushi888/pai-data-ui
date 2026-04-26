#!/usr/bin/env bash
# Launch PAI Data UI via systemd service, then open the browser.
# Used by the .desktop file so all env vars are managed by the service unit.

SERVICE="pai-data-ui"

systemctl --user start "$SERVICE"

# Wait up to 5s for the server to be ready
for i in $(seq 1 10); do
    if curl -s -o /dev/null -w "%{http_code}" http://localhost:4173/ 2>/dev/null | grep -q "200"; then
        break
    fi
    sleep 0.5
done

xdg-open http://localhost:4173
