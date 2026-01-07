import React, { useState, useEffect } from 'react';
import { ReportLayout, KPICard } from '@/components/ReportLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { axiosInstance } from '../../App';
import { AlertTriangle, AlertCircle, TrendingDown, Wallet, DollarSign, ChevronRight } from 'lucide-react';

const RelAlertas = ({ user, onLogout }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);
  const company = JSON.parse(localStorage.getItem('company') || '{}');

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axiosInstance.get(`/relatorios/alertas/${company.id}`);
      setData(response.data);
    } catch (err) {
      setError('Erro ao carregar dados.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (company.id) fetchData(); }, [company.id]);

  const formatCurrency = (value) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0);

  const getSeverityColor = (severity) => {
    const colors = {
      'critico': 'border-l-red-500 bg-red-500/5',
      'alto': 'border-l-orange-500 bg-orange-500/5',
      'medio': 'border-l-yellow-500 bg-yellow-500/5',
      'baixo': 'border-l-blue-500 bg-blue-500/5'
    };
    return colors[severity] || 'border-l-zinc-500';
  };

  const getSeverityBadge = (severity) => {
    const badges = {
      'critico': 'bg-red-500/20 text-red-400',
      'alto': 'bg-orange-500/20 text-orange-400',
      'medio': 'bg-yellow-500/20 text-yellow-400',
      'baixo': 'bg-blue-500/20 text-blue-400'
    };
    return badges[severity] || 'bg-zinc-500/20';
  };

  const alertas = data?.alertas || [];
  const criticos = alertas.filter(a => a.severity === 'critico').length;
  const altos = alertas.filter(a => a.severity === 'alto').length;

  return (
    <ReportLayout
      user={user}
      onLogout={onLogout}
      title="Alertas Inteligentes"
      subtitle="Riscos e oportunidades identificados"
      icon={AlertTriangle}
      iconColor="text-yellow-400"
      iconBg="bg-yellow-500/10"
      loading={loading}
      error={error}
      onRetry={fetchData}
      reportId="alertas"
    >
      {data && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <KPICard title="Alertas Ativos" value={alertas.length} icon={AlertTriangle} color="text-yellow-400" />
            <KPICard title="Críticos" value={criticos} icon={AlertCircle} color="text-red-400" />
            <KPICard title="Alta Prioridade" value={altos} icon={TrendingDown} color="text-orange-400" />
            <KPICard title="Situação" value={criticos === 0 ? 'Estável' : 'Atenção'} icon={Wallet} color={criticos === 0 ? 'text-green-400' : 'text-red-400'} />
          </div>

          <div className="space-y-4">
            {alertas.length > 0 ? alertas.map((alerta, idx) => (
              <Card key={idx} className={`bg-zinc-900 border-zinc-800 border-l-4 ${getSeverityColor(alerta.severity)}`}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge className={getSeverityBadge(alerta.severity)}>{alerta.severity?.toUpperCase()}</Badge>
                        <span className="text-xs text-zinc-500">{alerta.categoria}</span>
                      </div>
                      <h3 className="font-semibold text-lg">{alerta.titulo}</h3>
                      <p className="text-zinc-400 text-sm mt-1">{alerta.descricao}</p>
                      {alerta.valor && (
                        <p className="text-lg font-bold mt-2 text-red-400">{formatCurrency(alerta.valor)}</p>
                      )}
                      {alerta.acao && (
                        <div className="mt-3 flex items-center gap-2 text-sm text-blue-400">
                          <ChevronRight className="w-4 h-4" />
                          <span>{alerta.acao}</span>
                        </div>
                      )}
                    </div>
                    <div className="text-4xl ml-4">
                      {alerta.severity === 'critico' ? '🚨' : alerta.severity === 'alto' ? '⚠️' : alerta.severity === 'medio' ? '🟡' : '📊'}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )) : (
              <Card className="bg-zinc-900 border-zinc-800 border-l-4 border-l-green-500">
                <CardContent className="p-8 text-center">
                  <div className="text-6xl mb-4">✅</div>
                  <h3 className="text-xl font-semibold text-green-400">Tudo em ordem!</h3>
                  <p className="text-zinc-400 mt-2">Não há alertas ativos no momento</p>
                </CardContent>
              </Card>
            )}
          </div>
        </>
      )}
    </ReportLayout>
  );
};

export default RelAlertas;
