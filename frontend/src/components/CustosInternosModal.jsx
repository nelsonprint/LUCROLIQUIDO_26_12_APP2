import React, { useState, useEffect, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { axiosInstance } from '../App';
import { toast } from 'sonner';
import { Plus, Trash2, DollarSign, HardHat, Package, Eye, EyeOff, Calculator } from 'lucide-react';

const CustosInternosModal = ({ 
  open, 
  onClose, 
  companyId, 
  markupMultiplier = 1,
  onCostChange,
  initialHiddenCosts = [],
  initialWorkUseMaterials = []
}) => {
  // Estado para custos indiretos
  const [hiddenCosts, setHiddenCosts] = useState(initialHiddenCosts);
  
  // Estado para materiais de uso interno (EPI/consumo)
  const [workUseMaterials, setWorkUseMaterials] = useState(initialWorkUseMaterials);
  
  // Catálogo de materiais internos
  const [internalMaterialsCatalog, setInternalMaterialsCatalog] = useState([]);
  const [searchMaterial, setSearchMaterial] = useState('');
  const [loadingCatalog, setLoadingCatalog] = useState(false);
  
  // Modal para novo material
  const [showNewMaterialForm, setShowNewMaterialForm] = useState(false);
  const [newMaterial, setNewMaterial] = useState({
    name: '',
    category: 'EPI',
    unit: 'un',
    default_cost: 0
  });

  // Carregar catálogo de materiais internos
  const fetchCatalog = useCallback(async () => {
    if (!companyId) return;
    setLoadingCatalog(true);
    try {
      const response = await axiosInstance.get(`/internal-materials/${companyId}`);
      setInternalMaterialsCatalog(response.data);
    } catch (error) {
      console.error('Erro ao carregar catálogo:', error);
    } finally {
      setLoadingCatalog(false);
    }
  }, [companyId]);

  useEffect(() => {
    if (open && companyId) {
      fetchCatalog();
    }
  }, [open, companyId, fetchCatalog]);

  // Sincronizar com props iniciais
  useEffect(() => {
    setHiddenCosts(initialHiddenCosts);
  }, [initialHiddenCosts]);

  useEffect(() => {
    setWorkUseMaterials(initialWorkUseMaterials);
  }, [initialWorkUseMaterials]);

  // ========== CUSTOS INDIRETOS ==========
  
  const addHiddenCost = () => {
    setHiddenCosts([...hiddenCosts, {
      id: Date.now().toString(),
      label: '',
      value: 0,
      applyMarkup: true,
      visibleToClient: false
    }]);
  };

  const updateHiddenCost = (id, field, value) => {
    setHiddenCosts(hiddenCosts.map(cost => 
      cost.id === id ? { ...cost, [field]: value } : cost
    ));
  };

  const removeHiddenCost = (id) => {
    setHiddenCosts(hiddenCosts.filter(cost => cost.id !== id));
  };

  // ========== MATERIAIS DE USO INTERNO ==========

  const addMaterialFromCatalog = (material) => {
    // Verificar se já foi adicionado
    if (workUseMaterials.find(m => m.materialId === material.id)) {
      toast.error('Material já adicionado');
      return;
    }

    setWorkUseMaterials([...workUseMaterials, {
      id: Date.now().toString(),
      materialId: material.id,
      name: material.name,
      unit: material.unit,
      quantity: 1,
      unitCost: material.default_cost,
      totalCost: material.default_cost,
      applyMarkup: true,
      visibleToClient: false
    }]);
    setSearchMaterial('');
  };

  const updateWorkMaterial = (id, field, value) => {
    setWorkUseMaterials(workUseMaterials.map(mat => {
      if (mat.id === id) {
        const updated = { ...mat, [field]: value };
        // Recalcular total se quantidade ou custo mudar
        if (field === 'quantity' || field === 'unitCost') {
          updated.totalCost = (updated.quantity || 0) * (updated.unitCost || 0);
        }
        return updated;
      }
      return mat;
    }));
  };

  const removeWorkMaterial = (id) => {
    setWorkUseMaterials(workUseMaterials.filter(mat => mat.id !== id));
  };

  // Criar novo material e adicionar ao catálogo
  const handleCreateMaterial = async () => {
    try {
      const data = {
        ...newMaterial,
        company_id: companyId
      };
      
      const response = await axiosInstance.post('/internal-materials', data);
      toast.success('Material cadastrado no catálogo!');
      
      // Recarregar catálogo
      await fetchCatalog();
      
      // Adicionar à lista de uso
      addMaterialFromCatalog({
        id: response.data.id,
        ...newMaterial
      });
      
      // Resetar form
      setShowNewMaterialForm(false);
      setNewMaterial({
        name: '',
        category: 'EPI',
        unit: 'un',
        default_cost: 0
      });
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Erro ao criar material');
    }
  };

  // ========== CÁLCULOS ==========

  const calculateTotals = () => {
    // Total de custos indiretos (custo)
    const hiddenCostTotal = hiddenCosts.reduce((sum, cost) => sum + (cost.value || 0), 0);
    
    // Total de materiais de uso (custo)
    const workMaterialCostTotal = workUseMaterials.reduce((sum, mat) => sum + (mat.totalCost || 0), 0);
    
    // Total geral de custos
    const totalCost = hiddenCostTotal + workMaterialCostTotal;
    
    // Converter custos em preço (aplicando markup onde necessário)
    const hiddenCostPrice = hiddenCosts.reduce((sum, cost) => {
      const price = cost.applyMarkup ? (cost.value || 0) * markupMultiplier : (cost.value || 0);
      return sum + price;
    }, 0);
    
    const workMaterialPrice = workUseMaterials.reduce((sum, mat) => {
      const price = mat.applyMarkup ? (mat.totalCost || 0) * markupMultiplier : (mat.totalCost || 0);
      return sum + price;
    }, 0);
    
    const totalPrice = hiddenCostPrice + workMaterialPrice;
    
    return {
      hiddenCostTotal,
      workMaterialCostTotal,
      totalCost,
      hiddenCostPrice,
      workMaterialPrice,
      totalPrice
    };
  };

  const totals = calculateTotals();

  // Salvar e fechar
  const handleSave = () => {
    if (onCostChange) {
      onCostChange({
        hiddenCosts,
        workUseMaterials,
        totals
      });
    }
    onClose();
  };

  // Filtrar catálogo
  const filteredCatalog = internalMaterialsCatalog.filter(m => 
    m.name.toLowerCase().includes(searchMaterial.toLowerCase())
  );

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-zinc-900 border-zinc-800 text-white max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Calculator className="text-orange-400" size={24} />
            Composição do Preço (Custos Internos)
          </DialogTitle>
        </DialogHeader>

        {/* Resumo de Totais */}
        <div className="grid grid-cols-3 gap-4 p-4 bg-gradient-to-r from-orange-900/30 to-red-900/30 rounded-lg border border-orange-500/30">
          <div className="text-center">
            <p className="text-gray-400 text-sm">Total Custos</p>
            <p className="text-xl font-bold text-white">R$ {totals.totalCost.toFixed(2)}</p>
          </div>
          <div className="text-center">
            <p className="text-gray-400 text-sm">Markup Aplicado</p>
            <p className="text-xl font-bold text-purple-400">{markupMultiplier.toFixed(4)}x</p>
          </div>
          <div className="text-center">
            <p className="text-gray-400 text-sm">Total em Preço</p>
            <p className="text-xl font-bold text-green-400">R$ {totals.totalPrice.toFixed(2)}</p>
          </div>
        </div>

        <Tabs defaultValue="indiretos" className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-zinc-800">
            <TabsTrigger value="indiretos" className="data-[state=active]:bg-purple-600">
              <DollarSign size={16} className="mr-2" />
              Custos Indiretos
            </TabsTrigger>
            <TabsTrigger value="epi" className="data-[state=active]:bg-orange-600">
              <HardHat size={16} className="mr-2" />
              EPI / Consumo Interno
            </TabsTrigger>
          </TabsList>

          {/* ========== ABA 1: CUSTOS INDIRETOS ========== */}
          <TabsContent value="indiretos" className="space-y-4">
            <div className="flex justify-between items-center">
              <p className="text-gray-400 text-sm">Custos que não aparecem detalhados para o cliente</p>
              <Button onClick={addHiddenCost} size="sm" className="bg-purple-600 hover:bg-purple-700">
                <Plus size={16} className="mr-1" /> Adicionar Custo
              </Button>
            </div>

            {hiddenCosts.length === 0 ? (
              <div className="p-8 text-center text-gray-500 border border-dashed border-zinc-700 rounded-lg">
                <DollarSign size={32} className="mx-auto mb-2 opacity-50" />
                <p>Nenhum custo indireto adicionado</p>
              </div>
            ) : (
              <div className="space-y-3">
                {hiddenCosts.map((cost) => (
                  <div key={cost.id} className="flex gap-3 items-center p-3 bg-zinc-800/50 rounded-lg">
                    <div className="flex-1">
                      <Input
                        placeholder="Descrição do custo"
                        value={cost.label}
                        onChange={(e) => updateHiddenCost(cost.id, 'label', e.target.value)}
                        className="bg-zinc-800 border-zinc-700"
                      />
                    </div>
                    <div className="w-32">
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="Valor"
                        value={cost.value}
                        onChange={(e) => updateHiddenCost(cost.id, 'value', parseFloat(e.target.value) || 0)}
                        className="bg-zinc-800 border-zinc-700"
                      />
                    </div>
                    <div className="flex items-center gap-2" title="Aplicar Markup">
                      <Switch
                        checked={cost.applyMarkup}
                        onCheckedChange={(checked) => updateHiddenCost(cost.id, 'applyMarkup', checked)}
                      />
                      <span className="text-xs text-gray-400">Markup</span>
                    </div>
                    <div className="flex items-center gap-2" title="Visível para cliente">
                      <button
                        onClick={() => updateHiddenCost(cost.id, 'visibleToClient', !cost.visibleToClient)}
                        className={`p-1 rounded ${cost.visibleToClient ? 'text-green-400' : 'text-gray-500'}`}
                      >
                        {cost.visibleToClient ? <Eye size={18} /> : <EyeOff size={18} />}
                      </button>
                    </div>
                    <button
                      onClick={() => removeHiddenCost(cost.id)}
                      className="p-1 text-red-400 hover:bg-red-500/20 rounded"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="flex justify-end p-3 bg-zinc-800/30 rounded-lg">
              <div className="text-right">
                <p className="text-sm text-gray-400">Subtotal Indiretos</p>
                <p className="text-lg font-semibold">
                  Custo: R$ {totals.hiddenCostTotal.toFixed(2)} → 
                  <span className="text-green-400 ml-2">Preço: R$ {totals.hiddenCostPrice.toFixed(2)}</span>
                </p>
              </div>
            </div>
          </TabsContent>

          {/* ========== ABA 2: EPI / CONSUMO INTERNO ========== */}
          <TabsContent value="epi" className="space-y-4">
            <div className="flex gap-3">
              <div className="flex-1 relative">
                <Input
                  placeholder="Buscar material no catálogo..."
                  value={searchMaterial}
                  onChange={(e) => setSearchMaterial(e.target.value)}
                  className="bg-zinc-800 border-zinc-700"
                />
                {searchMaterial && filteredCatalog.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-zinc-800 border border-zinc-700 rounded-lg max-h-40 overflow-y-auto z-10">
                    {filteredCatalog.map(material => (
                      <button
                        key={material.id}
                        onClick={() => addMaterialFromCatalog(material)}
                        className="w-full p-2 text-left hover:bg-zinc-700 flex justify-between items-center"
                      >
                        <span>{material.name}</span>
                        <span className="text-xs text-gray-400">
                          {material.category} - R$ {material.default_cost?.toFixed(2)}/{material.unit}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <Button 
                onClick={() => setShowNewMaterialForm(true)} 
                variant="outline" 
                className="border-orange-500 text-orange-400 hover:bg-orange-500/20"
              >
                <Plus size={16} className="mr-1" /> Novo Material
              </Button>
            </div>

            {/* Form para criar novo material */}
            {showNewMaterialForm && (
              <div className="p-4 bg-zinc-800/50 rounded-lg border border-orange-500/30 space-y-3">
                <h4 className="font-semibold text-orange-400">Cadastrar Novo Material no Catálogo</h4>
                <div className="grid grid-cols-4 gap-3">
                  <div className="col-span-2">
                    <Label>Nome</Label>
                    <Input
                      value={newMaterial.name}
                      onChange={(e) => setNewMaterial({...newMaterial, name: e.target.value})}
                      placeholder="Ex: Luva de proteção"
                      className="bg-zinc-800 border-zinc-700"
                    />
                  </div>
                  <div>
                    <Label>Categoria</Label>
                    <Select value={newMaterial.category} onValueChange={(v) => setNewMaterial({...newMaterial, category: v})}>
                      <SelectTrigger className="bg-zinc-800 border-zinc-700">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-zinc-800 border-zinc-700">
                        <SelectItem value="EPI">EPI</SelectItem>
                        <SelectItem value="CONSUMIVEL">Consumível</SelectItem>
                        <SelectItem value="OUTROS">Outros</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Unidade</Label>
                    <Input
                      value={newMaterial.unit}
                      onChange={(e) => setNewMaterial({...newMaterial, unit: e.target.value})}
                      placeholder="un, par, kg"
                      className="bg-zinc-800 border-zinc-700"
                    />
                  </div>
                </div>
                <div className="flex gap-3 items-end">
                  <div className="w-32">
                    <Label>Custo Padrão (R$)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={newMaterial.default_cost}
                      onChange={(e) => setNewMaterial({...newMaterial, default_cost: parseFloat(e.target.value) || 0})}
                      className="bg-zinc-800 border-zinc-700"
                    />
                  </div>
                  <Button onClick={handleCreateMaterial} className="bg-orange-600 hover:bg-orange-700">
                    Cadastrar e Adicionar
                  </Button>
                  <Button variant="ghost" onClick={() => setShowNewMaterialForm(false)}>
                    Cancelar
                  </Button>
                </div>
              </div>
            )}

            {/* Lista de materiais adicionados */}
            {workUseMaterials.length === 0 ? (
              <div className="p-8 text-center text-gray-500 border border-dashed border-zinc-700 rounded-lg">
                <HardHat size={32} className="mx-auto mb-2 opacity-50" />
                <p>Nenhum material de uso interno adicionado</p>
                <p className="text-xs mt-1">Busque no catálogo ou cadastre um novo</p>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="grid grid-cols-12 gap-2 text-xs text-gray-400 px-3">
                  <div className="col-span-4">Material</div>
                  <div className="col-span-1">Unid.</div>
                  <div className="col-span-2">Qtd.</div>
                  <div className="col-span-2">Custo Un.</div>
                  <div className="col-span-2">Total</div>
                  <div className="col-span-1"></div>
                </div>
                {workUseMaterials.map((mat) => (
                  <div key={mat.id} className="grid grid-cols-12 gap-2 items-center p-2 bg-zinc-800/50 rounded-lg">
                    <div className="col-span-4 text-sm">{mat.name}</div>
                    <div className="col-span-1 text-xs text-gray-400">{mat.unit}</div>
                    <div className="col-span-2">
                      <Input
                        type="number"
                        step="0.01"
                        value={mat.quantity}
                        onChange={(e) => updateWorkMaterial(mat.id, 'quantity', parseFloat(e.target.value) || 0)}
                        className="bg-zinc-800 border-zinc-700 h-8 text-sm"
                      />
                    </div>
                    <div className="col-span-2">
                      <Input
                        type="number"
                        step="0.01"
                        value={mat.unitCost}
                        onChange={(e) => updateWorkMaterial(mat.id, 'unitCost', parseFloat(e.target.value) || 0)}
                        className="bg-zinc-800 border-zinc-700 h-8 text-sm"
                      />
                    </div>
                    <div className="col-span-2 text-green-400 font-medium">
                      R$ {mat.totalCost?.toFixed(2)}
                    </div>
                    <div className="col-span-1 flex gap-1">
                      <button
                        onClick={() => updateWorkMaterial(mat.id, 'applyMarkup', !mat.applyMarkup)}
                        className={`p-1 rounded text-xs ${mat.applyMarkup ? 'bg-purple-500/30 text-purple-400' : 'bg-zinc-700 text-gray-500'}`}
                        title="Aplicar Markup"
                      >
                        M
                      </button>
                      <button
                        onClick={() => removeWorkMaterial(mat.id)}
                        className="p-1 text-red-400 hover:bg-red-500/20 rounded"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="flex justify-end p-3 bg-zinc-800/30 rounded-lg">
              <div className="text-right">
                <p className="text-sm text-gray-400">Subtotal EPI/Consumo</p>
                <p className="text-lg font-semibold">
                  Custo: R$ {totals.workMaterialCostTotal.toFixed(2)} → 
                  <span className="text-green-400 ml-2">Preço: R$ {totals.workMaterialPrice.toFixed(2)}</span>
                </p>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {/* Botões de Ação */}
        <div className="flex justify-between items-center pt-4 border-t border-zinc-700">
          <div className="text-sm text-gray-400">
            <p>Este valor será adicionado ao preço final do orçamento</p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={onClose} className="border-zinc-700">
              Cancelar
            </Button>
            <Button onClick={handleSave} className="bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700">
              Aplicar Custos
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CustosInternosModal;
