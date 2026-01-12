# 💰 Sistema Financeiro Avançado

Sistema completo de gestão financeira pessoal com IA integrada para ajudar você a sair das dívidas e alcançar a saúde financeira.

## 🎯 Objetivo

Controlar gastos, gerenciar dívidas, cartões de crédito, parcelas e empréstimos de forma inteligente, com visualização clara da sua situação financeira através de cores intuitivas.

## ✨ Funcionalidades

### 📊 Dashboard Visual
- **Indicador de Saúde Financeira por Cores:**
  - 🔴 Vermelho: Situação crítica (dívidas >70% da renda)
  - 🟠 Laranja: Preocupante (50-70%)
  - 🟡 Amarelo: Atenção (30-50%)
  - 🟢 Verde Claro: Controlado (10-30%)
  - 💚 Verde Forte: Saudável (0-10%)
  - 🔵 Azul Claro: Poupando (10-20%)
  - 💙 Azul Forte: Excelente (>20%)

### 🤖 IA Integrada (Gemini API - Gratuita)
- Chat inteligente para gerenciar transações
- OCR para ler comprovantes e boletos automaticamente
- Análise de gastos e sugestões personalizadas
- Comandos de voz: "Adicionar gasto de R$100 no Nubank"

### 💳 Gestão Completa
- **Cartões de Crédito:** Múltiplos cartões, faturas, parcelas
- **Empréstimos:** Tracking de empréstimos e juros
- **Contas Fixas:** Aluguel, internet, energia, etc.
- **Receitas:** Salário, freelas, renda extra
- **Metas:** Planos para sair das dívidas

### 📈 Análise e Relatórios
- Projeção de fluxo de caixa
- Simulador de quitação de dívidas
- Quanto falta para "sair do vermelho"
- Alertas de vencimentos

## 🏗️ Arquitetura

### Backend
- **Node.js** com Express
- **TypeScript**
- **PostgreSQL** (banco de dados)
- **Prisma ORM**
- **Google Gemini API** (IA gratuita)

### Frontend
- **Next.js 15** (React)
- **TypeScript**
- **Tailwind CSS** (design moderno)
- **Framer Motion** (animações)
- **Recharts** (gráficos)

## 🚀 Como Executar

### Pré-requisitos
- Node.js 18+
- PostgreSQL 14+
- Conta Google Cloud (para Gemini API - gratuita)

### Backend
```bash
cd backend
npm install
npm run dev
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

## 📝 Configuração

1. Configure o banco de dados PostgreSQL
2. Copie `.env.example` para `.env`
3. Adicione sua chave da Gemini API (gratuita)
4. Execute as migrations do Prisma

## 🎨 Design

Interface moderna e intuitiva com:
- Dark mode nativo
- Animações suaves
- Cores vibrantes para indicadores
- Responsivo (mobile-first)

## 📱 Funcionalidades Mobile

- App web responsivo (PWA)
- Upload de fotos de comprovantes
- Notificações de vencimentos

## 🔐 Segurança

- Autenticação JWT
- Criptografia de dados sensíveis
- Proteção contra SQL Injection
- Rate limiting

## 📖 Documentação

A documentação completa estará disponível em `/docs`

## 🤝 Contribuindo

Este é um projeto pessoal, mas sugestões são bem-vindas!

## 📄 Licença

MIT License

---

Desenvolvido com 💙 para ajudar na saúde financeira pessoal
