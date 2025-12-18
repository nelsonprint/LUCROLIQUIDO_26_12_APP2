# 🔧 Deploy do Backend - Lucro Líquido

## Visão Geral
O backend é uma API REST construída com **FastAPI** (Python 3.11+).

---

## 📁 Estrutura de Arquivos Necessários

```
backend/
├── server.py           # Arquivo principal da aplicação
├── requirements.txt    # Dependências Python
├── .env               # Variáveis de ambiente (NÃO COMMITAR!)
├── .env.example       # Template das variáveis
├── templates/         # Templates HTML (para emails, etc.)
└── uploads/           # Pasta para uploads de arquivos
```

---

## 🚀 Opções de Deploy

### Opção 1: Railway
1. Crie uma conta em [railway.app](https://railway.app)
2. Conecte seu repositório GitHub
3. Configure as variáveis de ambiente
4. Deploy automático!

### Opção 2: Render
1. Crie uma conta em [render.com](https://render.com)
2. Novo > Web Service
3. Conecte o repositório
4. Configure:
   - Build Command: `pip install -r requirements.txt`
   - Start Command: `uvicorn server:app --host 0.0.0.0 --port $PORT`

### Opção 3: VPS (DigitalOcean, AWS, etc.)
```bash
# Instalar dependências
sudo apt update
sudo apt install python3.11 python3.11-venv nginx

# Criar ambiente virtual
python3.11 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Rodar com Gunicorn
pip install gunicorn
gunicorn server:app -w 4 -k uvicorn.workers.UvicornWorker -b 0.0.0.0:8001
```

### Opção 4: Docker
```dockerfile
# Dockerfile
FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Criar pasta de uploads
RUN mkdir -p uploads

EXPOSE 8001

CMD ["uvicorn", "server:app", "--host", "0.0.0.0", "--port", "8001"]
```

---

## ⚙️ Variáveis de Ambiente Necessárias

```env
# Obrigatórias
MONGO_URL=mongodb+srv://<user>:<password>@cluster.mongodb.net/<dbname>
DB_NAME=lucro_liquido_prod
CORS_ORIGINS=https://seu-frontend.com
BACKEND_URL=https://seu-backend.com

# Opcionais (se usar os recursos)
OPENAI_API_KEY=sk-xxx
MERCADO_PAGO_ACCESS_TOKEN=APP_USR-xxx
```

---

## 🔒 Configuração de CORS

No `server.py`, atualize o CORS para seu domínio:
```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://seu-frontend.com"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

---

## 📝 Endpoints Principais

| Método | Endpoint | Descrição |
|--------|----------|------------|
| POST | /api/auth/login | Login |
| POST | /api/auth/register | Cadastro |
| GET | /api/companies/{user_id} | Listar empresas |
| GET | /api/clientes/{empresa_id} | Listar clientes |
| POST | /api/clientes | Criar cliente |
| POST | /api/orcamentos | Criar orçamento |
| GET | /api/orcamento/{id}/html | Gerar HTML do orçamento |

---

## ✅ Checklist de Deploy

- [ ] Configurar MongoDB externo (Atlas recomendado)
- [ ] Definir variáveis de ambiente
- [ ] Configurar CORS corretamente
- [ ] Criar pasta `uploads/` com permissões de escrita
- [ ] Testar endpoint de saúde: `GET /api/health`
- [ ] Configurar HTTPS (SSL)
