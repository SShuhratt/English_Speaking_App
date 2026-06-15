FROM dunglas/frankenphp:1.12-php8.5-bookworm

# Install PHP extensions
RUN install-php-extensions \
    pcntl \
    pdo_pgsql \
    intl \
    opcache \
    redis \
    zip

# Install system dependencies, Node.js and NPM
RUN apt-get update && apt-get install -y \
    unzip \
    git \
    curl \
    && curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get install -y nodejs \
    && rm -rf /var/lib/apt/lists/*

# Install Composer
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

WORKDIR /app

# Copy dependency files first to utilize Docker build cache
COPY composer.json composer.lock package.json package-lock.json ./

# Install PHP and Node dependencies
ENV COMPOSER_ALLOW_SUPERUSER=1
RUN composer install --no-interaction --no-plugins --no-scripts --no-dev --prefer-dist

RUN npm ci

# Copy application files
COPY . .

# Generate Laravel Wayfinder route definitions for TypeScript
RUN php artisan wayfinder:generate

# Run production build for assets
RUN npm run build

# Run composer autoload optimization and scripts
RUN composer dump-autoload --no-dev --optimize

# Set permissions
RUN chown -R www-data:www-data /app/storage /app/bootstrap/cache

# Expose port
EXPOSE 8000

# Start up Octane in production worker mode
CMD php artisan octane:frankenphp --host=0.0.0.0 --port=${PORT:-8000}