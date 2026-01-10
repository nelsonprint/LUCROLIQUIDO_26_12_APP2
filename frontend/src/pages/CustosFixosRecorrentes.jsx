import React, { useState, useEffect } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { SubscriptionCard } from '@/components/SubscriptionCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { axiosInstance } from '../App';
import { toast } from 'sonner';
import { Plus, Edit, Trash2, Power, RefreshCw, Building2, DollarSign, Calendar, TrendingUp } from 'lucide-react';

const CATEGORIAS = [
  'Pessoas',
  'Estrutura',
  'Ferramentas/Softwares',
  'Impostos fixos',
  'Financeiro',
  'Veículos',
  'Marketing fixo',
  'Outros'
];

const CustosFixosRecorrentes = ({ user, onLogout }) => {
  const [custos, setCustos] = useState([]);
  const [showDialog, setShowDialog] = useState(false);
  const [editingCusto, setEditingCusto] = useState(null);
  const [loading, setLoading] = useState(false);
  const [gerando, setGerando] = useState(false);

  const [formData, setFormData] = useState({
    descricao: '',
    categoria: 'Estrutura',
    valor: '',
    tipo_recorrencia: 'mensal',
    dia_vencimento: '10',
    centro_custo: '',
    num_parcelas: '',
  });

  const company = JSON.parse(localStorage.getItem('company') || '{}');

  useEffect(() => {
    fetchCustos();
  }, []);

  const fetchCustos = async () => {
    if (!company.id) return;
    try {
      const response = await axiosInstance.get(`/custos-fixos/${company.id}`);
      setCustos(response.data);
    } catch (error) {
      toast.error('Erro ao carregar custos fixos');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const data = {
        empresa_id: company.id,
        ...formData,
        valor: parseFloat(formData.valor),
        dia_vencimento: parseInt(formData.dia_vencimento),
        num_parcelas: formData.num_parcelas ? parseInt(formData.num_parcelas) : null,
      };

      if (editingCusto) {
        await axiosInstance.put(`/custos-fixos/${editingCusto.id}`, data);
        toast.success('Custo fixo atualizado!');
      } else {
        await axiosInstance.post('/custos-fixos', data);
        toast.success('Custo fixo criado!');
      }

      setShowDialog(false);
      resetForm();
      fetchCustos();
    } catch (error) {
      toast.error('Erro ao salvar custo fixo');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (custo) => {
    setEditingCusto(custo);
    setFormData({
      descricao: custo.descricao,
      categoria: custo.categoria,
      valor: custo.valor.toString(),
      tipo_recorrencia: custo.tipo_recorrencia,
      dia_vencimento: custo.dia_vencimento.toString(),
      centro_custo: custo.centro_custo || '',
      num_parcelas: custo.num_parcelas?.toString() || '',
    });
    setShowDialog(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('Tem certeza que deseja excluir este custo fixo?')) return;

    try {
      await axiosInstance.delete(`/custos-fixos/${id}`);
      toast.success('Custo fixo excluído!');
      fetchCustos();
    } catch (error) {
      toast.error('Erro ao excluir custo fixo');
    }
  };

  const handleToggleStatus = async (custo) => {
    try {
      const novoStatus = custo.status === 'ativo' ? 'inativo' : 'ativo';
      await axiosInstance.patch(`/custos-fixos/${custo.id}/status`, { status: novoStatus });
      toast.success(`Status alterado para ${novoStatus}`);
      fetchCustos();
    } catch (error) {
      toast.error('Erro ao alterar status');
    }
  };

  const handleGerarContas = async () => {
    setGerando(true);
    try {
      const mes = new Date().toISOString().slice(0, 7);
      const response = await axiosInstance.post(`/gps-financeiro/gerar-contas-pagar/${company.id}?mes=${mes}`);
      
      if (response.data.contas_geradas > 0) {
        toast.success(`${response.data.contas_geradas} conta(s) a pagar gerada(s) para ${mes}`);
      } else if (response.data.contas_existentes > 0) {
        toast.info(`Contas já foram geradas para ${mes}`);
      } else {
        toast.info('Nenhum custo fixo ativo para gerar');
      }
    } catch (error) {
      toast.error('Erro ao gerar contas a pagar');
    } finally {
      setGerando(false);
    }
  };

  const resetForm = () => {
    setEditingCusto(null);
    setFormData({
      descricao: '',
      categoria: 'Estrutura',
      valor: '',
      tipo_recorrencia: 'mensal',
      dia_vencimento: '10',
      centro_custo: '',
      num_parcelas: '',
    });
  };

  // Cálculos resumo
  const custosAtivos = custos.filter(c => c.status === 'ativo');
  const totalMensal = custosAtivos.reduce((acc, c) => {
    if (c.tipo_recorrencia === 'anual') return acc + (c.valor / 12);
    return acc + c.valor;
  }, 0);

  const custosPorCategoria = CATEGORIAS.map(cat => ({
    categoria: cat,
    total: custosAtivos.filter(c => c.categoria === cat).reduce((acc, c) => {
      if (c.tipo_recorrencia === 'anual') return acc + (c.valor / 12);
      return acc + c.valor;
    }, 0)
  })).filter(c => c.total > 0);

  return (
    <div className="flex min-h-screen">
      <Sidebar user={user} onLogout={onLogout} />
      
      <div className="flex-1 p-8">
        <SubscriptionCard user={user} />

        {/* Header */}
        <div className="mb-8 flex justify-between items-start">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">Custos Fixos Recorrentes</h1>
            <p className="text-gray-400">
              Estrutura de custos mensais da empresa (custo de existência)
            </p>
          </div>
          <div className="flex gap-3">
            <Button
              onClick={handleGerarContas}
              disabled={gerando}
              variant="outline"
              className="border-blue-500/50 text-blue-400 hover:bg-blue-500/10"
            >
              <RefreshCw className={`mr-2 ${gerando ? 'animate-spin' : ''}`} size={18} />
              {gerando ? 'Gerando...' : 'Gerar Contas do Mês'}
            </Button>
            <Button
              onClick={() => { resetForm(); setShowDialog(true); }}
              className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
            >
              <Plus className="mr-2" size={18} />
              Novo Custo Fixo
            </Button>
          </div>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="glass border-white/10 hover-lift border-l-4 border-l-purple-500">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-400 flex items-center">
                <DollarSign className="mr-2" size={18} />
                Total Mensal
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-purple-400">
                R$ {totalMensal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {custosAtivos.length} custo(s) ativo(s)
              </p>
            </CardContent>
          </Card>

          <Card className="glass border-white/10 hover-lift border-l-4 border-l-blue-500">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-400 flex items-center">
                <Calendar className="mr-2" size={18} />
                Total Anual
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-blue-400">
                R$ {(totalMensal * 12).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Projeção anual
              </p>
            </CardContent>
          </Card>

          <Card className="glass border-white/10 hover-lift border-l-4 border-l-cyan-500">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-400 flex items-center">
                <TrendingUp className="mr-2" size={18} />
                Custo Diário
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-cyan-400">
                R$ {(totalMensal / 30).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Base: 30 dias
              </p>
            </CardContent>
          </Card>

          <Card className="glass border-white/10 hover-lift border-l-4 border-l-emerald-500">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-400 flex items-center">
                <Building2 className="mr-2" size={18} />
                Categorias
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-emerald-400">
                {custosPorCategoria.length}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                com custos ativos
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Distribuição por Categoria */}
        {custosPorCategoria.length > 0 && (
          <Card className="glass border-white/10 mb-8">
            <CardHeader>
              <CardTitle className="text-white">Distribuição por Categoria</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {custosPorCategoria.map((cat) => (
                  <div key={cat.categoria} className="p-4 rounded-lg bg-white/5 border border-white/10">
                    <p className="text-sm text-gray-400">{cat.categoria}</p>
                    <p className="text-lg font-bold text-white">
                      R$ {cat.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                    <p className="text-xs text-gray-500">
                      {((cat.total / totalMensal) * 100).toFixed(1)}% do total
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Tabela de Custos */}
        <Card className="glass border-white/10">
          <CardHeader>
            <CardTitle className="text-white">Lista de Custos Fixos ({custos.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow className="border-white/10 hover:bg-white/5">
                  <TableHead className="text-gray-300">Descrição</TableHead>
                  <TableHead className="text-gray-300">Categoria</TableHead>
                  <TableHead className="text-gray-300 text-right">Valor</TableHead>
                  <TableHead className="text-gray-300">Recorrência</TableHead>
                  <TableHead className="text-gray-300 text-center">Vencimento</TableHead>
                  <TableHead className="text-gray-300 text-center">Status</TableHead>
                  <TableHead className="text-gray-300 text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {custos.map((custo) => (
                  <TableRow key={custo.id} className="border-white/10 hover:bg-white/5">
                    <TableCell className="text-white font-medium">{custo.descricao}</TableCell>
                    <TableCell className="text-gray-400">{custo.categoria}</TableCell>
                    <TableCell className="text-white text-right font-mono">
                      R$ {custo.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell className="text-gray-400 capitalize">{custo.tipo_recorrencia}</TableCell>
                    <TableCell className="text-gray-400 text-center">Dia {custo.dia_vencimento}</TableCell>
                    <TableCell className="text-center">
                      <Badge className={custo.status === 'ativo' 
                        ? 'bg-green-500/20 text-green-400 border-green-500/50'
                        : 'bg-gray-500/20 text-gray-400 border-gray-500/50'
                      }>
                        {custo.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleToggleStatus(custo)}
                          className="text-yellow-400 hover:text-yellow-300 hover:bg-yellow-500/10"
                          title={custo.status === 'ativo' ? 'Desativar' : 'Ativar'}
                        >
                          <Power size={16} />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleEdit(custo)}
                          className="text-blue-400 hover:text-blue-300 hover:bg-blue-500/10"
                        >
                          <Edit size={16} />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDelete(custo.id)}
                          className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                        >
                          <Trash2 size={16} />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {custos.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-gray-500 py-8">
                      Nenhum custo fixo cadastrado. Clique em "Novo Custo Fixo" para começar.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Dialog de Criação/Edição */}
        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogContent className="glass border-white/10 max-w-lg">
            <DialogHeader>
              <DialogTitle className="text-white">
                {editingCusto ? 'Editar Custo Fixo' : 'Novo Custo Fixo Recorrente'}
              </DialogTitle>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label className="text-gray-300">Descrição *</Label>
                <Input
                  value={formData.descricao}
                  onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                  placeholder="Ex: Aluguel do escritório"
                  className="bg-white/5 border-white/10 text-white"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-gray-300">Categoria *</Label>
                  <Select
                    value={formData.categoria}
                    onValueChange={(value) => setFormData({ ...formData, categoria: value })}
                  >
                    <SelectTrigger className="bg-white/5 border-white/10 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIAS.map((cat) => (
                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-gray-300">Valor (R$) *</Label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.valor}
                    onChange={(e) => setFormData({ ...formData, valor: e.target.value })}
                    placeholder="0,00"
                    className="bg-white/5 border-white/10 text-white"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-gray-300">Recorrência</Label>
                  <Select
                    value={formData.tipo_recorrencia}
                    onValueChange={(value) => setFormData({ ...formData, tipo_recorrencia: value })}
                  >
                    <SelectTrigger className="bg-white/5 border-white/10 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="mensal">Mensal</SelectItem>
                      <SelectItem value="anual">Anual</SelectItem>
                      <SelectItem value="parcelado">Parcelado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-gray-300">Dia de Vencimento</Label>
                  <Input
                    type="number"
                    min="1"
                    max="31"
                    value={formData.dia_vencimento}
                    onChange={(e) => setFormData({ ...formData, dia_vencimento: e.target.value })}
                    className="bg-white/5 border-white/10 text-white"
                  />
                </div>
              </div>

              {formData.tipo_recorrencia === 'parcelado' && (
                <div className="space-y-2">
                  <Label className="text-gray-300">Número de Parcelas</Label>
                  <Input
                    type="number"
                    min="2"
                    value={formData.num_parcelas}
                    onChange={(e) => setFormData({ ...formData, num_parcelas: e.target.value })}
                    placeholder="Ex: 12"
                    className="bg-white/5 border-white/10 text-white"
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label className="text-gray-300">Centro de Custo (opcional)</Label>
                <Input
                  value={formData.centro_custo}
                  onChange={(e) => setFormData({ ...formData, centro_custo: e.target.value })}
                  placeholder="Ex: Administrativo"
                  className="bg-white/5 border-white/10 text-white"
                />
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowDialog(false)}
                  className="border-white/20 text-white hover:bg-white/10"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={loading}
                  className="bg-gradient-to-r from-purple-600 to-blue-600"
                >
                  {loading ? 'Salvando...' : (editingCusto ? 'Atualizar' : 'Criar')}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default CustosFixosRecorrentes;
