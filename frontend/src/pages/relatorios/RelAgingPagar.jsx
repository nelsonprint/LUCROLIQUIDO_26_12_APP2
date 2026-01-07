import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ReportLayout, KPICard, ReportTable, exportToExcel } from '@/components/ReportLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { axiosInstance } from '../../App';
import { toast } from 'sonner';
import { Clock, AlertTriangle, Calendar, DollarSign } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from 'recharts';

const RelAgingPagar = ({ user, onLogout }) => {
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);
  const [selectedFaixa, setSelectedFaixa] = useState(null);
  const company = JSON.parse(localStorage.getItem('company') || '{}');

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axiosInstance.get(`/relatorios/aging-pagar/${company.id}`);
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
  }, [company.id]);

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value || 0);
  };

  const handleExportExcel = () => {
    if (!data?.detalhes) return;
    const allContas = data.detalhes.flatMap(faixa => 
      faixa.contas.map(c => ({ ...c, faixa: faixa.faixa }))
    );
    exportToExcel(
      allContas,
      [
        { key: 'faixa', label: 'Faixa' },
        { key: 'descricao', label: 'Descrição' },
        { key: 'fornecedor', label: 'Fornecedor' },
        { key: 'data_vencimento', label: 'Vencimento' },
        { key: 'valor', label: 'Valor' },
        { key: 'dias_atraso', label: 'Dias Atraso' },
      ],
      'aging_contas_pagar'
    );
    toast.success('Exportado com sucesso!');
  };

  const columns = [
    { key: 'data_vencimento', label: 'Vencimento', render: (val) => val ? new Date(val).toLocaleDateString('pt-BR') : '-' },
    { key: 'descricao', label: 'Descrição' },
    { key: 'fornecedor', label: 'Fornecedor' },
    { key: 'valor', label: 'Valor', align: 'right', render: (val) => formatCurrency(val) },
    { key: 'dias_atraso', label: 'Dias Atraso', align: 'right', render: (val) => val > 0 ? <span className="text-red-400">{val}d</span> : <span className="text-green-400">Em dia</span> },
  ];

  const faixaColors = {
    'Vence Hoje': '#3b82f6',
    '1-7 dias': '#22c55e',
    '8-15 dias': '#eab308',
    '16-30 dias': '#f97316',
    '31-60 dias': '#ef4444',
    '60+ dias': '#dc2626',
    'Atrasado 1-7': '#f97316',
    'Atrasado 8-15': '#ef4444',
    'Atrasado 16-30': '#dc2626',
    'Atrasado 31-60': '#b91c1c',
    'Atrasado 60+': '#991b1b',
  };

  return (
    <ReportLayout
      user={user}
      onLogout={onLogout}
      title="Aging - Contas a Pagar"
      subtitle="Análise de envelhecimento das contas por faixa de vencimento"
      icon={Clock}
      iconColor="text-red-400"
      iconBg="bg-red-500/10"
      loading={loading}
      error={error}
      onRetry={fetchData}
      onExportExcel={handleExportExcel}
      reportId="pagar-aging"
    >
      {data && (
        <>
          {/* KPIs */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <KPICard
              title="Total em Aberto"
              value={formatCurrency(data.resumo?.total)}
              subtitle={`${data.resumo?.quantidade || 0} contas`}
              icon={DollarSign}
              color="text-yellow-400"
            />
            <KPICard
              title="A Vencer"
              value={formatCurrency(data.resumo?.a_vencer)}
              icon={Calendar}
              color="text-blue-400"
            />
            <KPICard
              title="Atrasado"
              value={formatCurrency(data.resumo?.atrasado)}
              icon={AlertTriangle}
              color="text-red-400"
            />
            <KPICard
              title="Maior Atraso"
              value={`${data.resumo?.maior_atraso || 0} dias`}
              icon={Clock}
              color="text-orange-400"
            />
          </div>

          {/* Gráfico de Barras Horizontais */}
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader>
              <CardTitle className="text-lg">Distribuição por Faixa de Vencimento</CardTitle>
            </CardHeader>
            <CardContent>
              {data.faixas && data.faixas.length > 0 ? (
                <ResponsiveContainer width="100%" height={350}>
                  <BarChart data={data.faixas} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                    <XAxis type="number" stroke="#71717a" fontSize={12} tickFormatter={(v) => `R$${(v/1000).toFixed(0)}k`} />
                    <YAxis dataKey="faixa" type="category" stroke="#71717a" fontSize={11} width={100} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '8px' }}
                      formatter={(value) => formatCurrency(value)}
                    />
                    <Bar 
                      dataKey="valor" 
                      radius={[0, 4, 4, 0]}
                      cursor="pointer"
                      onClick={(data) => setSelectedFaixa(data.faixa)}
                    >
                      {data.faixas.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={faixaColors[entry.faixa] || '#6366f1'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-64 flex items-center justify-center text-zinc-500">
                  Sem contas em aberto
                </div>
              )}
            </CardContent>
          </Card>

          {/* Tabela de Faixas com Drill-down */}
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Detalhamento por Faixa</CardTitle>
                {selectedFaixa && (
                  <Button variant="ghost" size="sm" onClick={() => setSelectedFaixa(null)}>
                    Limpar filtro
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {data.detalhes && data.detalhes.length > 0 ? (
                <div className="space-y-4">
                  {data.detalhes
                    .filter(faixa => !selectedFaixa || faixa.faixa === selectedFaixa)
                    .map((faixa, idx) => (
                      <div key={idx} className="border border-zinc-800 rounded-lg overflow-hidden">
                        <div 
                          className="p-3 bg-zinc-800/50 flex items-center justify-between cursor-pointer hover:bg-zinc-800"
                          onClick={() => setSelectedFaixa(selectedFaixa === faixa.faixa ? null : faixa.faixa)}
                        >
                          <div className="flex items-center gap-3">
                            <div 
                              className="w-3 h-3 rounded-full" 
                              style={{ backgroundColor: faixaColors[faixa.faixa] || '#6366f1' }}
                            />
                            <span className="font-medium">{faixa.faixa}</span>
                            <Badge variant="outline" className="border-zinc-700">
                              {faixa.contas.length} conta(s)
                            </Badge>
                          </div>
                          <span className="font-semibold">{formatCurrency(faixa.total)}</span>
                        </div>
                        {(selectedFaixa === faixa.faixa || !selectedFaixa) && faixa.contas.length > 0 && (
                          <div className="p-3">
                            <ReportTable
                              columns={columns}
                              data={faixa.contas}
                              searchable={false}
                              pageSize={5}
                            />
                          </div>
                        )}
                      </div>
                    ))}
                </div>
              ) : (
                <div className="text-center py-8 text-zinc-500">
                  Nenhuma conta em aberto
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </ReportLayout>
  );
};

export default RelAgingPagar;
