# 📊 ANÁLISE COMPLETA DO SISTEMA DE ORÇAMENTOS

## Documento de Análise: O que já existe vs O que falta implementar

---

## 1️⃣ ONDE O ORÇAMENTO É CRIADO/SALVO

### Backend (server.py)

| Endpoint | Método | Função | Linha |
|----------|--------|--------|-------|
| `/api/orcamentos` | POST | Criar orçamento | 1049 |
| `/api/orcamentos/{empresa_id}` | GET | Listar orçamentos | 1067 |
| `/api/orcamento/{id}` | GET | Buscar orçamento | 1091 |
| `/api/orcamento/{id}` | PUT | Atualizar orçamento | 1101 |
| `/api/orcamento/{id}` | DELETE | Excluir orçamento | 1117 |
| `/api/orcamento/{id}/status` | PATCH | Atualizar status | 1127 |

### Frontend

| Arquivo | Função |
|---------|--------|
| `Precificacao.jsx` | Cria orçamento via modal após cálculo de preço |
| `Orcamentos.jsx` | Lista e gerencia orçamentos |
| `EditarOrcamento.jsx` | Edita orçamento existente |
| `OrcamentoDetalhe.jsx` | Visualiza detalhes do orçamento |

---

## 2️⃣ ONDE É CALCULADO O TOTAL/PREÇO FINAL

### Frontend: `Precificacao.jsx` (linhas 247-368)

**Cálculo atual de Serviço por m²:**
```javascript
// Custos diretos
custoMaoObra = horasTotais * custoHoraEquipe
custoDeslocamento = custoCombustivel + pedagios
alimentacaoTotal = custoAlimentacao * quantidadeOperarios * diasServico
custoMateriaisEquip = materiais + aluguelMaquinas + taxasLicencas + descarte + outrosCustos

// Custo direto base + reserva
custoDiretoBase = custoMaoObra + custoDeslocamento + alimentacaoTotal + custoMateriaisEquip
valorReserva = custoDiretoBase * (reservaImprevistos / 100)
custoDiretoTotal = custoDiretoBase + valorReserva

// Preço final (fórmula markup simplificada)
aliquotaTotalComLucro = (impostosFaturamento + taxasRecebimento + margemLucro) / 100
precoSugerido = custoTotal / (1 - aliquotaTotalComLucro)
```

### Backend: `server.py` (linhas 1506-1517, 1709-1712)

**Cálculo do total com materiais:**
```python
# Na geração do PDF/HTML
total_materiais = sum(m.get('preco_total_item', 0) for m in materiais)
valor_servico = orcamento.get('preco_praticado', 0)
valor_total = valor_servico + total_materiais
```

---

## 3️⃣ COLEÇÕES MONGODB EXISTENTES

| Coleção | Quantidade de Usos | Descrição |
|---------|-------------------|-----------|
| `orcamentos` | 14 | Orçamentos criados |
| `orcamento_config` | 7 | Configurações de visual do PDF |
| `orcamento_materiais` | 6 | Materiais vinculados aos orçamentos |
| `materiais` | 7 | Catálogo de materiais |
| `clientes` | 10 | Cadastro de clientes |
| `companies` | 9 | Empresas |
| `users` | 6 | Usuários |
| `transactions` | 8 | Transações financeiras |
| `contas` | 22 | Contas a pagar/receber |
| `custom_categories` | 6 | Categorias personalizadas |
| `monthly_goals` | 5 | Metas mensais |
| `subscriptions` | 4 | Assinaturas |
| `system_config` | 4 | Configurações do sistema |

### Schema do Orçamento (OrcamentoCreate/Orcamento)

```python
{
    "id": "uuid",
    "numero_orcamento": "ORC-001",
    "empresa_id": "uuid",
    "usuario_id": "uuid",
    
    # Cliente
    "cliente_nome": str,
    "cliente_documento": Optional[str],
    "cliente_email": Optional[str],
    "cliente_whatsapp": Optional[str],
    "cliente_endereco": Optional[str],
    
    # Dados do orçamento
    "tipo": str,  # produto, servico_hora, servico_m2, valor_fechado
    "descricao_servico_ou_produto": str,
    "area_m2": Optional[float],
    "quantidade": Optional[float],
    "detalhes_itens": Optional[dict],
    
    # Valores (ATUAIS - SIMPLES)
    "custo_total": float,
    "preco_minimo": float,
    "preco_sugerido": float,
    "preco_praticado": float,
    
    # Condições
    "validade_proposta": str,
    "condicoes_pagamento": str,
    "prazo_execucao": str,
    "observacoes": Optional[str],
    
    # Status
    "status": str,  # RASCUNHO, ENVIADO, APROVADO, NAO_APROVADO
    "enviado_em": Optional[datetime],
    "aprovado_em": Optional[datetime],
    
    # Timestamps
    "created_at": datetime,
    "updated_at": datetime
}
```

