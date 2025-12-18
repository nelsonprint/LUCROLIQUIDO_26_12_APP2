# 🗄️ Configuração do Banco de Dados - MongoDB

## Visão Geral
O sistema utiliza **MongoDB** como banco de dados NoSQL.

---

## 🚀 Opções de Hospedagem

### Opção 1: MongoDB Atlas (Recomendado) ⭐

**Vantagens:** Gratuito até 512MB, fácil configuração, backups automáticos.

#### Passo a Passo:

1. **Criar conta:** [mongodb.com/atlas](https://www.mongodb.com/atlas)

2. **Criar Cluster:**
   - Clique em "Build a Database"
   - Escolha "FREE" (M0 Sandbox)
   - Selecione região mais próxima (São Paulo recomendado)
   - Clique "Create Cluster"

3. **Configurar Acesso:**
   - Database Access > Add New Database User
   - Crie usuário e senha (ANOTE!)
   - Network Access > Add IP Address
   - Clique "Allow Access from Anywhere" (0.0.0.0/0)

4. **Obter Connection String:**
   - Clique "Connect" no cluster
   - Escolha "Connect your application"
   - Copie a string:
   ```
   mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/<dbname>?retryWrites=true&w=majority
   ```

5. **Configurar no Backend:**
   ```env
   MONGO_URL=mongodb+srv://seuusuario:suasenha@cluster0.xxxxx.mongodb.net/lucro_liquido?retryWrites=true&w=majority
   DB_NAME=lucro_liquido
   ```

---

### Opção 2: MongoDB em VPS

```bash
# Ubuntu/Debian
wget -qO - https://www.mongodb.org/static/pgp/server-7.0.asc | sudo apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list
sudo apt update
sudo apt install -y mongodb-org

# Iniciar serviço
sudo systemctl start mongod
sudo systemctl enable mongod

# Criar usuário admin
mongosh
use admin
db.createUser({
  user: "admin",
  pwd: "senha_segura",
  roles: [{ role: "root", db: "admin" }]
})
```

**Configurar autenticação** em `/etc/mongod.conf`:
```yaml
security:
  authorization: enabled

net:
  port: 27017
  bindIp: 0.0.0.0  # Cuidado: expõe para internet
```

---

### Opção 3: Docker

```yaml
# docker-compose.yml
version: '3.8'
services:
  mongodb:
    image: mongo:7.0
    container_name: mongodb
    restart: always
    ports:
      - "27017:27017"
    environment:
      MONGO_INITDB_ROOT_USERNAME: admin
      MONGO_INITDB_ROOT_PASSWORD: senha_segura
      MONGO_INITDB_DATABASE: lucro_liquido
    volumes:
      - mongodb_data:/data/db

volumes:
  mongodb_data:
```

```bash
docker-compose up -d
```

---

## 📊 Estrutura do Banco de Dados

### Coleções (Collections)

| Coleção | Descrição |
|---------|------------|
| `users` | Usuários do sistema |
| `companies` | Empresas cadastradas |
| `clientes` | Clientes das empresas (PF/PJ) |
| `orcamentos` | Orçamentos gerados |
| `orcamento_configs` | Configurações de orçamento |
| `materials` | Materiais cadastrados |
| `contas` | Contas a pagar/receber |
| `transactions` | Transações financeiras |
| `categories` | Categorias de transações |
| `metas` | Metas mensais |

---

## 🔧 Scripts de Inicialização

### Criar índices (performance)
```javascript
// Executar no mongosh
use lucro_liquido

// Índices para users
db.users.createIndex({ "email": 1 }, { unique: true })

// Índices para clientes
db.clientes.createIndex({ "empresa_id": 1 })
db.clientes.createIndex({ "cpf": 1 })
db.clientes.createIndex({ "cnpj": 1 })

// Índices para orcamentos
db.orcamentos.createIndex({ "empresa_id": 1 })
db.orcamentos.createIndex({ "numero_orcamento": 1 })

// Índices para transações
db.transactions.createIndex({ "company_id": 1, "date": -1 })
```

### Criar usuário admin inicial
```javascript
use lucro_liquido

db.users.insertOne({
  id: "admin-001",
  email: "admin@suaempresa.com",
  password_hash: "$2b$12$...",  // Use bcrypt para gerar
  name: "Administrador",
  is_admin: true,
  is_active: true,
  created_at: new Date()
})
```

---

## 🔒 Segurança

### Boas Práticas:

1. **Nunca exponha MongoDB diretamente na internet** sem autenticação
2. **Use senhas fortes** (mínimo 16 caracteres)
3. **Configure firewall** para permitir apenas IPs necessários
4. **Ative SSL/TLS** para conexões criptografadas
5. **Faça backups regulares**

### Backup com mongodump:
```bash
# Backup
mongodump --uri="mongodb+srv://user:pass@cluster.mongodb.net/lucro_liquido" --out=/backups/$(date +%Y%m%d)

# Restore
mongorestore --uri="mongodb+srv://user:pass@cluster.mongodb.net/lucro_liquido" /backups/20241217
```

---

## ✅ Checklist de Configuração

- [ ] Criar cluster/instância MongoDB
- [ ] Configurar usuário e senha
- [ ] Liberar IPs de acesso
- [ ] Testar conexão com `mongosh`
- [ ] Criar banco de dados `lucro_liquido`
- [ ] Criar índices para performance
- [ ] Configurar backups automáticos
- [ ] Atualizar `MONGO_URL` no backend
- [ ] Testar conexão do backend
