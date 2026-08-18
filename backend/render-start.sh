#!/bin/sh
set -e

echo "[render-start] Running migrations..."
php artisan migrate --force

echo "[render-start] Ensuring admin user..."
php artisan app:ensure-admin-user || php artisan db:seed --class=DatabaseSeeder --force || true

echo "[render-start] Starting Apache..."
exec apache2-foreground