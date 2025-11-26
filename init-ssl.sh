#!/bin/sh
mkdir -p /etc/nginx/ssl
if [ ! -f /etc/nginx/ssl/cert.pem ]; then
    apk add --no-cache openssl
    openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
        -keyout /etc/nginx/ssl/key.pem \
        -out /etc/nginx/ssl/cert.pem \
        -subj "/CN=34.46.246.67/O=Vera/C=FR" \
        -addext "subjectAltName=IP:34.46.246.67,DNS:localhost"
fi
nginx -g "daemon off;"
