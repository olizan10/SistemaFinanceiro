#!/bin/bash

echo "🛑 Parando Sistema Financeiro..."
echo ""

docker-compose down

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Sistema parado com sucesso!"
    echo ""
    echo "💾 Dados do PostgreSQL foram preservados"
    echo ""
    echo "Para reiniciar: ./docker-start.sh"
else
    echo ""
    echo "❌ Erro ao parar containers"
    exit 1
fi
