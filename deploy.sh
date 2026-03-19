#!/bin/bash

if [ "$1" = "local" ]; then
    # Local: usa .env.local
    echo "🔧 Modo LOCAL"
    export $(cat .env.local | grep -v '^#' | xargs)
else
    # Producción: exporta variables directamente
    echo "🚀 Modo PRODUCCIÓN"
    export VITE_API_URL=https://taskmanager.163.176.208.127.sslip.io/api
    export VITE_SOCKET_URL=https://taskmanager.163.176.208.127.sslip.io
    export FRONTEND_URL=https://taskmanager.163.176.208.127.sslip.io
    export GOOGLE_CALLBACK_URL=https://taskmanager.163.176.208.127.sslip.io/api/auth/google/callback
    export POSTGRES_PASSWORD=your_postgres_password
    export DATABASE_URL=postgres://admin:your_postgres_password@db:5432/gestor_proyectos_db
    export JWT_SECRET=your_jwt_secret
    export JWT_EXPIRES_IN=7d
    export GOOGLE_CLIENT_ID=your_google_client_id
    export GOOGLE_CLIENT_SECRET=your_google_client_secret
    export VAPID_PUBLIC_KEY=your_vapid_public_key
    export VAPID_PRIVATE_KEY=your_vapid_private_key
    export VAPID_SUBJECT=mailto:admin@example.com
fi

# Build y levanta
docker compose build frontend
docker compose up -d