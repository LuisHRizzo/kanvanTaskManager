FROM node:20-alpine 

WORKDIR /app

# Copiar PRIMERO solo los archivos de dependencias
COPY package.json package-lock.json* ./

# Limpiar caché y realizar una instalación limpia (esto evita el bug de npm)
RUN npm cache clean --force && rm -rf node_modules package-lock.json && npm install

# Luego copiar el resto del código
COPY . .

# Exponer el puerto
EXPOSE 5173

# Comando para iniciar
CMD ["npm", "run", "dev"]
