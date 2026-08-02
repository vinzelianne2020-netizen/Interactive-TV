#!/bin/sh
set -e

if [ -z "$APP_KEY" ] || [ "$APP_KEY" = "" ]; then
    echo "APP_KEY not set, generating one..."
    php artisan key:generate --force
fi

echo "Caching configuration..."
php artisan config:cache || true
php artisan route:cache || true
php artisan view:cache || true

echo "Starting web server..."
exec "$@"
