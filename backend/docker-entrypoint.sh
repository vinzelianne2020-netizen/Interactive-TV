#!/bin/sh
set -e

if [ ! -f /var/www/html/.env ]; then
    echo "Creating .env from .env.example..."
    cp /var/www/html/.env.example /var/www/html/.env
    chown www-data:www-data /var/www/html/.env
fi

if [ -z "$APP_KEY" ] || [ "$APP_KEY" = "" ] || grep -q '^APP_KEY=$' /var/www/html/.env; then
    echo "APP_KEY not set, generating one..."
    NEW_KEY=$(php -r 'echo "base64:".base64_encode(random_bytes(32));')
    echo "Generated APP_KEY: $NEW_KEY"
    sed -i "s|^APP_KEY=.*|APP_KEY=$NEW_KEY|" /var/www/html/.env
    export APP_KEY="$NEW_KEY"
else
    echo "Using provided APP_KEY from environment"
    sed -i "s|^APP_KEY=.*|APP_KEY=$APP_KEY|" /var/www/html/.env
fi

echo "Injecting runtime env vars into .env..."
for var in APP_NAME APP_ENV APP_DEBUG APP_URL APP_TIMEZONE \
    DB_CONNECTION DB_HOST DB_PORT DB_DATABASE DB_USERNAME DB_PASSWORD DB_SSLMODE \
    SUPABASE_URL SUPABASE_PUBLISHABLE_KEY \
    WEATHER_API_KEY WEATHER_LAT WEATHER_LON WEATHER_CITY \
    FRONTEND_URL SANCTUM_STATEFUL_DOMAINS SESSION_DOMAIN \
    LOG_CHANNEL LOG_LEVEL SESSION_DRIVER CACHE_STORE QUEUE_CONNECTION; do
    eval "VALUE=\${$var:-}"
    if [ -n "$VALUE" ]; then
        ESCAPED_VALUE=$(printf '%s' "$VALUE" | sed 's|[&/]|\\&|g')
        if grep -q "^${var}=" /var/www/html/.env; then
            sed -i "s|^${var}=.*|${var}=$ESCAPED_VALUE|" /var/www/html/.env
        else
            echo "${var}=$VALUE" >> /var/www/html/.env
        fi
    fi
done

echo "Caching configuration..."
php artisan config:cache || true
php artisan route:cache || true
php artisan view:cache || true

echo "Starting web server..."
exec "$@"
