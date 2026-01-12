#!/bin/bash

echo "🗑️  Limpando Sistema Financeiro Docker..."
echo ""
echo "⚠️  ATENÇÃO: Isso vai remover:"
echo "   - Todos os containers"
echo "   - Volumes (incluindo dados do banco)"
echo "   - Redes"
echo ""
read -p "Tem certeza? (y/n) " -n 1 -r
echo

if [[ $REPLY =~ ^[Yy]$ ]]; then
    docker-compose down -v
    echo ""
    echo "✅ Limpeza concluída!"
    echo ""
    echo "Para reconstruir: ./docker-setup.sh"
else
    echo ""
    echo "❌ Operação cancelada"
fi
