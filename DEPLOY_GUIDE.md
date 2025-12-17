# 📘 Guia Completo de Deploy - Sistema Lucro Líquido

## 📋 Índice
1. [Stack Tecnológica](#stack-tecnológica)
2. [Banco de Dados](#banco-de-dados)
3. [Requisitos do Servidor](#requisitos-do-servidor)
4. [Instalação Backend](#instalação-backend)
5. [Instalação Frontend](#instalação-frontend)
6. [Configuração de Ambiente](#configuração-de-ambiente)
7. [Deploy em Produção](#deploy-em-produção)
8. [Integrações de Terceiros](#integrações-de-terceiros)
9. [Troubleshooting](#troubleshooting)

---

## 🛠 Stack Tecnológica

### Backend
- **Linguagem**: Python 3.11.14
- **Framework**: FastAPI 0.110.1
- **Servidor ASGI**: Uvicorn 0.25.0
- **Banco de Dados Driver**: Motor 3.3.1 (MongoDB async)
- **Validação**: Pydantic 2.12.4

### Frontend
- **Linguagem**: JavaScript (Node.js 20.19.6)
- **Framework**: React 19.0.0
- **Roteamento**: React Router DOM 7.5.1
- **HTTP Client**: Axios 1.8.4
- **UI Components**: Radix UI + Shadcn UI
- **Estilização**: Tailwind CSS 3.4.17
- **Ícones**: Lucide React 0.507.0

### Banco de Dados
- **Sistema**: MongoDB 7.0.26
- **Nome do Banco**: `test_database` (renomear para produção)
- **Driver**: Motor (async) + PyMongo

---

## 💾 Banco de Dados

### Collections e Estrutura

```
test_database/
├── users                  # Usuários do sistema
├── companies             # Empresas cadastradas
├── subscriptions         # Assinaturas dos usuários
├── orcamentos            # Orçamentos gerados
├── orcamento_config      # Configurações de orçamento (cores, logo)
├── orcamento_materiais   # Materiais vinculados aos orçamentos
├── materiais             # Catálogo de materiais
├── contas                # Contas a pagar/receber
├── transactions          # Transações financeiras
├── monthly_goals         # Metas mensais
└── system_config         # Configurações globais do sistema
```

### Schema Principais

#### users
```json
{
  "id": "uuid",
  "name": "string",
  "email": "string",
  "password": "string (sem hash - implementar bcrypt)",
  "role": "user|admin",
  "created_at": "datetime"
}
```

#### companies
```json
{
  "id": "uuid",
  "user_id": "uuid",
  "name": "string",
  "razao_social": "string",
  "cnpj": "string",
  "logradouro": "string",
  "numero": "string",
  "bairro": "string",
  "cidade": "string",
  "estado": "string",
  "cep": "string",
  "telefone_fixo": "string",
  "celular_whatsapp": "string",
  "email_empresa": "string",
  "site": "string",
  "created_at": "datetime"
}
```

#### orcamentos
```json
{
  "id": "uuid",
  "empresa_id": "uuid",
  "numero_orcamento": "string (ex: LL-2025-0001)",
  "cliente_nome": "string",
  "cliente_documento": "string",
  "cliente_whatsapp": "string",
  "cliente_email": "string",
  "cliente_endereco": "string",
  "descricao_servico_ou_produto": "string",
  "preco_praticado": "float",
  "validade_proposta": "string",
  "prazo_execucao": "string",
  "condicoes_pagamento": "string",
  "status": "RASCUNHO|ENVIADO|APROVADO|NAO_APROVADO",
  "created_at": "datetime"
}
```

#### orcamento_config
```json
{
  "company_id": "uuid",
  "logo_url": "string (ex: /uploads/logo_xxx.jpg)",
  "cor_primaria": "string (hex, ex: #22c55e)",
  "cor_secundaria": "string (hex, ex: #f97316)",
  "texto_ciencia": "string",
  "texto_garantia": "string",
  "created_at": "datetime",
  "updated_at": "datetime"
}
```

---

## 💻 Requisitos do Servidor

### Mínimos
- **CPU**: 2 vCPUs
- **RAM**: 4 GB
- **Disco**: 20 GB SSD
- **SO**: Ubuntu 20.04+ ou similar

### Recomendados (Produção)
- **CPU**: 4 vCPUs
- **RAM**: 8 GB
- **Disco**: 50 GB SSD
- **SO**: Ubuntu 22.04 LTS

### Portas Necessárias
- **3000**: Frontend (desenvolvimento) ou **80/443** (produção)
- **8001**: Backend API
- **27017**: MongoDB (apenas local, não expor publicamente)

---

## 🔧 Instalação Backend

### 1. Clonar Repositório
```bash
git clone <seu-repositorio>
cd backend
```

### 2. Instalar Python 3.11+
```bash
sudo apt update
sudo apt install python3.11 python3.11-venv python3-pip
```

### 3. Criar Ambiente Virtual
```bash
python3.11 -m venv venv
source venv/bin/activate
```

### 4. Instalar Dependências
```bash
pip install --upgrade pip
pip install -r requirements.txt
```

### 5. Instalar emergentintegrations (se necessário)
```bash
pip install emergentintegrations --extra-index-url https://d33sy5i8bnduwe.cloudfront.net/simple/
```

### 6. Instalar MongoDB
```bash
# Ubuntu/Debian
wget -qO - https://www.mongodb.org/static/pgp/server-7.0.asc | sudo apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list
sudo apt update
sudo apt install -y mongodb-org

# Iniciar MongoDB
sudo systemctl start mongod
sudo systemctl enable mongod
```

### 7. Configurar Variáveis de Ambiente
Criar arquivo `.env` na pasta `backend/`:

```env
MONGO_URL=mongodb://localhost:27017
DB_NAME=lucro_liquido_prod
CORS_ORIGINS=*
BACKEND_URL=https://seu-dominio.com
OPENAI_API_KEY=sk-emergent-XXXX
MERCADO_PAGO_ACCESS_TOKEN=APP_USR-XXXX
```

### 8. Executar Backend
```bash
# Desenvolvimento
uvicorn server:app --host 0.0.0.0 --port 8001 --reload

# Produção (com Gunicorn)
pip install gunicorn
gunicorn server:app --workers 4 --worker-class uvicorn.workers.UvicornWorker --bind 0.0.0.0:8001
```

---

## 🎨 Instalação Frontend

### 1. Instalar Node.js 20+
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
```

### 2. Instalar Yarn (Recomendado)
```bash
npm install -g yarn
```

### 3. Instalar Dependências
```bash
cd frontend
yarn install
# ou: npm install
```

### 4. Configurar Variáveis de Ambiente
Criar arquivo `.env` na pasta `frontend/`:

```env
REACT_APP_BACKEND_URL=https://seu-dominio.com
WDS_SOCKET_PORT=443
REACT_APP_ENABLE_VISUAL_EDITS=false
ENABLE_HEALTH_CHECK=false
```

### 5. Build para Produção
```bash
yarn build
# ou: npm run build
```

### 6. Servir Build (Opção 1 - Serve)
```bash
npm install -g serve
serve -s build -l 3000
```

### 6. Servir Build (Opção 2 - Nginx)
```bash
sudo apt install nginx

# Copiar build para nginx
sudo cp -r build/* /var/www/html/

# Configurar nginx (ver seção Deploy em Produção)
```

---

## 🌐 Deploy em Produção

### Configuração Nginx (Recomendado)

Criar arquivo `/etc/nginx/sites-available/lucro-liquido`:

```nginx
server {
    listen 80;
    server_name seu-dominio.com;

    # Frontend
    location / {
        root /var/www/html;
        try_files $uri $uri/ /index.html;
    }

    # Backend API
    location /api/ {
        proxy_pass http://localhost:8001/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }

    # Uploads (Logos, Arquivos)
    location /uploads/ {
        proxy_pass http://localhost:8001/uploads/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
    }
}
```

Ativar configuração:
```bash
sudo ln -s /etc/nginx/sites-available/lucro-liquido /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### SSL com Let's Encrypt (Recomendado)
```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d seu-dominio.com
```

### Configurar Serviços Systemd

#### Backend Service
Criar `/etc/systemd/system/lucro-liquido-backend.service`:

```ini
[Unit]
Description=Lucro Líquido Backend API
After=network.target mongodb.service

[Service]
User=www-data
WorkingDirectory=/caminho/para/backend
Environment="PATH=/caminho/para/backend/venv/bin"
ExecStart=/caminho/para/backend/venv/bin/gunicorn server:app --workers 4 --worker-class uvicorn.workers.UvicornWorker --bind 0.0.0.0:8001
Restart=always

[Install]
WantedBy=multi-user.target
```

Ativar:
```bash
sudo systemctl daemon-reload
sudo systemctl enable lucro-liquido-backend
sudo systemctl start lucro-liquido-backend
```

---

## 🔐 Integrações de Terceiros

### 1. OpenAI (Análise IA, Alertas)
- **API Key**: Obter em https://platform.openai.com/api-keys
- **Configuração**: `.env` → `OPENAI_API_KEY=sk-...`
- **Uso**: Análise de saúde financeira, alertas inteligentes

### 2. Mercado Pago (Pagamentos)
- **Access Token**: Obter em https://www.mercadopago.com.br/developers
- **Configuração**: `.env` → `MERCADO_PAGO_ACCESS_TOKEN=APP_USR-...`
- **Uso**: Processamento de assinaturas

### 3. Emergent Integrations (Opcional)
- **Uso**: Integração unificada com OpenAI/Claude/Gemini
- **Configuração**: Já incluído no requirements.txt
- **Key**: Obter via `emergent_integrations_manager` tool

---

## 📦 Estrutura de Arquivos

```
/app/
├── backend/
│   ├── server.py              # Aplicação principal FastAPI
│   ├── requirements.txt       # Dependências Python
│   ├── .env                   # Variáveis de ambiente
│   └── uploads/              # Logos e arquivos enviados
│
├── frontend/
│   ├── public/               # Arquivos estáticos
│   ├── src/
│   │   ├── App.js           # Componente principal
│   │   ├── pages/           # Páginas da aplicação
│   │   └── components/      # Componentes reutilizáveis
│   ├── package.json         # Dependências Node
│   ├── .env                 # Variáveis de ambiente
│   └── build/              # Build de produção (gerado)
│
└── DEPLOY_GUIDE.md          # Este arquivo
```

---

## 🚨 Troubleshooting

### Backend não inicia
```bash
# Verificar logs
tail -f /var/log/syslog | grep lucro-liquido

# Testar manualmente
cd backend
source venv/bin/activate
python3 server.py
```

### MongoDB não conecta
```bash
# Verificar status
sudo systemctl status mongod

# Ver logs
sudo journalctl -u mongod -f

# Reiniciar
sudo systemctl restart mongod
```

### Frontend não carrega
```bash
# Verificar build
cd frontend
yarn build

# Testar localmente
serve -s build

# Ver logs do Nginx
sudo tail -f /var/log/nginx/error.log
```

### Uploads não aparecem
- Verificar permissões: `chmod 755 backend/uploads/`
- Verificar configuração Nginx para `/uploads/`
- Verificar variável `BACKEND_URL` no `.env`

---

## 📝 Checklist de Deploy

- [ ] MongoDB instalado e rodando
- [ ] Python 3.11+ instalado
- [ ] Node.js 20+ instalado
- [ ] Dependências backend instaladas
- [ ] Dependências frontend instaladas
- [ ] Arquivos `.env` configurados (backend e frontend)
- [ ] Build do frontend gerado
- [ ] Nginx configurado
- [ ] SSL/HTTPS configurado
- [ ] Serviços systemd configurados
- [ ] Firewall configurado (portas 80, 443)
- [ ] Backup do banco configurado
- [ ] Logs rotacionados

---

## 🆘 Suporte

Para dúvidas ou problemas:
1. Verificar logs do sistema
2. Consultar este guia
3. Verificar documentação das tecnologias utilizadas

---

**Última atualização**: Dezembro 2024
**Versão do Sistema**: 1.0.0
