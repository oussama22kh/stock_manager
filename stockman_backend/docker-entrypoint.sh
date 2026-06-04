#!/bin/bash
set -e

cd /var/www/html

if [ ! -f .env ]; then
    cp .env.example .env
fi

chown -R www-data:www-data storage bootstrap/cache

if ! grep -q '^APP_KEY=.\+' .env 2>/dev/null; then
    php artisan key:generate --force --no-interaction
fi

# Wait for PostgreSQL
echo "Waiting for PostgreSQL..."
MAX_RETRIES=30
RETRY=0
until php -r "
    try {
        new PDO('pgsql:host=' . (getenv('DB_HOST') ?: 'db') . ';port=' . (getenv('DB_PORT') ?: '5432') . ';dbname=' . (getenv('DB_DATABASE') ?: 'stockman'), getenv('DB_USERNAME') ?: 'stockman', getenv('DB_PASSWORD') ?: 'secret');
        echo 'connected';
    } catch (PDOException \$e) {
        exit(1);
    }
" 2>/dev/null; do
    RETRY=$((RETRY + 1))
    if [ "$RETRY" -ge "$MAX_RETRIES" ]; then
        echo "PostgreSQL not available after $MAX_RETRIES attempts, exiting."
        exit 1
    fi
    echo "  attempt $RETRY/$MAX_RETRIES ..."
    sleep 3
done
echo "PostgreSQL is ready."

php artisan migrate --force --no-interaction

# Migrate data from SQLite if the old DB exists
SQLITE_DB="/var/www/html/storage/db/database.sqlite"
if [ -f "$SQLITE_DB" ]; then
    echo "Found existing SQLite database. Starting data migration to PostgreSQL..."
    php artisan db:migrate-sqlite-to-pgsql --force --fresh --source="$SQLITE_DB"
    echo "Data migration completed."
else
    # Fresh install: seed if database is empty (no users)
    USER_COUNT=$(php artisan tinker --execute="echo App\Models\User::count();" 2>/dev/null | tail -1)
    if [ "$USER_COUNT" = "0" ] || [ -z "$USER_COUNT" ]; then
        php artisan db:seed --force --no-interaction
    fi
fi

php artisan config:cache
php artisan route:cache

exec "$@"
