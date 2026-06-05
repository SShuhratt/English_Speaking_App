FROM dunglas/frankenphp:1.12-php8.5-bookworm

RUN install-php-extensions \
    pcntl \
    pdo_pgsql \
    intl \
    opcache

RUN apt-get update && apt-get install -y \
    unzip \
    nodejs \
    npm \
    && rm -rf /var/lib/apt/lists/*

RUN npm install -g chokidar-cli

WORKDIR /app
COPY . /app

EXPOSE 8000

# Start up Octane in worker mode, binding to all internal networks
CMD ["php", "artisan", "octane:frankenphp", "--host=0.0.0.0", "--port=8000", "--watch"]