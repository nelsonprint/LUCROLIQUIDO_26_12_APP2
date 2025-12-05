import React, { useState, useEffect } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { SubscriptionCard } from '@/components/SubscriptionCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { axiosInstance } from '../App';
import { toast } from 'sonner';
import { Plus, Edit, Trash2, Tag } from 'lucide-react';

const CategoriasPersonalizadas = ({ user, onLogout }) => {
  const [customCategories, setCustomCategories] = useState([]);
  const [showDialog, setShowDialog] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    tipo: 'receita',
    nome: '',
  });

  const company = JSON.parse(localStorage.getItem('company') || '{}');

  useEffect(() => {
    fetchCustomCategories();
  }, []);

  const fetchCustomCategories = async () => {
    if (!company.id) return;

    try {
      const response = await axiosInstance.get(`/custom-categories/${company.id}`);
      setCustomCategories(response.data);
    } catch (error) {
      toast.error('Erro ao carregar categorias personalizadas');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const data = {
        company_id: company.id,
        ...formData,
      };

      if (editingCategory) {
        await axiosInstance.put(`/custom-categories/${editingCategory.id}`, data);
        toast.success('Categoria atualizada!');
      } else {
        await axiosInstance.post('/custom-categories', data);
        toast.success('Categoria criada!');
      }

      setShowDialog(false);
      resetForm();
      fetchCustomCategories();
    } catch (error) {
      const message = error.response?.data?.detail || 'Erro ao salvar categoria';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (category) => {
    setEditingCategory(category);
    setFormData({
      tipo: category.tipo,
      nome: category.nome,
    });
    setShowDialog(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Deseja realmente excluir esta categoria?')) return;

    try {
      await axiosInstance.delete(`/custom-categories/${id}`);
      toast.success('Categoria excluída!');
      fetchCustomCategories();
    } catch (error) {
      toast.error('Erro ao excluir categoria');
    }
  };

  const resetForm = () => {
    setFormData({
      tipo: 'receita',
      nome: '',
    });
    setEditingCategory(null);
  };

  const getTypeLabel = (type) => {
    const labels = { receita: 'Receita', custo: 'Custo', despesa: 'Despesa' };
    return labels[type] || type;
  };

  const getTypeBadgeColor = (type) => {
    const colors = {
      receita: 'bg-green-500/20 text-green-300 border-green-500/50',
      custo: 'bg-orange-500/20 text-orange-300 border-orange-500/50',
      despesa: 'bg-red-500/20 text-red-300 border-red-500/50',
    };
    return colors[type] || 'bg-gray-500/20 text-gray-300 border-gray-500/50';
  };

  // Agrupar categorias por tipo
  const categoriesByType = {
    receita: customCategories.filter((c) => c.tipo === 'receita'),
    custo: customCategories.filter((c) => c.tipo === 'custo'),
    despesa: customCategories.filter((c) => c.tipo === 'despesa'),
  };

  return (
    <div className="flex min-h-screen bg-zinc-950 text-white">
      <Sidebar user={user} onLogout={onLogout} activePage="categorias" />

      <div className="flex-1 p-8 ml-64">
        <div className="max-w-7xl mx-auto space-y-6">
          <SubscriptionCard user={user} />

          {/* Header */}
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold">Categorias Personalizadas</h1>
              <p className="text-zinc-400 mt-1">Crie suas próprias categorias além das padrão do sistema</p>
            </div>
            <Button
              onClick={() => {
                resetForm();
                setShowDialog(true);
              }}
              className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Nova Categoria
            </Button>
          </div>

          {/* Info Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="bg-zinc-900 border-zinc-800 border-l-4 border-l-green-500">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-zinc-400 flex items-center">
                  <Tag className="w-4 h-4 mr-2 text-green-500" />
                  Receitas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-500">
                  {categoriesByType.receita.length}
                </div>
                <p className="text-xs text-zinc-500 mt-1">categorias personalizadas</p>
              </CardContent>
            </Card>

            <Card className="bg-zinc-900 border-zinc-800 border-l-4 border-l-orange-500">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-zinc-400 flex items-center">
                  <Tag className="w-4 h-4 mr-2 text-orange-500" />
                  Custos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-500">
                  {categoriesByType.custo.length}
                </div>
                <p className="text-xs text-zinc-500 mt-1">categorias personalizadas</p>
              </CardContent>
            </Card>

            <Card className="bg-zinc-900 border-zinc-800 border-l-4 border-l-red-500">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-zinc-400 flex items-center">
                  <Tag className="w-4 h-4 mr-2 text-red-500" />
                  Despesas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-500">
                  {categoriesByType.despesa.length}
                </div>
                <p className="text-xs text-zinc-500 mt-1">categorias personalizadas</p>
              </CardContent>
            </Card>
          </div>

          {/* Tabela */}
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader>
              <CardTitle>Suas Categorias ({customCategories.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow className="border-zinc-800">
                    <TableHead>Nome da Categoria</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {customCategories.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center text-zinc-500 py-8">
                        Nenhuma categoria personalizada criada ainda
                      </TableCell>
                    </TableRow>
                  ) : (
                    customCategories.map((category) => (
                      <TableRow key={category.id} className="border-zinc-800">
                        <TableCell className="font-medium">{category.nome}</TableCell>
                        <TableCell>
                          <Badge className={getTypeBadgeColor(category.tipo)}>
                            {getTypeLabel(category.tipo)}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleEdit(category)}
                              className="border-zinc-700"
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDelete(category.id)}
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
        <DialogContent className="bg-zinc-900 border-zinc-800 text-white max-w-md">
          <DialogHeader>
            <DialogTitle>{editingCategory ? 'Editar Categoria' : 'Nova Categoria Personalizada'}</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label>Tipo *</Label>
              <Select
                required
                value={formData.tipo}
                onValueChange={(value) => setFormData({ ...formData, tipo: value })}
              >
                <SelectTrigger className="bg-zinc-800 border-zinc-700">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="receita">Receita</SelectItem>
                  <SelectItem value="custo">Custo</SelectItem>
                  <SelectItem value="despesa">Despesa</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Nome da Categoria *</Label>
              <Input
                required
                value={formData.nome}
                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                placeholder="Ex: Comissão de afiliados"
                className="bg-zinc-800 border-zinc-700"
              />
              <p className="text-xs text-zinc-500 mt-1">
                Esta categoria aparecerá junto com as padrão ao criar lançamentos
              </p>
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
              <Button
                type="submit"
                disabled={loading}
                className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
              >
                {loading ? 'Salvando...' : editingCategory ? 'Atualizar' : 'Criar'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CategoriasPersonalizadas;
