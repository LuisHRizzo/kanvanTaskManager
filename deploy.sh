#!/bin/bash

ENV_FILE=".env.local"

if [ "$1" = "local" ]; then
    echo "🔧 Modo LOCAL"
    ENV_FILE=".env.local"
else
    echo "🚀 Modo PRODUCCIÓN"
    # Completá estos valores para producción
    cat > .env.prod << 'EOF'
VITE_API_URL=https://taskmanager.163.176.208.127.sslip.io/api
VITE_SOCKET_URL=https://taskmanager.163.176.208.127.sslip.io
FRONTEND_URL=https://taskmanager.163.176.208.127.sslip.io
GOOGLE_CALLBACK_URL=https://taskmanager.163.176.208.127.sslip.io/api/auth/google/callback
POSTGRES_PASSWORD=YOUR_POSTGRES_PASSWORD
DATABASE_URL=postgres://admin:YOUR_POSTGRES_PASSWORD@db:5432/gestor_proyectos_db
JWT_SECRET=YOUR_JWT_SECRET
JWT_EXPIRES_IN=7d
GOOGLE_CLIENT_ID=YOUR_GOOGLE_CLIENT_ID
GOOGLE_CLIENT_SECRET=YOUR_GOOGLE_CLIENT_SECRET
VAPID_PUBLIC_KEY=YOUR_VAPID_PUBLIC_KEY
VAPID_PRIVATE_KEY=YOUR_VAPID_PRIVATE_KEY
VAPID_SUBJECT=mailto:admin@example.com
PORT=3000
NODE_ENV=production
EOF
    ENV_FILE=".env.prod"
fi

# Build y levanta con el archivo de env correcto
docker compose --env-file $ENV_FILE build frontend
docker compose --env-file $ENV_FILE up -d