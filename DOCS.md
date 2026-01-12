# 📚 Documentação Técnica - Sistema Financeiro

## 🎯 Visão Geral

Sistema completo de gestão financeira pessoal com IA integrada (Google Gemini) para ajudar usuários a controlar gastos, gerenciar dívidas e alcançar saúde financeira.

## 🏗️ Arquitetura

### Stack Completa

**Backend:**
- Node.js + Express
- TypeScript
- PostgreSQL (banco de dados relacional)
- Prisma ORM (type-safe database access)
- Google Gemini API (IA - gratuita)
- JWT (autenticação)

**Frontend:**
- Next.js 15 (React com App Router)
- TypeScript
- Tailwind CSS (estilização)
- Design System customizado (glassmorphism, gradientes)

### Fluxo de Dados

```
┌─────────────┐
│   Frontend  │
│  (Next.js)  │
└──────┬──────┘
       │ HTTP/REST
       ▼
┌─────────────┐
│   Backend   │
│  (Express)  │
└──────┬──────┘
       │
       ├──────────┐
       │          │
       ▼          ▼
┌──────────┐  ┌──────────┐
│PostgreSQL│  │ Gemini   │
│ Database │  │   API    │
└──────────┘  └──────────┘
```

## 📊 Modelo de Dados

### Entidades Principais

1. **User** - Usuário do sistema
   - Campos: id, email, password (hash), name
   - Relações: accounts, transactions, creditCards, loans, etc.

2. **Account** - Conta bancária
   - Campos: id, name, type, balance, currency
   - Tipos: checking (corrente), savings (poupança), investment

3. **CreditCard** - Cartão de crédito
   - Campos: id, name, limit, closingDay, dueDay, currentBalance
   - Suporta: parcelas, cálculo de juros

4. **Transaction** - Transação financeira
   - Campos: id, type, category, amount, date, isPaid
   - Tipos: income (receita), expense (despesa), transfer

5. **Installment** - Parcela  
   - Campos: totalAmount, installments, currentInstall, interestRate
   - Usado para: compras parceladas

6. **Loan** - Empréstimo
   - Campos: principalAmount, interestRate, remainingAmount, monthlyPayment

7. **Goal** - Meta financeira
   - Campos: name, targetAmount, currentAmount, deadline, status

8. **Receipt** - Comprovante (para OCR)
   - Campos: imageUrl, extractedData (JSON), amount, merchant

## 🤖 Funcionalidades de IA

### 1. Chat Inteligente

**Endpoint:** `POST /api/ai/chat`

**Como funciona:**
1. Usuário envia mensagem em linguagem natural
2. Sistema busca contexto do usuário (contas, transações, dívidas)
3. Gemini API analisa e gera resposta estruturada
4. Sistema executa ação ou retorna informação

**Exemplos de comandos:**
- "Adicionar gasto de R$50 no Nubank"
- "Quanto tenho disponível este mês?"
- "Me dê dicas para economizar"

### 2. OCR de Comprovantes

**Endpoint:** `POST /api/ai/process-receipt`

**Como funciona:**
1. Usuário envia foto do comprovante (base64)
2. Gemini Vision API lê a imagem
3. Extrai: valor, data, estabelecimento, categoria
4. Retorna dados estruturados em JSON

**Exemplo de resposta:**
```json
{
  "amount": 50.00,
  "date": "2026-01-12",
  "merchant": "Supermercado ABC",
  "description": "Compra de alimentos",
  "category": "alimentação",
  "paymentMethod": "cartão"
}
```

### 3. Análise de Saúde Financeira

**Endpoint:** `GET /api/ai/financial-health`

**Como funciona:**
1. Calcula proporção de dívidas vs renda
2. Determina cor e status baseado em faixas pré-definidas
3. Gemini API gera sugestões personalizadas
4. Retorna análise completa

**Faixas de Status:**

| Dívida/Renda | Cor | Status | Score |
|-------------|-----|--------|-------|
| > 70% | 🔴 Vermelho | critical | 1 |
| 50-70% | 🟠 Laranja | concerning | 2 |
| 30-50% | 🟡 Amarelo | attention | 3 |
| 10-30% | 🟢 Verde Claro | controlled | 4 |
| 0-10% | 💚 Verde Forte | healthy | 5 |
| Poupando 10-20% | 🔵 Azul Claro | saving | 6 |
| Poupando >20% | 💙 Azul Forte | excellent | 7 |

## 🔐 Autenticação e Segurança

### JWT (JSON Web Tokens)

**Login:**
```
POST /api/auth/login
{
  "email": "user@example.com",
  "password": "senha"
}

Response:
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": { "id": "...", "email": "...", "name": "..." }
}
```

