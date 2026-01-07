import React, { useState, useEffect } from 'react';
import { ReportLayout, KPICard, ReportTable } from '@/components/ReportLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { axiosInstance } from '../../App';
import { PieChart as PieChartIcon, Users, DollarSign, Percent } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Cell, LineChart, Line, Legend } from 'recharts';

const RelPareto = ({ user, onLogout }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);
  const [tipo, setTipo] = useState('clientes');
  const company = JSON.parse(localStorage.getItem('company') || '{}');

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axiosInstance.get(`/relatorios/pareto/${company.id}`, { params: { tipo } });
      setData(response.data);
    } catch (err) {
      setError('Erro ao carregar dados.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (company.id) fetchData(); }, [tipo, company.id]);

  const formatCurrency = (value) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0);

  const items = data?.items || [];

  const columns = [
    { key: 'posicao', label: '#' },
    { key: 'nome', label: tipo === 'clientes' ? 'Cliente' : 'Categoria' },
    { key: 'valor', label: 'Valor', align: 'right', render: (val) => formatCurrency(val) },
    { key: 'percentual', label: '% Individual', align: 'right', render: (val) => `${(val || 0).toFixed(1)}%` },
    { key: 'acumulado', label: '% Acumulado', align: 'right', render: (val) => `${(val || 0).toFixed(1)}%` },
  ];

  return (
    <ReportLayout
      user={user}
      onLogout={onLogout}
      title="Análise Pareto (80/20)"
      subtitle="Concentração de receita e custos"
      icon={PieChartIcon}
      iconColor="text-yellow-400"
      iconBg="bg-yellow-500/10"
      loading={loading}
      error={error}
      onRetry={fetchData}
      reportId="pareto"
      filters={
        <div className="flex gap-4 items-center">
          <Select value={tipo} onValueChange={setTipo}>
            <SelectTrigger className="w-[200px] bg-zinc-800 border-zinc-700"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="clientes">Clientes (Receita)</SelectItem>
              <SelectItem value="despesas">Despesas (Custo)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      }
    >
      {data && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <KPICard title="Total Analisado" value={formatCurrency(data.resumo?.total)} icon={DollarSign} color="text-blue-400" />
            <KPICard title="Itens no Top 20%" value={data.resumo?.itens_top20 || 0} icon={Users} color="text-green-400" />
            <KPICard title="% do Top 20%" value={`${(data.resumo?.percentual_top20 || 0).toFixed(1)}%`} icon={Percent} color="text-purple-400" />
            <KPICard title="Confirma 80/20?" value={data.resumo?.confirma_pareto ? 'Sim' : 'Não'} icon={PieChartIcon} color={data.resumo?.confirma_pareto ? 'text-green-400' : 'text-yellow-400'} />
          </div>

          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader><CardTitle>Curva ABC (Pareto)</CardTitle></CardHeader>
            <CardContent>
              {items.length > 0 ? (
                <ResponsiveContainer width="100%" height={350}>
                  <BarChart data={items.slice(0, 20)}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                    <XAxis dataKey="nome" stroke="#71717a" fontSize={10} angle={-45} textAnchor="end" height={80} />
                    <YAxis yAxisId="left" stroke="#71717a" tickFormatter={(v) => `R$${(v/1000).toFixed(0)}k`} />
                    <YAxis yAxisId="right" orientation="right" stroke="#71717a" tickFormatter={(v) => `${v}%`} domain={[0, 100]} />
                    <Tooltip contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a' }} formatter={(v, name) => name === 'acumulado' ? `${v?.toFixed(1)}%` : formatCurrency(v)} />
                    <Legend />
                    <ReferenceLine yAxisId="right" y={80} stroke="#ef4444" strokeDasharray="5 5" label={{ value: '80%', fill: '#ef4444', fontSize: 12 }} />
                    <Bar yAxisId="left" dataKey="valor" name="Valor" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                    <Line yAxisId="right" type="monotone" dataKey="acumulado" name="% Acumulado" stroke="#f97316" strokeWidth={2} dot={{ r: 3 }} />
                  </BarChart>
                </ResponsiveContainer>
              ) : <div className="h-64 flex items-center justify-center text-zinc-500">Sem dados</div>}
            </CardContent>
          </Card>

          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader><CardTitle>Detalhamento</CardTitle></CardHeader>
            <CardContent>
              <ReportTable columns={columns} data={items} emptyMessage="Sem dados" />
            </CardContent>
          </Card>

          {/* Insight */}
          <Card className={`bg-gradient-to-r ${data.resumo?.confirma_pareto ? 'from-green-900/20 to-zinc-900' : 'from-yellow-900/20 to-zinc-900'} border-zinc-700`}>
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold mb-2">💡 Insight</h3>
              <p className="text-zinc-300">
                {tipo === 'clientes' 
                  ? data.resumo?.confirma_pareto 
                    ? `Os ${data.resumo?.itens_top20} maiores clientes (20%) representam ${data.resumo?.percentual_top20?.toFixed(1)}% da sua receita. Foque em manter esses clientes!`
                    : `A concentração de receita está mais distribuída. Isso pode ser bom para reduzir dependência, mas também pode indicar falta de grandes contas.`
                  : data.resumo?.confirma_pareto
                    ? `As ${data.resumo?.itens_top20} maiores categorias de despesa (20%) representam ${data.resumo?.percentual_top20?.toFixed(1)}% dos custos. Priorize otimizações nessas áreas!`
                    : `Os custos estão bem distribuídos entre as categorias. Pode ser difícil encontrar grandes áreas de corte.`
                }
              </p>
            </CardContent>
          </Card>
        </>
      )}
    </ReportLayout>
  );
};

export default RelPareto;
