#!/bin/bash
set -e

cd /var/www/html

if [ ! -f .env ]; then
    cp .env.example .env
fi

if [ -n "$DB_DATABASE" ]; then
    mkdir -p "$(dirname "$DB_DATABASE")"
    chown -R www-data:www-data "$(dirname "$DB_DATABASE")"
    if [ ! -f "$DB_DATABASE" ]; then
        touch "$DB_DATABASE"
    fi
    chown www-data:www-data "$DB_DATABASE"
fi

chown -R www-data:www-data storage bootstrap/cache

if ! grep -q '^APP_KEY=.\+' .env 2>/dev/null; then
    php artisan key:generate --force --no-interaction
fi

php artisan config:cache
php artisan route:cache

php artisan migrate --force --no-interaction

# Seed if database is empty (no users)
USER_COUNT=$(php artisan tinker --execute="echo App\Models\User::count();" 2>/dev/null | tail -1)
if [ "$USER_COUNT" = "0" ] || [ -z "$USER_COUNT" ]; then
    php artisan db:seed --force --no-interaction
fi

exec "$@"