**Uso do Token:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Senha

- Hash com bcrypt (10 rounds)
- Nunca armazenada em plain text
- Validação segura

### CORS

- Configurado para aceitar apenas origem do frontend
- Credenciais permitidas
- Métodos permitidos: GET, POST, PUT, DELETE

## 📡 API Reference

### Auth Routes

```
POST /api/auth/register    # Criar conta
POST /api/auth/login       # Login
```

### Dashboard

```
GET /api/dashboard         # Dados completos do dashboard
```

### AI Routes

```
POST /api/ai/chat                # Chat com IA
POST /api/ai/process-receipt     # OCR de comprovante
GET  /api/ai/financial-health    # Análise de saúde
```

### CRUD Routes (TODO - implementar)

```
# Accounts
GET    /api/accounts
POST   /api/accounts
PUT    /api/accounts/:id
DELETE /api/accounts/:id

# Transactions
GET    /api/transactions
POST   /api/transactions
PUT    /api/transactions/:id
DELETE /api/transactions/:id

# Credit Cards
GET    /api/credit-cards
POST   /api/credit-cards
PUT    /api/credit-cards/:id
DELETE /api/credit-cards/:id

# Loans
GET    /api/loans
POST   /api/loans
PUT    /api/loans/:id
DELETE /api/loans/:id

# Goals
GET    /api/goals
POST   /api/goals
PUT    /api/goals/:id
DELETE /api/goals/:id

# Budgets
GET    /api/budgets
POST   /api/budgets
PUT    /api/budgets/:id
DELETE /api/budgets/:id
```

## 🎨 Frontend - Design System

### Cores CSS Variables

```css
/* Financial Health Colors */
--critical: #8B0000;     /* Vermelho escuro */
--concerning: #FF4500;   /* Laranja */
--attention: #FFD700;    /* Amarelo */
--controlled: #90EE90;   /* Verde claro */
--healthy: #228B22;      /* Verde forte */
--saving: #87CEEB;       /* Azul claro */
--excellent: #0000CD;    /* Azul forte */

/* Gradients */
--gradient-primary: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
--gradient-success: linear-gradient(135deg, #0ba360 0%, #3cba92 100%);
```

### Classes Utilitárias

- `.glass` - Efeito glassmorphism
- `.gradient-text` - Texto com gradiente
- `.btn` - Botão com hover effect
- `.fade-in-up` - Animação de entrada
- `.spinner` - Loading spinner

### Componentes (TODO)

- `<Card />` - Card genérico
- `<Button />` - Botão customizado
- `<Input />` - Campo de entrada
- `<Chart />` - Gráficos com Recharts
- `<Modal />` - Modal/Dialog
- `<Navbar />` - Barra de navegação

## 🚀 Próximas Implementações

### Backend

- [ ] Implementar CRUDs completos
- [ ] Sistema de notificações (vencimentos)
- [ ] Relatórios PDF
- [ ] Export de dados (CSV, Excel)
- [ ] Webhooks para integrações
- [ ] API de Open Banking

### Frontend

- [ ] Criar components reutilizáveis
- [ ] Implementar gráficos interativos
- [ ] Sistema de notificações push
- [ ] Dark/Light mode toggle
- [ ] Responsividade mobile completa
- [ ] PWA (Progressive Web App)
- [ ] Upload de fotos via câmera

### IA

- [ ] Análise preditiva de gastos
- [ ] Sugestões de economia baseadas em padrões
- [ ] Detecção de gastos anormais
- [ ] Categorização automática de transações
- [ ] Análise de tendências mensais

### Recursos Avançados

- [ ] Multi-moeda
- [ ] Compartilhamento de contas (família)
- [ ] Integração com bancos reais
- [ ] Import de extratos bancários
- [ ] Calendário financeiro
- [ ] Alertas customizáveis

## 🧪 Testing (TODO)

```bash
# Backend tests
cd backend
npm test

# Frontend tests
cd frontend
npm test

# E2E tests
npm run test:e2e
```

## 📦 Deploy (TODO)

### Backend (Render/Railway/Heroku)

```bash
# Build
npm run build

# Start production
npm start
```

### Frontend (Vercel)

```bash
npm run build
```

### Database (Supabase/Neon)

- Migrar PostgreSQL para cloud
- Configurar connection pooling
- Backups automáticos

## 🤝 Contribuindo

1. Fork o projeto
2. Crie uma branch (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📄 Licença

MIT License - veja LICENSE para detalhes.

---

💙 Desenvolvido com paixão para ajudar na saúde financeira!
