# 🚀 PROMPT PARA CONTINUAR O PROJETO LUCRO LÍQUIDO

---

## 📋 CONTEXTO DO PROJETO

Você está trabalhando no **Sistema Lucro Líquido**, um SaaS completo de gestão financeira para PMEs. O projeto já está **100% funcional** e precisa de continuação, melhorias ou novas funcionalidades.

---

## 🏗️ STACK TECNOLÓGICA

### **Backend:**
- **Framework:** FastAPI (Python)
- **Banco de Dados:** MongoDB
- **Bibliotecas principais:**
  - Motor (MongoDB async)
  - Pydantic (validação)
  - WeasyPrint (geração de PDF)
  - Jinja2 (templates)
  - Emergent Integrations (LLM)
  - Mercado Pago SDK (pagamentos)

### **Frontend:**
- **Framework:** React
- **Roteamento:** React Router DOM
- **Estilo:** Tailwind CSS
- **Componentes:** shadcn/ui
- **Ícones:** Lucide React
- **Gráficos:** Recharts
- **Notificações:** Sonner (toast)

### **Infraestrutura:**
- Supervisor (gerenciamento de processos)
- Backend na porta 8001
- Frontend na porta 3000
- MongoDB na porta 27017

---

## 📂 ESTRUTURA DE ARQUIVOS

```
/app/
├── backend/
│   ├── server.py              # API principal (1.200+ linhas)
│   ├── requirements.txt       # Dependências Python
│   ├── templates/
│   │   └── orcamento.html     # Template PDF
│   └── .env                   # Variáveis de ambiente
│
├── frontend/
│   ├── src/
│   │   ├── App.js            # Rotas principais
│   │   ├── pages/            # Todas as páginas
│   │   │   ├── LandingPage.jsx
│   │   │   ├── Dashboard.jsx
│   │   │   ├── Lancamentos.jsx
│   │   │   ├── ContasPagar.jsx
│   │   │   ├── ContasReceber.jsx
│   │   │   ├── CategoriasPersonalizadas.jsx
│   │   │   ├── Empresa.jsx
│   │   │   ├── MetaMensal.jsx
│   │   │   ├── Precificacao.jsx
│   │   │   ├── Orcamentos.jsx
│   │   │   ├── OrcamentoDetalhe.jsx
│   │   │   ├── Assinatura.jsx
│   │   │   └── AdminPanel.jsx
│   │   ├── components/
│   │   │   ├── Sidebar.jsx
│   │   │   ├── SubscriptionCard.jsx
│   │   │   ├── FinancialGlossary.jsx
│   │   │   ├── IntelligentAnalysis.jsx
│   │   │   └── ui/            # Componentes shadcn/ui
│   │   ├── index.js
│   │   ├── App.css
│   │   └── index.css
│   ├── package.json
│   ├── tailwind.config.js
│   └── .env
│
├── PROJECT_CONTEXT.md         # DOCUMENTAÇÃO COMPLETA DO PROJETO
└── PROMPT_CONTINUACAO.md      # Este arquivo
```

---

## 🔑 CREDENCIAIS E VARIÁVEIS DE AMBIENTE

### **Backend (.env):**
```env
MONGO_URL="mongodb://localhost:27017"
DB_NAME="test_database"
CORS_ORIGINS="*"
OPENAI_API_KEY="sk-emergent-93d93D7C9D71c3697B"
MERCADO_PAGO_ACCESS_TOKEN="APP_USR-6705196597871113-120123-f0a82b44af66b59779d8574222575717-65263838"
```

### **Frontend (.env):**
```env
REACT_APP_BACKEND_URL=https://[seu-dominio]/api
```

### **Credenciais de Acesso:**
- **Admin:** admin@lucroliquido.com / admin123

---

## 📊 FUNCIONALIDADES IMPLEMENTADAS (100%)

### **1. Autenticação & Multi-tenant:**
- ✅ Login/Registro
- ✅ Sistema de trial (7 dias)
- ✅ Multi-empresas por usuário
- ✅ Roles (admin/user)

