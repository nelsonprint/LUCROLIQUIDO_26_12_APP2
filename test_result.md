# Test Results - App do Vendedor

## Última Atualização: $(date +%Y-%m-%d)

### Implementações Concluídas:

1. **Correção Cirúrgica na Comissão do Vendedor**
   - A comissão agora incide SOMENTE sobre SERVIÇOS (não sobre materiais)
   - Lógica em `server.py` linhas 1704-1761
   - Base de cálculo: `detalhes_itens.totals.services_total`
   - Fallback para orçamentos antigos: usa `preco_praticado`

2. **App do Vendedor (PWA) - NOVO**
   - URL: `/api/vendedor/app`
   - Manifest: `/api/vendedor/manifest.json`
   - Tema: Laranja (#FF7A00)
   - Funcionalidades:
     - Login com email/senha do funcionário vendedor
     - Dashboard com KPIs (comissão liberada, pendente, total orçamentos)
     - Lista de orçamentos do vendedor
     - Lista de comissões (pendentes/pagas)
     - Agenda de visitas
     - Criar pré-orçamento com foto

3. **Endpoints do Vendedor (Backend)**
   - `POST /api/vendedor/login` - Login
   - `GET /api/vendedor/{vendedor_id}/orcamentos` - Listar orçamentos
   - `GET /api/vendedor/{vendedor_id}/comissoes` - Listar comissões
   - `POST /api/vendedor/{vendedor_id}/comissao/{id}/pagar` - Marcar como paga
   - `GET /api/vendedor/{vendedor_id}/agenda` - Listar agenda
   - `POST /api/vendedor/{vendedor_id}/agenda` - Criar visita
   - `PUT /api/vendedor/{vendedor_id}/agenda/{id}` - Atualizar visita
   - `DELETE /api/vendedor/{vendedor_id}/agenda/{id}` - Excluir visita
   - `GET /api/vendedor/{vendedor_id}/pre-orcamentos` - Listar pré-orçamentos
   - `POST /api/vendedor/{vendedor_id}/pre-orcamento` - Criar pré-orçamento
   - `POST /api/vendedor/upload/media` - Upload de mídia
   - `GET /api/funcionario/{id}/link-vendedor` - Gerar link WhatsApp

4. **Frontend (Sistema Mãe)**
   - Botão "Enviar Link do App" diferenciado para Vendedor (laranja) vs Supervisor (azul)
   - Função `handleEnviarLinkVendedor` adicionada em Funcionarios.jsx

### Testar:

1. **Login no App do Vendedor**
   - Acessar `/api/vendedor/app`
   - Criar um funcionário com categoria "Vendedor" e login configurado
   - Testar login com essas credenciais

2. **Fluxo de Comissão**
   - Criar orçamento com vendedor e itens de serviço + materiais
   - Aprovar orçamento
   - Verificar se comissão foi gerada APENAS sobre os serviços

3. **Agenda e Pré-Orçamento**
   - Criar visita no app
   - Criar pré-orçamento com foto

### Credenciais:
- Admin: admin@lucroliquido.com / admin123
- Vendedor: (criar na página de funcionários com categoria "Vendedor")

### Observações:
- O App do Vendedor está 100% diferente do App do Supervisor
- A tela do vendedor tem: Orçamentos, Comissões, Agenda
- A tela do supervisor tem: Cronograma de obra, Etapas, Mídias
