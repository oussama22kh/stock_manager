#!/bin/bash
set -e

# Generate APP_KEY if missing
if [ -z "$APP_KEY" ]; then
    if [ ! -f .env ]; then
        cp .env.example .env
    fi
    if ! grep -q "^APP_KEY=base64" .env 2>/dev/null; then
        php artisan key:generate
    fi
fi

# Ensure SQLite database file exists and is writable
if [ "$DB_CONNECTION" = "sqlite" ]; then
    if [ ! -f "$DB_DATABASE" ]; then
        touch "$DB_DATABASE"
        chown www-data:www-data "$DB_DATABASE"
        chmod 664 "$DB_DATABASE"
    fi
fi

# Run migrations
php artisan migrate --force

# Cache config/routes/views for production
if [ "$APP_ENV" = "production" ]; then
    php artisan config:cache
    php artisan route:cache
    php artisan view:cache
fi

exec "$@"
