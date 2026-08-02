#!/bin/sh
set -e

echo "[entrypoint] Writing .env from environment..."
php /usr/local/bin/write-env.php

echo "[entrypoint] Caching configuration..."
php /var/www/html/artisan config:cache || true
php /var/www/html/artisan route:cache || true
php /var/www/html/artisan view:cache || true

echo "[entrypoint] Starting Apache..."
exec "$@"
