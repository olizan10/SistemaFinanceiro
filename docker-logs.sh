#!/bin/bash

echo "📊 Logs do Sistema Financeiro"
echo "=============================="
echo ""
echo "Escolha um serviço:"
echo "1) Todos"
echo "2) Backend"
echo "3) Frontend"
echo "4) PostgreSQL"
echo ""
read -p "Opção (1-4): " option

case $option in
    1)
        docker-compose logs -f
        ;;
    2)
        docker-compose logs -f backend
        ;;
    3)
        docker-compose logs -f frontend
        ;;
    4)
        docker-compose logs -f postgres
        ;;
    *)
        echo "Opção inválida"
        exit 1
        ;;
esac
