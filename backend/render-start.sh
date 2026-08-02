#!/bin/sh
set -e

echo "[render-start] Running migrations..."
php artisan migrate --force

echo "[render-start] Starting Apache..."
exec apache2-foreground