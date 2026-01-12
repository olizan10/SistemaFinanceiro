#!/bin/bash

echo "🚀 Iniciando Sistema Financeiro com Docker..."
echo ""

# Cores
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Carregar variáveis de ambiente
if [ -f .env.docker ]; then
    export $(cat .env.docker | grep -v '^#' | xargs)
fi

# Iniciar containers
docker-compose up -d

if [ $? -ne 0 ]; then
    echo "❌ Erro ao iniciar containers"
    exit 1
fi

echo ""
echo "⏳ Aguardando serviços iniciarem..."
sleep 5

# Verificar status
echo ""
echo "📊 Status dos containers:"
docker-compose ps

echo ""
echo "=========================================="
echo -e "${GREEN}✅ Sistema Financeiro está rodando!${NC}"
echo "=========================================="
echo ""
echo "🌐 URLs:"
echo -e "   ${BLUE}Frontend:${NC} http://localhost:3000"
echo -e "   ${BLUE}Backend:${NC}  http://localhost:3001"
echo -e "   ${BLUE}Database:${NC} localhost:5432"
echo ""
echo "📊 Logs em tempo real:"
echo "   docker-compose logs -f"
echo ""
echo "📊 Logs específicos:"
echo "   docker-compose logs -f backend"
echo "   docker-compose logs -f frontend"
echo "   docker-compose logs -f postgres"
echo ""
echo "🛑 Para parar:"
echo "   ./docker-stop.sh"
echo ""
echo -e "${YELLOW}💡 Aguarde ~30s para o backend aplicar migrations e iniciar completamente${NC}"
echo ""
