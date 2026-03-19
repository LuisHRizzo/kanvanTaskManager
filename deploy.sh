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
    
    # COMPLETÁ ESTAS VARIABLES CON TUS VALORES DE PRODUCCIÓN
    export POSTGRES_PASSWORD=YOUR_POSTGRES_PASSWORD
    export DATABASE_URL=postgres://admin:YOUR_PASSWORD@db:5432/gestor_proyectos_db
    export JWT_SECRET=YOUR_JWT_SECRET
    export GOOGLE_CLIENT_ID=YOUR_GOOGLE_CLIENT_ID
    export GOOGLE_CLIENT_SECRET=YOUR_GOOGLE_CLIENT_SECRET
    export VAPID_PUBLIC_KEY=YOUR_VAPID_PUBLIC_KEY
    export VAPID_PRIVATE_KEY=YOUR_VAPID_PRIVATE_KEY
fi

export JWT_EXPIRES_IN=7d
export VAPID_SUBJECT=mailto:admin@example.com
export PORT=3000
export NODE_ENV=production

# Build y levanta
docker compose build frontend
docker compose up -d