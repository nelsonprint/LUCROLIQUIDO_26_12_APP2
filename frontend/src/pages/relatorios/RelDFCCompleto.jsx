import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ReportLayout, KPICard, ReportTable, exportToExcel } from '@/components/ReportLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { axiosInstance } from '../../App';
import { toast } from 'sonner';
import { Banknote, TrendingUp, TrendingDown, ArrowUpCircle, ArrowDownCircle, DollarSign } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Cell, ReferenceLine } from 'recharts';

const RelDFCCompleto = ({ user, onLogout }) => {
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
      const hoje = new Date();
      let inicio, fim;
      if (periodo === 'mes') {
        inicio = new Date(hoje.getFullYear(), hoje.getMonth(), 1).toISOString().split('T')[0];
        fim = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0).toISOString().split('T')[0];
      } else if (periodo === 'trimestre') {
        const trim = Math.floor(hoje.getMonth() / 3);
        inicio = new Date(hoje.getFullYear(), trim * 3, 1).toISOString().split('T')[0];
        fim = new Date(hoje.getFullYear(), trim * 3 + 3, 0).toISOString().split('T')[0];
      } else {
        inicio = `${hoje.getFullYear()}-01-01`;
        fim = `${hoje.getFullYear()}-12-31`;
      }
      const response = await axiosInstance.get(`/dfc/relatorio/${company.id}`, { params: { periodo_inicio: inicio, periodo_fim: fim } });
      setData(response.data);
    } catch (err) {
      setError('Erro ao carregar dados.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (company.id) fetchData(); }, [periodo, company.id]);

  const formatCurrency = (value) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0);

  const waterfallData = data?.waterfall || [];
  const getBarColor = (entry) => {
    if (entry.tipo === 'inicial' || entry.tipo === 'final') return '#6366f1';
    return entry.value >= 0 ? '#22c55e' : '#ef4444';
  };

  return (
    <ReportLayout
      user={user}
      onLogout={onLogout}
      title="DFC Completo"
      subtitle="Demonstração do Fluxo de Caixa - Método Indireto"
      icon={Banknote}
      iconColor="text-purple-400"
      iconBg="bg-purple-500/10"
      loading={loading}
      error={error}
      onRetry={fetchData}
      reportId="dfc-completo"
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
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <KPICard title="Saldo Inicial" value={formatCurrency(data.saldo_inicial)} icon={DollarSign} color="text-zinc-400" />
            <KPICard title="Operacional" value={formatCurrency(data.operacional?.liquido)} icon={data.operacional?.liquido >= 0 ? ArrowUpCircle : ArrowDownCircle} color={data.operacional?.liquido >= 0 ? 'text-green-400' : 'text-red-400'} />
            <KPICard title="Investimento" value={formatCurrency(data.investimento?.liquido)} icon={TrendingUp} color={data.investimento?.liquido >= 0 ? 'text-blue-400' : 'text-orange-400'} />
            <KPICard title="Financiamento" value={formatCurrency(data.financiamento?.liquido)} icon={Banknote} color={data.financiamento?.liquido >= 0 ? 'text-purple-400' : 'text-yellow-400'} />
            <KPICard title="Saldo Final" value={formatCurrency(data.saldo_final)} icon={DollarSign} color={data.saldo_final >= 0 ? 'text-green-400' : 'text-red-400'} />
          </div>

          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader><CardTitle>Gráfico Cascata (Waterfall)</CardTitle></CardHeader>
            <CardContent>
              {waterfallData.length > 0 ? (
                <ResponsiveContainer width="100%" height={350}>
                  <BarChart data={waterfallData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                    <XAxis dataKey="name" stroke="#71717a" fontSize={11} />
                    <YAxis stroke="#71717a" tickFormatter={(v) => `R$${(v/1000).toFixed(0)}k`} />
                    <Tooltip contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a' }} formatter={(v) => formatCurrency(v)} />
                    <ReferenceLine y={0} stroke="#ef4444" strokeDasharray="3 3" />
                    <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                      {waterfallData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={getBarColor(entry)} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : <div className="h-64 flex items-center justify-center text-zinc-500">Sem dados</div>}
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Operacional */}
            <Card className="bg-zinc-900 border-zinc-800 border-l-4 border-l-green-500">
              <CardHeader><CardTitle className="text-green-400">🏢 Operacional</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between"><span>Entradas</span><span className="text-green-400">{formatCurrency(data.operacional?.entradas)}</span></div>
                <div className="flex justify-between"><span>Saídas</span><span className="text-red-400">-{formatCurrency(data.operacional?.saidas)}</span></div>
                <div className="flex justify-between font-bold border-t border-zinc-700 pt-2"><span>Líquido</span><span className={data.operacional?.liquido >= 0 ? 'text-green-400' : 'text-red-400'}>{formatCurrency(data.operacional?.liquido)}</span></div>
              </CardContent>
            </Card>

            {/* Investimento */}
            <Card className="bg-zinc-900 border-zinc-800 border-l-4 border-l-blue-500">
              <CardHeader><CardTitle className="text-blue-400">🏦 Investimento</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between"><span>Entradas</span><span className="text-green-400">{formatCurrency(data.investimento?.entradas)}</span></div>
                <div className="flex justify-between"><span>Saídas</span><span className="text-red-400">-{formatCurrency(data.investimento?.saidas)}</span></div>
                <div className="flex justify-between font-bold border-t border-zinc-700 pt-2"><span>Líquido</span><span className={data.investimento?.liquido >= 0 ? 'text-blue-400' : 'text-orange-400'}>{formatCurrency(data.investimento?.liquido)}</span></div>
              </CardContent>
            </Card>

            {/* Financiamento */}
            <Card className="bg-zinc-900 border-zinc-800 border-l-4 border-l-purple-500">
              <CardHeader><CardTitle className="text-purple-400">💳 Financiamento</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between"><span>Entradas</span><span className="text-green-400">{formatCurrency(data.financiamento?.entradas)}</span></div>
                <div className="flex justify-between"><span>Saídas</span><span className="text-red-400">-{formatCurrency(data.financiamento?.saidas)}</span></div>
                <div className="flex justify-between font-bold border-t border-zinc-700 pt-2"><span>Líquido</span><span className={data.financiamento?.liquido >= 0 ? 'text-purple-400' : 'text-yellow-400'}>{formatCurrency(data.financiamento?.liquido)}</span></div>
              </CardContent>
            </Card>
          </div>

          <Card className="bg-gradient-to-r from-zinc-900 to-zinc-800 border-zinc-700">
            <CardContent className="p-6">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-zinc-400">Variação Líquida do Período</p>
                  <p className={`text-3xl font-bold ${data.variacao_liquida >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {data.variacao_liquida >= 0 ? '+' : ''}{formatCurrency(data.variacao_liquida)}
                  </p>
                </div>
                <div className="text-6xl">{data.variacao_liquida >= 0 ? '📈' : '📉'}</div>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </ReportLayout>
  );
};

export default RelDFCCompleto;
