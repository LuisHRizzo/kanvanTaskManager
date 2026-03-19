# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Build arguments for environment variables - must be declared before COPY
ARG VITE_API_URL
ARG VITE_SOCKET_URL

# Set as environment variables for Vite
ENV VITE_API_URL=${VITE_API_URL}
ENV VITE_SOCKET_URL=${VITE_SOCKET_URL}

# Copy package files
COPY package.json package-lock.json* ./

# Install dependencies
RUN npm cache clean --force && npm install

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Production stage
FROM nginx:alpine

# Copy custom nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy built assets from builder
COPY --from=builder /app/dist /usr/share/nginx/html

# Expose port 80
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
