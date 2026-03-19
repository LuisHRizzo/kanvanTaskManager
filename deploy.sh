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
POSTGRES_PASSWORD=secretpassword
DATABASE_URL=postgres://admin:secretpassword@db:5432/gestor_proyectos_db
JWT_SECRET=super_secret_jwt_key_change_in_production
JWT_EXPIRES_IN=7d
GOOGLE_CLIENT_ID=197137467885-uhc0jtsup8heicnc2oi2r3afpsrfkqtb.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=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
VAPID_PUBLIC_KEY=BPULbx215kXGAA5h2BoL4J8hk934vggCXdVRfaDJh2EKkjSwiExXKUJOgC_uqMhDBZLNyex6iLby8LjwFQEmQG0
VAPID_PRIVATE_KEY=G85JCDm2TPFavYajXtH6MFeFhoXBvFxqZtUCQViAW3w
VAPID_SUBJECT=mailto:admin@example.com
PORT=3000
NODE_ENV=production
EOF
    ENV_FILE=".env.prod"
fi

# Build y levanta con el archivo de env correcto
docker compose --env-file $ENV_FILE build frontend
docker compose --env-file $ENV_FILE up -d