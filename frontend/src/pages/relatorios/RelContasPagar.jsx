import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { ReportLayout, KPICard, ReportTable, exportToExcel } from '@/components/ReportLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { axiosInstance } from '../../App';
import { toast } from 'sonner';
import {
  CreditCard, Calendar, TrendingDown, AlertTriangle, CheckCircle,
  Clock, DollarSign, Filter
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Cell
} from 'recharts';

const RelContasPagar = ({ user, onLogout }) => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);
  const [periodo, setPeriodo] = useState(searchParams.get('periodo') || 'mes');
  const [status, setStatus] = useState('todos');
  const [drilldownData, setDrilldownData] = useState(null);
  const [showDrilldown, setShowDrilldown] = useState(false);
  const company = JSON.parse(localStorage.getItem('company') || '{}');

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axiosInstance.get(`/relatorios/contas-pagar/${company.id}`, {
        params: { periodo, status: status !== 'todos' ? status : undefined }
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
  }, [periodo, status, company.id]);

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value || 0);
  };

  const handleRowClick = async (row) => {
    // Drill-down: abrir detalhes da conta
    setDrilldownData(row);
    setShowDrilldown(true);
  };

  const handleExportExcel = () => {
    if (!data?.contas) return;
    exportToExcel(
      data.contas,
      [
        { key: 'descricao', label: 'Descrição' },
        { key: 'fornecedor', label: 'Fornecedor' },
        { key: 'categoria', label: 'Categoria' },
        { key: 'data_vencimento', label: 'Vencimento' },
        { key: 'valor', label: 'Valor' },
        { key: 'status', label: 'Status' },
      ],
      'contas_pagar'
    );
    toast.success('Exportado com sucesso!');
  };

  const columns = [
    { key: 'data_vencimento', label: 'Vencimento', render: (val) => val ? new Date(val).toLocaleDateString('pt-BR') : '-' },
    { key: 'descricao', label: 'Descrição' },
    { key: 'fornecedor', label: 'Fornecedor' },
    { key: 'categoria', label: 'Categoria' },
    { 
      key: 'valor', 
      label: 'Valor', 
      align: 'right',
      render: (val) => formatCurrency(val) 
    },
    { 
      key: 'status', 
      label: 'Status',
      render: (val) => {
        const colors = {
          'PENDENTE': 'bg-yellow-500/20 text-yellow-400',
          'PAGO': 'bg-green-500/20 text-green-400',
          'ATRASADO': 'bg-red-500/20 text-red-400',
          'CANCELADO': 'bg-zinc-500/20 text-zinc-400',
        };
        return <Badge className={colors[val] || 'bg-zinc-500/20'}>{val}</Badge>;
      }
    },
  ];

  const chartColors = {
    'PENDENTE': '#eab308',
    'PAGO': '#22c55e',
    'ATRASADO': '#ef4444',
  };

  return (
    <ReportLayout
      user={user}
      onLogout={onLogout}
      title="Contas a Pagar por Período"
      subtitle="Visão geral de contas abertas, pagas e atrasadas"
      icon={CreditCard}
      iconColor="text-red-400"
      iconBg="bg-red-500/10"
      loading={loading}
      error={error}
      onRetry={fetchData}
      onExportExcel={handleExportExcel}
      reportId="pagar-periodo"
      filters={
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-zinc-500" />
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
          </div>

          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-zinc-500" />
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="w-[150px] bg-zinc-800 border-zinc-700">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                <SelectItem value="PENDENTE">Pendentes</SelectItem>
                <SelectItem value="PAGO">Pagos</SelectItem>
                <SelectItem value="ATRASADO">Atrasados</SelectItem>
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <KPICard
              title="Total a Pagar"
              value={formatCurrency(data.kpis?.total_pendente)}
              subtitle={`${data.kpis?.qtd_pendente || 0} contas`}
              icon={Clock}
              color="text-yellow-400"
            />
            <KPICard
              title="Total Pago"
              value={formatCurrency(data.kpis?.total_pago)}
              subtitle={`${data.kpis?.qtd_pago || 0} contas`}
              icon={CheckCircle}
              color="text-green-400"
            />
            <KPICard
              title="Total em Atraso"
              value={formatCurrency(data.kpis?.total_atrasado)}
              subtitle={`${data.kpis?.qtd_atrasado || 0} contas`}
              icon={AlertTriangle}
              color="text-red-400"
            />
            <KPICard
              title="Próximo Vencimento"
              value={data.kpis?.proximo_vencimento ? new Date(data.kpis.proximo_vencimento).toLocaleDateString('pt-BR') : '-'}
              subtitle={formatCurrency(data.kpis?.valor_proximo)}
              icon={Calendar}
              color="text-blue-400"
            />
          </div>

          {/* Gráfico */}
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader>
              <CardTitle className="text-lg">Evolução por Período</CardTitle>
            </CardHeader>
            <CardContent>
              {data.grafico && data.grafico.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={data.grafico}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                    <XAxis dataKey="periodo" stroke="#71717a" fontSize={12} />
                    <YAxis stroke="#71717a" fontSize={12} tickFormatter={(v) => `R$${(v/1000).toFixed(0)}k`} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '8px' }}
                      formatter={(value) => formatCurrency(value)}
                    />
                    <Legend />
                    <Bar dataKey="pendente" name="Pendente" fill="#eab308" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="pago" name="Pago" fill="#22c55e" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="atrasado" name="Atrasado" fill="#ef4444" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-64 flex items-center justify-center text-zinc-500">
                  Sem dados para o gráfico
                </div>
              )}
            </CardContent>
          </Card>

          {/* Tabela */}
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader>
              <CardTitle className="text-lg">Detalhamento</CardTitle>
            </CardHeader>
            <CardContent>
              <ReportTable
                columns={columns}
                data={data.contas || []}
                onRowClick={handleRowClick}
                emptyMessage="Nenhuma conta encontrada"
                emptyHint="Cadastre contas a pagar para visualizar o relatório"
              />
            </CardContent>
          </Card>

          {/* Drill-down Modal */}
          {showDrilldown && drilldownData && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowDrilldown(false)}>
              <Card className="bg-zinc-900 border-zinc-800 w-full max-w-lg m-4" onClick={(e) => e.stopPropagation()}>
                <CardHeader>
                  <CardTitle>Detalhes da Conta</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-zinc-500">Descrição</p>
                      <p className="font-medium">{drilldownData.descricao}</p>
                    </div>
                    <div>
                      <p className="text-xs text-zinc-500">Fornecedor</p>
                      <p className="font-medium">{drilldownData.fornecedor || '-'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-zinc-500">Categoria</p>
                      <p className="font-medium">{drilldownData.categoria || '-'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-zinc-500">Vencimento</p>
                      <p className="font-medium">{drilldownData.data_vencimento ? new Date(drilldownData.data_vencimento).toLocaleDateString('pt-BR') : '-'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-zinc-500">Valor</p>
                      <p className="font-medium text-lg">{formatCurrency(drilldownData.valor)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-zinc-500">Status</p>
                      <Badge className={drilldownData.status === 'PAGO' ? 'bg-green-500/20 text-green-400' : drilldownData.status === 'ATRASADO' ? 'bg-red-500/20 text-red-400' : 'bg-yellow-500/20 text-yellow-400'}>
                        {drilldownData.status}
                      </Badge>
                    </div>
                  </div>
                  {drilldownData.observacoes && (
                    <div>
                      <p className="text-xs text-zinc-500">Observações</p>
                      <p className="text-sm">{drilldownData.observacoes}</p>
                    </div>
                  )}
                  <div className="flex justify-end gap-2 pt-4">
                    <Button variant="outline" onClick={() => setShowDrilldown(false)} className="border-zinc-700">
                      Fechar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </>
      )}
    </ReportLayout>
  );
};

export default RelContasPagar;
