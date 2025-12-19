import React, { useState, useEffect } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { axiosInstance } from '../App';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, Package, Search, Layers } from 'lucide-react';

const BILLING_MODEL_LABELS = {
  "AREA_M2": { label: "Por Área (m²)", icon: "📐" },
  "LINEAR_M": { label: "Por Metro Linear", icon: "📏" },
  "POINT": { label: "Por Ponto", icon: "📍" },
  "UNIT": { label: "Por Unidade", icon: "📦" },
  "VOLUME_M3": { label: "Por Volume (m³)", icon: "📊" },
  "WEIGHT_KG": { label: "Por Peso (kg)", icon: "⚖️" },
  "HOUR": { label: "Por Hora", icon: "⏰" },
  "DAY": { label: "Por Diária", icon: "📅" },
  "VISIT": { label: "Por Visita", icon: "🏠" },
  "MONTHLY": { label: "Mensal", icon: "📆" },
  "MILESTONE": { label: "Por Etapa", icon: "🎯" },
  "GLOBAL": { label: "Valor Global", icon: "🌐" },
  "UNIT_COMPOSITION": { label: "Composição Unitária", icon: "🔧" },
  "COST_PLUS": { label: "Custo + Margem", icon: "💰" },
  "PERFORMANCE": { label: "Por Performance", icon: "📈" }
};

