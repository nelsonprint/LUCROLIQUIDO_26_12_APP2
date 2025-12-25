from fastapi import FastAPI, APIRouter, HTTPException, UploadFile, File, Request
from fastapi.staticfiles import StaticFiles
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional
import uuid
from datetime import datetime, timezone, timedelta, date
import mercadopago
from emergentintegrations.llm.chat import LlmChat, UserMessage
from openpyxl import Workbook
from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas
from reportlab.lib.utils import ImageReader
from reportlab.lib import colors
from io import BytesIO
import base64
from fastapi.responses import StreamingResponse, FileResponse, HTMLResponse
import aiofiles

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Mercado Pago SDK
sdk = mercadopago.SDK(os.environ.get('MERCADO_PAGO_ACCESS_TOKEN'))

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create the main app
app = FastAPI()
api_router = APIRouter(prefix="/api")

# ========== MODELS ==========

class UserRegister(BaseModel):
    name: str
    email: str
    password: str

class UserLogin(BaseModel):
    email: str
    password: str

class User(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    email: str
    password: str
    role: str = "user"  # user ou admin
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class CompanyCreate(BaseModel):
    user_id: str
    name: str
    segment: str
    # Dados da empresa
    razao_social: Optional[str] = None
    nome_fantasia: Optional[str] = None
    cnpj: Optional[str] = None
    inscricao_estadual: Optional[str] = None
    inscricao_municipal: Optional[str] = None
    # Endereço
    logradouro: Optional[str] = None
    numero: Optional[str] = None
    complemento: Optional[str] = None
    bairro: Optional[str] = None
    cidade: Optional[str] = None
    estado: Optional[str] = None
    cep: Optional[str] = None
    # Contatos
    telefone_fixo: Optional[str] = None
    celular_whatsapp: Optional[str] = None
    email_empresa: Optional[str] = None
    site: Optional[str] = None
    contato_principal: Optional[str] = None

class Company(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    name: str
    segment: str
    # Dados da empresa
    razao_social: Optional[str] = None
    nome_fantasia: Optional[str] = None
    cnpj: Optional[str] = None
    inscricao_estadual: Optional[str] = None
    inscricao_municipal: Optional[str] = None
    # Endereço
    logradouro: Optional[str] = None
    numero: Optional[str] = None
    complemento: Optional[str] = None
    bairro: Optional[str] = None
    cidade: Optional[str] = None
    estado: Optional[str] = None
    cep: Optional[str] = None
    # Contatos
    telefone_fixo: Optional[str] = None
    celular_whatsapp: Optional[str] = None
    email_empresa: Optional[str] = None
    site: Optional[str] = None
    contato_principal: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


# ========== MODELS DE CLIENTE ==========

class ClienteCreate(BaseModel):
    empresa_id: str
    tipo: str  # "PF" ou "PJ"
    
    # Pessoa Física
    nome: Optional[str] = None
    sexo: Optional[str] = None  # "Masculino" ou "Feminino"
    cpf: Optional[str] = None
    profissao: Optional[str] = None
    
    # Pessoa Jurídica
    nome_fantasia: Optional[str] = None
    razao_social: Optional[str] = None
    cnpj: Optional[str] = None
    inscricao_municipal: Optional[str] = None
    inscricao_estadual: Optional[str] = None
    ramo_atuacao: Optional[str] = None
    site: Optional[str] = None
    
    # Contato Financeiro (apenas PJ)
    contato_financeiro_nome: Optional[str] = None
    contato_financeiro_whatsapp: Optional[str] = None
    contato_financeiro_email: Optional[str] = None
    
    # Endereço (ambos)
    logradouro: Optional[str] = None
    numero: Optional[str] = None
    complemento: Optional[str] = None  # AP/Casa ou Sala
    bairro: Optional[str] = None
    ponto_referencia: Optional[str] = None
    cep: Optional[str] = None
    cidade: Optional[str] = None
    estado: Optional[str] = None
    
    # Contato (ambos)
    telefone_fixo: Optional[str] = None
    whatsapp: Optional[str] = None
    email: Optional[str] = None

class Cliente(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    empresa_id: str
    tipo: str
    
    # Pessoa Física
    nome: Optional[str] = None
    sexo: Optional[str] = None
    cpf: Optional[str] = None
    profissao: Optional[str] = None
    
    # Pessoa Jurídica
    nome_fantasia: Optional[str] = None
    razao_social: Optional[str] = None
    cnpj: Optional[str] = None
    inscricao_municipal: Optional[str] = None
    inscricao_estadual: Optional[str] = None
    ramo_atuacao: Optional[str] = None
    site: Optional[str] = None
    
    # Contato Financeiro (apenas PJ)
    contato_financeiro_nome: Optional[str] = None
    contato_financeiro_whatsapp: Optional[str] = None
    contato_financeiro_email: Optional[str] = None
    
    # Endereço
    logradouro: Optional[str] = None
    numero: Optional[str] = None
    complemento: Optional[str] = None
    bairro: Optional[str] = None
    ponto_referencia: Optional[str] = None
    cep: Optional[str] = None
    cidade: Optional[str] = None
    estado: Optional[str] = None
    
    # Contato
    telefone_fixo: Optional[str] = None
    whatsapp: Optional[str] = None
    email: Optional[str] = None
    
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class Subscription(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    status: str  # trial, active, expired, cancelled
    trial_start: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    trial_end: datetime
    subscription_start: Optional[datetime] = None
    payment_id: Optional[str] = None
    next_billing_date: Optional[datetime] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class TransactionCreate(BaseModel):
    company_id: str
    user_id: str
    type: str  # receita, custo, despesa
    description: str
    amount: float
    category_id: str  # ID da categoria do Plano de Contas
    competence_month: str  # Formato YYYY-MM (mês de competência)
    date: str  # Data de pagamento/registro
    status: str = "previsto"  # previsto, realizado
    notes: Optional[str] = None
    # Campos legados (manter compatibilidade temporária)
    category: Optional[str] = None

class Transaction(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    company_id: str
    user_id: str
    type: str
    description: str
    amount: float
    category_id: str  # ID da categoria do Plano de Contas
    competence_month: str  # Mês de competência (YYYY-MM)
    date: str  # Data de pagamento/registro
    status: str = "previsto"
    notes: Optional[str] = None
    # Denormalização para performance
    category_name: Optional[str] = None  # Nome da categoria
    category_group: Optional[str] = None  # FIXA, VARIAVEL_INDIRETA, DIRETA_OBRA
    is_indirect_for_markup: Optional[bool] = None  # Flag para X_real
    # Campos de controle
    origem: str = "manual"  # manual ou conta (vindo de contas a pagar/receber)
    conta_id: Optional[str] = None  # ID da conta vinculada (se origem = conta)
    cancelled: bool = False  # Indica se o lançamento foi cancelado
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    # Campos legados (manter compatibilidade temporária)
    category: Optional[str] = None

class MonthlyGoalCreate(BaseModel):
    company_id: str
    month: str  # formato: 2025-12
    goal_amount: float

class MonthlyGoal(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    company_id: str
    month: str
    goal_amount: float
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

# ========== MODELS DE CONTAS A PAGAR/RECEBER ==========

class ContaCreate(BaseModel):
    company_id: str
    user_id: str
    tipo: str  # PAGAR ou RECEBER
    descricao: str
    categoria: str
    data_emissao: str  # formato: YYYY-MM-DD
    data_vencimento: str  # formato: YYYY-MM-DD
    valor: float
    forma_pagamento: str  # PIX, Boleto, Cartão, Dinheiro, Transferência
    observacoes: Optional[str] = None

class Conta(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    company_id: str
    user_id: str
    tipo: str  # PAGAR ou RECEBER
    descricao: str
    categoria: str
    data_emissao: str
    data_vencimento: str
    data_pagamento: Optional[str] = None
    valor: float
    status: str = "PENDENTE"  # PENDENTE, PAGO, ATRASADO, PARCIAL
    forma_pagamento: str
    observacoes: Optional[str] = None
    lancamento_id: Optional[str] = None  # ID do lançamento vinculado
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ContaStatusUpdate(BaseModel):
    status: str  # PAGO, RECEBIDO, PENDENTE, ATRASADO, PARCIAL
    data_pagamento: Optional[str] = None

# ========== MODELS DE CATEGORIAS PERSONALIZADAS ==========

class CustomCategoryCreate(BaseModel):
    company_id: str
    tipo: str  # receita, custo, despesa
    nome: str

class CustomCategory(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    company_id: str
    tipo: str  # receita, custo, despesa
    nome: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

# ========== MODELS DE ORÇAMENTOS ==========

class OrcamentoCreate(BaseModel):
    empresa_id: str
    usuario_id: str
    # Cliente
    cliente_nome: str
    cliente_documento: Optional[str] = None
    cliente_email: Optional[str] = None
    cliente_telefone: Optional[str] = None
    cliente_whatsapp: Optional[str] = None
    cliente_endereco: Optional[str] = None
    # Dados do orçamento
    tipo: str  # produto, servico_hora, servico_m2, valor_fechado
    descricao_servico_ou_produto: str
    area_m2: Optional[float] = None
    quantidade: Optional[float] = None
    detalhes_itens: Optional[dict] = None
    custo_total: float
    preco_minimo: float
    preco_sugerido: float
    preco_praticado: float
    # Condições comerciais
    validade_proposta: str  # data no formato YYYY-MM-DD
    condicoes_pagamento: str
    prazo_execucao: str
    observacoes: Optional[str] = None
    # Forma de Pagamento Detalhada
    forma_pagamento: Optional[str] = "avista"  # avista ou entrada_parcelas
    entrada_percentual: Optional[float] = 0
    valor_entrada: Optional[float] = 0
    num_parcelas: Optional[int] = 0
    parcelas: Optional[list] = []  # [{numero, valor, editado}]

class Orcamento(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    numero_orcamento: str  # Será gerado automaticamente
    empresa_id: str
    usuario_id: str
    # Cliente
    cliente_nome: str
    cliente_documento: Optional[str] = None
    cliente_email: Optional[str] = None
    cliente_telefone: Optional[str] = None
    cliente_whatsapp: Optional[str] = None
    cliente_endereco: Optional[str] = None
    # Dados do orçamento
    tipo: str
    descricao_servico_ou_produto: str
    area_m2: Optional[float] = None
    quantidade: Optional[float] = None
    detalhes_itens: Optional[dict] = None
    custo_total: float
    preco_minimo: float
    preco_sugerido: float
    preco_praticado: float
    # Condições comerciais
    validade_proposta: str
    condicoes_pagamento: str
    prazo_execucao: str
    observacoes: Optional[str] = None
    # Forma de Pagamento Detalhada
    forma_pagamento: Optional[str] = "avista"  # avista ou entrada_parcelas
    entrada_percentual: Optional[float] = 0
    valor_entrada: Optional[float] = 0
    num_parcelas: Optional[int] = 0
    parcelas: Optional[list] = []  # [{numero, valor, editado}]
    # Status e envio
    status: str = "RASCUNHO"  # RASCUNHO, ENVIADO, APROVADO, NAO_APROVADO
    enviado_em: Optional[datetime] = None
    aprovado_em: Optional[datetime] = None
    nao_aprovado_em: Optional[datetime] = None
    canal_envio: Optional[str] = None
    # Aceite do cliente
    aceito_em: Optional[datetime] = None
    aceito_por_ip: Optional[str] = None
    contas_receber_geradas: Optional[list] = []  # IDs das contas geradas
    # Auditoria
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class OrcamentoStatusUpdate(BaseModel):
    status: str  # ENVIADO, APROVADO, NAO_APROVADO
    canal_envio: Optional[str] = None

# ========== MODELS: MATERIAIS ==========

class MaterialCreate(BaseModel):
    nome_item: str
    descricao: Optional[str] = None
    unidade: str
    preco_compra_base: float

class Material(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    nome_item: str
    descricao: Optional[str] = None
    unidade: str
    preco_compra_base: float
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class OrcamentoMaterialCreate(BaseModel):
    id_orcamento: str
    id_material: Optional[str] = None  # Se None, é um material novo
    nome_item: str
    descricao_customizada: Optional[str] = None
    unidade: str
    preco_compra_fornecedor: float
    percentual_acrescimo: float
    quantidade: float

class OrcamentoMaterial(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    id_orcamento: str
    id_material: Optional[str] = None
    nome_item: str
    descricao_customizada: Optional[str] = None
    unidade: str
    preco_compra_fornecedor: float
    percentual_acrescimo: float
    preco_unitario_final: float
    quantidade: float
    preco_total_item: float
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class OrcamentoConfigCreate(BaseModel):
    logo_url: Optional[str] = None
    cor_primaria: str = "#7C3AED"
    cor_secundaria: str = "#3B82F6"
    texto_ciencia: str = "Declaro, para os devidos fins, que aceito esta proposta comercial de prestação de serviços nas condições acima citadas."
    texto_garantia: str = "Os serviços executados possuem garantia conforme especificações técnicas e normas vigentes."

class OrcamentoConfig(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    company_id: str
    logo_url: Optional[str] = None
    cor_primaria: str = "#7C3AED"
    cor_secundaria: str = "#3B82F6"
    texto_ciencia: str = "Declaro, para os devidos fins, que aceito esta proposta comercial de prestação de serviços nas condições acima citadas."
    texto_garantia: str = "Os serviços executados possuem garantia conforme especificações técnicas e normas vigentes."
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class SystemConfig(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = "system_config"  # ID fixo para ter sempre um único registro
    subscription_price: float = 49.90
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

# ========== MODELS: MARKUP/BDI MENSAL ==========

# Grupos de categorias para o Plano de Contas
EXPENSE_GROUPS = ["FIXA", "VARIAVEL_INDIRETA", "DIRETA_OBRA"]

class ExpenseCategoryConfig(BaseModel):
    """Configuração de categoria de despesa para o Plano de Contas"""
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    company_id: str
    name: str  # Nome da categoria (ex: "Aluguel", "Energia", "Salários ADM")
    type: str = "DESPESA"  # RECEITA ou DESPESA
    group: str = "FIXA"  # FIXA, VARIAVEL_INDIRETA, DIRETA_OBRA
    is_indirect_for_markup: bool = True  # True = entra no cálculo de X_real
    description: Optional[str] = None
    active: bool = True
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ExpenseCategoryCreate(BaseModel):
    """Criar/atualizar categoria de despesa"""
    company_id: str
    name: str
    type: str = "DESPESA"  # RECEITA ou DESPESA
    group: str = "FIXA"  # FIXA, VARIAVEL_INDIRETA, DIRETA_OBRA
    is_indirect_for_markup: bool = True
    description: Optional[str] = None

class MarkupTaxes(BaseModel):
    """Configuração de impostos para o markup"""
    simples_effective_rate: float = 0.083  # Simples Nacional efetivo (8.3%)
    iss_rate: float = 0.03  # ISS (3%)
    include_materials_in_iss_base: bool = False  # Materiais entram na base do ISS?

class MarkupProfileCreate(BaseModel):
    """Criar/atualizar perfil de markup mensal"""
    company_id: str
    year: int
    month: int  # 1-12
    taxes: MarkupTaxes = MarkupTaxes()
    indirects_rate: float = 0.10  # X - Indiretas (10%)
    financial_rate: float = 0.02  # Y - Financeiro (2%)
    profit_rate: float = 0.15  # Z - Lucro (15%)
    notes: Optional[str] = None
    # Campos do Modelo 2 (automático)
    mode: str = "MANUAL"  # MANUAL ou AUTO_MODEL2
    x_real_applied: Optional[float] = None  # X_real aplicado (percentual)
    x_real_base_month: Optional[str] = None  # Mês base (YYYY-MM)
    x_real_indirects_total: Optional[float] = None  # Total despesas indiretas
    x_real_revenue_base: Optional[float] = None  # Receita base
    x_real_calculated_at: Optional[str] = None  # Timestamp do cálculo

class MarkupProfile(BaseModel):
    """Perfil de markup mensal completo"""
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    company_id: str
    year: int
    month: int
    taxes: dict  # MarkupTaxes como dict
    indirects_rate: float = 0.10
    financial_rate: float = 0.02
    profit_rate: float = 0.15
    # Valores calculados
    markup_multiplier: float = 1.0
    bdi_percentage: float = 0.0
    notes: Optional[str] = None
    # Campos do Modelo 2 (automático)
    mode: str = "MANUAL"  # MANUAL ou AUTO_MODEL2
    x_real_applied: Optional[float] = None
    x_real_base_month: Optional[str] = None
    x_real_indirects_total: Optional[float] = None
    x_real_revenue_base: Optional[float] = None
    x_real_calculated_at: Optional[str] = None
    # Controle de fechamento mensal
    is_closed: bool = False  # Se fechado, não recalcula automaticamente
    closed_at: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

# ========== MODELS: CATÁLOGO DE SERVIÇOS ==========

class ServiceTemplateCreate(BaseModel):
    """Criar template de serviço"""
    company_id: str
    name: str
    category: Optional[str] = None
    billing_model: str  # AREA_M2, LINEAR_M, POINT, UNIT, VOLUME_M3, WEIGHT_KG, HOUR, DAY, VISIT, MONTHLY, MILESTONE, GLOBAL, UNIT_COMPOSITION, COST_PLUS, PERFORMANCE
    unit_label: str  # Ex: "m²", "m", "ponto", "un", "m³", "kg", "hora", "dia", "visita", "mês"
    default_unit_price: float = 0.0
    measurement_schema: List[str] = []  # Campos a pedir no orçamento: ["areaM2"], ["points"], ["hours"]
    multipliers: Optional[dict] = None  # {urgency: 1.2, height: 1.1, difficulty: 1.3, risk: 1.1, access: 1.05}
    materials_included: bool = False
    material_margin_pct: Optional[float] = None
    scope_checklist: List[str] = []
    active: bool = True

class ServiceTemplate(BaseModel):
    """Template de serviço completo"""
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    company_id: str
    name: str
    category: Optional[str] = None
    billing_model: str
    unit_label: str
    default_unit_price: float = 0.0
    measurement_schema: List[str] = []
    multipliers: Optional[dict] = None
    materials_included: bool = False
    material_margin_pct: Optional[float] = None
    scope_checklist: List[str] = []
    active: bool = True
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

# ========== MODELS: MATERIAIS INTERNOS (EPI/CONSUMO) ==========

class InternalMaterialCreate(BaseModel):
    """Criar material interno (EPI/consumo)"""
    company_id: str
    name: str
    category: str = "OUTROS"  # EPI, CONSUMIVEL, OUTROS
    unit: str
    default_cost: float = 0.0

class InternalMaterial(BaseModel):
    """Material interno completo"""
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    company_id: str
    name: str
    category: str = "OUTROS"
    unit: str
    default_cost: float = 0.0
    active: bool = True
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

# ========== MODELS: TABELA DE PREÇOS (PU1) ==========

# Unidades disponíveis para a tabela de preços
PRICE_TABLE_UNITS = ["M2", "M", "UN", "PONTO", "HORA", "DIA", "VISITA", "MES", "ETAPA", "GLOBAL", "KG", "M3"]

class ServicePriceCreate(BaseModel):
    """Criar item na tabela de preços"""
    company_id: str
    code: Optional[str] = None  # Código opcional (ex: ELE-001)
    description: str  # Descrição do serviço (será normalizada em uppercase)
    category: Optional[str] = None  # Categoria (ex: Elétrica, Hidráulica)
    unit: str  # Unidade de medida (M2, M, UN, PONTO, etc.)
    pu1_base_price: float  # Preço base interno (PU1)

class ServicePrice(BaseModel):
    """Item da tabela de preços completo"""
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    company_id: str
    code: Optional[str] = None
    description: str
    category: Optional[str] = None
    unit: str
    pu1_base_price: float
    active: bool = True
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ServicePriceImportItem(BaseModel):
    """Item para importação em lote"""
    code: Optional[str] = None
    description: str
    category: Optional[str] = None
    unit: str
    pu1_base_price: float
    active: bool = True

# ========== MODELS: ORÇAMENTO COM ITENS (GRID) ==========

class OrcamentoItemCreate(BaseModel):
    """Item do orçamento com snapshot de preços"""
    service_price_id: Optional[str] = None  # ID do serviço na tabela de preços (opcional)
    description: str
    unit: str
    quantity: float
    pu1_used: float  # Preço base usado (snapshot)
    markup_used: float  # Markup usado (snapshot)
    pu2_used: float  # Preço de venda calculado (snapshot)
    line_total: float  # quantity * pu2_used
    pricing_ref: Optional[str] = None  # Referência do markup (ex: "2024-12")

class OrcamentoItem(BaseModel):
    """Item do orçamento completo"""
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    item_number: int  # Número sequencial (001, 002, etc.)
    service_price_id: Optional[str] = None
    description: str
    unit: str
    quantity: float
    pu1_used: float
    markup_used: float
    pu2_used: float
    line_total: float
    pricing_ref: Optional[str] = None

# ========== STARTUP: CRIAR PRIMEIRO ADMIN ==========

@app.on_event("startup")
async def create_first_admin():
    """Criar primeiro admin automaticamente se não existir"""
    try:
        admin_email = "admin@lucroliquido.com"
        existing_admin = await db.users.find_one({"email": admin_email})
        
        if not existing_admin:
            admin = User(
                name="Administrador",
                email=admin_email,
                password="admin123",
                role="admin"
            )
            doc = admin.model_dump()
            doc['created_at'] = doc['created_at'].isoformat()
            await db.users.insert_one(doc)
            logger.info("✅ Primeiro admin criado com sucesso!")
        else:
            logger.info("✅ Admin já existe no sistema")
    except Exception as e:
        logger.error(f"⚠️ Erro ao criar admin: {e}")
        # Não falha o startup se não conseguir criar admin
        # Pode ser um problema temporário de conexão com MongoDB

# ========== ROTAS DE AUTENTICAÇÃO ==========

@api_router.get("/")
async def api_root():
    """Root endpoint for API - useful for health checks"""
    return {"status": "ok", "message": "API funcionando!", "version": "1.0"}

@api_router.post("/auth/register")
async def register(user_data: UserRegister):
    # Verificar se email já existe
    existing = await db.users.find_one({"email": user_data.email})
    if existing:
        raise HTTPException(status_code=400, detail="Email já cadastrado")
    
    # Criar usuário
    user = User(
        name=user_data.name,
        email=user_data.email,
        password=user_data.password,
        role="user"
    )
    
    doc = user.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.users.insert_one(doc)
    
    # Criar trial de 7 dias automaticamente
    trial_start = datetime.now(timezone.utc)
    trial_end = trial_start + timedelta(days=7)
    
    subscription = Subscription(
        user_id=user.id,
        status="trial",
        trial_start=trial_start,
        trial_end=trial_end
    )
    
    sub_doc = subscription.model_dump()
    sub_doc['trial_start'] = sub_doc['trial_start'].isoformat()
    sub_doc['trial_end'] = sub_doc['trial_end'].isoformat()
    sub_doc['created_at'] = sub_doc['created_at'].isoformat()
    await db.subscriptions.insert_one(sub_doc)
    
    return {
        "message": "Usuário registrado com sucesso!",
        "user_id": user.id,
        "name": user.name,
        "role": user.role,
        "trial_days": 7
    }

@api_router.post("/auth/login")
async def login(credentials: UserLogin):
    user = await db.users.find_one({"email": credentials.email})
    
    if not user or user['password'] != credentials.password:
        raise HTTPException(status_code=401, detail="Credenciais inválidas")
    
    return {
        "user_id": user['id'],
        "name": user['name'],
        "email": user['email'],
        "role": user['role']
    }

# ========== ROTAS DE EMPRESAS ==========

@api_router.post("/companies")
async def create_company(company_data: CompanyCreate):
    """Criar nova empresa vinculada ao usuário"""
    try:
        # Criar empresa
        company = Company(**company_data.model_dump())
        
        doc = company.model_dump()
        doc['created_at'] = doc['created_at'].isoformat()
        doc['updated_at'] = doc['updated_at'].isoformat()
        await db.companies.insert_one(doc)
        
        # Criar categorias padrão do Plano de Contas automaticamente
        try:
            default_categories = [
                # ===== RECEITAS =====
                {"name": "Serviços Prestados", "type": "RECEITA", "group": None, "is_indirect_for_markup": False, "description": "Receita de serviços executados"},
                {"name": "Venda de Produtos", "type": "RECEITA", "group": None, "is_indirect_for_markup": False, "description": "Receita de venda de produtos"},
                {"name": "Receitas Financeiras", "type": "RECEITA", "group": None, "is_indirect_for_markup": False, "description": "Juros e rendimentos"},
                {"name": "Outras Receitas", "type": "RECEITA", "group": None, "is_indirect_for_markup": False, "description": "Outras receitas operacionais"},
                
                # ===== CUSTOS =====
                {"name": "Custos de Produção", "type": "CUSTO", "group": None, "is_indirect_for_markup": False, "description": "Custos diretos da produção"},
                {"name": "Matéria-Prima", "type": "CUSTO", "group": None, "is_indirect_for_markup": False, "description": "Insumos e matérias-primas"},
                {"name": "Mão de Obra Direta", "type": "CUSTO", "group": None, "is_indirect_for_markup": False, "description": "Salários de produção"},
                {"name": "Outros Custos", "type": "CUSTO", "group": None, "is_indirect_for_markup": False, "description": "Outros custos operacionais"},
                
                # ===== DESPESAS FIXAS - Entram no X_real =====
                {"name": "Aluguel", "type": "DESPESA", "group": "FIXA", "is_indirect_for_markup": True, "description": "Aluguel do escritório/sede"},
                {"name": "Energia Elétrica", "type": "DESPESA", "group": "FIXA", "is_indirect_for_markup": True, "description": "Conta de luz"},
                {"name": "Água", "type": "DESPESA", "group": "FIXA", "is_indirect_for_markup": True, "description": "Conta de água"},
                {"name": "Telefone/Internet", "type": "DESPESA", "group": "FIXA", "is_indirect_for_markup": True, "description": "Telecomunicações"},
                {"name": "Contador", "type": "DESPESA", "group": "FIXA", "is_indirect_for_markup": True, "description": "Honorários contábeis"},
                {"name": "Salários Administrativos", "type": "DESPESA", "group": "FIXA", "is_indirect_for_markup": True, "description": "Salários do pessoal administrativo"},
                {"name": "Software/Sistemas", "type": "DESPESA", "group": "FIXA", "is_indirect_for_markup": True, "description": "Licenças de software"},
                {"name": "Marketing", "type": "DESPESA", "group": "FIXA", "is_indirect_for_markup": True, "description": "Publicidade e marketing"},
                
                # ===== DESPESAS VARIÁVEIS INDIRETAS - Entram no X_real =====
                {"name": "Combustível Administrativo", "type": "DESPESA", "group": "VARIAVEL_INDIRETA", "is_indirect_for_markup": True, "description": "Combustível de veículos administrativos"},
                {"name": "Material de Escritório", "type": "DESPESA", "group": "VARIAVEL_INDIRETA", "is_indirect_for_markup": True, "description": "Papelaria e suprimentos"},
                {"name": "Manutenção Equipamentos", "type": "DESPESA", "group": "VARIAVEL_INDIRETA", "is_indirect_for_markup": True, "description": "Manutenção de equipamentos de escritório"},
                
                # ===== DESPESAS DIRETAS DA OBRA - NÃO entram no X_real =====
                {"name": "Salários Operacionais", "type": "DESPESA", "group": "DIRETA_OBRA", "is_indirect_for_markup": False, "description": "Salários de operários (entra no custo do serviço)"},
                {"name": "Materiais de Obra", "type": "DESPESA", "group": "DIRETA_OBRA", "is_indirect_for_markup": False, "description": "Materiais aplicados na obra"},
                {"name": "Combustível Obra", "type": "DESPESA", "group": "DIRETA_OBRA", "is_indirect_for_markup": False, "description": "Combustível para obras específicas"},
                {"name": "Aluguel Equipamentos", "type": "DESPESA", "group": "DIRETA_OBRA", "is_indirect_for_markup": False, "description": "Aluguel de máquinas para obras"},
                {"name": "Subempreiteiros", "type": "DESPESA", "group": "DIRETA_OBRA", "is_indirect_for_markup": False, "description": "Terceirizados em obras"},
            ]
            
            for cat_data in default_categories:
                category = ExpenseCategoryConfig(
                    company_id=company.id,
                    name=cat_data["name"],
                    type=cat_data["type"],
                    group=cat_data.get("group"),
                    is_indirect_for_markup=cat_data["is_indirect_for_markup"],
                    description=cat_data.get("description", ""),
                    active=True
                )
                cat_doc = category.model_dump()
                cat_doc['created_at'] = cat_doc['created_at'].isoformat()
                await db.expense_categories.insert_one(cat_doc)
            
            logger.info(f"✅ Categorias padrão criadas para empresa {company.id}")
        except Exception as cat_error:
            logger.error(f"⚠️ Erro ao criar categorias padrão: {cat_error}")
            # Não falha a criação da empresa se categorias falharem
        
        return {
            "message": "Empresa criada com sucesso!",
            "company_id": company.id,
            "name": company.name
        }
    except Exception as e:
        logger.error(f"Erro ao criar empresa: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erro ao criar empresa: {str(e)}")


# ========== FUNÇÕES DE VALIDAÇÃO ==========

def validar_cpf(cpf: str) -> bool:
    """Valida CPF brasileiro"""
    # Remove caracteres não numéricos
    cpf = ''.join(filter(str.isdigit, cpf))
    
    if len(cpf) != 11:
        return False
    
    # Verifica se todos os dígitos são iguais
    if cpf == cpf[0] * 11:
        return False
    
    # Calcula primeiro dígito verificador
    soma = sum(int(cpf[i]) * (10 - i) for i in range(9))
    digito1 = (soma * 10 % 11) % 10
    
    # Calcula segundo dígito verificador
    soma = sum(int(cpf[i]) * (11 - i) for i in range(10))
    digito2 = (soma * 10 % 11) % 10
    
    return cpf[-2:] == f"{digito1}{digito2}"

def validar_cnpj(cnpj: str) -> bool:
    """Valida CNPJ brasileiro"""
    # Remove caracteres não numéricos
    cnpj = ''.join(filter(str.isdigit, cnpj))
    
    if len(cnpj) != 14:
        return False
    
    # Verifica se todos os dígitos são iguais
    if cnpj == cnpj[0] * 14:
        return False
    
    # Calcula primeiro dígito verificador
    pesos1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
    soma = sum(int(cnpj[i]) * pesos1[i] for i in range(12))
    digito1 = 0 if soma % 11 < 2 else 11 - (soma % 11)
    
    # Calcula segundo dígito verificador
    pesos2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
    soma = sum(int(cnpj[i]) * pesos2[i] for i in range(13))
    digito2 = 0 if soma % 11 < 2 else 11 - (soma % 11)
    
    return cnpj[-2:] == f"{digito1}{digito2}"

# ========== ROTAS DE CLIENTES ==========

@api_router.get("/clientes/{empresa_id}")
async def get_clientes(empresa_id: str):
    """Listar todos os clientes de uma empresa"""
    clientes = await db.clientes.find({"empresa_id": empresa_id}, {"_id": 0}).to_list(1000)
    return clientes

@api_router.get("/cliente/{cliente_id}")
async def get_cliente(cliente_id: str):
    """Buscar um cliente específico"""
    cliente = await db.clientes.find_one({"id": cliente_id}, {"_id": 0})
    if not cliente:
        raise HTTPException(status_code=404, detail="Cliente não encontrado")
    return cliente

@api_router.post("/clientes")
async def create_cliente(cliente_data: ClienteCreate):
    """Criar novo cliente"""
    # Validar CPF se for Pessoa Física
    if cliente_data.tipo == "PF" and cliente_data.cpf:
        if not validar_cpf(cliente_data.cpf):
            raise HTTPException(status_code=400, detail="CPF inválido")
        
        # Verificar unicidade do CPF
        existing = await db.clientes.find_one({
            "empresa_id": cliente_data.empresa_id,
            "cpf": cliente_data.cpf
        })
        if existing:
            raise HTTPException(status_code=400, detail="CPF já cadastrado")
    
    # Validar CNPJ se for Pessoa Jurídica
    if cliente_data.tipo == "PJ" and cliente_data.cnpj:
        if not validar_cnpj(cliente_data.cnpj):
            raise HTTPException(status_code=400, detail="CNPJ inválido")
        
        # Verificar unicidade do CNPJ
        existing = await db.clientes.find_one({
            "empresa_id": cliente_data.empresa_id,
            "cnpj": cliente_data.cnpj
        })
        if existing:
            raise HTTPException(status_code=400, detail="CNPJ já cadastrado")
    
    # Criar cliente
    cliente = Cliente(**cliente_data.model_dump())
    await db.clientes.insert_one(cliente.model_dump())
    
    return {"message": "Cliente criado com sucesso!", "cliente": cliente.model_dump()}

@api_router.put("/clientes/{cliente_id}")
async def update_cliente(cliente_id: str, cliente_data: ClienteCreate):
    """Atualizar cliente"""
    # Buscar cliente existente
    existing = await db.clientes.find_one({"id": cliente_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Cliente não encontrado")
    
    # Validar CPF se for Pessoa Física e mudou
    if cliente_data.tipo == "PF" and cliente_data.cpf:
        if not validar_cpf(cliente_data.cpf):
            raise HTTPException(status_code=400, detail="CPF inválido")
        
        # Verificar unicidade (exceto o próprio cliente)
        duplicate = await db.clientes.find_one({
            "empresa_id": cliente_data.empresa_id,
            "cpf": cliente_data.cpf,
            "id": {"$ne": cliente_id}
        })
        if duplicate:
            raise HTTPException(status_code=400, detail="CPF já cadastrado")
    
    # Validar CNPJ se for Pessoa Jurídica e mudou
    if cliente_data.tipo == "PJ" and cliente_data.cnpj:
        if not validar_cnpj(cliente_data.cnpj):
            raise HTTPException(status_code=400, detail="CNPJ inválido")
        
        # Verificar unicidade (exceto o próprio cliente)
        duplicate = await db.clientes.find_one({
            "empresa_id": cliente_data.empresa_id,
            "cnpj": cliente_data.cnpj,
            "id": {"$ne": cliente_id}
        })
        if duplicate:
            raise HTTPException(status_code=400, detail="CNPJ já cadastrado")
    
    # Atualizar
    update_data = cliente_data.model_dump()
    update_data["updated_at"] = datetime.now(timezone.utc)
    
    await db.clientes.update_one(
        {"id": cliente_id},
        {"$set": update_data}
    )
    
    return {"message": "Cliente atualizado com sucesso!"}

@api_router.delete("/clientes/{cliente_id}")
async def delete_cliente(cliente_id: str):
    """Deletar cliente"""
    result = await db.clientes.delete_one({"id": cliente_id})
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Cliente não encontrado")
    
    return {"message": "Cliente deletado com sucesso!"}

async def create_company(company_data: CompanyCreate):
    company = Company(
        user_id=company_data.user_id,
        name=company_data.name,
        segment=company_data.segment
    )
    
    doc = company.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.companies.insert_one(doc)
    
    return {"message": "Empresa criada com sucesso!", "company_id": company.id}

@api_router.get("/companies/{user_id}")
async def get_companies(user_id: str):
    # Adicionar projeção para buscar apenas campos necessários e limitar a 50
    companies = await db.companies.find(
        {"user_id": user_id}, 
        {"_id": 0, "id": 1, "name": 1, "segment": 1, "created_at": 1}
    ).to_list(50)
    return companies

@api_router.get("/company/{company_id}")
async def get_company_detail(company_id: str):
    """Buscar detalhes completos da empresa"""
    company = await db.companies.find_one({"id": company_id}, {"_id": 0})
    
    if not company:
        raise HTTPException(status_code=404, detail="Empresa não encontrada")
    
    return company

@api_router.put("/company/{company_id}")
async def update_company(company_id: str, company_data: CompanyCreate):
    """Atualizar dados da empresa"""
    update_doc = company_data.model_dump()
    update_doc['updated_at'] = datetime.now(timezone.utc).isoformat()
    
    result = await db.companies.update_one(
        {"id": company_id},
        {"$set": update_doc}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Empresa não encontrada")
    
    return {"message": "Empresa atualizada com sucesso!"}

# ========== ROTAS DE LANÇAMENTOS ==========

@api_router.post("/transactions")
async def create_transaction(transaction_data: TransactionCreate):
    """
    Criar lançamento com denormalização automática da categoria.
    Busca dados do Plano de Contas e copia para o lançamento.
    """
    try:
        # Buscar categoria no Plano de Contas para denormalizar
        category = await db.expense_categories.find_one({
            "id": transaction_data.category_id,
            "company_id": transaction_data.company_id
        }, {"_id": 0})
        
        if not category:
            raise HTTPException(
                status_code=400,
                detail=f"Categoria {transaction_data.category_id} não encontrada no Plano de Contas"
            )
        
        # Criar transação base
        transaction_dict = transaction_data.model_dump(exclude_none=True)
        
        # Denormalizar dados da categoria
        transaction_dict.update({
            "category_name": category.get("name"),
            "category_group": category.get("group"),
            "is_indirect_for_markup": category.get("is_indirect_for_markup", False),
            # Manter category legado para compatibilidade
            "category": category.get("name")
        })
        
        # Criar objeto Transaction
        transaction = Transaction(**transaction_dict)
        
        doc = transaction.model_dump()
        doc['created_at'] = doc['created_at'].isoformat()
        await db.transactions.insert_one(doc)
        
        return {"message": "Lançamento criado com sucesso!", "transaction_id": transaction.id}
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erro ao criar lançamento: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/transactions/{company_id}")
async def get_transactions(company_id: str, month: Optional[str] = None):
    query = {"company_id": company_id}
    
    if month:
        query["date"] = {"$regex": f"^{month}"}
    
    # Limitar a 500 transações e ordenar por data decrescente
    transactions = await db.transactions.find(
        query, 
        {"_id": 0}
    ).sort("date", -1).limit(500).to_list(None)
    return transactions

@api_router.put("/transactions/{transaction_id}")
async def update_transaction(transaction_id: str, transaction_data: TransactionCreate):
    """
    Atualizar lançamento com denormalização automática da categoria.
    """
    try:
        # Buscar categoria no Plano de Contas para denormalizar
        category = await db.expense_categories.find_one({
            "id": transaction_data.category_id,
            "company_id": transaction_data.company_id
        }, {"_id": 0})
        
        if not category:
            raise HTTPException(
                status_code=400,
                detail=f"Categoria {transaction_data.category_id} não encontrada no Plano de Contas"
            )
        
        update_doc = transaction_data.model_dump(exclude_none=True)
        
        # Denormalizar dados da categoria
        update_doc.update({
            "category_name": category.get("name"),
            "category_group": category.get("group"),
            "is_indirect_for_markup": category.get("is_indirect_for_markup", False),
            "category": category.get("name")  # Legado
        })
        
        result = await db.transactions.update_one(
            {"id": transaction_id},
            {"$set": update_doc}
        )
        
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Lançamento não encontrado")
        
        return {"message": "Lançamento atualizado com sucesso!"}
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erro ao atualizar lançamento: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.delete("/transactions/{transaction_id}")
async def delete_transaction(transaction_id: str):
    result = await db.transactions.delete_one({"id": transaction_id})
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Lançamento não encontrado")
    
    return {"message": "Lançamento excluído com sucesso!"}

# ========== ROTAS DE MÉTRICAS ==========

@api_router.get("/metrics/{company_id}/{month}")
async def get_metrics(company_id: str, month: str):
    # Usar aggregation para calcular no banco ao invés de em Python
    # Excluir lançamentos cancelados
    pipeline = [
        {"$match": {
            "company_id": company_id,
            "date": {"$regex": f"^{month}"},
            "status": "realizado",
            "cancelled": {"$ne": True}  # Excluir cancelados
        }},
        {"$group": {
            "_id": "$type",
            "total": {"$sum": "$amount"}
        }}
    ]
    
    results = await db.transactions.aggregate(pipeline).to_list(None)
    
    metrics = {"faturamento": 0, "custos": 0, "despesas": 0, "lucro_liquido": 0}
    
    for result in results:
        if result['_id'] == 'receita':
            metrics['faturamento'] = result['total']
        elif result['_id'] == 'custo':
            metrics['custos'] = result['total']
        elif result['_id'] == 'despesa':
            metrics['despesas'] = result['total']
    
    metrics['lucro_liquido'] = metrics['faturamento'] - metrics['custos'] - metrics['despesas']
    
    return metrics

# ========== ROTAS DE META MENSAL ==========

@api_router.post("/monthly-goal")
async def create_monthly_goal(goal_data: MonthlyGoalCreate):
    # Verificar se já existe meta para o mês
    existing = await db.monthly_goals.find_one({
        "company_id": goal_data.company_id,
        "month": goal_data.month
    })
    
    if existing:
        # Atualizar
        await db.monthly_goals.update_one(
            {"id": existing['id']},
            {"$set": {"goal_amount": goal_data.goal_amount}}
        )
        return {"message": "Meta atualizada com sucesso!"}
    
    # Criar nova
    goal = MonthlyGoal(**goal_data.model_dump())
    doc = goal.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.monthly_goals.insert_one(doc)
    
    return {"message": "Meta criada com sucesso!", "goal_id": goal.id}

@api_router.get("/monthly-goal/{company_id}/{month}")
async def get_monthly_goal(company_id: str, month: str):
    goal = await db.monthly_goals.find_one({
        "company_id": company_id,
        "month": month
    }, {"_id": 0})
    
    if not goal:
        return {"goal_amount": 0}
    
    return goal

# ========== ROTAS DE CATEGORIAS ==========

# Categorias padrão do sistema organizadas por tipo
CATEGORIAS_PADRAO = {
    "receita": [
        "Vendas de produtos",
        "Vendas de serviços",
        "Mensalidades / Assinaturas",
        "Honorários / Consultoria",
        "Comissões recebidas",
        "Receitas recorrentes (planos, contratos)",
        "Receitas eventuais (jobs pontuais, extras)",
        "Receitas financeiras (juros, rendimentos)",
        "Descontos obtidos",
        "Outras receitas operacionais"
    ],
    "custo": [
        "Matéria-prima",
        "Embalagens",
        "Frete de compras",
        "Frete de vendas / entrega",
        "Mão de obra direta (produção/serviço)",
        "Insumos de produção (peças, químicos, materiais)",
        "Terceirização de produção / serviços",
        "Energia elétrica da produção",
        "Impostos sobre vendas",
        "Comissões sobre vendas",
        "Taxas de plataformas de venda (marketplaces, apps etc.)",
        "Outros custos operacionais diretos"
    ],
    "despesa": [
        # Administrativas / estruturais
        "Aluguel e condomínio",
        "Água, luz, telefone e internet",
        "Salários administrativos",
        "Encargos trabalhistas (INSS, FGTS, benefícios)",
        "Contabilidade e assessoria",
        "Licenças, alvarás e taxas",
        "Seguros (empresa, veículos, responsabilidade civil)",
        "Material de escritório e limpeza",
        # Comerciais / marketing
        "Marketing e anúncios (Google, Meta, etc.)",
        "Materiais promocionais e brindes",
        "Viagens e representação comercial",
        "Comissões de representantes",
        # Tecnologia / operação
        "Softwares e sistemas (SaaS em geral)",
        "Hospedagem de site / e-mail",
        "Manutenção de máquinas, equipamentos e TI",
        "Manutenção de veículos",
        # Financeiras / tributos
        "Tarifas bancárias",
        "Juros bancários",
        "Taxas de cartão de crédito/débito",
        "Multas e encargos",
        "Tributos fixos (Simples, ISS, ICMS fixo etc.)",
        # Coringa
        "Outras despesas operacionais"
    ]
}

@api_router.get("/categories")
async def get_categories(company_id: Optional[str] = None):
    """
    Retorna categorias padrão + personalizadas (se company_id fornecido)
    Organizado por tipo: receita, custo, despesa
    """
    categories = {
        "receita": CATEGORIAS_PADRAO["receita"].copy(),
        "custo": CATEGORIAS_PADRAO["custo"].copy(),
        "despesa": CATEGORIAS_PADRAO["despesa"].copy()
    }
    
    # Buscar categorias personalizadas da empresa
    if company_id:
        custom_cats = await db.custom_categories.find(
            {"company_id": company_id},
            {"_id": 0}
        ).to_list(None)
        
        for cat in custom_cats:
            tipo = cat['tipo']
            if tipo in categories:
                categories[tipo].append(cat['nome'])
    
    return categories

# ========== ROTAS DE CATEGORIAS PERSONALIZADAS ==========

@api_router.get("/custom-categories/{company_id}")
async def get_custom_categories(company_id: str):
    """Listar todas as categorias personalizadas de uma empresa"""
    categories = await db.custom_categories.find(
        {"company_id": company_id},
        {"_id": 0}
    ).sort("nome", 1).to_list(None)
    return categories

@api_router.post("/custom-categories")
async def create_custom_category(category_data: CustomCategoryCreate):
    """Criar nova categoria personalizada"""
    # Validar tipo
    if category_data.tipo not in ["receita", "custo", "despesa"]:
        raise HTTPException(status_code=400, detail="Tipo deve ser: receita, custo ou despesa")
    
    # Verificar se já existe categoria com mesmo nome e tipo para essa empresa
    existing = await db.custom_categories.find_one({
        "company_id": category_data.company_id,
        "tipo": category_data.tipo,
        "nome": category_data.nome
    })
    
    if existing:
        raise HTTPException(status_code=400, detail="Categoria já existe para este tipo")
    
    category = CustomCategory(**category_data.model_dump())
    doc = category.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.custom_categories.insert_one(doc)
    
    return {"message": "Categoria criada com sucesso!", "category_id": category.id}

@api_router.put("/custom-categories/{category_id}")
async def update_custom_category(category_id: str, category_data: CustomCategoryCreate):
    """Atualizar categoria personalizada"""
    # Validar tipo
    if category_data.tipo not in ["receita", "custo", "despesa"]:
        raise HTTPException(status_code=400, detail="Tipo deve ser: receita, custo ou despesa")
    
    result = await db.custom_categories.update_one(
        {"id": category_id},
        {"$set": {
            "tipo": category_data.tipo,
            "nome": category_data.nome
        }}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Categoria não encontrada")
    
    return {"message": "Categoria atualizada com sucesso!"}

@api_router.delete("/custom-categories/{category_id}")
async def delete_custom_category(category_id: str):
    """Deletar categoria personalizada"""
    result = await db.custom_categories.delete_one({"id": category_id})
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Categoria não encontrada")
    
    return {"message": "Categoria excluída com sucesso!"}

# ========== ROTAS DE ORÇAMENTOS ==========

async def gerar_numero_orcamento(empresa_id: str):
    """Gerar número sequencial de orçamento (formato: LL-YYYY-NNNN)"""
    ano_atual = datetime.now().year
    
    # Buscar último orçamento do ano
    ultimo_orcamento = await db.orcamentos.find_one(
        {
            "empresa_id": empresa_id,
            "numero_orcamento": {"$regex": f"^LL-{ano_atual}-"}
        },
        sort=[("created_at", -1)]
    )
    
    if ultimo_orcamento:
        # Extrair número do último orçamento
        try:
            ultimo_numero = int(ultimo_orcamento['numero_orcamento'].split('-')[-1])
            proximo_numero = ultimo_numero + 1
        except:
            proximo_numero = 1
    else:
        proximo_numero = 1
    
    return f"LL-{ano_atual}-{proximo_numero:04d}"

@api_router.post("/orcamentos")
async def create_orcamento(orcamento_data: OrcamentoCreate):
    """Criar novo orçamento"""
    # Gerar número do orçamento
    numero_orcamento = await gerar_numero_orcamento(orcamento_data.empresa_id)
    
    orcamento = Orcamento(
        numero_orcamento=numero_orcamento,
        **orcamento_data.model_dump()
    )
    
    doc = orcamento.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    doc['updated_at'] = doc['updated_at'].isoformat()
    await db.orcamentos.insert_one(doc)
    
    return {"message": "Orçamento criado com sucesso!", "orcamento_id": orcamento.id, "numero_orcamento": numero_orcamento}


# ========== URL AMIGÁVEL DO ORÇAMENTO ==========

@api_router.get("/orcamento/view/{numero}")
async def get_orcamento_by_numero_html(numero: str):
    """
    URL amigável para visualização do orçamento
    Aceita: /api/orcamento/view/LL-2024-0001 ou /api/orcamento/view/0001
    Exemplo: https://lucroliquido.com/api/orcamento/view/LL-2025-0002
    """
    from fastapi.responses import RedirectResponse
    
    # Tentar encontrar o orçamento pelo número
    # Primeiro, tenta encontrar pelo número completo (ex: LL-2024-0001)
    orcamento = await db.orcamentos.find_one({"numero_orcamento": numero}, {"_id": 0, "id": 1})
    
    if not orcamento:
        # Tenta encontrar apenas pelo número final (ex: 0001)
        # Busca orçamentos que terminam com esse número
        orcamento = await db.orcamentos.find_one(
            {"numero_orcamento": {"$regex": f"-{numero}$"}},
            {"_id": 0, "id": 1}
        )
    
    if not orcamento:
        # Tenta buscar removendo zeros à esquerda (ex: 1 encontra 0001)
        numero_padded = numero.zfill(4)
        orcamento = await db.orcamentos.find_one(
            {"numero_orcamento": {"$regex": f"-{numero_padded}$"}},
            {"_id": 0, "id": 1}
        )
    
    if not orcamento:
        raise HTTPException(status_code=404, detail=f"Orçamento {numero} não encontrado")
    
    # Redireciona para o endpoint HTML existente
    return RedirectResponse(url=f"/api/orcamento/{orcamento['id']}/html", status_code=302)


@api_router.get("/orcamentos/{empresa_id}")
async def get_orcamentos(
    empresa_id: str,
    status: Optional[str] = None,
    data_inicio: Optional[str] = None,
    data_fim: Optional[str] = None,
    cliente: Optional[str] = None
):
    """Listar orçamentos com filtros"""
    query = {"empresa_id": empresa_id}
    
    if status:
        query["status"] = status
    if cliente:
        query["cliente_nome"] = {"$regex": cliente, "$options": "i"}
    if data_inicio and data_fim:
        query["created_at"] = {
            "$gte": data_inicio,
            "$lte": data_fim
        }
    
    orcamentos = await db.orcamentos.find(query, {"_id": 0}).sort("created_at", -1).limit(100).to_list(None)
    return orcamentos

@api_router.get("/orcamento/{orcamento_id}")
async def get_orcamento_detail(orcamento_id: str):
    """Buscar detalhes de um orçamento específico"""
    orcamento = await db.orcamentos.find_one({"id": orcamento_id}, {"_id": 0})
    
    if not orcamento:
        raise HTTPException(status_code=404, detail="Orçamento não encontrado")
    
    return orcamento

@api_router.put("/orcamento/{orcamento_id}")
async def update_orcamento(orcamento_id: str, orcamento_data: OrcamentoCreate):
    """Atualizar orçamento"""
    update_doc = orcamento_data.model_dump()
    update_doc['updated_at'] = datetime.now(timezone.utc).isoformat()
    
    result = await db.orcamentos.update_one(
        {"id": orcamento_id},
        {"$set": update_doc}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Orçamento não encontrado")
    
    return {"message": "Orçamento atualizado com sucesso!"}

@api_router.delete("/orcamento/{orcamento_id}")
async def delete_orcamento(orcamento_id: str):
    """Deletar orçamento"""
    result = await db.orcamentos.delete_one({"id": orcamento_id})
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Orçamento não encontrado")
    
    return {"message": "Orçamento excluído com sucesso!"}

@api_router.patch("/orcamento/{orcamento_id}/status")
async def update_orcamento_status(orcamento_id: str, status_data: OrcamentoStatusUpdate):
    """Atualizar status do orçamento"""
    orcamento = await db.orcamentos.find_one({"id": orcamento_id})
    
    if not orcamento:
        raise HTTPException(status_code=404, detail="Orçamento não encontrado")
    
    update_fields = {
        "status": status_data.status,
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    
    # Atualizar datas específicas baseado no status
    if status_data.status == "ENVIADO":
        update_fields['enviado_em'] = datetime.now(timezone.utc).isoformat()
        if status_data.canal_envio:
            update_fields['canal_envio'] = status_data.canal_envio
    elif status_data.status == "APROVADO":
        update_fields['aprovado_em'] = datetime.now(timezone.utc).isoformat()
    elif status_data.status == "NAO_APROVADO":
        update_fields['nao_aprovado_em'] = datetime.now(timezone.utc).isoformat()
    
    await db.orcamentos.update_one({"id": orcamento_id}, {"$set": update_fields})
    
    return {"message": f"Status atualizado para {status_data.status}!"}

def generate_pdf_with_reportlab(orcamento: dict, empresa: dict, materiais: list = None, config: dict = None) -> bytes:
    """Gerar PDF usando ReportLab com configurações personalizadas"""
    from reportlab.lib.pagesizes import A4
    from reportlab.lib.units import mm
    from reportlab.pdfgen import canvas as pdf_canvas
    from reportlab.lib.colors import HexColor
    from datetime import datetime as dt
    from reportlab.platypus import SimpleDocTemplate, Table, TableStyle
    
    if materiais is None:
        materiais = []
    
    if config is None:
        config = {
            'cor_primaria': '#7C3AED',
            'cor_secundaria': '#3B82F6',
            'texto_ciencia': 'Declaro, para os devidos fins, que aceito esta proposta comercial de prestação de serviços nas condições acima citadas.',
            'texto_garantia': 'Os serviços executados possuem garantia conforme especificações técnicas e normas vigentes.',
            'logo_url': None
        }
    
    buffer = BytesIO()
    c = pdf_canvas.Canvas(buffer, pagesize=A4)
    width, height = A4
    
    # Cores personalizadas do CONFIG
    primary_color = HexColor(config.get('cor_primaria', '#7C3AED'))
    secondary_color = HexColor(config.get('cor_secundaria', '#3B82F6'))
    text_color = HexColor('#000000')  # Texto sempre preto
    bg_light = HexColor('#F9FAFB')  # Fundo claro para cards
    
    # Função auxiliar para desenhar card com borda colorida no estilo da imagem
    def draw_card_box(y_top, height_mm, border_color, border_width=1):
        """Desenha um card com borda lateral esquerda colorida e grossa"""
        # Fundo claro do card com cantos arredondados
        c.setFillColor(bg_light)
        c.roundRect(15*mm, y_top - height_mm, width - 30*mm, height_mm, 2*mm, fill=True, stroke=False)
        
        # Borda lateral ESQUERDA colorida (grossa)
        c.setFillColor(border_color)
        c.roundRect(15*mm, y_top - height_mm, border_width*mm, height_mm, 2*mm, fill=True, stroke=False)
        
        # Borda fina cinza ao redor
        c.setStrokeColor(HexColor('#D1D5DB'))
        c.setLineWidth(0.5)
        c.roundRect(15*mm, y_top - height_mm, width - 30*mm, height_mm, 2*mm, fill=False, stroke=True)
    
    # (1) CABEÇALHO - Logo + Dados da Empresa
    y_pos = height - 15*mm
    
    # Tentar carregar logo se existir
    logo_path = None
    if config.get('logo_url'):
        try:
            logo_file = Path(ROOT_DIR) / config['logo_url'].lstrip('/')
            if logo_file.exists():
                logo_path = str(logo_file)
        except:
            pass
    
    # Se tem logo, desenhar (ajustado para não sobrepor linha)
    if logo_path:
        try:
            # Logo menor e mais compacta
            c.drawImage(logo_path, 15*mm, y_pos - 20*mm, width=35*mm, height=20*mm, preserveAspectRatio=True, mask='auto')
        except Exception as e:
            logger.warning(f"Erro ao carregar logo: {e}")
    
    # Dados da empresa ao lado da logo (ou início se não tiver logo)
    x_empresa = 55*mm if logo_path else 15*mm
    y_empresa = y_pos
    
    c.setFillColor(text_color)
    c.setFont("Helvetica-Bold", 11)
    # Apenas o nome da empresa sem prefixo
    c.drawString(x_empresa, y_empresa, empresa.get('razao_social') or empresa.get('name', ''))
    y_empresa -= 5*mm
    
    c.setFont("Helvetica", 8)
    # CNPJ
    if empresa.get('cnpj'):
        c.drawString(x_empresa, y_empresa, f"CNPJ: {empresa.get('cnpj')}")
        y_empresa -= 4*mm
    
    # Endereço completo - CAMPOS CORRETOS
    endereco_parts = []
    if empresa.get('logradouro'):
        endereco_parts.append(empresa.get('logradouro'))
        if empresa.get('numero'):
            endereco_parts[-1] += f", {empresa.get('numero')}"
        if empresa.get('complemento'):
            endereco_parts[-1] += f", {empresa.get('complemento')}"
    if empresa.get('bairro'):
        endereco_parts.append(empresa.get('bairro'))
    if empresa.get('cidade'):
        cidade_estado = empresa.get('cidade')
        if empresa.get('estado'):
            cidade_estado += f" - {empresa.get('estado')}"
        endereco_parts.append(cidade_estado)
    if empresa.get('cep'):
        endereco_parts.append(f"CEP: {empresa.get('cep')}")
    
    if endereco_parts:
        endereco_completo = ', '.join(endereco_parts)
        # Quebrar endereço se muito longo
        if len(endereco_completo) > 80:
            # Primeira linha
            c.drawString(x_empresa, y_empresa, f"Endereço: {endereco_completo[:80]}")
            y_empresa -= 4*mm
            # Segunda linha
            c.drawString(x_empresa + 15*mm, y_empresa, endereco_completo[80:])
            y_empresa -= 4*mm
        else:
            c.drawString(x_empresa, y_empresa, f"Endereço: {endereco_completo}")
            y_empresa -= 4*mm
    
    # Telefones - CAMPOS CORRETOS
    telefones = []
    if empresa.get('telefone_fixo'):
        telefones.append(f"Tel: {empresa.get('telefone_fixo')}")
    if empresa.get('celular_whatsapp'):
        telefones.append(f"WhatsApp: {empresa.get('celular_whatsapp')}")
    
    if telefones:
        c.drawString(x_empresa, y_empresa, ' | '.join(telefones))
        y_empresa -= 4*mm
    
    # E-mail - CAMPO CORRETO
    if empresa.get('email_empresa'):
        c.drawString(x_empresa, y_empresa, f"E-mail: {empresa.get('email_empresa')}")
        y_empresa -= 4*mm
    
    # Site
    if empresa.get('site'):
        c.drawString(x_empresa, y_empresa, f"Site: {empresa.get('site')}")
        y_empresa -= 4*mm
    
    # Calcular posição da linha (abaixo de tudo)
    y_pos = min(y_pos - 25*mm, y_empresa - 5*mm)
    
    # Linha separadora (agora não sobrepõe a logo)
    c.setStrokeColor(primary_color)
    c.setLineWidth(2)
    c.line(15*mm, y_pos, width - 15*mm, y_pos)
    y_pos -= 10*mm
    
    # Título ORÇAMENTO centralizado
    c.setFillColor(primary_color)
    c.setFont("Helvetica-Bold", 20)
    titulo_width = c.stringWidth("ORÇAMENTO", "Helvetica-Bold", 20)
    c.drawString((width - titulo_width) / 2, y_pos, "ORÇAMENTO")
    y_pos -= 5*mm
    
    # Número e Data
    c.setFont("Helvetica", 10)
    numero_orcamento = f"Nº {orcamento.get('numero_orcamento', 'N/A')}"
    data_emissao = orcamento.get('created_at', '')
    if isinstance(data_emissao, str) and len(data_emissao) >= 10:
        try:
            data_emissao = dt.fromisoformat(data_emissao.replace('Z', '+00:00'))
            data_emissao = data_emissao.strftime("%d/%m/%Y")
        except:
            data_emissao = data_emissao[:10]
    else:
        data_emissao = dt.now().strftime("%d/%m/%Y")
    
    c.drawCentredString(width / 2, y_pos, f"{numero_orcamento} | Data: {data_emissao}")
    y_pos -= 10*mm
    
    # (2) DADOS DO CLIENTE - Com card
    if y_pos < 50*mm:
        c.showPage()
        y_pos = height - 20*mm
    
    card_height = 25*mm
    draw_card_box(y_pos, card_height, primary_color)
    
    c.setFillColor(text_color)
    c.setFont("Helvetica-Bold", 12)
    c.drawString(20*mm, y_pos - 5*mm, "DADOS DO CLIENTE")
    
    c.setFont("Helvetica", 9)
    c.drawString(20*mm, y_pos - 10*mm, f"Cliente: {orcamento.get('cliente_nome', '')}")
    
    if orcamento.get('cliente_documento'):
        c.drawString(20*mm, y_pos - 14*mm, f"CPF/CNPJ: {orcamento.get('cliente_documento')}")
    
    if orcamento.get('cliente_endereco'):
        c.drawString(20*mm, y_pos - 18*mm, f"Endereço: {orcamento.get('cliente_endereco')}")
    
    c.drawString(20*mm, y_pos - 22*mm, f"Data da Emissão: {data_emissao}")
    
    y_pos -= (card_height + 8*mm)
    
    # (3) APRESENTAÇÃO
    c.setFont("Helvetica-Bold", 11)
    c.drawString(20*mm, y_pos, "Proposta comercial para prestação de serviços")
    y_pos -= 6*mm
    
    c.setFont("Helvetica", 9)
    # A pedido do usuário, não exibir mais o nome do cliente nesta saudação
    c.drawString(20*mm, y_pos, "Prezado(a) Senhor(a),")
    y_pos -= 4*mm
    c.drawString(20*mm, y_pos, "apresentamos-lhe nossa proposta comercial para a prestação do(s) serviço(s) abaixo discriminado(s):")
    y_pos -= 8*mm
    
    # (4) DADOS DO ORÇAMENTO - DESCRIÇÃO DO SERVIÇO - Com card
    # Calcular altura necessária para o card
    descricao = orcamento.get('descricao_servico_ou_produto', '')
    max_width = width - 40*mm
    words = descricao.split()
    line = ""
    num_lines = 1
    for word in words:
        test_line = line + word + " "
        if c.stringWidth(test_line, "Helvetica", 9) < max_width:
            line = test_line
        else:
            num_lines += 1
            line = word + " "
    
    desc_card_height = (10 + num_lines * 4)*mm
    if y_pos - desc_card_height < 30*mm:
        c.showPage()
        y_pos = height - 20*mm
    
    draw_card_box(y_pos, desc_card_height, secondary_color)
    
    c.setFillColor(text_color)
    c.setFont("Helvetica-Bold", 12)
    c.drawString(18*mm, y_pos - 5*mm, "DESCRIÇÃO DO SERVIÇO")
    
    # Desenhar texto da descrição
    c.setFont("Helvetica", 9)
    y_text = y_pos - 10*mm
    line = ""
    for word in words:
        test_line = line + word + " "
        if c.stringWidth(test_line, "Helvetica", 9) < max_width:
            line = test_line
        else:
            c.drawString(18*mm, y_text, line.strip())
            y_text -= 4*mm
            line = word + " "
    if line:
        c.drawString(18*mm, y_text, line.strip())
    
    y_pos -= (desc_card_height + 8*mm)
    
    # (5) MATERIAIS NECESSÁRIOS (fornecidos e pagos pelo cliente)
    # Vamos calcular o total de materiais para usar depois no quadro de VALORES
    total_materiais = 0
    if materiais and len(materiais) > 0:
        if y_pos < 90*mm:
            c.showPage()
            y_pos = height - 20*mm
        
        c.setFont("Helvetica-Bold", 12)
        c.drawString(15*mm, y_pos, "MATERIAIS NECESSÁRIOS (fornecidos e pagos pelo cliente)")
        y_pos -= 6*mm
        
        # Cabeçalho da tabela
        c.setFont("Helvetica-Bold", 8)
        c.drawString(15*mm, y_pos, "Material")
        c.drawString(75*mm, y_pos, "Quantidade")
        c.drawString(105*mm, y_pos, "Valor Unitário")
        c.drawString(140*mm, y_pos, "Valor Total")
        y_pos -= 4*mm
        
        # Linha separadora
        c.setStrokeColor(HexColor('#CCCCCC'))
        c.line(15*mm, y_pos, width - 15*mm, y_pos)
        y_pos -= 5*mm
        
        # Listar materiais
        c.setFont("Helvetica", 8)
        for material in materiais:
            # Verificar se precisa de nova página
            if y_pos < 40*mm:
                c.showPage()
                y_pos = height - 20*mm
            
            # Nome do material
            nome_item = material.get('nome_item', '')
            if len(nome_item) > 40:
                nome_item = nome_item[:37] + "..."
            c.drawString(15*mm, y_pos, nome_item)
            
            # Quantidade + Unidade
            qtd = material.get('quantidade', 0)
            unidade = material.get('unidade', '')
            c.drawString(75*mm, y_pos, f"{qtd:.2f} {unidade}")
            
            # Preço unitário final (formatado)
            preco_unit = material.get('preco_unitario_final', 0)
            preco_unit_fmt = f"R$ {preco_unit:,.2f}".replace(',', 'X').replace('.', ',').replace('X', '.')
            c.drawString(105*mm, y_pos, preco_unit_fmt)
            
            # Total do item (formatado)
            total_item = material.get('preco_total_item', 0)
            total_item_fmt = f"R$ {total_item:,.2f}".replace(',', 'X').replace('.', ',').replace('X', '.')
            c.drawString(140*mm, y_pos, total_item_fmt)
            
            total_materiais += total_item
            y_pos -= 4*mm
        
        # Linha separadora
        c.setStrokeColor(HexColor('#CCCCCC'))
        c.line(15*mm, y_pos, width - 15*mm, y_pos)
        y_pos -= 5*mm
        
        # Total de materiais (apenas exibido, mas também será usado no quadro VALORES)
        c.setFont("Helvetica-Bold", 9)
        total_mat_fmt = f"R$ {total_materiais:,.2f}".replace(',', 'X').replace('.', ',').replace('X', '.')
        c.drawRightString(width - 15*mm, y_pos, f"Total de Materiais: {total_mat_fmt}")
        y_pos -= 6*mm
        
        # Observação sobre materiais adicionais
        c.setFont("Helvetica-Oblique", 8)
        c.drawString(15*mm, y_pos, "Observação importante: Caso haja necessidade de materiais adicionais ou substituições não previstas,")
        y_pos -= 3*mm
        c.drawString(15*mm, y_pos, "o custo será integralmente do cliente mediante aprovação prévia.")
        y_pos -= 8*mm
    
    # (6) PRAZO PARA EXECUÇÃO
    if y_pos < 40*mm:
        c.showPage()
        y_pos = height - 20*mm
    
    c.setFont("Helvetica-Bold", 12)
    c.drawString(15*mm, y_pos, "PRAZO PARA EXECUÇÃO")
    y_pos -= 6*mm
    
    c.setFont("Helvetica", 9)
    prazo = orcamento.get('prazo_execucao', '')
    c.drawString(15*mm, y_pos, f"O serviço será concluído em aproximadamente {prazo}.")
    y_pos -= 8*mm
    
    # (7) VALORES - Com card destacado
    valores_card_height = 35*mm
    if y_pos - valores_card_height < 30*mm:
        c.showPage()
        y_pos = height - 20*mm
    
    draw_card_box(y_pos, valores_card_height, primary_color, border_width=1)
    
    c.setFillColor(text_color)
    c.setFont("Helvetica-Bold", 12)
    c.drawString(18*mm, y_pos - 5*mm, "VALORES")
    
    c.setFont("Helvetica", 9)
    # Valor do serviço (preço praticado)
    valor_servico = orcamento.get('preco_praticado', 0)
    valor_servico_fmt = f"R$ {valor_servico:,.2f}".replace(',', 'X').replace('.', ',').replace('X', '.')
    c.drawString(18*mm, y_pos - 11*mm, f"Valor do Serviço: {valor_servico_fmt}")
    
    # Valor dos materiais (total calculado na seção de materiais)
    valor_materiais_fmt = f"R$ {total_materiais:,.2f}".replace(',', 'X').replace('.', ',').replace('X', '.')
    c.drawString(18*mm, y_pos - 15*mm, f"Valor dos Materiais: {valor_materiais_fmt}")
    
    # Valor total = serviço + materiais
    valor_total = valor_servico + total_materiais
    valor_total_fmt = f"R$ {valor_total:,.2f}".replace(',', 'X').replace('.', ',').replace('X', '.')
    c.drawString(18*mm, y_pos - 19*mm, f"Valor Total: {valor_total_fmt}")
    
    # Condições de pagamento
    c.setFillColor(text_color)
    c.setFont("Helvetica", 9)
    c.drawString(18*mm, y_pos - 27*mm, f"Validade da Proposta: {orcamento.get('validade_proposta', '')}")
    c.drawString(18*mm, y_pos - 31*mm, f"Condições de Pagamento: {orcamento.get('condicoes_pagamento', '')}")
    
    y_pos -= (valores_card_height + 10*mm)
    
    # (8) CIÊNCIA E ACEITAÇÃO DO CLIENTE
    if y_pos < 60*mm:
        c.showPage()
        y_pos = height - 20*mm
    
    c.setFont("Helvetica-Bold", 12)
    c.drawString(15*mm, y_pos, "CIÊNCIA E ACEITAÇÃO DO CLIENTE")
    y_pos -= 6*mm
    
    c.setFont("Helvetica", 9)
    texto_ciencia = config.get('texto_ciencia', 'Declaro, para os devidos fins, que aceito esta proposta comercial.')
    # Quebrar texto em múltiplas linhas
    max_width = width - 30*mm
    words = texto_ciencia.split()
    line = ""
    for word in words:
        test_line = line + word + " "
        if c.stringWidth(test_line, "Helvetica", 9) < max_width:
            line = test_line
        else:
            c.drawString(15*mm, y_pos, line.strip())
            y_pos -= 4*mm
            line = word + " "
    if line:
        c.drawString(15*mm, y_pos, line.strip())
        y_pos -= 8*mm
    
    # (9) GARANTIA DOS SERVIÇOS
    c.setFont("Helvetica-Bold", 12)
    c.drawString(15*mm, y_pos, "GARANTIA DOS SERVIÇOS")
    y_pos -= 6*mm
    
    c.setFont("Helvetica", 9)
    texto_garantia = config.get('texto_garantia', 'Os serviços executados possuem garantia.')
    # Quebrar texto em múltiplas linhas
    words = texto_garantia.split()
    line = ""
    for word in words:
        test_line = line + word + " "
        if c.stringWidth(test_line, "Helvetica", 9) < max_width:
            line = test_line
        else:
            c.drawString(15*mm, y_pos, line.strip())
            y_pos -= 4*mm
            line = word + " "
    if line:
        c.drawString(15*mm, y_pos, line.strip())
        y_pos -= 10*mm
    
    # (10) ASSINATURA DO CLIENTE
    if y_pos < 50*mm:
        c.showPage()
        y_pos = height - 20*mm
    
    c.setFont("Helvetica-Bold", 11)
    c.drawString(15*mm, y_pos, "ASSINATURA DO CLIENTE")
    y_pos -= 8*mm
    
    c.setFont("Helvetica", 9)
    c.drawString(15*mm, y_pos, f"Cliente: {orcamento.get('cliente_nome', '')}")
    y_pos -= 10*mm
    
    # Linha de assinatura
    c.setFillColor(text_color)
    c.line(15*mm, y_pos, 90*mm, y_pos)
    y_pos -= 4*mm
    c.setFont("Helvetica", 8)
    c.drawString(15*mm, y_pos, "Assinatura")
    y_pos -= 8*mm
    
    c.drawString(15*mm, y_pos, f"Data: ____/____/______")
    y_pos -= 15*mm
    
    # (11) ASSINATURA DA EMPRESA
    c.setFont("Helvetica-Bold", 11)
    c.drawString(15*mm, y_pos, "ASSINATURA DA EMPRESA")
    y_pos -= 8*mm
    
    c.setFont("Helvetica", 9)
    # Puxar dados da empresa
    responsavel = empresa.get('proprietario') or empresa.get('name', '')
    c.drawString(15*mm, y_pos, f"Responsável pela Empresa: {responsavel}")
    y_pos -= 4*mm
    c.drawString(15*mm, y_pos, f"Empresa: {empresa.get('razao_social') or empresa.get('name', '')}")
    y_pos -= 10*mm
    
    # Linha de assinatura
    c.setFillColor(text_color)
    c.line(15*mm, y_pos, 90*mm, y_pos)
    y_pos -= 4*mm
    c.setFont("Helvetica", 8)
    c.drawString(15*mm, y_pos, "Assinatura")
    
    # (12) RODAPÉ DO PDF
    # A pedido do usuário, não exibimos mais dados da empresa no rodapé
    # Mantemos apenas a criação da nova página para finalizar o documento
    
    c.showPage()
    c.save()
    
    buffer.seek(0)
    return buffer.getvalue()

@api_router.get("/orcamento/{orcamento_id}/pdf")
async def generate_orcamento_pdf(orcamento_id: str):
    """Gerar PDF do orçamento usando apenas o modelo clássico em ReportLab (modelo antigo)."""
    # Buscar orçamento
    orcamento = await db.orcamentos.find_one({"id": orcamento_id}, {"_id": 0})
    
    if not orcamento:
        raise HTTPException(status_code=404, detail="Orçamento não encontrado")
    
    # Buscar dados da empresa
    empresa = await db.companies.find_one({"id": orcamento['empresa_id']}, {"_id": 0})
    
    if not empresa:
        empresa = {"name": "Empresa"}
    
    # Buscar materiais do orçamento
    materiais = await db.orcamento_materiais.find(
        {"id_orcamento": orcamento_id},
        {"_id": 0}
    ).to_list(1000)
    
    # Buscar configuração de orçamento (cores, textos, logo)
    config = await db.orcamento_config.find_one({"company_id": empresa.get('id')}, {"_id": 0})
    
    # Gerar PDF usando o modelo clássico em ReportLab
    pdf_bytes = generate_pdf_with_reportlab(orcamento, empresa, materiais, config)
    
    return StreamingResponse(
        BytesIO(pdf_bytes),
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename=orcamento_{orcamento.get('numero_orcamento', orcamento_id)}.pdf"}
    )


# Funções auxiliares para gerar HTML de parcelas e botão de aceite
def gerar_html_parcelas(orcamento: dict, valor_total: float) -> str:
    """Gera o HTML das parcelas de pagamento"""
    forma_pagamento = orcamento.get('forma_pagamento', 'avista')
    valor_entrada = orcamento.get('valor_entrada', 0)
    entrada_percentual = orcamento.get('entrada_percentual', 0)
    parcelas = orcamento.get('parcelas', [])
    
    def format_money(val):
        return f"R$ {val:,.2f}".replace(",", "X").replace(".", ",").replace("X", ".")
    
    if forma_pagamento == 'avista':
        return f'''
        <div style="padding:10px 0;">
            <div style="display:flex; justify-content:space-between; padding:8px 0; border-bottom:1px dashed var(--border);">
                <span>À Vista</span>
                <strong style="color:var(--green);">{format_money(valor_total)}</strong>
            </div>
        </div>
        '''
    
    # Entrada + Parcelas
    html = '<div style="padding:10px 0;">'
    
    if valor_entrada > 0:
        html += f'''
        <div style="display:flex; justify-content:space-between; padding:8px 0; border-bottom:1px dashed var(--border);">
            <span>Entrada ({entrada_percentual}%)</span>
            <strong style="color:var(--green);">{format_money(valor_entrada)}</strong>
        </div>
        '''
    
    for i, parcela in enumerate(parcelas):
        html += f'''
        <div style="display:flex; justify-content:space-between; padding:8px 0; border-bottom:1px dashed var(--border);">
            <span>Parcela {i+1}</span>
            <strong>{format_money(parcela.get('valor', 0))}</strong>
        </div>
        '''
    
    html += f'''
        <div style="display:flex; justify-content:space-between; padding:12px 0; margin-top:8px; border-top:2px solid var(--green);">
            <span style="font-weight:700;">Total</span>
            <strong style="color:var(--green); font-size:1.2em;">{format_money(valor_total)}</strong>
        </div>
    </div>
    '''
    
    return html


def gerar_botao_fechar_negocio(orcamento: dict) -> str:
    """Gera o botão de 'Fechar Negócio' se o orçamento ainda não foi aceito"""
    status = orcamento.get('status', 'RASCUNHO')
    orcamento_id = orcamento.get('id', '')
    
    if status == 'APROVADO':
        return '''
        <div style="background:#22c55e20; border:2px solid #22c55e; border-radius:12px; padding:20px; text-align:center; margin-top:20px;">
            <span style="font-size:2em;">✅</span>
            <p style="margin:10px 0 0; font-weight:700; color:#22c55e;">Orçamento já foi aceito!</p>
        </div>
        '''
    
    return f'''
    <button class="btn" onclick="fecharNegocio()" style="background:linear-gradient(135deg, #22c55e, #16a34a); font-size:1.1em; padding:15px 30px;">
        ✅ Fechar Negócio
    </button>
    <div id="modal-aceite" style="display:none; position:fixed; top:0; left:0; right:0; bottom:0; background:rgba(0,0,0,0.8); z-index:9999; justify-content:center; align-items:center;">
        <div style="background:#1e1e1e; border-radius:16px; padding:30px; max-width:500px; text-align:center; border:2px solid #22c55e;">
            <span style="font-size:3em;">📋</span>
            <h2 style="color:white; margin:15px 0;">Confirmar Aceite</h2>
            <p style="color:#888; margin-bottom:20px;">Ao clicar em confirmar, você aceita as condições deste orçamento e as parcelas serão geradas automaticamente.</p>
            <div style="display:flex; gap:15px; justify-content:center;">
                <button onclick="cancelarAceite()" style="padding:12px 30px; border-radius:8px; background:#333; color:white; border:none; cursor:pointer;">Cancelar</button>
                <button onclick="confirmarAceite()" style="padding:12px 30px; border-radius:8px; background:#22c55e; color:white; border:none; cursor:pointer; font-weight:700;">✅ Confirmar Aceite</button>
            </div>
        </div>
    </div>
    <script>
        const orcamentoId = "{orcamento_id}";
        
        function fecharNegocio() {{
            document.getElementById('modal-aceite').style.display = 'flex';
        }}
        
        function cancelarAceite() {{
            document.getElementById('modal-aceite').style.display = 'none';
        }}
        
        async function confirmarAceite() {{
            try {{
                const response = await fetch('/api/orcamento/' + orcamentoId + '/aceitar', {{
                    method: 'POST',
                    headers: {{ 'Content-Type': 'application/json' }}
                }});
                
                const data = await response.json();
                
                if (response.ok) {{
                    document.getElementById('modal-aceite').innerHTML = `
                        <div style="background:#1e1e1e; border-radius:16px; padding:40px; max-width:500px; text-align:center; border:2px solid #22c55e;">
                            <span style="font-size:4em;">🎉</span>
                            <h2 style="color:#22c55e; margin:20px 0;">Orçamento Aceito!</h2>
                            <p style="color:#888;">Obrigado! As parcelas foram geradas e a empresa foi notificada.</p>
                            <p style="color:#22c55e; font-weight:700;">${{data.contas_geradas}} parcela(s) criada(s)</p>
                            <button onclick="location.reload()" style="margin-top:20px; padding:12px 30px; border-radius:8px; background:#22c55e; color:white; border:none; cursor:pointer;">OK</button>
                        </div>
                    `;
                }} else {{
                    alert('Erro: ' + (data.detail || 'Erro ao aceitar orçamento'));
                    cancelarAceite();
                }}
            }} catch (error) {{
                alert('Erro de conexão: ' + error.message);
                cancelarAceite();
            }}
        }}
    </script>
    '''


@api_router.get("/orcamento/{orcamento_id}/html")
async def generate_orcamento_html(orcamento_id: str):
    """Gerar visualização HTML do orçamento para impressão e download de PDF"""
    # Buscar orçamento
    orcamento = await db.orcamentos.find_one({"id": orcamento_id}, {"_id": 0})
    
    if not orcamento:
        raise HTTPException(status_code=404, detail="Orçamento não encontrado")
    
    # Buscar dados da empresa
    empresa = await db.companies.find_one({"id": orcamento['empresa_id']}, {"_id": 0})
    
    if not empresa:
        empresa = {"name": "Empresa"}
    
    # Buscar materiais do orçamento
    materiais = await db.orcamento_materiais.find(
        {"id_orcamento": orcamento_id},
        {"_id": 0}
    ).to_list(1000)
    
    # Buscar configuração de orçamento (cores, textos, logo)
    config = await db.orcamento_config.find_one({"company_id": empresa.get('id')}, {"_id": 0})
    
    if not config:
        config = {
            'cor_primaria': '#22c55e',
            'cor_secundaria': '#f97316',
            'texto_ciencia': 'Declaro, para os devidos fins, que aceito esta proposta comercial de prestação de serviços nas condições acima citadas.',
            'texto_garantia': 'Os serviços executados possuem garantia conforme especificações técnicas e normas vigentes.'
        }
    
    # Formatar data
    data_emissao = orcamento.get('created_at', '')
    if isinstance(data_emissao, str) and len(data_emissao) >= 10:
        try:
            from datetime import datetime as dt
            data_emissao = dt.fromisoformat(data_emissao.replace('Z', '+00:00'))
            data_emissao = data_emissao.strftime("%d/%m/%Y")
        except:
            data_emissao = data_emissao[:10]
    else:
        from datetime import datetime as dt
        data_emissao = dt.now().strftime("%d/%m/%Y")
    
    # Calcular total de materiais
    total_materiais = sum(m.get('preco_total_item', 0) for m in materiais)
    valor_servico = orcamento.get('preco_praticado', 0)
    valor_total = valor_servico + total_materiais
    
    # Formatar valores
    def format_money(value):
        return f"R$ {value:,.2f}".replace(',', 'X').replace('.', ',').replace('X', '.')
    
    # Gerar iniciais da empresa para o logo
    nome_empresa = empresa.get('razao_social') or empresa.get('name', 'Empresa')
    iniciais = ''.join([word[0].upper() for word in nome_empresa.split()[:2]])
    
    # Verificar se tem logo configurada e converter para Base64
    logo_url = config.get('logo_url', '')
    logo_base64 = None
    tem_logo = False
    
    if logo_url:
        try:
            # Tentar carregar logo do disco e converter para base64
            logo_path = Path(ROOT_DIR) / logo_url.lstrip('/')
            if logo_path.exists():
                import base64
                with open(logo_path, 'rb') as f:
                    logo_data = f.read()
                    logo_base64 = base64.b64encode(logo_data).decode('utf-8')
                    # Detectar tipo de imagem
                    ext = logo_path.suffix.lower()
                    mime_types = {'.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.gif': 'image/gif', '.svg': 'image/svg+xml'}
                    mime_type = mime_types.get(ext, 'image/jpeg')
                    logo_url = f"data:{mime_type};base64,{logo_base64}"
                    tem_logo = True
        except Exception as e:
            logger.warning(f"Erro ao carregar logo: {e}")
            logo_url = ''
    
    # Construir dados da empresa em 3 linhas
    # Linha 1: CNPJ • Endereço (logradouro, número, bairro)
    linha1_parts = []
    if empresa.get('cnpj'):
        linha1_parts.append(f"CNPJ {empresa.get('cnpj')}")
    
    endereco_linha1 = []
    if empresa.get('logradouro'):
        end = empresa.get('logradouro')
        if empresa.get('numero'):
            end += f", {empresa.get('numero')}"
        endereco_linha1.append(end)
    if empresa.get('bairro'):
        endereco_linha1.append(empresa.get('bairro'))
    
    if endereco_linha1:
        linha1_parts.append(', '.join(endereco_linha1))
    
    linha1 = ' • '.join(linha1_parts) if linha1_parts else ''
    
    # Linha 2: Cidade-Estado, CEP
    linha2_parts = []
    if empresa.get('cidade'):
        cidade_estado = empresa.get('cidade')
        if empresa.get('estado'):
            cidade_estado += f"-{empresa.get('estado')}"
        linha2_parts.append(cidade_estado)
    if empresa.get('cep'):
        linha2_parts.append(empresa.get('cep'))
    
    linha2 = ', '.join(linha2_parts) if linha2_parts else ''
    
    # Linha 3: Email • Site
    linha3_parts = []
    if empresa.get('email_empresa'):
        linha3_parts.append(empresa.get('email_empresa'))
    if empresa.get('site'):
        linha3_parts.append(empresa.get('site'))
    
    linha3 = ' • '.join(linha3_parts) if linha3_parts else ''
    
    # Montar HTML das 3 linhas
    linhas_contato_html = ''
    if linha1:
        linhas_contato_html += linha1
    if linha2:
        if linhas_contato_html:
            linhas_contato_html += '<br>'
        linhas_contato_html += linha2
    if linha3:
        if linhas_contato_html:
            linhas_contato_html += '<br>'
        linhas_contato_html += linha3
    
    # Gerar linhas da tabela de materiais
    materiais_html = ""
    if materiais:
        for material in materiais:
            nome = material.get('nome_item', '')
            qtd = material.get('quantidade', 0)
            unidade = material.get('unidade', '')
            preco_unit = format_money(material.get('preco_unitario_final', 0))
            preco_total = format_money(material.get('preco_total_item', 0))
            
            materiais_html += f"""
                  <tr><td>{nome}</td><td>{qtd:.2f} {unidade}</td><td>{preco_unit}</td><td>{preco_total}</td></tr>"""
    
    # HTML Template
    html_content = f"""<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Orçamento {orcamento.get('numero_orcamento', '')} — {nome_empresa}</title>
<style>
  :root{{
    --ink:#0f172a; --muted:#667085; --panel:#fff; --border:#e5e7eb;
    --green:{config.get('cor_primaria', '#22c55e')}; --orange:{config.get('cor_secundaria', '#f97316')}; --bg-app:#f3f4f6;
  }}
  *{{ box-sizing:border-box; -webkit-print-color-adjust:exact; print-color-adjust:exact; }}
  html,body{{ height:100%; }}
  body{{ margin:0; background:var(--bg-app); color:var(--ink); font:14px/1.6 system-ui,-apple-system,"Segoe UI",Roboto,"Helvetica Neue",Arial,"Noto Sans",sans-serif; }}

  .page{{
    width:210mm; height:297mm; padding:10mm; margin:12px auto; background:#fff;
    box-shadow:0 10px 24px rgba(0,0,0,.08);
    position:relative;
  }}
  .card{{ border:1px solid var(--border); border-radius:14px; overflow:hidden; background:#fff; }}
  .header{{ display:flex; gap:20px; align-items:flex-start; padding:18px 20px; border-bottom:1px solid var(--border); }}
  .brand{{ width:150px;height:150px;border-radius:12px;border:2px solid var(--green);display:grid;place-items:center;font-weight:800;color:var(--green);font-size:48px; }}
  .brand img{{ width:100%;height:100%;object-fit:contain;border-radius:10px; }}
  .brand.has-logo{{ border:none;overflow:hidden; }}
  .hgroup{{ flex:1 1 auto; padding-top:10px; }}
  .hgroup h1{{ margin:0; font-size:20px; font-weight:700; }}
  .hgroup p{{ margin:6px 0 0; color:var(--muted); font-size:13px; line-height:1.5; }}
  .meta{{ text-align:right; padding-top:10px; }}
  .badge{{ display:inline-block;padding:6px 10px;border-radius:999px;border:2px solid var(--orange);color:var(--orange);font-weight:700;letter-spacing:.3px; }}

  .grid{{ display:grid; gap:18px; padding:20px; grid-template-columns:repeat(12,1fr); }}
  .panel{{
    grid-column:span 12; background:#fff; border:1px solid var(--border); border-radius:12px; padding:16px;
    position:relative; z-index:1; break-inside:avoid;
  }}
  .panel h3{{ margin:0 0 10px; color:var(--muted); text-transform:uppercase; letter-spacing:.4px; font-size:12px; }}
  .panel.is-green{{ border-left:4px solid var(--green); }}
  .panel.is-orange{{ border-left:4px solid var(--orange); }}

  .kv{{ display:grid; grid-template-columns:160px 1fr; gap:8px 14px; }}
  .kv div{{ padding:6px 0; border-bottom:1px dashed var(--border); }}

  .service{{ border:1px dashed var(--green); border-left:4px solid var(--green); border-radius:12px; padding:16px; background:#fafafa; break-inside:avoid; }}
  .service h2{{ margin:0 0 6px; font-size:18px; }}

  table{{ width:100%; border-collapse:collapse; }}
  thead th{{ text-align:left; padding:10px 12px; font-size:12px; text-transform:uppercase; color:var(--muted); border-bottom:1px solid var(--border); background:#fafafa; }}
  tbody td{{ padding:12px; border-bottom:1px dashed var(--border); }}
  tbody tr:last-child td{{ border-bottom:none; }}
  tfoot td{{ padding:12px; font-weight:700; border-top:1px solid var(--border); }}

  .totais{{ display:grid; grid-template-columns:1fr; gap:12px; }}
  .money{{ display:flex; justify-content:space-between; align-items:center; padding:12px 14px; border:2px solid var(--green); border-radius:12px; background:#fcfffc; }}
  .money.total{{ border-color:var(--orange); background:#fffaf6; }}

  .obs{{ display:flex; gap:10px; align-items:flex-start; padding:12px 14px; border-radius:12px; border:2px solid var(--orange); background:#fffaf6; }}
  .obs .dot{{ width:10px;height:10px;border-radius:50%;background:var(--orange);margin-top:6px; }}

  .sign{{ display:grid; grid-template-columns:1fr; gap:14px; }}
  .line{{ min-height:120px; padding:16px; border:1px dashed var(--border); border-radius:12px; background:#fafafa; display:flex; flex-direction:column; justify-content:flex-end; }}
  .line .who{{ font-weight:700; }}

  .footer{{ padding:12px 20px 16px; border-top:1px solid var(--border); color:var(--muted); font-size:13px; }}

  .actions{{ position:fixed; right:24px; bottom:24px; display:flex; gap:10px; z-index:9999; }}
  .btn{{ background:#fff; color:var(--ink); border:2px solid var(--green); padding:10px 14px; border-radius:12px; cursor:pointer; font-weight:700; box-shadow:0 8px 24px rgba(0,0,0,.08); }}
  .btn.orange{{ border-color:var(--orange); }}
  .btn:active{{ transform:translateY(1px); }}

  @media print{{
    @page{{ size:A4; margin:0; }}
    body{{ background:#fff; }}
    .page{{ box-shadow:none; margin:0; }}
    .actions{{ display:none !important; }}
  }}
</style>
</head>
<body>

  <!-- Fonte do conteúdo em itens "flow" (paginados via JS) -->
  <div id="flow" style="display:none">
    <section class="flow-item">
      <div class="card">
        <header class="header">
          <div class="brand {' has-logo' if tem_logo else ''}" aria-hidden="true">
            {f'<img src="{logo_url}" alt="Logo da empresa" />' if tem_logo else iniciais}
          </div>
          <div class="hgroup">
            <h1>{nome_empresa}</h1>
            <p>{linhas_contato_html}</p>
          </div>
          <div class="meta">
            <div class="badge">ORÇAMENTO</div>
            <div style="margin-top:8px;">Nº <strong>{orcamento.get('numero_orcamento', 'N/A')}</strong></div>
            <div>Data: <strong>{data_emissao}</strong></div>
          </div>
        </header>
      </div>
    </section>

    <section class="flow-item">
      <div class="card">
        <section class="grid">
          <div class="panel col-6 is-green">
            <h3>Dados do Cliente</h3>
            <div class="kv">
              <div>Cliente</div><div><strong>{orcamento.get('cliente_nome', '')}</strong></div>
              <div>CPF/CNPJ</div><div>{orcamento.get('cliente_documento', '')}</div>
              <div>Endereço</div><div>{orcamento.get('cliente_endereco', '')}</div>
              <div>Data da Emissão</div><div>{data_emissao}</div>
            </div>
          </div>

          <div class="panel col-6 is-orange" style="z-index:2;">
            <h3>Condições</h3>
            <div style="display:flex; flex-wrap:wrap; gap:8px; align-items:center;">
              <span>⏱️ Aproximadamente <strong>{orcamento.get('prazo_execucao', '')}</strong></span>
              <span aria-hidden="true">•</span>
              <span>📅 Validade: <strong>{orcamento.get('validade_proposta', '')}</strong></span>
            </div>
          </div>
        </section>
      </div>
    </section>

    <section class="flow-item">
      <div class="card">
        <section class="grid">
          <div class="service" style="grid-column:span 12;">
            <h2>Descrição do Serviço</h2>
            <p><strong>{orcamento.get('descricao_servico_ou_produto', '')}</strong></p>
          </div>
          {'<div class="panel is-green" style="grid-column: span 12;">' if materiais else ''}
            {'<h3>Materiais Necessários (fornecidos e pagos pelo cliente)</h3>' if materiais else ''}
            {'<div style="overflow:auto;">' if materiais else ''}
              {'<table role="table" aria-label="Materiais">' if materiais else ''}
                {'<thead>' if materiais else ''}
                  {'<tr>' if materiais else ''}
                    {'<th style="width:40%;">Material</th>' if materiais else ''}
                    {'<th>Quantidade</th>' if materiais else ''}
                    {'<th>Valor Unitário</th>' if materiais else ''}
                    {'<th>Valor Total</th>' if materiais else ''}
                  {'</tr>' if materiais else ''}
                {'</thead>' if materiais else ''}
                {'<tbody>' if materiais else ''}
                  {materiais_html}
                {'</tbody>' if materiais else ''}
                {'<tfoot>' if materiais else ''}
                  {'<tr><td colspan="3" style="text-align:right;">Total de Materiais</td><td>' + format_money(total_materiais) + '</td></tr>' if materiais else ''}
                {'</tfoot>' if materiais else ''}
              {'</table>' if materiais else ''}
            {'</div>' if materiais else ''}
            {'<div class="obs" style="margin-top:12px;">' if materiais else ''}
              {'<span class="dot" aria-hidden="true"></span>' if materiais else ''}
              {'<div><strong>Observação:</strong> materiais adicionais/substituições não previstas serão por conta do cliente mediante aprovação prévia.</div>' if materiais else ''}
            {'</div>' if materiais else ''}
          {'</div>' if materiais else ''}
        </section>
      </div>
    </section>

    <section class="flow-item">
      <div class="card">
        <section class="grid">
          <div class="panel col-6 is-green">
            <h3>Valores</h3>
            <div class="totais">
              <div class="money"><span>Valor do Serviço</span><strong>{format_money(valor_servico)}</strong></div>
              <div class="money"><span>Materiais</span><strong>{format_money(total_materiais)}</strong></div>
              <div class="money total"><span>Total</span><strong>{format_money(valor_total)}</strong></div>
            </div>
          </div>

          <div class="panel col-6 is-orange" style="z-index:2;">
            <h3>Condições de Pagamento</h3>
            {gerar_html_parcelas(orcamento, valor_total)}
          </div>
        </section>
      </div>
    </section>

    <section class="flow-item">
      <div class="card">
        <section class="grid">
          <div class="panel is-green" style="grid-column: span 12;">
            <h3>Ciência e Aceitação do Cliente</h3>
            <p style="margin-top:0;">{config.get('texto_ciencia', 'Declaro que aceito esta proposta comercial de prestação de serviços nas condições acima.')}</p>
            <div class="sign">
              <div class="line">
                <div style="border-top:1px solid var(--border); padding-top:10px;">
                  <div class="who">Cliente: {orcamento.get('cliente_nome', '')}</div>
                  <div>Assinatura: _____________________________</div>
                  <div>Data: ____/____/______</div>
                </div>
              </div>
              <div class="line">
                <div style="border-top:1px solid var(--border); padding-top:10px;">
                  <div class="who">Responsável pela Empresa: {empresa.get('proprietario') or empresa.get('name', '')}</div>
                  <div>Empresa: {nome_empresa}</div>
                  <div>Assinatura: _____________________________</div>
                </div>
              </div>
            </div>
          </div>
          <div class="panel is-green" style="grid-column: span 12;">
            <h3>Garantia dos Serviços</h3>
            <p style="margin-top:0;">{config.get('texto_garantia', 'Os serviços executados possuem garantia.')}</p>
          </div>
        </section>
        <footer class="footer">{nome_empresa}{' / ' + (empresa.get('celular_whatsapp') or empresa.get('telefone_fixo') or '') if (empresa.get('celular_whatsapp') or empresa.get('telefone_fixo')) else ''}{' / ' + empresa.get('email_empresa') if empresa.get('email_empresa') else ''}{' / ' + empresa.get('site') if empresa.get('site') else ''}</footer>
      </div>
    </section>
  </div>

  <!-- Páginas geradas -->
  <div id="pages"></div>

  <!-- Botões (fora do PDF) -->
  <div class="actions" data-html2canvas-ignore>
    <button class="btn" onclick="window.print()">🖨️ Imprimir</button>
    <button class="btn orange" onclick="baixarPDF()">⬇️ Baixar PDF</button>
    {gerar_botao_fechar_negocio(orcamento)}
  </div>

<script src="https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js"></script>
<script>
  function mmToPx(mm){{ return mm * (96 / 25.4); }}
  function createPage(){{
    const page = document.createElement('div'); page.className = 'page';
    const inner = document.createElement('div'); inner.className = 'card';
    page.appendChild(inner); return {{ page, inner }};
  }}
  function paginate(){{
    const source = document.getElementById('flow');
    const items = Array.from(source.querySelectorAll('.flow-item'));
    const pagesRoot = document.getElementById('pages'); pagesRoot.innerHTML = '';
    let {{ page, inner }} = createPage(); pagesRoot.appendChild(page);
    const maxPagePx = page.clientHeight; const tolerance = 2;
    for(const item of items){{
      const clone = item.firstElementChild.cloneNode(true);
      inner.appendChild(clone);
      if(page.scrollHeight > maxPagePx + tolerance){{
        inner.removeChild(clone);
        ({{ page, inner }} = createPage()); pagesRoot.appendChild(page);
        inner.appendChild(clone);
      }}
    }}
    source.style.display = 'none'; pagesRoot.style.display = 'block';
  }}
  function baixarPDF(){{
    const el = document.getElementById('pages');
    const opt = {{
      margin: 0,
      filename: 'orcamento-{orcamento.get('numero_orcamento', orcamento_id)}.pdf',
      image: {{ type: 'jpeg', quality: 0.98 }},
      html2canvas: {{ scale: 2, useCORS: true }},
      jsPDF: {{ unit: 'mm', format: 'a4', orientation: 'portrait' }},
      pagebreak: {{ mode: ['css','legacy'] }}
    }};
    html2pdf().set(opt).from(el).save();
  }}
  window.addEventListener('load', paginate);
  window.addEventListener('resize', () => {{ clearTimeout(window.__r); window.__r = setTimeout(paginate, 150); }});
</script>
</body>
</html>"""
    
    return HTMLResponse(content=html_content)


# ========== ANÁLISE IA (CHATGPT) ==========

@api_router.post("/orcamento/{orcamento_id}/whatsapp")
async def enviar_orcamento_whatsapp(orcamento_id: str):
    """
    Prepara o orçamento para envio via WhatsApp
    Retorna uma URL amigável do orçamento (usando número ao invés de UUID)
    """
    import secrets
    import time
    
    # Buscar orçamento
    orcamento = await db.orcamentos.find_one({"id": orcamento_id}, {"_id": 0})
    
    if not orcamento:
        raise HTTPException(status_code=404, detail="Orçamento não encontrado")
    
    # Buscar empresa para pegar o nome
    empresa = await db.companies.find_one({"id": orcamento['empresa_id']}, {"_id": 0})
    nome_empresa = empresa.get('razao_social') or empresa.get('name', 'Empresa') if empresa else 'Empresa'
    
    # Gerar token único para este PDF
    token = secrets.token_urlsafe(32)
    expiration = int(time.time()) + (24 * 3600)  # Expira em 24 horas
    
    # Salvar token no banco
    await db.orcamentos.update_one(
        {"id": orcamento_id},
        {"$set": {
            "pdf_share_token": token,
            "pdf_share_expiration": expiration
        }}
    )
    
    # Gerar URL amigável com número do orçamento
    base_url = os.environ.get('BACKEND_URL', 'https://budget-markup-flow.preview.emergentagent.com')
    numero_orcamento = orcamento.get('numero_orcamento', '')
    
    # URL amigável: /api/orcamento/view/LL-2025-0001
    html_url = f"{base_url}/api/orcamento/view/{numero_orcamento}"
    
    # Preparar dados para WhatsApp
    import re
    from urllib.parse import quote
    
    whatsapp_number = re.sub(r'\D', '', orcamento.get('cliente_whatsapp', ''))
    
    mensagem = f"""Olá! Segue o orçamento de {nome_empresa} nº {numero_orcamento}

{html_url}"""
    
    return {
        "pdf_url": html_url,
        "whatsapp_url": f"https://wa.me/55{whatsapp_number}?text={quote(mensagem)}",
        "token": token,
        "expires_in": "Permanente",
        "numero_orcamento": numero_orcamento
    }


# ========== ACEITE DE ORÇAMENTO ==========

@api_router.post("/orcamento/{orcamento_id}/aceitar")
async def aceitar_orcamento(orcamento_id: str, request: Request):
    """
    Cliente aceita o orçamento e gera automaticamente as parcelas no Contas a Receber.
    Também envia notificação para a empresa.
    """
    from datetime import timedelta
    import re
    from urllib.parse import quote
    
    # Buscar orçamento
    orcamento = await db.orcamentos.find_one({"id": orcamento_id}, {"_id": 0})
    
    if not orcamento:
        raise HTTPException(status_code=404, detail="Orçamento não encontrado")
    
    if orcamento.get('status') == 'APROVADO':
        return {"message": "Orçamento já foi aceito anteriormente", "already_accepted": True}
    
    # Buscar empresa
    empresa = await db.companies.find_one({"id": orcamento['empresa_id']}, {"_id": 0})
    if not empresa:
        raise HTTPException(status_code=404, detail="Empresa não encontrada")
    
    # IP do cliente
    client_ip = request.client.host if request.client else "unknown"
    
    # Data atual
    agora = datetime.now(timezone.utc)
    
    # Gerar parcelas no Contas a Receber
    contas_geradas = []
    
    forma_pagamento = orcamento.get('forma_pagamento', 'avista')
    valor_total = orcamento.get('preco_praticado', 0)
    valor_entrada = orcamento.get('valor_entrada', 0)
    parcelas = orcamento.get('parcelas', [])
    
    # Data base para vencimentos (5 dias após o aceite)
    data_entrada = agora + timedelta(days=5)
    
    if forma_pagamento == 'avista':
        # Pagamento único
        conta = {
            "id": str(uuid.uuid4()),
            "company_id": orcamento['empresa_id'],
            "user_id": orcamento['usuario_id'],
            "tipo": "RECEBER",
            "descricao": f"Orçamento {orcamento['numero_orcamento']} - {orcamento['cliente_nome']} (À Vista)",
            "categoria": "Serviços",
            "data_emissao": agora.strftime("%Y-%m-%d"),
            "data_vencimento": data_entrada.strftime("%Y-%m-%d"),
            "valor": valor_total,
            "forma_pagamento": "Transferência",
            "observacoes": f"Gerado automaticamente pelo aceite do orçamento {orcamento['numero_orcamento']}",
            "status": "PENDENTE",
            "orcamento_id": orcamento_id,
            "created_at": agora.isoformat(),
            "updated_at": agora.isoformat()
        }
        await db.contas.insert_one(conta)
        contas_geradas.append(conta['id'])
    else:
        # Entrada + Parcelas
        if valor_entrada > 0:
            conta_entrada = {
                "id": str(uuid.uuid4()),
                "company_id": orcamento['empresa_id'],
                "user_id": orcamento['usuario_id'],
                "tipo": "RECEBER",
                "descricao": f"Orçamento {orcamento['numero_orcamento']} - {orcamento['cliente_nome']} (Entrada)",
                "categoria": "Serviços",
                "data_emissao": agora.strftime("%Y-%m-%d"),
                "data_vencimento": data_entrada.strftime("%Y-%m-%d"),
                "valor": valor_entrada,
                "forma_pagamento": "Transferência",
                "observacoes": f"Entrada - Orçamento {orcamento['numero_orcamento']}",
                "status": "PENDENTE",
                "orcamento_id": orcamento_id,
                "created_at": agora.isoformat(),
                "updated_at": agora.isoformat()
            }
            await db.contas.insert_one(conta_entrada)
            contas_geradas.append(conta_entrada['id'])
        
        # Criar cada parcela
        for i, parcela in enumerate(parcelas):
            # Vencimento: 30 dias * (número da parcela) após a entrada
            data_vencimento = data_entrada + timedelta(days=30 * (i + 1))
            
            conta_parcela = {
                "id": str(uuid.uuid4()),
                "company_id": orcamento['empresa_id'],
                "user_id": orcamento['usuario_id'],
                "tipo": "RECEBER",
                "descricao": f"Orçamento {orcamento['numero_orcamento']} - {orcamento['cliente_nome']} (Parcela {i+1}/{len(parcelas)})",
                "categoria": "Serviços",
                "data_emissao": agora.strftime("%Y-%m-%d"),
                "data_vencimento": data_vencimento.strftime("%Y-%m-%d"),
                "valor": parcela.get('valor', 0),
                "forma_pagamento": "Transferência",
                "observacoes": f"Parcela {i+1} - Orçamento {orcamento['numero_orcamento']}",
                "status": "PENDENTE",
                "orcamento_id": orcamento_id,
                "created_at": agora.isoformat(),
                "updated_at": agora.isoformat()
            }
            await db.contas.insert_one(conta_parcela)
            contas_geradas.append(conta_parcela['id'])
    
    # Atualizar status do orçamento
    await db.orcamentos.update_one(
        {"id": orcamento_id},
        {"$set": {
            "status": "APROVADO",
            "aprovado_em": agora.isoformat(),
            "aceito_em": agora.isoformat(),
            "aceito_por_ip": client_ip,
            "contas_receber_geradas": contas_geradas,
            "updated_at": agora.isoformat()
        }}
    )
    
    # Preparar mensagem WhatsApp para a empresa
    whatsapp_empresa = empresa.get('celular_whatsapp') or empresa.get('telefone', '')
    whatsapp_numero = re.sub(r'\D', '', whatsapp_empresa)
    
    # Formatar detalhes das parcelas
    detalhes_parcelas = ""
    if forma_pagamento == 'avista':
        detalhes_parcelas = f"💰 Pagamento à vista: R$ {valor_total:,.2f}"
    else:
        detalhes_parcelas = f"💰 Entrada: R$ {valor_entrada:,.2f}\n"
        for i, parcela in enumerate(parcelas):
            detalhes_parcelas += f"📅 Parcela {i+1}: R$ {parcela.get('valor', 0):,.2f}\n"
    
    mensagem_whatsapp = f"""🎉 *ORÇAMENTO ACEITO!*

📋 *{orcamento['numero_orcamento']}*
👤 Cliente: {orcamento['cliente_nome']}
💵 Valor Total: R$ {valor_total:,.2f}

{detalhes_parcelas}
✅ {len(contas_geradas)} parcela(s) gerada(s) no Contas a Receber

Acesse o sistema para mais detalhes."""
    
    whatsapp_url = f"https://wa.me/55{whatsapp_numero}?text={quote(mensagem_whatsapp)}" if whatsapp_numero else None
    
    # Criar notificação no sistema com mais detalhes
    notificacao = {
        "id": str(uuid.uuid4()),
        "company_id": orcamento['empresa_id'],
        "user_id": orcamento['usuario_id'],
        "tipo": "ORCAMENTO_ACEITO",
        "titulo": f"🎉 Orçamento {orcamento['numero_orcamento']} Aceito!",
        "mensagem": f"""O cliente {orcamento['cliente_nome']} aceitou o orçamento!

💵 Valor Total: R$ {valor_total:,.2f}
{detalhes_parcelas}
✅ {len(contas_geradas)} parcela(s) criada(s) no Contas a Receber""",
        "lida": False,
        "orcamento_id": orcamento_id,
        "whatsapp_url": whatsapp_url,
        "created_at": agora.isoformat()
    }
    await db.notificacoes.insert_one(notificacao)

Acesse o sistema para mais detalhes."""
    
    whatsapp_url = f"https://wa.me/55{whatsapp_numero}?text={quote(mensagem_whatsapp)}" if whatsapp_numero else None
    
    return {
        "message": "Orçamento aceito com sucesso!",
        "orcamento_id": orcamento_id,
        "numero_orcamento": orcamento['numero_orcamento'],
        "contas_geradas": len(contas_geradas),
        "contas_ids": contas_geradas,
        "notificacao_whatsapp_url": whatsapp_url
    }


# ========== NOTIFICAÇÕES ==========

@api_router.get("/notificacoes/{company_id}")
async def listar_notificacoes(company_id: str):
    """Listar notificações da empresa (não lidas primeiro)"""
    notificacoes = await db.notificacoes.find(
        {"company_id": company_id},
        {"_id": 0}
    ).sort([("lida", 1), ("created_at", -1)]).to_list(50)
    
    return notificacoes


@api_router.patch("/notificacao/{notificacao_id}/lida")
async def marcar_notificacao_lida(notificacao_id: str):
    """Marcar notificação como lida"""
    result = await db.notificacoes.update_one(
        {"id": notificacao_id},
        {"$set": {"lida": True, "lida_em": datetime.now(timezone.utc).isoformat()}}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Notificação não encontrada")
    
    return {"message": "Notificação marcada como lida"}


@api_router.delete("/notificacao/{notificacao_id}")
async def excluir_notificacao(notificacao_id: str):
    """Excluir notificação"""
    result = await db.notificacoes.delete_one({"id": notificacao_id})
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Notificação não encontrada")
    
    return {"message": "Notificação excluída"}


@api_router.get("/orcamento/share/{token}")
async def share_orcamento_pdf(token: str):
    """Endpoint público para compartilhar PDF via token temporário"""
    import time
    
    # Buscar orçamento pelo token
    orcamento = await db.orcamentos.find_one({
        "pdf_share_token": token
    }, {"_id": 0})
    
    if not orcamento:
        raise HTTPException(status_code=404, detail="Link inválido ou expirado")
    
    # Verificar se o token ainda é válido
    expiration = orcamento.get('pdf_share_expiration', 0)
    if int(time.time()) > expiration:
        raise HTTPException(status_code=410, detail="Link expirado. Solicite um novo ao vendedor.")
    
    # Buscar empresa
    empresa = await db.companies.find_one({"id": orcamento['empresa_id']}, {"_id": 0})
    if not empresa:
        empresa = {"name": "Empresa"}
    
    # Buscar materiais do orçamento
    materiais = await db.orcamento_materiais.find(
        {"id_orcamento": orcamento['id']},
        {"_id": 0}
    ).to_list(1000)
    
    # Gerar PDF
    try:
        from weasyprint import HTML
        from jinja2 import Environment, FileSystemLoader
        import os
        from datetime import datetime as dt
        
        # Preparar dados para o template
        data_emissao = orcamento.get('created_at', '')
        if isinstance(data_emissao, str) and len(data_emissao) >= 10:
            try:
                data_emissao = dt.fromisoformat(data_emissao.replace('Z', '+00:00'))
                data_emissao = data_emissao.strftime("%d/%m/%Y")
            except:
                data_emissao = data_emissao[:10]
        
        data_geracao = dt.now().strftime("%d/%m/%Y %H:%M")
        
        status = orcamento.get('status', 'RASCUNHO')
        status_label_map = {
            'RASCUNHO': 'Rascunho',
            'ENVIADO': 'Enviado',
            'APROVADO': 'Aprovado',
            'NAO_APROVADO': 'Não Aprovado'
        }
        status_label = status_label_map.get(status, status)
        
        context = {
            'numero_orcamento': orcamento.get('numero_orcamento', 'N/A'),
            'data_emissao': data_emissao,
            'data_geracao': data_geracao,
            'status': status_label,
            'empresa': empresa,
            'cliente_nome': orcamento.get('cliente_nome', ''),
            'cliente_documento': orcamento.get('cliente_documento'),
            'cliente_whatsapp': orcamento.get('cliente_whatsapp'),
            'cliente_telefone': orcamento.get('cliente_telefone'),
            'cliente_email': orcamento.get('cliente_email'),
            'cliente_endereco': orcamento.get('cliente_endereco'),
            'tipo': orcamento.get('tipo', ''),
            'descricao_servico_ou_produto': orcamento.get('descricao_servico_ou_produto', ''),
            'area_m2': orcamento.get('area_m2'),
            'quantidade': orcamento.get('quantidade'),
            'custo_total': orcamento.get('custo_total', 0),
            'preco_minimo': orcamento.get('preco_minimo', 0),
            'preco_sugerido': orcamento.get('preco_sugerido', 0),
            'preco_praticado': orcamento.get('preco_praticado', 0),
            'validade_proposta': orcamento.get('validade_proposta', ''),
            'condicoes_pagamento': orcamento.get('condicoes_pagamento', ''),
            'prazo_execucao': orcamento.get('prazo_execucao', ''),
            'observacoes': orcamento.get('observacoes'),
        }
        
        template_dir = os.path.join(os.path.dirname(__file__), 'templates')
        env = Environment(loader=FileSystemLoader(template_dir))
        template = env.get_template('orcamento.html')
        html_content = template.render(**context)
        pdf_file = HTML(string=html_content).write_pdf()
        
        return StreamingResponse(
            BytesIO(pdf_file),
            media_type="application/pdf",
            headers={
                "Content-Disposition": f"inline; filename=orcamento_{orcamento.get('numero_orcamento', token)}.pdf",
                "Cache-Control": "no-cache"
            }
        )
        
    except (OSError, ImportError) as e:
        # Fallback: usar ReportLab
        logger.warning(f"WeasyPrint não disponível, usando ReportLab: {str(e)}")
        
        # Buscar configuração de orçamento
        config = await db.orcamento_config.find_one({"company_id": empresa.get('id')}, {"_id": 0})
        
        pdf_bytes = generate_pdf_with_reportlab(orcamento, empresa, materiais, config)
        
        return StreamingResponse(
            BytesIO(pdf_bytes),
            media_type="application/pdf",
            headers={
                "Content-Disposition": f"inline; filename=orcamento_{orcamento.get('numero_orcamento', token)}.pdf",
                "Cache-Control": "no-cache"
            }
        )

# ========== ENDPOINTS: MATERIAIS ==========

@api_router.post("/materiais")
async def create_material(material_data: MaterialCreate):
    """Criar novo material no catálogo"""
    material = Material(**material_data.model_dump())
    
    doc = material.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    doc['updated_at'] = doc['updated_at'].isoformat()
    await db.materiais.insert_one(doc)
    
    return {"message": "Material criado com sucesso!", "material_id": material.id}

@api_router.get("/materiais")
async def get_materiais():
    """Listar todos os materiais cadastrados"""
    materiais = await db.materiais.find({}, {"_id": 0}).sort("nome_item", 1).to_list(1000)
    return materiais

@api_router.get("/materiais/buscar")
async def buscar_materiais(q: str):
    """Buscar materiais por nome (autocomplete)"""
    materiais = await db.materiais.find(
        {"nome_item": {"$regex": q, "$options": "i"}},
        {"_id": 0}
    ).limit(20).to_list(None)
    return materiais

@api_router.get("/materiais/{material_id}")
async def get_material_detail(material_id: str):
    """Buscar detalhes de um material específico"""
    material = await db.materiais.find_one({"id": material_id}, {"_id": 0})
    
    if not material:
        raise HTTPException(status_code=404, detail="Material não encontrado")
    
    return material

@api_router.put("/materiais/{material_id}")
async def update_material(material_id: str, material_data: MaterialCreate):
    """Atualizar material"""
    update_doc = material_data.model_dump()
    update_doc['updated_at'] = datetime.now(timezone.utc).isoformat()
    
    result = await db.materiais.update_one(
        {"id": material_id},
        {"$set": update_doc}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Material não encontrado")
    
    return {"message": "Material atualizado com sucesso!"}

@api_router.delete("/materiais/{material_id}")
async def delete_material(material_id: str):
    """Deletar material do catálogo"""
    result = await db.materiais.delete_one({"id": material_id})
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Material não encontrado")
    
    return {"message": "Material excluído com sucesso!"}

# ========== ENDPOINTS: MATERIAIS NO ORÇAMENTO ==========

@api_router.post("/orcamentos/{orcamento_id}/materiais")
async def add_material_to_orcamento(orcamento_id: str, material_data: OrcamentoMaterialCreate):
    """Adicionar material ao orçamento"""
    # Verificar se o orçamento existe
    orcamento = await db.orcamentos.find_one({"id": orcamento_id}, {"_id": 0})
    
    if not orcamento:
        raise HTTPException(status_code=404, detail="Orçamento não encontrado")
    
    # Calcular valores
    preco_unitario_final = material_data.preco_compra_fornecedor * (1 + (material_data.percentual_acrescimo / 100))
    preco_total_item = preco_unitario_final * material_data.quantidade
    
    # Criar OrcamentoMaterial
    orcamento_material = OrcamentoMaterial(
        id_orcamento=orcamento_id,
        id_material=material_data.id_material,
        nome_item=material_data.nome_item,
        descricao_customizada=material_data.descricao_customizada,
        unidade=material_data.unidade,
        preco_compra_fornecedor=material_data.preco_compra_fornecedor,
        percentual_acrescimo=material_data.percentual_acrescimo,
        preco_unitario_final=preco_unitario_final,
        quantidade=material_data.quantidade,
        preco_total_item=preco_total_item
    )
    
    doc = orcamento_material.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.orcamento_materiais.insert_one(doc)
    
    # Se id_material não existe (material novo), criar material no catálogo
    if not material_data.id_material:
        novo_material = Material(
            nome_item=material_data.nome_item,
            descricao=material_data.descricao_customizada,
            unidade=material_data.unidade,
            preco_compra_base=material_data.preco_compra_fornecedor
        )
        material_doc = novo_material.model_dump()
        material_doc['created_at'] = material_doc['created_at'].isoformat()
        material_doc['updated_at'] = material_doc['updated_at'].isoformat()
        await db.materiais.insert_one(material_doc)
    
    return {
        "message": "Material adicionado ao orçamento com sucesso!",
        "orcamento_material_id": orcamento_material.id,
        "preco_unitario_final": preco_unitario_final,
        "preco_total_item": preco_total_item
    }

@api_router.get("/orcamentos/{orcamento_id}/materiais")
async def get_orcamento_materiais(orcamento_id: str):
    """Listar materiais de um orçamento"""
    materiais = await db.orcamento_materiais.find(
        {"id_orcamento": orcamento_id},
        {"_id": 0}
    ).to_list(1000)
    
    # Calcular total de materiais
    total_materiais = sum(m['preco_total_item'] for m in materiais)
    
    return {
        "materiais": materiais,
        "total_materiais": total_materiais
    }

@api_router.delete("/orcamentos/{orcamento_id}/materiais/{orcamento_material_id}")
async def remove_material_from_orcamento(orcamento_id: str, orcamento_material_id: str):
    """Remover material do orçamento"""
    result = await db.orcamento_materiais.delete_one({
        "id": orcamento_material_id,
        "id_orcamento": orcamento_id
    })
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Material não encontrado no orçamento")
    
    return {"message": "Material removido do orçamento com sucesso!"}

# ========== ENDPOINTS: CONFIGURAÇÃO DO SISTEMA ==========

@api_router.get("/system-config")
async def get_system_config():
    """Buscar configuração do sistema (preço da assinatura)"""
    config = await db.system_config.find_one({"id": "system_config"}, {"_id": 0})
    
    if not config:
        # Retornar configuração padrão
        return {"id": "system_config", "subscription_price": 49.90}
    
    return config

class PriceUpdate(BaseModel):
    price: float

@api_router.put("/system-config/price")
async def update_subscription_price(price_data: PriceUpdate):
    """Atualizar preço da assinatura"""
    new_price = price_data.price
    
    if new_price <= 0:
        raise HTTPException(status_code=400, detail="Preço deve ser maior que zero")
    
    # Verificar se já existe
    existing = await db.system_config.find_one({"id": "system_config"})
    
    if existing:
        # Atualizar
        await db.system_config.update_one(
            {"id": "system_config"},
            {"$set": {
                "subscription_price": new_price,
                "updated_at": datetime.now(timezone.utc).isoformat()
            }}
        )
    else:
        # Criar novo
        config = SystemConfig(subscription_price=new_price)
        doc = config.model_dump()
        doc['updated_at'] = doc['updated_at'].isoformat()
        await db.system_config.insert_one(doc)
    
    return {"message": "Preço atualizado com sucesso!", "new_price": new_price}

# ========== ENDPOINTS: CONFIGURAÇÃO DE ORÇAMENTO ==========

@api_router.post("/upload-logo")
async def upload_logo(file: UploadFile = File(...)):
    """Upload de logo para orçamento"""
    try:
        # Validar tipo de arquivo
        if not file.content_type.startswith('image/'):
            raise HTTPException(status_code=400, detail="Apenas imagens são permitidas")
        
        # Gerar nome único para o arquivo
        file_extension = file.filename.split('.')[-1]
        unique_filename = f"logo_{uuid.uuid4()}.{file_extension}"
        file_path = Path(ROOT_DIR) / "uploads" / unique_filename
        
        # Criar diretório se não existir
        file_path.parent.mkdir(parents=True, exist_ok=True)
        
        # Salvar arquivo
        async with aiofiles.open(file_path, 'wb') as f:
            content = await file.read()
            await f.write(content)
        
        # Retornar URL do arquivo
        logo_url = f"/uploads/{unique_filename}"
        
        return {"logo_url": logo_url, "message": "Logo enviada com sucesso!"}
    
    except Exception as e:
        logger.error(f"Erro no upload: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erro ao fazer upload: {str(e)}")

@api_router.get("/orcamento-config/{company_id}")
async def get_orcamento_config(company_id: str):
    """Buscar configuração de orçamento da empresa"""
    config = await db.orcamento_config.find_one({"company_id": company_id}, {"_id": 0})
    
    if not config:
        # Retornar configuração padrão se não existir
        return {
            "company_id": company_id,
            "logo_url": None,
            "cor_primaria": "#7C3AED",
            "cor_secundaria": "#3B82F6",
            "texto_ciencia": "Declaro, para os devidos fins, que aceito esta proposta comercial de prestação de serviços nas condições acima citadas.",
            "texto_garantia": "Os serviços executados possuem garantia conforme especificações técnicas e normas vigentes."
        }
    
    # Converter logo para base64 para preview
    if config.get('logo_url'):
        try:
            logo_path = Path(ROOT_DIR) / config['logo_url'].lstrip('/')
            if logo_path.exists():
                with open(logo_path, 'rb') as f:
                    logo_data = f.read()
                    logo_base64 = base64.b64encode(logo_data).decode('utf-8')
                    # Detectar tipo de imagem
                    ext = logo_path.suffix.lower()
                    mime_types = {'.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.gif': 'image/gif', '.svg': 'image/svg+xml'}
                    mime_type = mime_types.get(ext, 'image/jpeg')
                    config['logo_preview'] = f"data:{mime_type};base64,{logo_base64}"
        except Exception as e:
            logger.warning(f"Erro ao gerar preview da logo: {e}")
    
    return config

@api_router.post("/orcamento-config")
async def create_or_update_orcamento_config(config_data: OrcamentoConfigCreate, company_id: str):
    """Criar ou atualizar configuração de orçamento"""
    # Verificar se já existe
    existing = await db.orcamento_config.find_one({"company_id": company_id})
    
    if existing:
        # Atualizar
        update_doc = config_data.model_dump()
        update_doc['updated_at'] = datetime.now(timezone.utc).isoformat()
        
        await db.orcamento_config.update_one(
            {"company_id": company_id},
            {"$set": update_doc}
        )
        
        return {"message": "Configuração atualizada com sucesso!"}
    else:
        # Criar novo
        config = OrcamentoConfig(
            company_id=company_id,
            **config_data.model_dump()
        )
        
        doc = config.model_dump()
        doc['created_at'] = doc['created_at'].isoformat()
        doc['updated_at'] = doc['updated_at'].isoformat()
        
        await db.orcamento_config.insert_one(doc)
        
        return {"message": "Configuração criada com sucesso!"}

# ========== ROTAS: PLANO DE CONTAS (CATEGORIAS PARA MARKUP) ==========

@api_router.get("/expense-categories/{company_id}")
async def get_expense_categories(company_id: str, active_only: bool = True):
    """Listar categorias de despesa configuradas para o markup"""
    try:
        query = {"company_id": company_id}
        if active_only:
            query["active"] = True
        
        categories = await db.expense_categories.find(query, {"_id": 0}).sort("name", 1).to_list(100)
        return {"categories": categories}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/expense-categories")
async def create_expense_category(data: ExpenseCategoryCreate):
    """Criar nova categoria de despesa para o Plano de Contas"""
    try:
        # Validar group
        if data.group not in EXPENSE_GROUPS:
            raise HTTPException(
                status_code=400,
                detail=f"Grupo inválido. Use: {', '.join(EXPENSE_GROUPS)}"
            )
        
        # Verificar duplicidade
        existing = await db.expense_categories.find_one({
            "company_id": data.company_id,
            "name": data.name.strip()
        })
        
        if existing:
            raise HTTPException(status_code=400, detail="Categoria já existe")
        
        category = ExpenseCategoryConfig(
            company_id=data.company_id,
            name=data.name.strip(),
            type=data.type,
            group=data.group,
            is_indirect_for_markup=data.is_indirect_for_markup,
            description=data.description
        )
        
        doc = category.model_dump()
        doc['created_at'] = doc['created_at'].isoformat()
        doc['updated_at'] = doc['updated_at'].isoformat()
        
        await db.expense_categories.insert_one(doc)
        doc.pop('_id', None)
        
        return {"message": "Categoria criada com sucesso!", "category": doc}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@api_router.put("/expense-categories/{category_id}")
async def update_expense_category(category_id: str, data: ExpenseCategoryCreate):
    """Atualizar categoria de despesa"""
    try:
        if data.group not in EXPENSE_GROUPS:
            raise HTTPException(
                status_code=400,
                detail=f"Grupo inválido. Use: {', '.join(EXPENSE_GROUPS)}"
            )
        
        result = await db.expense_categories.update_one(
            {"id": category_id},
            {"$set": {
                "name": data.name.strip(),
                "type": data.type,
                "group": data.group,
                "is_indirect_for_markup": data.is_indirect_for_markup,
                "description": data.description,
                "updated_at": datetime.now(timezone.utc).isoformat()
            }}
        )
        
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Categoria não encontrada")
        
        return {"message": "Categoria atualizada com sucesso!"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@api_router.patch("/expense-categories/{category_id}/toggle")
async def toggle_expense_category(category_id: str, active: bool):
    """Ativar/Desativar categoria"""
    try:
        result = await db.expense_categories.update_one(
            {"id": category_id},
            {"$set": {
                "active": active,
                "updated_at": datetime.now(timezone.utc).isoformat()
            }}
        )
        
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Categoria não encontrada")
        
        status = "ativada" if active else "desativada"
        return {"message": f"Categoria {status} com sucesso!"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/expense-categories/{company_id}/seed-defaults")
async def seed_default_expense_categories(company_id: str):
    """Criar categorias padrão para uma empresa"""
    try:
        # Verificar se já existem categorias
        existing_count = await db.expense_categories.count_documents({"company_id": company_id})
        if existing_count > 0:
            return {"message": "Categorias já existem para esta empresa", "created": 0}
        
        # Categorias padrão
        default_categories = [
            # ===== RECEITAS =====
            {"name": "Serviços Prestados", "type": "RECEITA", "group": None, "is_indirect_for_markup": False, "description": "Receita de serviços executados"},
            {"name": "Venda de Produtos", "type": "RECEITA", "group": None, "is_indirect_for_markup": False, "description": "Receita de venda de produtos"},
            {"name": "Receitas Financeiras", "type": "RECEITA", "group": None, "is_indirect_for_markup": False, "description": "Juros e rendimentos"},
            {"name": "Outras Receitas", "type": "RECEITA", "group": None, "is_indirect_for_markup": False, "description": "Outras receitas operacionais"},
            
            # ===== CUSTOS =====
            {"name": "Custos de Produção", "type": "CUSTO", "group": None, "is_indirect_for_markup": False, "description": "Custos diretos da produção"},
            {"name": "Matéria-Prima", "type": "CUSTO", "group": None, "is_indirect_for_markup": False, "description": "Insumos e matérias-primas"},
            {"name": "Mão de Obra Direta", "type": "CUSTO", "group": None, "is_indirect_for_markup": False, "description": "Salários de produção"},
            {"name": "Outros Custos", "type": "CUSTO", "group": None, "is_indirect_for_markup": False, "description": "Outros custos operacionais"},
            
            # ===== DESPESAS FIXAS - Entram no X_real =====
            {"name": "Aluguel", "type": "DESPESA", "group": "FIXA", "is_indirect_for_markup": True, "description": "Aluguel do escritório/sede"},
            {"name": "Energia Elétrica", "type": "DESPESA", "group": "FIXA", "is_indirect_for_markup": True, "description": "Conta de luz"},
            {"name": "Água", "type": "DESPESA", "group": "FIXA", "is_indirect_for_markup": True, "description": "Conta de água"},
            {"name": "Telefone/Internet", "type": "DESPESA", "group": "FIXA", "is_indirect_for_markup": True, "description": "Telecomunicações"},
            {"name": "Contador", "type": "DESPESA", "group": "FIXA", "is_indirect_for_markup": True, "description": "Honorários contábeis"},
            {"name": "Salários Administrativos", "type": "DESPESA", "group": "FIXA", "is_indirect_for_markup": True, "description": "Salários do pessoal administrativo"},
            {"name": "Software/Sistemas", "type": "DESPESA", "group": "FIXA", "is_indirect_for_markup": True, "description": "Licenças de software"},
            {"name": "Marketing", "type": "DESPESA", "group": "FIXA", "is_indirect_for_markup": True, "description": "Publicidade e marketing"},
            
            # ===== DESPESAS VARIÁVEIS INDIRETAS - Entram no X_real =====
            {"name": "Combustível Administrativo", "type": "DESPESA", "group": "VARIAVEL_INDIRETA", "is_indirect_for_markup": True, "description": "Combustível de veículos administrativos"},
            {"name": "Material de Escritório", "type": "DESPESA", "group": "VARIAVEL_INDIRETA", "is_indirect_for_markup": True, "description": "Papelaria e suprimentos"},
            {"name": "Manutenção Equipamentos", "type": "DESPESA", "group": "VARIAVEL_INDIRETA", "is_indirect_for_markup": True, "description": "Manutenção de equipamentos de escritório"},
            
            # ===== DESPESAS DIRETAS DA OBRA - NÃO entram no X_real =====
            {"name": "Salários Operacionais", "type": "DESPESA", "group": "DIRETA_OBRA", "is_indirect_for_markup": False, "description": "Salários de operários (entra no custo do serviço)"},
            {"name": "Materiais de Obra", "type": "DESPESA", "group": "DIRETA_OBRA", "is_indirect_for_markup": False, "description": "Materiais aplicados na obra"},
            {"name": "Combustível Obra", "type": "DESPESA", "group": "DIRETA_OBRA", "is_indirect_for_markup": False, "description": "Combustível para obras específicas"},
            {"name": "Aluguel Equipamentos", "type": "DESPESA", "group": "DIRETA_OBRA", "is_indirect_for_markup": False, "description": "Aluguel de máquinas para obras"},
            {"name": "Subempreiteiros", "type": "DESPESA", "group": "DIRETA_OBRA", "is_indirect_for_markup": False, "description": "Terceirizados em obras"},
        ]
        
        created_count = 0
        for cat_data in default_categories:
            category = ExpenseCategoryConfig(
                company_id=company_id,
                name=cat_data["name"],
                type=cat_data["type"],
                group=cat_data.get("group"),
                is_indirect_for_markup=cat_data["is_indirect_for_markup"],
                description=cat_data.get("description")
            )
            
            doc = category.model_dump()
            doc['created_at'] = doc['created_at'].isoformat()
            doc['updated_at'] = doc['updated_at'].isoformat()
            
            await db.expense_categories.insert_one(doc)
            created_count += 1
        
        return {"message": f"{created_count} categorias padrão criadas!", "created": created_count}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ========== ROTAS: CÁLCULO X_REAL (MODELO 2) ==========

@api_router.get("/markup-profile/calculate-x-real/{company_id}/{year}/{month}")
async def calculate_x_real(company_id: str, year: int, month: int):
    """
    Calcula X_real = (Despesas Indiretas) / (Receita Base) do mês anterior.
    Usa regime de competência (competence_month) e denormalização (is_indirect_for_markup).
    """
    try:
        from dateutil.relativedelta import relativedelta
        
        # Mês base = mês anterior ao solicitado
        ref_date = date(year, month, 1) - relativedelta(months=1)
        ref_year = ref_date.year
        ref_month = ref_date.month
        ref_month_str = f"{ref_year}-{str(ref_month).zfill(2)}"
        
        # Buscar despesas indiretas usando denormalização e competência
        despesas_query = {
            "company_id": company_id,
            "type": "despesa",
            "is_indirect_for_markup": True,  # Usa campo denormalizado
            "competence_month": ref_month_str  # Usa competência ao invés de date
        }
        
        despesas = await db.transactions.find(
            despesas_query, 
            {"_id": 0, "amount": 1, "category_name": 1, "category_group": 1}
        ).to_list(1000)
        
        despesas_indiretas = sum([d["amount"] for d in despesas])
        
        # Buscar receita base por competência
        receita_query = {
            "company_id": company_id,
            "type": "receita",
            "competence_month": ref_month_str
        }
        
        receitas = await db.transactions.find(receita_query, {"_id": 0, "amount": 1}).to_list(1000)
        receita_base = sum([r["amount"] for r in receitas])
        
        # Calcular X_real
        x_real = 0
        x_real_percent = 0
        warning = None
        
        if receita_base > 0 and despesas_indiretas > 0:
            x_real = despesas_indiretas / receita_base
            x_real_percent = round(x_real * 100, 2)
            
            # Alerta se X_real for muito alto (> 60%)
            if x_real_percent > 60:
                warning = f"X_real muito alto ({x_real_percent}%). Verifique se as categorias estão corretas ou se houve despesas extraordinárias."
        elif receita_base > 0 and despesas_indiretas == 0:
            warning = "Nenhuma despesa indireta encontrada no mês base. Verifique:\n1. Se há lançamentos de despesas em Nov/2025\n2. Se as categorias estão marcadas como 'Entra no Markup' no Plano de Contas\n3. Se o campo 'competence_month' está preenchido"
        elif receita_base == 0:
            warning = "Receita base = R$ 0,00. Não é possível calcular X_real. Verifique os lançamentos de receita do mês anterior."
        else:
            warning = "Sem dados suficientes para calcular X_real. Verifique os lançamentos do mês anterior."
        
        # Detalhar categorias usadas
        categorias_detalhadas = {}
        grupos_usados = set()
        for d in despesas:
            cat = d.get("category_name", "Sem categoria")
            grupo = d.get("category_group", "N/A")
            if cat not in categorias_detalhadas:
                categorias_detalhadas[cat] = 0
            categorias_detalhadas[cat] += d["amount"]
            if grupo:
                grupos_usados.add(grupo)
        
        return {
            "error": False,
            "x_real": round(x_real, 4),
            "x_real_percent": x_real_percent,
            "despesas_indiretas": round(despesas_indiretas, 2),
            "receita_base": round(receita_base, 2),
            "periodo_referencia": ref_month_str,
            "periodo_referencia_label": f"{ref_date.strftime('%b')}/{ref_year}",
            "categorias_usadas": list(categorias_detalhadas.keys()),
            "categorias_valores": categorias_detalhadas,
            "grupos_usados": list(grupos_usados),
            "warning": warning,
            "calculated_at": datetime.now(timezone.utc).isoformat()
        }
    except Exception as e:
        logger.error(f"Erro no cálculo de X_real: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/markup-profile/{profile_id}/close-month")
async def close_markup_month(profile_id: str):
    """Fechar o mês do markup (impede recálculo automático)"""
    try:
        result = await db.markup_profiles.update_one(
            {"id": profile_id},
            {"$set": {
                "is_closed": True,
                "closed_at": datetime.now(timezone.utc).isoformat(),
                "updated_at": datetime.now(timezone.utc).isoformat()
            }}
        )
        
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Perfil não encontrado")
        
        return {"message": "Mês fechado com sucesso!"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/markup-profile/{profile_id}/reopen-month")
async def reopen_markup_month(profile_id: str):
    """Reabrir o mês do markup (permite recálculo)"""
    try:
        result = await db.markup_profiles.update_one(
            {"id": profile_id},
            {"$set": {
                "is_closed": False,
                "closed_at": None,
                "updated_at": datetime.now(timezone.utc).isoformat()
            }}
        )
        
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Perfil não encontrado")
        
        return {"message": "Mês reaberto com sucesso!"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ========== ROTAS: MARKUP/BDI MENSAL ==========

def calculate_markup(indirects_rate: float, financial_rate: float, profit_rate: float, tax_rate: float) -> tuple:
    """
    Calcula o markup multiplicador e BDI percentual.
    
    Fórmula: markup = ((1+X)*(1+Y)*(1+Z)) / (1 - I)
    
    Onde:
    - X = indiretas
    - Y = financeiro
    - Z = lucro
    - I = impostos sobre venda
    
    Returns: (markup_multiplier, bdi_percentage)
    """
    numerator = (1 + indirects_rate) * (1 + financial_rate) * (1 + profit_rate)
    denominator = 1 - tax_rate
    
    if denominator <= 0:
        raise ValueError("Taxa de impostos não pode ser >= 100%")
    
    markup = numerator / denominator
    bdi = (markup - 1) * 100  # BDI em percentual
    
    return round(markup, 4), round(bdi, 2)

@api_router.get("/markup-profiles/{company_id}")
async def get_markup_profiles(company_id: str, year: Optional[int] = None):
    """Buscar perfis de markup de uma empresa"""
    try:
        query = {"company_id": company_id}
        if year:
            query["year"] = year
        
        profiles = await db.markup_profiles.find(query, {"_id": 0}).sort([("year", -1), ("month", -1)]).to_list(100)
        return profiles
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/markup-profile/{company_id}/{year}/{month}")
async def get_markup_profile(company_id: str, year: int, month: int):
    """Buscar perfil de markup específico (mês/ano)"""
    try:
        profile = await db.markup_profiles.find_one(
            {"company_id": company_id, "year": year, "month": month},
            {"_id": 0}
        )
        if not profile:
            return None
        return profile
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/markup-profile/series/{company_id}")
async def get_markup_series(company_id: str, months: int = 12):
    """Buscar série temporal de markup (últimos N meses) para gráfico"""
    try:
        from datetime import date
        from dateutil.relativedelta import relativedelta
        
        today = date.today()
        series = []
        
        for i in range(months - 1, -1, -1):
            target_date = today - relativedelta(months=i)
            year = target_date.year
            month = target_date.month
            
            profile = await db.markup_profiles.find_one(
                {"company_id": company_id, "year": year, "month": month},
                {"_id": 0}
            )
            
            month_name = target_date.strftime("%b/%y")
            
            if profile:
                series.append({
                    "month": month_name,
                    "year": year,
                    "month_num": month,
                    "markup": profile.get("markup_multiplier", 1.0),
                    "bdi": profile.get("bdi_percentage", 0.0),
                    "has_data": True
                })
            else:
                series.append({
                    "month": month_name,
                    "year": year,
                    "month_num": month,
                    "markup": None,
                    "bdi": None,
                    "has_data": False
                })
        
        return series
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/markup-profile")
async def create_or_update_markup_profile(data: MarkupProfileCreate):
    """Criar ou atualizar perfil de markup mensal"""
    try:
        # Calcular taxa total de impostos
        taxes = data.taxes
        total_tax_rate = taxes.simples_effective_rate + taxes.iss_rate
        
        # Calcular markup e BDI
        markup_multiplier, bdi_percentage = calculate_markup(
            data.indirects_rate,
            data.financial_rate,
            data.profit_rate,
            total_tax_rate
        )
        
        # Verificar se já existe perfil para este mês
        existing = await db.markup_profiles.find_one({
            "company_id": data.company_id,
            "year": data.year,
            "month": data.month
        })
        
        profile_data = {
            "company_id": data.company_id,
            "year": data.year,
            "month": data.month,
            "taxes": taxes.model_dump(),
            "indirects_rate": data.indirects_rate,
            "financial_rate": data.financial_rate,
            "profit_rate": data.profit_rate,
            "markup_multiplier": markup_multiplier,
            "bdi_percentage": bdi_percentage,
            "notes": data.notes,
            # Campos do Modelo 2
            "mode": data.mode,
            "x_real_applied": data.x_real_applied,
            "x_real_base_month": data.x_real_base_month,
            "x_real_indirects_total": data.x_real_indirects_total,
            "x_real_revenue_base": data.x_real_revenue_base,
            "x_real_calculated_at": data.x_real_calculated_at,
            "updated_at": datetime.now(timezone.utc).isoformat()
        }
        
        if existing:
            # Verificar se o mês está fechado
            if existing.get("is_closed"):
                raise HTTPException(
                    status_code=400, 
                    detail="Este mês está fechado. Reabra o mês para editar."
                )
            
            # Atualizar existente
            await db.markup_profiles.update_one(
                {"id": existing["id"]},
                {"$set": profile_data}
            )
            return {
                "message": "Perfil de markup atualizado com sucesso!",
                "markup_multiplier": markup_multiplier,
                "bdi_percentage": bdi_percentage,
                "mode": data.mode,
                "updated": True
            }
        else:
            # Criar novo
            profile = MarkupProfile(
                company_id=data.company_id,
                year=data.year,
                month=data.month,
                taxes=taxes.model_dump(),
                indirects_rate=data.indirects_rate,
                financial_rate=data.financial_rate,
                profit_rate=data.profit_rate,
                markup_multiplier=markup_multiplier,
                bdi_percentage=bdi_percentage,
                notes=data.notes,
                mode=data.mode,
                x_real_applied=data.x_real_applied,
                x_real_base_month=data.x_real_base_month,
                x_real_indirects_total=data.x_real_indirects_total,
                x_real_revenue_base=data.x_real_revenue_base,
                x_real_calculated_at=data.x_real_calculated_at
            )
            
            doc = profile.model_dump()
            doc['created_at'] = doc['created_at'].isoformat()
            doc['updated_at'] = doc['updated_at'].isoformat()
            
            await db.markup_profiles.insert_one(doc)
            
            return {
                "message": "Perfil de markup criado com sucesso!",
                "id": profile.id,
                "markup_multiplier": markup_multiplier,
                "bdi_percentage": bdi_percentage,
                "created": True
            }
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/markup-profile/copy-previous")
async def copy_previous_markup_profile(company_id: str, year: int, month: int):
    """Copiar configuração do mês anterior"""
    try:
        from dateutil.relativedelta import relativedelta
        from datetime import date
        
        # Calcular mês anterior
        target_date = date(year, month, 1) - relativedelta(months=1)
        prev_year = target_date.year
        prev_month = target_date.month
        
        # Buscar perfil do mês anterior
        previous = await db.markup_profiles.find_one({
            "company_id": company_id,
            "year": prev_year,
            "month": prev_month
        }, {"_id": 0})
        
        if not previous:
            raise HTTPException(
                status_code=404,
                detail=f"Não existe configuração para {prev_month:02d}/{prev_year}"
            )
        
        # Criar cópia para o mês atual
        data = MarkupProfileCreate(
            company_id=company_id,
            year=year,
            month=month,
            taxes=MarkupTaxes(**previous.get("taxes", {})),
            indirects_rate=previous.get("indirects_rate", 0.10),
            financial_rate=previous.get("financial_rate", 0.02),
            profit_rate=previous.get("profit_rate", 0.15),
            notes=f"Copiado de {prev_month:02d}/{prev_year}"
        )
        
        return await create_or_update_markup_profile(data)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/markup-profile/current/{company_id}")
async def get_current_markup(company_id: str):
    """Buscar markup do mês atual (para usar nos cálculos)"""
    try:
        from datetime import date
        today = date.today()
        
        profile = await db.markup_profiles.find_one({
            "company_id": company_id,
            "year": today.year,
            "month": today.month
        }, {"_id": 0})
        
        if not profile:
            # Retornar valores padrão se não houver configuração
            return {
                "has_config": False,
                "markup_multiplier": 1.0,
                "bdi_percentage": 0.0,
                "message": "Nenhuma configuração de markup para o mês atual"
            }
        
        return {
            "has_config": True,
            "markup_multiplier": profile.get("markup_multiplier", 1.0),
            "bdi_percentage": profile.get("bdi_percentage", 0.0),
            "indirects_rate": profile.get("indirects_rate", 0),
            "financial_rate": profile.get("financial_rate", 0),
            "profit_rate": profile.get("profit_rate", 0),
            "taxes": profile.get("taxes", {})
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ========== ROTAS: CATÁLOGO DE SERVIÇOS (SERVICE TEMPLATES) ==========

# Enum de modalidades de cobrança
BILLING_MODELS = [
    "AREA_M2", "LINEAR_M", "POINT", "UNIT", "VOLUME_M3", "WEIGHT_KG",
    "HOUR", "DAY", "VISIT", "MONTHLY", "MILESTONE", "GLOBAL",
    "UNIT_COMPOSITION", "COST_PLUS", "PERFORMANCE"
]

BILLING_MODEL_LABELS = {
    "AREA_M2": {"label": "Por Área (m²)", "unit": "m²", "fields": ["area"]},
    "LINEAR_M": {"label": "Por Metro Linear", "unit": "m", "fields": ["length"]},
    "POINT": {"label": "Por Ponto", "unit": "ponto", "fields": ["points"]},
    "UNIT": {"label": "Por Unidade", "unit": "un", "fields": ["quantity"]},
    "VOLUME_M3": {"label": "Por Volume (m³)", "unit": "m³", "fields": ["volume"]},
    "WEIGHT_KG": {"label": "Por Peso (kg)", "unit": "kg", "fields": ["weight"]},
    "HOUR": {"label": "Por Hora", "unit": "hora", "fields": ["hours"]},
    "DAY": {"label": "Por Diária", "unit": "dia", "fields": ["days"]},
    "VISIT": {"label": "Por Visita", "unit": "visita", "fields": ["visits"]},
    "MONTHLY": {"label": "Mensal", "unit": "mês", "fields": ["months"]},
    "MILESTONE": {"label": "Por Etapa", "unit": "etapa", "fields": ["milestones"]},
    "GLOBAL": {"label": "Valor Global", "unit": "global", "fields": []},
    "UNIT_COMPOSITION": {"label": "Composição Unitária", "unit": "comp", "fields": ["quantity"]},
    "COST_PLUS": {"label": "Custo + Margem", "unit": "custo", "fields": ["cost"]},
    "PERFORMANCE": {"label": "Por Performance", "unit": "perf", "fields": ["target", "achieved"]}
}

@api_router.get("/billing-models")
async def get_billing_models():
    """Retorna lista de modalidades de cobrança disponíveis"""
    return {
        "models": BILLING_MODELS,
        "details": BILLING_MODEL_LABELS
    }

@api_router.get("/service-templates/{company_id}")
async def get_service_templates(company_id: str, active_only: bool = True):
    """Listar templates de serviço de uma empresa"""
    try:
        query = {"company_id": company_id}
        if active_only:
            query["active"] = True
        
        templates = await db.service_templates.find(query, {"_id": 0}).to_list(500)
        return templates
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/service-template/{template_id}")
async def get_service_template(template_id: str):
    """Buscar template específico"""
    try:
        template = await db.service_templates.find_one({"id": template_id}, {"_id": 0})
        if not template:
            raise HTTPException(status_code=404, detail="Template não encontrado")
        return template
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/service-templates")
async def create_service_template(data: ServiceTemplateCreate):
    """Criar novo template de serviço"""
    try:
        # Validar billing_model
        if data.billing_model not in BILLING_MODELS:
            raise HTTPException(
                status_code=400, 
                detail=f"Modalidade inválida. Use: {', '.join(BILLING_MODELS)}"
            )
        
        # Se measurement_schema não foi fornecido, usar padrão da modalidade
        measurement_schema = data.measurement_schema
        if not measurement_schema:
            measurement_schema = BILLING_MODEL_LABELS.get(data.billing_model, {}).get("fields", [])
        
        template = ServiceTemplate(
            company_id=data.company_id,
            name=data.name,
            category=data.category,
            billing_model=data.billing_model,
            unit_label=data.unit_label or BILLING_MODEL_LABELS.get(data.billing_model, {}).get("unit", "un"),
            default_unit_price=data.default_unit_price,
            measurement_schema=measurement_schema,
            multipliers=data.multipliers,
            materials_included=data.materials_included,
            material_margin_pct=data.material_margin_pct,
            scope_checklist=data.scope_checklist,
            active=data.active
        )
        
        doc = template.model_dump()
        doc['created_at'] = doc['created_at'].isoformat()
        doc['updated_at'] = doc['updated_at'].isoformat()
        
        await db.service_templates.insert_one(doc)
        
        return {"message": "Template criado com sucesso!", "id": template.id}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@api_router.put("/service-template/{template_id}")
async def update_service_template(template_id: str, data: dict):
    """Atualizar template de serviço"""
    try:
        existing = await db.service_templates.find_one({"id": template_id})
        if not existing:
            raise HTTPException(status_code=404, detail="Template não encontrado")
        
        # Validar billing_model se fornecido
        if "billing_model" in data and data["billing_model"] not in BILLING_MODELS:
            raise HTTPException(
                status_code=400,
                detail=f"Modalidade inválida. Use: {', '.join(BILLING_MODELS)}"
            )
        
        data["updated_at"] = datetime.now(timezone.utc).isoformat()
        
        await db.service_templates.update_one(
            {"id": template_id},
            {"$set": data}
        )
        
        return {"message": "Template atualizado com sucesso!"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@api_router.delete("/service-template/{template_id}")
async def delete_service_template(template_id: str):
    """Desativar template (soft delete)"""
    try:
        result = await db.service_templates.update_one(
            {"id": template_id},
            {"$set": {"active": False, "updated_at": datetime.now(timezone.utc).isoformat()}}
        )
        
        if result.modified_count == 0:
            raise HTTPException(status_code=404, detail="Template não encontrado")
        
        return {"message": "Template desativado com sucesso!"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ========== ROTAS: CATÁLOGO DE MATERIAIS INTERNOS (EPI/CONSUMO) ==========

@api_router.get("/internal-materials/{company_id}")
async def get_internal_materials(company_id: str, search: Optional[str] = None, category: Optional[str] = None):
    """Listar materiais internos (EPI/consumo) de uma empresa"""
    try:
        query = {"company_id": company_id, "active": True}
        
        if search:
            query["name"] = {"$regex": search, "$options": "i"}
        
        if category:
            query["category"] = category
        
        materials = await db.internal_materials.find(query, {"_id": 0}).to_list(500)
        return materials
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/internal-materials")
async def create_internal_material(data: InternalMaterialCreate):
    """Criar novo material interno"""
    try:
        # Validar categoria
        valid_categories = ["EPI", "CONSUMIVEL", "OUTROS"]
        if data.category not in valid_categories:
            raise HTTPException(
                status_code=400,
                detail=f"Categoria inválida. Use: {', '.join(valid_categories)}"
            )
        
        material = InternalMaterial(
            company_id=data.company_id,
            name=data.name,
            category=data.category,
            unit=data.unit,
            default_cost=data.default_cost
        )
        
        doc = material.model_dump()
        doc['created_at'] = doc['created_at'].isoformat()
        doc['updated_at'] = doc['updated_at'].isoformat()
        
        await db.internal_materials.insert_one(doc)
        
        return {"message": "Material criado com sucesso!", "id": material.id}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@api_router.put("/internal-material/{material_id}")
async def update_internal_material(material_id: str, data: dict):
    """Atualizar material interno"""
    try:
        existing = await db.internal_materials.find_one({"id": material_id})
        if not existing:
            raise HTTPException(status_code=404, detail="Material não encontrado")
        
        data["updated_at"] = datetime.now(timezone.utc).isoformat()
        
        await db.internal_materials.update_one(
            {"id": material_id},
            {"$set": data}
        )
        
        return {"message": "Material atualizado com sucesso!"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@api_router.delete("/internal-material/{material_id}")
async def delete_internal_material(material_id: str):
    """Desativar material interno (soft delete)"""
    try:
        result = await db.internal_materials.update_one(
            {"id": material_id},
            {"$set": {"active": False, "updated_at": datetime.now(timezone.utc).isoformat()}}
        )
        
        if result.modified_count == 0:
            raise HTTPException(status_code=404, detail="Material não encontrado")
        
        return {"message": "Material desativado com sucesso!"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/ai-analysis")
async def ai_analysis(data: dict):
    try:
        company_id = data['company_id']
        month = data['month']
        
        # Usar aggregation para calcular métricas
        pipeline = [
            {"$match": {
                "company_id": company_id,
                "date": {"$regex": f"^{month}"},
                "status": "realizado"
            }},
            {"$group": {
                "_id": "$type",
                "total": {"$sum": "$amount"}
            }}
        ]
        
        results = await db.transactions.aggregate(pipeline).to_list(None)
        
        faturamento = 0
        custos = 0
        despesas = 0
        
        for result in results:
            if result['_id'] == 'receita':
                faturamento = result['total']
            elif result['_id'] == 'custo':
                custos = result['total']
            elif result['_id'] == 'despesa':
                despesas = result['total']
        
        lucro = faturamento - custos - despesas
        
        # Prompt para ChatGPT
        prompt = f"""
        Analise os seguintes dados financeiros de uma empresa no mês {month}:
        
        - Faturamento Total: R$ {faturamento:,.2f}
        - Custos Totais: R$ {custos:,.2f}
        - Despesas Totais: R$ {despesas:,.2f}
        - Lucro Líquido: R$ {lucro:,.2f}
        
        Por favor, forneça:
        1. Pontos de atenção nos números apresentados
        2. Oportunidades de economia
        3. Sugestões para melhorar a gestão financeira
        4. Insights sobre o negócio
        
        Seja objetivo e prático nas recomendações.
        """
        
        # Usar Emergent LLM Chat
        chat = LlmChat(
            api_key=os.environ.get('OPENAI_API_KEY'),
            session_id=f"analysis-{company_id}-{month}",
            system_message="Você é um especialista em análise financeira empresarial."
        ).with_model("openai", "gpt-4o-mini")
        
        user_message = UserMessage(text=prompt)
        analysis = await chat.send_message(user_message)
        
        return {"analysis": analysis}
    
    except Exception as e:
        logger.error(f"Erro na análise IA: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erro ao analisar: {str(e)}")

# ========== EXPLICAÇÃO DE TERMOS FINANCEIROS ==========

@api_router.post("/financial-term-explanation")
async def explain_financial_term(data: dict):
    """Explicar termo financeiro usando IA"""
    try:
        term = data['term']
        business_sector = data.get('business_sector', None)
        
        if not business_sector:
            # Explicação geral do termo
            prompt = f"""
            Explique de forma clara, objetiva e didática o conceito financeiro: "{term}"
            
            Sua explicação deve:
            - Ser acessível para empresários sem formação financeira
            - Incluir exemplos práticos
            - Ter no máximo 4 parágrafos
            - Usar linguagem simples e direta
            
            Não use jargões técnicos desnecessários.
            """
        else:
            # Explicação personalizada para o setor
            prompt = f"""
            Explique como o conceito financeiro "{term}" se aplica especificamente ao setor de {business_sector}.
            
            Sua explicação deve:
            - Conectar o conceito com a realidade desse setor
            - Dar exemplos práticos do dia a dia desse negócio
            - Explicar a importância desse conceito para esse tipo de empresa
            - Ser em no máximo 4 parágrafos
            - Usar linguagem acessível
            
            Seja específico e prático, ajudando o empresário a entender como aplicar isso no seu negócio.
            """
        
        # Usar Emergent LLM Chat
        chat = LlmChat(
            api_key=os.environ.get('OPENAI_API_KEY'),
            session_id=f"term-explanation-{term}",
            system_message="Você é um consultor financeiro especializado em educação empresarial. Seu objetivo é explicar conceitos financeiros de forma clara e aplicada à realidade das empresas."
        ).with_model("openai", "gpt-4o-mini")
        
        user_message = UserMessage(text=prompt)
        explanation = await chat.send_message(user_message)
        
        return {"explanation": explanation, "term": term}
    
    except Exception as e:
        logger.error(f"Erro ao explicar termo: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erro ao explicar: {str(e)}")

# ========== ANÁLISE INTELIGENTE COM IA ==========

@api_router.post("/business-health-score")
async def calculate_business_health_score(data: dict):
    """Calcular Score de Saúde do Negócio (0-100)"""
    try:
        company_id = data['company_id']
        month = data.get('month', datetime.now(timezone.utc).strftime('%Y-%m'))
        
        # Usar aggregation para calcular métricas
        pipeline = [
            {"$match": {
                "company_id": company_id,
                "date": {"$regex": f"^{month}"},
                "status": "realizado"
            }},
            {"$group": {
                "_id": "$type",
                "total": {"$sum": "$amount"}
            }}
        ]
        
        results = await db.transactions.aggregate(pipeline).to_list(None)
        
        faturamento = 0
        custos = 0
        despesas = 0
        
        for result in results:
            if result['_id'] == 'receita':
                faturamento = result['total']
            elif result['_id'] == 'custo':
                custos = result['total']
            elif result['_id'] == 'despesa':
                despesas = result['total']
        
        lucro = faturamento - custos - despesas
        
        # Calcular métricas para o score
        margem_liquida = (lucro / faturamento * 100) if faturamento > 0 else 0
        taxa_custos = (custos / faturamento * 100) if faturamento > 0 else 0
        taxa_despesas = (despesas / faturamento * 100) if faturamento > 0 else 0
        
        # Buscar meta (apenas campos necessários)
        goal = await db.monthly_goals.find_one({
            "company_id": company_id,
            "month": month
        }, {"_id": 0, "goal_amount": 1})
        
        atingimento_meta = 0
        if goal and goal.get('goal_amount', 0) > 0:
            atingimento_meta = min((lucro / goal['goal_amount']) * 100, 100)
        
        # Prompt para IA calcular score e interpretar
        prompt = f"""
        Analise a saúde financeira desta empresa com base nos dados do mês {month}:
        
        - Faturamento: R$ {faturamento:,.2f}
        - Custos: R$ {custos:,.2f} ({taxa_custos:.1f}% do faturamento)
        - Despesas: R$ {despesas:,.2f} ({taxa_despesas:.1f}% do faturamento)
        - Lucro Líquido: R$ {lucro:,.2f}
        - Margem Líquida: {margem_liquida:.1f}%
        - Atingimento de Meta: {atingimento_meta:.1f}%
        
        Com base nisso:
        
        1. Calcule um SCORE DE SAÚDE de 0 a 100 considerando:
           - Lucratividade (peso 30%)
           - Margem líquida (peso 25%)
           - Controle de custos (peso 20%)
           - Controle de despesas (peso 15%)
           - Atingimento de meta (peso 10%)
        
        2. Classifique como: Excelente (85-100), Bom (70-84), Atenção (50-69), Crítico (0-49)
        
        3. Liste os 3 PRINCIPAIS PROBLEMAS detectados
        
        4. Dê 3 AÇÕES RECOMENDADAS práticas e objetivas
        
        Formato da resposta:
        SCORE: [número]
        CLASSIFICAÇÃO: [classificação]
        
        PROBLEMAS:
        1. [problema]
        2. [problema]
        3. [problema]
        
        AÇÕES:
        1. [ação]
        2. [ação]
        3. [ação]
        
        Seja objetivo e prático.
        """
        
        chat = LlmChat(
            api_key=os.environ.get('OPENAI_API_KEY'),
            session_id=f"health-score-{company_id}-{month}",
            system_message="Você é um consultor financeiro especializado em análise de saúde empresarial."
        ).with_model("openai", "gpt-4o-mini")
        
        user_message = UserMessage(text=prompt)
        analysis = await chat.send_message(user_message)
        
        return {
            "score_analysis": analysis,
            "raw_data": {
                "faturamento": faturamento,
                "custos": custos,
                "despesas": despesas,
                "lucro": lucro,
                "margem_liquida": margem_liquida,
                "atingimento_meta": atingimento_meta
            }
        }
    
    except Exception as e:
        logger.error(f"Erro ao calcular score: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erro: {str(e)}")

@api_router.post("/intelligent-alerts")
async def generate_intelligent_alerts(data: dict):
    """Gerar Alertas Inteligentes sobre anomalias"""
    try:
        company_id = data['company_id']
        month = data.get('month', datetime.now(timezone.utc).strftime('%Y-%m'))
        
        # Calcular mês anterior
        date_obj = datetime.strptime(month, '%Y-%m')
        previous_month = (date_obj.replace(day=1) - timedelta(days=1)).strftime('%Y-%m')
        
        # Buscar dados de ambos os meses em uma query com aggregation
        pipeline = [
            {"$match": {
                "company_id": company_id,
                "date": {"$regex": f"^({month}|{previous_month})"},
                "status": "realizado"
            }},
            {"$project": {
                "month": {"$substr": ["$date", 0, 7]},
                "type": 1,
                "amount": 1
            }},
            {"$group": {
                "_id": {
                    "month": "$month",
                    "type": "$type"
                },
                "total": {"$sum": "$amount"}
            }}
        ]
        
        results = await db.transactions.aggregate(pipeline).to_list(None)
        
        # Processar resultados da aggregation
        current_metrics = {"receita": 0, "custo": 0, "despesa": 0}
        previous_metrics = {"receita": 0, "custo": 0, "despesa": 0}
        
        for result in results:
            month_type = result['_id']['month']
            transaction_type = result['_id']['type']
            total = result['total']
            
            if month_type == month:
                current_metrics[transaction_type] = total
            elif month_type == previous_month:
                previous_metrics[transaction_type] = total
        
        # Métricas atuais
        faturamento_atual = current_metrics['receita']
        custos_atual = current_metrics['custo']
        despesas_atual = current_metrics['despesa']
        lucro_atual = faturamento_atual - custos_atual - despesas_atual
        
        # Métricas anteriores
        faturamento_anterior = previous_metrics['receita']
        custos_anterior = previous_metrics['custo']
        despesas_anterior = previous_metrics['despesa']
        lucro_anterior = faturamento_anterior - custos_anterior - despesas_anterior
        
        # Buscar top 5 categorias de custos/despesas do mês atual
        category_pipeline = [
            {"$match": {
                "company_id": company_id,
                "date": {"$regex": f"^{month}"},
                "status": "realizado",
                "type": {"$in": ["custo", "despesa"]}
            }},
            {"$group": {
                "_id": "$category",
                "total": {"$sum": "$amount"}
            }},
            {"$sort": {"total": -1}},
            {"$limit": 5}
        ]
        
        top_expenses_result = await db.transactions.aggregate(category_pipeline).to_list(None)
        top_expenses = [(r['_id'], r['total']) for r in top_expenses_result]
        
        # Prompt para IA detectar alertas
        prompt = f"""
        Você é um sistema de detecção de anomalias financeiras.
        
        Analise os dados e gere ALERTAS INTELIGENTES para o empresário:
        
        MÊS ATUAL ({month}):
        - Faturamento: R$ {faturamento_atual:,.2f}
        - Custos: R$ {custos_atual:,.2f}
        - Despesas: R$ {despesas_atual:,.2f}
        - Lucro: R$ {lucro_atual:,.2f}
        
        MÊS ANTERIOR ({previous_month}):
        - Faturamento: R$ {faturamento_anterior:,.2f}
        - Custos: R$ {custos_anterior:,.2f}
        - Despesas: R$ {despesas_anterior:,.2f}
        - Lucro: R$ {lucro_anterior:,.2f}
        
        TOP 5 MAIORES GASTOS ATUAIS:
        {chr(10).join([f"- {cat}: R$ {val:,.2f}" for cat, val in top_expenses])}
        
        Detecte e gere até 5 ALERTAS se houver:
        
        1. Despesas muito acima da média
        2. Aumento significativo de custos
        3. Queda de faturamento
        4. Queda de lucro
        5. Margem perigosa
        6. Dependência excessiva de categorias
        
        Para cada alerta, forneça:
        - TÍTULO curto
        - TIPO: crítico, atenção ou info
        - MOTIVO claro
        - IMPACTO no negócio
        - AÇÃO RECOMENDADA imediata
        
        Formato:
        ALERTA 1:
        Título: [título]
        Tipo: [tipo]
        Motivo: [motivo]
        Impacto: [impacto]
        Ação: [ação]
        
        Se não houver alertas críticos, diga "SEM ALERTAS CRÍTICOS" e dê 2 dicas preventivas.
        
        Seja direto e prático.
        """
        
        chat = LlmChat(
            api_key=os.environ.get('OPENAI_API_KEY'),
            session_id=f"alerts-{company_id}-{month}",
            system_message="Você é um sistema de alerta financeiro inteligente."
        ).with_model("openai", "gpt-4o-mini")
        
        user_message = UserMessage(text=prompt)
        alerts_analysis = await chat.send_message(user_message)
        
        return {"alerts": alerts_analysis}
    
    except Exception as e:
        logger.error(f"Erro ao gerar alertas: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erro: {str(e)}")

@api_router.post("/complete-business-analysis")
async def generate_complete_analysis(data: dict):
    """Gerar Análise Completa do Negócio com IA"""
    try:
        company_id = data['company_id']
        month = data.get('month', datetime.now(timezone.utc).strftime('%Y-%m'))
        business_sector = data.get('business_sector', 'não informado')
        
        # Buscar todos os dados necessários
        transactions = await db.transactions.find({
            "company_id": company_id,
            "date": {"$regex": f"^{month}"},
            "status": "realizado"
        }, {"_id": 0}).to_list(1000)
        
        company = await db.companies.find_one({"id": company_id}, {"_id": 0})
        
        # Calcular métricas
        faturamento = sum([t['amount'] for t in transactions if t['type'] == 'receita'])
        custos = sum([t['amount'] for t in transactions if t['type'] == 'custo'])
        despesas = sum([t['amount'] for t in transactions if t['type'] == 'despesa'])
        lucro = faturamento - custos - despesas
        
        margem_liquida = (lucro / faturamento * 100) if faturamento > 0 else 0
        margem_bruta = ((faturamento - custos) / faturamento * 100) if faturamento > 0 else 0
        
        # Análise por categoria
        category_analysis = {}
        for t in transactions:
            cat = t['category']
            if cat not in category_analysis:
                category_analysis[cat] = {'receita': 0, 'custo': 0, 'despesa': 0}
            category_analysis[cat][t['type']] += t['amount']
        
        # Buscar últimos 6 meses para tendência (query única otimizada)
        months_list = []
        for i in range(6):
            m = (datetime.strptime(month, '%Y-%m').replace(day=1) - timedelta(days=30*i)).strftime('%Y-%m')
            months_list.append(m)
        
        # Usar aggregation para calcular métricas de todos os meses em uma query
        pipeline = [
            {"$match": {
                "company_id": company_id,
                "status": "realizado",
                "date": {"$regex": f"^({'|'.join(months_list)})"}
            }},
            {"$project": {
                "month": {"$substr": ["$date", 0, 7]},
                "type": 1,
                "amount": 1
            }},
            {"$group": {
                "_id": {
                    "month": "$month",
                    "type": "$type"
                },
                "total": {"$sum": "$amount"}
            }},
            {"$group": {
                "_id": "$_id.month",
                "data": {
                    "$push": {
                        "type": "$_id.type",
                        "amount": "$total"
                    }
                }
            }},
            {"$sort": {"_id": -1}}
        ]
        
        months_agg = await db.transactions.aggregate(pipeline).to_list(None)
        
        # Processar resultados
        all_months_data = []
        for month_data in months_agg:
            m = month_data['_id']
            faturamento = sum([d['amount'] for d in month_data['data'] if d['type'] == 'receita'])
            custos_despesas = sum([d['amount'] for d in month_data['data'] if d['type'] in ['custo', 'despesa']])
            lucro = faturamento - custos_despesas
            all_months_data.append({"month": m, "faturamento": faturamento, "lucro": lucro})
        
        # Prompt completo para análise detalhada
        prompt = f"""
        Você é um CONSULTOR FINANCEIRO SÊNIOR analisando a empresa {company.get('name', 'Cliente')} do setor {business_sector}.
        
        Gere uma ANÁLISE FINANCEIRA COMPLETA E PROFUNDA baseada nos dados:
        
        📊 MÉTRICAS DO MÊS {month}:
        - Faturamento: R$ {faturamento:,.2f}
        - Custos: R$ {custos:,.2f}
        - Despesas: R$ {despesas:,.2f}
        - Lucro Líquido: R$ {lucro:,.2f}
        - Margem Bruta: {margem_bruta:.1f}%
        - Margem Líquida: {margem_liquida:.1f}%
        
        📈 TENDÊNCIA (6 MESES):
        {chr(10).join([f"- {m['month']}: Fat R$ {m['faturamento']:,.2f} | Lucro R$ {m['lucro']:,.2f}" for m in all_months_data])}
        
        Sua análise DEVE incluir:
        
        ## 1. DIAGNÓSTICO GERAL
        - Visão geral da saúde financeira
        - Pontos fortes
        - Pontos fracos
        
        ## 2. ANÁLISE DE MARGENS
        - Interpretação das margens
        - Comparação com setor {business_sector}
        - Se está saudável ou perigoso
        
        ## 3. GARGALOS IDENTIFICADOS
        - Principais problemas
        - Impacto no lucro
        - Risco para o negócio
        
        ## 4. TENDÊNCIAS
        - Crescimento ou queda
        - Sazonalidade detectada
        - Padrões importantes
        
        ## 5. PREVISÃO (30/60/90 DIAS)
        - Projeção de faturamento
        - Projeção de lucro
        - Probabilidade de atingir meta
        
        ## 6. RECOMENDAÇÕES ESTRATÉGICAS
        - 5 ações prioritárias
        - Ordem de importância
        - Impacto esperado
        
        ## 7. OPORTUNIDADES
        - Onde pode melhorar
        - Como aumentar lucro
        - Otimizações possíveis
        
        Seja PROFUNDO, ESPECÍFICO para o setor {business_sector} e PRÁTICO.
        Use linguagem clara mas profissional.
        """
        
        chat = LlmChat(
            api_key=os.environ.get('OPENAI_API_KEY'),
            session_id=f"complete-analysis-{company_id}-{month}",
            system_message="Você é um consultor financeiro sênior com 20 anos de experiência. Suas análises são profundas, práticas e adaptadas ao setor do cliente."
        ).with_model("openai", "gpt-4o-mini")
        
        user_message = UserMessage(text=prompt)
        complete_analysis = await chat.send_message(user_message)
        
        return {
            "analysis": complete_analysis,
            "metrics": {
                "faturamento": faturamento,
                "custos": custos,
                "despesas": despesas,
                "lucro": lucro,
                "margem_liquida": margem_liquida,
                "margem_bruta": margem_bruta
            }
        }
    
    except Exception as e:
        logger.error(f"Erro na análise completa: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erro: {str(e)}")

# ========== ASSINATURA E PAGAMENTO ==========

@api_router.get("/subscription/status/{user_id}")
async def get_subscription_status(user_id: str):
    subscription = await db.subscriptions.find_one({"user_id": user_id}, {"_id": 0})
    
    if not subscription:
        raise HTTPException(status_code=404, detail="Assinatura não encontrada")
    
    # Calcular dias restantes do trial
    if subscription['status'] == 'trial':
        trial_end = datetime.fromisoformat(subscription['trial_end'])
        now = datetime.now(timezone.utc)
        days_remaining = (trial_end - now).days
        subscription['days_remaining'] = max(0, days_remaining)
    
    return subscription

@api_router.post("/subscription/create-payment")
async def create_payment(data: dict):
    try:
        # user_id será usado no futuro para tracking
        # user_id = data['user_id']
        
        # Criar preferência de pagamento PIX
        payment_data = {
            "transaction_amount": 49.90,
            "description": "Assinatura Mensal - Lucro Líquido",
            "payment_method_id": "pix",
            "payer": {
                "email": data.get('email', 'usuario@email.com')
            }
        }
        
        payment_response = sdk.payment().create(payment_data)
        payment = payment_response["response"]
        
        # Extrair QR Code
        qr_code = payment.get('point_of_interaction', {}).get('transaction_data', {}).get('qr_code', '')
        qr_code_base64 = payment.get('point_of_interaction', {}).get('transaction_data', {}).get('qr_code_base64', '')
        
        return {
            "payment_id": payment['id'],
            "qr_code": qr_code,
            "qr_code_base64": qr_code_base64,
            "amount": 49.90
        }
    
    except Exception as e:
        logger.error(f"Erro ao criar pagamento: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erro ao criar pagamento: {str(e)}")

@api_router.post("/subscription/webhook")
async def webhook(data: dict):
    """Webhook para receber notificações do Mercado Pago"""
    try:
        if data.get('type') == 'payment':
            payment_id = data['data']['id']
            
            # Buscar informações do pagamento
            payment_info = sdk.payment().get(payment_id)
            payment = payment_info['response']
            
            if payment['status'] == 'approved':
                # Atualizar assinatura para ativa
                # Aqui você precisaria identificar o usuário pelo payment_id
                logger.info(f"Pagamento aprovado: {payment_id}")
        
        return {"status": "ok"}
    
    except Exception as e:
        logger.error(f"Erro no webhook: {str(e)}")
        return {"status": "error"}

# ========== CONTAS A PAGAR E RECEBER ==========

async def create_lancamento_from_conta(conta: dict, tipo_lancamento: str):
    """Criar lançamento financeiro automaticamente quando conta é paga/recebida"""
    transaction = Transaction(
        company_id=conta['company_id'],
        user_id=conta['user_id'],
        type=tipo_lancamento,  # despesa (para PAGAR) ou receita (para RECEBER)
        description=conta['descricao'],
        amount=conta['valor'],
        category=conta['categoria'],
        date=conta['data_pagamento'] or conta['data_vencimento'],
        status="realizado",
        notes=f"Lançamento automático de conta {conta['tipo'].lower()}",
        origem="conta",
        conta_id=conta['id'],
        cancelled=False
    )
    
    doc = transaction.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.transactions.insert_one(doc)
    
    return transaction.id

async def cancel_lancamento_from_conta(conta_id: str):
    """Marcar lançamento como cancelado quando conta volta para PENDENTE"""
    result = await db.transactions.update_one(
        {"conta_id": conta_id},
        {"$set": {"cancelled": True}}
    )
    return result.modified_count > 0

@api_router.get("/contas/categorias")
async def get_categorias_contas():
    """Retorna categorias de contas a pagar e receber"""
    return {
        "pagar": [
            "Aluguel",
            "Folha de Pagamento",
            "Impostos",
            "Fornecedores",
            "Água",
            "Luz",
            "Internet",
            "Telefone",
            "Manutenção",
            "Seguros",
            "Empréstimos",
            "Marketing",
            "Contador",
            "Outros"
        ],
        "receber": [
            "Cliente",
            "Contrato",
            "Plano Mensalidade",
            "Serviço Prestado",
            "Venda Produto",
            "Projeto",
            "Consultoria",
            "Parceria",
            "Outros"
        ]
    }

# ===== CONTAS A PAGAR =====

@api_router.post("/contas/pagar")
async def create_conta_pagar(conta_data: ContaCreate):
    """Criar nova conta a pagar"""
    if conta_data.tipo != "PAGAR":
        raise HTTPException(status_code=400, detail="Tipo deve ser PAGAR")
    
    conta = Conta(**conta_data.model_dump())
    
    # Verificar se está atrasada
    from datetime import datetime as dt
    hoje = dt.now().strftime("%Y-%m-%d")
    if conta.data_vencimento < hoje and conta.status == "PENDENTE":
        conta.status = "ATRASADO"
    
    doc = conta.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    doc['updated_at'] = doc['updated_at'].isoformat()
    await db.contas.insert_one(doc)
    
    return {"message": "Conta a pagar criada com sucesso!", "conta_id": conta.id}

@api_router.get("/contas/pagar")
async def get_contas_pagar(
    company_id: str,
    status: Optional[str] = None,
    mes: Optional[str] = None,
    categoria: Optional[str] = None
):
    """Listar contas a pagar com filtros"""
    query = {"company_id": company_id, "tipo": "PAGAR"}
    
    if status:
        query["status"] = status
    if mes:
        query["data_vencimento"] = {"$regex": f"^{mes}"}
    if categoria:
        query["categoria"] = categoria
    
    contas = await db.contas.find(query, {"_id": 0}).sort("data_vencimento", 1).to_list(500)
    return contas

@api_router.get("/contas/pagar/{conta_id}")
async def get_conta_pagar(conta_id: str):
    """Buscar conta a pagar por ID"""
    conta = await db.contas.find_one({"id": conta_id, "tipo": "PAGAR"}, {"_id": 0})
    
    if not conta:
        raise HTTPException(status_code=404, detail="Conta não encontrada")
    
    return conta

@api_router.put("/contas/pagar/{conta_id}")
async def update_conta_pagar(conta_id: str, conta_data: ContaCreate):
    """Atualizar conta a pagar"""
    if conta_data.tipo != "PAGAR":
        raise HTTPException(status_code=400, detail="Tipo deve ser PAGAR")
    
    from datetime import datetime as dt
    update_doc = conta_data.model_dump()
    update_doc['updated_at'] = dt.now(timezone.utc).isoformat()
    
    result = await db.contas.update_one(
        {"id": conta_id},
        {"$set": update_doc}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Conta não encontrada")
    
    return {"message": "Conta atualizada com sucesso!"}

@api_router.delete("/contas/pagar/{conta_id}")
async def delete_conta_pagar(conta_id: str):
    """Deletar conta a pagar"""
    # Verificar se tem lançamento vinculado
    conta = await db.contas.find_one({"id": conta_id})
    if conta and conta.get('lancamento_id'):
        # Cancelar lançamento vinculado
        await cancel_lancamento_from_conta(conta_id)
    
    result = await db.contas.delete_one({"id": conta_id, "tipo": "PAGAR"})
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Conta não encontrada")
    
    return {"message": "Conta excluída com sucesso!"}

@api_router.patch("/contas/pagar/{conta_id}/status")
async def update_status_conta_pagar(conta_id: str, status_data: ContaStatusUpdate):
    """Atualizar status da conta a pagar"""
    conta = await db.contas.find_one({"id": conta_id, "tipo": "PAGAR"})
    
    if not conta:
        raise HTTPException(status_code=404, detail="Conta não encontrada")
    
    from datetime import datetime as dt
    update_fields = {
        "status": status_data.status,
        "updated_at": dt.now(timezone.utc).isoformat()
    }
    
    # Se marcar como PAGO, criar lançamento automático
    if status_data.status == "PAGO" and not conta.get('lancamento_id'):
        data_pagamento = status_data.data_pagamento or dt.now().strftime("%Y-%m-%d")
        update_fields['data_pagamento'] = data_pagamento
        
        # Atualizar conta primeiro
        await db.contas.update_one({"id": conta_id}, {"$set": update_fields})
        
        # Criar lançamento de despesa
        conta_atualizada = await db.contas.find_one({"id": conta_id})
        lancamento_id = await create_lancamento_from_conta(conta_atualizada, "despesa")
        
        # Vincular lançamento à conta
        await db.contas.update_one(
            {"id": conta_id},
            {"$set": {"lancamento_id": lancamento_id}}
        )
        
        return {"message": "Conta marcada como PAGA e lançamento criado!", "lancamento_id": lancamento_id}
    
    # Se voltar para PENDENTE, cancelar lançamento
    elif status_data.status == "PENDENTE" and conta.get('lancamento_id'):
        await cancel_lancamento_from_conta(conta_id)
        update_fields['data_pagamento'] = None
        update_fields['lancamento_id'] = None
    
    await db.contas.update_one({"id": conta_id}, {"$set": update_fields})
    
    return {"message": "Status atualizado com sucesso!"}

# ===== CONTAS A RECEBER =====

@api_router.post("/contas/receber")
async def create_conta_receber(conta_data: ContaCreate):
    """Criar nova conta a receber"""
    if conta_data.tipo != "RECEBER":
        raise HTTPException(status_code=400, detail="Tipo deve ser RECEBER")
    
    conta = Conta(**conta_data.model_dump())
    
    # Verificar se está atrasada
    from datetime import datetime as dt
    hoje = dt.now().strftime("%Y-%m-%d")
    if conta.data_vencimento < hoje and conta.status == "PENDENTE":
        conta.status = "ATRASADO"
    
    doc = conta.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    doc['updated_at'] = doc['updated_at'].isoformat()
    await db.contas.insert_one(doc)
    
    return {"message": "Conta a receber criada com sucesso!", "conta_id": conta.id}

@api_router.get("/contas/receber")
async def get_contas_receber(
    company_id: str,
    status: Optional[str] = None,
    mes: Optional[str] = None,
    categoria: Optional[str] = None
):
    """Listar contas a receber com filtros"""
    query = {"company_id": company_id, "tipo": "RECEBER"}
    
    if status:
        query["status"] = status
    if mes:
        query["data_vencimento"] = {"$regex": f"^{mes}"}
    if categoria:
        query["categoria"] = categoria
    
    contas = await db.contas.find(query, {"_id": 0}).sort("data_vencimento", 1).to_list(500)
    return contas

@api_router.get("/contas/receber/{conta_id}")
async def get_conta_receber(conta_id: str):
    """Buscar conta a receber por ID"""
    conta = await db.contas.find_one({"id": conta_id, "tipo": "RECEBER"}, {"_id": 0})
    
    if not conta:
        raise HTTPException(status_code=404, detail="Conta não encontrada")
    
    return conta

@api_router.put("/contas/receber/{conta_id}")
async def update_conta_receber(conta_id: str, conta_data: ContaCreate):
    """Atualizar conta a receber"""
    if conta_data.tipo != "RECEBER":
        raise HTTPException(status_code=400, detail="Tipo deve ser RECEBER")
    
    from datetime import datetime as dt
    update_doc = conta_data.model_dump()
    update_doc['updated_at'] = dt.now(timezone.utc).isoformat()
    
    result = await db.contas.update_one(
        {"id": conta_id},
        {"$set": update_doc}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Conta não encontrada")
    
    return {"message": "Conta atualizada com sucesso!"}

@api_router.delete("/contas/receber/{conta_id}")
async def delete_conta_receber(conta_id: str):
    """Deletar conta a receber"""
    # Verificar se tem lançamento vinculado
    conta = await db.contas.find_one({"id": conta_id})
    if conta and conta.get('lancamento_id'):
        # Cancelar lançamento vinculado
        await cancel_lancamento_from_conta(conta_id)
    
    result = await db.contas.delete_one({"id": conta_id, "tipo": "RECEBER"})
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Conta não encontrada")
    
    return {"message": "Conta excluída com sucesso!"}

@api_router.patch("/contas/receber/{conta_id}/status")
async def update_status_conta_receber(conta_id: str, status_data: ContaStatusUpdate):
    """Atualizar status da conta a receber"""
    conta = await db.contas.find_one({"id": conta_id, "tipo": "RECEBER"})
    
    if not conta:
        raise HTTPException(status_code=404, detail="Conta não encontrada")
    
    from datetime import datetime as dt
    update_fields = {
        "status": status_data.status,
        "updated_at": dt.now(timezone.utc).isoformat()
    }
    
    # Se marcar como RECEBIDO, criar lançamento automático
    if status_data.status == "RECEBIDO" and not conta.get('lancamento_id'):
        data_pagamento = status_data.data_pagamento or dt.now().strftime("%Y-%m-%d")
        update_fields['data_pagamento'] = data_pagamento
        
        # Atualizar conta primeiro
        await db.contas.update_one({"id": conta_id}, {"$set": update_fields})
        
        # Criar lançamento de receita
        conta_atualizada = await db.contas.find_one({"id": conta_id})
        lancamento_id = await create_lancamento_from_conta(conta_atualizada, "receita")
        
        # Vincular lançamento à conta
        await db.contas.update_one(
            {"id": conta_id},
            {"$set": {"lancamento_id": lancamento_id}}
        )
        
        return {"message": "Conta marcada como RECEBIDA e lançamento criado!", "lancamento_id": lancamento_id}
    
    # Se voltar para PENDENTE, cancelar lançamento
    elif status_data.status == "PENDENTE" and conta.get('lancamento_id'):
        await cancel_lancamento_from_conta(conta_id)
        update_fields['data_pagamento'] = None
        update_fields['lancamento_id'] = None
    
    await db.contas.update_one({"id": conta_id}, {"$set": update_fields})
    
    return {"message": "Status atualizado com sucesso!"}

# ===== RESUMOS E CONSULTAS =====

@api_router.get("/contas/resumo-mensal")
async def get_resumo_mensal(company_id: str, mes: str):
    """Resumo mensal de contas a pagar e receber"""
    # Aggregation para contas a pagar
    pipeline_pagar = [
        {"$match": {
            "company_id": company_id,
            "tipo": "PAGAR",
            "data_vencimento": {"$regex": f"^{mes}"}
        }},
        {"$group": {
            "_id": "$status",
            "total": {"$sum": "$valor"},
            "quantidade": {"$sum": 1}
        }}
    ]
    
    # Aggregation para contas a receber
    pipeline_receber = [
        {"$match": {
            "company_id": company_id,
            "tipo": "RECEBER",
            "data_vencimento": {"$regex": f"^{mes}"}
        }},
        {"$group": {
            "_id": "$status",
            "total": {"$sum": "$valor"},
            "quantidade": {"$sum": 1}
        }}
    ]
    
    results_pagar = await db.contas.aggregate(pipeline_pagar).to_list(None)
    results_receber = await db.contas.aggregate(pipeline_receber).to_list(None)
    
    # Processar resultados
    pagar = {"pendente": 0, "pago": 0, "atrasado": 0, "total": 0, "quantidade_total": 0}
    receber = {"pendente": 0, "recebido": 0, "atrasado": 0, "total": 0, "quantidade_total": 0}
    
    for r in results_pagar:
        status = r['_id'].lower()
        if status == "pendente":
            pagar['pendente'] = r['total']
        elif status == "pago":
            pagar['pago'] = r['total']
        elif status == "atrasado":
            pagar['atrasado'] = r['total']
        pagar['total'] += r['total']
        pagar['quantidade_total'] += r['quantidade']
    
    for r in results_receber:
        status = r['_id'].lower()
        if status == "pendente":
            receber['pendente'] = r['total']
        elif status in ["recebido", "pago"]:
            receber['recebido'] = r['total']
        elif status == "atrasado":
            receber['atrasado'] = r['total']
        receber['total'] += r['total']
        receber['quantidade_total'] += r['quantidade']
    
    # Calcular saldo projetado
    saldo_projetado = receber['pendente'] - pagar['pendente']
    
    return {
        "pagar": pagar,
        "receber": receber,
        "saldo_projetado": saldo_projetado,
        "contas_atrasadas": {
            "pagar": pagar['atrasado'],
            "receber": receber['atrasado'],
            "total": pagar['atrasado'] + receber['atrasado']
        }
    }

@api_router.get("/contas/proximos-vencimentos")
async def get_proximos_vencimentos(company_id: str, dias: int = 7):
    """Listar próximas contas a vencer nos próximos N dias"""
    from datetime import datetime as dt, timedelta
    
    hoje = dt.now()
    data_limite = hoje + timedelta(days=dias)
    
    # Buscar contas pendentes ou atrasadas que vencem nos próximos N dias
    pipeline = [
        {"$match": {
            "company_id": company_id,
            "status": {"$in": ["PENDENTE", "ATRASADO"]},
            "data_vencimento": {
                "$gte": hoje.strftime("%Y-%m-%d"),
                "$lte": data_limite.strftime("%Y-%m-%d")
            }
        }},
        {"$sort": {"data_vencimento": 1}},
        {"$project": {"_id": 0}}
    ]
    
    contas = await db.contas.aggregate(pipeline).to_list(100)
    
    return {
        "periodo": f"{dias} dias",
        "quantidade": len(contas),
        "contas": contas
    }


@api_router.get("/contas/fluxo-caixa-projetado")
async def get_fluxo_caixa_projetado(company_id: str, meses: int = 6):
    """Retorna fluxo de caixa projetado (contas a pagar e receber) para os próximos N meses"""
    from datetime import datetime as dt
    from dateutil.relativedelta import relativedelta
    
    hoje = dt.now()
    resultado = []
    
    for i in range(meses):
        mes_ref = hoje + relativedelta(months=i)
        mes_str = mes_ref.strftime("%Y-%m")
        mes_label = mes_ref.strftime("%b/%Y")
        
        # Contas a receber (entradas)
        pipeline_entradas = [
            {"$match": {
                "company_id": company_id,
                "tipo": "RECEBER",
                "data_vencimento": {"$regex": f"^{mes_str}"}
            }},
            {"$group": {
                "_id": None,
                "total": {"$sum": "$valor"}
            }}
        ]
        
        # Contas a pagar (saídas)
        pipeline_saidas = [
            {"$match": {
                "company_id": company_id,
                "tipo": "PAGAR",
                "data_vencimento": {"$regex": f"^{mes_str}"}
            }},
            {"$group": {
                "_id": None,
                "total": {"$sum": "$valor"}
            }}
        ]
        
        result_entradas = await db.contas.aggregate(pipeline_entradas).to_list(None)
        result_saidas = await db.contas.aggregate(pipeline_saidas).to_list(None)
        
        entradas = result_entradas[0]['total'] if result_entradas else 0
        saidas = result_saidas[0]['total'] if result_saidas else 0
        
        resultado.append({
            "mes": mes_label,
            "entradas": entradas,
            "saidas": saidas,
            "saldo": entradas - saidas
        })
    
    return resultado

@api_router.get("/contas/pagar-por-categoria")
async def get_contas_pagar_por_categoria(company_id: str, mes: Optional[str] = None):
    """Agrupa contas a pagar por categoria"""
    from datetime import datetime as dt
    
    if not mes:
        mes = dt.now().strftime("%Y-%m")
    
    pipeline = [
        {"$match": {
            "company_id": company_id,
            "tipo": "PAGAR",
            "data_vencimento": {"$regex": f"^{mes}"}
        }},
        {"$group": {
            "_id": "$categoria",
            "total": {"$sum": "$valor"},
            "quantidade": {"$sum": 1}
        }},
        {"$sort": {"total": -1}},
        {"$limit": 10}
    ]
    
    results = await db.contas.aggregate(pipeline).to_list(None)
    
    # Calcular total para percentuais
    total_geral = sum(r['total'] for r in results)
    
    return [
        {
            "categoria": r['_id'],
            "valor": r['total'],
            "quantidade": r['quantidade'],
            "percentual": round((r['total'] / total_geral * 100), 1) if total_geral > 0 else 0
        }
        for r in results
    ]

@api_router.get("/contas/receber-por-cliente")
async def get_contas_receber_por_cliente(company_id: str, mes: Optional[str] = None):
    """Agrupa contas a receber por cliente (descrição)"""
    from datetime import datetime as dt
    
    if not mes:
        mes = dt.now().strftime("%Y-%m")
    
    # Agrupar por descrição (que geralmente contém o nome do cliente)
    pipeline = [
        {"$match": {
            "company_id": company_id,
            "tipo": "RECEBER",
            "data_vencimento": {"$regex": f"^{mes}"}
        }},
        {"$group": {
            "_id": "$categoria",
            "total": {"$sum": "$valor"},
            "quantidade": {"$sum": 1}
        }},
        {"$sort": {"total": -1}},
        {"$limit": 10}
    ]
    
    results = await db.contas.aggregate(pipeline).to_list(None)
    
    # Calcular total para percentuais
    total_geral = sum(r['total'] for r in results)
    
    return [
        {
            "cliente": r['_id'],
            "valor": r['total'],
            "quantidade": r['quantidade'],
            "percentual": round((r['total'] / total_geral * 100), 1) if total_geral > 0 else 0
        }
        for r in results
    ]

# ========== ADMIN: VERIFICAR ROLE ==========

async def verify_admin(user_id: str):
    """Verificar se usuário é admin"""
    user = await db.users.find_one({"id": user_id})
    
    if not user or user['role'] != 'admin':
        raise HTTPException(status_code=403, detail="Acesso negado. Apenas administradores.")
    
    return True

# ========== ADMIN: ESTATÍSTICAS ==========

@api_router.get("/admin/stats")
async def admin_stats(user_id: str):
    await verify_admin(user_id)
    
    # Total de usuários
    total_users = await db.users.count_documents({})
    
    # Assinaturas ativas
    active_subs = await db.subscriptions.count_documents({"status": "active"})
    
    # MRR (Receita Mensal Recorrente)
    mrr = active_subs * 49.90
    
    # ARR (Receita Anual)
    arr = mrr * 12
    
    # Taxa de conversão (trial -> active)
    # total_trials pode ser usado no futuro para cálculos mais detalhados
    # total_trials = await db.subscriptions.count_documents({"status": "trial"})
    conversion_rate = (active_subs / max(total_users - 1, 1)) * 100  # -1 para excluir admin
    
    # Total de empresas
    total_companies = await db.companies.count_documents({})
    
    return {
        "total_users": total_users,
        "active_subscriptions": active_subs,
        "mrr": mrr,
        "arr": arr,
        "conversion_rate": round(conversion_rate, 2),
        "total_companies": total_companies
    }

@api_router.get("/admin/users")
async def admin_users(user_id: str):
    await verify_admin(user_id)
    
    # Usar aggregation pipeline para evitar N+1 queries
    pipeline = [
        {"$match": {"role": "user"}},
        {"$project": {"_id": 0, "password": 0}},
        {"$lookup": {
            "from": "subscriptions",
            "localField": "id",
            "foreignField": "user_id",
            "as": "subscription"
        }},
        {"$lookup": {
            "from": "companies",
            "localField": "id",
            "foreignField": "user_id",
            "as": "companies"
        }},
        {"$addFields": {
            "subscription_status": {
                "$ifNull": [
                    {"$arrayElemAt": ["$subscription.status", 0]},
                    "none"
                ]
            },
            "companies_count": {"$size": "$companies"}
        }},
        {"$project": {"subscription": 0, "companies": 0}},
        {"$limit": 100}
    ]
    
    users = await db.users.aggregate(pipeline).to_list(None)
    return users

@api_router.get("/admin/subscriptions")
async def admin_subscriptions(user_id: str, status: Optional[str] = None):
    await verify_admin(user_id)
    
    # Usar aggregation pipeline para evitar N+1 queries
    match_stage = {"$match": {}}
    if status:
        match_stage["$match"]["status"] = status
    
    pipeline = [
        match_stage,
        {"$project": {"_id": 0}},
        {"$lookup": {
            "from": "users",
            "localField": "user_id",
            "foreignField": "id",
            "as": "user"
        }},
        {"$addFields": {
            "user_name": {
                "$ifNull": [
                    {"$arrayElemAt": ["$user.name", 0]},
                    "Desconhecido"
                ]
            },
            "user_email": {
                "$ifNull": [
                    {"$arrayElemAt": ["$user.email", 0]},
                    "Desconhecido"
                ]
            }
        }},
        {"$project": {"user": 0}},
        {"$limit": 100}
    ]
    
    subscriptions = await db.subscriptions.aggregate(pipeline).to_list(None)
    return subscriptions

@api_router.get("/admin/revenue-chart")
async def admin_revenue_chart(admin_user_id: str):
    await verify_admin(admin_user_id)
    
    # Gerar dados de receita mensal (últimos 12 meses)
    # Para MVP, vamos simular com dados baseados nas assinaturas atuais
    active_count = await db.subscriptions.count_documents({"status": "active"})
    
    months = []
    now = datetime.now(timezone.utc)
    
    for i in range(11, -1, -1):
        month_date = now - timedelta(days=i*30)
        month_label = month_date.strftime("%b/%y")
        
        # Simular crescimento gradual
        revenue = (active_count * 49.90) * ((12 - i) / 12)
        
        months.append({
            "month": month_label,
            "revenue": round(revenue, 2)
        })
    
    return months

@api_router.post("/admin/user/{target_id}/toggle-status")
async def admin_toggle_user_status(target_id: str, admin_user_id: str):
    await verify_admin(admin_user_id)
    
    # Buscar assinatura do usuário
    subscription = await db.subscriptions.find_one({"user_id": target_id})
    
    if not subscription:
        raise HTTPException(status_code=404, detail="Assinatura não encontrada")
    
    # Alternar status
    new_status = "expired" if subscription['status'] == "active" else "active"
    
    await db.subscriptions.update_one(
        {"id": subscription['id']},
        {"$set": {"status": new_status}}
    )
    
    return {"message": f"Status alterado para {new_status}", "new_status": new_status}

# ========== ROTAS: TABELA DE PREÇOS (SERVICE_PRICE_TABLE) ==========

@api_router.get("/service-price-table/{company_id}")
async def get_service_price_table(
    company_id: str,
    search: Optional[str] = None,
    category: Optional[str] = None,
    unit: Optional[str] = None,
    active: Optional[bool] = None,
    page: int = 1,
    limit: int = 50
):
    """Listar itens da tabela de preços com filtros e paginação"""
    try:
        query = {"company_id": company_id}
        
        if search:
            query["$or"] = [
                {"description": {"$regex": search, "$options": "i"}},
                {"code": {"$regex": search, "$options": "i"}}
            ]
        
        if category:
            query["category"] = category
        
        if unit:
            query["unit"] = unit
        
        if active is not None:
            query["active"] = active
        
        # Contar total
        total = await db.service_price_table.count_documents(query)
        
        # Buscar com paginação
        skip = (page - 1) * limit
        items = await db.service_price_table.find(
            query, {"_id": 0}
        ).sort([("description", 1)]).skip(skip).limit(limit).to_list(limit)
        
        return {
            "items": items,
            "total": total,
            "page": page,
            "limit": limit,
            "pages": (total + limit - 1) // limit
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/service-price-table/{company_id}/categories")
async def get_service_price_categories(company_id: str):
    """Listar categorias únicas da tabela de preços"""
    try:
        categories = await db.service_price_table.distinct("category", {"company_id": company_id})
        return {"categories": [c for c in categories if c]}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/service-price-table/{company_id}/autocomplete")
async def autocomplete_service_price(
    company_id: str,
    search: str = "",
    category: Optional[str] = None,
    limit: int = 20
):
    """Autocomplete otimizado para busca no orçamento"""
    try:
        query = {"company_id": company_id, "active": True}
        
        if search:
            query["$or"] = [
                {"description": {"$regex": search, "$options": "i"}},
                {"code": {"$regex": search, "$options": "i"}}
            ]
        
        if category:
            query["category"] = category
        
        # Retornar apenas campos necessários
        items = await db.service_price_table.find(
            query,
            {"_id": 0, "id": 1, "code": 1, "description": 1, "category": 1, "unit": 1, "pu1_base_price": 1}
        ).limit(limit).to_list(limit)
        
        return items
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/service-price/{item_id}")
async def get_service_price_item(item_id: str):
    """Buscar item específico da tabela de preços"""
    try:
        item = await db.service_price_table.find_one({"id": item_id}, {"_id": 0})
        if not item:
            raise HTTPException(status_code=404, detail="Item não encontrado")
        return item
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

async def gerar_codigo_servico(company_id: str):
    """Gerar código automático sequencial para serviço (formato: SRV-0001)"""
    # Buscar último serviço com código automático
    ultimo_servico = await db.service_price_table.find_one(
        {
            "company_id": company_id,
            "code": {"$regex": r"^SRV-\d+$"}
        },
        sort=[("created_at", -1)]
    )
    
    if ultimo_servico and ultimo_servico.get('code'):
        try:
            # Extrair número do último código
            ultimo_numero = int(ultimo_servico['code'].split('-')[-1])
            proximo_numero = ultimo_numero + 1
        except:
            proximo_numero = 1
    else:
        proximo_numero = 1
    
    return f"SRV-{proximo_numero:04d}"

@api_router.post("/service-price-table")
async def create_service_price(data: ServicePriceCreate):
    """Criar novo item na tabela de preços"""
    try:
        # Validar unidade
        if data.unit not in PRICE_TABLE_UNITS:
            raise HTTPException(
                status_code=400,
                detail=f"Unidade inválida. Use: {', '.join(PRICE_TABLE_UNITS)}"
            )
        
        # Validar preço
        if data.pu1_base_price <= 0:
            raise HTTPException(status_code=400, detail="Preço base deve ser maior que 0")
        
        # Validar descrição
        description = data.description.strip().upper()
        if len(description) < 3:
            raise HTTPException(status_code=400, detail="Descrição deve ter no mínimo 3 caracteres")
        
        # Verificar duplicidade (description + unit + category)
        existing = await db.service_price_table.find_one({
            "company_id": data.company_id,
            "description": description,
            "unit": data.unit,
            "category": data.category
        })
        
        if existing:
            raise HTTPException(
                status_code=400,
                detail="Já existe um serviço com essa descrição, unidade e categoria"
            )
        
        # Gerar código automático se não fornecido
        service_code = None
        if data.code:
            service_code = data.code.strip().upper()
        else:
            # Código automático
            service_code = await gerar_codigo_servico(data.company_id)
        
        # Criar item
        item = ServicePrice(
            company_id=data.company_id,
            code=service_code,
            description=description,
            category=data.category.strip() if data.category else None,
            unit=data.unit,
            pu1_base_price=round(data.pu1_base_price, 2)
        )
        
        doc = item.model_dump()
        doc['created_at'] = doc['created_at'].isoformat()
        doc['updated_at'] = doc['updated_at'].isoformat()
        
        await db.service_price_table.insert_one(doc)
        
        # Remover _id do MongoDB antes de retornar
        doc.pop('_id', None)
        
        return {
            "message": "Item criado com sucesso!",
            "id": item.id,
            "item": doc
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@api_router.put("/service-price-table/{item_id}")
async def update_service_price(item_id: str, data: ServicePriceCreate):
    """Atualizar item da tabela de preços"""
    try:
        existing = await db.service_price_table.find_one({"id": item_id})
        if not existing:
            raise HTTPException(status_code=404, detail="Item não encontrado")
        
        # Validar unidade
        if data.unit not in PRICE_TABLE_UNITS:
            raise HTTPException(
                status_code=400,
                detail=f"Unidade inválida. Use: {', '.join(PRICE_TABLE_UNITS)}"
            )
        
        # Validar preço
        if data.pu1_base_price <= 0:
            raise HTTPException(status_code=400, detail="Preço base deve ser maior que 0")
        
        description = data.description.strip().upper()
        if len(description) < 3:
            raise HTTPException(status_code=400, detail="Descrição deve ter no mínimo 3 caracteres")
        
        # Verificar duplicidade (exceto o próprio item)
        duplicate = await db.service_price_table.find_one({
            "company_id": data.company_id,
            "description": description,
            "unit": data.unit,
            "category": data.category,
            "id": {"$ne": item_id}
        })
        
        if duplicate:
            raise HTTPException(
                status_code=400,
                detail="Já existe um serviço com essa descrição, unidade e categoria"
            )
        
        update_data = {
            "code": data.code.strip().upper() if data.code else None,
            "description": description,
            "category": data.category.strip() if data.category else None,
            "unit": data.unit,
            "pu1_base_price": round(data.pu1_base_price, 2),
            "updated_at": datetime.now(timezone.utc).isoformat()
        }
        
        await db.service_price_table.update_one(
            {"id": item_id},
            {"$set": update_data}
        )
        
        return {"message": "Item atualizado com sucesso!"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@api_router.patch("/service-price-table/{item_id}/active")
async def toggle_service_price_active(item_id: str, active: bool):
    """Ativar/Desativar item da tabela de preços (soft delete)"""
    try:
        result = await db.service_price_table.update_one(
            {"id": item_id},
            {"$set": {
                "active": active,
                "updated_at": datetime.now(timezone.utc).isoformat()
            }}
        )
        
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Item não encontrado")
        
        status = "ativado" if active else "desativado"
        return {"message": f"Item {status} com sucesso!"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@api_router.delete("/service-price-table/{item_id}")
async def delete_service_price(item_id: str):
    """Deletar item permanentemente (use soft delete preferencialmente)"""
    try:
        result = await db.service_price_table.delete_one({"id": item_id})
        
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Item não encontrado")
        
        return {"message": "Item deletado com sucesso!"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/service-price-table/{company_id}/import")
async def import_service_price_table(company_id: str, items: List[ServicePriceImportItem]):
    """Importar itens em lote para a tabela de preços"""
    try:
        created = 0
        skipped = 0
        errors = []
        
        for idx, item in enumerate(items):
            try:
                # Validar unidade
                if item.unit not in PRICE_TABLE_UNITS:
                    errors.append(f"Linha {idx + 1}: Unidade inválida '{item.unit}'")
                    continue
                
                # Validar preço
                if item.pu1_base_price <= 0:
                    errors.append(f"Linha {idx + 1}: Preço deve ser maior que 0")
                    continue
                
                description = item.description.strip().upper()
                if len(description) < 3:
                    errors.append(f"Linha {idx + 1}: Descrição muito curta")
                    continue
                
                # Verificar duplicidade
                existing = await db.service_price_table.find_one({
                    "company_id": company_id,
                    "description": description,
                    "unit": item.unit,
                    "category": item.category
                })
                
                if existing:
                    skipped += 1
                    continue
                
                # Criar item
                new_item = ServicePrice(
                    company_id=company_id,
                    code=item.code.strip().upper() if item.code else None,
                    description=description,
                    category=item.category.strip() if item.category else None,
                    unit=item.unit,
                    pu1_base_price=round(item.pu1_base_price, 2),
                    active=item.active
                )
                
                doc = new_item.model_dump()
                doc['created_at'] = doc['created_at'].isoformat()
                doc['updated_at'] = doc['updated_at'].isoformat()
                
                await db.service_price_table.insert_one(doc)
                created += 1
                
            except Exception as e:
                errors.append(f"Linha {idx + 1}: {str(e)}")
        
        return {
            "message": f"Importação concluída: {created} criados, {skipped} ignorados (duplicados)",
            "created": created,
            "skipped": skipped,
            "errors": errors
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/service-price-table/units/list")
async def get_service_price_units():
    """Retornar lista de unidades disponíveis"""
    return {"units": PRICE_TABLE_UNITS}

# ========== EXPORTAÇÃO ==========

@api_router.get("/export/excel/{company_id}")
async def export_excel(company_id: str, month: str):
    transactions = await db.transactions.find({
        "company_id": company_id,
        "date": {"$regex": f"^{month}"}
    }, {"_id": 0}).to_list(1000)
    
    # Criar workbook
    wb = Workbook()
    ws = wb.active
    ws.title = f"Lançamentos {month}"
    
    # Headers
    headers = ["Data", "Tipo", "Descrição", "Categoria", "Valor", "Status"]
    ws.append(headers)
    
    # Dados
    for t in transactions:
        ws.append([
            t['date'],
            t['type'],
            t['description'],
            t['category'],
            t['amount'],
            t['status']
        ])
    
    # Salvar em BytesIO
    output = BytesIO()
    wb.save(output)
    output.seek(0)
    
    return StreamingResponse(
        output,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f"attachment; filename=lancamentos_{month}.xlsx"}
    )

# ========== INCLUIR ROUTER ==========

app.include_router(api_router)

# Servir arquivos de upload
uploads_dir = Path(ROOT_DIR) / "uploads"
uploads_dir.mkdir(exist_ok=True)

@app.get("/uploads/{filename}")
async def serve_upload(filename: str):
    """Servir arquivos de upload com content-type correto"""
    file_path = uploads_dir / filename
    
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="Arquivo não encontrado")
    
    # Detectar content-type baseado na extensão
    import mimetypes
    content_type, _ = mimetypes.guess_type(str(file_path))
    if not content_type:
        content_type = 'application/octet-stream'
    
    return FileResponse(file_path, media_type=content_type)

# Health check endpoints
@app.get("/")
async def root():
    return {"status": "ok", "message": "Backend funcionando!"}

@app.get("/health")
async def health():
    return {"status": "healthy", "backend": "ok"}

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
# Logger já configurado no início do arquivo

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()