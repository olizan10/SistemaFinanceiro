FROM node:20-alpine

# Instalar dependências do sistema
RUN apk add --no-cache openssl

# Criar diretório de trabalho
WORKDIR /app

# Copiar package files
COPY package*.json ./
COPY prisma ./prisma/

# Instalar dependências
RUN npm install

# Copiar código fonte
COPY . .

# Gerar Prisma Client
RUN npx prisma generate

# Expor porta
EXPOSE 3001

# Comando padrão (será sobrescrito pelo docker-compose)
CMD ["npm", "run", "dev"]
