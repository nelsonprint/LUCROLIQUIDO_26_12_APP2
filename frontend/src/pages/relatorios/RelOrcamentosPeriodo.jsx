import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ReportLayout, KPICard, ReportTable, exportToExcel } from '@/components/ReportLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { axiosInstance } from '../../App';
import { toast } from 'sonner';
import { FileText, DollarSign, TrendingUp, Calendar, Hash } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, LineChart, Line } from 'recharts';

const RelOrcamentosPeriodo = ({ user, onLogout }) => {
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);
  const [periodo, setPeriodo] = useState(searchParams.get('periodo') || 'ano');
  const company = JSON.parse(localStorage.getItem('company') || '{}');

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axiosInstance.get(`/relatorios/orcamentos-periodo/${company.id}`, { params: { periodo } });
      setData(response.data);
    } catch (err) {
      setError('Erro ao carregar dados.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (company.id) fetchData(); }, [periodo, company.id]);

  const formatCurrency = (value) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0);

  const handleExportExcel = () => {
    if (!data?.orcamentos) return;
    exportToExcel(data.orcamentos, [
      { key: 'numero', label: 'Número' },
      { key: 'cliente', label: 'Cliente' },
      { key: 'data', label: 'Data' },
      { key: 'valor', label: 'Valor' },
      { key: 'status', label: 'Status' },
    ], 'orcamentos_periodo');
    toast.success('Exportado!');
  };

  const columns = [
    { key: 'numero', label: 'Nº' },
    { key: 'cliente', label: 'Cliente' },
    { key: 'data', label: 'Data', render: (val) => val ? new Date(val).toLocaleDateString('pt-BR') : '-' },
    { key: 'valor', label: 'Valor', align: 'right', render: (val) => formatCurrency(val) },
    { key: 'status', label: 'Status', render: (val) => {
      const colors = { 'aprovado': 'bg-green-500/20 text-green-400', 'enviado': 'bg-blue-500/20 text-blue-400', 'rascunho': 'bg-zinc-500/20 text-zinc-400', 'perdido': 'bg-red-500/20 text-red-400' };
      return <Badge className={colors[val] || 'bg-zinc-500/20'}>{val}</Badge>;
    }},
  ];

  return (
    <ReportLayout
      user={user}
      onLogout={onLogout}
      title="Orçamentos por Período"
      subtitle="Quantidade, valor e variação mensal"
      icon={FileText}
      iconColor="text-orange-400"
      iconBg="bg-orange-500/10"
      loading={loading}
      error={error}
      onRetry={fetchData}
      onExportExcel={handleExportExcel}
      reportId="orcamentos-periodo"
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
            <KPICard title="Total Orçamentos" value={data.resumo?.quantidade || 0} icon={Hash} color="text-blue-400" />
            <KPICard title="Valor Total" value={formatCurrency(data.resumo?.valor_total)} icon={DollarSign} color="text-green-400" />
            <KPICard title="Ticket Médio" value={formatCurrency(data.resumo?.ticket_medio)} icon={TrendingUp} color="text-purple-400" />
            <KPICard title="Variação Mês" value={`${data.resumo?.variacao >= 0 ? '+' : ''}${(data.resumo?.variacao || 0).toFixed(1)}%`} icon={Calendar} color={data.resumo?.variacao >= 0 ? 'text-green-400' : 'text-red-400'} />
          </div>

          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader><CardTitle>Evolução Mensal</CardTitle></CardHeader>
            <CardContent>
              {data.evolucao?.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={data.evolucao}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                    <XAxis dataKey="mes" stroke="#71717a" fontSize={11} />
                    <YAxis yAxisId="left" stroke="#71717a" tickFormatter={(v) => `R$${(v/1000).toFixed(0)}k`} />
                    <YAxis yAxisId="right" orientation="right" stroke="#71717a" />
                    <Tooltip contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a' }} formatter={(v, name) => name === 'valor' ? formatCurrency(v) : v} />
                    <Legend />
                    <Bar yAxisId="left" dataKey="valor" name="Valor" fill="#22c55e" radius={[4, 4, 0, 0]} />
                    <Line yAxisId="right" type="monotone" dataKey="quantidade" name="Qtd" stroke="#3b82f6" strokeWidth={2} />
                  </BarChart>
                </ResponsiveContainer>
              ) : <div className="h-64 flex items-center justify-center text-zinc-500">Sem dados</div>}
            </CardContent>
          </Card>

          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader><CardTitle>Lista de Orçamentos</CardTitle></CardHeader>
            <CardContent>
              <ReportTable columns={columns} data={data.orcamentos || []} emptyMessage="Nenhum orçamento no período" />
            </CardContent>
          </Card>
        </>
      )}
    </ReportLayout>
  );
};

export default RelOrcamentosPeriodo;
