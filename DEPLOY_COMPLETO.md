# 🚀 Guia Completo de Deploy - Lucro Líquido

## Arquitetura do Sistema

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│                 │     │                 │     │                 │
│    FRONTEND     │────▶│     BACKEND     │────▶│    DATABASE     │
│     (React)     │     │    (FastAPI)    │     │    (MongoDB)    │
│                 │     │                 │     │                 │
│  Vercel/Netlify │     │ Railway/Render  │     │  MongoDB Atlas  │
│                 │     │                 │     │                 │
└─────────────────┘     └─────────────────┘     └─────────────────┘
```

---

## 📋 Ordem de Deploy Recomendada

### 1️⃣ Primeiro: Banco de Dados
→ Veja: `DEPLOY_DATABASE.md`

### 2️⃣ Segundo: Backend
→ Veja: `DEPLOY_BACKEND.md`

### 3️⃣ Terceiro: Frontend
→ Veja: `DEPLOY_FRONTEND.md`

---

## 🔧 Configuração Rápida

### Variáveis de Ambiente

**Backend (.env):**
```env
MONGO_URL=mongodb+srv://user:pass@cluster.mongodb.net/lucro_liquido
DB_NAME=lucro_liquido
CORS_ORIGINS=https://seu-frontend.vercel.app
BACKEND_URL=https://seu-backend.railway.app
```

**Frontend (.env):**
```env
REACT_APP_BACKEND_URL=https://seu-backend.railway.app/api
```

---

## 📁 Como Separar em Branches

Após fazer "Save to GitHub" na Emergent:

```bash
# Clonar repositório
git clone https://github.com/seu-usuario/lucro-liquido.git
cd lucro-liquido

# ===== BRANCH BACKEND =====
git checkout -b deploy/backend
# Remover frontend
rm -rf frontend
# Mover backend para raiz
mv backend/* .
rm -rf backend
git add .
git commit -m "Backend only for deploy"
git push origin deploy/backend

# ===== BRANCH FRONTEND =====
git checkout main
git checkout -b deploy/frontend
# Remover backend
rm -rf backend
# Mover frontend para raiz
mv frontend/* .
rm -rf frontend
git add .
git commit -m "Frontend only for deploy"
git push origin deploy/frontend

# ===== BRANCH DATABASE (configs) =====
git checkout main
git checkout -b deploy/database
# Manter apenas arquivos de configuração
rm -rf backend frontend
mkdir -p database/scripts
# Criar script de inicialização
cat > database/scripts/init.js << 'EOF'
// Scripts de inicialização do MongoDB
use lucro_liquido

// Criar índices
db.users.createIndex({ "email": 1 }, { unique: true })
db.clientes.createIndex({ "empresa_id": 1 })
db.orcamentos.createIndex({ "empresa_id": 1 })
EOF
git add .
git commit -m "Database configs and scripts"
git push origin deploy/database
```

---

## 🌐 Exemplo de Deploy Completo

### Stack Recomendada (Gratuita):

| Componente | Plataforma | Custo |
|------------|------------|-------|
| Frontend | Vercel | Grátis |
| Backend | Railway | Grátis (500h/mês) |
| Database | MongoDB Atlas | Grátis (512MB) |

### Passo a Passo:

1. **MongoDB Atlas:**
   - Criar cluster gratuito
   - Anotar connection string

2. **Railway (Backend):**
   - Conectar repo GitHub (branch `deploy/backend`)
   - Adicionar variáveis de ambiente
   - Deploy automático

3. **Vercel (Frontend):**
   - Conectar repo GitHub (branch `deploy/frontend`)
   - Configurar `REACT_APP_BACKEND_URL`
   - Deploy automático

---

## ✅ Checklist Final

### Database
- [ ] MongoDB Atlas configurado
- [ ] Connection string obtida
- [ ] IP liberado (0.0.0.0/0)

### Backend
- [ ] Deployed no Railway/Render
- [ ] Variáveis de ambiente configuradas
- [ ] CORS configurado para frontend
- [ ] Endpoint `/api/health` respondendo

### Frontend
- [ ] Deployed no Vercel/Netlify
- [ ] `REACT_APP_BACKEND_URL` configurado
- [ ] Login funcionando
- [ ] Todas as páginas carregando

### Testes Finais
- [ ] Criar conta de teste
- [ ] Criar empresa
- [ ] Cadastrar cliente
- [ ] Criar orçamento
- [ ] Gerar PDF do orçamento

---

## 🆘 Problemas Comuns

### CORS Error
```
Access to XMLHttpRequest blocked by CORS policy
```
**Solução:** Verificar `CORS_ORIGINS` no backend

### MongoDB Connection Error
```
ServerSelectionTimeoutError
```
**Solução:** Verificar IP liberado no Atlas

### Build Failed (Frontend)
```
Module not found
```
**Solução:** Verificar se todas as dependências estão no `package.json`

---

## 📞 Suporte

Se precisar de ajuda:
1. Verifique os logs de cada serviço
2. Teste as conexões individualmente
3. Consulte a documentação de cada plataforma