### Schema do Material (OrcamentoMaterial)

```python
{
    "id": "uuid",
    "id_orcamento": str,
    "id_material": Optional[str],
    "nome_item": str,
    "descricao_customizada": Optional[str],
    "unidade": str,
    "preco_compra_fornecedor": float,
    "percentual_acrescimo": float,
    "preco_unitario_final": float,
    "quantidade": float,
    "preco_total_item": float,
    "created_at": datetime
}
```

---

## 4️⃣ COMO FUNCIONA ATUALMENTE

### Tela de Criar Orçamento (Precificacao.jsx)

1. Usuário seleciona tipo de cobrança (Por Hora, Por m², Valor Fechado)
2. Preenche dados:
   - Escopo do serviço (área, produtividade, operários)
   - Custo de mão de obra (salário, encargos)
   - Deslocamento (combustível, pedágios)
   - Alimentação
   - Materiais e equipamentos
   - Reserva para imprevistos (%)
   - **Tributos: Impostos sobre faturamento (%), Taxas de recebimento (%)**
   - **Margem de lucro desejada (%)**
3. Clica "Calcular Preço"
4. Sistema mostra resultado
5. Clica "Gerar Orçamento"
6. Modal abre para preencher dados do cliente
7. Orçamento é salvo

### Dashboard (Dashboard.jsx)

- KPIs: Faturamento, Custos, Despesas, Lucro Líquido
- Gráfico de Fluxo de Caixa (barras)
- Meta mensal com barra de progresso
- **NÃO TEM:** Configuração de Markup/BDI mensal
- **NÃO TEM:** Gráfico donut de markup

---

## 5️⃣ O QUE JÁ EXISTE ✅

| Funcionalidade | Status | Detalhes |
|----------------|--------|----------|
| CRUD de Orçamentos | ✅ Existe | Completo |
| Cálculo de preço por m² | ✅ Existe | Com impostos e margem |
| Cálculo de preço por hora | ✅ Existe | Simplificado |
| Cálculo de valor fechado | ✅ Existe | Simplificado |
| Materiais no orçamento | ✅ Existe | Catálogo + vinculação |
| Geração de PDF | ✅ Existe | ReportLab |
| Geração de HTML | ✅ Existe | Para visualização |
| Envio WhatsApp | ✅ Existe | Com link do PDF |
| Configuração visual PDF | ✅ Existe | Logo, cores, textos |
| Cadastro de Clientes | ✅ Existe | PF/PJ completo |
| Integração Cliente-Orçamento | ✅ Existe | Dropdown + cadastro rápido |

---

## 6️⃣ O QUE FALTA IMPLEMENTAR ❌

### A) MARKUP/BDI MENSAL (Dashboard)

| Item | Status | Descrição |
|------|--------|-----------|
| A1. Coleção `markup_profiles` | ❌ Falta | Config mensal por empresa |
| A2. Modal no dashboard | ❌ Falta | Configurar Markup/BDI |
| A3. Engine do markup | ❌ Falta | Fórmula centralizada |
| A4. Gráfico donut temporal | ❌ Falta | Últimos 12 meses |
| A5. Endpoint série | ❌ Falta | GET /markup-profile/series |

**Fórmula necessária:**
```
markup = ((1+X)*(1+Y)*(1+Z)) / (1 - I)

Onde:
- I = impostos sobre venda (Simples + ISS)
- X = indiretas
- Y = financeiro
- Z = lucro
```

### B) CATÁLOGO DE SERVIÇOS (Templates)

| Item | Status | Descrição |
|------|--------|-----------|
| B1. Coleção `service_templates` | ❌ Falta | Templates de serviço |
| B2. Enum `billingModel` | ❌ Falta | 15 modalidades de cobrança |
| B3. CRUD de templates | ❌ Falta | Endpoints + UI |
| B4. Campos dinâmicos | ❌ Falta | measurementSchema |
| B5. Multiplicadores | ❌ Falta | Urgência, altura, risco |

