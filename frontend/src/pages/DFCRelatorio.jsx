import React, { useState, useEffect, useCallback } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { axiosInstance } from '../App';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, Cell, ReferenceLine, Legend
} from 'recharts';
import { 
  Banknote, TrendingUp, TrendingDown, Building2, PiggyBank, Wallet,
  AlertTriangle, Info, ChevronDown, ChevronRight, Calendar, RefreshCw,
  FileText, Download, ArrowUpRight, ArrowDownRight
} from 'lucide-react';

// Cores para o gráfico Waterfall
const WATERFALL_COLORS = {
  base: '#3B82F6',      // Azul
  operacional_pos: '#10B981',  // Verde
  operacional_neg: '#EF4444',  // Vermelho
  investimento_pos: '#8B5CF6', // Roxo
  investimento_neg: '#F97316', // Laranja
  financiamento_pos: '#06B6D4', // Cyan
  financiamento_neg: '#F59E0B', // Amarelo
  total: '#6366F1'      // Indigo
};

// Tooltip customizado para o Waterfall
const WaterfallTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-zinc-900 border border-blue-500/50 rounded-lg p-3 shadow-lg">
        <p className="text-white font-bold mb-1">{data.name}</p>
        <p className={`text-lg font-semibold ${data.value >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
          R$ {data.value?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
        </p>
      </div>
    );
  }
  return null;
};

const DFCRelatorio = ({ user, onLogout }) => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [dfcData, setDfcData] = useState(null);
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [companies, setCompanies] = useState([]);
  
  // Estados para filtros
  const [periodoInicio, setPeriodoInicio] = useState('');
  const [periodoFim, setPeriodoFim] = useState('');
  
  // Estados para expandir/colapsar seções
  const [expandedSections, setExpandedSections] = useState({
    operacional_entradas: false,
    operacional_saidas: false,
    investimento_entradas: false,
    investimento_saidas: false,
    financiamento_entradas: false,
    financiamento_saidas: false
  });

  // Inicializar período com mês atual
  useEffect(() => {
    const hoje = new Date();
    const primeiroDia = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
    const ultimoDia = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0);
    
    setPeriodoInicio(primeiroDia.toISOString().split('T')[0]);
    setPeriodoFim(ultimoDia.toISOString().split('T')[0]);
  }, []);

  // Buscar empresas
  useEffect(() => {
    const fetchCompanies = async () => {
      if (!user?.id) return;
      try {
        const response = await axiosInstance.get(`/companies/${user.id}`);
        setCompanies(response.data);
        if (response.data.length > 0) {
          setSelectedCompany(response.data[0]);
        }
      } catch (error) {
        console.error('Erro ao carregar empresas:', error);
      }
    };
    fetchCompanies();
  }, [user]);

  // Buscar dados do DFC
  const fetchDFC = useCallback(async () => {
    if (!selectedCompany?.id || !periodoInicio || !periodoFim) return;
    
    try {
      const response = await axiosInstance.get(
        `/dfc/relatorio/${selectedCompany.id}?periodo_inicio=${periodoInicio}&periodo_fim=${periodoFim}`
      );
      setDfcData(response.data);
    } catch (error) {
      console.error('Erro ao carregar DFC:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedCompany, periodoInicio, periodoFim]);

  useEffect(() => {
    if (selectedCompany && periodoInicio && periodoFim) {
      setLoading(true);
      fetchDFC();
    }
  }, [fetchDFC]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchDFC();
  };

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const formatCurrency = (value) => {
    if (value === undefined || value === null) return 'R$ 0,00';
    return `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
  };

  const formatCurrencyWithSign = (value) => {
    if (value === undefined || value === null) return 'R$ 0,00';
    const sign = value >= 0 ? '+' : '-';
    return `${sign} R$ ${Math.abs(value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
  };

  // Preparar dados para o gráfico Waterfall
  const prepareWaterfallData = () => {
    if (!dfcData) return [];
    
    return dfcData.waterfall.map((item, index) => {
      let color;
      if (item.tipo === 'base') color = WATERFALL_COLORS.base;
      else if (item.tipo === 'total') color = WATERFALL_COLORS.total;
      else if (item.tipo === 'operacional') color = item.value >= 0 ? WATERFALL_COLORS.operacional_pos : WATERFALL_COLORS.operacional_neg;
      else if (item.tipo === 'investimento') color = item.value >= 0 ? WATERFALL_COLORS.investimento_pos : WATERFALL_COLORS.investimento_neg;
      else if (item.tipo === 'financiamento') color = item.value >= 0 ? WATERFALL_COLORS.financiamento_pos : WATERFALL_COLORS.financiamento_neg;
      
      return {
        ...item,
        color,
        // Para o waterfall, precisamos calcular a base acumulada
        displayValue: Math.abs(item.value)
      };
    });
  };

  // Componente para linha de detalhe
  const DetalheItem = ({ item }) => (
    <div className="flex justify-between items-center py-2 px-3 hover:bg-zinc-800/30 rounded">
      <span className="text-sm text-gray-300">{item.categoria}</span>
      <div className="flex items-center gap-3">
        <span className="text-xs text-gray-500">{item.quantidade} lanç.</span>
        <span className="text-sm font-medium text-white">
          {formatCurrency(item.valor)}
        </span>
      </div>
    </div>
  );

  // Componente para seção expandível
  const SecaoExpandivel = ({ titulo, total, detalhes, sectionKey, icon: Icon, corPositiva, corNegativa }) => {
    const isExpanded = expandedSections[sectionKey];
    const cor = total >= 0 ? corPositiva : corNegativa;
    
    return (
      <div className="border-b border-zinc-800 last:border-b-0">
        <div 
          className="flex items-center justify-between py-3 px-2 cursor-pointer hover:bg-zinc-800/30 rounded"
          onClick={() => toggleSection(sectionKey)}
        >
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" className="p-0 h-6 w-6">
              {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
            </Button>
            <Icon size={16} className={cor} />
            <span className="text-sm text-gray-300">{titulo}</span>
          </div>
          <span className={`text-sm font-semibold ${cor}`}>
            {formatCurrency(total)}
          </span>
        </div>
        
        {isExpanded && detalhes && detalhes.length > 0 && (
          <div className="ml-8 mb-2 bg-zinc-900/50 rounded-lg">
            {detalhes.map((item, index) => (
              <DetalheItem key={index} item={item} />
            ))}
          </div>
        )}
        
        {isExpanded && (!detalhes || detalhes.length === 0) && (
          <div className="ml-8 mb-2 py-2 text-center text-gray-500 text-sm">
            Nenhum lançamento neste período
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-950 via-zinc-900 to-zinc-950 flex">
      <Sidebar user={user} onLogout={onLogout} />
      
      <main className="flex-1 p-8 ml-0 lg:ml-64 overflow-x-hidden">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              <Banknote className="text-blue-400" />
              DFC — Demonstrativo do Fluxo de Caixa
            </h1>
            <p className="text-gray-400 mt-1">
              Análise das movimentações de caixa por atividade
            </p>
          </div>
          
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={refreshing}
              className="border-zinc-700"
            >
              <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
            </Button>
          </div>
        </div>

        {/* Filtros */}
        <Card className="glass border-white/10 mb-6">
          <CardContent className="p-4">
            <div className="flex flex-wrap items-end gap-4">
              {/* Seletor de Empresa */}
              {companies.length > 1 && (
                <div className="flex-1 min-w-[200px]">
                  <Label className="text-gray-400 text-xs">Empresa</Label>
                  <select
                    value={selectedCompany?.id || ''}
                    onChange={(e) => {
                      const company = companies.find(c => c.id === e.target.value);
                      setSelectedCompany(company);
                    }}
                    className="w-full mt-1 bg-zinc-800 border border-zinc-700 rounded-md px-3 py-2 text-white text-sm"
                  >
                    {companies.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              )}
              
              {/* Período Início */}
              <div>
                <Label className="text-gray-400 text-xs">Início</Label>
                <Input
                  type="date"
                  value={periodoInicio}
                  onChange={(e) => setPeriodoInicio(e.target.value)}
                  className="bg-zinc-800 border-zinc-700 text-white mt-1"
                />
              </div>
              
              {/* Período Fim */}
              <div>
                <Label className="text-gray-400 text-xs">Fim</Label>
                <Input
                  type="date"
                  value={periodoFim}
                  onChange={(e) => setPeriodoFim(e.target.value)}
                  className="bg-zinc-800 border-zinc-700 text-white mt-1"
                />
              </div>
              
              {/* Atalhos de período */}
              <div className="flex gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs border-zinc-700"
                  onClick={() => {
                    const hoje = new Date();
                    const primeiroDia = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
                    const ultimoDia = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0);
                    setPeriodoInicio(primeiroDia.toISOString().split('T')[0]);
                    setPeriodoFim(ultimoDia.toISOString().split('T')[0]);
                  }}
                >
                  Mês
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs border-zinc-700"
                  onClick={() => {
                    const hoje = new Date();
                    const trimestre = Math.floor(hoje.getMonth() / 3);
                    const primeiroDia = new Date(hoje.getFullYear(), trimestre * 3, 1);
                    const ultimoDia = new Date(hoje.getFullYear(), trimestre * 3 + 3, 0);
                    setPeriodoInicio(primeiroDia.toISOString().split('T')[0]);
                    setPeriodoFim(ultimoDia.toISOString().split('T')[0]);
                  }}
                >
                  Trimestre
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs border-zinc-700"
                  onClick={() => {
                    const hoje = new Date();
                    const primeiroDia = new Date(hoje.getFullYear(), 0, 1);
                    const ultimoDia = new Date(hoje.getFullYear(), 11, 31);
                    setPeriodoInicio(primeiroDia.toISOString().split('T')[0]);
                    setPeriodoFim(ultimoDia.toISOString().split('T')[0]);
                  }}
                >
                  Ano
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {loading ? (
          <div className="flex items-center justify-center h-[400px]">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          </div>
        ) : dfcData ? (
          <>
            {/* Alertas */}
            {dfcData.alertas && dfcData.alertas.length > 0 && (
              <div className="space-y-2 mb-6">
                {dfcData.alertas.map((alerta, index) => (
                  <div 
                    key={index}
                    className={`flex items-center gap-2 p-3 rounded-lg ${
                      alerta.tipo === 'danger' ? 'bg-rose-500/20 border border-rose-500/30' :
                      alerta.tipo === 'warning' ? 'bg-amber-500/20 border border-amber-500/30' :
                      'bg-blue-500/20 border border-blue-500/30'
                    }`}
                  >
                    <AlertTriangle size={18} className={
                      alerta.tipo === 'danger' ? 'text-rose-400' :
                      alerta.tipo === 'warning' ? 'text-amber-400' : 'text-blue-400'
                    } />
                    <span className={
                      alerta.tipo === 'danger' ? 'text-rose-300' :
                      alerta.tipo === 'warning' ? 'text-amber-300' : 'text-blue-300'
                    }>
                      {alerta.mensagem}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* Cards de Resumo */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
              {/* Saldo Inicial */}
              <Card className="glass border-white/10">
                <CardContent className="p-4">
                  <p className="text-xs text-gray-400 uppercase tracking-wider">Saldo Inicial</p>
                  <p className="text-xl font-bold text-blue-400 mt-1">
                    {formatCurrency(dfcData.saldo_inicial)}
                  </p>
                </CardContent>
              </Card>

              {/* Operacional */}
              <Card className={`glass border-white/10 ${dfcData.operacional.liquido >= 0 ? 'bg-emerald-900/10' : 'bg-rose-900/10'}`}>
                <CardContent className="p-4">
                  <p className="text-xs text-gray-400 uppercase tracking-wider flex items-center gap-1">
                    <Building2 size={12} /> Operacional
                  </p>
                  <p className={`text-xl font-bold mt-1 ${dfcData.operacional.liquido >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {formatCurrencyWithSign(dfcData.operacional.liquido)}
                  </p>
                </CardContent>
              </Card>

              {/* Investimento */}
              <Card className={`glass border-white/10 ${dfcData.investimento.liquido >= 0 ? 'bg-purple-900/10' : 'bg-orange-900/10'}`}>
                <CardContent className="p-4">
                  <p className="text-xs text-gray-400 uppercase tracking-wider flex items-center gap-1">
                    <PiggyBank size={12} /> Investimento
                  </p>
                  <p className={`text-xl font-bold mt-1 ${dfcData.investimento.liquido >= 0 ? 'text-purple-400' : 'text-orange-400'}`}>
                    {formatCurrencyWithSign(dfcData.investimento.liquido)}
                  </p>
                </CardContent>
              </Card>

              {/* Financiamento */}
              <Card className={`glass border-white/10 ${dfcData.financiamento.liquido >= 0 ? 'bg-cyan-900/10' : 'bg-amber-900/10'}`}>
                <CardContent className="p-4">
                  <p className="text-xs text-gray-400 uppercase tracking-wider flex items-center gap-1">
                    <Wallet size={12} /> Financiamento
                  </p>
                  <p className={`text-xl font-bold mt-1 ${dfcData.financiamento.liquido >= 0 ? 'text-cyan-400' : 'text-amber-400'}`}>
                    {formatCurrencyWithSign(dfcData.financiamento.liquido)}
                  </p>
                </CardContent>
              </Card>

              {/* Variação Líquida */}
              <Card className={`glass border-white/10 ${dfcData.variacao_liquida >= 0 ? 'bg-emerald-900/20' : 'bg-rose-900/20'}`}>
                <CardContent className="p-4">
                  <p className="text-xs text-gray-400 uppercase tracking-wider">Variação</p>
                  <p className={`text-xl font-bold mt-1 ${dfcData.variacao_liquida >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {formatCurrencyWithSign(dfcData.variacao_liquida)}
                  </p>
                </CardContent>
              </Card>

              {/* Saldo Final */}
              <Card className={`glass border-2 ${dfcData.saldo_final >= 0 ? 'border-blue-500/30 bg-blue-900/10' : 'border-rose-500/30 bg-rose-900/10'}`}>
                <CardContent className="p-4">
                  <p className="text-xs text-gray-400 uppercase tracking-wider">Saldo Final</p>
                  <p className={`text-xl font-bold mt-1 ${dfcData.saldo_final >= 0 ? 'text-blue-400' : 'text-rose-400'}`}>
                    {formatCurrency(dfcData.saldo_final)}
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Gráfico Waterfall + Tabela */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              {/* Gráfico Waterfall */}
              <Card className="glass border-white/10">
                <CardHeader>
                  <CardTitle className="text-base font-medium text-gray-200">
                    Gráfico em Cascata (Waterfall)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={350}>
                    <BarChart data={prepareWaterfallData()} margin={{ top: 20, right: 20, left: 20, bottom: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis 
                        dataKey="name" 
                        stroke="#9CA3AF" 
                        style={{ fontSize: '11px' }}
                        angle={-15}
                        textAnchor="end"
                        height={60}
                      />
                      <YAxis 
                        stroke="#9CA3AF"
                        style={{ fontSize: '10px' }}
                        tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
                      />
                      <Tooltip content={<WaterfallTooltip />} />
                      <ReferenceLine y={0} stroke="#666" strokeDasharray="3 3" />
                      <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                        {prepareWaterfallData().map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Composição % */}
              <Card className="glass border-white/10">
                <CardHeader>
                  <CardTitle className="text-base font-medium text-gray-200">
                    Composição da Variação
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {dfcData.variacao_liquida !== 0 ? (
                    <div className="space-y-6 pt-4">
                      {/* Operacional */}
                      <div>
                        <div className="flex justify-between mb-2">
                          <span className="text-sm text-gray-400 flex items-center gap-2">
                            <Building2 size={14} className="text-emerald-400" />
                            Operacional
                          </span>
                          <span className={`text-sm font-semibold ${dfcData.operacional.liquido >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                            {((dfcData.operacional.liquido / Math.abs(dfcData.variacao_liquida)) * 100).toFixed(1)}%
                          </span>
                        </div>
                        <div className="h-3 bg-zinc-800 rounded-full overflow-hidden">
                          <div 
                            className={`h-full ${dfcData.operacional.liquido >= 0 ? 'bg-emerald-500' : 'bg-rose-500'}`}
                            style={{ width: `${Math.min(Math.abs(dfcData.operacional.liquido / dfcData.variacao_liquida) * 100, 100)}%` }}
                          />
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          {formatCurrency(dfcData.operacional.liquido)}
                        </p>
                      </div>

                      {/* Investimento */}
                      <div>
                        <div className="flex justify-between mb-2">
                          <span className="text-sm text-gray-400 flex items-center gap-2">
                            <PiggyBank size={14} className="text-purple-400" />
                            Investimento
                          </span>
                          <span className={`text-sm font-semibold ${dfcData.investimento.liquido >= 0 ? 'text-purple-400' : 'text-orange-400'}`}>
                            {((dfcData.investimento.liquido / Math.abs(dfcData.variacao_liquida)) * 100).toFixed(1)}%
                          </span>
                        </div>
                        <div className="h-3 bg-zinc-800 rounded-full overflow-hidden">
                          <div 
                            className={`h-full ${dfcData.investimento.liquido >= 0 ? 'bg-purple-500' : 'bg-orange-500'}`}
                            style={{ width: `${Math.min(Math.abs(dfcData.investimento.liquido / dfcData.variacao_liquida) * 100, 100)}%` }}
                          />
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          {formatCurrency(dfcData.investimento.liquido)}
                        </p>
                      </div>

                      {/* Financiamento */}
                      <div>
                        <div className="flex justify-between mb-2">
                          <span className="text-sm text-gray-400 flex items-center gap-2">
                            <Wallet size={14} className="text-cyan-400" />
                            Financiamento
                          </span>
                          <span className={`text-sm font-semibold ${dfcData.financiamento.liquido >= 0 ? 'text-cyan-400' : 'text-amber-400'}`}>
                            {((dfcData.financiamento.liquido / Math.abs(dfcData.variacao_liquida)) * 100).toFixed(1)}%
                          </span>
                        </div>
                        <div className="h-3 bg-zinc-800 rounded-full overflow-hidden">
                          <div 
                            className={`h-full ${dfcData.financiamento.liquido >= 0 ? 'bg-cyan-500' : 'bg-amber-500'}`}
                            style={{ width: `${Math.min(Math.abs(dfcData.financiamento.liquido / dfcData.variacao_liquida) * 100, 100)}%` }}
                          />
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          {formatCurrency(dfcData.financiamento.liquido)}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="h-[300px] flex items-center justify-center text-gray-500">
                      Sem variação no período
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Tabela Detalhada */}
            <Card className="glass border-white/10">
              <CardHeader>
                <CardTitle className="text-base font-medium text-gray-200 flex items-center gap-2">
                  <FileText size={18} />
                  Detalhamento por Atividade
                  <span className="text-xs text-gray-500 font-normal">(clique para expandir)</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {/* OPERACIONAL */}
                <div className="mb-6">
                  <div className="flex items-center gap-2 mb-3 pb-2 border-b border-zinc-700">
                    <Building2 size={18} className="text-emerald-400" />
                    <h3 className="text-lg font-semibold text-white">Atividades Operacionais</h3>
                    <span className={`ml-auto text-lg font-bold ${dfcData.operacional.liquido >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {formatCurrencyWithSign(dfcData.operacional.liquido)}
                    </span>
                  </div>
                  
                  <SecaoExpandivel
                    titulo="Entradas Operacionais"
                    total={dfcData.operacional.entradas}
                    detalhes={dfcData.operacional.detalhes_entradas}
                    sectionKey="operacional_entradas"
                    icon={ArrowUpRight}
                    corPositiva="text-emerald-400"
                    corNegativa="text-emerald-400"
                  />
                  
                  <SecaoExpandivel
                    titulo="Saídas Operacionais"
                    total={-dfcData.operacional.saidas}
                    detalhes={dfcData.operacional.detalhes_saidas}
                    sectionKey="operacional_saidas"
                    icon={ArrowDownRight}
                    corPositiva="text-rose-400"
                    corNegativa="text-rose-400"
                  />
                </div>

                {/* INVESTIMENTO */}
                <div className="mb-6">
                  <div className="flex items-center gap-2 mb-3 pb-2 border-b border-zinc-700">
                    <PiggyBank size={18} className="text-purple-400" />
                    <h3 className="text-lg font-semibold text-white">Atividades de Investimento</h3>
                    <span className={`ml-auto text-lg font-bold ${dfcData.investimento.liquido >= 0 ? 'text-purple-400' : 'text-orange-400'}`}>
                      {formatCurrencyWithSign(dfcData.investimento.liquido)}
                    </span>
                  </div>
                  
                  <SecaoExpandivel
                    titulo="Entradas de Investimento"
                    total={dfcData.investimento.entradas}
                    detalhes={dfcData.investimento.detalhes_entradas}
                    sectionKey="investimento_entradas"
                    icon={ArrowUpRight}
                    corPositiva="text-purple-400"
                    corNegativa="text-purple-400"
                  />
                  
                  <SecaoExpandivel
                    titulo="Saídas de Investimento"
                    total={-dfcData.investimento.saidas}
                    detalhes={dfcData.investimento.detalhes_saidas}
                    sectionKey="investimento_saidas"
                    icon={ArrowDownRight}
                    corPositiva="text-orange-400"
                    corNegativa="text-orange-400"
                  />
                </div>

                {/* FINANCIAMENTO */}
                <div className="mb-6">
                  <div className="flex items-center gap-2 mb-3 pb-2 border-b border-zinc-700">
                    <Wallet size={18} className="text-cyan-400" />
                    <h3 className="text-lg font-semibold text-white">Atividades de Financiamento</h3>
                    <span className={`ml-auto text-lg font-bold ${dfcData.financiamento.liquido >= 0 ? 'text-cyan-400' : 'text-amber-400'}`}>
                      {formatCurrencyWithSign(dfcData.financiamento.liquido)}
                    </span>
                  </div>
                  
                  <SecaoExpandivel
                    titulo="Entradas de Financiamento"
                    total={dfcData.financiamento.entradas}
                    detalhes={dfcData.financiamento.detalhes_entradas}
                    sectionKey="financiamento_entradas"
                    icon={ArrowUpRight}
                    corPositiva="text-cyan-400"
                    corNegativa="text-cyan-400"
                  />
                  
                  <SecaoExpandivel
                    titulo="Saídas de Financiamento"
                    total={-dfcData.financiamento.saidas}
                    detalhes={dfcData.financiamento.detalhes_saidas}
                    sectionKey="financiamento_saidas"
                    icon={ArrowDownRight}
                    corPositiva="text-amber-400"
                    corNegativa="text-amber-400"
                  />
                </div>

                {/* RESUMO FINAL */}
                <div className="mt-6 pt-4 border-t-2 border-zinc-600">
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center p-4 bg-zinc-800/50 rounded-lg">
                      <p className="text-sm text-gray-400">Saldo Inicial</p>
                      <p className="text-xl font-bold text-blue-400">
                        {formatCurrency(dfcData.saldo_inicial)}
                      </p>
                    </div>
                    <div className="text-center p-4 bg-zinc-800/50 rounded-lg">
                      <p className="text-sm text-gray-400">Variação Líquida</p>
                      <p className={`text-xl font-bold ${dfcData.variacao_liquida >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {formatCurrencyWithSign(dfcData.variacao_liquida)}
                      </p>
                    </div>
                    <div className={`text-center p-4 rounded-lg ${dfcData.saldo_final >= 0 ? 'bg-blue-900/30' : 'bg-rose-900/30'}`}>
                      <p className="text-sm text-gray-400">Saldo Final</p>
                      <p className={`text-xl font-bold ${dfcData.saldo_final >= 0 ? 'text-blue-400' : 'text-rose-400'}`}>
                        {formatCurrency(dfcData.saldo_final)}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        ) : (
          <Card className="glass border-white/10">
            <CardContent className="p-8 text-center">
              <Banknote size={48} className="mx-auto mb-4 text-gray-600" />
              <p className="text-gray-400">Selecione uma empresa e período para visualizar o DFC</p>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
};

export default DFCRelatorio;
