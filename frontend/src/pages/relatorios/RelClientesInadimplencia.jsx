import React, { useState, useEffect } from 'react';
import { ReportLayout, KPICard, ReportTable, exportToExcel } from '@/components/ReportLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { axiosInstance } from '../../App';
import { toast } from 'sonner';
import { AlertTriangle, Users, DollarSign, Clock, TrendingDown, Calendar } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';

const RelClientesInadimplencia = ({ user, onLogout }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);
  const company = JSON.parse(localStorage.getItem('company') || '{}');

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axiosInstance.get(`/relatorios/clientes-inadimplencia/${company.id}`);
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
      { key: 'cliente', label: 'Cliente' },
      { key: 'valor_atrasado', label: 'Valor Atrasado' },
      { key: 'quantidade', label: 'Qtd Títulos' },
      { key: 'maior_atraso', label: 'Maior Atraso (dias)' },
    ], 'inadimplencia_clientes');
    toast.success('Exportado!');
  };

  const COLORS = ['#ef4444', '#f97316', '#eab308', '#22c55e'];
  const faixasData = data?.faixas || [];

  const columns = [
    { key: 'cliente', label: 'Cliente' },
    { key: 'valor_atrasado', label: 'Valor Atrasado', align: 'right', render: (val) => <span className="text-red-400">{formatCurrency(val)}</span> },
    { key: 'quantidade', label: 'Títulos', align: 'right' },
    { key: 'maior_atraso', label: 'Maior Atraso', align: 'right', render: (val) => <span className="text-orange-400">{val} dias</span> },
    { key: 'faixa', label: 'Faixa', render: (val) => {
      const colors = { 'leve': 'bg-yellow-500/20 text-yellow-400', 'moderada': 'bg-orange-500/20 text-orange-400', 'grave': 'bg-red-500/20 text-red-400' };
      return <Badge className={colors[val] || 'bg-red-500/20 text-red-400'}>{val}</Badge>;
    }},
  ];

  return (
    <ReportLayout
      user={user}
      onLogout={onLogout}
      title="Inadimplência por Cliente"
      subtitle="Ranking e histórico de atrasos"
      icon={AlertTriangle}
      iconColor="text-red-400"
      iconBg="bg-red-500/10"
      loading={loading}
      error={error}
      onRetry={fetchData}
      onExportExcel={handleExportExcel}
      reportId="clientes-inadimplencia"
    >
      {data && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <KPICard title="Total Inadimplente" value={formatCurrency(data.resumo?.total_inadimplente)} icon={DollarSign} color="text-red-400" />
            <KPICard title="Clientes Inadimplentes" value={data.resumo?.qtd_clientes || 0} icon={Users} color="text-orange-400" />
            <KPICard title="Taxa Inadimplência" value={`${(data.resumo?.taxa_inadimplencia || 0).toFixed(1)}%`} icon={TrendingDown} color="text-yellow-400" />
            <KPICard title="Maior Atraso" value={`${data.resumo?.maior_atraso || 0} dias`} icon={Clock} color="text-purple-400" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-zinc-900 border-zinc-800">
              <CardHeader><CardTitle>Top 10 Inadimplentes</CardTitle></CardHeader>
              <CardContent>
                {data.clientes?.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={data.clientes.slice(0, 10)} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                      <XAxis type="number" stroke="#71717a" tickFormatter={(v) => `R$${(v/1000).toFixed(0)}k`} />
                      <YAxis dataKey="cliente" type="category" stroke="#71717a" width={100} fontSize={10} />
                      <Tooltip contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a' }} formatter={(v) => formatCurrency(v)} />
                      <Bar dataKey="valor_atrasado" fill="#ef4444" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : <div className="h-64 flex items-center justify-center text-zinc-500">Nenhum cliente inadimplente</div>}
              </CardContent>
            </Card>

            <Card className="bg-zinc-900 border-zinc-800">
              <CardHeader><CardTitle>Por Faixa de Atraso</CardTitle></CardHeader>
              <CardContent>
                {faixasData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie data={faixasData} dataKey="valor" nameKey="faixa" cx="50%" cy="50%" outerRadius={100} label={({ faixa, percent }) => `${faixa} ${(percent * 100).toFixed(0)}%`}>
                        {faixasData.map((_, idx) => <Cell key={idx} fill={COLORS[idx % COLORS.length]} />)}
                      </Pie>
                      <Tooltip contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a' }} formatter={(v) => formatCurrency(v)} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : <div className="h-64 flex items-center justify-center text-zinc-500">Sem dados</div>}
              </CardContent>
            </Card>
          </div>

          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader><CardTitle>Ranking Completo</CardTitle></CardHeader>
            <CardContent>
              <ReportTable columns={columns} data={data.clientes || []} emptyMessage="Nenhum cliente inadimplente" />
            </CardContent>
          </Card>
        </>
      )}
    </ReportLayout>
  );
};

export default RelClientesInadimplencia;
