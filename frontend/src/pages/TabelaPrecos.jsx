import React, { useState, useEffect, useCallback } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { SubscriptionCard } from '@/components/SubscriptionCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { 
  Plus, Search, Edit2, Trash2, Power, PowerOff, 
  DollarSign, Tag, Ruler, FileText, Upload, Download,
  ChevronLeft, ChevronRight, Filter, X
} from 'lucide-react';
import { axiosInstance } from '../App';
import { toast } from 'sonner';

// Unidades disponíveis
const UNITS = [
  { value: 'M2', label: 'm² (Metro Quadrado)' },
  { value: 'M', label: 'm (Metro Linear)' },
  { value: 'UN', label: 'un (Unidade)' },
  { value: 'PONTO', label: 'ponto' },
  { value: 'HORA', label: 'hora' },
  { value: 'DIA', label: 'dia' },
  { value: 'VISITA', label: 'visita' },
  { value: 'MES', label: 'mês' },
  { value: 'ETAPA', label: 'etapa' },
  { value: 'GLOBAL', label: 'global' },
  { value: 'KG', label: 'kg (Quilograma)' },
  { value: 'M3', label: 'm³ (Metro Cúbico)' },
];

const TabelaPrecos = ({ user, onLogout }) => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState([]);
  
  // Filtros e paginação
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterUnit, setFilterUnit] = useState('');
  const [filterActive, setFilterActive] = useState('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  
  // Modal
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({
    code: '',
    description: '',
    category: '',
    unit: 'UN',
    pu1_base_price: '',
  });
  const [saving, setSaving] = useState(false);
  
  // Nova categoria
  const [newCategory, setNewCategory] = useState('');
  const [showNewCategoryInput, setShowNewCategoryInput] = useState(false);
  
  const company = JSON.parse(localStorage.getItem('company') || '{}');

  // Buscar itens
  const fetchItems = useCallback(async () => {
    if (!company?.id) return;
    setLoading(true);
    
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (filterCategory) params.append('category', filterCategory);
      if (filterUnit) params.append('unit', filterUnit);
      if (filterActive !== 'all') params.append('active', filterActive === 'active');
      params.append('page', page);
      params.append('limit', 20);
      
      const response = await axiosInstance.get(`/service-price-table/${company.id}?${params.toString()}`);
      setItems(response.data.items);
      setTotalPages(response.data.pages);
      setTotal(response.data.total);
    } catch (error) {
      toast.error('Erro ao carregar tabela de preços');
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [company?.id, search, filterCategory, filterUnit, filterActive, page]);

  // Buscar categorias
  const fetchCategories = async () => {
    if (!company?.id) return;
    try {
      const response = await axiosInstance.get(`/service-price-table/${company.id}/categories`);
      setCategories(response.data.categories);
    } catch (error) {
      console.error('Erro ao buscar categorias:', error);
    }
  };

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  useEffect(() => {
    fetchCategories();
  }, [company?.id]);

  // Reset página ao mudar filtros
  useEffect(() => {
    setPage(1);
  }, [search, filterCategory, filterUnit, filterActive]);

  // Abrir modal para criar
  const handleCreate = () => {
    setEditingItem(null);
    setFormData({
      code: '',
      description: '',
      category: '',
      unit: 'UN',
      pu1_base_price: '',
    });
    setShowNewCategoryInput(false);
    setNewCategory('');
    setShowModal(true);
  };

  // Abrir modal para editar
  const handleEdit = (item) => {
    setEditingItem(item);
    setFormData({
      code: item.code || '',
      description: item.description,
      category: item.category || '',
      unit: item.unit,
      pu1_base_price: item.pu1_base_price.toString(),
    });
    setShowNewCategoryInput(false);
    setNewCategory('');
    setShowModal(true);
  };

  // Salvar (criar ou atualizar)
  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    
    try {
      const data = {
        company_id: company.id,
        code: formData.code || null,
        description: formData.description,
        category: showNewCategoryInput ? newCategory : formData.category || null,
        unit: formData.unit,
        pu1_base_price: parseFloat(formData.pu1_base_price),
      };
      
      if (editingItem) {
        await axiosInstance.put(`/service-price-table/${editingItem.id}`, data);
        toast.success('Serviço atualizado com sucesso!');
      } else {
        await axiosInstance.post('/service-price-table', data);
        toast.success('Serviço criado com sucesso!');
      }
      
      setShowModal(false);
      fetchItems();
      fetchCategories();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Erro ao salvar');
    } finally {
      setSaving(false);
    }
  };

  // Toggle ativo/inativo
  const handleToggleActive = async (item) => {
    try {
      await axiosInstance.patch(`/service-price-table/${item.id}/active?active=${!item.active}`);
      toast.success(item.active ? 'Serviço desativado' : 'Serviço ativado');
      fetchItems();
    } catch (error) {
      toast.error('Erro ao alterar status');
    }
  };

  // Deletar
  const handleDelete = async (item) => {
    if (!window.confirm(`Deseja realmente excluir "${item.description}"?`)) return;
    
    try {
      await axiosInstance.delete(`/service-price-table/${item.id}`);
      toast.success('Serviço excluído com sucesso!');
      fetchItems();
    } catch (error) {
      toast.error('Erro ao excluir');
    }
  };

  // Limpar filtros
  const clearFilters = () => {
    setSearch('');
    setFilterCategory('');
    setFilterUnit('');
    setFilterActive('all');
    setPage(1);
  };

  // Formatar preço
  const formatPrice = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  return (
    <div className="flex min-h-screen bg-zinc-950 text-white">
      <Sidebar user={user} onLogout={onLogout} activePage="tabela-precos" />

      <div className="flex-1 p-8 ml-64">
        <div className="max-w-7xl mx-auto space-y-6">
          <SubscriptionCard user={user} />

          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Tabela de Preços</h1>
              <p className="text-zinc-400 mt-1">
                Cadastre serviços com preço base (PU1) para usar nos orçamentos
              </p>
            </div>
            <Button
              onClick={handleCreate}
              className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Novo Serviço
            </Button>
          </div>

          {/* Filtros */}
          <Card className="bg-zinc-900 border-zinc-800">
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                {/* Busca */}
                <div className="md:col-span-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                    <Input
                      placeholder="Buscar por descrição ou código..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="pl-10 bg-zinc-800 border-zinc-700"
                    />
                  </div>
                </div>

                {/* Categoria */}
                <Select value={filterCategory} onValueChange={setFilterCategory}>
                  <SelectTrigger className="bg-zinc-800 border-zinc-700">
                    <SelectValue placeholder="Categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Todas</SelectItem>
                    {categories.map((cat) => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Unidade */}
                <Select value={filterUnit} onValueChange={setFilterUnit}>
                  <SelectTrigger className="bg-zinc-800 border-zinc-700">
                    <SelectValue placeholder="Unidade" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Todas</SelectItem>
                    {UNITS.map((u) => (
                      <SelectItem key={u.value} value={u.value}>{u.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Status */}
                <Select value={filterActive} onValueChange={setFilterActive}>
                  <SelectTrigger className="bg-zinc-800 border-zinc-700">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="active">Ativos</SelectItem>
                    <SelectItem value="inactive">Inativos</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Botão limpar filtros */}
              {(search || filterCategory || filterUnit || filterActive !== 'all') && (
                <div className="mt-4 flex items-center justify-between">
                  <p className="text-sm text-zinc-400">
                    {total} {total === 1 ? 'resultado' : 'resultados'} encontrado(s)
                  </p>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearFilters}
                    className="text-zinc-400 hover:text-white"
                  >
                    <X className="w-4 h-4 mr-1" />
                    Limpar filtros
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Tabela */}
          <Card className="bg-zinc-900 border-zinc-800">
            <CardContent className="p-0">
              {loading ? (
                <div className="p-8 text-center text-zinc-400">Carregando...</div>
              ) : items.length === 0 ? (
                <div className="p-8 text-center">
                  <FileText className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
                  <p className="text-zinc-400">Nenhum serviço cadastrado</p>
                  <Button
                    onClick={handleCreate}
                    className="mt-4 bg-purple-600 hover:bg-purple-700"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Cadastrar primeiro serviço
                  </Button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-zinc-800">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-zinc-400 uppercase">Código</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-zinc-400 uppercase">Descrição</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-zinc-400 uppercase">Categoria</th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-zinc-400 uppercase">Unidade</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-zinc-400 uppercase">PU1 (Base)</th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-zinc-400 uppercase">Status</th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-zinc-400 uppercase">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800">
                      {items.map((item) => (
                        <tr key={item.id} className={`hover:bg-zinc-800/50 ${!item.active ? 'opacity-50' : ''}`}>
                          <td className="px-4 py-3 text-sm font-mono text-zinc-300">
                            {item.code || '-'}
                          </td>
                          <td className="px-4 py-3 text-sm font-medium text-white">
                            {item.description}
                          </td>
                          <td className="px-4 py-3 text-sm text-zinc-300">
                            {item.category ? (
                              <Badge variant="outline" className="border-zinc-600">
                                {item.category}
                              </Badge>
                            ) : (
                              <span className="text-zinc-500">-</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-sm text-center text-zinc-300">
                            {item.unit}
                          </td>
                          <td className="px-4 py-3 text-sm text-right font-medium text-green-400">
                            {formatPrice(item.pu1_base_price)}
                          </td>
                          <td className="px-4 py-3 text-center">
                            {item.active ? (
                              <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                                Ativo
                              </Badge>
                            ) : (
                              <Badge className="bg-red-500/20 text-red-400 border-red-500/30">
                                Inativo
                              </Badge>
                            )}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <div className="flex items-center justify-center gap-1">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleEdit(item)}
                                className="h-8 w-8 p-0 hover:bg-blue-500/20 hover:text-blue-400"
                              >
                                <Edit2 className="w-4 h-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleToggleActive(item)}
                                className={`h-8 w-8 p-0 ${item.active ? 'hover:bg-orange-500/20 hover:text-orange-400' : 'hover:bg-green-500/20 hover:text-green-400'}`}
                              >
                                {item.active ? <PowerOff className="w-4 h-4" /> : <Power className="w-4 h-4" />}
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleDelete(item)}
                                className="h-8 w-8 p-0 hover:bg-red-500/20 hover:text-red-400"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Paginação */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between px-4 py-3 border-t border-zinc-800">
                  <p className="text-sm text-zinc-400">
                    Página {page} de {totalPages} ({total} itens)
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                      disabled={page === 1}
                      className="border-zinc-700"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages}
                      className="border-zinc-700"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Modal de Criação/Edição */}
          <Dialog open={showModal} onOpenChange={setShowModal}>
            <DialogContent className="bg-zinc-900 border-zinc-800 max-w-lg">
              <DialogHeader>
                <DialogTitle>
                  {editingItem ? 'Editar Serviço' : 'Novo Serviço'}
                </DialogTitle>
              </DialogHeader>

              <form onSubmit={handleSave} className="space-y-4">
                {/* Código */}
                <div>
                  <Label htmlFor="code">Código (opcional)</Label>
                  <Input
                    id="code"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    placeholder="Ex: ELE-001"
                    className="bg-zinc-800 border-zinc-700"
                  />
                </div>

                {/* Descrição */}
                <div>
                  <Label htmlFor="description">Descrição *</Label>
                  <Input
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Ex: INSTALAÇÃO DE TOMADA"
                    required
                    minLength={3}
                    className="bg-zinc-800 border-zinc-700 uppercase"
                  />
                  <p className="text-xs text-zinc-500 mt-1">Será convertida para MAIÚSCULAS</p>
                </div>

                {/* Categoria */}
                <div>
                  <Label>Categoria</Label>
                  {showNewCategoryInput ? (
                    <div className="flex gap-2">
                      <Input
                        value={newCategory}
                        onChange={(e) => setNewCategory(e.target.value)}
                        placeholder="Nova categoria..."
                        className="bg-zinc-800 border-zinc-700"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setShowNewCategoryInput(false);
                          setNewCategory('');
                        }}
                        className="border-zinc-700"
                      >
                        Cancelar
                      </Button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <Select
                        value={formData.category}
                        onValueChange={(value) => setFormData({ ...formData, category: value })}
                      >
                        <SelectTrigger className="bg-zinc-800 border-zinc-700 flex-1">
                          <SelectValue placeholder="Selecionar categoria" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">Sem categoria</SelectItem>
                          {categories.map((cat) => (
                            <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setShowNewCategoryInput(true)}
                        className="border-zinc-700"
                      >
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                </div>

                {/* Unidade e Preço */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="unit">Unidade *</Label>
                    <Select
                      value={formData.unit}
                      onValueChange={(value) => setFormData({ ...formData, unit: value })}
                    >
                      <SelectTrigger className="bg-zinc-800 border-zinc-700">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {UNITS.map((u) => (
                          <SelectItem key={u.value} value={u.value}>{u.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="price">Preço Base (PU1) *</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400">R$</span>
                      <Input
                        id="price"
                        type="number"
                        step="0.01"
                        min="0.01"
                        value={formData.pu1_base_price}
                        onChange={(e) => setFormData({ ...formData, pu1_base_price: e.target.value })}
                        placeholder="0,00"
                        required
                        className="bg-zinc-800 border-zinc-700 pl-10"
                      />
                    </div>
                  </div>
                </div>

                <DialogFooter className="gap-2 mt-6">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowModal(false)}
                    className="border-zinc-700"
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    disabled={saving}
                    className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                  >
                    {saving ? 'Salvando...' : (editingItem ? 'Atualizar' : 'Criar')}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </div>
  );
};

export default TabelaPrecos;
