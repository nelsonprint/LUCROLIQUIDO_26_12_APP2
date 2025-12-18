# 📋 Estrutura Completa do Sistema de Orçamentos

## 🏗️ Arquitetura Geral

```
┌─────────────────────────────────────────────────────────────────┐
│                     SISTEMA DE ORÇAMENTOS                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐       │
│  │ Precificacao │───▶│  Orcamentos  │───▶│OrcamentoDetalhe│     │
│  │  (criar)     │    │  (listar)    │    │ (visualizar) │       │
│  └──────────────┘    └──────────────┘    └──────────────┘       │
│         │                   │                    │               │
│         │                   ▼                    │               │
│         │            ┌──────────────┐            │               │
│         └───────────▶│EditarOrcamento│◀──────────┘               │
│                      │  (editar)    │                            │
│                      └──────────────┘                            │
│                             │                                    │
│                             ▼                                    │
│                      ┌──────────────┐                            │
│                      │ Config. Orç. │                            │
│                      │(personalizar)│                            │
│                      └──────────────┘                            │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📁 Arquivos do Frontend

### 1. **Precificacao.jsx** - Criação de Orçamento
**Caminho:** `/app/frontend/src/pages/Precificacao.jsx`
**Tamanho:** ~91KB (1700+ linhas)

**Funcionalidades:**
- Calculadora de preço de serviço (por m², por hora, valor fechado)
- Calculadora de preço de produto
- Modal para gerar orçamento
- **NOVO:** Integração com módulo de clientes (dropdown + cadastro rápido)

**Fluxo:**
1. Usuário preenche dados do serviço/produto
2. Sistema calcula custos e preço sugerido
3. Usuário clica em "Gerar Orçamento"
4. Modal abre para preencher dados do cliente e condições
5. Orçamento é salvo no banco de dados

---

### 2. **Orcamentos.jsx** - Listagem de Orçamentos
**Caminho:** `/app/frontend/src/pages/Orcamentos.jsx`
**Tamanho:** ~12KB (296 linhas)

**Funcionalidades:**
- Tabela com todos os orçamentos da empresa
- Filtros por status e nome do cliente
- Ações rápidas: Visualizar, Editar, Download PDF, WhatsApp, Excluir
- Badges de status (Rascunho, Enviado, Aprovado, Não Aprovado)

**Colunas da Tabela:**
| Coluna | Descrição |
|--------|-----------|
| Número | Número do orçamento (ORC-001) |
| Cliente | Nome do cliente |
| Descrição | Descrição do serviço/produto |
| Valor | Preço praticado |
| Status | Badge colorido |
| Data | Data de criação |
| Ações | Botões de ação |

---

### 3. **OrcamentoDetalhe.jsx** - Visualização Detalhada
**Caminho:** `/app/frontend/src/pages/OrcamentoDetalhe.jsx`
**Tamanho:** ~14KB (384 linhas)

**Funcionalidades:**
- Visualização completa do orçamento
- Botões de ação: Editar, Visualizar HTML, Download PDF, WhatsApp
- Alterar status (Aprovado/Não Aprovado)
- Histórico de datas (criação, envio, aprovação)

**Seções:**
1. Dados do Cliente (nome, documento, contato, endereço)
2. Descrição do Serviço/Produto
3. Valores (custo, preço mínimo, valor praticado)
4. Condições Comerciais (validade, prazo, pagamento)
5. Histórico

---

### 4. **EditarOrcamento.jsx** - Edição de Orçamento
**Caminho:** `/app/frontend/src/pages/EditarOrcamento.jsx`
**Tamanho:** ~17KB (449 linhas)

**Funcionalidades:**
- Editar todos os campos do orçamento
- Gerenciar materiais do orçamento
- Recalcular valores totais

**Seções Editáveis:**
1. Dados do Cliente
2. Descrição do Serviço/Produto
3. Materiais (componente OrcamentoMateriais)
4. Valores
5. Condições Comerciais

---

### 5. **ConfiguracaoOrcamento.jsx** - Personalização
**Caminho:** `/app/frontend/src/pages/ConfiguracaoOrcamento.jsx`
**Tamanho:** ~13KB (311 linhas)

**Funcionalidades:**
- Upload de logo da empresa
- Definir cores do PDF (gradiente)
- Personalizar textos (ciência, garantia)

---

## 🔌 Endpoints da API (Backend)

### CRUD de Orçamentos

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| POST | `/api/orcamentos` | Criar novo orçamento |
| GET | `/api/orcamentos/{empresa_id}` | Listar orçamentos da empresa |
| GET | `/api/orcamento/{orcamento_id}` | Buscar orçamento específico |
| PUT | `/api/orcamento/{orcamento_id}` | Atualizar orçamento |
| DELETE | `/api/orcamento/{orcamento_id}` | Excluir orçamento |
| PATCH | `/api/orcamento/{orcamento_id}/status` | Atualizar status |

### Geração de Documentos

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/api/orcamento/{id}/pdf` | Gerar PDF do orçamento |
| GET | `/api/orcamento/{id}/html` | Gerar HTML para visualização |

