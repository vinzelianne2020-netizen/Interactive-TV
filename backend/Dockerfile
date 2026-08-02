FROM php:8.4-apache

ENV DEBIAN_FRONTEND=noninteractive \
    COMPOSER_ALLOW_SUPERUSER=1 \
    COMPOSER_MEMORY_LIMIT=-1 \
    COMPOSER_NO_INTERACTION=1 \
    COMPOSER_PLATFORM_CHECK=0

RUN apt-get update && apt-get install -y --no-install-recommends \
    git \
    curl \
    ca-certificates \
    libpng-dev \
    libonig-dev \
    libxml2-dev \
    libzip-dev \
    zip \
    unzip \
    libpq-dev \
    libjpeg62-turbo-dev \
    libfreetype6-dev \
    && docker-php-ext-configure gd --with-freetype --with-jpeg \
    && docker-php-ext-install -j$(nproc) \
        pdo_pgsql \
        pgsql \
        mbstring \
        exif \
        pcntl \
        bcmath \
        gd \
        zip \
        opcache \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/*

COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

WORKDIR /var/www/html

COPY composer.json composer.lock ./

RUN composer install \
    --no-dev \
    --optimize-autoloader \
    --no-interaction \
    --no-scripts \
    --prefer-dist

COPY . .

RUN find /var/www/html -maxdepth 2 \( -name "php.ini" -o -name ".user.ini" -o -name "*.dll" \) -delete 2>/dev/null || true

RUN { \
    echo 'date.timezone = UTC'; \
    echo 'memory_limit = 512M'; \
    echo 'upload_max_filesize = 128M'; \
    echo 'post_max_size = 128M'; \
    echo 'max_execution_time = 300'; \
    echo 'display_errors = Off'; \
    echo 'display_startup_errors = Off'; \
    echo 'log_errors = On'; \
    echo 'error_reporting = E_ALL & ~E_DEPRECATED & ~E_STRICT & ~E_WARNING'; \
    echo 'opcache.enable = 1'; \
    echo 'opcache.enable_cli = 0'; \
    echo 'opcache.memory_consumption = 256'; \
    echo 'opcache.max_accelerated_files = 20000'; \
    echo 'opcache.revalidate_freq = 0'; \
    echo 'opcache.validate_timestamps = 0'; \
    echo 'variables_order = "EGPCS"'; \
  } > /usr/local/etc/php/conf.d/zzz_production.ini

RUN BUILD_APP_KEY=$(php -r 'echo "base64:".base64_encode(random_bytes(32));') \
 && ( [ -f .env ] || cp .env.example .env ) \
 && sed -i "s|^APP_KEY=.*|APP_KEY=\"$BUILD_APP_KEY\"|" .env \
 && grep -q '^APP_ENV=' .env || echo 'APP_ENV="production"' >> .env \
 && APP_KEY="$BUILD_APP_KEY" APP_ENV=production composer run-script post-autoload-dump || true

RUN { \
    echo "<VirtualHost *:10000>"; \
    echo "  ServerName localhost"; \
    echo "  DocumentRoot /var/www/html/public"; \
    echo "  PassEnv APP_KEY APP_ENV APP_DEBUG APP_URL DB_HOST DB_PORT DB_DATABASE DB_USERNAME DB_PASSWORD DB_CONNECTION DB_SSLMODE SUPABASE_URL SUPABASE_PUBLISHABLE_KEY FRONTEND_URL WEATHER_API_KEY WEATHER_LAT WEATHER_LON WEATHER_CITY LOG_CHANNEL LOG_LEVEL SESSION_DRIVER CACHE_STORE QUEUE_CONNECTION APP_TIMEZONE"; \
    echo "  <Directory /var/www/html/public>"; \
    echo "    AllowOverride All"; \
    echo "    Require all granted"; \
    echo "    FallbackResource /index.php"; \
    echo "  </Directory>"; \
    echo "  ErrorLog \${APACHE_LOG_DIR}/error.log"; \
    echo "  CustomLog \${APACHE_LOG_DIR}/access.log combined"; \
    echo "</VirtualHost>"; \
  } > /etc/apache2/sites-available/000-default.conf

ENV APACHE_DOCUMENT_ROOT=/var/www/html/public
RUN sed -ri -e 's!/var/www/html!${APACHE_DOCUMENT_ROOT}!g' /etc/apache2/apache2.conf /etc/apache2/conf-available/*.conf \
 && sed -i 's/Listen 80/Listen 10000/' /etc/apache2/ports.conf \
 && a2enmod rewrite headers env

COPY docker-entrypoint.sh /usr/local/bin/
COPY write-env.php /usr/local/bin/
RUN sed -i 's/\r$//' /usr/local/bin/docker-entrypoint.sh \
 && sed -i 's/\r$//' /usr/local/bin/write-env.php \
 && chmod +x /usr/local/bin/docker-entrypoint.sh

RUN chown -R www-data:www-data /var/www/html/storage /var/www/html/bootstrap/cache \
 && chmod -R 775 /var/www/html/storage /var/www/html/bootstrap/cache

STOPSIGNAL SIGTERM
ENV APP_ENV=production
ENV APP_KEY=""

EXPOSE 10000

ENTRYPOINT ["docker-entrypoint.sh"]
CMD ["apache2-foreground"]
