import React, { useState, useEffect } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { SubscriptionCard } from '@/components/SubscriptionCard';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { axiosInstance } from '../App';
import { toast } from 'sonner';
import { Target, TrendingUp } from 'lucide-react';

const MetaMensal = ({ user, onLogout }) => {
  const [goalAmount, setGoalAmount] = useState('');
  const [currentGoal, setCurrentGoal] = useState(null);
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));

  const company = JSON.parse(localStorage.getItem('company') || '{}');

  useEffect(() => {
    fetchGoal();
    fetchMetrics();
  }, [selectedMonth]);

  const fetchGoal = async () => {
    if (!company.id) return;

    try {
      const response = await axiosInstance.get(`/monthly-goal/${company.id}/${selectedMonth}`);
      setCurrentGoal(response.data);
      if (response.data.goal_amount) {
        setGoalAmount(response.data.goal_amount.toString());
      }
    } catch (error) {
      console.error('Erro ao buscar meta:', error);
    }
  };

  const fetchMetrics = async () => {
    if (!company.id) return;

    try {
      const response = await axiosInstance.get(`/metrics/${company.id}/${selectedMonth}`);
      setMetrics(response.data);
    } catch (error) {
      console.error('Erro ao buscar métricas:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await axiosInstance.post('/monthly-goal', {
        company_id: company.id,
        month: selectedMonth,
        goal_amount: parseFloat(goalAmount),
      });
      toast.success('Meta definida com sucesso!');
      fetchGoal();
    } catch (error) {
      toast.error('Erro ao definir meta');
    } finally {
      setLoading(false);
    }
  };

  const getProgress = () => {
    if (!metrics || !currentGoal || currentGoal.goal_amount === 0) return 0;
    return Math.min((metrics.lucro_liquido / currentGoal.goal_amount) * 100, 100);
  };

  const getRemainingAmount = () => {
    if (!metrics || !currentGoal) return 0;
    return currentGoal.goal_amount - metrics.lucro_liquido;
  };

  return (
    <div className="flex min-h-screen" data-testid="meta-mensal-page">
      <Sidebar user={user} onLogout={onLogout} />

      <div className="flex-1 p-8">
        <SubscriptionCard user={user} />

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2" data-testid="meta-mensal-title">Meta Mensal</h1>
          <p className="text-gray-400">Defina e acompanhe suas metas de lucro líquido</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Definir Meta */}
          <Card className="glass border-white/10" data-testid="define-goal-card">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <Target className="mr-2" />
                Definir Meta
              </CardTitle>
              <CardDescription className="text-gray-400">
                Defina seu objetivo de lucro líquido para o mês
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4" data-testid="goal-form">
                <div>
                  <Label className="text-gray-300">Mês</Label>
                  <Input
                    type="month"
                    data-testid="goal-month-input"
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(e.target.value)}
                    className="bg-white/5 border-white/10 text-white"
                  />
                </div>

                <div>
                  <Label className="text-gray-300">Meta de Lucro Líquido (R$)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    data-testid="goal-amount-input"
                    value={goalAmount}
                    onChange={(e) => setGoalAmount(e.target.value)}
                    placeholder="Ex: 50000.00"
                    required
                    className="bg-white/5 border-white/10 text-white text-lg"
                  />
                </div>

                <Button
                  type="submit"
                  data-testid="goal-submit-button"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                >
                  {loading ? 'Salvando...' : currentGoal && currentGoal.goal_amount > 0 ? 'Atualizar Meta' : 'Definir Meta'}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Progresso da Meta */}
          {currentGoal && currentGoal.goal_amount > 0 && metrics && (
            <Card className="glass border-white/10" data-testid="goal-progress-card">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <TrendingUp className="mr-2" />
                  Progresso da Meta
                </CardTitle>
                <CardDescription className="text-gray-400">
                  Acompanhe seu desempenho em relação à meta
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Termômetro */}
                <div>
                  <div className="flex justify-between text-sm text-gray-400 mb-2">
                    <span>Lucro Atual</span>
                    <span>Meta</span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-8 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-purple-600 to-blue-600 transition-all duration-500 flex items-center justify-center"
                      style={{ width: `${getProgress()}%` }}
                      data-testid="goal-progress-bar"
                    >
                      <span className="text-sm font-bold text-white">{getProgress().toFixed(1)}%</span>
                    </div>
                  </div>
                  <div className="flex justify-between text-lg font-semibold text-white mt-2">
                    <span>R$ {metrics.lucro_liquido.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                    <span>R$ {currentGoal.goal_amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                  </div>
                </div>

                {/* Estatísticas */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-white/5 rounded-lg">
                    <p className="text-sm text-gray-400 mb-1">Falta para Meta</p>
                    <p className="text-xl font-bold text-white" data-testid="remaining-amount">
                      R$ {Math.max(0, getRemainingAmount()).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                  <div className="p-4 bg-white/5 rounded-lg">
                    <p className="text-sm text-gray-400 mb-1">Atingimento</p>
                    <p className="text-xl font-bold text-white" data-testid="achievement-percentage">
                      {getProgress().toFixed(1)}%
                    </p>
                  </div>
                </div>

                {/* Status */}
                <div className="p-4 bg-gradient-to-r from-purple-600/20 to-blue-600/20 rounded-lg border border-purple-500/30">
                  <p className="text-sm text-gray-300">
                    {getProgress() >= 100
                      ? '🎉 Parabéns! Você atingiu sua meta!'
                      : getProgress() >= 75
                      ? '🚀 Ótimo progresso! Continue assim!'
                      : getProgress() >= 50
                      ? '💪 Você está no caminho certo!'
                      : '💡 Foco e força! Ainda dá tempo!'}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Histórico de Metas */}
        <Card className="glass border-white/10 mt-6" data-testid="goal-tips-card">
          <CardHeader>
            <CardTitle className="text-white">Dicas para Atingir suas Metas</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3 text-gray-300">
              <li className="flex items-start">
                <span className="mr-3">•</span>
                <span>Defina metas realistas baseadas no histórico da sua empresa</span>
              </li>
              <li className="flex items-start">
                <span className="mr-3">•</span>
                <span>Acompanhe seus lançamentos diariamente para identificar desvios</span>
              </li>
              <li className="flex items-start">
                <span className="mr-3">•</span>
                <span>Use a análise com IA para identificar oportunidades de melhoria</span>
              </li>
              <li className="flex items-start">
                <span className="mr-3">•</span>
                <span>Revise suas metas mensalmente e ajuste conforme necessário</span>
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default MetaMensal;