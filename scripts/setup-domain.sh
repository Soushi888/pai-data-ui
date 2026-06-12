#!/usr/bin/env bash
# Sets up https://pai.localhost (no port, green padlock, no warnings)
# Step 1 — run as yourself (no sudo):
#   mkdir -p ~/Projets/pai-data-ui/certs && cd ~/Projets/pai-data-ui/certs && mkcert -install && mkcert pai.localhost
# Step 2 — run with sudo:
#   sudo bash /home/soushi888/Projets/pai-data-ui/scripts/setup-domain.sh

set -e

CERT_DIR="/home/soushi888/Projets/pai-data-ui/certs"
CERT="$CERT_DIR/pai.localhost.pem"
KEY="$CERT_DIR/pai.localhost-key.pem"

if [[ ! -f "$CERT" || ! -f "$KEY" ]]; then
  echo "ERROR: certificates not found in $CERT_DIR"
  echo "Run first (as yourself, no sudo):"
  echo "  mkdir -p $CERT_DIR && cd $CERT_DIR && mkcert -install && mkcert pai.localhost"
  exit 1
fi

echo "==> Enabling Apache modules (proxy + ssl)"
a2enmod proxy proxy_http ssl

echo "==> Writing pai.localhost virtual host (HTTP → HTTPS redirect + HTTPS proxy)"
cat > /etc/apache2/sites-available/pai-ui.conf << EOF
<VirtualHost *:80>
    ServerName pai.localhost
    Redirect permanent / https://pai.localhost/
</VirtualHost>

<VirtualHost *:443>
    ServerName pai.localhost

    SSLEngine on
    SSLCertificateFile    $CERT
    SSLCertificateKeyFile $KEY

    ProxyPreserveHost On
    ProxyPass        / http://127.0.0.1:4173/
    ProxyPassReverse / http://127.0.0.1:4173/

    # Forward real protocol to SvelteKit
    RequestHeader set X-Forwarded-Proto "https"

    ErrorLog  /var/log/apache2/pai-ui-error.log
    CustomLog /var/log/apache2/pai-ui-access.log combined
</VirtualHost>
EOF

echo "==> Enabling site"
a2enmod headers
a2ensite pai-ui
systemctl reload apache2

echo ""
echo "Done. Open https://pai.localhost in your browser."