### **2. Dashboard:**
- ✅ 7 componentes visuais
- ✅ Gráficos interativos (Recharts)
- ✅ KPIs principais
- ✅ **4 KPIs de Contas a Pagar/Receber**

### **3. Lançamentos Financeiros:**
- ✅ CRUD completo
- ✅ Tipos: Receita, Custo, Despesa
- ✅ **Categorias dinâmicas** por tipo
- ✅ Status: Previsto/Realizado
- ✅ Filtros avançados

### **4. Categorias Personalizadas:**
- ✅ Página de gestão
- ✅ Criar categorias por tipo
- ✅ Integração com lançamentos

### **5. Contas a Pagar e Receber:**
- ✅ 2 páginas completas
- ✅ CRUD com filtros
- ✅ Status: PENDENTE/PAGO/ATRASADO
- ✅ Integração automática com lançamentos
- ✅ Ações em lote
- ✅ Detecção de atraso

### **6. Dados da Empresa:**
- ✅ Página completa com 20 campos
- ✅ 3 cards (Dados, Endereço, Contatos)
- ✅ Máscaras (CNPJ, CEP, telefones)

### **7. Precificação:**
- ✅ Modo Produto (cálculo simples)
- ✅ **Modo Serviço por m²** (7 blocos completos):
  - Escopo do serviço
  - Mão de obra
  - Deslocamento
  - Alimentação
  - Materiais
  - Imprevistos
  - Tributos e lucro
- ✅ Resultado visual detalhado

### **8. Orçamentos (COMPLETO):**
- ✅ **Integração Precificação → Orçamento**
- ✅ Modal de criação (dados cliente + condições)
- ✅ Página de listagem com filtros
- ✅ Página de detalhe completa
- ✅ **Geração de PDF profissional** (HTML/CSS)
- ✅ **Envio por WhatsApp** (mensagem pronta)
- ✅ **Download de PDF**
- ✅ Sistema de status (RASCUNHO/ENVIADO/APROVADO/NÃO_APROVADO)
- ✅ Auditoria completa (timestamps)
- ✅ Numeração sequencial (LL-YYYY-NNNN)

### **9. Análises com IA:**
- ✅ Score de Saúde Financeira (0-100)
- ✅ Alertas Inteligentes
- ✅ Análise Completa

### **10. Glossário Financeiro:**
- ✅ 88 termos com IA
- ✅ Busca e favoritos

### **11. Meta Mensal:**
- ✅ Definir meta
- ✅ Progresso visual

### **12. Assinatura (PIX):**
- ✅ Mercado Pago integrado
- ✅ R$ 49,90/mês
- ✅ QR Code PIX

### **13. Admin Panel:**
- ✅ Dashboard admin
- ✅ Gestão de usuários
- ✅ Métricas do sistema

---

## 🎨 PADRÕES DE DESIGN

### **Tema:**
- Background: `bg-zinc-950` (dark)
- Cards: `bg-zinc-900` com `border-zinc-800`
- Texto: `text-white` / `text-zinc-400`

### **Gradientes:**
- Roxo → Azul: `from-purple-600 to-blue-600`
- Botões principais usam esse gradiente

### **Componentes UI:**
- Usa shadcn/ui components
- Cards com bordas coloridas laterais (l-4)
- Badges coloridos por status
- Toast notifications (Sonner)

### **Máscaras:**
```javascript
formatCNPJ() → 00.000.000/0000-00
formatCEP() → 00000-000
formatPhone() → (00) 00000-0000
```

---

## 🔄 COMANDOS ÚTEIS

### **Reiniciar Serviços:**
```bash
sudo supervisorctl restart backend
sudo supervisorctl restart frontend
sudo supervisorctl restart all
sudo supervisorctl status
```

### **Ver Logs:**
```bash
tail -n 50 /var/log/supervisor/backend.err.log
tail -n 50 /var/log/supervisor/frontend.err.log
```

