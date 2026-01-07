import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ReportLayout, KPICard, ReportTable, exportToExcel } from '@/components/ReportLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { axiosInstance } from '../../App';
import { toast } from 'sonner';
import {
  TrendingUp, TrendingDown, AlertTriangle, Calendar, DollarSign,
  ArrowUpCircle, ArrowDownCircle, Wallet
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  ReferenceLine, ComposedChart, Bar, Line
} from 'recharts';

const RelFluxoProjetado = ({ user, onLogout }) => {
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);
  const [dias, setDias] = useState('30');
  const company = JSON.parse(localStorage.getItem('company') || '{}');

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axiosInstance.get(`/relatorios/fluxo-projetado/${company.id}`, {
        params: { dias: parseInt(dias) }
      });
      setData(response.data);
    } catch (err) {
      console.error('Erro ao carregar relatório:', err);
      setError('Erro ao carregar dados. Verifique sua conexão.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (company.id) fetchData();
  }, [dias, company.id]);

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value || 0);
  };

  const handleExportExcel = () => {
    if (!data?.projecao) return;
    exportToExcel(
      data.projecao,
      [
        { key: 'data', label: 'Data' },
        { key: 'entradas', label: 'Entradas' },
        { key: 'saidas', label: 'Saídas' },
        { key: 'saldo', label: 'Saldo' },
      ],
      'fluxo_caixa_projetado'
    );
    toast.success('Exportado com sucesso!');
  };

  const columnsEntradas = [
    { key: 'data_vencimento', label: 'Data', render: (val) => val ? new Date(val).toLocaleDateString('pt-BR') : '-' },
    { key: 'descricao', label: 'Descrição' },
    { key: 'cliente', label: 'Cliente' },
    { key: 'valor', label: 'Valor', align: 'right', render: (val) => <span className="text-green-400">{formatCurrency(val)}</span> },
    { 
      key: 'status', 
      label: 'Status',
      render: (val) => {
        const isAtrasado = val === 'ATRASADO';
        return <Badge className={isAtrasado ? 'bg-red-500/20 text-red-400' : 'bg-yellow-500/20 text-yellow-400'}>{val}</Badge>;
      }
    },
  ];

  const columnsSaidas = [
    { key: 'data_vencimento', label: 'Data', render: (val) => val ? new Date(val).toLocaleDateString('pt-BR') : '-' },
    { key: 'descricao', label: 'Descrição' },
    { key: 'fornecedor', label: 'Fornecedor' },
    { key: 'valor', label: 'Valor', align: 'right', render: (val) => <span className="text-red-400">{formatCurrency(val)}</span> },
    { 
      key: 'status', 
      label: 'Status',
      render: (val) => {
        const isAtrasado = val === 'ATRASADO';
        return <Badge className={isAtrasado ? 'bg-red-500/20 text-red-400' : 'bg-yellow-500/20 text-yellow-400'}>{val}</Badge>;
      }
    },
  ];

  // Encontrar dias com saldo negativo
  const diasNegativos = data?.projecao?.filter(d => d.saldo < 0) || [];

  return (
    <ReportLayout
      user={user}
      onLogout={onLogout}
      title="Fluxo de Caixa Projetado"
      subtitle="Projeção de entradas, saídas e saldo"
      icon={TrendingUp}
      iconColor="text-blue-400"
      iconBg="bg-blue-500/10"
      loading={loading}
      error={error}
      onRetry={fetchData}
      onExportExcel={handleExportExcel}
      reportId="fluxo-projetado"
      filters={
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-zinc-500" />
            <Select value={dias} onValueChange={setDias}>
              <SelectTrigger className="w-[150px] bg-zinc-800 border-zinc-700">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="30">30 dias</SelectItem>
                <SelectItem value="60">60 dias</SelectItem>
                <SelectItem value="90">90 dias</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button variant="outline" size="sm" onClick={fetchData} className="border-zinc-700">
            Atualizar
          </Button>
        </div>
      }
    >
      {data && (
        <>
          {/* KPIs */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <KPICard
              title="Saldo Atual"
              value={formatCurrency(data.resumo?.saldo_atual)}
              icon={Wallet}
              color={data.resumo?.saldo_atual >= 0 ? 'text-green-400' : 'text-red-400'}
            />
            <KPICard
              title="Entradas Previstas"
              value={formatCurrency(data.resumo?.total_entradas)}
              subtitle={`${data.resumo?.qtd_entradas || 0} recebíveis`}
              icon={ArrowUpCircle}
              color="text-green-400"
            />
            <KPICard
              title="Saídas Previstas"
              value={formatCurrency(data.resumo?.total_saidas)}
              subtitle={`${data.resumo?.qtd_saidas || 0} pagamentos`}
              icon={ArrowDownCircle}
              color="text-red-400"
            />
            <KPICard
              title="Saldo Final Projetado"
              value={formatCurrency(data.resumo?.saldo_final)}
              icon={TrendingUp}
              color={data.resumo?.saldo_final >= 0 ? 'text-blue-400' : 'text-red-400'}
            />
            <KPICard
              title="Dias Negativos"
              value={diasNegativos.length}
              subtitle={diasNegativos.length > 0 ? 'Atenção!' : 'Nenhum'}
              icon={AlertTriangle}
              color={diasNegativos.length > 0 ? 'text-red-400' : 'text-green-400'}
            />
          </div>

          {/* Alerta de dias negativos */}
          {diasNegativos.length > 0 && (
            <Card className="bg-red-500/10 border-red-500/30">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="w-6 h-6 text-red-400" />
                  <div>
                    <p className="font-semibold text-red-400">Alerta: Saldo Negativo Projetado</p>
                    <p className="text-sm text-zinc-400">
                      {diasNegativos.length} dia(s) com saldo negativo nos próximos {dias} dias. 
                      Primeiro dia: {diasNegativos[0]?.data ? new Date(diasNegativos[0].data).toLocaleDateString('pt-BR') : '-'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Gráfico de Projeção */}
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader>
              <CardTitle className="text-lg">Projeção de Saldo</CardTitle>
            </CardHeader>
            <CardContent>
              {data.projecao && data.projecao.length > 0 ? (
                <ResponsiveContainer width="100%" height={350}>
                  <ComposedChart data={data.projecao}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                    <XAxis 
                      dataKey="data" 
                      stroke="#71717a" 
                      fontSize={11}
                      tickFormatter={(val) => {
                        const date = new Date(val);
                        return `${date.getDate()}/${date.getMonth() + 1}`;
                      }}
                    />
                    <YAxis stroke="#71717a" fontSize={12} tickFormatter={(v) => `R$${(v/1000).toFixed(0)}k`} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '8px' }}
                      labelFormatter={(val) => new Date(val).toLocaleDateString('pt-BR')}
                      formatter={(value, name) => [
                        formatCurrency(value),
                        name === 'saldo' ? 'Saldo' : name === 'entradas' ? 'Entradas' : 'Saídas'
                      ]}
                    />
                    <ReferenceLine y={0} stroke="#ef4444" strokeDasharray="5 5" />
                    <Bar dataKey="entradas" fill="#22c55e" opacity={0.6} radius={[2, 2, 0, 0]} />
                    <Bar dataKey="saidas" fill="#ef4444" opacity={0.6} radius={[2, 2, 0, 0]} />
                    <Line 
                      type="monotone" 
                      dataKey="saldo" 
                      stroke="#3b82f6" 
                      strokeWidth={2}
                      dot={{ fill: '#3b82f6', strokeWidth: 0, r: 3 }}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-64 flex items-center justify-center text-zinc-500">
                  Sem dados para projeção
                </div>
              )}
            </CardContent>
          </Card>

          {/* Listas de Entradas e Saídas */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Entradas (A Receber) */}
            <Card className="bg-zinc-900 border-zinc-800">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <ArrowUpCircle className="w-5 h-5 text-green-400" />
                  Entradas Previstas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ReportTable
                  columns={columnsEntradas}
                  data={data.entradas || []}
                  emptyMessage="Nenhuma entrada prevista"
                  pageSize={5}
                />
              </CardContent>
            </Card>

            {/* Saídas (A Pagar) */}
            <Card className="bg-zinc-900 border-zinc-800">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <ArrowDownCircle className="w-5 h-5 text-red-400" />
                  Saídas Previstas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ReportTable
                  columns={columnsSaidas}
                  data={data.saidas || []}
                  emptyMessage="Nenhuma saída prevista"
                  pageSize={5}
                />
              </CardContent>
            </Card>
          </div>

          {/* Contas Atrasadas */}
          {data.atrasados && data.atrasados.length > 0 && (
            <Card className="bg-zinc-900 border-zinc-800 border-l-4 border-l-red-500">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-red-400" />
                  Contas Atrasadas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ReportTable
                  columns={[
                    { key: 'tipo', label: 'Tipo', render: (val) => <Badge className={val === 'RECEBER' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}>{val}</Badge> },
                    { key: 'data_vencimento', label: 'Vencimento', render: (val) => val ? new Date(val).toLocaleDateString('pt-BR') : '-' },
                    { key: 'descricao', label: 'Descrição' },
                    { key: 'entidade', label: 'Cliente/Fornecedor' },
                    { key: 'valor', label: 'Valor', align: 'right', render: (val) => formatCurrency(val) },
                    { key: 'dias_atraso', label: 'Atraso', align: 'right', render: (val) => <span className="text-red-400">{val} dias</span> },
                  ]}
                  data={data.atrasados}
                  pageSize={10}
                />
              </CardContent>
            </Card>
          )}
        </>
      )}
    </ReportLayout>
  );
};

export default RelFluxoProjetado;