### Compartilhamento

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| POST | `/api/orcamento/{id}/whatsapp` | Preparar envio por WhatsApp |
| GET | `/api/orcamento/share/{token}` | Acessar orçamento por link público |

### Materiais do Orçamento

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| POST | `/api/orcamentos/{id}/materiais` | Adicionar material |
| GET | `/api/orcamentos/{id}/materiais` | Listar materiais |
| DELETE | `/api/orcamentos/{id}/materiais/{material_id}` | Remover material |

### Configurações

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/api/orcamento-config/{company_id}` | Buscar configurações |
| POST | `/api/orcamento-config` | Salvar configurações |

---

## 💾 Estrutura do Banco de Dados (MongoDB)

### Coleção: `orcamentos`

```javascript
{
  "id": "uuid-gerado",
  "numero_orcamento": "ORC-001",
  "empresa_id": "uuid-empresa",
  "usuario_id": "uuid-usuario",
  
  // Tipo de orçamento
  "tipo": "servico_m2" | "servico_hora" | "produto" | "valor_fechado",
  
  // Dados do Cliente
  "cliente_nome": "João Silva",
  "cliente_documento": "123.456.789-00",
  "cliente_email": "joao@email.com",
  "cliente_telefone": "(11) 1234-5678",
  "cliente_whatsapp": "(11) 99999-8888",
  "cliente_endereco": "Rua X, 123 - São Paulo/SP",
  
  // Descrição
  "descricao_servico_ou_produto": "Pintura de parede 100m²",
  "area_m2": 100,
  "quantidade": null,
  
  // Valores
  "custo_total": 1500.00,
  "preco_minimo": 2000.00,
  "preco_sugerido": 2500.00,
  "preco_praticado": 2500.00,
  
  // Condições Comerciais
  "validade_proposta": "30 dias",
  "condicoes_pagamento": "50% antecipado, 50% na entrega",
  "prazo_execucao": "15 dias úteis",
  "observacoes": "Inclui materiais básicos",
  
  // Status
  "status": "RASCUNHO" | "ENVIADO" | "APROVADO" | "NAO_APROVADO",
  "canal_envio": "WhatsApp",
  
  // Datas
  "created_at": "2024-12-17T10:00:00Z",
  "updated_at": "2024-12-17T15:00:00Z",
  "enviado_em": "2024-12-17T12:00:00Z",
  "aprovado_em": null,
  "nao_aprovado_em": null
}
```

### Coleção: `orcamento_configs`

```javascript
{
  "id": "uuid-gerado",
  "company_id": "uuid-empresa",
  "logo_url": "/uploads/logo-123.png",
  "cor_primaria": "#7C3AED",
  "cor_secundaria": "#3B82F6",
  "texto_ciencia": "O cliente declara ciência...",
  "texto_garantia": "Garantia de 90 dias...",
  "created_at": "2024-12-01T10:00:00Z"
}
```

### Coleção: `orcamento_materiais`

```javascript
{
  "id": "uuid-gerado",
  "orcamento_id": "uuid-orcamento",
  "material_id": "uuid-material",
  "material_nome": "Tinta Acrílica Branca",
  "quantidade": 10,
  "unidade": "L",
  "valor_unitario": 50.00,
  "valor_total": 500.00
}
```

---

## 🔄 Fluxo de Status

```
┌──────────┐     ┌──────────┐     ┌──────────┐
│ RASCUNHO │────▶│ ENVIADO  │────▶│ APROVADO │
└──────────┘     └──────────┘     └──────────┘
                       │               
                       │          ┌──────────────┐
                       └─────────▶│ NAO_APROVADO │
                                  └──────────────┘
```

---

## 📱 Componentes Auxiliares

### OrcamentoMateriais.jsx
**Caminho:** `/app/frontend/src/components/OrcamentoMateriais.jsx`

Componente para gerenciar materiais dentro de um orçamento.
- Adicionar materiais do catálogo
- Definir quantidade e valor
- Calcular total automático

---

## 🎨 Rotas do Frontend

```javascript
// App.js
<Route path="/precificacao" element={<Precificacao />} />
<Route path="/orcamentos" element={<Orcamentos />} />
<Route path="/orcamento/:id" element={<OrcamentoDetalhe />} />
<Route path="/orcamento/:id/editar" element={<EditarOrcamento />} />
<Route path="/config-orcamento" element={<ConfiguracaoOrcamento />} />
```

---

## 📊 Resumo dos Arquivos

| Arquivo | Linhas | Função |
|---------|--------|--------|
| Precificacao.jsx | ~1700 | Criar orçamento com cálculo de preço |
| Orcamentos.jsx | ~296 | Listar e gerenciar orçamentos |
| OrcamentoDetalhe.jsx | ~384 | Visualizar orçamento completo |
| EditarOrcamento.jsx | ~449 | Editar orçamento existente |
| ConfiguracaoOrcamento.jsx | ~311 | Personalizar PDF |
| OrcamentoMateriais.jsx | ~300 | Gerenciar materiais |
| **Total** | **~3440** | - |
