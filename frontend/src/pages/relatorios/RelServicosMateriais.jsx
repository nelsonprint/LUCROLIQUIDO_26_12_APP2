import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ReportLayout, KPICard, ReportTable, exportToExcel } from '@/components/ReportLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { axiosInstance } from '../../App';
import { toast } from 'sonner';
import { Package, Wrench, DollarSign, Percent, PieChart as PieChartIcon } from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';

const RelServicosMateriais = ({ user, onLogout }) => {
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
      const response = await axiosInstance.get(`/relatorios/servicos-materiais/${company.id}`, { params: { periodo } });
      setData(response.data);
    } catch (err) {
      setError('Erro ao carregar dados.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (company.id) fetchData(); }, [periodo, company.id]);

  const formatCurrency = (value) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0);

  const COLORS = ['#22c55e', '#f97316'];
  const pieData = data ? [
    { name: 'Serviços', value: data.resumo?.valor_servicos || 0 },
    { name: 'Materiais', value: data.resumo?.valor_materiais || 0 }
  ].filter(d => d.value > 0) : [];

  return (
    <ReportLayout
      user={user}
      onLogout={onLogout}
      title="Serviços x Materiais"
      subtitle="Composição dos orçamentos"
      icon={PieChartIcon}
      iconColor="text-orange-400"
      iconBg="bg-orange-500/10"
      loading={loading}
      error={error}
      onRetry={fetchData}
      reportId="servicos-materiais"
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
            <KPICard title="Serviços" value={formatCurrency(data.resumo?.valor_servicos)} subtitle={`${(data.resumo?.percentual_servicos || 0).toFixed(1)}% do total`} icon={Wrench} color="text-green-400" />
            <KPICard title="Materiais" value={formatCurrency(data.resumo?.valor_materiais)} subtitle={`${(data.resumo?.percentual_materiais || 0).toFixed(1)}% do total`} icon={Package} color="text-orange-400" />
            <KPICard title="Valor Total" value={formatCurrency(data.resumo?.valor_total)} icon={DollarSign} color="text-blue-400" />
            <KPICard title="Margem Est. Materiais" value={`${(data.resumo?.margem_materiais || 0).toFixed(1)}%`} icon={Percent} color="text-purple-400" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-zinc-900 border-zinc-800">
              <CardHeader><CardTitle>Composição</CardTitle></CardHeader>
              <CardContent>
                {pieData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                        {pieData.map((_, idx) => <Cell key={idx} fill={COLORS[idx % COLORS.length]} />)}
                      </Pie>
                      <Tooltip contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a' }} formatter={(v) => formatCurrency(v)} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : <div className="h-64 flex items-center justify-center text-zinc-500">Sem dados</div>}
              </CardContent>
            </Card>

            <Card className="bg-zinc-900 border-zinc-800">
              <CardHeader><CardTitle>Evolução Mensal</CardTitle></CardHeader>
              <CardContent>
                {data.evolucao?.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={data.evolucao}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                      <XAxis dataKey="mes" stroke="#71717a" fontSize={11} />
                      <YAxis stroke="#71717a" tickFormatter={(v) => `R$${(v/1000).toFixed(0)}k`} />
                      <Tooltip contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a' }} formatter={(v) => formatCurrency(v)} />
                      <Legend />
                      <Bar dataKey="servicos" name="Serviços" fill="#22c55e" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="materiais" name="Materiais" fill="#f97316" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : <div className="h-64 flex items-center justify-center text-zinc-500">Sem dados</div>}
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </ReportLayout>
  );
};

export default RelServicosMateriais;