**Modalidades necessárias:**
- AREA_M2, LINEAR_M, POINT, UNIT, VOLUME_M3, WEIGHT_KG
- HOUR, DAY, VISIT, MONTHLY, MILESTONE, GLOBAL
- UNIT_COMPOSITION, COST_PLUS, PERFORMANCE

### C) CUSTOS INTERNOS (Modal no orçamento)

| Item | Status | Descrição |
|------|--------|-----------|
| C1. Modal "Composição do preço" | ❌ Falta | Botão no criar orçamento |
| C2. Aba Indiretos | ❌ Falta | Custos invisíveis ao cliente |
| C3. Aba Materiais de uso interno | ❌ Falta | EPI/consumo |
| C4. Coleção `internal_materials_catalog` | ❌ Falta | Catálogo EPI |
| C5. Toggles applyMarkup/visibleToClient | ❌ Falta | Por item |

### D) NOVOS CAMPOS NO ORÇAMENTO

| Campo | Status | Descrição |
|-------|--------|-----------|
| `workUseMaterials[]` | ❌ Falta | EPI/consumo interno |
| `hiddenCosts[]` | ❌ Falta | Custos indiretos |
| `pricingSnapshot` | ❌ Falta | Config markup usada |
| `totals.directVisibleSubtotal` | ❌ Falta | Total visível |
| `totals.hiddenCostSubtotal` | ❌ Falta | Total custos ocultos |
| `totals.hiddenPriceSubtotal` | ❌ Falta | Total preço oculto |
| `totals.finalTotal` | ❌ Falta | Total final |

### E) ENGINE DE CÁLCULO CENTRALIZADA

| Item | Status | Descrição |
|------|--------|-----------|
| Módulo `pricingEngine` | ❌ Falta | Cálculo centralizado |
| Regra de conversão custo→preço | ❌ Falta | Com/sem markup |

---

## 7️⃣ RESUMO EXECUTIVO

### ✅ O que já funciona bem:
1. Fluxo completo de criação de orçamento
2. Cálculo de preço com impostos e margem (simplificado)
3. Materiais pagos pelo cliente (catálogo)
4. PDF/HTML com visual profissional
5. Integração com clientes cadastrados

### ❌ O que precisa ser adicionado:
1. **Markup/BDI mensal configurável** - Não existe
2. **Catálogo de serviços com modalidades** - Não existe
3. **Custos internos (indiretos + EPI)** - Não existe
4. **Engine de cálculo centralizada** - Cálculo está espalhado no frontend
5. **Snapshot de precificação** - Não salva config usada no orçamento

### 📊 Percentual de implementação:
- **Funcionalidades básicas:** 100% ✅
- **Funcionalidades avançadas (requisitos):** ~15% ❌

---

## 8️⃣ RECOMENDAÇÃO DE IMPLEMENTAÇÃO

### Fase 1: Markup/BDI (Prioridade Alta)
1. Criar coleção `markup_profiles`
2. Criar modal no dashboard
3. Implementar fórmula do markup
4. Criar gráfico donut

### Fase 2: Catálogo de Serviços
1. Criar coleção `service_templates`
2. Implementar CRUD
3. Integrar na criação de orçamento

### Fase 3: Custos Internos
1. Criar coleção `internal_materials_catalog`
2. Adicionar modal no orçamento
3. Expandir schema do orçamento

### Fase 4: Engine Centralizada
1. Criar módulo `pricingEngine.py`
2. Migrar cálculos do frontend
3. Adicionar snapshots

---

## 9️⃣ ARQUIVOS QUE SERÃO MODIFICADOS

### Backend
- `server.py` - Novos endpoints e modelos
- Novo: `pricing_engine.py` - Módulo de cálculo

### Frontend
- `Dashboard.jsx` - Modal markup + gráfico donut
- `Precificacao.jsx` - Modal custos internos + templates
- Novo: `ConfigMarkup.jsx` - Componente de configuração
- Novo: `CatalogoServicos.jsx` - CRUD de templates

### Banco de Dados (Novas coleções)
- `markup_profiles`
- `service_templates`
- `internal_materials_catalog`
