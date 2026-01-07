import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ReportLayout, KPICard, ReportTable, exportToExcel } from '@/components/ReportLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { axiosInstance } from '../../App';
import { toast } from 'sonner';
import { Target, TrendingUp, DollarSign, CheckCircle, XCircle, Clock, ChevronRight } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, FunnelChart, Funnel, Cell, LabelList } from 'recharts';

const RelFunilOrcamentos = ({ user, onLogout }) => {
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);
  const [periodo, setPeriodo] = useState(searchParams.get('periodo') || 'mes');
  const company = JSON.parse(localStorage.getItem('company') || '{}');

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axiosInstance.get(`/relatorios/funil-orcamentos/${company.id}`, { params: { periodo } });
      setData(response.data);
    } catch (err) {
      setError('Erro ao carregar dados.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (company.id) fetchData(); }, [periodo, company.id]);

  const formatCurrency = (value) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0);

  const COLORS = ['#6366f1', '#3b82f6', '#22c55e', '#eab308', '#ef4444'];
  const statusLabels = {
    'rascunho': 'Rascunho',
    'enviado': 'Enviado',
    'aprovado': 'Aprovado',
    'em_execucao': 'Em Execução',
    'concluido': 'Concluído',
    'perdido': 'Perdido'
  };

  return (
    <ReportLayout
      user={user}
      onLogout={onLogout}
      title="Funil de Orçamentos"
      subtitle="Conversão por etapa do processo comercial"
      icon={Target}
      iconColor="text-orange-400"
      iconBg="bg-orange-500/10"
      loading={loading}
      error={error}
      onRetry={fetchData}
      reportId="funil-orcamentos"
      filters={
        <div className="flex gap-4 items-center">
          <Select value={periodo} onValueChange={setPeriodo}>
            <SelectTrigger className="w-[150px] bg-zinc-800 border-zinc-700"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="mes">Mês Atual</SelectItem>
              <SelectItem value="trimestre">Trimestre</SelectItem>
              <SelectItem value="ano">Ano</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={fetchData} className="border-zinc-700">Atualizar</Button>
        </div>
      }
    >
      {data && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <KPICard title="Total Orçamentos" value={data.resumo?.total || 0} subtitle={formatCurrency(data.resumo?.valor_total)} icon={Target} color="text-blue-400" />
            <KPICard title="Aprovados" value={data.resumo?.aprovados || 0} subtitle={formatCurrency(data.resumo?.valor_aprovado)} icon={CheckCircle} color="text-green-400" />
            <KPICard title="Taxa Conversão" value={`${(data.resumo?.taxa_conversao || 0).toFixed(1)}%`} icon={TrendingUp} color="text-purple-400" />
            <KPICard title="Perdidos" value={data.resumo?.perdidos || 0} subtitle={formatCurrency(data.resumo?.valor_perdido)} icon={XCircle} color="text-red-400" />
          </div>

          {/* Funil Visual */}
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader><CardTitle>Funil de Conversão</CardTitle></CardHeader>
            <CardContent>
              {data.funil?.length > 0 ? (
                <div className="space-y-4">
                  {data.funil.map((etapa, idx) => (
                    <div key={idx} className="relative">
                      <div className="flex items-center gap-4">
                        <div className="w-32 text-right text-sm text-zinc-400">{statusLabels[etapa.status] || etapa.status}</div>
                        <div className="flex-1">
                          <div 
                            className="h-10 rounded-r-lg flex items-center justify-between px-4 transition-all"
                            style={{ 
                              width: `${Math.max(10, etapa.percentual)}%`,
                              backgroundColor: COLORS[idx % COLORS.length] + '40',
                              borderLeft: `4px solid ${COLORS[idx % COLORS.length]}`
                            }}
                          >
                            <span className="font-bold">{etapa.quantidade}</span>
                            <span className="text-sm">{formatCurrency(etapa.valor)}</span>
                          </div>
                        </div>
                        <div className="w-16 text-right font-bold" style={{ color: COLORS[idx % COLORS.length] }}>
                          {etapa.percentual.toFixed(0)}%
                        </div>
                      </div>
                      {idx < data.funil.length - 1 && etapa.taxa_proxima !== undefined && (
                        <div className="ml-32 pl-4 py-1 text-xs text-zinc-500 flex items-center gap-1">
                          <ChevronRight className="w-3 h-3" /> {etapa.taxa_proxima.toFixed(0)}% avançam
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="h-64 flex items-center justify-center text-zinc-500">Sem orçamentos no período</div>
              )}
            </CardContent>
          </Card>

          {/* Gráfico de Barras */}
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader><CardTitle>Valor por Status</CardTitle></CardHeader>
            <CardContent>
              {data.funil?.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={data.funil}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                    <XAxis dataKey="status" stroke="#71717a" fontSize={11} tickFormatter={(v) => statusLabels[v] || v} />
                    <YAxis stroke="#71717a" tickFormatter={(v) => `R$${(v/1000).toFixed(0)}k`} />
                    <Tooltip contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a' }} formatter={(v) => formatCurrency(v)} labelFormatter={(v) => statusLabels[v] || v} />
                    <Bar dataKey="valor" radius={[4, 4, 0, 0]}>
                      {data.funil.map((_, idx) => <Cell key={idx} fill={COLORS[idx % COLORS.length]} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : null}
            </CardContent>
          </Card>
        </>
      )}
    </ReportLayout>
  );
};

export default RelFunilOrcamentos;
