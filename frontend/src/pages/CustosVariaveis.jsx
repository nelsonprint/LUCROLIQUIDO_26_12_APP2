import React, { useState, useEffect } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { SubscriptionCard } from '@/components/SubscriptionCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { axiosInstance } from '../App';
import { toast } from 'sonner';
import { Plus, Edit, Trash2, Power, Percent, TrendingUp, PieChart, Info } from 'lucide-react';

const CustosVariaveis = ({ user, onLogout }) => {
  const [custos, setCustos] = useState([]);
  const [showDialog, setShowDialog] = useState(false);
  const [editingCusto, setEditingCusto] = useState(null);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    descricao: '',
    percentual: '',
  });

  const company = JSON.parse(localStorage.getItem('company') || '{}');

  useEffect(() => {
    fetchCustos();
  }, []);

  const fetchCustos = async () => {
    if (!company.id) return;
    try {
      const response = await axiosInstance.get(`/custos-variaveis/${company.id}`);
      setCustos(response.data);
    } catch (error) {
      toast.error('Erro ao carregar custos variáveis');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const data = {
        empresa_id: company.id,
        descricao: formData.descricao,
        percentual: parseFloat(formData.percentual),
      };

      if (editingCusto) {
        await axiosInstance.put(`/custos-variaveis/${editingCusto.id}`, data);
        toast.success('Custo variável atualizado!');
      } else {
        await axiosInstance.post('/custos-variaveis', data);
        toast.success('Custo variável criado!');
      }

      setShowDialog(false);
      resetForm();
      fetchCustos();
    } catch (error) {
      toast.error('Erro ao salvar custo variável');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (custo) => {
    setEditingCusto(custo);
    setFormData({
      descricao: custo.descricao,
      percentual: custo.percentual.toString(),
    });
    setShowDialog(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('Tem certeza que deseja excluir este custo variável?')) return;

    try {
      await axiosInstance.delete(`/custos-variaveis/${id}`);
      toast.success('Custo variável excluído!');
      fetchCustos();
    } catch (error) {
      toast.error('Erro ao excluir custo variável');
    }
  };

  const handleToggleStatus = async (custo) => {
    try {
      const novoStatus = custo.status === 'ativo' ? 'inativo' : 'ativo';
      await axiosInstance.patch(`/custos-variaveis/${custo.id}/status`, { status: novoStatus });
      toast.success(`Status alterado para ${novoStatus}`);
      fetchCustos();
    } catch (error) {
      toast.error('Erro ao alterar status');
    }
  };

  const resetForm = () => {
    setEditingCusto(null);
    setFormData({
      descricao: '',
      percentual: '',
    });
  };

  // Cálculos resumo
  const custosAtivos = custos.filter(c => c.status === 'ativo');
  const totalPercentual = custosAtivos.reduce((acc, c) => acc + c.percentual, 0);
  const margemContribuicao = 100 - totalPercentual;

  // Exemplos de custos variáveis típicos
  const exemplos = [
    { descricao: 'Comissão de vendas', percentual: '5-10%' },
    { descricao: 'Impostos sobre venda (ISS, ICMS)', percentual: '3-18%' },
    { descricao: 'Taxas de cartão/gateway', percentual: '2-5%' },
    { descricao: 'Materiais/Insumos diretos', percentual: '10-30%' },
    { descricao: 'Terceirização/Subcontratação', percentual: '5-20%' },
  ];

  return (
    <div className="flex min-h-screen">
      <Sidebar user={user} onLogout={onLogout} />
      
      <div className="flex-1 p-8">
        <SubscriptionCard user={user} />

        {/* Header */}
        <div className="mb-8 flex justify-between items-start">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">Custos Variáveis</h1>
            <p className="text-gray-400">
              Custos proporcionais ao faturamento (% sobre a receita)
            </p>
          </div>
          <Button
            onClick={() => { resetForm(); setShowDialog(true); }}
            className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
          >
            <Plus className="mr-2" size={18} />
            Novo Custo Variável
          </Button>
        </div>

        {/* KPIs Principais */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="glass border-white/10 hover-lift border-l-4 border-l-orange-500">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-400 flex items-center">
                <Percent className="mr-2" size={18} />
                Total Custos Variáveis
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-orange-400">
                {totalPercentual.toFixed(1)}%
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {custosAtivos.length} componente(s) ativo(s)
              </p>
            </CardContent>
          </Card>

          <Card className={`glass border-white/10 hover-lift border-l-4 ${margemContribuicao >= 50 ? 'border-l-emerald-500' : margemContribuicao >= 30 ? 'border-l-yellow-500' : 'border-l-red-500'}`}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-400 flex items-center">
                <TrendingUp className="mr-2" size={18} />
                Margem de Contribuição
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className={`text-3xl font-bold ${margemContribuicao >= 50 ? 'text-emerald-400' : margemContribuicao >= 30 ? 'text-yellow-400' : 'text-red-400'}`}>
                {margemContribuicao.toFixed(1)}%
              </p>
              <p className="text-xs text-gray-500 mt-1">
                100% - {totalPercentual.toFixed(1)}% = {margemContribuicao.toFixed(1)}%
              </p>
            </CardContent>
          </Card>

          <Card className="glass border-white/10 hover-lift border-l-4 border-l-blue-500">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-400 flex items-center">
                <PieChart className="mr-2" size={18} />
                Fator de Break-even
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-blue-400">
                {margemContribuicao > 0 ? (1 / (margemContribuicao / 100)).toFixed(2) : '∞'}x
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Multiplicador sobre custos fixos
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Explicação Visual */}
        <Card className="glass border-white/10 mb-8 bg-gradient-to-r from-purple-900/20 to-blue-900/20">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-full bg-purple-500/20">
                <Info className="text-purple-400" size={24} />
              </div>
              <div className="flex-1">
                <h3 className="text-white font-semibold mb-2">Como funciona o cálculo do Break-even?</h3>
                <p className="text-gray-400 text-sm mb-4">
                  O break-even é calculado usando a <strong className="text-white">Margem de Contribuição</strong>:
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 rounded-lg bg-black/20 border border-white/10">
                    <p className="text-xs text-gray-500 mb-1">Fórmula da Margem</p>
                    <p className="text-white font-mono">
                      MC = 100% - Custos Variáveis (%)
                    </p>
                    <p className="text-emerald-400 font-bold mt-2">
                      MC = 100% - {totalPercentual.toFixed(1)}% = {margemContribuicao.toFixed(1)}%
                    </p>
                  </div>
                  <div className="p-4 rounded-lg bg-black/20 border border-white/10">
                    <p className="text-xs text-gray-500 mb-1">Fórmula do Break-even</p>
                    <p className="text-white font-mono">
                      BE = Custos Fixos ÷ MC
                    </p>
                    <p className="text-blue-400 text-sm mt-2">
                      Ex: R$ 30.000 ÷ {(margemContribuicao / 100).toFixed(2)} = R$ {margemContribuicao > 0 ? (30000 / (margemContribuicao / 100)).toLocaleString('pt-BR', { minimumFractionDigits: 2 }) : '∞'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabela de Custos Variáveis */}
        <Card className="glass border-white/10 mb-8">
          <CardHeader>
            <CardTitle className="text-white">Componentes dos Custos Variáveis ({custos.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow className="border-white/10 hover:bg-white/5">
                  <TableHead className="text-gray-300">Descrição</TableHead>
                  <TableHead className="text-gray-300 text-right">Percentual</TableHead>
                  <TableHead className="text-gray-300 text-center">Status</TableHead>
                  <TableHead className="text-gray-300 text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {custos.map((custo) => (
                  <TableRow key={custo.id} className="border-white/10 hover:bg-white/5">
                    <TableCell className="text-white font-medium">{custo.descricao}</TableCell>
                    <TableCell className="text-orange-400 text-right font-mono font-bold">
                      {custo.percentual.toFixed(1)}%
                    </TableCell>
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
                    <TableCell colSpan={4} className="text-center text-gray-500 py-8">
                      Nenhum custo variável cadastrado. Clique em "Novo Custo Variável" para começar.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Sugestões de Custos Variáveis */}
        {custos.length === 0 && (
          <Card className="glass border-white/10">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <Info className="mr-2" size={20} />
                Exemplos de Custos Variáveis
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-400 text-sm mb-4">
                Custos variáveis são despesas que aumentam proporcionalmente ao faturamento. Exemplos comuns:
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {exemplos.map((ex, idx) => (
                  <div key={idx} className="p-4 rounded-lg bg-white/5 border border-white/10">
                    <p className="text-white font-medium">{ex.descricao}</p>
                    <p className="text-orange-400 text-sm">Típico: {ex.percentual}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Dialog de Criação/Edição */}
        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogContent className="glass border-white/10 max-w-md">
            <DialogHeader>
              <DialogTitle className="text-white">
                {editingCusto ? 'Editar Custo Variável' : 'Novo Custo Variável'}
              </DialogTitle>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label className="text-gray-300">Descrição *</Label>
                <Input
                  value={formData.descricao}
                  onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                  placeholder="Ex: Comissão de vendas"
                  className="bg-white/5 border-white/10 text-white"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label className="text-gray-300">Percentual sobre Faturamento (%) *</Label>
                <Input
                  type="number"
                  step="0.1"
                  min="0"
                  max="100"
                  value={formData.percentual}
                  onChange={(e) => setFormData({ ...formData, percentual: e.target.value })}
                  placeholder="Ex: 5.0"
                  className="bg-white/5 border-white/10 text-white"
                  required
                />
                <p className="text-xs text-gray-500">
                  Este percentual será aplicado sobre o faturamento para calcular o custo variável.
                </p>
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

export default CustosVariaveis;
