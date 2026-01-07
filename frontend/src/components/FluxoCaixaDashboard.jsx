import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { axiosInstance } from '../App';
import { 
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, ReferenceLine, Legend, ComposedChart
} from 'recharts';
import { 
  Wallet, TrendingUp, TrendingDown, AlertTriangle, Calendar,
  ArrowUpRight, ArrowDownRight, Clock, ChevronRight, RefreshCw,
  DollarSign, AlertCircle, CheckCircle, XCircle, Banknote
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

// Cores do tema
const COLORS = {
  positivo: '#10B981',
  negativo: '#EF4444',
  entrada: '#10B981',
  saida: '#F97316',
  alerta: '#F59E0B',
  info: '#3B82F6',
  saldo: '#8B5CF6',
  area_positiva: 'rgba(16, 185, 129, 0.3)',
  area_negativa: 'rgba(239, 68, 68, 0.3)'
};

// Tooltip customizado para o gráfico de saldo
const SaldoTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-zinc-900 border border-purple-500/50 rounded-lg p-3 shadow-lg shadow-purple-500/20">
        <p className="text-white font-bold mb-2">{data.data}</p>
        <p className={`text-sm ${data.saldo >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
          Saldo: R$ {data.saldo?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
        </p>
        {data.entradas > 0 && (
          <p className="text-sm text-emerald-400">
            + Entradas: R$ {data.entradas?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
        )}
        {data.saidas > 0 && (
          <p className="text-sm text-orange-400">
            - Saídas: R$ {data.saidas?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
        )}
      </div>
    );
  }
  return null;
};

// Tooltip para gráfico de barras
const BarrasTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-zinc-900 border border-blue-500/50 rounded-lg p-3 shadow-lg">
        <p className="text-white font-bold mb-2">{label}</p>
        {payload.map((item, index) => (
          <p key={index} style={{ color: item.color }} className="text-sm">
            {item.name}: R$ {item.value?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

const FluxoCaixaDashboard = ({ companyId }) => {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [periodo, setPeriodo] = useState(30);
  const [modo, setModo] = useState('projetado');
  const [refreshing, setRefreshing] = useState(false);

  const fetchFluxoCaixa = useCallback(async () => {
    if (!companyId) return;
    
    try {
      const response = await axiosInstance.get(
        `/fluxo-caixa/dashboard/${companyId}?dias=${periodo}&modo=${modo}`
      );
      setData(response.data);
    } catch (error) {
      console.error('Erro ao carregar fluxo de caixa:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [companyId, periodo, modo]);

  useEffect(() => {
    setLoading(true);
    fetchFluxoCaixa();
  }, [fetchFluxoCaixa]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchFluxoCaixa();
  };

  const formatCurrency = (value) => {
    if (value === undefined || value === null) return '—';
    return `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
  };

  const formatCurrencyShort = (value) => {
    if (value === undefined || value === null) return '—';
    if (Math.abs(value) >= 1000000) {
      return `R$ ${(value / 1000000).toFixed(1)}M`;
    }
    if (Math.abs(value) >= 1000) {
      return `R$ ${(value / 1000).toFixed(1)}k`;
    }
    return `R$ ${value.toFixed(0)}`;
  };

  const handleContaClick = (conta) => {
    if (conta.tipo === 'PAGAR') {
      navigate('/contas-pagar');
    } else {
      navigate('/contas-receber');
    }
  };

  // Loading state
  if (loading) {
    return (
      <Card className="glass border-white/10">
        <CardHeader>
          <CardTitle className="text-lg font-medium text-gray-200 flex items-center gap-2">
            <Wallet className="text-blue-400" size={20} />
            Fluxo de Caixa
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[400px] flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Empty state
  if (!data) {
    return (
      <Card className="glass border-white/10">
        <CardHeader>
          <CardTitle className="text-lg font-medium text-gray-200 flex items-center gap-2">
            <Wallet className="text-blue-400" size={20} />
            Fluxo de Caixa
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] flex flex-col items-center justify-center text-gray-400">
            <Banknote size={48} className="mb-4 opacity-30" />
            <p>Nenhum dado de fluxo de caixa</p>
            <p className="text-sm mt-2">Cadastre contas a pagar/receber para visualizar o fluxo.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const { cards, grafico_saldo, grafico_barras, acoes } = data;
  const temAtrasados = (acoes?.atrasados_pagar?.length > 0) || (acoes?.atrasados_receber?.length > 0);

  return (
    <div className="space-y-6">
      {/* Header com Filtros */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <Wallet className="text-blue-400" size={24} />
          <h2 className="text-xl font-bold text-white">Fluxo de Caixa</h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRefresh}
            disabled={refreshing}
            className="text-gray-400 hover:text-white"
          >
            <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
          </Button>
        </div>

        <div className="flex flex-wrap gap-2">
          {/* Período */}
          <div className="flex gap-1 bg-zinc-800/50 rounded-lg p-1">
            {[7, 15, 30, 60, 90].map((d) => (
              <Button
                key={d}
                variant={periodo === d ? "default" : "ghost"}
                size="sm"
                onClick={() => setPeriodo(d)}
                className={periodo === d 
                  ? "bg-blue-600 hover:bg-blue-700 text-white text-xs px-2" 
                  : "text-gray-400 hover:text-white text-xs px-2"
                }
              >
                {d}d
              </Button>
            ))}
          </div>

          {/* Modo */}
          <div className="flex gap-1 bg-zinc-800/50 rounded-lg p-1">
            <Button
              variant={modo === 'projetado' ? "default" : "ghost"}
              size="sm"
              onClick={() => setModo('projetado')}
              className={modo === 'projetado' 
                ? "bg-purple-600 hover:bg-purple-700 text-white text-xs" 
                : "text-gray-400 hover:text-white text-xs"
              }
            >
              Projetado
            </Button>
            <Button
              variant={modo === 'realizado' ? "default" : "ghost"}
              size="sm"
              onClick={() => setModo('realizado')}
              className={modo === 'realizado' 
                ? "bg-emerald-600 hover:bg-emerald-700 text-white text-xs" 
                : "text-gray-400 hover:text-white text-xs"
              }
            >
              Realizado
            </Button>
            <Button
              variant={modo === 'em_aberto' ? "default" : "ghost"}
              size="sm"
              onClick={() => setModo('em_aberto')}
              className={modo === 'em_aberto' 
                ? "bg-orange-600 hover:bg-orange-700 text-white text-xs" 
                : "text-gray-400 hover:text-white text-xs"
              }
            >
              Em Aberto
            </Button>
          </div>
        </div>
      </div>

      {/* (A) Cards de Resumo */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
        {/* Saldo Atual */}
        <Card className={`glass border-white/10 ${cards.saldo_atual >= 0 ? 'bg-gradient-to-br from-emerald-900/20 to-transparent' : 'bg-gradient-to-br from-rose-900/20 to-transparent'}`}>
          <CardContent className="p-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-gray-400">Saldo Atual</span>
              <Wallet size={14} className={cards.saldo_atual >= 0 ? 'text-emerald-400' : 'text-rose-400'} />
            </div>
            <p className={`text-lg font-bold ${cards.saldo_atual >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {formatCurrencyShort(cards.saldo_atual)}
            </p>
          </CardContent>
        </Card>

        {/* A Receber 7d */}
        <Card className="glass border-white/10">
          <CardContent className="p-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-gray-400">Receber 7d</span>
              <ArrowUpRight size={14} className="text-emerald-400" />
            </div>
            <p className="text-lg font-bold text-emerald-400">
              {formatCurrencyShort(cards.a_receber_7d)}
            </p>
          </CardContent>
        </Card>

        {/* A Receber 30d */}
        <Card className="glass border-white/10">
          <CardContent className="p-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-gray-400">Receber 30d</span>
              <TrendingUp size={14} className="text-emerald-400" />
            </div>
            <p className="text-lg font-bold text-emerald-400">
              {formatCurrencyShort(cards.a_receber_30d)}
            </p>
          </CardContent>
        </Card>

        {/* A Pagar 7d */}
        <Card className="glass border-white/10">
          <CardContent className="p-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-gray-400">Pagar 7d</span>
              <ArrowDownRight size={14} className="text-orange-400" />
            </div>
            <p className="text-lg font-bold text-orange-400">
              {formatCurrencyShort(cards.a_pagar_7d)}
            </p>
          </CardContent>
        </Card>

        {/* A Pagar 30d */}
        <Card className="glass border-white/10">
          <CardContent className="p-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-gray-400">Pagar 30d</span>
              <TrendingDown size={14} className="text-orange-400" />
            </div>
            <p className="text-lg font-bold text-orange-400">
              {formatCurrencyShort(cards.a_pagar_30d)}
            </p>
          </CardContent>
        </Card>

        {/* Saldo Projetado */}
        <Card className={`glass border-white/10 ${cards.saldo_projetado_30d >= 0 ? 'bg-gradient-to-br from-purple-900/20 to-transparent' : 'bg-gradient-to-br from-rose-900/20 to-transparent'}`}>
          <CardContent className="p-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-gray-400">Projetado {periodo}d</span>
              <Calendar size={14} className="text-purple-400" />
            </div>
            <p className={`text-lg font-bold ${cards.saldo_projetado_30d >= 0 ? 'text-purple-400' : 'text-rose-400'}`}>
              {formatCurrencyShort(cards.saldo_projetado_30d)}
            </p>
          </CardContent>
        </Card>

        {/* Menor Saldo (Card de Alerta) */}
        <Card className={`glass border-2 ${
          cards.menor_saldo_30d < 0 
            ? 'border-rose-500/50 bg-gradient-to-br from-rose-900/30 to-transparent animate-pulse' 
            : cards.menor_saldo_30d < cards.saldo_atual * 0.2 
            ? 'border-amber-500/50 bg-gradient-to-br from-amber-900/20 to-transparent'
            : 'border-emerald-500/30 bg-gradient-to-br from-emerald-900/10 to-transparent'
        }`}>
          <CardContent className="p-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-gray-400">Menor Saldo</span>
              <AlertTriangle size={14} className={
                cards.menor_saldo_30d < 0 ? 'text-rose-400' : 
                cards.menor_saldo_30d < cards.saldo_atual * 0.2 ? 'text-amber-400' : 'text-emerald-400'
              } />
            </div>
            <p className={`text-lg font-bold ${
              cards.menor_saldo_30d < 0 ? 'text-rose-400' : 
              cards.menor_saldo_30d < cards.saldo_atual * 0.2 ? 'text-amber-400' : 'text-emerald-400'
            }`}>
              {formatCurrencyShort(cards.menor_saldo_30d)}
            </p>
            {cards.tem_risco_negativo && (
              <p className="text-xs text-rose-400 mt-1">
                ⚠️ {cards.dias_negativos} dia(s) negativo(s)
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Alerta de Atrasados */}
      {temAtrasados && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-amber-500/20 border border-amber-500/30">
          <AlertCircle className="text-amber-400" size={20} />
          <span className="text-amber-300 text-sm">
            Você tem {(acoes?.atrasados_pagar?.length || 0) + (acoes?.atrasados_receber?.length || 0)} título(s) atrasado(s). 
            {cards.atrasados_pagar > 0 && ` A pagar: ${formatCurrency(cards.atrasados_pagar)}.`}
            {cards.atrasados_receber > 0 && ` A receber: ${formatCurrency(cards.atrasados_receber)}.`}
          </span>
        </div>
      )}

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* (B) Gráfico Principal: Saldo Projetado */}
        <Card className="glass border-white/10">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium text-gray-200 flex items-center gap-2">
              <TrendingUp className="text-purple-400" size={18} />
              Saldo Projetado
              <span className="text-xs text-gray-500 font-normal ml-2">
                (próximos {periodo} dias)
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {grafico_saldo && grafico_saldo.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={grafico_saldo} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorSaldo" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={COLORS.saldo} stopOpacity={0.4}/>
                      <stop offset="95%" stopColor={COLORS.saldo} stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis 
                    dataKey="dia" 
                    stroke="#9CA3AF" 
                    style={{ fontSize: '10px' }}
                    interval={Math.floor(grafico_saldo.length / 8)}
                  />
                  <YAxis 
                    stroke="#9CA3AF"
                    style={{ fontSize: '10px' }}
                    tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
                  />
                  <Tooltip content={<SaldoTooltip />} />
                  <ReferenceLine y={0} stroke="#EF4444" strokeDasharray="5 5" strokeWidth={2} />
                  <Area 
                    type="monotone" 
                    dataKey="saldo" 
                    stroke={COLORS.saldo} 
                    strokeWidth={2}
                    fill="url(#colorSaldo)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[280px] flex items-center justify-center text-gray-500">
                Sem dados para exibir
              </div>
            )}
          </CardContent>
        </Card>

        {/* (C) Gráfico Complementar: Entradas x Saídas */}
        <Card className="glass border-white/10">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium text-gray-200 flex items-center gap-2">
              <BarChart className="text-blue-400" size={18} />
              Entradas x Saídas
              <span className="text-xs text-gray-500 font-normal ml-2">
                (volume diário)
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {grafico_barras && grafico_barras.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <ComposedChart data={grafico_barras} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis 
                    dataKey="dia" 
                    stroke="#9CA3AF" 
                    style={{ fontSize: '10px' }}
                    interval={Math.floor(grafico_barras.length / 8)}
                  />
                  <YAxis 
                    stroke="#9CA3AF"
                    style={{ fontSize: '10px' }}
                    tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
                  />
                  <Tooltip content={<BarrasTooltip />} />
                  <Legend wrapperStyle={{ fontSize: '11px' }} />
                  <Bar 
                    dataKey="entradas" 
                    name="Entradas" 
                    fill={COLORS.entrada} 
                    radius={[4, 4, 0, 0]}
                    opacity={0.8}
                  />
                  <Bar 
                    dataKey="saidas" 
                    name="Saídas" 
                    fill={COLORS.saida} 
                    radius={[4, 4, 0, 0]}
                    opacity={0.8}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[280px] flex items-center justify-center text-gray-500">
                Sem dados para exibir
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* (D) Lista de Ações */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* A Pagar Próximos 7 dias */}
        <Card className="glass border-white/10">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-gray-200 flex items-center gap-2">
                <ArrowDownRight className="text-orange-400" size={16} />
                A Pagar (7 dias)
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/contas-pagar')}
                className="text-xs text-gray-400 hover:text-white p-1"
              >
                Ver todos <ChevronRight size={14} />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            {acoes?.proximos_pagar?.length > 0 ? (
              <ul className="space-y-2">
                {acoes.proximos_pagar.map((conta, index) => (
                  <li 
                    key={conta.id || index}
                    onClick={() => handleContaClick(conta)}
                    className="flex items-center justify-between p-2 rounded-lg bg-zinc-800/50 hover:bg-zinc-700/50 cursor-pointer transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-white truncate">{conta.descricao}</p>
                      <p className="text-xs text-gray-500">{conta.data_vencimento}</p>
                    </div>
                    <span className="text-sm font-semibold text-orange-400 ml-2">
                      {formatCurrencyShort(conta.valor)}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-gray-500 text-center py-4">Nenhum pagamento próximo</p>
            )}
          </CardContent>
        </Card>

        {/* A Receber Próximos 7 dias */}
        <Card className="glass border-white/10">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-gray-200 flex items-center gap-2">
                <ArrowUpRight className="text-emerald-400" size={16} />
                A Receber (7 dias)
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/contas-receber')}
                className="text-xs text-gray-400 hover:text-white p-1"
              >
                Ver todos <ChevronRight size={14} />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            {acoes?.proximos_receber?.length > 0 ? (
              <ul className="space-y-2">
                {acoes.proximos_receber.map((conta, index) => (
                  <li 
                    key={conta.id || index}
                    onClick={() => handleContaClick(conta)}
                    className="flex items-center justify-between p-2 rounded-lg bg-zinc-800/50 hover:bg-zinc-700/50 cursor-pointer transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-white truncate">{conta.descricao}</p>
                      <p className="text-xs text-gray-500">{conta.data_vencimento}</p>
                    </div>
                    <span className="text-sm font-semibold text-emerald-400 ml-2">
                      {formatCurrencyShort(conta.valor)}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-gray-500 text-center py-4">Nenhum recebimento próximo</p>
            )}
          </CardContent>
        </Card>

        {/* Atrasados A Pagar */}
        <Card className={`glass ${acoes?.atrasados_pagar?.length > 0 ? 'border-rose-500/30 bg-rose-900/10' : 'border-white/10'}`}>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-gray-200 flex items-center gap-2">
                <XCircle className="text-rose-400" size={16} />
                Atrasados (Pagar)
              </CardTitle>
              {acoes?.atrasados_pagar?.length > 0 && (
                <Badge variant="destructive" className="text-xs">
                  {acoes.atrasados_pagar.length}
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            {acoes?.atrasados_pagar?.length > 0 ? (
              <ul className="space-y-2">
                {acoes.atrasados_pagar.map((conta, index) => (
                  <li 
                    key={conta.id || index}
                    onClick={() => handleContaClick(conta)}
                    className="flex items-center justify-between p-2 rounded-lg bg-rose-900/20 hover:bg-rose-900/30 cursor-pointer transition-colors border border-rose-500/20"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-white truncate">{conta.descricao}</p>
                      <p className="text-xs text-rose-400">{conta.dias_atraso} dia(s) de atraso</p>
                    </div>
                    <span className="text-sm font-semibold text-rose-400 ml-2">
                      {formatCurrencyShort(conta.valor)}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="flex flex-col items-center justify-center py-4">
                <CheckCircle className="text-emerald-400 mb-2" size={24} />
                <p className="text-sm text-emerald-400">Nenhum atraso!</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Atrasados A Receber */}
        <Card className={`glass ${acoes?.atrasados_receber?.length > 0 ? 'border-amber-500/30 bg-amber-900/10' : 'border-white/10'}`}>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-gray-200 flex items-center gap-2">
                <Clock className="text-amber-400" size={16} />
                Atrasados (Receber)
              </CardTitle>
              {acoes?.atrasados_receber?.length > 0 && (
                <Badge className="bg-amber-500 text-xs">
                  {acoes.atrasados_receber.length}
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            {acoes?.atrasados_receber?.length > 0 ? (
              <ul className="space-y-2">
                {acoes.atrasados_receber.map((conta, index) => (
                  <li 
                    key={conta.id || index}
                    onClick={() => handleContaClick(conta)}
                    className="flex items-center justify-between p-2 rounded-lg bg-amber-900/20 hover:bg-amber-900/30 cursor-pointer transition-colors border border-amber-500/20"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-white truncate">{conta.descricao}</p>
                      <p className="text-xs text-amber-400">{conta.dias_atraso} dia(s) de atraso</p>
                    </div>
                    <span className="text-sm font-semibold text-amber-400 ml-2">
                      {formatCurrencyShort(conta.valor)}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="flex flex-col items-center justify-center py-4">
                <CheckCircle className="text-emerald-400 mb-2" size={24} />
                <p className="text-sm text-emerald-400">Nenhum atraso!</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default FluxoCaixaDashboard;
