import React, { useState, useEffect } from 'react';
import { ReportLayout, KPICard, ReportTable, exportToExcel } from '@/components/ReportLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { axiosInstance } from '../../App';
import { toast } from 'sonner';
import { RefreshCw, Users, Calendar, DollarSign, TrendingUp } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const RelClientesRecorrencia = ({ user, onLogout }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);
  const company = JSON.parse(localStorage.getItem('company') || '{}');

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axiosInstance.get(`/relatorios/clientes-recorrencia/${company.id}`);
      setData(response.data);
    } catch (err) {
      setError('Erro ao carregar dados.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (company.id) fetchData(); }, [company.id]);

  const formatCurrency = (value) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0);

  const handleExportExcel = () => {
    if (!data?.clientes) return;
    exportToExcel(data.clientes, [
      { key: 'nome', label: 'Cliente' },
      { key: 'total_compras', label: 'Total Compras' },
      { key: 'quantidade_compras', label: 'Qtd Compras' },
      { key: 'frequencia', label: 'Frequência' },
      { key: 'ultima_compra', label: 'Última Compra' },
    ], 'recorrencia_clientes');
    toast.success('Exportado!');
  };

  const COLORS = ['#22c55e', '#eab308', '#ef4444'];
  const pieData = data ? [
    { name: 'Recorrentes', value: data.resumo?.recorrentes || 0 },
    { name: 'Ocasionais', value: data.resumo?.ocasionais || 0 },
    { name: 'Inativos', value: data.resumo?.inativos || 0 }
  ].filter(d => d.value > 0) : [];

  const columns = [
    { key: 'nome', label: 'Cliente' },
    { key: 'quantidade_compras', label: 'Compras', align: 'right' },
    { key: 'total_compras', label: 'Total', align: 'right', render: (val) => formatCurrency(val) },
    { key: 'frequencia', label: 'Frequência', render: (val) => {
      const colors = { 'recorrente': 'bg-green-500/20 text-green-400', 'ocasional': 'bg-yellow-500/20 text-yellow-400', 'inativo': 'bg-red-500/20 text-red-400' };
      return <Badge className={colors[val] || 'bg-zinc-500/20'}>{val}</Badge>;
    }},
    { key: 'ultima_compra', label: 'Última Compra', render: (val) => val ? new Date(val).toLocaleDateString('pt-BR') : '-' },
  ];

  return (
    <ReportLayout
      user={user}
      onLogout={onLogout}
      title="Recorrência de Clientes"
      subtitle="Frequência de compras e fidelização"
      icon={RefreshCw}
      iconColor="text-cyan-400"
      iconBg="bg-cyan-500/10"
      loading={loading}
      error={error}
      onRetry={fetchData}
      onExportExcel={handleExportExcel}
      reportId="clientes-recorrencia"
    >
      {data && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <KPICard title="Recorrentes" value={data.resumo?.recorrentes || 0} subtitle="3+ compras" icon={RefreshCw} color="text-green-400" />
            <KPICard title="Ocasionais" value={data.resumo?.ocasionais || 0} subtitle="1-2 compras" icon={Users} color="text-yellow-400" />
            <KPICard title="Taxa Recorrência" value={`${(data.resumo?.taxa_recorrencia || 0).toFixed(1)}%`} icon={TrendingUp} color="text-blue-400" />
            <KPICard title="Receita Recorrentes" value={formatCurrency(data.resumo?.receita_recorrentes)} icon={DollarSign} color="text-purple-400" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-zinc-900 border-zinc-800">
              <CardHeader><CardTitle>Distribuição</CardTitle></CardHeader>
              <CardContent>
                {pieData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                        {pieData.map((_, idx) => <Cell key={idx} fill={COLORS[idx % COLORS.length]} />)}
                      </Pie>
                      <Tooltip contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a' }} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : <div className="h-64 flex items-center justify-center text-zinc-500">Sem dados</div>}
              </CardContent>
            </Card>

            <Card className="bg-zinc-900 border-zinc-800">
              <CardHeader><CardTitle>Top 10 Mais Frequentes</CardTitle></CardHeader>
              <CardContent>
                {data.clientes?.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={data.clientes.slice(0, 10)} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                      <XAxis type="number" stroke="#71717a" />
                      <YAxis dataKey="nome" type="category" stroke="#71717a" width={100} fontSize={10} />
                      <Tooltip contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a' }} />
                      <Bar dataKey="quantidade_compras" fill="#22c55e" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : <div className="h-64 flex items-center justify-center text-zinc-500">Sem dados</div>}
              </CardContent>
            </Card>
          </div>

          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader><CardTitle>Detalhamento</CardTitle></CardHeader>
            <CardContent>
              <ReportTable columns={columns} data={data.clientes || []} emptyMessage="Nenhum cliente" />
            </CardContent>
          </Card>
        </>
      )}
    </ReportLayout>
  );
};

export default RelClientesRecorrencia;