### **Instalar Dependências:**
```bash
# Backend
cd /app/backend && pip install -r requirements.txt

# Frontend (SEMPRE usar yarn, NUNCA npm)
cd /app/frontend && yarn install
```

### **Testar APIs:**
```bash
# Login
curl -X POST http://localhost:8001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@lucroliquido.com","password":"admin123"}'

# Categorias
curl http://localhost:8001/api/categories

# Orçamentos
curl http://localhost:8001/api/orcamentos/{empresa_id}
```

---

## 🗄️ ESTRUTURA DO BANCO DE DADOS (MongoDB)

### **Collections:**

1. **users** - Usuários do sistema
2. **companies** - Empresas (multi-tenant)
3. **transactions** - Lançamentos financeiros
4. **contas** - Contas a pagar/receber
5. **custom_categories** - Categorias personalizadas
6. **orcamentos** - Orçamentos
7. **monthly_goals** - Metas mensais
8. **pricing** - Precificações
9. **subscriptions** - Assinaturas

### **Campos importantes:**
- Todos têm `id` (UUID v4)
- Multi-tenant: `company_id` + `user_id`
- Timestamps: `created_at` + `updated_at`

---

## 📡 ROTAS DE API PRINCIPAIS

### **Autenticação:**
- POST `/api/auth/register`
- POST `/api/auth/login`

### **Empresas:**
- POST `/api/companies`
- GET `/api/companies/{user_id}`
- GET `/api/company/{company_id}`
- PUT `/api/company/{company_id}`

### **Lançamentos:**
- POST `/api/transactions`
- GET `/api/transactions/{company_id}/{month}`
- PUT `/api/transactions/{id}`
- DELETE `/api/transactions/{id}`

### **Categorias:**
- GET `/api/categories?company_id={id}`
- POST `/api/custom-categories`
- GET `/api/custom-categories/{company_id}`
- PUT `/api/custom-categories/{id}`
- DELETE `/api/custom-categories/{id}`

### **Contas:**
- POST `/api/contas/pagar`
- GET `/api/contas/pagar?company_id={id}`
- PATCH `/api/contas/pagar/{id}/status`
- POST `/api/contas/receber`
- GET `/api/contas/receber?company_id={id}`
- PATCH `/api/contas/receber/{id}/status`
- GET `/api/contas/resumo-mensal?company_id={id}&mes={YYYY-MM}`

### **Orçamentos:**
- POST `/api/orcamentos`
- GET `/api/orcamentos/{empresa_id}`
- GET `/api/orcamento/{id}`
- PUT `/api/orcamento/{id}`
- DELETE `/api/orcamento/{id}`
- PATCH `/api/orcamento/{id}/status`
- **GET `/api/orcamento/{id}/pdf`** ← Gera PDF

### **Análises IA:**
- POST `/api/ai-analysis`
- POST `/api/financial-health-score`
- POST `/api/cost-alerts`

---

## 🎯 COMO COMEÇAR

### **1. Entender o Projeto:**
```
Por favor, leia PRIMEIRO o arquivo /app/PROJECT_CONTEXT.md 
que contém TODA a documentação completa do projeto.
```

### **2. Explorar o Código:**
```bash
# Ver estrutura
ls -la /app/backend/
ls -la /app/frontend/src/pages/

# Ver arquivo principal
cat /app/backend/server.py | head -100
cat /app/frontend/src/App.js
```

### **3. Verificar Status:**
```bash
sudo supervisorctl status
curl http://localhost:8001/api/categories
```

---

## 📝 REGRAS IMPORTANTES

### **🔴 NUNCA FAÇA:**
- ❌ Modificar URLs em `.env` (REACT_APP_BACKEND_URL, MONGO_URL)
- ❌ Usar `npm` (sempre usar `yarn`)
- ❌ Hardcodear URLs ou portas
- ❌ Deletar `.git` ou `.emergent`
- ❌ Usar ObjectId do MongoDB (sempre UUID)
- ❌ Modificar backend sem reiniciar: `sudo supervisorctl restart backend`

