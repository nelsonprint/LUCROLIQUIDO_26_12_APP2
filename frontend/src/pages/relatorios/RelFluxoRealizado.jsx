import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ReportLayout, KPICard, ReportTable, exportToExcel } from '@/components/ReportLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { axiosInstance } from '../../App';
import { toast } from 'sonner';
import { TrendingUp, TrendingDown, ArrowUpCircle, ArrowDownCircle, DollarSign, Calendar } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, LineChart, Line } from 'recharts';

const RelFluxoRealizado = ({ user, onLogout }) => {
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
      const response = await axiosInstance.get(`/relatorios/fluxo-realizado/${company.id}`, { params: { periodo } });
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
    if (!data?.movimentacoes) return;
    exportToExcel(data.movimentacoes, [
      { key: 'data', label: 'Data' },
      { key: 'entradas', label: 'Entradas' },
      { key: 'saidas', label: 'Saídas' },
      { key: 'saldo', label: 'Saldo' },
    ], 'fluxo_realizado');
    toast.success('Exportado!');
  };

  return (
    <ReportLayout
      user={user}
      onLogout={onLogout}
      title="Fluxo de Caixa Realizado"
      subtitle="Entradas e saídas efetivadas"
      icon={TrendingUp}
      iconColor="text-blue-400"
      iconBg="bg-blue-500/10"
      loading={loading}
      error={error}
      onRetry={fetchData}
      onExportExcel={handleExportExcel}
      reportId="fluxo-realizado"
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
            <KPICard title="Total Entradas" value={formatCurrency(data.resumo?.total_entradas)} icon={ArrowUpCircle} color="text-green-400" />
            <KPICard title="Total Saídas" value={formatCurrency(data.resumo?.total_saidas)} icon={ArrowDownCircle} color="text-red-400" />
            <KPICard title="Saldo Líquido" value={formatCurrency(data.resumo?.saldo_liquido)} icon={DollarSign} color={data.resumo?.saldo_liquido >= 0 ? 'text-green-400' : 'text-red-400'} />
            <KPICard title="Média Diária" value={formatCurrency(data.resumo?.media_diaria)} icon={Calendar} color="text-blue-400" />
          </div>

          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader><CardTitle>Evolução do Fluxo</CardTitle></CardHeader>
            <CardContent>
              {data.movimentacoes?.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={data.movimentacoes}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                    <XAxis dataKey="data" stroke="#71717a" fontSize={11} />
                    <YAxis stroke="#71717a" tickFormatter={(v) => `R$${(v/1000).toFixed(0)}k`} />
                    <Tooltip contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a' }} formatter={(v) => formatCurrency(v)} />
                    <Legend />
                    <Bar dataKey="entradas" name="Entradas" fill="#22c55e" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="saidas" name="Saídas" fill="#ef4444" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : <div className="h-64 flex items-center justify-center text-zinc-500">Sem movimentações no período</div>}
            </CardContent>
          </Card>
        </>
      )}
    </ReportLayout>
  );
};

export default RelFluxoRealizado;
