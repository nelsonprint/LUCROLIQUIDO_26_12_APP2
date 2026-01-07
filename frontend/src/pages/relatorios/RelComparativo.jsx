import React, { useState, useEffect } from 'react';
import { ReportLayout, KPICard } from '@/components/ReportLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { axiosInstance } from '../../App';
import { Scale, TrendingUp, TrendingDown, Minus, ArrowUp, ArrowDown } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Cell } from 'recharts';

const RelComparativo = ({ user, onLogout }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);
  const company = JSON.parse(localStorage.getItem('company') || '{}');

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axiosInstance.get(`/relatorios/comparativo/${company.id}`);
      setData(response.data);
    } catch (err) {
      setError('Erro ao carregar dados.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (company.id) fetchData(); }, [company.id]);

  const formatCurrency = (value) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0);

  const getVariacaoIcon = (variacao) => {
    if (variacao > 5) return <ArrowUp className="w-4 h-4 text-green-400" />;
    if (variacao < -5) return <ArrowDown className="w-4 h-4 text-red-400" />;
    return <Minus className="w-4 h-4 text-zinc-400" />;
  };

  const getVariacaoColor = (variacao) => {
    if (variacao > 5) return 'text-green-400';
    if (variacao < -5) return 'text-red-400';
    return 'text-zinc-400';
  };

  const metricas = data?.metricas || [];

  return (
    <ReportLayout
      user={user}
      onLogout={onLogout}
      title="Comparativo"
      subtitle="Mês atual vs anterior vs média 3 meses"
      icon={Scale}
      iconColor="text-yellow-400"
      iconBg="bg-yellow-500/10"
      loading={loading}
      error={error}
      onRetry={fetchData}
      reportId="comparativo"
    >
      {data && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <KPICard title="Mês Atual" value={formatCurrency(data.resumo?.mes_atual)} icon={TrendingUp} color="text-blue-400" />
            <KPICard title="Mês Anterior" value={formatCurrency(data.resumo?.mes_anterior)} icon={Scale} color="text-zinc-400" />
            <KPICard title="Média 3 Meses" value={formatCurrency(data.resumo?.media_3m)} icon={TrendingUp} color="text-purple-400" />
          </div>

          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader><CardTitle>Comparação por Métrica</CardTitle></CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-zinc-800">
                      <th className="text-left p-3 text-zinc-400">Métrica</th>
                      <th className="text-right p-3 text-zinc-400">Mês Atual</th>
                      <th className="text-right p-3 text-zinc-400">Mês Anterior</th>
                      <th className="text-right p-3 text-zinc-400">Var. %</th>
                      <th className="text-right p-3 text-zinc-400">Média 3M</th>
                      <th className="text-right p-3 text-zinc-400">Var. vs Média</th>
                    </tr>
                  </thead>
                  <tbody>
                    {metricas.map((m, idx) => (
                      <tr key={idx} className="border-b border-zinc-800/50 hover:bg-zinc-800/30">
                        <td className="p-3 font-medium">{m.nome}</td>
                        <td className="p-3 text-right">{m.formato === 'moeda' ? formatCurrency(m.atual) : m.formato === 'percentual' ? `${m.atual?.toFixed(1)}%` : m.atual}</td>
                        <td className="p-3 text-right text-zinc-400">{m.formato === 'moeda' ? formatCurrency(m.anterior) : m.formato === 'percentual' ? `${m.anterior?.toFixed(1)}%` : m.anterior}</td>
                        <td className={`p-3 text-right ${getVariacaoColor(m.variacao_anterior)}`}>
                          <span className="flex items-center justify-end gap-1">
                            {getVariacaoIcon(m.variacao_anterior)}
                            {m.variacao_anterior > 0 ? '+' : ''}{(m.variacao_anterior || 0).toFixed(1)}%
                          </span>
                        </td>
                        <td className="p-3 text-right text-zinc-400">{m.formato === 'moeda' ? formatCurrency(m.media_3m) : m.formato === 'percentual' ? `${m.media_3m?.toFixed(1)}%` : m.media_3m}</td>
                        <td className={`p-3 text-right ${getVariacaoColor(m.variacao_media)}`}>
                          <span className="flex items-center justify-end gap-1">
                            {getVariacaoIcon(m.variacao_media)}
                            {m.variacao_media > 0 ? '+' : ''}{(m.variacao_media || 0).toFixed(1)}%
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader><CardTitle>Variação vs Mês Anterior</CardTitle></CardHeader>
            <CardContent>
              {metricas.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={metricas} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                    <XAxis type="number" stroke="#71717a" tickFormatter={(v) => `${v}%`} domain={[-50, 50]} />
                    <YAxis dataKey="nome" type="category" stroke="#71717a" width={120} fontSize={11} />
                    <Tooltip contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a' }} formatter={(v) => `${v?.toFixed(1)}%`} />
                    <ReferenceLine x={0} stroke="#71717a" />
                    <Bar dataKey="variacao_anterior" radius={[0, 4, 4, 0]}>
                      {metricas.map((entry, idx) => (
                        <Cell key={idx} fill={entry.variacao_anterior >= 0 ? '#22c55e' : '#ef4444'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : <div className="h-64 flex items-center justify-center text-zinc-500">Sem dados</div>}
            </CardContent>
          </Card>
        </>
      )}
    </ReportLayout>
  );
};

export default RelComparativo;
