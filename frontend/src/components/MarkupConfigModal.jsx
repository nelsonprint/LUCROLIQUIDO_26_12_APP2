import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { axiosInstance } from '../App';
import { toast } from 'sonner';
import { Settings, Copy, Calculator, TrendingUp, Percent } from 'lucide-react';

const MONTHS = [
  { value: 1, label: 'Janeiro' },
  { value: 2, label: 'Fevereiro' },
  { value: 3, label: 'Março' },
  { value: 4, label: 'Abril' },
  { value: 5, label: 'Maio' },
  { value: 6, label: 'Junho' },
  { value: 7, label: 'Julho' },
  { value: 8, label: 'Agosto' },
  { value: 9, label: 'Setembro' },
  { value: 10, label: 'Outubro' },
  { value: 11, label: 'Novembro' },
  { value: 12, label: 'Dezembro' },
];

const MarkupConfigModal = ({ open, onClose, companyId, onSave }) => {
  const today = new Date();
  const [selectedYear, setSelectedYear] = useState(today.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(today.getMonth() + 1);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    simplesEffectiveRate: 8.3,
    issRate: 3.0,
    includeMaterialsInISSBase: false,
    indirectsRate: 10.0,
    financialRate: 2.0,
    profitRate: 15.0,
    notes: ''
  });
  
  // Calculated values
  const [calculated, setCalculated] = useState({
    markupMultiplier: 1.0,
    bdiPercentage: 0.0
  });

  // Calculate markup on form change
  useEffect(() => {
    calculateMarkup();
  }, [formData]);

  // Load existing profile when month/year changes
  useEffect(() => {
    if (open && companyId) {
      loadProfile();
    }
  }, [open, selectedYear, selectedMonth, companyId]);

  const calculateMarkup = () => {
    const { simplesEffectiveRate, issRate, indirectsRate, financialRate, profitRate } = formData;
    
    // Convert percentages to decimals
    const I = (simplesEffectiveRate + issRate) / 100; // Total tax rate
    const X = indirectsRate / 100; // Indirects
    const Y = financialRate / 100; // Financial
    const Z = profitRate / 100; // Profit
    
    // Formula: markup = ((1+X)*(1+Y)*(1+Z)) / (1 - I)
    const numerator = (1 + X) * (1 + Y) * (1 + Z);
    const denominator = 1 - I;
    
    if (denominator <= 0) {
      setCalculated({ markupMultiplier: 0, bdiPercentage: 0 });
      return;
    }
    
    const markup = numerator / denominator;
    const bdi = (markup - 1) * 100;
    
    setCalculated({
      markupMultiplier: Math.round(markup * 10000) / 10000,
      bdiPercentage: Math.round(bdi * 100) / 100
    });
  };

  const loadProfile = async () => {
    setLoading(true);
    try {
      const response = await axiosInstance.get(`/markup-profile/${companyId}/${selectedYear}/${selectedMonth}`);
      
      if (response.data) {
        const profile = response.data;
        setFormData({
          simplesEffectiveRate: (profile.taxes?.simples_effective_rate || 0.083) * 100,
          issRate: (profile.taxes?.iss_rate || 0.03) * 100,
          includeMaterialsInISSBase: profile.taxes?.include_materials_in_iss_base || false,
          indirectsRate: (profile.indirects_rate || 0.10) * 100,
          financialRate: (profile.financial_rate || 0.02) * 100,
          profitRate: (profile.profit_rate || 0.15) * 100,
          notes: profile.notes || ''
        });
      } else {
        // Reset to defaults if no profile
        setFormData({
          simplesEffectiveRate: 8.3,
          issRate: 3.0,
          includeMaterialsInISSBase: false,
          indirectsRate: 10.0,
          financialRate: 2.0,
          profitRate: 15.0,
          notes: ''
        });
      }
    } catch (error) {
      console.error('Erro ao carregar perfil:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const data = {
        company_id: companyId,
        year: selectedYear,
        month: selectedMonth,
        taxes: {
          simples_effective_rate: formData.simplesEffectiveRate / 100,
          iss_rate: formData.issRate / 100,
          include_materials_in_iss_base: formData.includeMaterialsInISSBase
        },
        indirects_rate: formData.indirectsRate / 100,
        financial_rate: formData.financialRate / 100,
        profit_rate: formData.profitRate / 100,
        notes: formData.notes
      };
      
      const response = await axiosInstance.post('/markup-profile', data);
      toast.success(response.data.message);
      
      if (onSave) {
        onSave();
      }
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Erro ao salvar configuração');
    } finally {
      setSaving(false);
    }
  };

  const handleCopyPrevious = async () => {
    setLoading(true);
    try {
      const response = await axiosInstance.post(`/markup-profile/copy-previous?company_id=${companyId}&year=${selectedYear}&month=${selectedMonth}`);
      toast.success('Configuração copiada do mês anterior!');
      loadProfile();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Erro ao copiar configuração');
    } finally {
      setLoading(false);
    }
  };

  const years = [];
  for (let y = today.getFullYear() - 2; y <= today.getFullYear() + 1; y++) {
    years.push(y);
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-zinc-900 border-zinc-800 text-white max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Settings className="text-purple-400" size={24} />
            Configurar Markup/BDI Mensal
          </DialogTitle>
          <DialogDescription className="text-gray-400">
            Configure as taxas e margens para calcular o markup do mês
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Seletor de Mês/Ano */}
          <div className="flex gap-4">
            <div className="flex-1">
              <Label>Mês</Label>
              <Select value={String(selectedMonth)} onValueChange={(v) => setSelectedMonth(Number(v))}>
                <SelectTrigger className="bg-zinc-800 border-zinc-700">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-zinc-800 border-zinc-700">
                  {MONTHS.map(m => (
                    <SelectItem key={m.value} value={String(m.value)}>{m.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="w-32">
              <Label>Ano</Label>
              <Select value={String(selectedYear)} onValueChange={(v) => setSelectedYear(Number(v))}>
                <SelectTrigger className="bg-zinc-800 border-zinc-700">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-zinc-800 border-zinc-700">
                  {years.map(y => (
                    <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button
                variant="outline"
                onClick={handleCopyPrevious}
                disabled={loading}
                className="border-zinc-700 hover:bg-zinc-800"
              >
                <Copy size={16} className="mr-2" />
                Copiar Anterior
              </Button>
            </div>
          </div>

          {/* Resultado Calculado */}
          <Card className="bg-gradient-to-r from-purple-900/50 to-blue-900/50 border-purple-500/30">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Calculator className="text-purple-400" size={28} />
                  <div>
                    <p className="text-gray-400 text-sm">Markup Multiplicador</p>
                    <p className="text-3xl font-bold text-white">{calculated.markupMultiplier.toFixed(4)}x</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-gray-400 text-sm">BDI</p>
                  <p className="text-3xl font-bold text-green-400">{calculated.bdiPercentage.toFixed(2)}%</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Impostos */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-purple-400 flex items-center gap-2">
              <Percent size={18} />
              Impostos sobre Venda (I)
            </h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Simples Nacional Efetivo (%)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.simplesEffectiveRate}
                  onChange={(e) => setFormData({...formData, simplesEffectiveRate: parseFloat(e.target.value) || 0})}
                  className="bg-zinc-800 border-zinc-700"
                />
                <p className="text-xs text-gray-500 mt-1">Alíquota efetiva do Simples</p>
              </div>
              <div>
                <Label>ISS (%)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.issRate}
                  onChange={(e) => setFormData({...formData, issRate: parseFloat(e.target.value) || 0})}
                  className="bg-zinc-800 border-zinc-700"
                />
                <p className="text-xs text-gray-500 mt-1">Imposto sobre serviços</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3 p-3 bg-zinc-800/50 rounded-lg">
              <Switch
                checked={formData.includeMaterialsInISSBase}
                onCheckedChange={(checked) => setFormData({...formData, includeMaterialsInISSBase: checked})}
              />
              <div>
                <Label className="cursor-pointer">Materiais entram na base do ISS?</Label>
                <p className="text-xs text-gray-500">Se sim, o ISS incidirá sobre materiais também</p>
              </div>
            </div>
          </div>

          {/* Taxas de Formação */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-blue-400 flex items-center gap-2">
              <TrendingUp size={18} />
              Taxas de Formação de Preço
            </h3>
            
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label>Indiretas - X (%)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.indirectsRate}
                  onChange={(e) => setFormData({...formData, indirectsRate: parseFloat(e.target.value) || 0})}
                  className="bg-zinc-800 border-zinc-700"
                />
                <p className="text-xs text-gray-500 mt-1">Custos indiretos</p>
              </div>
              <div>
                <Label>Financeiro - Y (%)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.financialRate}
                  onChange={(e) => setFormData({...formData, financialRate: parseFloat(e.target.value) || 0})}
                  className="bg-zinc-800 border-zinc-700"
                />
                <p className="text-xs text-gray-500 mt-1">Taxa financeira</p>
              </div>
              <div>
                <Label>Lucro - Z (%)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.profitRate}
                  onChange={(e) => setFormData({...formData, profitRate: parseFloat(e.target.value) || 0})}
                  className="bg-zinc-800 border-zinc-700"
                />
                <p className="text-xs text-gray-500 mt-1">Margem de lucro</p>
              </div>
            </div>
          </div>

          {/* Fórmula */}
          <div className="p-3 bg-zinc-800/50 rounded-lg border border-zinc-700">
            <p className="text-xs text-gray-400 font-mono text-center">
              Markup = ((1+X) × (1+Y) × (1+Z)) / (1 - I)
            </p>
            <p className="text-xs text-gray-500 text-center mt-1">
              = ((1+{(formData.indirectsRate/100).toFixed(2)}) × (1+{(formData.financialRate/100).toFixed(2)}) × (1+{(formData.profitRate/100).toFixed(2)})) / (1 - {((formData.simplesEffectiveRate + formData.issRate)/100).toFixed(3)})
            </p>
          </div>

          {/* Observações */}
          <div>
            <Label>Observações</Label>
            <Textarea
              value={formData.notes}
              onChange={(e) => setFormData({...formData, notes: e.target.value})}
              placeholder="Anotações sobre esta configuração..."
              className="bg-zinc-800 border-zinc-700 h-20"
            />
          </div>

          {/* Botões */}
          <div className="flex justify-end gap-3 pt-4 border-t border-zinc-700">
            <Button variant="outline" onClick={onClose} className="border-zinc-700">
              Cancelar
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving}
              className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
            >
              {saving ? 'Salvando...' : 'Salvar Configuração'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MarkupConfigModal;
