import React, { useState, useEffect } from 'react';
import { ReportLayout, KPICard } from '@/components/ReportLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { axiosInstance } from '../../App';
import { toast } from 'sonner';
import { Target, TrendingUp, TrendingDown, DollarSign, Users, FileText, Percent, AlertTriangle, Wallet, CreditCard } from 'lucide-react';

const RelTopIndicadores = ({ user, onLogout }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);
  const company = JSON.parse(localStorage.getItem('company') || '{}');

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axiosInstance.get(`/relatorios/top-indicadores/${company.id}`);
      setData(response.data);
    } catch (err) {
      setError('Erro ao carregar dados.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (company.id) fetchData(); }, [company.id]);

  const formatCurrency = (value) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0);

  const indicadores = data?.indicadores || [];

  const getIcon = (tipo) => {
    const icons = {
      'receita': DollarSign,
      'lucro': TrendingUp,
      'margem': Percent,
      'clientes': Users,
      'orcamentos': FileText,
      'inadimplencia': AlertTriangle,
      'caixa': Wallet,
      'despesas': CreditCard
    };
    return icons[tipo] || Target;
  };

  const getColor = (variacao) => {
    if (variacao > 0) return 'text-green-400';
    if (variacao < 0) return 'text-red-400';
    return 'text-zinc-400';
  };

  return (
    <ReportLayout
      user={user}
      onLogout={onLogout}
      title="Top 10 Indicadores"
      subtitle="Painel executivo do mês"
      icon={Target}
      iconColor="text-yellow-400"
      iconBg="bg-yellow-500/10"
      loading={loading}
      error={error}
      onRetry={fetchData}
      reportId="top-indicadores"
    >
      {data && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {indicadores.slice(0, 5).map((ind, idx) => {
              const Icon = getIcon(ind.tipo);
              return (
                <Card key={idx} className="bg-zinc-900 border-zinc-800">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-xs text-zinc-500 uppercase">{ind.nome}</p>
                        <p className={`text-xl font-bold mt-1 ${getColor(ind.variacao)}`}>
                          {ind.formato === 'moeda' ? formatCurrency(ind.valor) : 
                           ind.formato === 'percentual' ? `${ind.valor?.toFixed(1)}%` : ind.valor}
                        </p>
                        {ind.variacao !== undefined && (
                          <p className={`text-xs mt-1 ${getColor(ind.variacao)}`}>
                            {ind.variacao > 0 ? '↑' : ind.variacao < 0 ? '↓' : '-'} {Math.abs(ind.variacao || 0).toFixed(1)}% vs mês ant.
                          </p>
                        )}
                      </div>
                      <Icon className={`w-5 h-5 ${getColor(ind.variacao)}`} />
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {indicadores.slice(5, 10).map((ind, idx) => {
              const Icon = getIcon(ind.tipo);
              return (
                <Card key={idx} className="bg-zinc-900 border-zinc-800">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-xs text-zinc-500 uppercase">{ind.nome}</p>
                        <p className={`text-xl font-bold mt-1 ${getColor(ind.variacao)}`}>
                          {ind.formato === 'moeda' ? formatCurrency(ind.valor) : 
                           ind.formato === 'percentual' ? `${ind.valor?.toFixed(1)}%` : ind.valor}
                        </p>
                        {ind.variacao !== undefined && (
                          <p className={`text-xs mt-1 ${getColor(ind.variacao)}`}>
                            {ind.variacao > 0 ? '↑' : ind.variacao < 0 ? '↓' : '-'} {Math.abs(ind.variacao || 0).toFixed(1)}% vs mês ant.
                          </p>
                        )}
                      </div>
                      <Icon className={`w-5 h-5 ${getColor(ind.variacao)}`} />
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Resumo Executivo */}
          <Card className="bg-gradient-to-r from-zinc-900 to-zinc-800 border-zinc-700">
            <CardHeader><CardTitle>Resumo Executivo</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <p className="text-zinc-400 text-sm">Situação Financeira</p>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge className={data.resumo?.saude_financeira === 'boa' ? 'bg-green-500/20 text-green-400' : data.resumo?.saude_financeira === 'atencao' ? 'bg-yellow-500/20 text-yellow-400' : 'bg-red-500/20 text-red-400'}>
                      {data.resumo?.saude_financeira?.toUpperCase() || 'N/A'}
                    </Badge>
                  </div>
                </div>
                <div>
                  <p className="text-zinc-400 text-sm">Performance Comercial</p>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge className={data.resumo?.performance_comercial === 'crescendo' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}>
                      {data.resumo?.performance_comercial?.toUpperCase() || 'N/A'}
                    </Badge>
                  </div>
                </div>
                <div>
                  <p className="text-zinc-400 text-sm">Previsão Caixa</p>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge className={data.resumo?.previsao_caixa === 'positiva' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}>
                      {data.resumo?.previsao_caixa?.toUpperCase() || 'N/A'}
                    </Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </ReportLayout>
  );
};

export default RelTopIndicadores;
