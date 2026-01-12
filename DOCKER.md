# 🐳 Guia Docker - Sistema Financeiro

## 📋 Pré-requisitos

- **Docker Desktop** instalado
  - Mac: https://www.docker.com/products/docker-desktop
  - Certifique-se que o Docker está rodando

## 🚀 Quick Start (3 passos)

### 1️⃣ Setup Inicial (apenas uma vez)

```bash
cd /Users/Brigaderia/.gemini/antigravity/scratch/SistemaFinanceiro

# Dar permissão aos scripts
chmod +x docker-*.sh

# Executar setup
./docker-setup.sh
```

### 2️⃣ Configurar Gemini API (Opcional mas recomendado)

```bash
# Editar .env.docker
nano .env.docker

# Adicionar sua chave:
GEMINI_API_KEY=sua-chave-aqui
```

**Como obter a chave (GRATUITA):**
1. Acesse: https://makersuite.google.com/app/apikey
2. Faça login com Google
3. Clique em "Create API Key"
4. Copie e cole em `.env.docker`

### 3️⃣ Iniciar Sistema

```bash
./docker-start.sh
```

**Pronto!** 🎉

Acesse: **http://localhost:3000**

---

## 📦 O que o Docker vai criar?

O `docker-compose` vai subir **3 containers**:

| Container | Serviço | Porta | Descrição |
|-----------|---------|-------|-----------|
| `sistema_financeiro_db` | PostgreSQL 15 | 5432 | Banco de dados |
| `sistema_financeiro_backend` | Node.js API | 3001 | Backend + Prisma |
| `sistema_financeiro_frontend` | Next.js | 3000 | Interface web |

### 🔄 Fluxo Automático

Quando você executa `./docker-start.sh`:

1. ✅ PostgreSQL inicia primeiro
2. ✅ Backend aguarda DB estar pronto
3. ✅ Backend executa `prisma generate`
4. ✅ Backend aplica migrations automaticamente
5. ✅ Backend inicia servidor na porta 3001
6. ✅ Frontend inicia servidor na porta 3000

**Tudo automático!** Não precisa configurar nada manualmente.

---

## 🛠️ Scripts Disponíveis

### `./docker-setup.sh`
- Verifica requisitos (Docker, Docker Compose)
- Constrói as imagens Docker
- **Execute apenas uma vez** (ou quando mudar Dockerfiles)

### `./docker-start.sh`
- Inicia todos os containers
- Modo detached (roda em background)
- Mostra URLs e status

### `./docker-stop.sh`
- Para todos os containers
- **Preserva dados do banco** (volume persistente)

### `./docker-logs.sh`
- Visualiza logs em tempo real
- Escolha qual serviço ver
- Útil para debug

### `./docker-clean.sh`
- **⚠️ CUIDADO**: Remove tudo
- Deleta volumes (perde dados do banco)
- Use para começar do zero

---

## 📊 Comandos Úteis

### Ver status dos containers
```bash
docker-compose ps
```

### Ver logs de todos os serviços
```bash
docker-compose logs -f
```

### Ver logs de um serviço específico
```bash
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f postgres
```

### Reiniciar um serviço específico
```bash
docker-compose restart backend
```

### Acessar terminal do container
```bash
# Backend
docker-compose exec backend sh

# PostgreSQL
docker-compose exec postgres psql -U postgres -d sistema_financeiro
```

### Reconstruir um container
```bash
docker-compose up -d --build backend
```

### Ver recursos utilizados
```bash
docker stats
```

---

## 🔍 Verificando se está Funcionando

### 1. Verificar containers rodando
```bash
docker-compose ps
```

Deve mostrar 3 containers com status **Up**.

### 2. Testar Backend
```bash
curl http://localhost:3001/health
```

Deve retornar:
```json
{"status":"ok","message":"Sistema Financeiro API is running"}
```

### 3. Testar Frontend
Abra: http://localhost:3000

Deve mostrar a landing page.

### 4. Verificar banco de dados
```bash
docker-compose exec postgres psql -U postgres -d sistema_financeiro -c "\dt"
```

Deve listar as tabelas criadas pelo Prisma.

---

## 🐛 Troubleshooting

### Porta já em uso

**Erro:** `Bind for 0.0.0.0:3000 failed: port is already allocated`

**Solução:**
```bash
# Ver o que está usando a porta
lsof -i :3000
lsof -i :3001
lsof -i :5432

# Parar e remover containers
./docker-stop.sh
```

Ou edite `docker-compose.yml` para usar outras portas:
```yaml
ports:
  - "3002:3000"  # 3002 no host, 3000 no container
```

### Container não inicia

**Ver logs detalhados:**
```bash
docker-compose logs backend
```

**Reconstruir imagem:**
```bash
docker-compose up -d --build backend
```

