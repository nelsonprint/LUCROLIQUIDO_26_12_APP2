import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2, Search, Calculator } from 'lucide-react';
import { axiosInstance } from '../App';
import { toast } from 'sonner';

// Unidades disponíveis
const UNITS = [
  { value: 'M2', label: 'm²' },
  { value: 'M', label: 'm' },
  { value: 'UN', label: 'un' },
  { value: 'PONTO', label: 'ponto' },
  { value: 'HORA', label: 'hora' },
  { value: 'DIA', label: 'dia' },
  { value: 'VISITA', label: 'visita' },
  { value: 'MES', label: 'mês' },
  { value: 'ETAPA', label: 'etapa' },
  { value: 'GLOBAL', label: 'global' },
  { value: 'KG', label: 'kg' },
  { value: 'M3', label: 'm³' },
];

const getUnitLabel = (value) => {
  const unit = UNITS.find(u => u.value === value);
  return unit ? unit.label : value;
};

const OrcamentoItemsGrid = ({ 
  companyId, 
  markup = 1.0, 
  markupRef = '', 
  items = [], 
  onItemsChange,
  readOnly = false 
}) => {
  const [localItems, setLocalItems] = useState(items);
  const [autocompleteResults, setAutocompleteResults] = useState([]);
  const [activeAutocomplete, setActiveAutocomplete] = useState(null); // index da linha com autocomplete ativo
  const [searchTerm, setSearchTerm] = useState('');
  const inputRefs = useRef({});

  // Sincronizar items externos
  useEffect(() => {
    setLocalItems(items);
  }, [items]);

  // Buscar autocomplete
  const fetchAutocomplete = useCallback(async (search) => {
    if (!companyId || !search || search.length < 2) {
      setAutocompleteResults([]);
      return;
    }

    try {
      const response = await axiosInstance.get(
        `/service-price-table/${companyId}/autocomplete?search=${encodeURIComponent(search)}&limit=10`
      );
      setAutocompleteResults(response.data);
    } catch (error) {
      console.error('Erro no autocomplete:', error);
      setAutocompleteResults([]);
    }
  }, [companyId]);

  // Debounce para autocomplete
  useEffect(() => {
    if (searchTerm.length >= 2) {
      const timer = setTimeout(() => {
        fetchAutocomplete(searchTerm);
      }, 300);
      return () => clearTimeout(timer);
    } else {
      setAutocompleteResults([]);
    }
  }, [searchTerm, fetchAutocomplete]);

  // Adicionar nova linha
  const addItem = () => {
    const newItem = {
      id: `temp-${Math.random().toString(36).substr(2, 9)}`,
      item_number: localItems.length + 1,
      service_price_id: null,
      description: '',
      unit: 'UN',
      quantity: 1,
      pu1_used: 0,
      markup_used: markup,
      pu2_used: 0,
      line_total: 0,
      pricing_ref: markupRef,
    };
    
    const updated = [...localItems, newItem];
    setLocalItems(updated);
    onItemsChange?.(updated);
    
    // Focar no campo descrição da nova linha
    setTimeout(() => {
      const descInput = inputRefs.current[`desc-${updated.length - 1}`];
      if (descInput) descInput.focus();
    }, 100);
  };

  // Remover linha
  const removeItem = (index) => {
    const updated = localItems.filter((_, i) => i !== index).map((item, i) => ({
      ...item,
      item_number: i + 1,
    }));
    setLocalItems(updated);
    onItemsChange?.(updated);
  };

  // Atualizar item
  const updateItem = (index, field, value) => {
    const updated = [...localItems];
    updated[index] = { ...updated[index], [field]: value };

    // Recalcular PU2 e total se necessário
    if (field === 'pu1_used' || field === 'markup_used') {
      const pu1 = field === 'pu1_used' ? parseFloat(value) || 0 : updated[index].pu1_used;
      const mkp = field === 'markup_used' ? parseFloat(value) || 1 : updated[index].markup_used;
      updated[index].pu2_used = parseFloat((pu1 * mkp).toFixed(2));
      updated[index].line_total = parseFloat((updated[index].quantity * updated[index].pu2_used).toFixed(2));
    }

    if (field === 'quantity' || field === 'pu2_used') {
      const qty = field === 'quantity' ? parseFloat(value) || 0 : updated[index].quantity;
      const pu2 = field === 'pu2_used' ? parseFloat(value) || 0 : updated[index].pu2_used;
      updated[index].line_total = parseFloat((qty * pu2).toFixed(2));
    }

    setLocalItems(updated);
    onItemsChange?.(updated);
  };

  // Selecionar item do autocomplete
  const selectAutocompleteItem = (index, service) => {
    const pu2 = parseFloat((service.pu1_base_price * markup).toFixed(2));
    
    const updated = [...localItems];
    updated[index] = {
      ...updated[index],
      service_price_id: service.id,
      description: service.description,
      unit: service.unit,
      pu1_used: service.pu1_base_price,
      markup_used: markup,
      pu2_used: pu2,
      line_total: parseFloat((updated[index].quantity * pu2).toFixed(2)),
      pricing_ref: markupRef,
    };
    
    setLocalItems(updated);
    onItemsChange?.(updated);
    setAutocompleteResults([]);
    setActiveAutocomplete(null);
    setSearchTerm('');

    // Focar no campo quantidade
    setTimeout(() => {
      const qtyInput = inputRefs.current[`qty-${index}`];
      if (qtyInput) qtyInput.focus();
    }, 100);
  };

  // Navegar com Enter
  const handleKeyDown = (e, index, field) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      
      // Se estiver no autocomplete e houver resultados, selecionar o primeiro
      if (field === 'description' && autocompleteResults.length > 0) {
        selectAutocompleteItem(index, autocompleteResults[0]);
        return;
      }

      // Ordem dos campos: description -> quantity -> pu2_used (preço)
      const fieldOrder = ['description', 'quantity', 'pu2_used'];
      const currentFieldIndex = fieldOrder.indexOf(field);
      
      if (currentFieldIndex < fieldOrder.length - 1) {
        // Ir para próximo campo na mesma linha
        const nextField = fieldOrder[currentFieldIndex + 1];
        const refKey = nextField === 'description' ? `desc-${index}` : 
                       nextField === 'quantity' ? `qty-${index}` : `price-${index}`;
        const nextInput = inputRefs.current[refKey];
        if (nextInput) nextInput.focus();
      } else {
        // Se estiver no último campo (preço), criar nova linha
        addItem();
      }
    }
  };

  // Calcular total geral
  const totalGeral = localItems.reduce((acc, item) => acc + (item.line_total || 0), 0);

  // Formatar número
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  return (
    <Card className="bg-zinc-900 border-zinc-800">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="w-5 h-5 text-purple-400" />
            Itens do Orçamento
          </CardTitle>
          <p className="text-sm text-zinc-400 mt-1">
            Markup atual: <span className="text-purple-400 font-semibold">{markup.toFixed(4)}x</span>
            {markupRef && <span className="text-zinc-500 ml-2">({markupRef})</span>}
          </p>
        </div>
        {!readOnly && (
          <Button
            onClick={addItem}
            size="sm"
            className="bg-purple-600 hover:bg-purple-700"
          >
            <Plus className="w-4 h-4 mr-1" />
            Adicionar Item
          </Button>
        )}
      </CardHeader>
      
      <CardContent className="p-0">
        {/* Header da tabela */}
        <div className="grid grid-cols-12 gap-2 px-4 py-2 bg-zinc-800 text-xs font-medium text-zinc-400 uppercase">
          <div className="col-span-1 text-center">ITEM</div>
          <div className="col-span-4">DESCRIÇÃO</div>
          <div className="col-span-1 text-center">UND</div>
          <div className="col-span-2 text-right">QUANT</div>
          <div className="col-span-2 text-right">PREÇO (PU2)</div>
          <div className="col-span-1 text-right">P.TOTAL</div>
          <div className="col-span-1 text-center">AÇÃO</div>
        </div>

        {/* Linhas de itens */}
        <div className="divide-y divide-zinc-800">
          {localItems.map((item, index) => (
            <div key={item.id} className="grid grid-cols-12 gap-2 px-4 py-2 items-center hover:bg-zinc-800/50 relative">
              {/* Número do item */}
              <div className="col-span-1 text-center text-zinc-400 font-mono">
                {String(item.item_number).padStart(3, '0')}
              </div>

              {/* Descrição com autocomplete */}
              <div className="col-span-4 relative">
                <div className="relative">
                  <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                  <Input
                    ref={(el) => inputRefs.current[`desc-${index}`] = el}
                    value={activeAutocomplete === index ? searchTerm : item.description}
                    onChange={(e) => {
                      const val = e.target.value;
                      setActiveAutocomplete(index);
                      setSearchTerm(val);
                      updateItem(index, 'description', val);
                    }}
                    onFocus={() => {
                      setActiveAutocomplete(index);
                      setSearchTerm(item.description);
                    }}
                    onBlur={() => {
                      // Delay para permitir clique no autocomplete
                      setTimeout(() => {
                        setActiveAutocomplete(null);
                        setAutocompleteResults([]);
                      }, 200);
                    }}
                    onKeyDown={(e) => handleKeyDown(e, index, 'description')}
                    placeholder="Buscar serviço..."
                    className="pl-8 bg-zinc-800 border-zinc-700 text-sm uppercase"
                    disabled={readOnly}
                  />
                </div>

                {/* Dropdown autocomplete */}
                {activeAutocomplete === index && autocompleteResults.length > 0 && (
                  <div className="absolute z-50 w-full mt-1 bg-zinc-800 border border-zinc-700 rounded-md shadow-lg max-h-48 overflow-y-auto">
                    {autocompleteResults.map((service) => (
                      <div
                        key={service.id}
                        className="px-3 py-2 hover:bg-zinc-700 cursor-pointer border-b border-zinc-700 last:border-0"
                        onMouseDown={() => selectAutocompleteItem(index, service)}
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="text-sm font-medium text-white">{service.description}</p>
                            <p className="text-xs text-zinc-400">
                              {service.code && `${service.code} • `}
                              {service.category || 'Sem categoria'} • {getUnitLabel(service.unit)}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-zinc-500">PU1</p>
                            <p className="text-sm font-medium text-green-400">
                              {formatCurrency(service.pu1_base_price)}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Unidade */}
              <div className="col-span-1">
                <Select
                  value={item.unit}
                  onValueChange={(value) => updateItem(index, 'unit', value)}
                  disabled={readOnly}
                >
                  <SelectTrigger className="bg-zinc-800 border-zinc-700 text-sm h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {UNITS.map((u) => (
                      <SelectItem key={u.value} value={u.value}>{u.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Quantidade */}
              <div className="col-span-2">
                <Input
                  ref={(el) => inputRefs.current[`qty-${index}`] = el}
                  type="number"
                  step="0.01"
                  min="0"
                  value={item.quantity}
                  onChange={(e) => updateItem(index, 'quantity', parseFloat(e.target.value) || 0)}
                  onKeyDown={(e) => handleKeyDown(e, index, 'quantity')}
                  className="bg-zinc-800 border-zinc-700 text-sm text-right"
                  disabled={readOnly}
                />
              </div>

              {/* Preço (PU2) */}
              <div className="col-span-2">
                <Input
                  ref={(el) => inputRefs.current[`price-${index}`] = el}
                  type="number"
                  step="0.01"
                  min="0"
                  value={item.pu2_used}
                  onChange={(e) => updateItem(index, 'pu2_used', parseFloat(e.target.value) || 0)}
                  onKeyDown={(e) => handleKeyDown(e, index, 'pu2_used')}
                  className="bg-zinc-800 border-zinc-700 text-sm text-right"
                  disabled={readOnly}
                />
              </div>

              {/* Total da linha */}
              <div className="col-span-1 text-right font-medium text-green-400">
                {formatCurrency(item.line_total)}
              </div>

              {/* Ações */}
              <div className="col-span-1 text-center">
                {!readOnly && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeItem(index)}
                    className="h-8 w-8 p-0 hover:bg-red-500/20 hover:text-red-400"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </div>
          ))}

          {/* Linha vazia para adicionar */}
          {localItems.length === 0 && (
            <div className="px-4 py-8 text-center text-zinc-500">
              <p>Nenhum item adicionado</p>
              {!readOnly && (
                <Button
                  onClick={addItem}
                  variant="outline"
                  size="sm"
                  className="mt-2 border-zinc-700"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Adicionar primeiro item
                </Button>
              )}
            </div>
          )}
        </div>

        {/* Rodapé com total */}
        {localItems.length > 0 && (
          <div className="px-4 py-4 bg-zinc-800/50 border-t border-zinc-700">
            <div className="flex justify-end items-center gap-4">
              <span className="text-zinc-400">Total Geral dos Serviços:</span>
              <span className="text-2xl font-bold text-white">
                {formatCurrency(totalGeral)}
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default OrcamentoItemsGrid;
