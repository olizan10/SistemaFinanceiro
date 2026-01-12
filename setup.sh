#!/bin/bash

echo "🚀 Sistema Financeiro - Setup Automático"
echo "========================================"
echo ""

# Cores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Verificar Node.js
echo "📦 Verificando Node.js..."
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js não encontrado. Instale via: https://nodejs.org${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Node.js $(node -v)${NC}"

# Verificar PostgreSQL
echo "🐘 Verificando PostgreSQL..."
if ! command -v psql &> /dev/null; then
    echo -e "${YELLOW}⚠️  PostgreSQL não encontrado. Instale via: https://www.postgresql.org/download/${NC}"
    echo "   Você pode continuar mas precisará configurar manualmente."
else
    echo -e "${GREEN}✅ PostgreSQL instalado${NC}"
fi

echo ""
echo "📥 Instalando dependências..."
echo ""

# Instalar backend
echo "🔧 Instalando Backend..."
cd backend
npm install
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Backend instalado${NC}"
else
    echo -e "${RED}❌ Erro ao instalar backend${NC}"
    exit 1
fi

# Instalar frontend
echo "🎨 Instalando Frontend..."
cd ../frontend
npm install
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Frontend instalado${NC}"
else
    echo -e "${RED}❌ Erro ao instalar frontend${NC}"
    exit 1
fi

cd ..

echo ""
echo "🔐 Configurando ambiente..."

# Copiar arquivos .env se não existirem
if [ ! -f backend/.env ]; then
    cp backend/.env.example backend/.env 2>/dev/null || echo "DATABASE_URL=\"postgresql://postgres:password@localhost:5432/sistema_financeiro\"
PORT=3001
NODE_ENV=development
JWT_SECRET=change-this-secret-key-in-production
GEMINI_API_KEY=your-gemini-api-key-here
FRONTEND_URL=http://localhost:3000
CORS_ORIGIN=http://localhost:3000" > backend/.env
    echo -e "${YELLOW}⚠️  Criado backend/.env - EDITE COM SUAS CONFIGURAÇÕES${NC}"
else
    echo -e "${GREEN}✅ backend/.env já existe${NC}"
fi

if [ ! -f frontend/.env.local ]; then
    echo "NEXT_PUBLIC_API_URL=http://localhost:3001/api" > frontend/.env.local
    echo -e "${GREEN}✅ Criado frontend/.env.local${NC}"
else
    echo -e "${GREEN}✅ frontend/.env.local já existe${NC}"
fi

echo ""
echo "=========================================="
echo -e "${GREEN}✨ Setup concluído!${NC}"
echo "=========================================="
echo ""
echo "📋 Próximos passos:"
echo ""
echo "1. 🔑 Obtenha sua chave da Gemini API (GRATUITA):"
echo "   https://makersuite.google.com/app/apikey"
echo ""
echo "2. ✏️  Edite backend/.env e adicione:"
echo "   - DATABASE_URL (suas credenciais PostgreSQL)"
echo "   - GEMINI_API_KEY (sua chave da Gemini)"
echo ""
echo "3. 🐘 Crie o banco de dados:"
echo "   createdb sistema_financeiro"
echo ""
echo "4. 📊 Execute as migrations do Prisma:"
echo "   cd backend"
echo "   npm run prisma:generate"
echo "   npm run prisma:migrate"
echo ""
echo "5. 🚀 Execute o projeto:"
echo "   ./run.sh"
echo ""
echo "   Ou manualmente:"
echo "   Terminal 1: cd backend && npm run dev"
echo "   Terminal 2: cd frontend && npm run dev"
echo ""
echo "6. 🌐 Acesse http://localhost:3000"
echo ""
echo -e "${YELLOW}📚 Mais informações: veja INSTALL.md e DOCS.md${NC}"
echo ""
