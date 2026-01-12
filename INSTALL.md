# 🚀 Guia de Instalação e Execução

## 📋 Pré-requisitos

- Node.js 18+ instalado
- PostgreSQL 14+ instalado e rodando
- Conta Google Cloud (para Gemini API - **GRATUITA**)

## 🔧 Configuração Inicial

### 1. Obter Chave da Gemini API (Gratuita)

1. Acesse: https://makersuite.google.com/app/apikey
2. Faça login com sua conta Google
3. Clique em "Create API Key"
4. Copie a chave gerada

### 2. Configurar Banco de Dados PostgreSQL

```bash
# Login no PostgreSQL
psql -U postgres

# Criar banco de dados
CREATE DATABASE sistema_financeiro;

# Sair
\q
```

### 3. Configurar Backend

```bash
cd backend

# Instalar dependências
npm install

# Copiar arquivo de ambiente
cp ../.env.example .env

# Editar .env e configurar:
# - DATABASE_URL (substitua user e password pelos seus)
# - JWT_SECRET (crie uma chave secreta)
# - GEMINI_API_KEY (cole a chave obtida no passo 1)
```

Exemplo de `.env`:
```env
DATABASE_URL="postgresql://seu_usuario:sua_senha@localhost:5432/sistema_financeiro?schema=public"
PORT=3001
NODE_ENV=development
JWT_SECRET=minha-chave-super-secreta-mudeme-em-producao
GEMINI_API_KEY=sua-chave-gemini-aqui
FRONTEND_URL=http://localhost:3000
CORS_ORIGIN=http://localhost:3000
```

### 4. Executar Migrations do Prisma

```bash
# Gera o cliente Prisma
npm run prisma:generate

# Executa migrations (cria as tabelas)
npm run prisma:migrate

# (Opcional) Abrir Prisma Studio para visualizar o banco
npm run prisma:studio
```

### 5. Configurar Frontend

```bash
# Voltar para raiz e entrar no frontend
cd ../frontend

# Instalar dependências
npm install

# Criar arquivo de ambiente
echo "NEXT_PUBLIC_API_URL=http://localhost:3001/api" > .env.local
```

## ▶️ Executando o Projeto

### Opção 1: Executar Backend e Frontend Separadamente

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

### opção 2: Script Único (Recomendado)

Crie um arquivo `start.sh` na raiz do projeto:

```bash
#!/bin/bash

# Start backend
cd backend
npm run dev &
BACKEND_PID=$!

# Start frontend
cd ../frontend
npm run dev &
FRONTEND_PID=$!

echo "Backend PID: $BACKEND_PID"
echo "Frontend PID: $FRONTEND_PID"
echo ""
echo "🚀 Sistema Financeiro iniciado!"
echo "📊 Frontend: http://localhost:3000"
echo "🔌 Backend: http://localhost:3001"
echo ""
echo "Pressione Ctrl+C para parar"

# Wait for Ctrl+C
trap "kill $BACKEND_PID $FRONTEND_PID; exit" INT
wait
```

Execute:
```bash
chmod +x start.sh
./start.sh
```

## 🌐 Acessar a Aplicação

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001
- **Prisma Studio**: http://localhost:5555 (se executado)

## 🧪 Testando a API

Você pode testar os endpoints da API usando curl, Postman ou Insomnia.

### Registrar Usuário

```bash
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "seu@email.com",
    "password": "sua_senha",
    "name": "Seu Nome"
  }'
```

### Login

```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "seu@email.com",
    "password": "sua_senha"
  }'
```

### Dashboard (com token)

```bash
curl http://localhost:3001/api/dashboard \
  -H "Authorization: Bearer SEU_TOKEN_AQUI"
```

### Chat com IA

```bash
curl -X POST http://localhost:3001/api/ai/chat \
  -H "Authorization: Bearer SEU_TOKEN_AQUI" \
  -H "Content-Type: application/json" \
  -d '{"message": "Quanto tenho disponível este mês?"}'
```

## 🔍 Verificar se está tudo funcionando

1. Backend deve mostrar: `🚀 Server running on http://localhost:3001`
2. Frontend deve mostrar: `✓ Ready in ...`
3. Acesse http://localhost:3000 e você verá a página inicial
4. Clique em "Acessar Dashboard"

## 🐛 Problemas Comuns

### Erro de conexão com PostgreSQL

- Verifique se o PostgreSQL está rodando: `pg_isready`
- Verifique usuário e senha no DATABASE_URL
- Certifique-se que o banco `sistema_financeiro` existe

### Erro "GEMINI_API_KEY is not defined"

- Certifique-se que adicionou a chave no arquivo `.env` do backend
- Reinicie o servidor backend após adicionar a chave

### Porta já em uso

Se a porta 3000 ou 3001 já estiver em uso:

Backend (`backend/.env`):
```env
PORT=3002  # ou outra porta
```

Frontend:
```bash
npm run dev -- -p 3001  # ou outra porta
```

## 📚 Próximos Passos

1. Registre-se na aplicação
2. Adicione suas contas bancárias
3. Cadastre seus cartões de crédito
4. Registre suas transações
5. Experimente o chat com IA
6. Tire foto de um comprovante para testar o OCR

## 🔐 Segurança

**⚠️ IMPORTANTE para produção:**

1. Mude o `JWT_SECRET` para algo seguro
2. Use variáveis de ambiente reais (não commite `.env`)
3. Configure CORS apropriadamente
4. Use HTTPS
5. Implemente rate limiting
6. Valide todos os inputs

## 🎨 Personalizando

- **Cores do dashboard**: edite `frontend/src/app/globals.css`
- **Lógica de saúde financeira**: edite `backend/src/services/ai.service.ts`
- **Adicionar funcionalidades**: crie novos arquivos em `routes/`, `services/`, etc.

## 📖 Estrutura do Projeto

```
SistemaFinanceiro/
├── backend/
│   ├── prisma/
│   │   └── schema.prisma       # Modelos do banco de dados
│   ├── src/
│   │   ├── config/             # Configurações (DB, Gemini)
│   │   ├── routes/             # Rotas da API
│   │   ├── services/           # Lógica de negócio
│   │   ├── middleware/         # Middlewares (auth)
│   │   └── index.ts            # Servidor principal
│   └── package.json
├── frontend/
│   ├── src/
│   │   └── app/
│   │       ├── globals.css     # Estilos globais
│   │       ├── page.tsx        # Página inicial
│   │       └── dashboard/
│   │           └── page.tsx    # Dashboard
│   └── package.json
├── README.md
└── .gitignore
```

Desenvolvido com 💙 para saúde financeira!
