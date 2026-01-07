import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ReportLayout, KPICard, ReportTable, exportToExcel } from '@/components/ReportLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { axiosInstance } from '../../App';
import { toast } from 'sonner';
import { FileText, DollarSign, TrendingUp, TrendingDown, Percent, Package } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, LineChart, Line } from 'recharts';

const RelDREGerencial = ({ user, onLogout }) => {
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
      let meses = 1;
      if (periodo === 'trimestre') meses = 3;
      if (periodo === 'ano') meses = 12;
      const response = await axiosInstance.get(`/dashboard/dre/${company.id}`, { params: { meses } });
      setData(response.data);
    } catch (err) {
      setError('Erro ao carregar dados.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (company.id) fetchData(); }, [periodo, company.id]);

  const formatCurrency = (value) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0);

  const mes = data?.mes_atual || {};

  const dreLinhas = [
    { conta: 'RECEITA BRUTA', valor: mes.receita_bruta, style: 'font-bold' },
    { conta: '  Receita de Serviços', valor: mes.receita_servicos || mes.receita_bruta * 0.7 },
    { conta: '  Receita de Materiais', valor: mes.receita_materiais || mes.receita_bruta * 0.3 },
    { conta: '(-) Impostos sobre Vendas', valor: -mes.impostos_sobre_vendas, style: 'text-red-400' },
    { conta: '(=) RECEITA LÍQUIDA', valor: mes.receita_liquida, style: 'font-bold text-green-400' },
    { conta: '(-) CSP (Custo Serviços Prestados)', valor: -mes.csp, style: 'text-orange-400' },
    { conta: '(-) CMV (Custo Materiais Vendidos)', valor: -(mes.cmv || 0), style: 'text-orange-400' },
    { conta: '(=) LUCRO BRUTO', valor: mes.lucro_bruto, style: 'font-bold' },
    { conta: '(-) Despesas Operacionais', valor: -mes.despesas_operacionais, style: 'text-red-400' },
    { conta: '  Despesas Comerciais', valor: -(mes.despesas_comerciais || mes.despesas_operacionais * 0.4), style: 'text-zinc-400' },
    { conta: '  Despesas Administrativas', valor: -(mes.despesas_administrativas || mes.despesas_operacionais * 0.6), style: 'text-zinc-400' },
    { conta: '(=) RESULTADO OPERACIONAL', valor: mes.resultado_operacional, style: 'font-bold' },
    { conta: '(=) LUCRO LÍQUIDO', valor: mes.lucro_liquido, style: 'font-bold text-xl ' + (mes.lucro_liquido >= 0 ? 'text-green-400' : 'text-red-400') },
  ];

  return (
    <ReportLayout
      user={user}
      onLogout={onLogout}
      title="DRE Gerencial"
      subtitle="Demonstração do Resultado - Serviços + Materiais"
      icon={FileText}
      iconColor="text-purple-400"
      iconBg="bg-purple-500/10"
      loading={loading}
      error={error}
      onRetry={fetchData}
      reportId="dre-gerencial"
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
            <KPICard title="Receita Líquida" value={formatCurrency(mes.receita_liquida)} icon={DollarSign} color="text-green-400" />
            <KPICard title="Lucro Líquido" value={formatCurrency(mes.lucro_liquido)} icon={TrendingUp} color={mes.lucro_liquido >= 0 ? 'text-green-400' : 'text-red-400'} />
            <KPICard title="Margem Líquida" value={`${(mes.margem_liquida || 0).toFixed(1)}%`} icon={Percent} color="text-blue-400" />
            <KPICard title="CSP %" value={`${(mes.csp_percentual || 0).toFixed(1)}%`} icon={Package} color="text-orange-400" />
          </div>

          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader><CardTitle>DRE Detalhada</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-2">
                {dreLinhas.map((linha, idx) => (
                  <div key={idx} className={`flex justify-between py-2 px-3 rounded ${linha.style || ''} ${linha.conta.startsWith('(=)') ? 'bg-zinc-800/50 border-t border-zinc-700' : ''}`}>
                    <span>{linha.conta}</span>
                    <span>{formatCurrency(Math.abs(linha.valor || 0))}{linha.valor < 0 && linha.conta.includes('(-)') ? '' : ''}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader><CardTitle>Evolução (12 meses)</CardTitle></CardHeader>
            <CardContent>
              {data.serie_historica?.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={data.serie_historica}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                    <XAxis dataKey="mes" stroke="#71717a" fontSize={11} />
                    <YAxis stroke="#71717a" tickFormatter={(v) => `R$${(v/1000).toFixed(0)}k`} />
                    <Tooltip contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a' }} formatter={(v) => formatCurrency(v)} />
                    <Legend />
                    <Line type="monotone" dataKey="receita_liquida" name="Receita Líq." stroke="#22c55e" strokeWidth={2} />
                    <Line type="monotone" dataKey="lucro_liquido" name="Lucro Líq." stroke="#3b82f6" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              ) : <div className="h-64 flex items-center justify-center text-zinc-500">Sem dados históricos</div>}
            </CardContent>
          </Card>
        </>
      )}
    </ReportLayout>
  );
};

export default RelDREGerencial;