### **✅ SEMPRE FAÇA:**
- ✅ Ler `/app/PROJECT_CONTEXT.md` antes de implementar
- ✅ Usar máscaras para CNPJ, CEP, telefones
- ✅ Manter tema dark consistente
- ✅ Adicionar `data-testid` em elementos interativos
- ✅ Usar toast notifications (Sonner) para feedback
- ✅ Validar campos obrigatórios
- ✅ Testar APIs com curl antes de integrar frontend
- ✅ Usar componentes shadcn/ui
- ✅ Manter multi-tenant (company_id + user_id)
- ✅ Formatar valores em português (R$ 1.234,56)

---

## 🆕 ÚLTIMA IMPLEMENTAÇÃO REALIZADA

### **PDF de Orçamento Profissional:**
- Template HTML/CSS em `/app/backend/templates/orcamento.html`
- Layout moderno com gradiente roxo/azul
- 6 seções organizadas em cards
- Geração usando WeasyPrint
- Rota: `GET /api/orcamento/{id}/pdf`

**Status:** ✅ Implementado e funcionando

---

## 💡 COMO SOLICITAR NOVAS FUNCIONALIDADES

### **Template de Solicitação:**
```
FUNCIONALIDADE: [Nome da feature]

CONTEXTO:
[Explicar o que já existe e o que falta]

REQUISITOS:
1. [Requisito 1]
2. [Requisito 2]
...

INTEGRAÇÃO:
[Como deve se integrar com funcionalidades existentes]

EXEMPLO DE USO:
[Descrever fluxo do usuário]
```

---

## 📚 DOCUMENTAÇÃO ADICIONAL

### **Arquivo Principal:**
`/app/PROJECT_CONTEXT.md` - **LEIA ISTO PRIMEIRO!**

### **Bibliotecas Principais:**
- FastAPI: https://fastapi.tiangolo.com/
- React: https://react.dev/
- Tailwind: https://tailwindcss.com/
- shadcn/ui: https://ui.shadcn.com/
- Recharts: https://recharts.org/
- WeasyPrint: https://doc.courtbouillon.org/weasyprint/

---

## 🚀 EXEMPLO DE PROMPT PARA NOVA FUNCIONALIDADE

```
Olá! Estou trabalhando no Sistema Lucro Líquido.

Por favor, leia PRIMEIRO o arquivo /app/PROJECT_CONTEXT.md 
para entender completamente o projeto.

FUNCIONALIDADE SOLICITADA:
[Descreva aqui o que você quer implementar]

REQUISITOS:
[Liste os requisitos específicos]

Mantenha os padrões de código existentes e teste tudo antes de finalizar.
```

---

## ✅ CHECKLIST ANTES DE IMPLEMENTAR

- [ ] Li o `/app/PROJECT_CONTEXT.md`
- [ ] Entendi a stack tecnológica
- [ ] Explorei a estrutura de arquivos
- [ ] Verifiquei as credenciais de acesso
- [ ] Testei que backend/frontend estão rodando
- [ ] Entendi o padrão de design (tema dark)
- [ ] Sei usar os comandos do supervisor
- [ ] Li as regras de "NUNCA FAÇA" e "SEMPRE FAÇA"

---

## 📞 INFORMAÇÕES FINAIS

- **Projeto:** Sistema Lucro Líquido (SaaS de Gestão Financeira)
- **Status:** 100% funcional e pronto para produção
- **Modelo:** Assinatura R$ 49,90/mês (PIX)
- **Trial:** 7 dias automático
- **Público-alvo:** PMEs (comércio, serviço, indústria)

---

**🎯 OBJETIVO:**
Manter a qualidade do código, seguir os padrões estabelecidos e adicionar novas funcionalidades de forma profissional e bem documentada.

**🚀 BOA CONTINUAÇÃO NO PROJETO!**
