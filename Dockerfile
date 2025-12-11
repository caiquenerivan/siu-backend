# backend/Dockerfile
FROM node:20-alpine

WORKDIR /usr/src/app

# Instala OpenSSL e dependências de compatibilidade para o Prisma rodar no Alpine
RUN apk add --no-cache openssl libc6-compat

# Instala a CLI do Nest globalmente dentro do container (útil para comandos de dev)
RUN npm i -g @nestjs/cli

COPY package*.json ./

RUN npm install

COPY . .

# A porta padrão do NestJS é 3000
EXPOSE 3000

# Comando de desenvolvimento com Hot Reload
CMD ["npm", "run", "start:dev"]