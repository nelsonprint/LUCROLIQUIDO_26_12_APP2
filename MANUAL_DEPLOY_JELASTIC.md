# Manual de Deploy - Sistema Lucro Líquido
## Plataforma: Jelastic/SaveInCloud

---

## Índice
1. [Visão Geral da Arquitetura](#1-visão-geral-da-arquitetura)
2. [Pré-requisitos](#2-pré-requisitos)
3. [Criação do Ambiente no Jelastic](#3-criação-do-ambiente-no-jelastic)
4. [Configuração do MongoDB](#4-configuração-do-mongodb)
5. [Configuração do Backend](#5-configuração-do-backend)
6. [Configuração do Frontend](#6-configuração-do-frontend)
7. [Testes e Verificações](#7-testes-e-verificações)
8. [Troubleshooting](#8-troubleshooting)
9. [Comandos Úteis](#9-comandos-úteis)

---

## 1. Visão Geral da Arquitetura

O sistema utiliza 4 containers:

| Container | Tecnologia | Função | Porta |
|-----------|------------|--------|-------|
| **Load Balancer** | NGINX | Direciona tráfego | 80/443 |
| **Front** | Node.js 20.x | Interface React | 80 |
| **Backend** | Apache Python | API FastAPI | 80 |
| **Banco de Dados** | MongoDB | Armazenamento | 27017 |

### Fluxo de Comunicação:
```
Usuário → Load Balancer → Frontend (/) 
                       → Backend (/api/*)
                       
Backend → MongoDB (interno)
```

---

## 2. Pré-requisitos

### No Jelastic:
- Conta ativa no Jelastic/SaveInCloud
- Créditos suficientes para criar o ambiente

### Repositório:
- Código fonte no GitHub (público ou privado)
- Estrutura do repositório:
  ```
  LUCROLIQUIDO_26_12_APP2/
  ├── backend/
  │   ├── server.py
  │   ├── requirements.txt
  │   └── ...
  └── frontend/
      ├── src/
      ├── package.json
      └── ...
  ```

---

## 3. Criação do Ambiente no Jelastic

### 3.1. Criar Novo Ambiente
1. Acesse o painel Jelastic
2. Clique em **"Novo Ambiente"**
3. Configure os containers:

### 3.2. Load Balancer
- Selecione: **NGINX**
- Versão: 1.28.0 ou superior

### 3.3. Frontend (Node.js)
- Selecione: **Node.js**
- Versão: 20.x LTS
- Contexto: ROOT

### 3.4. Backend (Python)
- Selecione: **Apache Python**
- Versão: Python 3.11
- Contexto: ROOT

### 3.5. Banco de Dados
- Selecione: **NoSQL** → **MongoDB**
- Ou use **Imagem Docker**: digite `mongo` no Docker Hub

### 3.6. Definir Nome do Ambiente
- Nome: `lucro-teste` (ou outro de sua preferência)
- Domínio: `lucro-teste.sp1.br.saveincloud.net.br`

---

## 4. Configuração do MongoDB

### 4.1. Verificar IP Interno
No painel Jelastic, anote o **IP interno** do MongoDB.
Exemplo: `10.70.14.252`

### 4.2. Testar Conexão (via SSH no Backend)
```bash
# Conectar ao MongoDB
mongosh mongodb://10.70.14.252:27017

# Criar banco de dados
use lucroliquido

# Verificar
show dbs

# Sair
exit
```

---

## 5. Configuração do Backend

### 5.1. Deploy via Git
1. No painel Jelastic, clique no container **Backend**
2. Clique em **Implementações** → **Adicionar**
3. Preencha:
   - **URL:** `https://github.com/SEU_USUARIO/SEU_REPOSITORIO.git`
   - **Branch:** `main`
4. Clique em **Deploy**

### 5.2. Acessar via SSH
1. Clique no container **Backend** → **Web SSH**

### 5.3. Navegar até a Pasta do Backend
```bash
cd /var/www/webroot/ROOT/backend
ls -la
```

### 5.4. Criar Arquivo .env
```bash
cat > .env << 'EOF'
MONGO_URL=mongodb://10.70.14.252:27017
DB_NAME=lucroliquido
MERCADO_PAGO_ACCESS_TOKEN=SEU_TOKEN_MERCADO_PAGO
EOF
```

**Nota:** Substitua:
- `10.70.14.252` pelo IP do seu MongoDB
- `SEU_TOKEN_MERCADO_PAGO` pelo token real do Mercado Pago

### 5.5. Verificar .env
```bash
cat .env
```

### 5.6. Instalar Dependências
```bash
# Instalar pacote especial Emergent (se necessário)
pip install emergentintegrations --extra-index-url https://d33sy5i8bnduwe.cloudfront.net/simple/

# Instalar todas as dependências
pip install -r requirements.txt
```

### 5.7. Criar Arquivo WSGI
O Apache usa mod_wsgi para rodar Python. FastAPI é ASGI, então precisamos de um adaptador.

```bash
# Instalar adaptador
pip install a2wsgi

# Criar arquivo wsgi.py
cat > /var/www/webroot/ROOT/wsgi.py << 'EOF'
import sys
import os

sys.path.insert(0, '/var/www/webroot/ROOT/backend')
os.chdir('/var/www/webroot/ROOT/backend')

from dotenv import load_dotenv
load_dotenv('/var/www/webroot/ROOT/backend/.env')

from server import app
from a2wsgi import ASGIMiddleware
application = ASGIMiddleware(app)
EOF
```

### 5.8. Reiniciar Apache
```bash
sudo systemctl restart httpd
```

Ou no painel Jelastic: **Backend** → **Reiniciar**

### 5.9. Testar Backend
```bash
curl http://localhost/api/
```

**Resposta esperada:**
```json
{"status":"ok","message":"API funcionando!","version":"1.0"}
```

---

## 6. Configuração do Frontend

### 6.1. Deploy via Git
1. No painel Jelastic, clique no container **Front**
2. Clique em **Implementações** → **Adicionar**
3. Preencha:
   - **URL:** `https://github.com/SEU_USUARIO/SEU_REPOSITORIO.git`
   - **Branch:** `main`
4. Clique em **Deploy**

### 6.2. Acessar via SSH
1. Clique no container **Front** → **Web SSH**

### 6.3. Navegar até a Pasta do Frontend
```bash
cd /var/www/webroot/ROOT/frontend
```

Se não existir, clone manualmente:
```bash
cd /var/www
git clone https://github.com/SEU_USUARIO/SEU_REPOSITORIO.git app
cd /var/www/app/frontend
```

### 6.4. Criar Arquivo .env
```bash
cat > .env << 'EOF'
REACT_APP_BACKEND_URL=https://SEU_DOMINIO.sp1.br.saveincloud.net.br
EOF
```

**Nota:** Substitua `SEU_DOMINIO` pelo domínio do seu ambiente.

### 6.5. Instalar Dependências
```bash
npm install
```

### 6.6. Build de Produção
```bash
npm run build
```

### 6.7. Copiar Build para Pasta Pública
```bash
cp -r build/* /var/www/html/
```

Ou configure o servidor para apontar para a pasta build.

---

## 7. Testes e Verificações

### 7.1. Testar Backend Internamente
```bash
# No container Backend
curl http://localhost/api/
```

### 7.2. Testar Backend Externamente
```
https://SEU_DOMINIO.sp1.br.saveincloud.net.br/api/
```

### 7.3. Testar Frontend
```
https://SEU_DOMINIO.sp1.br.saveincloud.net.br/
```

### 7.4. Verificar Conexão com MongoDB
```bash
# No container Backend
curl http://localhost/api/health
```

### 7.5. Credenciais Padrão
- **Email:** `admin@lucroliquido.com`
- **Senha:** `admin123`

---

## 8. Troubleshooting

### 8.1. Erro 500 Internal Server Error

**Verificar logs:**
```bash
tail -100 /var/log/httpd/error_log
```

**Causas comuns:**
- Arquivo `.env` com formato errado
- Dependências não instaladas
- Erro de sintaxe no `wsgi.py`

### 8.2. Arquivo .env com Formato Errado

**Formato CORRETO:**
```
MONGO_URL=mongodb://10.70.14.252:27017
DB_NAME=lucroliquido
MERCADO_PAGO_ACCESS_TOKEN=TOKEN_AQUI
```

**Formato ERRADO:**
```
MONGO_URL=mongodb://10.70.14.252:27017 DB_NAME=lucroliquido
```

Cada variável deve estar em uma linha separada!

### 8.3. Erro de Conexão MongoDB

**Verificar IP:**
```bash
cat /var/www/webroot/ROOT/backend/.env
```

**Testar conexão:**
```bash
curl http://IP_MONGODB:27017
```

### 8.4. Erro "pip not found"

```bash
# Verificar Python
python3 --version

# Usar pip com python
python3 -m pip install -r requirements.txt
```

### 8.5. Erro "git not found"

```bash
# CentOS/RHEL
yum install git -y

# Ubuntu/Debian
apt install git -y
```

### 8.6. Apache Não Inicia

```bash
# Verificar status
systemctl status httpd

# Ver erros
journalctl -xe

# Reiniciar
sudo systemctl restart httpd
```

### 8.7. Erro de Permissão

```bash
# Dar permissão aos arquivos
chmod -R 755 /var/www/webroot/ROOT/
chown -R apache:apache /var/www/webroot/ROOT/
```

---

## 9. Comandos Úteis

### Logs
```bash
# Logs do Apache (erro)
tail -f /var/log/httpd/error_log

# Logs do Apache (acesso)
tail -f /var/log/httpd/access_log
```

### Serviços
```bash
# Status do Apache
systemctl status httpd

# Reiniciar Apache
sudo systemctl restart httpd

# Parar Apache
sudo systemctl stop httpd

# Iniciar Apache
sudo systemctl start httpd
```

### Verificações
```bash
# Verificar portas em uso
netstat -tlnp | grep 80

# Verificar processos Python
ps aux | grep python

# Testar API localmente
curl http://localhost/api/
```

### Arquivos Importantes
```
/var/www/webroot/ROOT/backend/.env     # Variáveis de ambiente
/var/www/webroot/ROOT/wsgi.py          # Adaptador WSGI
/var/www/webroot/ROOT/backend/server.py # API principal
/etc/httpd/conf.d/wsgi.conf            # Configuração WSGI
```

---

## Resumo Rápido do Deploy

### Backend:
1. Deploy via Git no Jelastic
2. SSH → Backend
3. `cd /var/www/webroot/ROOT/backend`
4. Criar `.env` com MONGO_URL, DB_NAME, MERCADO_PAGO_ACCESS_TOKEN
5. `pip install -r requirements.txt`
6. `pip install a2wsgi`
7. Criar `/var/www/webroot/ROOT/wsgi.py`
8. Reiniciar Apache
9. Testar: `curl http://localhost/api/`

### Frontend:
1. Deploy via Git no Jelastic
2. SSH → Front
3. `cd /var/www/webroot/ROOT/frontend`
4. Criar `.env` com REACT_APP_BACKEND_URL
5. `npm install`
6. `npm run build`
7. Copiar build para pasta pública

---

## Contato e Suporte

**Data de criação:** 28/12/2025
**Versão:** 1.0

---

*Este manual foi criado com base no deploy realizado na plataforma Jelastic/SaveInCloud.*
