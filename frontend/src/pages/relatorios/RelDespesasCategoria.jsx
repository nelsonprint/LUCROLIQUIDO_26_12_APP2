import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ReportLayout, KPICard, ReportTable, exportToExcel } from '@/components/ReportLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { axiosInstance } from '../../App';
import { toast } from 'sonner';
import { PieChart as PieChartIcon, TrendingUp, Calendar, DollarSign, Tag } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, LineChart, Line
} from 'recharts';

const RelDespesasCategoria = ({ user, onLogout }) => {
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);
  const [periodo, setPeriodo] = useState(searchParams.get('periodo') || 'mes');
  const [tipo, setTipo] = useState('todas'); // comercial, administrativa, todas
  const company = JSON.parse(localStorage.getItem('company') || '{}');

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axiosInstance.get(`/relatorios/despesas-categoria/${company.id}`, {
        params: { periodo, tipo: tipo !== 'todas' ? tipo : undefined }
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
  }, [periodo, tipo, company.id]);

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value || 0);
  };

  const handleExportExcel = () => {
    if (!data?.categorias) return;
    exportToExcel(
      data.categorias,
      [
        { key: 'categoria', label: 'Categoria' },
        { key: 'tipo', label: 'Tipo' },
        { key: 'valor', label: 'Valor' },
        { key: 'percentual', label: '% do Total' },
        { key: 'quantidade', label: 'Qtd Lançamentos' },
      ],
      'despesas_por_categoria'
    );
    toast.success('Exportado com sucesso!');
  };

  const columns = [
    { 
      key: 'categoria', 
      label: 'Categoria',
      render: (val, row) => (
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: row.cor || '#6366f1' }} />
          {val || 'Sem categoria'}
        </div>
      )
    },
    { 
      key: 'tipo', 
      label: 'Tipo',
      render: (val) => (
        <Badge className={val === 'comercial' ? 'bg-blue-500/20 text-blue-400' : 'bg-purple-500/20 text-purple-400'}>
          {val === 'comercial' ? 'Comercial' : 'Administrativa'}
        </Badge>
      )
    },
    { key: 'valor', label: 'Valor', align: 'right', render: (val) => formatCurrency(val) },
    { key: 'percentual', label: '%', align: 'right', render: (val) => `${(val || 0).toFixed(1)}%` },
    { key: 'quantidade', label: 'Qtd', align: 'right' },
  ];

  const COLORS = ['#6366f1', '#ec4899', '#f97316', '#eab308', '#22c55e', '#14b8a6', '#3b82f6', '#8b5cf6', '#ef4444', '#64748b'];

  return (
    <ReportLayout
      user={user}
      onLogout={onLogout}
      title="Despesas por Categoria"
      subtitle="Top 10 categorias de despesas + tendência"
      icon={PieChartIcon}
      iconColor="text-red-400"
      iconBg="bg-red-500/10"
      loading={loading}
      error={error}
      onRetry={fetchData}
      onExportExcel={handleExportExcel}
      reportId="despesas-categoria"
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
            <Tag className="w-4 h-4 text-zinc-500" />
            <Select value={tipo} onValueChange={setTipo}>
              <SelectTrigger className="w-[150px] bg-zinc-800 border-zinc-700">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Todas</SelectItem>
                <SelectItem value="comercial">Comercial</SelectItem>
                <SelectItem value="administrativa">Administrativa</SelectItem>
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
              title="Total Despesas"
              value={formatCurrency(data.resumo?.total)}
              subtitle={`${data.resumo?.quantidade || 0} lançamentos`}
              icon={DollarSign}
              color="text-red-400"
            />
            <KPICard
              title="Despesas Comerciais"
              value={formatCurrency(data.resumo?.comercial)}
              icon={TrendingUp}
              color="text-blue-400"
            />
            <KPICard
              title="Despesas Administrativas"
              value={formatCurrency(data.resumo?.administrativa)}
              icon={Tag}
              color="text-purple-400"
            />
            <KPICard
              title="Maior Categoria"
              value={data.resumo?.maior_categoria || '-'}
              subtitle={formatCurrency(data.resumo?.maior_valor)}
              icon={PieChartIcon}
              color="text-orange-400"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Gráfico de Pizza - Top 10 */}
            <Card className="bg-zinc-900 border-zinc-800">
              <CardHeader>
                <CardTitle className="text-lg">Top 10 Categorias</CardTitle>
              </CardHeader>
              <CardContent>
                {data.categorias && data.categorias.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={data.categorias.slice(0, 10).filter(c => c.categoria)}
                        dataKey="valor"
                        nameKey="categoria"
                        cx="50%"
                        cy="50%"
                        outerRadius={100}
                        label={({ categoria, percentual }) => `${(categoria || 'Sem categoria').slice(0, 10)}... ${percentual?.toFixed(0)}%`}
                        labelLine={false}
                      >
                        {data.categorias.slice(0, 10).filter(c => c.categoria).map((entry, index) => (
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
                    Sem despesas no período
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Gráfico de Tendência - Últimos 12 meses */}
            <Card className="bg-zinc-900 border-zinc-800">
              <CardHeader>
                <CardTitle className="text-lg">Tendência (12 meses)</CardTitle>
              </CardHeader>
              <CardContent>
                {data.tendencia && data.tendencia.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={data.tendencia}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                      <XAxis dataKey="mes" stroke="#71717a" fontSize={11} />
                      <YAxis stroke="#71717a" fontSize={12} tickFormatter={(v) => `R$${(v/1000).toFixed(0)}k`} />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '8px' }}
                        formatter={(value) => formatCurrency(value)}
                      />
                      <Legend />
                      <Line type="monotone" dataKey="comercial" name="Comercial" stroke="#3b82f6" strokeWidth={2} dot={{ r: 3 }} />
                      <Line type="monotone" dataKey="administrativa" name="Administrativa" stroke="#8b5cf6" strokeWidth={2} dot={{ r: 3 }} />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-64 flex items-center justify-center text-zinc-500">
                    Sem dados históricos
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Tabela */}
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader>
              <CardTitle className="text-lg">Detalhamento por Categoria</CardTitle>
            </CardHeader>
            <CardContent>
              <ReportTable
                columns={columns}
                data={data.categorias || []}
                emptyMessage="Nenhuma despesa encontrada"
                emptyHint="Cadastre lançamentos de despesa para visualizar o relatório"
              />
            </CardContent>
          </Card>
        </>
      )}
    </ReportLayout>
  );
};

export default RelDespesasCategoria;
