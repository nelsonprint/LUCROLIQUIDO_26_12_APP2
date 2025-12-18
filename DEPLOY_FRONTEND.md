# 🎨 Deploy do Frontend - Lucro Líquido

## Visão Geral
O frontend é uma aplicação **React** com Tailwind CSS e shadcn/ui.

---

## 📁 Estrutura de Arquivos Necessários

```
frontend/
├── public/             # Arquivos estáticos
├── src/
│   ├── components/     # Componentes React
│   ├── pages/          # Páginas da aplicação
│   ├── App.js          # Componente principal
│   └── index.js        # Ponto de entrada
├── package.json        # Dependências
├── tailwind.config.js  # Configuração Tailwind
├── craco.config.js     # Configuração CRACO
└── .env                # Variáveis de ambiente
```

---

## 🚀 Opções de Deploy

### Opção 1: Vercel (Recomendado)
1. Crie uma conta em [vercel.com](https://vercel.com)
2. Importe o repositório GitHub
3. Configure:
   - Framework Preset: **Create React App**
   - Root Directory: `frontend`
   - Build Command: `yarn build`
   - Output Directory: `build`
4. Adicione a variável de ambiente:
   - `REACT_APP_BACKEND_URL` = URL do seu backend

### Opção 2: Netlify
1. Crie uma conta em [netlify.com](https://netlify.com)
2. New site from Git
3. Configure:
   - Base directory: `frontend`
   - Build command: `yarn build`
   - Publish directory: `frontend/build`
4. Environment variables:
   - `REACT_APP_BACKEND_URL` = URL do seu backend

### Opção 3: Build Estático (Nginx)
```bash
# Gerar build de produção
cd frontend
yarn install
yarn build

# Copiar para servidor
scp -r build/* usuario@servidor:/var/www/html/
```

**Configuração Nginx:**
```nginx
server {
    listen 80;
    server_name seu-dominio.com;
    root /var/www/html;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # Proxy para API (opcional)
    location /api {
        proxy_pass http://localhost:8001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### Opção 4: Docker
```dockerfile
# Dockerfile
FROM node:18-alpine as build

WORKDIR /app

COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile

COPY . .

ARG REACT_APP_BACKEND_URL
ENV REACT_APP_BACKEND_URL=$REACT_APP_BACKEND_URL

RUN yarn build

# Servir com Nginx
FROM nginx:alpine
COPY --from=build /app/build /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

---

## ⚙️ Variáveis de Ambiente

```env
# Obrigatória - URL completa do backend com /api
REACT_APP_BACKEND_URL=https://seu-backend.com/api
```

**IMPORTANTE:** No React, variáveis devem começar com `REACT_APP_`

---

## 📦 Comandos Úteis

```bash
# Instalar dependências
yarn install

# Rodar em desenvolvimento
yarn start

# Gerar build de produção
yarn build

# Verificar erros de lint
yarn lint
```

---

## 🔧 Configurações Importantes

### Atualizar URL do Backend
No arquivo `src/App.js`, verifique a configuração do axios:
```javascript
export const axiosInstance = axios.create({
  baseURL: process.env.REACT_APP_BACKEND_URL,
});
```

---

## ✅ Checklist de Deploy

- [ ] Definir `REACT_APP_BACKEND_URL` corretamente
- [ ] Executar `yarn build` sem erros
- [ ] Testar todas as rotas após deploy
- [ ] Verificar se API está acessível (CORS)
- [ ] Configurar domínio personalizado
- [ ] Ativar HTTPS
- [ ] Testar login e funcionalidades principais
