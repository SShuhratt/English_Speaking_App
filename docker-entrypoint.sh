#!/bin/sh
set -e

# ─── STEP 1: Clear stale bootstrap/cache files ──────────────────────────────
# When the host directory is bind-mounted over the container, it overwrites
# the image's bootstrap/cache with stale dev-environment cached manifests.
# These reference dev-only providers (e.g. laravel/boost, nunomaduro/collision)
# that are not installed in the production --no-dev image.
# We clear them unconditionally. Octane will regenerate what it needs on boot.
rm -f /app/bootstrap/cache/packages.php
rm -f /app/bootstrap/cache/services.php
rm -f /app/bootstrap/cache/config.php

# ─── STEP 2: Ensure required storage/cache directories exist ─────────────────
mkdir -p \
    /app/storage/framework/views \
    /app/storage/framework/cache/data \
    /app/storage/framework/sessions \
    /app/storage/logs \
    /app/bootstrap/cache

# ─── STEP 3: Generate APP_KEY if not set ─────────────────────────────────────
if [ -z "$APP_KEY" ]; then
    if [ ! -f /app/.env ]; then
        if [ -f /app/.env.example ]; then
            cp /app/.env.example /app/.env
        else
            touch /app/.env
        fi
    fi
    if ! grep -q "^APP_KEY=base64:" /app/.env; then
        echo "Generating fresh production APP_KEY..."
        php /app/artisan key:generate --force --no-interaction
    fi
fi

# ─── STEP 4: Create storage symlink ──────────────────────────────────────────
php /app/artisan storage:link --no-interaction 2>/dev/null || true

# ─── STEP 5: Run database migrations ─────────────────────────────────────────
echo "Running database migrations..."
php /app/artisan migrate --force --no-interaction || echo "Warning: Migrations could not complete at startup."

# ─── STEP 6: Boot the main process ───────────────────────────────────────────
exec "$@"
