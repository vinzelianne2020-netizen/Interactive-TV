#!/bin/sh
set -e

echo "[render-start] Running migrations..."
php artisan migrate --force

echo "[render-start] Seeding database..."
php artisan db:seed --force

echo "[render-start] Starting Apache..."
exec apache2-foreground