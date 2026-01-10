import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { axiosInstance } from '../App';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  ReferenceLine, ComposedChart, Line, Bar
} from 'recharts';
import { Navigation, TrendingUp, TrendingDown, Target, AlertTriangle, CheckCircle, Clock, DollarSign } from 'lucide-react';

const GPSFinanceiro = ({ companyId }) => {
  const [dados, setDados] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (companyId) {
      fetchDados();
    }
  }, [companyId]);

  const fetchDados = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get(`/gps-financeiro/${companyId}`);
      setDados(response.data);
    } catch (error) {
      console.error('Erro ao carregar GPS Financeiro:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card className="glass border-white/10 mb-6">
        <CardContent className="p-6">
          <div className="flex items-center justify-center h-64">
            <div className="animate-pulse text-gray-400">Carregando GPS Financeiro...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!dados || dados.custos_fixos.total === 0) {
    return (
      <Card className="glass border-white/10 mb-6 bg-gradient-to-r from-slate-900/50 to-slate-800/50">
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-4 rounded-full bg-purple-500/20">
              <Navigation className="text-purple-400" size={32} />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white mb-1">GPS Financeiro</h3>
              <p className="text-gray-400">
                Configure seus <strong className="text-purple-400">Custos Fixos</strong> e <strong className="text-orange-400">Custos Variáveis</strong> no menu Contas para ativar o GPS Financeiro.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Definir cores e status
  const getStatusConfig = () => {
    if (dados.status_breakeven === 'acima') {
      return {
        cor: 'emerald',
        icon: CheckCircle,
        texto: 'Acima do Equilíbrio',
        gradiente: 'from-emerald-900/30 to-cyan-900/30',
        borda: 'border-emerald-500/50',
        glow: '0 0 30px rgba(16, 185, 129, 0.3)'
      };
    } else if (dados.status_breakeven === 'proximo') {
      return {
        cor: 'yellow',
        icon: Target,
        texto: 'Próximo do Equilíbrio',
        gradiente: 'from-yellow-900/30 to-orange-900/30',
        borda: 'border-yellow-500/50',
        glow: '0 0 30px rgba(234, 179, 8, 0.3)'
      };
    } else {
      return {
        cor: 'red',
        icon: AlertTriangle,
        texto: 'Abaixo do Equilíbrio',
        gradiente: 'from-red-900/30 to-orange-900/30',
        borda: 'border-red-500/50',
        glow: '0 0 30px rgba(239, 68, 68, 0.3)'
      };
    }
  };

  const config = getStatusConfig();
  const StatusIcon = config.icon;

  // Preparar dados do gráfico
  const dadosGrafico = dados.grafico.map(d => ({
    ...d,
    dia: `${d.dia}`,
  }));

  // Mensagem inteligente
  const getMensagemInteligente = () => {
    if (dados.distancia_breakeven >= 0) {
      return `Você está R$ ${Math.abs(dados.distancia_breakeven).toLocaleString('pt-BR', { minimumFractionDigits: 2 })} acima do custo de existência! 🎉`;
    } else {
      if (dados.dias_para_breakeven && dados.dias_para_breakeven <= dados.dias_restantes) {
        return `No ritmo atual, o equilíbrio será atingido em ${dados.dias_para_breakeven} dia(s).`;
      } else if (dados.dias_restantes > 0) {
        return `Para empatar o mês, você precisa faturar R$ ${dados.receita_diaria_necessaria.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} por dia até o final.`;
      } else {
        return `Faltam R$ ${Math.abs(dados.distancia_breakeven).toLocaleString('pt-BR', { minimumFractionDigits: 2 })} para atingir o ponto de equilíbrio.`;
      }
    }
  };

  // Custom Tooltip para o gráfico
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-900 border border-white/20 rounded-lg p-3 shadow-xl">
          <p className="text-white font-semibold mb-2">Dia {label}</p>
          {payload.map((entry, index) => (
            <p key={index} style={{ color: entry.color }} className="text-sm">
              {entry.name}: R$ {entry.value?.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) || '-'}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <Card 
      className={`glass ${config.borda} mb-6 bg-gradient-to-r ${config.gradiente} overflow-hidden relative`}
      style={{ boxShadow: config.glow }}
    >
      {/* Efeito de fundo */}
      <div className="absolute inset-0 bg-gradient-to-br from-transparent via-white/5 to-transparent pointer-events-none" />
      
      <CardContent className="p-6 relative z-10">
        {/* Header do GPS */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 mb-6">
          {/* Título e Status */}
          <div className="flex items-center gap-4">
            <div className={`p-4 rounded-xl bg-${config.cor}-500/20 border border-${config.cor}-500/30`}
                 style={{ boxShadow: `0 0 20px rgba(var(--${config.cor}-rgb), 0.3)` }}>
              <Navigation className={`text-${config.cor}-400`} size={32} />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-white flex items-center gap-2">
                GPS Financeiro
                <span className={`text-sm font-normal px-3 py-1 rounded-full bg-${config.cor}-500/20 text-${config.cor}-400 border border-${config.cor}-500/30`}>
                  {config.texto}
                </span>
              </h3>
              <p className="text-gray-400 text-sm">
                Break-even Mensal • {new Date().toLocaleString('pt-BR', { month: 'long' }).replace(/^\w/, c => c.toUpperCase())} / {new Date().getFullYear()}
              </p>
            </div>
          </div>

          {/* Indicador Principal */}
          <div className="flex items-center gap-6">
            {/* Progresso Circular */}
            <div className="relative w-24 h-24">
              <svg className="w-full h-full transform -rotate-90">
                <circle
                  cx="48"
                  cy="48"
                  r="40"
                  fill="none"
                  stroke="rgba(255,255,255,0.1)"
                  strokeWidth="8"
                />
                <circle
                  cx="48"
                  cy="48"
                  r="40"
                  fill="none"
                  stroke={dados.percentual_breakeven_coberto >= 100 ? '#10B981' : dados.percentual_breakeven_coberto >= 90 ? '#EAB308' : '#EF4444'}
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeDasharray={`${Math.min(dados.percentual_breakeven_coberto, 100) * 2.51} 251`}
                  style={{ filter: `drop-shadow(0 0 8px ${dados.percentual_breakeven_coberto >= 100 ? '#10B981' : dados.percentual_breakeven_coberto >= 90 ? '#EAB308' : '#EF4444'})` }}
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className={`text-xl font-bold ${dados.percentual_breakeven_coberto >= 100 ? 'text-emerald-400' : dados.percentual_breakeven_coberto >= 90 ? 'text-yellow-400' : 'text-red-400'}`}>
                  {Math.min(dados.percentual_breakeven_coberto, 999).toFixed(0)}%
                </span>
              </div>
            </div>

            {/* Valores */}
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-purple-500" />
                <span className="text-gray-400 text-sm">Break-even:</span>
                <span className="text-white font-bold">R$ {dados.breakeven_faturamento.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-emerald-500" />
                <span className="text-gray-400 text-sm">Realizado:</span>
                <span className="text-emerald-400 font-bold">R$ {dados.receita_realizada.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-cyan-500" />
                <span className="text-gray-400 text-sm">Previsto:</span>
                <span className="text-cyan-400 font-bold">R$ {dados.receita_prevista.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Gráfico Principal */}
        <div className="mb-6">
          <ResponsiveContainer width="100%" height={250}>
            <ComposedChart data={dadosGrafico}>
              <defs>
                <linearGradient id="colorReceita" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10B981" stopOpacity={0.4}/>
                  <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorProjecao" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#06B6D4" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#06B6D4" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis 
                dataKey="dia" 
                stroke="#9CA3AF" 
                fontSize={12}
                tickLine={false}
              />
              <YAxis 
                stroke="#9CA3AF" 
                fontSize={12}
                tickFormatter={(value) => `R$ ${(value / 1000).toFixed(0)}k`}
                tickLine={false}
              />
              <Tooltip content={<CustomTooltip />} />
              
              {/* Área de Break-even (meta) */}
              <Area
                type="monotone"
                dataKey="breakeven_acumulado"
                name="Meta Break-even"
                stroke="#A855F7"
                strokeWidth={2}
                fill="url(#colorProjecao)"
                strokeDasharray="5 5"
              />
              
              {/* Área de Receita Realizada */}
              <Area
                type="monotone"
                dataKey="receita_acumulada"
                name="Receita Realizada"
                stroke="#10B981"
                strokeWidth={3}
                fill="url(#colorReceita)"
              />
              
              {/* Linha de Projeção (dias futuros) */}
              <Line
                type="monotone"
                dataKey="projecao_acumulada"
                name="Projeção"
                stroke="#06B6D4"
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={false}
              />

              {/* Linha de referência do Break-even total */}
              <ReferenceLine 
                y={dados.breakeven_faturamento} 
                stroke="#A855F7" 
                strokeWidth={2}
                strokeDasharray="10 5"
                label={{ 
                  value: `Break-even: R$ ${(dados.breakeven_faturamento / 1000).toFixed(1)}k`, 
                  fill: '#A855F7', 
                  fontSize: 12,
                  position: 'insideTopRight'
                }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        {/* Cards de Indicadores */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          {/* Distância até Break-even */}
          <div className={`p-4 rounded-xl ${dados.distancia_breakeven >= 0 ? 'bg-emerald-500/10 border border-emerald-500/30' : 'bg-red-500/10 border border-red-500/30'}`}>
            <div className="flex items-center gap-2 mb-1">
              {dados.distancia_breakeven >= 0 ? (
                <TrendingUp className="text-emerald-400" size={18} />
              ) : (
                <TrendingDown className="text-red-400" size={18} />
              )}
              <span className="text-gray-400 text-xs">Distância</span>
            </div>
            <p className={`text-xl font-bold ${dados.distancia_breakeven >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              {dados.distancia_breakeven >= 0 ? '+' : '-'}R$ {Math.abs(dados.distancia_breakeven).toLocaleString('pt-BR', { minimumFractionDigits: 0 })}
            </p>
          </div>

          {/* Média Diária */}
          <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/30">
            <div className="flex items-center gap-2 mb-1">
              <DollarSign className="text-blue-400" size={18} />
              <span className="text-gray-400 text-xs">Média/Dia</span>
            </div>
            <p className="text-xl font-bold text-blue-400">
              R$ {dados.media_diaria_atual.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}
            </p>
          </div>

          {/* Necessário por Dia */}
          <div className="p-4 rounded-xl bg-orange-500/10 border border-orange-500/30">
            <div className="flex items-center gap-2 mb-1">
              <Target className="text-orange-400" size={18} />
              <span className="text-gray-400 text-xs">Necessário/Dia</span>
            </div>
            <p className="text-xl font-bold text-orange-400">
              R$ {dados.receita_diaria_necessaria.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}
            </p>
          </div>

          {/* Dias Restantes */}
          <div className="p-4 rounded-xl bg-purple-500/10 border border-purple-500/30">
            <div className="flex items-center gap-2 mb-1">
              <Clock className="text-purple-400" size={18} />
              <span className="text-gray-400 text-xs">Dias Restantes</span>
            </div>
            <p className="text-xl font-bold text-purple-400">
              {dados.dias_restantes} dias
            </p>
          </div>
        </div>

        {/* Mensagem Inteligente */}
        <div className={`p-4 rounded-xl ${dados.distancia_breakeven >= 0 ? 'bg-emerald-500/10 border border-emerald-500/30' : 'bg-slate-800/50 border border-white/10'}`}>
          <div className="flex items-center gap-3">
            <StatusIcon className={`text-${config.cor}-400`} size={24} />
            <p className="text-white font-medium">
              {getMensagemInteligente()}
            </p>
          </div>
          
          {/* Detalhes da Estrutura de Custos */}
          <div className="mt-3 pt-3 border-t border-white/10 flex flex-wrap gap-4 text-sm">
            <div>
              <span className="text-gray-500">Custos Fixos:</span>
              <span className="text-white ml-1">R$ {dados.custos_fixos.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
            </div>
            <div>
              <span className="text-gray-500">Custos Variáveis:</span>
              <span className="text-orange-400 ml-1">{dados.custos_variaveis.total_percentual.toFixed(1)}%</span>
            </div>
            <div>
              <span className="text-gray-500">Margem Contribuição:</span>
              <span className="text-emerald-400 ml-1">{dados.margem_contribuicao.toFixed(1)}%</span>
            </div>
            <div>
              <span className="text-gray-500">Projeção do Mês:</span>
              <span className={`ml-1 ${dados.atingira_breakeven ? 'text-emerald-400' : 'text-red-400'}`}>
                R$ {dados.projecao_mes.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                {dados.atingira_breakeven ? ' ✓' : ' ✗'}
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default GPSFinanceiro;
