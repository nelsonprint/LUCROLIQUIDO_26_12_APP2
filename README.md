# 💰 Lucro Líquido - Sistema de Gestão Financeira SaaS

Sistema completo de gestão financeira desenvolvido com FastAPI (Backend) e React (Frontend), incluindo módulo de orçamentos profissionais, análise de IA e controle de contas.

## 🎯 Funcionalidades Principais

### 📊 Gestão Financeira
- Dashboard com métricas em tempo real
- Contas a pagar e receber
- Lançamentos financeiros
- Metas mensais
- Análise de saúde financeira com IA
- Alertas inteligentes

### 📝 Módulo de Orçamentos
- Criação de orçamentos profissionais
- Personalização com logo e cores da empresa
- Catálogo de materiais
- Geração de PDF/HTML estilizado
- Envio via WhatsApp
- Acompanhamento de status (Rascunho, Enviado, Aprovado)

### 💎 Sistema de Assinaturas
- Trial de 7 dias
- Planos Básico, Profissional e Premium
- Integração com Mercado Pago
- Gestão de usuários e empresas

### 🤖 Inteligência Artificial
- Score de saúde financeira
- Alertas personalizados
- Análise de padrões de gastos
- Recomendações inteligentes

## 🛠 Tecnologias Utilizadas

### Backend
- **FastAPI** 0.110.1 - Framework web moderno e rápido
- **Python** 3.11.14
- **MongoDB** 7.0.26 - Banco de dados NoSQL
- **Motor** 3.3.1 - Driver async para MongoDB
- **Pydantic** 2.12.4 - Validação de dados
- **ReportLab** 4.4.5 - Geração de PDFs
- **OpenAI API** - Integração de IA

### Frontend
- **React** 19.0.0 - Biblioteca UI
- **React Router** 7.5.1 - Roteamento
- **Tailwind CSS** 3.4.17 - Framework CSS
- **Shadcn UI** - Componentes UI
- **Axios** 1.8.4 - Cliente HTTP
- **Lucide React** - Ícones

## 📦 Instalação

### Pré-requisitos
- Python 3.11+
- Node.js 20+
- MongoDB 7.0+
- Git

### Passos Rápidos

1. **Clone o repositório**
```bash
git clone <seu-repositorio>
cd lucro-liquido
```

2. **Backend**
```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env  # Configurar variáveis
uvicorn server:app --reload --port 8001
```

3. **Frontend**
```bash
cd frontend
yarn install  # ou npm install
cp .env.example .env  # Configurar variáveis
yarn start  # ou npm start
```

4. **MongoDB**
```bash
# Iniciar MongoDB
sudo systemctl start mongod
```

## 🔐 Configuração

### Backend (.env)
```env
MONGO_URL=mongodb://localhost:27017
DB_NAME=lucro_liquido
CORS_ORIGINS=*
BACKEND_URL=http://localhost:8001
OPENAI_API_KEY=sk-...
MERCADO_PAGO_ACCESS_TOKEN=APP_USR-...
```

### Frontend (.env)
```env
REACT_APP_BACKEND_URL=http://localhost:8001
```

## 📚 Documentação

- **[Guia de Deploy Completo](DEPLOY_GUIDE.md)** - Instruções detalhadas para produção
- **API Docs**: http://localhost:8001/docs (Swagger UI automático)

## 🚀 Deploy em Produção

Consulte o arquivo [DEPLOY_GUIDE.md](DEPLOY_GUIDE.md) para instruções completas de deploy em servidores como:
- SaveInCloud
- DigitalOcean
- AWS
- Heroku
- Vercel (Frontend) + Railway (Backend)

## 📊 Estrutura do Banco de Dados

### Collections
- `users` - Usuários do sistema
- `companies` - Empresas cadastradas
- `subscriptions` - Assinaturas
- `orcamentos` - Orçamentos gerados
- `orcamento_config` - Configurações (logo, cores)
- `materiais` - Catálogo de materiais
- `contas` - Contas a pagar/receber
- `transactions` - Transações financeiras
- `monthly_goals` - Metas mensais

## 🤝 Contribuindo

Contribuições são bem-vindas! Por favor:

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📝 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

## 👥 Autores

- **Desenvolvedor Principal** - Sistema desenvolvido com E1 Agent (Emergent Labs)

## 🆘 Suporte

Para suporte, envie um email para suporte@lucroliquido.com ou abra uma issue no GitHub.

## 🔄 Changelog

### v1.0.0 (Dezembro 2024)
- ✅ Sistema completo de gestão financeira
- ✅ Módulo de orçamentos profissionais
- ✅ Geração de PDF/HTML personalizável
- ✅ Integração com WhatsApp
- ✅ Sistema de assinaturas
- ✅ Análise de IA
- ✅ Logo 150x150px em Base64
- ✅ Dados da empresa em 3 linhas
- ✅ Rodapé com Nome / Telefone / Email / Site

## 🗺 Roadmap

- [ ] App Mobile (React Native)
- [ ] Integração com bancos via Open Banking
- [ ] Exportação para Excel avançada
- [ ] Relatórios personalizados
- [ ] Multi-idioma (i18n)
- [ ] Modo escuro/claro
- [ ] Notificações push
- [ ] Backup automático

## ⚙️ Requisitos do Sistema

### Desenvolvimento
- CPU: 2 cores
- RAM: 4 GB
- Disco: 10 GB

### Produção (Recomendado)
- CPU: 4 cores
- RAM: 8 GB
- Disco: 50 GB SSD
- Banda: 100 Mbps

## 🔒 Segurança

- [ ] **TODO**: Implementar hash de senhas (bcrypt)
- [ ] **TODO**: Implementar JWT para autenticação
- [ ] **TODO**: Rate limiting nas APIs
- [ ] **TODO**: Validação de CSRF
- [ ] **TODO**: Sanitização de inputs

## 📞 Contato

- Website: https://lucroliquido.com
- Email: contato@lucroliquido.com
- WhatsApp: +55 (54) 98112-5628

---

**⭐ Se este projeto foi útil, considere dar uma estrela no GitHub!**
