import React, { useState, useEffect, useCallback } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { SubscriptionCard } from '@/components/SubscriptionCard';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { 
  Plus, Edit2, Power, PowerOff, FolderTree, Building2, 
  HardHat, Calculator, AlertCircle, Sparkles
} from 'lucide-react';
import { axiosInstance } from '../App';
import { toast } from 'sonner';

// Grupos disponíveis
const EXPENSE_GROUPS = [
  { value: 'FIXA', label: 'Fixa', icon: Building2, description: 'Despesas fixas mensais (aluguel, energia, etc.)' },
  { value: 'VARIAVEL_INDIRETA', label: 'Variável Indireta', icon: Calculator, description: 'Despesas variáveis que não são de obra específica' },
  { value: 'DIRETA_OBRA', label: 'Direta de Obra', icon: HardHat, description: 'Custos diretos aplicados em obras específicas' },
];

const PlanoContas = ({ user, onLogout }) => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Modal
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    group: 'FIXA',
    is_indirect_for_markup: true,
    description: '',
  });
  const [saving, setSaving] = useState(false);
  
  const company = JSON.parse(localStorage.getItem('company') || '{}');

  // Buscar categorias
  const fetchCategories = useCallback(async () => {
    if (!company?.id) return;
    setLoading(true);
    
    try {
      const response = await axiosInstance.get(`/expense-categories/${company.id}?active_only=false`);
      setCategories(response.data.categories || []);
    } catch (error) {
      toast.error('Erro ao carregar categorias');
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [company?.id]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  // Criar categorias padrão
  const handleSeedDefaults = async () => {
    try {
      const response = await axiosInstance.post(`/expense-categories/${company.id}/seed-defaults`);
      toast.success(response.data.message);
      fetchCategories();
    } catch (error) {
      toast.error('Erro ao criar categorias padrão');
    }
  };

  // Abrir modal para criar
  const handleCreate = () => {
    setEditingCategory(null);
    setFormData({
      name: '',
      group: 'FIXA',
      is_indirect_for_markup: true,
      description: '',
    });
    setShowModal(true);
  };

  // Abrir modal para editar
  const handleEdit = (category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      group: category.group,
      is_indirect_for_markup: category.is_indirect_for_markup,
      description: category.description || '',
    });
    setShowModal(true);
  };

  // Salvar
  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    
    try {
      const data = {
        company_id: company.id,
        name: formData.name,
        type: 'DESPESA',
        group: formData.group,
        is_indirect_for_markup: formData.is_indirect_for_markup,
        description: formData.description || null,
      };
      
      if (editingCategory) {
        await axiosInstance.put(`/expense-categories/${editingCategory.id}`, data);
        toast.success('Categoria atualizada!');
      } else {
        await axiosInstance.post('/expense-categories', data);
        toast.success('Categoria criada!');
      }
      
      setShowModal(false);
      fetchCategories();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Erro ao salvar');
    } finally {
      setSaving(false);
    }
  };

  // Toggle ativo/inativo
  const handleToggleActive = async (category) => {
    try {
      await axiosInstance.patch(`/expense-categories/${category.id}/toggle?active=${!category.active}`);
      toast.success(category.active ? 'Categoria desativada' : 'Categoria ativada');
      fetchCategories();
    } catch (error) {
      toast.error('Erro ao alterar status');
    }
  };

  // Agrupar categorias
  const groupedCategories = EXPENSE_GROUPS.map(group => ({
    ...group,
    categories: categories.filter(c => c.group === group.value)
  }));

  // Contar categorias que entram no markup
  const countIndirectCategories = categories.filter(c => c.is_indirect_for_markup && c.active).length;

  return (
    <div className="flex min-h-screen bg-zinc-950 text-white">
      <Sidebar user={user} onLogout={onLogout} activePage="plano-contas" />

      <div className="flex-1 p-8 ml-64">
        <div className="max-w-5xl mx-auto space-y-6">
          <SubscriptionCard user={user} />

          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-3">
                <FolderTree className="w-8 h-8 text-purple-400" />
                Plano de Contas
              </h1>
              <p className="text-zinc-400 mt-1">
                Configure as categorias de despesas para o cálculo automático do Markup (Modelo 2)
              </p>
            </div>
            <div className="flex gap-2">
              {categories.length === 0 && (
                <Button
                  onClick={handleSeedDefaults}
                  variant="outline"
                  className="border-purple-500 text-purple-400 hover:bg-purple-500/20"
                >
                  <Sparkles className="w-4 h-4 mr-2" />
                  Criar Categorias Padrão
                </Button>
              )}
              <Button
                onClick={handleCreate}
                className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                Nova Categoria
              </Button>
            </div>
          </div>

          {/* Resumo */}
          <Card className="bg-gradient-to-r from-purple-900/30 to-blue-900/30 border-purple-500/30">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Calculator className="w-10 h-10 text-purple-400" />
                  <div>
                    <p className="text-lg font-semibold">Categorias para o X_real</p>
                    <p className="text-sm text-zinc-400">
                      {countIndirectCategories} categorias configuradas para entrar no cálculo do Markup automático
                    </p>
                  </div>
                </div>
                <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/30 text-lg px-4 py-1">
                  {countIndirectCategories} categorias
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Aviso sobre DIRETA_OBRA */}
          <Card className="bg-orange-500/10 border-orange-500/30">
            <CardContent className="pt-4 pb-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-orange-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-orange-300">Sobre "Direta de Obra"</p>
                  <p className="text-sm text-zinc-400 mt-1">
                    Categorias do grupo "Direta de Obra" <strong>NÃO</strong> entram no cálculo do X_real para evitar dupla contagem. 
                    Esses custos devem ser tratados como custo direto do serviço (no orçamento).
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Grupos de Categorias */}
          {loading ? (
            <div className="text-center text-zinc-400 py-8">Carregando...</div>
          ) : (
            <div className="space-y-6">
              {groupedCategories.map((group) => {
                const GroupIcon = group.icon;
                return (
                  <Card key={group.value} className="bg-zinc-900 border-zinc-800">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <GroupIcon className="w-5 h-5 text-purple-400" />
                        {group.label}
                      </CardTitle>
                      <CardDescription>{group.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      {group.categories.length === 0 ? (
                        <p className="text-zinc-500 text-center py-4">
                          Nenhuma categoria cadastrada neste grupo
                        </p>
                      ) : (
                        <div className="space-y-2">
                          {group.categories.map((cat) => (
                            <div
                              key={cat.id}
                              className={`flex items-center justify-between p-3 rounded-lg border ${
                                cat.active 
                                  ? 'bg-zinc-800/50 border-zinc-700' 
                                  : 'bg-zinc-900/50 border-zinc-800 opacity-50'
                              }`}
                            >
                              <div className="flex items-center gap-3">
                                <div>
                                  <p className="font-medium">{cat.name}</p>
                                  {cat.description && (
                                    <p className="text-xs text-zinc-500">{cat.description}</p>
                                  )}
                                </div>
                              </div>
                              
                              <div className="flex items-center gap-3">
                                {cat.is_indirect_for_markup ? (
                                  <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                                    Entra no Markup
                                  </Badge>
                                ) : (
                                  <Badge className="bg-zinc-700 text-zinc-400 border-zinc-600">
                                    Não entra
                                  </Badge>
                                )}
                                
                                <div className="flex gap-1">
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => handleEdit(cat)}
                                    className="h-8 w-8 p-0 hover:bg-blue-500/20 hover:text-blue-400"
                                  >
                                    <Edit2 className="w-4 h-4" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => handleToggleActive(cat)}
                                    className={`h-8 w-8 p-0 ${
                                      cat.active 
                                        ? 'hover:bg-orange-500/20 hover:text-orange-400' 
                                        : 'hover:bg-green-500/20 hover:text-green-400'
                                    }`}
                                  >
                                    {cat.active ? <PowerOff className="w-4 h-4" /> : <Power className="w-4 h-4" />}
                                  </Button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}

          {/* Modal de Criação/Edição */}
          <Dialog open={showModal} onOpenChange={setShowModal}>
            <DialogContent className="bg-zinc-900 border-zinc-800 max-w-lg">
              <DialogHeader>
                <DialogTitle>
                  {editingCategory ? 'Editar Categoria' : 'Nova Categoria'}
                </DialogTitle>
              </DialogHeader>

              <form onSubmit={handleSave} className="space-y-4">
                {/* Nome */}
                <div>
                  <Label htmlFor="name">Nome da Categoria *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Ex: Aluguel, Energia, Salários ADM..."
                    required
                    className="bg-zinc-800 border-zinc-700"
                  />
                </div>

                {/* Grupo */}
                <div>
                  <Label>Grupo *</Label>
                  <Select
                    value={formData.group}
                    onValueChange={(value) => {
                      setFormData({ 
                        ...formData, 
                        group: value,
                        // Se for DIRETA_OBRA, automaticamente não entra no markup
                        is_indirect_for_markup: value !== 'DIRETA_OBRA'
                      });
                    }}
                  >
                    <SelectTrigger className="bg-zinc-800 border-zinc-700">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {EXPENSE_GROUPS.map((g) => (
                        <SelectItem key={g.value} value={g.value}>
                          <div className="flex items-center gap-2">
                            <g.icon className="w-4 h-4" />
                            {g.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-zinc-500 mt-1">
                    {EXPENSE_GROUPS.find(g => g.value === formData.group)?.description}
                  </p>
                </div>

                {/* Entra no Markup */}
                <div className="flex items-center justify-between p-3 bg-zinc-800 rounded-lg">
                  <div>
                    <Label htmlFor="indirect">Entra no cálculo do X_real?</Label>
                    <p className="text-xs text-zinc-500">
                      Se ativo, esta categoria será considerada no cálculo automático do Markup
                    </p>
                  </div>
                  <Switch
                    id="indirect"
                    checked={formData.is_indirect_for_markup}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_indirect_for_markup: checked })}
                    disabled={formData.group === 'DIRETA_OBRA'}
                  />
                </div>

                {formData.group === 'DIRETA_OBRA' && (
                  <p className="text-xs text-orange-400">
                    ⚠️ Categorias "Direta de Obra" não podem entrar no Markup para evitar dupla contagem.
                  </p>
                )}

                {/* Descrição */}
                <div>
                  <Label htmlFor="description">Descrição (opcional)</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Descrição da categoria..."
                    className="bg-zinc-800 border-zinc-700"
                    rows={2}
                  />
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
                    {saving ? 'Salvando...' : (editingCategory ? 'Atualizar' : 'Criar')}
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

export default PlanoContas;
