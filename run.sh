#!/bin/bash

echo "🚀 Iniciando Sistema Financeiro..."
echo ""

# Verificar se os .env existem
if [ ! -f backend/.env ]; then
    echo "❌ backend/.env não encontrado!"
    echo "Execute ./setup.sh primeiro"
    exit 1
fi

if [ ! -f frontend/.env.local ]; then
    echo "❌ frontend/.env.local não encontrado!"
    echo "Execute ./setup.sh primeiro"
    exit 1
fi

# Iniciar backend em background
echo "🔧 Iniciando Backend (porta 3001)..."
cd backend
npm run dev > ../backend.log 2>&1 &
BACKEND_PID=$!
cd ..

# Aguardar backend iniciar
sleep 3

# Iniciar frontend
echo "🎨 Iniciando Frontend (porta 3000)..."
cd frontend
npm run dev > ../frontend.log 2>&1 &
FRONTEND_PID=$!
cd ..

echo ""
echo "=========================================="
echo "✅ Sistema Financeiro está rodando!"
echo "=========================================="
echo ""
echo "🌐 Acesse:"
echo "   Frontend: http://localhost:3000"
echo "   Backend:  http://localhost:3001"
echo ""
echo "📊 Logs:"
echo "   Backend:  tail -f backend.log"
echo "   Frontend: tail -f frontend.log"
echo ""
echo "🛑 Para parar:"
echo "   kill $BACKEND_PID $FRONTEND_PID"
echo "   ou pressione Ctrl+C"
echo ""

# Trap para limpar ao sair
trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; echo ''; echo '👋 Sistema encerrado'; exit" INT TERM

# Aguardar
wait
