import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen flex items-center justify-center p-8">
      <main className="max-w-5xl w-full">
        {/* Hero Section */}
        <div className="text-center mb-16 fade-in-up">
          <div className="mb-8">
            <span className="text-9xl">💰</span>
          </div>
          <h1 className="text-7xl font-bold mb-6 gradient-text">
            Sistema Financeiro
          </h1>
          <p className="text-2xl text-gray-300 mb-8 max-w-3xl mx-auto">
            Gerencie suas finanças, controle dívidas e alcance a saúde financeira com ajuda de inteligência artificial
          </p>

          <div className="flex gap-6 justify-center flex-wrap">
            <Link
              href="/dashboard"
              className="btn bg-gradient-to-r from-purple-600 to-pink-600 text-white px-10 py-5 rounded-2xl font-bold text-xl hover:scale-110 transition-transform shadow-2xl"
            >
              Acessar Dashboard 🚀
            </Link>

            <button className="btn glass px-10 py-5 rounded-2xl font-bold text-xl hover:scale-105 transition-transform">
              Como Funciona ℹ️
            </button>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          <div className="glass rounded-3xl p-8 fade-in-up hover:scale-105 transition-transform">
            <div className="text-5xl mb-4">📊</div>
            <h3 className="text-2xl font-bold mb-3">Dashboard Visual</h3>
            <p className="text-gray-400">
              Visualize sua saúde financeira através de cores intuitivas: do vermelho ao azul
            </p>
          </div>

          <div className="glass rounded-3xl p-8 fade-in-up hover:scale-105 transition-transform">
            <div className="text-5xl mb-4">🤖</div>
            <h3 className="text-2xl font-bold mb-3">IA Integrada</h3>
            <p className="text-gray-400">
              Chat inteligente e OCR de comprovantes usando Google Gemini totalmente gratuito
            </p>
          </div>

          <div className="glass rounded-3xl p-8 fade-in-up hover:scale-105 transition-transform">
            <div className="text-5xl mb-4">💳</div>
            <h3 className="text-2xl font-bold mb-3">Gestão de Dívidas</h3>
            <p className="text-gray-400">
              Controle cartões de crédito, parcelas, empréstimos e juros automaticamente
            </p>
          </div>

          <div className="glass rounded-3xl p-8 fade-in-up hover:scale-105 transition-transform">
            <div className="text-5xl mb-4">📸</div>
            <h3 className="text-2xl font-bold mb-3">OCR de Comprovantes</h3>
            <p className="text-gray-400">
              Tire foto de comprovantes e a IA extrai os dados automaticamente
            </p>
          </div>

          <div className="glass rounded-3xl p-8 fade-in-up hover:scale-105 transition-transform">
            <div className="text-5xl mb-4">🎯</div>
            <h3 className="text-2xl font-bold mb-3">Metas Financeiras</h3>
            <p className="text-gray-400">
              Defina metas e receba um plano personalizado para sair do vermelho
            </p>
          </div>

          <div className="glass rounded-3xl p-8 fade-in-up hover:scale-105 transition-transform">
            <div className="text-5xl mb-4">📈</div>
            <h3 className="text-2xl font-bold mb-3">Análise Inteligente</h3>
            <p className="text-gray-400">
              Projeções futuras e simulações de quitação de dívidas
            </p>
          </div>
        </div>

        {/* Health Status Colors Legend */}
        <div className="glass rounded-3xl p-8 fade-in-up">
          <h3 className="text-3xl font-bold mb-6 text-center">
            Indicadores de Saúde Financeira
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
            <div className="text-center">
              <div className="w-16 h-16 rounded-full mx-auto mb-2" style={{ backgroundColor: '#8B0000' }}></div>
              <div className="text-sm font-semibold">🔴 Crítico</div>
              <div className="text-xs text-gray-400">{'>'} 70%</div>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 rounded-full mx-auto mb-2" style={{ backgroundColor: '#FF4500' }}></div>
              <div className="text-sm font-semibold">🟠 Preocupante</div>
              <div className="text-xs text-gray-400">50-70%</div>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 rounded-full mx-auto mb-2" style={{ backgroundColor: '#FFD700' }}></div>
              <div className="text-sm font-semibold">🟡 Atenção</div>
              <div className="text-xs text-gray-400">30-50%</div>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 rounded-full mx-auto mb-2" style={{ backgroundColor: '#90EE90' }}></div>
              <div className="text-sm font-semibold">🟢 Controlado</div>
              <div className="text-xs text-gray-400">10-30%</div>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 rounded-full mx-auto mb-2" style={{ backgroundColor: '#228B22' }}></div>
              <div className="text-sm font-semibold">💚 Saudável</div>
              <div className="text-xs text-gray-400">0-10%</div>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 rounded-full mx-auto mb-2" style={{ backgroundColor: '#87CEEB' }}></div>
              <div className="text-sm font-semibold">🔵 Poupando</div>
              <div className="text-xs text-gray-400">10-20%</div>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 rounded-full mx-auto mb-2" style={{ backgroundColor: '#0000CD' }}></div>
              <div className="text-sm font-semibold">💙 Excelente</div>
              <div className="text-xs text-gray-400">{'>'} 20%</div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