const CatalogoServicos = ({ user }) => {
  const [company, setCompany] = useState(null);
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    billing_model: 'AREA_M2',
    unit_label: 'm²',
    default_unit_price: 0,
    materials_included: false,
    material_margin_pct: 0,
    scope_checklist: '',
    multipliers: {
      urgency: 1.0,
      height: 1.0,
      difficulty: 1.0,
      risk: 1.0,
      access: 1.0
    },
    active: true
  });

  useEffect(() => {
    const stored = localStorage.getItem('company');
    if (stored) {
      setCompany(JSON.parse(stored));
    }
  }, []);

  useEffect(() => {
    if (company?.id) {
      fetchTemplates();
    }
  }, [company]);

  const fetchTemplates = async () => {
    setLoading(true);
    try {
      const response = await axiosInstance.get(`/service-templates/${company.id}?active_only=false`);
      setTemplates(response.data);
    } catch (error) {
      console.error('Erro ao carregar templates:', error);
      toast.error('Erro ao carregar catálogo');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (template = null) => {
    if (template) {
      setEditingTemplate(template);
      setFormData({
        name: template.name,
        category: template.category || '',
        billing_model: template.billing_model,
        unit_label: template.unit_label,
        default_unit_price: template.default_unit_price,
        materials_included: template.materials_included,
        material_margin_pct: template.material_margin_pct || 0,
        scope_checklist: (template.scope_checklist || []).join('\n'),
        multipliers: template.multipliers || {
          urgency: 1.0, height: 1.0, difficulty: 1.0, risk: 1.0, access: 1.0
        },
        active: template.active
      });
    } else {
      setEditingTemplate(null);
      setFormData({
        name: '',
        category: '',
        billing_model: 'AREA_M2',
        unit_label: 'm²',
        default_unit_price: 0,
        materials_included: false,
        material_margin_pct: 0,
        scope_checklist: '',
        multipliers: {
          urgency: 1.0, height: 1.0, difficulty: 1.0, risk: 1.0, access: 1.0
        },
        active: true
      });
    }
    setShowModal(true);
  };

  const handleBillingModelChange = (model) => {
    const details = BILLING_MODEL_LABELS[model];
    setFormData({
      ...formData,
      billing_model: model,
      unit_label: details?.unit || 'un'
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const data = {
        ...formData,
        company_id: company.id,
        scope_checklist: formData.scope_checklist.split('\n').filter(s => s.trim())
      };

      if (editingTemplate) {
        await axiosInstance.put(`/service-template/${editingTemplate.id}`, data);
        toast.success('Serviço atualizado com sucesso!');
      } else {
        await axiosInstance.post('/service-templates', data);
        toast.success('Serviço cadastrado com sucesso!');
      }

      setShowModal(false);
      fetchTemplates();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Erro ao salvar serviço');
    }
  };

  const handleDelete = async (template) => {
    if (!confirm(`Deseja desativar o serviço "${template.name}"?`)) return;
    
    try {
      await axiosInstance.delete(`/service-template/${template.id}`);
      toast.success('Serviço desativado!');
      fetchTemplates();
    } catch (error) {
      toast.error('Erro ao desativar serviço');
    }
  };

  // Filtrar templates
  const filteredTemplates = templates.filter(t => {
    const matchesSearch = t.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === 'all' || t.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  // Categorias únicas
  const categories = [...new Set(templates.map(t => t.category).filter(Boolean))];

  if (!company) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 flex">
        <Sidebar user={user} />
        <div className="flex-1 flex items-center justify-center">
          <p className="text-gray-400">Selecione uma empresa no Dashboard</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 flex">
      <Sidebar user={user} />
      
      <div className="flex-1 p-8 overflow-auto">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                <Layers className="text-purple-400" />
                Catálogo de Serviços
              </h1>
              <p className="text-gray-400 mt-1">Gerencie os templates de serviços com diferentes modalidades de cobrança</p>
            </div>
            <Button
              onClick={() => handleOpenModal()}
              className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
            >
              <Plus size={18} className="mr-2" />
              Novo Serviço
            </Button>
          </div>

          {/* Filtros */}
          <Card className="glass border-white/10 mb-6">
            <CardContent className="p-4">
              <div className="flex gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <Input
                    placeholder="Buscar serviço..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="bg-zinc-800 border-zinc-700 pl-10"
                  />
                </div>
                <Select value={filterCategory} onValueChange={setFilterCategory}>
                  <SelectTrigger className="w-48 bg-zinc-800 border-zinc-700">
                    <SelectValue placeholder="Categoria" />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-800 border-zinc-700">
                    <SelectItem value="all">Todas as categorias</SelectItem>
                    {categories.map(cat => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Lista de Templates */}
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
            </div>
          ) : filteredTemplates.length === 0 ? (
            <Card className="glass border-white/10">
              <CardContent className="p-12 text-center">
                <Package size={48} className="mx-auto text-gray-500 mb-4" />
                <p className="text-gray-400">Nenhum serviço cadastrado</p>
                <Button
                  onClick={() => handleOpenModal()}
                  className="mt-4 bg-purple-600 hover:bg-purple-700"
                >
                  Cadastrar Primeiro Serviço
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredTemplates.map(template => (
                <Card 
                  key={template.id} 
                  className={`glass border-white/10 hover:border-purple-500/50 transition-all ${!template.active ? 'opacity-50' : ''}`}
                >
                  <CardContent className="p-5">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">{BILLING_MODEL_LABELS[template.billing_model]?.icon || '📋'}</span>
                        <div>
                          <h3 className="font-semibold text-white">{template.name}</h3>
                          {template.category && (
                            <span className="text-xs text-purple-400">{template.category}</span>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <button
                          onClick={() => handleOpenModal(template)}
                          className="p-1.5 rounded hover:bg-white/10 text-gray-400 hover:text-white"
                        >
                          <Pencil size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(template)}
                          className="p-1.5 rounded hover:bg-red-500/20 text-gray-400 hover:text-red-400"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                    
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between text-gray-400">
                        <span>Modalidade:</span>
                        <span className="text-white">{BILLING_MODEL_LABELS[template.billing_model]?.label}</span>
                      </div>
                      <div className="flex justify-between text-gray-400">
                        <span>Preço base:</span>
                        <span className="text-green-400">
                          R$ {template.default_unit_price?.toFixed(2)} / {template.unit_label}
                        </span>
                      </div>
                      {template.materials_included && (
                        <div className="flex justify-between text-gray-400">
                          <span>Materiais:</span>
                          <span className="text-blue-400">Inclusos ({template.material_margin_pct}%)</span>
                        </div>
                      )}
                    </div>

                    {!template.active && (
                      <div className="mt-3 px-2 py-1 bg-red-500/20 rounded text-xs text-red-400 text-center">
                        Desativado
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal de Cadastro/Edição */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="bg-zinc-900 border-zinc-800 text-white max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Package className="text-purple-400" />
              {editingTemplate ? 'Editar Serviço' : 'Novo Serviço'}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Dados Básicos */}
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <Label>Nome do Serviço *</Label>
                <Input
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  placeholder="Ex: Pintura de parede"
                  className="bg-zinc-800 border-zinc-700"
                />
              </div>
              <div>
                <Label>Categoria</Label>
                <Input
                  value={formData.category}
                  onChange={(e) => setFormData({...formData, category: e.target.value})}
                  placeholder="Ex: Pintura, Elétrica, Hidráulica"
                  className="bg-zinc-800 border-zinc-700"
                />
              </div>
              <div>
                <Label>Status</Label>
                <div className="flex items-center gap-3 mt-2">
                  <Switch
                    checked={formData.active}
                    onCheckedChange={(checked) => setFormData({...formData, active: checked})}
                  />
                  <span className={formData.active ? 'text-green-400' : 'text-gray-400'}>
                    {formData.active ? 'Ativo' : 'Inativo'}
                  </span>
                </div>
              </div>
            </div>

            {/* Modalidade de Cobrança */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-purple-400">Modalidade de Cobrança</h3>
              <div className="grid grid-cols-3 gap-2">
                {Object.entries(BILLING_MODEL_LABELS).map(([key, { label, icon }]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => handleBillingModelChange(key)}
                    className={`p-3 rounded-lg border text-left transition-all ${
                      formData.billing_model === key
                        ? 'border-purple-500 bg-purple-500/20'
                        : 'border-zinc-700 hover:border-zinc-600'
                    }`}
                  >
                    <span className="text-lg mr-2">{icon}</span>
                    <span className="text-sm">{label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Preço */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Preço Base (R$)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.default_unit_price}
                  onChange={(e) => setFormData({...formData, default_unit_price: parseFloat(e.target.value) || 0})}
                  className="bg-zinc-800 border-zinc-700"
                />
              </div>
              <div>
                <Label>Unidade</Label>
                <Input
                  value={formData.unit_label}
                  onChange={(e) => setFormData({...formData, unit_label: e.target.value})}
                  className="bg-zinc-800 border-zinc-700"
                />
              </div>
            </div>

            {/* Materiais */}
            <div className="p-4 bg-zinc-800/50 rounded-lg space-y-3">
              <div className="flex items-center gap-3">
                <Switch
                  checked={formData.materials_included}
                  onCheckedChange={(checked) => setFormData({...formData, materials_included: checked})}
                />
                <Label>Materiais inclusos no serviço</Label>
              </div>
              {formData.materials_included && (
                <div>
                  <Label>Margem sobre materiais (%)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={formData.material_margin_pct}
                    onChange={(e) => setFormData({...formData, material_margin_pct: parseFloat(e.target.value) || 0})}
                    className="bg-zinc-800 border-zinc-700 w-32"
                  />
                </div>
              )}
            </div>

            {/* Multiplicadores */}
            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-blue-400">Multiplicadores</h3>
              <div className="grid grid-cols-5 gap-3">
                {[
                  { key: 'urgency', label: 'Urgência' },
                  { key: 'height', label: 'Altura' },
                  { key: 'difficulty', label: 'Dificuldade' },
                  { key: 'risk', label: 'Risco' },
                  { key: 'access', label: 'Acesso' }
                ].map(({ key, label }) => (
                  <div key={key}>
                    <Label className="text-xs">{label}</Label>
                    <Input
                      type="number"
                      step="0.1"
                      min="1"
                      value={formData.multipliers[key]}
                      onChange={(e) => setFormData({
                        ...formData,
                        multipliers: {
                          ...formData.multipliers,
                          [key]: parseFloat(e.target.value) || 1
                        }
                      })}
                      className="bg-zinc-800 border-zinc-700"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Checklist */}
            <div>
              <Label>Checklist de Escopo (um item por linha)</Label>
              <Textarea
                value={formData.scope_checklist}
                onChange={(e) => setFormData({...formData, scope_checklist: e.target.value})}
                placeholder="Preparação da superfície&#10;Aplicação de primer&#10;Duas demãos de tinta"
                className="bg-zinc-800 border-zinc-700 h-24"
              />
            </div>

            {/* Botões */}
            <div className="flex justify-end gap-3 pt-4 border-t border-zinc-700">
              <Button type="button" variant="outline" onClick={() => setShowModal(false)} className="border-zinc-700">
                Cancelar
              </Button>
              <Button type="submit" className="bg-gradient-to-r from-purple-600 to-blue-600">
                {editingTemplate ? 'Salvar Alterações' : 'Cadastrar Serviço'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CatalogoServicos;
