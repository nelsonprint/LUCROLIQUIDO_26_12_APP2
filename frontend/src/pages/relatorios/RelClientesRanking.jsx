import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ReportLayout, KPICard, ReportTable, exportToExcel } from '@/components/ReportLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { axiosInstance } from '../../App';
import { toast } from 'sonner';
import { Users, TrendingUp, Calendar, DollarSign, Award, Star } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';

const RelClientesRanking = ({ user, onLogout }) => {
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
      const response = await axiosInstance.get(`/relatorios/clientes-ranking/${company.id}`, {
        params: { periodo }
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
  }, [periodo, company.id]);

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value || 0);
  };

  const handleExportExcel = () => {
    if (!data?.clientes) return;
    exportToExcel(
      data.clientes,
      [
        { key: 'posicao', label: 'Posição' },
        { key: 'nome', label: 'Cliente' },
        { key: 'total_recebido', label: 'Total Recebido' },
        { key: 'total_pendente', label: 'Pendente' },
        { key: 'percentual', label: '% Receita' },
        { key: 'quantidade', label: 'Qtd Compras' },
      ],
      'ranking_clientes'
    );
    toast.success('Exportado com sucesso!');
  };

  const columns = [
    { 
      key: 'posicao', 
      label: '#',
      render: (val) => (
        <div className="flex items-center gap-1">
          {val <= 3 && <Award className={`w-4 h-4 ${val === 1 ? 'text-yellow-400' : val === 2 ? 'text-zinc-400' : 'text-orange-400'}`} />}
          <span className="font-bold">{val}</span>
        </div>
      )
    },
    { key: 'nome', label: 'Cliente' },
    { key: 'total_recebido', label: 'Total Recebido', align: 'right', render: (val) => <span className="text-green-400">{formatCurrency(val)}</span> },
    { key: 'total_pendente', label: 'Pendente', align: 'right', render: (val) => val > 0 ? <span className="text-yellow-400">{formatCurrency(val)}</span> : '-' },
    { key: 'percentual', label: '% Receita', align: 'right', render: (val) => `${(val || 0).toFixed(1)}%` },
    { key: 'quantidade', label: 'Compras', align: 'right' },
  ];

  const COLORS = ['#f59e0b', '#a1a1aa', '#ea580c', '#22c55e', '#3b82f6', '#8b5cf6', '#ec4899', '#14b8a6', '#6366f1', '#64748b'];

  return (
    <ReportLayout
      user={user}
      onLogout={onLogout}
      title="Ranking de Clientes"
      subtitle="Top clientes por receita e participação"
      icon={Users}
      iconColor="text-green-400"
      iconBg="bg-green-500/10"
      loading={loading}
      error={error}
      onRetry={fetchData}
      onExportExcel={handleExportExcel}
      reportId="clientes-ranking"
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
                <SelectItem value="todos">Todo Período</SelectItem>
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
              title="Receita Total"
              value={formatCurrency(data.resumo?.total_receita)}
              subtitle={`${data.resumo?.total_clientes || 0} clientes`}
              icon={DollarSign}
              color="text-green-400"
            />
            <KPICard
              title="Ticket Médio"
              value={formatCurrency(data.resumo?.ticket_medio)}
              icon={TrendingUp}
              color="text-blue-400"
            />
            <KPICard
              title="Top 1 Cliente"
              value={data.resumo?.top1_nome || '-'}
              subtitle={formatCurrency(data.resumo?.top1_valor)}
              icon={Award}
              color="text-yellow-400"
            />
            <KPICard
              title="Top 10 = % Receita"
              value={`${(data.resumo?.top10_percentual || 0).toFixed(1)}%`}
              subtitle="Concentração"
              icon={Star}
              color="text-purple-400"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Gráfico de Barras - Top 10 */}
            <Card className="bg-zinc-900 border-zinc-800">
              <CardHeader>
                <CardTitle className="text-lg">Top 10 Clientes</CardTitle>
              </CardHeader>
              <CardContent>
                {data.clientes && data.clientes.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={data.clientes.slice(0, 10)} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                      <XAxis type="number" stroke="#71717a" fontSize={12} tickFormatter={(v) => `R$${(v/1000).toFixed(0)}k`} />
                      <YAxis dataKey="nome" type="category" stroke="#71717a" fontSize={10} width={100} tickFormatter={(v) => v.length > 12 ? v.slice(0, 12) + '...' : v} />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '8px' }}
                        formatter={(value) => formatCurrency(value)}
                      />
                      <Bar dataKey="total_recebido" fill="#22c55e" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-64 flex items-center justify-center text-zinc-500">
                    Sem dados de clientes
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Gráfico de Pizza - Participação */}
            <Card className="bg-zinc-900 border-zinc-800">
              <CardHeader>
                <CardTitle className="text-lg">Participação na Receita</CardTitle>
              </CardHeader>
              <CardContent>
                {data.clientes && data.clientes.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={[
                          ...data.clientes.slice(0, 5).map(c => ({ name: c.nome, value: c.total_recebido })),
                          { name: 'Outros', value: data.clientes.slice(5).reduce((acc, c) => acc + c.total_recebido, 0) }
                        ].filter(d => d.value > 0)}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={100}
                        label={({ name, percent }) => `${name.slice(0, 8)}${name.length > 8 ? '...' : ''} ${(percent * 100).toFixed(0)}%`}
                        labelLine={false}
                      >
                        {data.clientes.slice(0, 6).map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '8px' }}
                        formatter={(value) => formatCurrency(value)}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-64 flex items-center justify-center text-zinc-500">
                    Sem dados de clientes
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Tabela */}
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader>
              <CardTitle className="text-lg">Ranking Completo</CardTitle>
            </CardHeader>
            <CardContent>
              <ReportTable
                columns={columns}
                data={data.clientes || []}
                emptyMessage="Nenhum cliente encontrado"
                emptyHint="Cadastre contas a receber vinculadas a clientes"
              />
            </CardContent>
          </Card>
        </>
      )}
    </ReportLayout>
  );
};

export default RelClientesRanking;
