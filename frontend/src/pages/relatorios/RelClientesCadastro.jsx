import React, { useState, useEffect } from 'react';
import { ReportLayout, KPICard, ReportTable, exportToExcel } from '@/components/ReportLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { axiosInstance } from '../../App';
import { toast } from 'sonner';
import { Users, Search, Phone, Mail, Calendar, DollarSign } from 'lucide-react';

const RelClientesCadastro = ({ user, onLogout }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);
  const [status, setStatus] = useState('todos');
  const [search, setSearch] = useState('');
  const company = JSON.parse(localStorage.getItem('company') || '{}');

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axiosInstance.get(`/relatorios/clientes-cadastro/${company.id}`, { params: { status: status !== 'todos' ? status : undefined } });
      setData(response.data);
    } catch (err) {
      setError('Erro ao carregar dados.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (company.id) fetchData(); }, [status, company.id]);

  const formatCurrency = (value) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0);

  const handleExportExcel = () => {
    if (!data?.clientes) return;
    exportToExcel(data.clientes, [
      { key: 'nome', label: 'Nome' },
      { key: 'email', label: 'Email' },
      { key: 'telefone', label: 'Telefone' },
      { key: 'status', label: 'Status' },
      { key: 'ultima_compra', label: 'Última Compra' },
      { key: 'total_compras', label: 'Total Compras' },
    ], 'cadastro_clientes');
    toast.success('Exportado!');
  };

  const filteredClientes = (data?.clientes || []).filter(c => 
    c.nome?.toLowerCase().includes(search.toLowerCase()) ||
    c.email?.toLowerCase().includes(search.toLowerCase())
  );

  const columns = [
    { key: 'nome', label: 'Nome' },
    { key: 'email', label: 'Email', render: (val) => val || '-' },
    { key: 'telefone', label: 'Telefone', render: (val) => val || '-' },
    { key: 'status', label: 'Status', render: (val) => <Badge className={val === 'ativo' ? 'bg-green-500/20 text-green-400' : 'bg-zinc-500/20 text-zinc-400'}>{val}</Badge> },
    { key: 'ultima_compra', label: 'Última Compra', render: (val) => val ? new Date(val).toLocaleDateString('pt-BR') : '-' },
    { key: 'total_compras', label: 'Total', align: 'right', render: (val) => formatCurrency(val) },
  ];

  return (
    <ReportLayout
      user={user}
      onLogout={onLogout}
      title="Cadastro de Clientes"
      subtitle="Lista completa com filtros"
      icon={Users}
      iconColor="text-cyan-400"
      iconBg="bg-cyan-500/10"
      loading={loading}
      error={error}
      onRetry={fetchData}
      onExportExcel={handleExportExcel}
      reportId="clientes-cadastro"
      filters={
        <div className="flex gap-4 items-center">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <Input placeholder="Buscar cliente..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10 bg-zinc-800 border-zinc-700" />
          </div>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="w-[150px] bg-zinc-800 border-zinc-700"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos</SelectItem>
              <SelectItem value="ativo">Ativos</SelectItem>
              <SelectItem value="inativo">Inativos</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={fetchData} className="border-zinc-700">Atualizar</Button>
        </div>
      }
    >
      {data && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <KPICard title="Total Clientes" value={data.resumo?.total || 0} icon={Users} color="text-cyan-400" />
            <KPICard title="Ativos" value={data.resumo?.ativos || 0} icon={Users} color="text-green-400" />
            <KPICard title="Ticket Médio" value={formatCurrency(data.resumo?.ticket_medio)} icon={DollarSign} color="text-blue-400" />
            <KPICard title="Faturamento Total" value={formatCurrency(data.resumo?.faturamento_total)} icon={DollarSign} color="text-purple-400" />
          </div>

          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader><CardTitle>Lista de Clientes</CardTitle></CardHeader>
            <CardContent>
              <ReportTable columns={columns} data={filteredClientes} emptyMessage="Nenhum cliente encontrado" pageSize={15} />
            </CardContent>
          </Card>
        </>
      )}
    </ReportLayout>
  );
};

export default RelClientesCadastro;
