import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ReportLayout, KPICard, ReportTable, exportToExcel } from '@/components/ReportLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { axiosInstance } from '../../App';
import { toast } from 'sonner';
import { Truck, TrendingUp, Calendar, DollarSign, Award } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';

const RelFornecedoresRanking = ({ user, onLogout }) => {
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
      const response = await axiosInstance.get(`/relatorios/fornecedores-ranking/${company.id}`, {
        params: { periodo }
      });
      setData(response.data);
    } catch (err) {
      console.error('Erro ao carregar relatório:', err);
      setError('Erro ao carregar dados.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (company.id) fetchData();
  }, [periodo, company.id]);

  const formatCurrency = (value) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0);

  const handleExportExcel = () => {
    if (!data?.fornecedores) return;
    exportToExcel(data.fornecedores, [
      { key: 'posicao', label: 'Posição' },
      { key: 'nome', label: 'Fornecedor' },
      { key: 'total_pago', label: 'Total Pago' },
      { key: 'total_pendente', label: 'Pendente' },
      { key: 'quantidade', label: 'Qtd Compras' },
    ], 'ranking_fornecedores');
    toast.success('Exportado!');
  };

  const columns = [
    { key: 'posicao', label: '#', render: (val) => <span className="font-bold">{val}</span> },
    { key: 'nome', label: 'Fornecedor' },
    { key: 'total_pago', label: 'Total Pago', align: 'right', render: (val) => <span className="text-red-400">{formatCurrency(val)}</span> },
    { key: 'total_pendente', label: 'Pendente', align: 'right', render: (val) => val > 0 ? <span className="text-yellow-400">{formatCurrency(val)}</span> : '-' },
    { key: 'quantidade', label: 'Compras', align: 'right' },
  ];

  return (
    <ReportLayout
      user={user}
      onLogout={onLogout}
      title="Ranking de Fornecedores"
      subtitle="Top fornecedores por valor pago"
      icon={Truck}
      iconColor="text-red-400"
      iconBg="bg-red-500/10"
      loading={loading}
      error={error}
      onRetry={fetchData}
      onExportExcel={handleExportExcel}
      reportId="fornecedores-ranking"
      filters={
        <div className="flex gap-4 items-center">
          <Select value={periodo} onValueChange={setPeriodo}>
            <SelectTrigger className="w-[150px] bg-zinc-800 border-zinc-700">
              <SelectValue />
            </SelectTrigger>
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
            <KPICard title="Total Pago" value={formatCurrency(data.resumo?.total_pago)} icon={DollarSign} color="text-red-400" />
            <KPICard title="Fornecedores" value={data.resumo?.total_fornecedores || 0} icon={Truck} color="text-blue-400" />
            <KPICard title="Top 1" value={data.resumo?.top1_nome || '-'} subtitle={formatCurrency(data.resumo?.top1_valor)} icon={Award} color="text-yellow-400" />
            <KPICard title="Ticket Médio" value={formatCurrency(data.resumo?.ticket_medio)} icon={TrendingUp} color="text-green-400" />
          </div>

          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader><CardTitle>Top 10 Fornecedores</CardTitle></CardHeader>
            <CardContent>
              {data.fornecedores?.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={data.fornecedores.slice(0, 10)} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                    <XAxis type="number" stroke="#71717a" tickFormatter={(v) => `R$${(v/1000).toFixed(0)}k`} />
                    <YAxis dataKey="nome" type="category" stroke="#71717a" width={100} fontSize={10} />
                    <Tooltip contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a' }} formatter={(v) => formatCurrency(v)} />
                    <Bar dataKey="total_pago" fill="#ef4444" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : <div className="h-64 flex items-center justify-center text-zinc-500">Sem dados</div>}
            </CardContent>
          </Card>

          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader><CardTitle>Ranking Completo</CardTitle></CardHeader>
            <CardContent>
              <ReportTable columns={columns} data={data.fornecedores || []} emptyMessage="Nenhum fornecedor encontrado" />
            </CardContent>
          </Card>
        </>
      )}
    </ReportLayout>
  );
};

export default RelFornecedoresRanking;
