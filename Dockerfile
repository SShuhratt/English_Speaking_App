# Stage 1: Composer packages installation
FROM composer:2 AS composer-builder
ENV COMPOSER_HTTP2=0
ENV COMPOSER_PROCESS_TIMEOUT=2000
WORKDIR /app
COPY composer.json composer.lock ./
RUN composer install --ignore-platform-reqs --no-dev --optimize-autoloader --no-scripts
COPY . .
RUN mkdir -p storage/framework/views \
    storage/framework/cache/data \
    storage/framework/sessions \
    storage/logs \
    bootstrap/cache
RUN APP_KEY=base64:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa= \
    DB_CONNECTION=sqlite \
    DB_DATABASE=:memory: \
    php artisan wayfinder:generate --with-form

# Stage 2: Node.js frontend assets build
FROM node:20-slim AS node-builder
WORKDIR /app
COPY package.json package-lock.json ./
ENV NODE_OPTIONS="--max-old-space-size=512"
RUN npm install --no-audit --no-fund
COPY . .
COPY --from=composer-builder /app/resources/js/actions /app/resources/js/actions
COPY --from=composer-builder /app/resources/js/routes /app/resources/js/routes
COPY --from=composer-builder /app/resources/js/wayfinder /app/resources/js/wayfinder
RUN npm run build


# Stage 3: Production environment (FrankenPHP)
FROM dunglas/frankenphp:1-php8.5-bookworm

# Install required system packages
RUN apt-get update && apt-get install -y \
    unzip \
    git \
    && rm -rf /var/lib/apt/lists/*

# Clone and install phpredis from GitHub to bypass PECL network issues
RUN git clone --branch develop --depth 1 https://github.com/phpredis/phpredis.git /usr/src/php/ext/redis \
    && docker-php-ext-install redis

# Install PHP extensions
RUN install-php-extensions \
    pcntl \
    pdo_pgsql \
    intl \
    opcache \
    zip


WORKDIR /app

# Copy application files
COPY . .

# Copy dependencies and compiled assets from previous stages
COPY --from=composer-builder /app/vendor /app/vendor
COPY --from=node-builder /app/public/build /app/public/build

# Clear bootstrap cache
RUN rm -f /app/bootstrap/cache/packages.php /app/bootstrap/cache/services.php

# Create folders and set permissions
RUN mkdir -p /app/storage/framework/views \
    /app/storage/framework/cache/data \
    /app/storage/framework/sessions \
    /app/storage/logs \
    /app/bootstrap/cache \
    && chown -R www-data:www-data /app/storage /app/bootstrap/cache

# Generate routes and run package:discover
RUN APP_KEY=base64:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa= \
    DB_CONNECTION=sqlite \
    DB_DATABASE=:memory: \
    php artisan wayfinder:generate --with-form

RUN APP_KEY=base64:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa= \
    DB_CONNECTION=sqlite \
    DB_DATABASE=:memory: \
    php artisan package:discover --ansi

RUN chown -R www-data:www-data /app/storage /app/bootstrap/cache

COPY Caddyfile /etc/caddy/Caddyfile

EXPOSE 10000

RUN setcap -r /usr/local/bin/frankenphp

COPY docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

ENTRYPOINT ["/usr/local/bin/docker-entrypoint.sh"]

CMD ["php", "artisan", "octane:frankenphp", "--host=0.0.0.0", "--port=10000"]