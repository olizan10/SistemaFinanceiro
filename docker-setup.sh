#!/bin/bash

echo "🐳 Sistema Financeiro - Docker Setup"
echo "====================================="
echo ""

# Cores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Verificar Docker
echo "🔍 Verificando Docker..."
if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker não encontrado!${NC}"
    echo "Instale Docker Desktop em: https://www.docker.com/products/docker-desktop"
    exit 1
fi
echo -e "${GREEN}✅ Docker $(docker --version)${NC}"

# Verificar Docker Compose
if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    echo -e "${RED}❌ Docker Compose não encontrado!${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Docker Compose disponível${NC}"

echo ""
echo "🔐 Configurando variáveis de ambiente..."

# Verificar se .env.docker existe
if [ ! -f .env.docker ]; then
    echo "GEMINI_API_KEY=your-gemini-api-key-here" > .env.docker
    echo -e "${YELLOW}⚠️  Criado .env.docker${NC}"
fi

# Verificar se GEMINI_API_KEY está configurada
source .env.docker 2>/dev/null
if [ "$GEMINI_API_KEY" == "your-gemini-api-key-here" ] || [ -z "$GEMINI_API_KEY" ]; then
    echo -e "${YELLOW}⚠️  GEMINI_API_KEY não configurada!${NC}"
    echo ""
    echo "Para usar a IA, você precisa:"
    echo "1. Acesse: https://makersuite.google.com/app/apikey"
    echo "2. Crie uma chave API (gratuita)"
    echo "3. Edite .env.docker e adicione a chave"
    echo ""
    read -p "Continuar mesmo assim? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
else
    echo -e "${GREEN}✅ GEMINI_API_KEY configurada${NC}"
fi

echo ""
echo "🏗️  Construindo containers..."
echo ""

# Build containers
docker-compose build

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Erro ao construir containers${NC}"
    exit 1
fi

echo ""
echo -e "${GREEN}✅ Containers construídos com sucesso!${NC}"
echo ""
echo "=========================================="
echo -e "${GREEN}✨ Setup concluído!${NC}"
echo "=========================================="
echo ""
echo "📋 Próximos passos:"
echo ""
echo "1. 🚀 Iniciar o sistema:"
echo "   ./docker-start.sh"
echo ""
echo "2. 🛑 Parar o sistema:"
echo "   ./docker-stop.sh"
echo ""
echo "3. 📊 Ver logs:"
echo "   docker-compose logs -f"
echo ""
echo "4. 🔍 Status dos containers:"
echo "   docker-compose ps"
echo ""
echo -e "${BLUE}💡 Dica: Configure GEMINI_API_KEY em .env.docker para usar a IA!${NC}"
echo ""
