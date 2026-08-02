#!/bin/sh
set -e

echo "[entrypoint] Writing .env from environment..."
php /usr/local/bin/write-env.php

if [ -f /var/www/html/.env ]; then
    set -a
    . /var/www/html/.env
    set +a
fi

if [ -z "$APP_KEY" ]; then
    APP_KEY="base64:$(php -r 'echo base64_encode(random_bytes(32));')"
    export APP_KEY
    echo "[entrypoint] Fallback generated APP_KEY"
fi

export APP_KEY
echo "[entrypoint] APP_KEY length: ${#APP_KEY}"

echo "[entrypoint] Caching configuration..."
php /var/www/html/artisan config:cache || true
php /var/www/html/artisan route:cache || true
php /var/www/html/artisan view:cache || true

echo "[entrypoint] Clearing bootstrap cache to avoid stale config..."
php /var/www/html/artisan optimize:clear || true
php /var/www/html/artisan config:cache || true

echo "[entrypoint] Starting Apache with APP_KEY exported..."
exec "$@"
