import React, { useState, useEffect } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { SubscriptionCard } from '@/components/SubscriptionCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { axiosInstance } from '../App';
import { toast } from 'sonner';
import { TrendingUp, DollarSign, AlertCircle, Target, BarChart, Settings } from 'lucide-react';
import { BarChart as RechartsBarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend, LabelList, LineChart, Line, AreaChart, Area, ReferenceLine } from 'recharts';
import MarkupConfigModal from '@/components/MarkupConfigModal';
import MarkupDonutChart from '@/components/MarkupDonutChart';

const Dashboard = ({ user, onLogout }) => {
  const [showCompanyModal, setShowCompanyModal] = useState(false);
  const [showMarkupModal, setShowMarkupModal] = useState(false);
  const [companies, setCompanies] = useState([]);
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [companyData, setCompanyData] = useState({ name: '', segment: '' });
  const [metrics, setMetrics] = useState(null);
  const [goal, setGoal] = useState(null);
  const [loading, setLoading] = useState(false);
  const [chartData, setChartData] = useState([]);
  const [contasResumo, setContasResumo] = useState(null);
  const [fluxoCaixaData, setFluxoCaixaData] = useState([]);
  const [contasPagarPorCategoria, setContasPagarPorCategoria] = useState([]);
  const [contasReceberPorCliente, setContasReceberPorCliente] = useState([]);
  const [markupRefreshKey, setMarkupRefreshKey] = useState(0);
  // Estado para Lucro Líquido do Mês
  const [lucroMesAtual, setLucroMesAtual] = useState({ receitas: 0, despesas: 0, lucro: 0 });

  useEffect(() => {
    fetchCompanies();
  }, []);

  useEffect(() => {
    if (selectedCompany) {
      fetchMetrics();
      fetchGoal();
      generateChartData();
      fetchContasResumo();
      fetchFluxoCaixa();
      fetchContasPagarPorCategoria();
      fetchContasReceberPorCliente();
    }
  }, [selectedCompany]);

  const fetchCompanies = async () => {
    try {
      const response = await axiosInstance.get(`/companies/${(user?.id || user?.user_id)}`);
      const companiesList = response.data;
      
      if (companiesList.length > 0) {
        const stored = localStorage.getItem('company');
        if (stored) {
          const storedCompany = JSON.parse(stored);
          const exists = companiesList.find(c => c.id === storedCompany.id);
          setSelectedCompany(exists || companiesList[0]);
        } else {
          setSelectedCompany(companiesList[0]);
          localStorage.setItem('company', JSON.stringify(companiesList[0]));
        }
      } else {
        setShowCompanyModal(true);
      }
      
      setCompanies(companiesList);
    } catch (error) {
      toast.error('Erro ao carregar empresas');
    }
  };

  const createCompany = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await axiosInstance.post('/companies', {
        user_id: (user?.id || user?.user_id),
        ...companyData,
      });
      toast.success('Empresa criada com sucesso!');
      setShowCompanyModal(false);
      fetchCompanies();
    } catch (error) {
      toast.error('Erro ao criar empresa');
    } finally {
      setLoading(false);
    }
  };

  const fetchMetrics = async () => {
    if (!selectedCompany) return;

    try {
      const currentMonth = new Date().toISOString().slice(0, 7);
      const response = await axiosInstance.get(`/metrics/${selectedCompany.id}/${currentMonth}`);
      setMetrics(response.data);
    } catch (error) {
      console.error('Erro ao buscar métricas:', error);
    }
  };

  const fetchGoal = async () => {
    if (!selectedCompany) return;

    try {
      const currentMonth = new Date().toISOString().slice(0, 7);
      const response = await axiosInstance.get(`/monthly-goal/${selectedCompany.id}/${currentMonth}`);
      setGoal(response.data);
    } catch (error) {
      console.error('Erro ao buscar meta:', error);
    }
  };

  const generateChartData = async () => {
    if (!selectedCompany) return;

    try {
      // Buscar dados dos últimos 6 meses
      const data = [];
      const now = new Date();
      
      for (let i = 5; i >= 0; i--) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const month = date.toISOString().slice(0, 7);
        const monthLabel = date.toLocaleDateString('pt-BR', { month: 'short' });
        
        const response = await axiosInstance.get(`/metrics/${selectedCompany.id}/${month}`);
        
        data.push({
          month: monthLabel,
          faturamento: response.data.faturamento,
          lucro: response.data.lucro_liquido,
        });
      }
      
      setChartData(data);
    } catch (error) {
      console.error('Erro ao gerar dados do gráfico:', error);
    }
  };

  const getGoalProgress = () => {
    if (!metrics || !goal || goal.goal_amount === 0) return 0;
    return Math.min((metrics.lucro_liquido / goal.goal_amount) * 100, 100);
  };

  // Funções de IA removidas para simplificar o sistema

  // Análise detalhada removida

  const fetchContasResumo = async () => {
    if (!selectedCompany) return;

    try {
      const currentMonth = new Date().toISOString().slice(0, 7);
      const response = await axiosInstance.get(`/contas/resumo-mensal?company_id=${selectedCompany.id}&mes=${currentMonth}`);
      setContasResumo(response.data);
      
      // Calcular lucro líquido do mês atual
      // Usar total de receber e pagar do resumo mensal
      const receitas = response.data?.receber?.total || 0;
      const despesas = response.data?.pagar?.total || 0;
      const lucro = receitas - despesas;
      setLucroMesAtual({ receitas, despesas, lucro });
    } catch (error) {
      console.error('Erro ao buscar resumo de contas:', error);
    }
  };

  const fetchFluxoCaixa = async () => {
    if (!selectedCompany) return;

    try {
      const response = await axiosInstance.get(`/contas/fluxo-caixa-projetado?company_id=${selectedCompany.id}&meses=6`);
      setFluxoCaixaData(response.data);
    } catch (error) {
      console.error('Erro ao buscar fluxo de caixa:', error);
    }
  };

  const fetchContasPagarPorCategoria = async () => {
    if (!selectedCompany) return;

    try {
      const currentMonth = new Date().toISOString().slice(0, 7);
      const response = await axiosInstance.get(`/contas/pagar-por-categoria?company_id=${selectedCompany.id}&mes=${currentMonth}`);
      setContasPagarPorCategoria(response.data);
    } catch (error) {
      console.error('Erro ao buscar contas a pagar por categoria:', error);
    }
  };

  const fetchContasReceberPorCliente = async () => {
    if (!selectedCompany) return;

    try {
      const currentMonth = new Date().toISOString().slice(0, 7);
      const response = await axiosInstance.get(`/contas/receber-por-cliente?company_id=${selectedCompany.id}&mes=${currentMonth}`);
      setContasReceberPorCliente(response.data);
    } catch (error) {
      console.error('Erro ao buscar contas a receber por cliente:', error);
    }
  };

  // Função de análise com IA removida

  return (
    <div className="flex min-h-screen" data-testid="dashboard-page">
      <Sidebar user={user} onLogout={onLogout} />
      
      <div className="flex-1 p-8">
        <SubscriptionCard user={user} />

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2" data-testid="dashboard-title">Dashboard</h1>
          {selectedCompany && (
            <p className="text-gray-400" data-testid="selected-company-name">
              {selectedCompany.name} - {selectedCompany.segment}
            </p>
          )}
        </div>

        {/* Termômetro de Meta */}
        {goal && goal.goal_amount > 0 && metrics && (
          <Card className="glass border-white/10 mb-6" data-testid="goal-thermometer-card">
            <CardHeader>
              <CardTitle className="flex items-center text-white">
                <Target className="mr-2" />
                Termômetro de Meta Mensal
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between text-sm text-gray-400">
                  <span>Lucro Atual: R$ {metrics.lucro_liquido.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                  <span>Meta: R$ {goal.goal_amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-6 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-purple-600 to-blue-600 transition-all duration-500 flex items-center justify-center"
                    style={{ width: `${getGoalProgress()}%` }}
                    data-testid="goal-progress-bar"
                  >
                    <span className="text-xs font-bold text-white">{getGoalProgress().toFixed(1)}%</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* KPIs */}
        {metrics && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card className="glass border-white/10 hover-lift" data-testid="kpi-faturamento">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-400">Faturamento</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-bold text-white">
                      R$ {metrics.faturamento.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                  <DollarSign className="text-green-400" size={32} />
                </div>
              </CardContent>
            </Card>

            <Card className="glass border-white/10 hover-lift" data-testid="kpi-custos">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-400">Custos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-bold text-white">
                      R$ {metrics.custos.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                  <AlertCircle className="text-orange-400" size={32} />
                </div>
              </CardContent>
            </Card>

            <Card className="glass border-white/10 hover-lift" data-testid="kpi-despesas">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-400">Despesas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-bold text-white">
                      R$ {metrics.despesas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                  <AlertCircle className="text-red-400" size={32} />
                </div>
              </CardContent>
            </Card>

            <Card className="glass border-white/10 hover-lift" data-testid="kpi-lucro">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-400">Lucro Líquido</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-bold text-white">
                      R$ {metrics.lucro_liquido.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                  <TrendingUp className="text-purple-400" size={32} />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* KPIs de Contas a Pagar/Receber */}
        {contasResumo && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card className="glass border-white/10 hover-lift border-l-4 border-l-red-500" data-testid="kpi-contas-pagar">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-400">Total a Pagar</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-bold text-red-400">
                      R$ {contasResumo.pagar.pendente.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {contasResumo.pagar.quantidade_total} conta(s) pendente(s)
                    </p>
                  </div>
                  <AlertCircle className="text-red-400" size={32} />
                </div>
              </CardContent>
            </Card>

            <Card className="glass border-white/10 hover-lift border-l-4 border-l-green-500" data-testid="kpi-contas-receber">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-400">Total a Receber</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-bold text-green-400">
                      R$ {contasResumo.receber.pendente.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {contasResumo.receber.quantidade_total} conta(s) pendente(s)
                    </p>
                  </div>
                  <DollarSign className="text-green-400" size={32} />
                </div>
              </CardContent>
            </Card>

            <Card className="glass border-white/10 hover-lift border-l-4 border-l-blue-500" data-testid="kpi-saldo-projetado">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-400">Saldo Projetado</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <p className={`text-2xl font-bold ${contasResumo.saldo_projetado >= 0 ? 'text-blue-400' : 'text-red-400'}`}>
                      R$ {contasResumo.saldo_projetado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {contasResumo.saldo_projetado >= 0 ? 'Positivo' : 'Negativo'}
                    </p>
                  </div>
                  <TrendingUp className={contasResumo.saldo_projetado >= 0 ? 'text-blue-400' : 'text-red-400'} size={32} />
                </div>
              </CardContent>
            </Card>

            <Card className="glass border-white/10 hover-lift border-l-4 border-l-yellow-500" data-testid="kpi-contas-atrasadas">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-400">Contas Atrasadas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-bold text-yellow-400">
                      R$ {contasResumo.contas_atrasadas.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Pagar: R$ {contasResumo.pagar.atrasado.toLocaleString('pt-BR')} | Receber: R$ {contasResumo.receber.atrasado.toLocaleString('pt-BR')}
                    </p>
                  </div>
                  <AlertCircle className="text-yellow-400" size={32} />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Gráficos de Contas a Pagar e Receber */}
        {(fluxoCaixaData.length > 0 || contasPagarPorCategoria.length > 0 || contasReceberPorCliente.length > 0) && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6 mb-6">
            {/* Fluxo de Caixa Simplificado */}
            {fluxoCaixaData.length > 0 && (
              <Card className="glass border-white/10 border-l-4 border-l-blue-500">
                <CardHeader>
                  <CardTitle className="text-white text-base">💰 Fluxo de Caixa Simplificado</CardTitle>
                  <p className="text-xs text-gray-400 mt-1">Entradas vs Saídas - Próximos 6 meses</p>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={350}>
                    <RechartsBarChart data={fluxoCaixaData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis 
                        dataKey="mes" 
                        stroke="#9CA3AF" 
                        style={{ fontSize: '12px', fontWeight: '500' }}
                      />
                      <YAxis 
                        stroke="#9CA3AF" 
                        style={{ fontSize: '12px' }}
                        tickFormatter={(value) => `R$ ${(value / 1000).toFixed(0)}k`}
                      />
                      <Tooltip
                        contentStyle={{ 
                          backgroundColor: '#1F2937', 
                          border: '1px solid #3B82F6',
                          borderRadius: '8px',
                          padding: '12px'
                        }}
                        formatter={(value, name) => {
                          const labels = {
                            'entradas': 'Entradas',
                            'saidas': 'Saídas',
                            'saldo': 'Saldo Projetado'
                          };
                          return [`R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, labels[name] || name];
                        }}
                      />
                      <Legend 
                        wrapperStyle={{ fontSize: '13px', paddingTop: '10px' }}
                        formatter={(value) => {
                          const labels = {
                            'entradas': '💚 Entradas',
                            'saidas': '❌ Saídas',
                            'saldo': '📊 Saldo'
                          };
                          return labels[value] || value;
                        }}
                      />
                      <ReferenceLine y={0} stroke="#666" strokeDasharray="3 3" />
                      <Bar 
                        dataKey="entradas" 
                        fill="#10B981" 
                        name="entradas"
                        radius={[8, 8, 0, 0]}
                      >
                        <LabelList 
                          dataKey="entradas" 
                          position="top" 
                          style={{ fontSize: '10px', fill: '#10B981' }}
                          formatter={(value) => `R$ ${(value / 1000).toFixed(0)}k`}
                        />
                      </Bar>
                      <Bar 
                        dataKey="saidas" 
                        fill="#EF4444" 
                        name="saidas"
                        radius={[8, 8, 0, 0]}
                      >
                        <LabelList 
                          dataKey="saidas" 
                          position="top" 
                          style={{ fontSize: '10px', fill: '#EF4444' }}
                          formatter={(value) => `R$ ${(value / 1000).toFixed(0)}k`}
                        />
                      </Bar>
                      <Line 
                        type="monotone" 
                        dataKey="saldo" 
                        stroke="#3B82F6" 
                        strokeWidth={3}
                        dot={{ fill: '#3B82F6', strokeWidth: 2, r: 6 }}
                        activeDot={{ r: 8 }}
                        name="saldo"
                      />
                    </RechartsBarChart>
                  </ResponsiveContainer>
                  
                  {/* Legenda Explicativa */}
                  <div className="mt-4 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                    <p className="text-xs text-blue-200">
                      <strong>💡 Como interpretar:</strong> As barras verdes mostram o que você vai receber, as vermelhas o que vai pagar. 
                      A linha azul mostra o saldo final de cada mês (positivo = sobra dinheiro, negativo = falta dinheiro).
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Contas a Pagar por Categoria */}
            {contasPagarPorCategoria.length > 0 && (
              <Card className="glass border-white/10 border-l-4 border-l-red-500">
                <CardHeader>
                  <CardTitle className="text-white text-base">Contas a Pagar por Categoria</CardTitle>
                  <p className="text-xs text-gray-400 mt-1">Mês atual</p>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={contasPagarPorCategoria}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        dataKey="valor"
                        label={({ percentual }) => `${percentual}%`}
                        labelLine={false}
                      >
                        {contasPagarPorCategoria.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={['#EF4444', '#F59E0B', '#EC4899', '#8B5CF6', '#06B6D4'][index % 5]} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{ 
                          backgroundColor: '#1F2937', 
                          border: '1px solid #EF4444',
                          borderRadius: '8px',
                          fontSize: '12px'
                        }}
                        formatter={(value) => [`R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 'Valor']}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="mt-4 space-y-2 max-h-[120px] overflow-y-auto">
                    {contasPagarPorCategoria.map((item, index) => (
                      <div key={index} className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: ['#EF4444', '#F59E0B', '#EC4899', '#8B5CF6', '#06B6D4'][index % 5] }}
                          />
                          <span className="text-gray-300 text-xs">{item.categoria}</span>
                        </div>
                        <span className="text-white font-medium text-xs">
                          R$ {(item.valor / 1000).toFixed(1)}k
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Contas a Receber por Cliente */}
            {contasReceberPorCliente.length > 0 && (
              <Card className="glass border-white/10 border-l-4 border-l-green-500">
                <CardHeader>
                  <CardTitle className="text-white text-base">Contas a Receber por Cliente</CardTitle>
                  <p className="text-xs text-gray-400 mt-1">Mês atual</p>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={contasReceberPorCliente}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        dataKey="valor"
                        label={({ percentual }) => `${percentual}%`}
                        labelLine={false}
                      >
                        {contasReceberPorCliente.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={['#10B981', '#3B82F6', '#7C3AED', '#F59E0B', '#EC4899'][index % 5]} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{ 
                          backgroundColor: '#1F2937', 
                          border: '1px solid #10B981',
                          borderRadius: '8px',
                          fontSize: '12px'
                        }}
                        formatter={(value) => [`R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 'Valor']}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="mt-4 space-y-2 max-h-[120px] overflow-y-auto">
                    {contasReceberPorCliente.map((item, index) => (
                      <div key={index} className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: ['#10B981', '#3B82F6', '#7C3AED', '#F59E0B', '#EC4899'][index % 5] }}
                          />
                          <span className="text-gray-300 text-xs">{item.cliente}</span>
                        </div>
                        <span className="text-white font-medium text-xs">
                          R$ {(item.valor / 1000).toFixed(1)}k
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Gráfico de Evolução */}
        <Card className="glass border-white/10" data-testid="evolution-chart-card">
          <CardHeader>
            <CardTitle className="flex items-center text-white">
              <BarChart className="mr-2" />
              Evolução (6 meses)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={400}>
              <RechartsBarChart data={chartData} barSize={60} margin={{ top: 30, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis 
                  dataKey="month" 
                  stroke="#9CA3AF" 
                  style={{ fontSize: '14px', fontWeight: 500 }}
                />
                <YAxis 
                  stroke="#9CA3AF"
                  style={{ fontSize: '12px' }}
                  tickFormatter={(value) => `R$ ${(value / 1000).toFixed(0)}k`}
                />
                <Tooltip
                  contentStyle={{ 
                    backgroundColor: '#1F2937', 
                    border: '1px solid #7C3AED',
                    borderRadius: '8px',
                    padding: '12px'
                  }}
                  labelStyle={{ color: '#F3F4F6', fontWeight: 'bold', marginBottom: '8px' }}
                  formatter={(value) => [`R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, '']}
                />
                <Bar 
                  dataKey="faturamento" 
                  fill="#7C3AED" 
                  name="Faturamento"
                  radius={[8, 8, 0, 0]}
                >
                  <LabelList 
                    dataKey="faturamento" 
                    position="top" 
                    style={{ fill: '#fff', fontSize: '12px', fontWeight: 'bold' }}
                    formatter={(value) => `R$ ${(value / 1000).toFixed(1)}k`}
                  />
                </Bar>
                <Bar 
                  dataKey="lucro" 
                  fill="#3B82F6" 
                  name="Lucro Líquido"
                  radius={[8, 8, 0, 0]}
                >
                  <LabelList 
                    dataKey="lucro" 
                    position="top" 
                    style={{ fill: '#fff', fontSize: '12px', fontWeight: 'bold' }}
                    formatter={(value) => `R$ ${(value / 1000).toFixed(1)}k`}
                  />
                </Bar>
              </RechartsBarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Score de Saúde Financeira removido para simplificar */}

        {/* Gráfico de Markup/BDI e Lucro Líquido do Mês */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
          <MarkupDonutChart 
            key={markupRefreshKey}
            companyId={selectedCompany?.id} 
            onConfigClick={() => setShowMarkupModal(true)} 
          />
          
          {/* Gráfico de Lucro Líquido do Mês Atual */}
          <Card className="glass border-white/10 border-l-4 border-l-cyan-500 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 via-transparent to-purple-500/5" />
            <CardHeader className="relative z-10">
              <CardTitle className="text-white text-lg flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-cyan-400" />
                CRO do Mês Atual
              </CardTitle>
              <p className="text-xs text-gray-400 mt-1">
                {new Date().toLocaleString('pt-BR', { month: 'long', year: 'numeric' }).replace(/^\w/, c => c.toUpperCase())}
              </p>
            </CardHeader>
            <CardContent className="relative z-10">
              {lucroMesAtual && (
                <>
                  <ResponsiveContainer width="100%" height={220}>
                    <PieChart>
                      <defs>
                        <linearGradient id="lucroGradient" x1="0" y1="0" x2="1" y2="1">
                          <stop offset="0%" stopColor="#00FFFF" />
                          <stop offset="100%" stopColor="#7C3AED" />
                        </linearGradient>
                        <linearGradient id="despesaGradient" x1="0" y1="0" x2="1" y2="1">
                          <stop offset="0%" stopColor="#FF6B6B" />
                          <stop offset="100%" stopColor="#FF8E53" />
                        </linearGradient>
                        <filter id="glow">
                          <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                          <feMerge>
                            <feMergeNode in="coloredBlur"/>
                            <feMergeNode in="SourceGraphic"/>
                          </feMerge>
                        </filter>
                      </defs>
                      <Pie
                        data={[
                          { name: 'Receitas', value: lucroMesAtual.receitas, color: 'url(#lucroGradient)' },
                          { name: 'Despesas', value: lucroMesAtual.despesas, color: 'url(#despesaGradient)' }
                        ]}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={85}
                        paddingAngle={3}
                        dataKey="value"
                        stroke="none"
                        filter="url(#glow)"
                      >
                        <Cell fill="url(#lucroGradient)" />
                        <Cell fill="url(#despesaGradient)" />
                      </Pie>
                      <Tooltip
                        contentStyle={{ 
                          backgroundColor: '#1F2937', 
                          border: '1px solid #00FFFF',
                          borderRadius: '12px',
                          fontSize: '12px',
                          boxShadow: '0 0 20px rgba(0,255,255,0.3)'
                        }}
                        formatter={(value) => [`R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, '']}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  
                  {/* Centro do Donut - Lucro Líquido */}
                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center mt-3">
                    <p className="text-xs text-gray-400 uppercase tracking-wider">Lucro Líquido</p>
                    <p className={`text-2xl font-bold ${lucroMesAtual.lucro >= 0 ? 'text-cyan-400' : 'text-red-400'}`}
                       style={{ textShadow: lucroMesAtual.lucro >= 0 ? '0 0 10px rgba(0,255,255,0.5)' : '0 0 10px rgba(255,107,107,0.5)' }}>
                      R$ {Math.abs(lucroMesAtual.lucro).toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                    </p>
                    {lucroMesAtual.lucro < 0 && <p className="text-xs text-red-400">Prejuízo</p>}
                  </div>

                  {/* Legenda */}
                  <div className="mt-4 space-y-3">
                    <div className="flex items-center justify-between p-2 rounded-lg bg-cyan-500/10 border border-cyan-500/30">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-gradient-to-r from-cyan-400 to-purple-500" 
                             style={{ boxShadow: '0 0 8px rgba(0,255,255,0.6)' }} />
                        <span className="text-gray-300 text-sm">Receitas</span>
                      </div>
                      <span className="text-cyan-400 font-semibold text-sm" style={{ textShadow: '0 0 5px rgba(0,255,255,0.4)' }}>
                        R$ {lucroMesAtual.receitas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                    <div className="flex items-center justify-between p-2 rounded-lg bg-red-500/10 border border-red-500/30">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-gradient-to-r from-red-400 to-orange-400" 
                             style={{ boxShadow: '0 0 8px rgba(255,107,107,0.6)' }} />
                        <span className="text-gray-300 text-sm">Despesas</span>
                      </div>
                      <span className="text-red-400 font-semibold text-sm" style={{ textShadow: '0 0 5px rgba(255,107,107,0.4)' }}>
                        R$ {lucroMesAtual.despesas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                    {/* Margem de Lucro */}
                    {lucroMesAtual.receitas > 0 && (
                      <div className="flex items-center justify-between p-2 rounded-lg bg-purple-500/10 border border-purple-500/30">
                        <span className="text-gray-300 text-sm">Margem de Lucro</span>
                        <span className={`font-bold text-sm ${lucroMesAtual.lucro >= 0 ? 'text-purple-400' : 'text-red-400'}`}
                              style={{ textShadow: '0 0 5px rgba(124,58,237,0.4)' }}>
                          {((lucroMesAtual.lucro / lucroMesAtual.receitas) * 100).toFixed(1)}%
                        </span>
                      </div>
                    )}
                  </div>
                </>
              )}
              {(!lucroMesAtual || (lucroMesAtual.receitas === 0 && lucroMesAtual.despesas === 0)) && (
                <div className="flex flex-col items-center justify-center h-[300px] text-gray-400">
                  <DollarSign className="w-12 h-12 mb-2 opacity-50" />
                  <p className="text-sm">Sem dados para o mês atual</p>
                  <p className="text-xs mt-1">Cadastre receitas e despesas</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Análise Detalhada e Alertas removidos para simplificar */}

        {/* Modal Criar Empresa */}
        <Dialog open={showCompanyModal} onOpenChange={setShowCompanyModal}>
          <DialogContent className="glass border-white/10" data-testid="create-company-dialog">
            <DialogHeader>
              <DialogTitle className="text-white">Criar Empresa</DialogTitle>
              <DialogDescription className="text-gray-400">
                Para começar, crie sua primeira empresa
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={createCompany} className="space-y-4" data-testid="create-company-form">
              <div>
                <Label htmlFor="company-name" className="text-gray-300">Nome da Empresa</Label>
                <Input
                  id="company-name"
                  data-testid="company-name-input"
                  value={companyData.name}
                  onChange={(e) => setCompanyData({ ...companyData, name: e.target.value })}
                  required
                  className="bg-white/5 border-white/10 text-white"
                />
              </div>
              <div>
                <Label htmlFor="company-segment" className="text-gray-300">Segmento</Label>
                <Input
                  id="company-segment"
                  data-testid="company-segment-input"
                  value={companyData.segment}
                  onChange={(e) => setCompanyData({ ...companyData, segment: e.target.value })}
                  required
                  className="bg-white/5 border-white/10 text-white"
                />
              </div>
              <Button
                type="submit"
                data-testid="create-company-submit-button"
                disabled={loading}
                className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
              >
                {loading ? 'Criando...' : 'Criar Empresa'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>

        {/* Modal Análise IA */}
        {/* Modal de Análise IA removido */}

        {/* Modal de Configuração de Markup */}
        <MarkupConfigModal
          open={showMarkupModal}
          onClose={() => setShowMarkupModal(false)}
          companyId={selectedCompany?.id}
          onSave={() => {
            setShowMarkupModal(false);
            setMarkupRefreshKey(prev => prev + 1);
          }}
        />

      </div>
      
      {/* Glossário Financeiro removido */}
    </div>
  );
};

export default Dashboard;