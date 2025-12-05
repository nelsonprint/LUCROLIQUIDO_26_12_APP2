import React, { useState, useEffect } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { SubscriptionCard } from '@/components/SubscriptionCard';
import FinancialGlossary from '@/components/FinancialGlossary';
import { IntelligentAnalysis } from '@/components/IntelligentAnalysis';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { axiosInstance } from '../App';
import { toast } from 'sonner';
import { TrendingUp, DollarSign, AlertCircle, Target, BarChart, Sparkles, AlertTriangle } from 'lucide-react';
import { BarChart as RechartsBarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend, LabelList } from 'recharts';

const Dashboard = ({ user, onLogout }) => {
  const [showCompanyModal, setShowCompanyModal] = useState(false);
  const [companies, setCompanies] = useState([]);
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [companyData, setCompanyData] = useState({ name: '', segment: '' });
  const [metrics, setMetrics] = useState(null);
  const [goal, setGoal] = useState(null);
  const [loading, setLoading] = useState(false);
  const [chartData, setChartData] = useState([]);
  const [analyzingAI, setAnalyzingAI] = useState(false);
  const [showAIAnalysis, setShowAIAnalysis] = useState(false);
  const [aiAnalysisResult, setAiAnalysisResult] = useState('');
  const [costAlerts, setCostAlerts] = useState([]);
  const [detailedAnalysis, setDetailedAnalysis] = useState([]);
  const [showGlossary, setShowGlossary] = useState(false);
  const [contasResumo, setContasResumo] = useState(null);
  const [fluxoCaixaData, setFluxoCaixaData] = useState([]);
  const [contasPagarPorCategoria, setContasPagarPorCategoria] = useState([]);
  const [contasReceberPorCliente, setContasReceberPorCliente] = useState([]);

  useEffect(() => {
    fetchCompanies();
  }, []);

  useEffect(() => {
    if (selectedCompany) {
      fetchMetrics();
      fetchGoal();
      generateChartData();
      fetchCostAlerts();
      fetchDetailedAnalysis();
      fetchContasResumo();
    }
  }, [selectedCompany]);

  const fetchCompanies = async () => {
    try {
      const response = await axiosInstance.get(`/companies/${user.user_id}`);
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
        user_id: user.user_id,
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

  const fetchCostAlerts = async () => {
    if (!selectedCompany) return;

    try {
      const currentMonth = new Date().toISOString().slice(0, 7);
      const response = await axiosInstance.get(`/transactions/${selectedCompany.id}?month=${currentMonth}`);
      const transactions = response.data;

      // Agrupar custos e despesas por categoria
      const categoryTotals = {};
      
      transactions.forEach(t => {
        if (t.type === 'custo' || t.type === 'despesa') {
          if (t.status === 'realizado') {
            if (!categoryTotals[t.category]) {
              categoryTotals[t.category] = { amount: 0, type: t.type };
            }
            categoryTotals[t.category].amount += t.amount;
          }
        }
      });

      // Ordenar por valor e pegar os top 5
      const sortedAlerts = Object.entries(categoryTotals)
        .map(([category, data]) => ({
          category,
          amount: data.amount,
          type: data.type
        }))
        .sort((a, b) => b.amount - a.amount)
        .slice(0, 5);

      setCostAlerts(sortedAlerts);
    } catch (error) {
      console.error('Erro ao buscar alertas:', error);
    }
  };

  const fetchDetailedAnalysis = async () => {
    if (!selectedCompany) return;

    try {
      const currentMonth = new Date().toISOString().slice(0, 7);
      const response = await axiosInstance.get(`/transactions/${selectedCompany.id}?month=${currentMonth}`);
      const transactions = response.data.filter(t => t.status === 'realizado');

      // Calcular totais por categoria
      const categoryData = {};
      
      transactions.forEach(t => {
        if (t.type === 'custo' || t.type === 'despesa') {
          if (!categoryData[t.category]) {
            categoryData[t.category] = {
              name: t.category,
              value: 0,
              type: t.type
            };
          }
          categoryData[t.category].value += t.amount;
        }
      });

      // Calcular total de receitas
      const totalReceitas = transactions
        .filter(t => t.type === 'receita')
        .reduce((sum, t) => sum + t.amount, 0);

      // Converter para array e adicionar percentuais
      const analysis = Object.values(categoryData).map(item => ({
        ...item,
        percentage: totalReceitas > 0 ? ((item.value / totalReceitas) * 100).toFixed(2) : 0
      }));

      setDetailedAnalysis(analysis);
    } catch (error) {
      console.error('Erro ao buscar análise detalhada:', error);
    }
  };

  const fetchContasResumo = async () => {
    if (!selectedCompany) return;

    try {
      const currentMonth = new Date().toISOString().slice(0, 7);
      const response = await axiosInstance.get(`/contas/resumo-mensal?company_id=${selectedCompany.id}&mes=${currentMonth}`);
      setContasResumo(response.data);
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

  const analyzeWithAI = async () => {
    setAnalyzingAI(true);

    try {
      const currentMonth = new Date().toISOString().slice(0, 7);
      const response = await axiosInstance.post('/ai-analysis', {
        company_id: selectedCompany.id,
        month: currentMonth,
      });

      setAiAnalysisResult(response.data.analysis);
      setShowAIAnalysis(true);
      toast.success('Análise gerada com sucesso!');
    } catch (error) {
      toast.error('Erro ao gerar análise');
    } finally {
      setAnalyzingAI(false);
    }
  };

  return (
    <div className="flex min-h-screen" data-testid="dashboard-page">
      <Sidebar user={user} onLogout={onLogout} onOpenGlossary={() => setShowGlossary(true)} />
      
      <div className="flex-1 p-8">
        <SubscriptionCard user={user} />

        {/* Header */}
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2" data-testid="dashboard-title">Dashboard</h1>
            {selectedCompany && (
              <p className="text-gray-400" data-testid="selected-company-name">
                {selectedCompany.name} - {selectedCompany.segment}
              </p>
            )}
          </div>
          {selectedCompany && (
            <Button
              onClick={analyzeWithAI}
              disabled={analyzingAI}
              data-testid="analyze-ai-button"
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
            >
              <Sparkles className="mr-2" size={18} />
              {analyzingAI ? 'Analisando...' : 'Analisar com IA'}
            </Button>
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
                  <AlertTriangle className="text-red-400" size={32} />
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

        {/* Gráfico de Evolução */}
        <Card className="glass border-white/10" data-testid="evolution-chart-card">
          <CardHeader>
            <CardTitle className="flex items-center text-white">
              <BarChart className="mr-2" />
              Evolução (6 meses)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={350}>
              <RechartsBarChart data={chartData} barSize={60}>
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

        {/* Gráficos de Donut - Distribuição Mensal */}
        {chartData.length > 0 && (() => {
          // Filtrar apenas meses com faturamento > 0
          const monthsWithRevenue = chartData.filter(item => item.faturamento > 0);
          const monthsWithProfit = chartData.filter(item => item.lucro > 0);
          
          if (monthsWithRevenue.length === 0 && monthsWithProfit.length === 0) return null;
          
          return (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
              {/* Faturamento */}
              {monthsWithRevenue.length > 0 && (
                <Card className="glass border-white/10" data-testid="monthly-revenue-donut-card">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center">
                      <DollarSign className="mr-2" />
                      Faturamento por Mês
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                <div className="relative">
                  <ResponsiveContainer width="100%" height={400}>
                    <PieChart>
                      <Pie
                        data={monthsWithRevenue.map(item => ({ name: item.month, value: item.faturamento }))}
                        cx="50%"
                        cy="50%"
                        innerRadius={90}
                        outerRadius={130}
                        paddingAngle={monthsWithRevenue.length > 1 ? 3 : 0}
                        dataKey="value"
                        label={({ cx, cy, midAngle, innerRadius, outerRadius, value, name }) => {
                          const RADIAN = Math.PI / 180;
                          const radius = outerRadius + 35;
                          const x = cx + radius * Math.cos(-midAngle * RADIAN);
                          const y = cy + radius * Math.sin(-midAngle * RADIAN);
                          
                          const totalFaturamento = monthsWithRevenue.reduce((sum, item) => sum + item.faturamento, 0);
                          const percentage = ((value / totalFaturamento) * 100).toFixed(1);
                          
                          // Não exibir label se for muito pequeno (< 5%)
                          if (parseFloat(percentage) < 5) return null;
                          
                          return (
                            <text 
                              x={x} 
                              y={y} 
                              fill="white" 
                              textAnchor={x > cx ? 'start' : 'end'} 
                              dominantBaseline="central"
                              className="text-sm font-semibold"
                            >
                              {`${name}: ${percentage}%`}
                            </text>
                          );
                        }}
                        animationBegin={0}
                        animationDuration={1000}
                      >
                        {monthsWithRevenue.map((entry, index) => {
                          const colors = ['#7C3AED', '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#EC4899'];
                          return <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />;
                        })}
                      </Pie>
                      <Tooltip
                        contentStyle={{ 
                          backgroundColor: '#1F2937', 
                          border: '1px solid #7C3AED',
                          borderRadius: '8px',
                          padding: '12px'
                        }}
                        formatter={(value) => [`R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 'Faturamento']}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  
                  {/* Total de Faturamento no centro */}
                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center">
                    <p className="text-gray-400 text-sm">Faturamento Total</p>
                    <p className="text-white text-3xl font-bold">
                      R$ {monthsWithRevenue.reduce((sum, item) => sum + item.faturamento, 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                    <p className="text-gray-400 text-xs mt-1">{monthsWithRevenue.length} {monthsWithRevenue.length === 1 ? 'mês' : 'meses'}</p>
                  </div>
                </div>
                
                {/* Legenda com valores individuais */}
                <div className="mt-6 grid grid-cols-2 md:grid-cols-3 gap-3">
                  {monthsWithRevenue.map((item, index) => {
                    const colors = ['#7C3AED', '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#EC4899'];
                    const totalFaturamento = monthsWithRevenue.reduce((sum, i) => sum + i.faturamento, 0);
                    const percentage = ((item.faturamento / totalFaturamento) * 100).toFixed(1);
                    
                    return (
                      <div 
                        key={index} 
                        className="flex items-center justify-between p-3 bg-white/5 rounded-lg hover:bg-white/10 transition-all"
                        data-testid={`month-item-${index}`}
                      >
                        <div className="flex items-center space-x-2">
                          <div 
                            className="w-4 h-4 rounded-full" 
                            style={{ backgroundColor: colors[index % colors.length] }}
                          ></div>
                          <span className="text-sm text-gray-300 font-medium">{item.month}</span>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold text-white">
                            R$ {(item.faturamento / 1000).toFixed(1)}k
                          </p>
                          <p className="text-xs text-purple-400">{percentage}%</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
              )}

              {/* Lucro Líquido */}
              {monthsWithProfit.length > 0 && (
                <Card className="glass border-white/10" data-testid="monthly-profit-donut-card">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center">
                      <TrendingUp className="mr-2" />
                      Lucro Líquido por Mês
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="relative">
                      <ResponsiveContainer width="100%" height={400}>
                        <PieChart>
                          <Pie
                            data={monthsWithProfit.map(item => ({ name: item.month, value: item.lucro }))}
                            cx="50%"
                            cy="50%"
                            innerRadius={90}
                            outerRadius={130}
                            paddingAngle={monthsWithProfit.length > 1 ? 3 : 0}
                            dataKey="value"
                            label={({ cx, cy, midAngle, innerRadius, outerRadius, value, name }) => {
                              const RADIAN = Math.PI / 180;
                              const radius = outerRadius + 35;
                              const x = cx + radius * Math.cos(-midAngle * RADIAN);
                              const y = cy + radius * Math.sin(-midAngle * RADIAN);
                              
                              const totalProfit = monthsWithProfit.reduce((sum, item) => sum + item.lucro, 0);
                              const percentage = ((value / totalProfit) * 100).toFixed(1);
                              
                              // Não exibir label se for muito pequeno (< 5%)
                              if (parseFloat(percentage) < 5) return null;
                              
                              return (
                                <text 
                                  x={x} 
                                  y={y} 
                                  fill="white" 
                                  textAnchor={x > cx ? 'start' : 'end'} 
                                  dominantBaseline="central"
                                  className="text-sm font-semibold"
                                >
                                  {`${name}: ${percentage}%`}
                                </text>
                              );
                            }}
                            animationBegin={0}
                            animationDuration={1000}
                          >
                            {monthsWithProfit.map((entry, index) => {
                              const colors = ['#10B981', '#3B82F6', '#7C3AED', '#F59E0B', '#EF4444', '#EC4899'];
                              return <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />;
                            })}
                          </Pie>
                          <Tooltip
                            contentStyle={{ 
                              backgroundColor: '#1F2937', 
                              border: '1px solid #10B981',
                              borderRadius: '8px',
                              padding: '12px'
                            }}
                            formatter={(value) => [`R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 'Lucro']}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                      
                      {/* Total de Lucro no centro */}
                      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center">
                        <p className="text-gray-400 text-sm">Lucro Total</p>
                        <p className="text-white text-3xl font-bold">
                          R$ {monthsWithProfit.reduce((sum, item) => sum + item.lucro, 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </p>
                        <p className="text-gray-400 text-xs mt-1">{monthsWithProfit.length} {monthsWithProfit.length === 1 ? 'mês' : 'meses'}</p>
                      </div>
                    </div>
                    
                    {/* Legenda com valores individuais */}
                    <div className="mt-6 grid grid-cols-2 md:grid-cols-3 gap-3">
                      {monthsWithProfit.map((item, index) => {
                        const colors = ['#10B981', '#3B82F6', '#7C3AED', '#F59E0B', '#EF4444', '#EC4899'];
                        const totalProfit = monthsWithProfit.reduce((sum, i) => sum + i.lucro, 0);
                        const percentage = ((item.lucro / totalProfit) * 100).toFixed(1);
                        
                        return (
                          <div 
                            key={index} 
                            className="flex items-center justify-between p-3 bg-white/5 rounded-lg hover:bg-white/10 transition-all"
                            data-testid={`profit-month-item-${index}`}
                          >
                            <div className="flex items-center space-x-2">
                              <div 
                                className="w-4 h-4 rounded-full" 
                                style={{ backgroundColor: colors[index % colors.length] }}
                              ></div>
                              <span className="text-sm text-gray-300 font-medium">{item.month}</span>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-bold text-white">
                                R$ {(item.lucro / 1000).toFixed(1)}k
                              </p>
                              <p className="text-xs text-green-400">{percentage}%</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          );
        })()}

        {/* Análise Detalhada por Categoria */}
        {detailedAnalysis.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
            {/* Gráfico de Donut - Distribuição de Custos e Despesas */}
            <Card className="glass border-white/10" data-testid="pie-chart-card">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <BarChart className="mr-2" />
                  Distribuição de Custos e Despesas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="relative">
                  <ResponsiveContainer width="100%" height={380}>
                    <PieChart>
                      <Pie
                        data={detailedAnalysis}
                        cx="50%"
                        cy="50%"
                        innerRadius={80}
                        outerRadius={120}
                        paddingAngle={2}
                        dataKey="value"
                        label={({ cx, cy, midAngle, innerRadius, outerRadius, value, name, percentage }) => {
                          const RADIAN = Math.PI / 180;
                          const radius = outerRadius + 30;
                          const x = cx + radius * Math.cos(-midAngle * RADIAN);
                          const y = cy + radius * Math.sin(-midAngle * RADIAN);
                          
                          return (
                            <text 
                              x={x} 
                              y={y} 
                              fill="white" 
                              textAnchor={x > cx ? 'start' : 'end'} 
                              dominantBaseline="central"
                              className="text-xs font-semibold"
                            >
                              {`${percentage}% (R$ ${(value / 1000).toFixed(1)}k)`}
                            </text>
                          );
                        }}
                        animationBegin={0}
                        animationDuration={800}
                      >
                        {detailedAnalysis.map((entry, index) => {
                          const colors = ['#7C3AED', '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#EC4899', '#8B5CF6', '#06B6D4'];
                          return <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />;
                        })}
                      </Pie>
                      <Tooltip
                        contentStyle={{ 
                          backgroundColor: '#1F2937', 
                          border: '1px solid #7C3AED',
                          borderRadius: '8px',
                          padding: '12px'
                        }}
                        formatter={(value, name) => [
                          `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
                          ''
                        ]}
                        labelFormatter={(label) => {
                          const item = detailedAnalysis.find(d => d.value === label);
                          return item ? item.name : label;
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  
                  {/* Valor total no centro */}
                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center">
                    <p className="text-gray-400 text-sm">Total</p>
                    <p className="text-white text-2xl font-bold">
                      R$ {detailedAnalysis.reduce((sum, item) => sum + item.value, 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                </div>
                
                {/* Legenda customizada abaixo */}
                <div className="mt-4 grid grid-cols-2 gap-2">
                  {detailedAnalysis.slice(0, 6).map((item, index) => {
                    const colors = ['#7C3AED', '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#EC4899', '#8B5CF6', '#06B6D4'];
                    return (
                      <div key={index} className="flex items-center space-x-2">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: colors[index % colors.length] }}
                        ></div>
                        <span className="text-xs text-gray-300 truncate">{item.name}</span>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Tabela de Detalhamento */}
            <Card className="glass border-white/10" data-testid="detailed-table-card">
              <CardHeader>
                <CardTitle className="text-white">Detalhamento por Categoria</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-[300px] overflow-y-auto">
                  {detailedAnalysis.map((item, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-white/5 rounded-lg hover:bg-white/10 transition-all"
                      data-testid={`category-item-${index}`}
                    >
                      <div className="flex items-center space-x-3">
                        <div 
                          className="w-4 h-4 rounded-full" 
                          style={{ 
                            backgroundColor: ['#7C3AED', '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#EC4899', '#8B5CF6', '#06B6D4'][index % 8]
                          }}
                        ></div>
                        <div>
                          <p className="text-white font-medium">{item.name}</p>
                          <p className="text-xs text-gray-400 capitalize">
                            {item.type === 'custo' ? 'Custo' : 'Despesa'}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-white">
                          R$ {item.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </p>
                        <p className="text-sm text-purple-400">{item.percentage}%</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Alertas de Custos e Despesas */}
        {costAlerts.length > 0 && (
          <Card className="glass border-white/10 border-l-4 border-l-red-500 mt-6" data-testid="cost-alerts-card">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <AlertTriangle className="mr-2 text-red-400" />
                ⚠️ Principais Gargalos de Custos e Despesas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {costAlerts.map((alert, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-4 bg-red-500/10 border border-red-500/30 rounded-lg hover:bg-red-500/15 transition-all"
                    data-testid={`cost-alert-${index}`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-2 h-2 bg-red-400 rounded-full animate-pulse"></div>
                      <div>
                        <p className="text-white font-semibold">{alert.category}</p>
                        <p className="text-sm text-gray-400 capitalize">
                          {alert.type === 'custo' ? 'Custo' : 'Despesa'}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-bold text-red-400">
                        R$ {alert.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </p>
                      <p className="text-xs text-gray-400">Realizado no mês</p>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="mt-4 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                <p className="text-sm text-yellow-200">
                  💡 <strong>Dica:</strong> Estes são os maiores gastos do mês. Avalie se é possível reduzir ou otimizar esses custos.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Análise Inteligente com IA */}
        {selectedCompany ? (
          <div className="mt-6" data-testid="intelligent-analysis-container">
            <h3 className="text-white text-2xl font-bold mb-4">🤖 Análise Inteligente com IA</h3>
            <IntelligentAnalysis companyId={selectedCompany.id} />
          </div>
        ) : (
          <div className="mt-6 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
            <p className="text-yellow-200">⏳ Aguardando seleção de empresa para carregar análises inteligentes...</p>
          </div>
        )}

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
        <Dialog open={showAIAnalysis} onOpenChange={setShowAIAnalysis}>
          <DialogContent className="glass border-white/10 max-w-3xl max-h-[80vh] overflow-y-auto" data-testid="ai-analysis-dialog">
            <DialogHeader>
              <DialogTitle className="text-white flex items-center text-2xl">
                <Sparkles className="mr-2 text-purple-400" />
                Análise Inteligente (ChatGPT)
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <Card className="bg-gradient-to-br from-purple-600/20 to-blue-600/20 border-purple-500/30">
                <CardContent className="p-6">
                  <div className="prose prose-invert max-w-none">
                    <div className="text-gray-200 whitespace-pre-line leading-relaxed">
                      {aiAnalysisResult}
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <div className="flex justify-end">
                <Button
                  onClick={() => setShowAIAnalysis(false)}
                  className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                  data-testid="close-ai-analysis-button"
                >
                  Fechar
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

      </div>
      
      {/* Glossário Financeiro */}
      <FinancialGlossary isOpen={showGlossary} onClose={() => setShowGlossary(false)} />
    </div>
  );
};

export default Dashboard;