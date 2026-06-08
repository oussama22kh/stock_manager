#!/bin/sh
set -e

export BACKEND_HOST="${BACKEND_HOST:-backend}"
export BACKEND_PORT="${BACKEND_PORT:-80}"

envsubst '${BACKEND_HOST} ${BACKEND_PORT}' \
    < /etc/nginx/conf.d/default.conf \
    > /tmp/default.conf

mv /tmp/default.conf /etc/nginx/conf.d/default.conf

exec "$@"
