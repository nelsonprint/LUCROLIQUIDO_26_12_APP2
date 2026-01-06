import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { axiosInstance } from '../App';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, Legend, ReferenceLine 
} from 'recharts';
import { 
  TrendingUp, TrendingDown, DollarSign, AlertTriangle, 
  Info, ArrowUpRight, ArrowDownRight, ChevronRight, X
} from 'lucide-react';

// Cores para o gráfico
const CHART_COLORS = {
  receita: '#10B981',      // Verde
  csp: '#F97316',          // Laranja
  despesas: '#EF4444',     // Vermelho
  lucro: '#8B5CF6'         // Roxo
};

// Tooltip customizado
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-zinc-900 border border-purple-500/50 rounded-lg p-4 shadow-lg shadow-purple-500/20">
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

const DREChart = ({ companyId }) => {
  const [dreData, setDreData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [dreDetalhada, setDreDetalhada] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  const fetchDRE = useCallback(async () => {
    if (!companyId) return;
    setLoading(true);
    try {
      const response = await axiosInstance.get(`/dashboard/dre/${companyId}?meses=12`);
      setDreData(response.data);
    } catch (error) {
      console.error('Erro ao carregar DRE:', error);
    } finally {
      setLoading(false);
    }
  }, [companyId]);

  const fetchDREDetalhada = async (mes) => {
    if (!companyId) return;
    setLoadingDetail(true);
    try {
      const response = await axiosInstance.get(`/dashboard/dre/${companyId}/detalhada?mes=${mes}`);
      setDreDetalhada(response.data);
    } catch (error) {
      console.error('Erro ao carregar DRE detalhada:', error);
    } finally {
      setLoadingDetail(false);
    }
  };

  useEffect(() => {
    fetchDRE();
  }, [fetchDRE]);

  const handleVerDetalhada = () => {
    const mesAtual = dreData?.mes_atual?.mes || new Date().toISOString().slice(0, 7);
    setSelectedMonth(mesAtual);
    fetchDREDetalhada(mesAtual);
    setShowDetailModal(true);
  };

  const handleMonthChange = (mes) => {
    setSelectedMonth(mes);
    fetchDREDetalhada(mes);
  };

  // Formatar valor em R$
  const formatCurrency = (value) => {
    if (value === undefined || value === null) return 'R$ 0,00';
    return `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
  };

  // Formatar variação
  const formatVariacao = (valor, percentual) => {
    const isPositive = valor >= 0;
    return (
      <span className={`flex items-center gap-1 text-sm ${isPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
        {isPositive ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
        {formatCurrency(Math.abs(valor))} ({percentual >= 0 ? '+' : ''}{percentual?.toFixed(1)}%)
      </span>
    );
  };

  if (loading) {
    return (
      <Card className="glass border-white/10 hover-lift">
        <CardHeader>
          <CardTitle className="text-lg font-medium text-gray-200 flex items-center gap-2">
            <TrendingUp className="text-emerald-400" size={20} />
            DRE (Serviços)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[400px] flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!dreData || !dreData.mes_atual) {
    return (
      <Card className="glass border-white/10 hover-lift">
        <CardHeader>
          <CardTitle className="text-lg font-medium text-gray-200 flex items-center gap-2">
            <TrendingUp className="text-emerald-400" size={20} />
            DRE (Serviços)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[400px] flex flex-col items-center justify-center text-gray-400">
            <DollarSign size={48} className="mb-4 opacity-30" />
            <p>Nenhum dado de DRE encontrado</p>
            <p className="text-sm mt-2">Registre receitas e despesas para visualizar a DRE</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const { mes_atual, serie_historica, alertas } = dreData;

  return (
    <>
      <Card className="glass border-white/10 hover-lift">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-lg font-medium text-gray-200 flex items-center gap-2">
            <TrendingUp className="text-emerald-400" size={20} />
            DRE (Serviços) - {new Date().toLocaleString('pt-BR', { month: 'long', year: 'numeric' }).replace(/^\w/, c => c.toUpperCase())}
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleVerDetalhada}
            className="text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10"
          >
            Ver DRE detalhada <ChevronRight size={16} />
          </Button>
        </CardHeader>
        <CardContent>
          {/* Alertas */}
          {alertas && alertas.length > 0 && (
            <div className="mb-4 space-y-2">
              {alertas.map((alerta, index) => (
                <div 
                  key={index}
                  className={`flex items-center gap-2 p-2 rounded-lg text-sm ${
                    alerta.tipo === 'danger' ? 'bg-rose-500/20 text-rose-300' :
                    alerta.tipo === 'warning' ? 'bg-amber-500/20 text-amber-300' :
                    'bg-blue-500/20 text-blue-300'
                  }`}
                >
                  {alerta.tipo === 'danger' ? <AlertTriangle size={16} /> : 
                   alerta.tipo === 'warning' ? <AlertTriangle size={16} /> : 
                   <Info size={16} />}
                  {alerta.mensagem}
                </div>
              ))}
            </div>
          )}

          {/* Métricas do Mês Atual */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {/* Receita Líquida */}
            <div className="p-3 rounded-lg bg-gradient-to-br from-emerald-900/30 to-emerald-800/20 border border-emerald-500/30">
              <p className="text-xs text-emerald-400 font-medium uppercase tracking-wider">Receita Líquida</p>
              <p className="text-xl font-bold text-white mt-1">{formatCurrency(mes_atual.receita_liquida)}</p>
              {formatVariacao(mes_atual.variacao_receita, mes_atual.variacao_receita_pct)}
            </div>

            {/* Lucro Líquido */}
            <div className={`p-3 rounded-lg border ${
              mes_atual.lucro_liquido >= 0 
                ? 'bg-gradient-to-br from-purple-900/30 to-purple-800/20 border-purple-500/30' 
                : 'bg-gradient-to-br from-rose-900/30 to-rose-800/20 border-rose-500/30'
            }`}>
              <p className={`text-xs font-medium uppercase tracking-wider ${
                mes_atual.lucro_liquido >= 0 ? 'text-purple-400' : 'text-rose-400'
              }`}>Lucro Líquido</p>
              <p className="text-xl font-bold text-white mt-1">{formatCurrency(mes_atual.lucro_liquido)}</p>
              {formatVariacao(mes_atual.variacao_lucro, mes_atual.variacao_lucro_pct)}
            </div>

            {/* Margem Bruta */}
            <div className="p-3 rounded-lg bg-gradient-to-br from-cyan-900/30 to-cyan-800/20 border border-cyan-500/30">
              <p className="text-xs text-cyan-400 font-medium uppercase tracking-wider">Margem Bruta</p>
              <p className="text-xl font-bold text-white mt-1">{mes_atual.margem_bruta?.toFixed(1)}%</p>
              <p className="text-xs text-gray-400 mt-1">Lucro Bruto / Receita</p>
            </div>

            {/* Margem Líquida */}
            <div className={`p-3 rounded-lg border ${
              mes_atual.margem_liquida >= 10 
                ? 'bg-gradient-to-br from-blue-900/30 to-blue-800/20 border-blue-500/30' 
                : mes_atual.margem_liquida >= 0
                ? 'bg-gradient-to-br from-amber-900/30 to-amber-800/20 border-amber-500/30'
                : 'bg-gradient-to-br from-rose-900/30 to-rose-800/20 border-rose-500/30'
            }`}>
              <p className={`text-xs font-medium uppercase tracking-wider ${
                mes_atual.margem_liquida >= 10 ? 'text-blue-400' : 
                mes_atual.margem_liquida >= 0 ? 'text-amber-400' : 'text-rose-400'
              }`}>Margem Líquida</p>
              <p className="text-xl font-bold text-white mt-1">{mes_atual.margem_liquida?.toFixed(1)}%</p>
              <p className="text-xs text-gray-400 mt-1">Lucro / Receita</p>
            </div>
          </div>

          {/* Indicadores CSP */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            <div className="p-2 rounded-lg bg-zinc-800/50 border border-zinc-700/50 text-center">
              <p className="text-xs text-orange-400">CSP</p>
              <p className="text-lg font-semibold text-white">{mes_atual.csp_percentual?.toFixed(1)}%</p>
            </div>
            <div className="p-2 rounded-lg bg-zinc-800/50 border border-zinc-700/50 text-center">
              <p className="text-xs text-red-400">Desp. Oper.</p>
              <p className="text-lg font-semibold text-white">{formatCurrency(mes_atual.despesas_operacionais)}</p>
            </div>
            <div className="p-2 rounded-lg bg-zinc-800/50 border border-zinc-700/50 text-center">
              <p className="text-xs text-yellow-400">Impostos</p>
              <p className="text-lg font-semibold text-white">{formatCurrency(mes_atual.impostos_sobre_vendas)}</p>
            </div>
          </div>

          {/* Gráfico de Barras Empilhadas */}
          {serie_historica && serie_historica.length > 0 && (
            <div className="mt-4">
              <p className="text-sm text-gray-400 mb-3">Tendência - Últimos 12 Meses</p>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={serie_historica} margin={{ top: 20, right: 20, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis 
                    dataKey="mes" 
                    stroke="#9CA3AF" 
                    style={{ fontSize: '11px' }}
                  />
                  <YAxis 
                    stroke="#9CA3AF"
                    style={{ fontSize: '10px' }}
                    tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend 
                    wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }}
                  />
                  <ReferenceLine y={0} stroke="#666" strokeDasharray="3 3" />
                  <Bar 
                    dataKey="receita_liquida" 
                    name="Receita" 
                    fill={CHART_COLORS.receita}
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar 
                    dataKey="csp" 
                    name="CSP" 
                    fill={CHART_COLORS.csp}
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar 
                    dataKey="despesas_operacionais" 
                    name="Despesas Op." 
                    fill={CHART_COLORS.despesas}
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar 
                    dataKey="lucro_liquido" 
                    name="Lucro" 
                    fill={CHART_COLORS.lucro}
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal DRE Detalhada */}
      <Dialog open={showDetailModal} onOpenChange={setShowDetailModal}>
        <DialogContent className="glass border-white/10 max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <TrendingUp className="text-emerald-400" />
              DRE Detalhada
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              Demonstração do Resultado do Exercício completa
            </DialogDescription>
          </DialogHeader>

          {/* Seletor de Mês */}
          <div className="flex gap-2 flex-wrap mb-4">
            {serie_historica?.slice(-6).map((item) => (
              <Button
                key={item.mes_ref}
                variant={selectedMonth === item.mes_ref ? "default" : "outline"}
                size="sm"
                onClick={() => handleMonthChange(item.mes_ref)}
                className={selectedMonth === item.mes_ref 
                  ? "bg-emerald-600 hover:bg-emerald-700" 
                  : "border-zinc-700 text-gray-300 hover:bg-zinc-800"
                }
              >
                {item.mes}
              </Button>
            ))}
          </div>

          {loadingDetail ? (
            <div className="h-[300px] flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
            </div>
          ) : dreDetalhada ? (
            <div className="space-y-4">
              {/* Tabela DRE */}
              <div className="bg-zinc-900/50 rounded-lg p-4 border border-zinc-800">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-zinc-700">
                      <th className="text-left text-gray-400 py-2 font-medium">Conta</th>
                      <th className="text-right text-gray-400 py-2 font-medium">Valor (R$)</th>
                      <th className="text-right text-gray-400 py-2 font-medium">AV%</th>
                    </tr>
                  </thead>
                  <tbody>
                    {/* Receita Bruta */}
                    <tr className="border-b border-zinc-800">
                      <td className="py-2 text-white font-medium">RECEITA BRUTA</td>
                      <td className="py-2 text-right text-emerald-400 font-semibold">
                        {formatCurrency(dreDetalhada.dre.receita_bruta)}
                      </td>
                      <td className="py-2 text-right text-gray-400">100%</td>
                    </tr>
                    
                    {/* Impostos */}
                    <tr className="border-b border-zinc-800 text-gray-300">
                      <td className="py-2 pl-4">(-) Impostos sobre Vendas</td>
                      <td className="py-2 text-right text-rose-400">
                        ({formatCurrency(dreDetalhada.dre.impostos_sobre_vendas)})
                      </td>
                      <td className="py-2 text-right text-gray-500">
                        {dreDetalhada.aliquota_iss_usada}%
                      </td>
                    </tr>
                    
                    {/* Receita Líquida */}
                    <tr className="border-b border-zinc-700 bg-zinc-800/30">
                      <td className="py-2 text-white font-medium">(=) RECEITA LÍQUIDA</td>
                      <td className="py-2 text-right text-emerald-400 font-semibold">
                        {formatCurrency(dreDetalhada.dre.receita_liquida)}
                      </td>
                      <td className="py-2 text-right text-gray-400">
                        {dreDetalhada.dre.receita_liquida > 0 
                          ? ((dreDetalhada.dre.receita_liquida / dreDetalhada.dre.receita_bruta) * 100).toFixed(1) 
                          : 0}%
                      </td>
                    </tr>
                    
                    {/* CSP */}
                    <tr className="border-b border-zinc-800 text-gray-300">
                      <td className="py-2 pl-4">(-) Custo do Serviço Prestado (CSP)</td>
                      <td className="py-2 text-right text-orange-400">
                        ({formatCurrency(dreDetalhada.dre.csp)})
                      </td>
                      <td className="py-2 text-right text-gray-500">
                        {dreDetalhada.margens.csp_percentual}%
                      </td>
                    </tr>
                    
                    {/* Lucro Bruto */}
                    <tr className="border-b border-zinc-700 bg-zinc-800/30">
                      <td className="py-2 text-white font-medium">(=) LUCRO BRUTO</td>
                      <td className={`py-2 text-right font-semibold ${dreDetalhada.dre.lucro_bruto >= 0 ? 'text-cyan-400' : 'text-rose-400'}`}>
                        {formatCurrency(dreDetalhada.dre.lucro_bruto)}
                      </td>
                      <td className="py-2 text-right text-gray-400">
                        {dreDetalhada.margens.margem_bruta}%
                      </td>
                    </tr>
                    
                    {/* Despesas Comerciais */}
                    <tr className="border-b border-zinc-800 text-gray-300">
                      <td className="py-2 pl-4">(-) Despesas Comerciais</td>
                      <td className="py-2 text-right text-rose-400">
                        ({formatCurrency(dreDetalhada.dre.despesa_comercial)})
                      </td>
                      <td className="py-2 text-right text-gray-500">-</td>
                    </tr>
                    
                    {/* Despesas Administrativas */}
                    <tr className="border-b border-zinc-800 text-gray-300">
                      <td className="py-2 pl-4">(-) Despesas Administrativas</td>
                      <td className="py-2 text-right text-rose-400">
                        ({formatCurrency(dreDetalhada.dre.despesa_administrativa)})
                      </td>
                      <td className="py-2 text-right text-gray-500">-</td>
                    </tr>
                    
                    {/* Resultado Operacional */}
                    <tr className="border-b border-zinc-700 bg-zinc-800/30">
                      <td className="py-2 text-white font-medium">(=) RESULTADO OPERACIONAL (EBIT)</td>
                      <td className={`py-2 text-right font-semibold ${dreDetalhada.dre.resultado_operacional >= 0 ? 'text-blue-400' : 'text-rose-400'}`}>
                        {formatCurrency(dreDetalhada.dre.resultado_operacional)}
                      </td>
                      <td className="py-2 text-right text-gray-400">
                        {dreDetalhada.margens.margem_operacional}%
                      </td>
                    </tr>
                    
                    {/* Resultado Financeiro */}
                    <tr className="border-b border-zinc-800 text-gray-300">
                      <td className="py-2 pl-4">(+/-) Resultado Financeiro</td>
                      <td className={`py-2 text-right ${dreDetalhada.dre.resultado_financeiro >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {formatCurrency(dreDetalhada.dre.resultado_financeiro)}
                      </td>
                      <td className="py-2 text-right text-gray-500">-</td>
                    </tr>
                    
                    {/* Lucro Líquido */}
                    <tr className="bg-gradient-to-r from-purple-900/30 to-transparent">
                      <td className="py-3 text-white font-bold text-lg">(=) LUCRO LÍQUIDO</td>
                      <td className={`py-3 text-right font-bold text-lg ${dreDetalhada.dre.lucro_liquido >= 0 ? 'text-purple-400' : 'text-rose-400'}`}>
                        {formatCurrency(dreDetalhada.dre.lucro_liquido)}
                      </td>
                      <td className="py-3 text-right text-purple-300 font-semibold">
                        {dreDetalhada.margens.margem_liquida}%
                      </td>
                    </tr>
                    
                    {/* Não Classificado (se houver) */}
                    {dreDetalhada.dre.nao_classificado > 0 && (
                      <tr className="border-t border-amber-500/30 bg-amber-500/10">
                        <td className="py-2 text-amber-400 flex items-center gap-2">
                          <AlertTriangle size={16} />
                          Lançamentos Não Classificados
                        </td>
                        <td className="py-2 text-right text-amber-400">
                          {formatCurrency(dreDetalhada.dre.nao_classificado)}
                        </td>
                        <td className="py-2 text-right text-amber-400/70">-</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Detalhamento por Categoria */}
              {dreDetalhada.detalhamento && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Receitas */}
                  {dreDetalhada.detalhamento.receitas?.length > 0 && (
                    <div className="bg-emerald-900/20 rounded-lg p-3 border border-emerald-500/30">
                      <h4 className="text-emerald-400 font-medium mb-2 text-sm">📈 Receitas por Categoria</h4>
                      <ul className="space-y-1">
                        {dreDetalhada.detalhamento.receitas.slice(0, 5).map((item, i) => (
                          <li key={i} className="flex justify-between text-xs">
                            <span className="text-gray-300">{item.categoria}</span>
                            <span className="text-emerald-400">{formatCurrency(item.valor)}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* CSP */}
                  {dreDetalhada.detalhamento.csp?.length > 0 && (
                    <div className="bg-orange-900/20 rounded-lg p-3 border border-orange-500/30">
                      <h4 className="text-orange-400 font-medium mb-2 text-sm">🔧 CSP por Categoria</h4>
                      <ul className="space-y-1">
                        {dreDetalhada.detalhamento.csp.slice(0, 5).map((item, i) => (
                          <li key={i} className="flex justify-between text-xs">
                            <span className="text-gray-300">{item.categoria}</span>
                            <span className="text-orange-400">{formatCurrency(item.valor)}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Despesas Administrativas */}
                  {dreDetalhada.detalhamento.despesas_administrativas?.length > 0 && (
                    <div className="bg-rose-900/20 rounded-lg p-3 border border-rose-500/30">
                      <h4 className="text-rose-400 font-medium mb-2 text-sm">🏢 Despesas Administrativas</h4>
                      <ul className="space-y-1">
                        {dreDetalhada.detalhamento.despesas_administrativas.slice(0, 5).map((item, i) => (
                          <li key={i} className="flex justify-between text-xs">
                            <span className="text-gray-300">{item.categoria}</span>
                            <span className="text-rose-400">{formatCurrency(item.valor)}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Não Classificados */}
                  {dreDetalhada.detalhamento.nao_classificado?.length > 0 && (
                    <div className="bg-amber-900/20 rounded-lg p-3 border border-amber-500/30">
                      <h4 className="text-amber-400 font-medium mb-2 text-sm">⚠️ Não Classificados</h4>
                      <ul className="space-y-1">
                        {dreDetalhada.detalhamento.nao_classificado.slice(0, 5).map((item, i) => (
                          <li key={i} className="flex justify-between text-xs">
                            <span className="text-gray-300">{item.categoria}</span>
                            <span className="text-amber-400">{formatCurrency(item.valor)}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default DREChart;
