import React, { useState, useEffect } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { SubscriptionCard } from '@/components/SubscriptionCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { axiosInstance } from '../App';
import { toast } from 'sonner';
import { Plus, Edit, Trash2, Filter, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

const ContasPagar = ({ user, onLogout }) => {
  const [contas, setContas] = useState([]);
  const [filteredContas, setFilteredContas] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [fornecedores, setFornecedores] = useState([]);
  const [showDialog, setShowDialog] = useState(false);
  const [editingConta, setEditingConta] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterCategoria, setFilterCategoria] = useState('all');
  const [loading, setLoading] = useState(false);
  const [selectedContas, setSelectedContas] = useState([]);

  const [formData, setFormData] = useState({
    descricao: '',
    categoria: '',
    data_emissao: new Date().toISOString().slice(0, 10),
    data_vencimento: new Date().toISOString().slice(0, 10),
    valor: '',
    forma_pagamento: 'PIX',
    observacoes: '',
    fornecedor_id: '',
    fornecedor_nome: '',
  });

  const company = JSON.parse(localStorage.getItem('company') || '{}');

  useEffect(() => {
    fetchCategorias();
    fetchContas();
    fetchFornecedores();
  }, [selectedMonth, filterStatus, filterCategoria]);

  const fetchFornecedores = async () => {
    if (!company.id) return;
    try {
      const response = await axiosInstance.get(`/fornecedores/${company.id}?status=Ativo`);
      setFornecedores(response.data);
    } catch (error) {
      console.error('Erro ao carregar fornecedores:', error);
    }
  };

  const fetchCategorias = async () => {
    try {
      const response = await axiosInstance.get('/contas/categorias');
      setCategorias(response.data.pagar || []);
    } catch (error) {
      toast.error('Erro ao carregar categorias');
    }
  };

  const fetchContas = async () => {
    if (!company.id) return;

    try {
      let url = `/contas/pagar?company_id=${company.id}`;
      if (selectedMonth) url += `&mes=${selectedMonth}`;
      if (filterStatus !== 'all') url += `&status=${filterStatus}`;
      if (filterCategoria !== 'all') url += `&categoria=${filterCategoria}`;

      const response = await axiosInstance.get(url);
      setContas(response.data);
      setFilteredContas(response.data);
    } catch (error) {
      toast.error('Erro ao carregar contas a pagar');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const data = {
        company_id: company.id,
        user_id: (user?.id || user?.user_id),
        tipo: 'PAGAR',
        ...formData,
        valor: parseFloat(formData.valor),
      };

      if (editingConta) {
        await axiosInstance.put(`/contas/pagar/${editingConta.id}`, data);
        toast.success('Conta atualizada!');
      } else {
        await axiosInstance.post('/contas/pagar', data);
        toast.success('Conta criada!');
      }

      setShowDialog(false);
      resetForm();
      fetchContas();
    } catch (error) {
      toast.error('Erro ao salvar conta');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (conta) => {
    setEditingConta(conta);
    setFormData({
      descricao: conta.descricao,
      categoria: conta.categoria,
      data_emissao: conta.data_emissao,
      data_vencimento: conta.data_vencimento,
      valor: conta.valor.toString(),
      forma_pagamento: conta.forma_pagamento,
      observacoes: conta.observacoes || '',
      fornecedor_id: conta.fornecedor_id || '',
      fornecedor_nome: conta.fornecedor_nome || '',
    });
    setShowDialog(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Deseja realmente excluir esta conta?')) return;

    try {
      await axiosInstance.delete(`/contas/pagar/${id}`);
      toast.success('Conta excluída!');
      fetchContas();
    } catch (error) {
      toast.error('Erro ao excluir conta');
    }
  };

  const handleMarcarPago = async (conta) => {
    try {
      await axiosInstance.patch(`/contas/pagar/${conta.id}/status`, {
        status: 'PAGO',
        data_pagamento: new Date().toISOString().slice(0, 10),
      });
      toast.success('Conta marcada como paga!');
      fetchContas();
    } catch (error) {
      toast.error('Erro ao marcar como paga');
    }
  };

  const handleMarcarPagoEmLote = async () => {
    if (selectedContas.length === 0) {
      toast.error('Selecione pelo menos uma conta');
      return;
    }

    try {
      const promises = selectedContas.map((id) =>
        axiosInstance.patch(`/contas/pagar/${id}/status`, {
          status: 'PAGO',
          data_pagamento: new Date().toISOString().slice(0, 10),
        })
      );

      await Promise.all(promises);
      toast.success(`${selectedContas.length} conta(s) marcada(s) como paga(s)!`);
      setSelectedContas([]);
      fetchContas();
    } catch (error) {
      toast.error('Erro ao marcar contas como pagas');
    }
  };

  const resetForm = () => {
    setFormData({
      descricao: '',
      categoria: '',
      data_emissao: new Date().toISOString().slice(0, 10),
      data_vencimento: new Date().toISOString().slice(0, 10),
      valor: '',
      forma_pagamento: 'PIX',
      observacoes: '',
    });
    setEditingConta(null);
  };

  const getStatusBadge = (status) => {
    const variants = {
      PENDENTE: 'default',
      PAGO: 'success',
      ATRASADO: 'destructive',
      PARCIAL: 'warning',
    };

    const icons = {
      PENDENTE: <AlertCircle className="w-3 h-3 mr-1" />,
      PAGO: <CheckCircle className="w-3 h-3 mr-1" />,
      ATRASADO: <XCircle className="w-3 h-3 mr-1" />,
      PARCIAL: <AlertCircle className="w-3 h-3 mr-1" />,
    };

    return (
      <Badge variant={variants[status] || 'default'} className="flex items-center w-fit">
        {icons[status]}
        {status}
      </Badge>
    );
  };

  const handleSelectAll = (checked) => {
    if (checked) {
      const pendentes = filteredContas
        .filter((c) => c.status === 'PENDENTE' || c.status === 'ATRASADO')
        .map((c) => c.id);
      setSelectedContas(pendentes);
    } else {
      setSelectedContas([]);
    }
  };

  const handleSelectConta = (id, checked) => {
    if (checked) {
      setSelectedContas([...selectedContas, id]);
    } else {
      setSelectedContas(selectedContas.filter((cid) => cid !== id));
    }
  };

  const totalPendente = filteredContas
    .filter((c) => c.status === 'PENDENTE' || c.status === 'ATRASADO')
    .reduce((sum, c) => sum + c.valor, 0);

  const totalPago = filteredContas
    .filter((c) => c.status === 'PAGO')
    .reduce((sum, c) => sum + c.valor, 0);

  return (
    <div className="flex min-h-screen bg-zinc-950 text-white">
      <Sidebar user={user} onLogout={onLogout} activePage="contas-pagar" />

      <div className="flex-1 p-8 ml-64">
        <div className="max-w-7xl mx-auto space-y-6">
          <SubscriptionCard user={user} />

          {/* Header */}
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold">Contas a Pagar</h1>
              <p className="text-zinc-400 mt-1">Gerencie suas contas e compromissos financeiros</p>
            </div>
            <Button
              onClick={() => {
                resetForm();
                setShowDialog(true);
              }}
              className="bg-red-600 hover:bg-red-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Nova Conta a Pagar
            </Button>
          </div>

          {/* KPIs */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="bg-zinc-900 border-zinc-800">
              <CardHeader>
                <CardTitle className="text-sm font-medium text-zinc-400">Pendente</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-500">
                  R$ {totalPendente.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </div>
                <p className="text-xs text-zinc-500 mt-1">
                  {filteredContas.filter((c) => c.status === 'PENDENTE' || c.status === 'ATRASADO').length} conta(s)
                </p>
              </CardContent>
            </Card>

            <Card className="bg-zinc-900 border-zinc-800">
              <CardHeader>
                <CardTitle className="text-sm font-medium text-zinc-400">Pago</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-500">
                  R$ {totalPago.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </div>
                <p className="text-xs text-zinc-500 mt-1">
                  {filteredContas.filter((c) => c.status === 'PAGO').length} conta(s)
                </p>
              </CardContent>
            </Card>

            <Card className="bg-zinc-900 border-zinc-800">
              <CardHeader>
                <CardTitle className="text-sm font-medium text-zinc-400">Total</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  R$ {(totalPendente + totalPago).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </div>
                <p className="text-xs text-zinc-500 mt-1">{filteredContas.length} conta(s)</p>
              </CardContent>
            </Card>
          </div>

          {/* Filtros */}
          <Card className="bg-zinc-900 border-zinc-800">
            <CardContent className="pt-6">
              <div className="flex flex-wrap gap-4">
                <div className="flex-1 min-w-[200px]">
                  <Label>Mês</Label>
                  <Input
                    type="month"
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(e.target.value)}
                    className="bg-zinc-800 border-zinc-700"
                  />
                </div>

                <div className="flex-1 min-w-[200px]">
                  <Label>Status</Label>
                  <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger className="bg-zinc-800 border-zinc-700">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      <SelectItem value="PENDENTE">Pendente</SelectItem>
                      <SelectItem value="PAGO">Pago</SelectItem>
                      <SelectItem value="ATRASADO">Atrasado</SelectItem>
                      <SelectItem value="PARCIAL">Parcial</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex-1 min-w-[200px]">
                  <Label>Categoria</Label>
                  <Select value={filterCategoria} onValueChange={setFilterCategoria}>
                    <SelectTrigger className="bg-zinc-800 border-zinc-700">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas</SelectItem>
                      {categorias.map((cat) => (
                        <SelectItem key={cat} value={cat}>
                          {cat}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {selectedContas.length > 0 && (
                <div className="mt-4 flex items-center gap-4">
                  <span className="text-sm text-zinc-400">
                    {selectedContas.length} conta(s) selecionada(s)
                  </span>
                  <Button onClick={handleMarcarPagoEmLote} size="sm" className="bg-green-600 hover:bg-green-700">
                    Marcar como Pago
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Tabela */}
          <Card className="bg-zinc-900 border-zinc-800">
            <CardContent className="pt-6">
              <Table>
                <TableHeader>
                  <TableRow className="border-zinc-800">
                    <TableHead className="w-[50px]">
                      <Checkbox
                        checked={selectedContas.length > 0}
                        onCheckedChange={handleSelectAll}
                      />
                    </TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead>Vencimento</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Pagamento</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredContas.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center text-zinc-500 py-8">
                        Nenhuma conta encontrada
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredContas.map((conta) => (
                      <TableRow key={conta.id} className="border-zinc-800">
                        <TableCell>
                          {(conta.status === 'PENDENTE' || conta.status === 'ATRASADO') && (
                            <Checkbox
                              checked={selectedContas.includes(conta.id)}
                              onCheckedChange={(checked) => handleSelectConta(conta.id, checked)}
                            />
                          )}
                        </TableCell>
                        <TableCell className="font-medium">{conta.descricao}</TableCell>
                        <TableCell>{conta.categoria}</TableCell>
                        <TableCell>
                          {new Date(conta.data_vencimento + 'T00:00:00').toLocaleDateString('pt-BR')}
                        </TableCell>
                        <TableCell className="font-medium text-red-500">
                          R$ {conta.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </TableCell>
                        <TableCell>{getStatusBadge(conta.status)}</TableCell>
                        <TableCell>{conta.forma_pagamento}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            {conta.status !== 'PAGO' && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleMarcarPago(conta)}
                                className="border-green-600 text-green-600 hover:bg-green-600 hover:text-white"
                              >
                                <CheckCircle className="w-4 h-4" />
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleEdit(conta)}
                              className="border-zinc-700"
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDelete(conta.id)}
                              className="border-red-600 text-red-600 hover:bg-red-600 hover:text-white"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Dialog de Criar/Editar */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="bg-zinc-900 border-zinc-800 text-white max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingConta ? 'Editar Conta' : 'Nova Conta a Pagar'}</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label>Descrição *</Label>
              <Input
                required
                value={formData.descricao}
                onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                placeholder="Ex: Aluguel do escritório"
                className="bg-zinc-800 border-zinc-700"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Categoria *</Label>
                <Select
                  required
                  value={formData.categoria}
                  onValueChange={(value) => setFormData({ ...formData, categoria: value })}
                >
                  <SelectTrigger className="bg-zinc-800 border-zinc-700">
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    {categorias.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Valor *</Label>
                <Input
                  required
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.valor}
                  onChange={(e) => setFormData({ ...formData, valor: e.target.value })}
                  placeholder="0.00"
                  className="bg-zinc-800 border-zinc-700"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Data de Emissão *</Label>
                <Input
                  required
                  type="date"
                  value={formData.data_emissao}
                  onChange={(e) => setFormData({ ...formData, data_emissao: e.target.value })}
                  className="bg-zinc-800 border-zinc-700"
                />
              </div>

              <div>
                <Label>Data de Vencimento *</Label>
                <Input
                  required
                  type="date"
                  value={formData.data_vencimento}
                  onChange={(e) => setFormData({ ...formData, data_vencimento: e.target.value })}
                  className="bg-zinc-800 border-zinc-700"
                />
              </div>
            </div>

            <div>
              <Label>Forma de Pagamento *</Label>
              <Select
                required
                value={formData.forma_pagamento}
                onValueChange={(value) => setFormData({ ...formData, forma_pagamento: value })}
              >
                <SelectTrigger className="bg-zinc-800 border-zinc-700">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PIX">PIX</SelectItem>
                  <SelectItem value="Boleto">Boleto</SelectItem>
                  <SelectItem value="Cartão">Cartão</SelectItem>
                  <SelectItem value="Dinheiro">Dinheiro</SelectItem>
                  <SelectItem value="Transferência">Transferência</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Observações</Label>
              <Textarea
                value={formData.observacoes}
                onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                placeholder="Observações adicionais..."
                className="bg-zinc-800 border-zinc-700"
                rows={3}
              />
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowDialog(false);
                  resetForm();
                }}
                className="border-zinc-700"
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={loading} className="bg-red-600 hover:bg-red-700">
                {loading ? 'Salvando...' : editingConta ? 'Atualizar' : 'Criar'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ContasPagar;