### Banco de dados não conecta

**Verificar se PostgreSQL está rodando:**
```bash
docker-compose ps postgres
```

**Ver logs do PostgreSQL:**
```bash
docker-compose logs postgres
```

**Resetar banco de dados:**
```bash
./docker-clean.sh
./docker-setup.sh
./docker-start.sh
```

### Migrations não aplicadas

**Executar manualmente:**
```bash
docker-compose exec backend npx prisma migrate deploy
```

### Frontend mostra erro de conexão

**Verificar se backend está rodando:**
```bash
curl http://localhost:3001/health
```

**Se não responder, reiniciar backend:**
```bash
docker-compose restart backend
```

### Mudanças no código não aparecem

**Desenvolvimento com hot-reload:**
As mudanças deveriam aparecer automaticamente, mas se não:

```bash
docker-compose restart backend
# ou
docker-compose restart frontend
```

---

## 💾 Dados Persistentes

### Volumes

O PostgreSQL usa um **volume named** (`postgres_data`) que persiste entre reinicializações.

**Isso significa:**
- ✅ Dados permanecem quando você para os containers
- ✅ Pode fazer `./docker-stop.sh` sem perder dados
- ❌ `./docker-clean.sh` VAI deletar os dados

### Backup do Banco

**Criar backup:**
```bash
docker-compose exec postgres pg_dump -U postgres sistema_financeiro > backup.sql
```

**Restaurar backup:**
```bash
docker-compose exec -T postgres psql -U postgres sistema_financeiro < backup.sql
```

---

## 🔐 Variáveis de Ambiente

### Arquivo `.env.docker`

```bash
GEMINI_API_KEY=sua-chave-aqui
```

### No docker-compose.yml

As variáveis já estão pré-configuradas:
- `DATABASE_URL` - Conecta ao PostgreSQL do container
- `JWT_SECRET` - Segredo para tokens (mude em produção!)
- `CORS_ORIGIN` - Permite frontend acessar backend

---

## 🔄 Workflow de Desenvolvimento

### 1. Primeira vez
```bash
./docker-setup.sh
./docker-start.sh
```

### 2. Desenvolvimento diário
```bash
# Iniciar
./docker-start.sh

# Trabalhar normalmente (hot-reload funciona)
# Edite arquivos em ./backend e ./frontend

# Ver logs se precisar
./docker-logs.sh

# Parar ao terminar
./docker-stop.sh
```

### 3. Mudanças no Dockerfile ou dependências
```bash
./docker-stop.sh
docker-compose up -d --build
```

### 4. Resetar completamente
```bash
./docker-clean.sh
./docker-setup.sh
./docker-start.sh
```

---

## 📊 Monitoramento

### Ver uso de recursos
```bash
docker stats
```

### Ver processos rodando
```bash
docker-compose top
```

### Inspecionar container
```bash
docker inspect sistema_financeiro_backend
```

---

## 🚀 Produção (Deploy)

Para produção, você deve:

1. **Mudar JWT_SECRET** em `docker-compose.yml`
2. **Usar PostgreSQL externo** (não em container)
3. **Build otimizado do Next.js:**

```dockerfile
# frontend/Dockerfile.prod
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:18-alpine
WORKDIR /app
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/package*.json ./
RUN npm ci --production
EXPOSE 3000
CMD ["npm", "start"]
```

4. **Usar nginx como reverse proxy**
5. **HTTPS com certificado SSL**
6. **Variáveis de ambiente seguras** (não commitadas)

---

## 📝 Notas Importantes

- ✅ **Hot Reload funciona**: Mudanças no código são refletidas automaticamente
- ✅ **Isolamento total**: Cada container é isolado
- ✅ **Fácil reset**: `./docker-clean.sh` para começar do zero
- ✅ **Portável**: Funciona em qualquer máquina com Docker
- ⚠️ **Dados persistem**: Exceto se usar `./docker-clean.sh`
- ⚠️ **Primeira inicialização é lenta**: Download de imagens e build

---

## 🎯 Vantagens do Docker

1. **Zero configuração manual** - Tudo automático
2. **Ambiente idêntico** - Funciona igual em qualquer máquina
3. **Isolamento** - Não polui sua máquina
4. **Fácil limpeza** - Remove tudo com um comando
5. **PostgreSQL incluso** - Não precisa instalar separadamente
6. **Migrations automáticas** - Prisma configura o banco automaticamente

---

## 📚 Recursos

- Docker: https://docs.docker.com/
- Docker Compose: https://docs.docker.com/compose/
- Prisma: https://www.prisma.io/docs

---

**🎉 Pronto! Seu sistema está rodando em containers!**

Qualquer dúvida, consulte este guia ou execute `./docker-logs.sh` para ver o que está acontecendo.
