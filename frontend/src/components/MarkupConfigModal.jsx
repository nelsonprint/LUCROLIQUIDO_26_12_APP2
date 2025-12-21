import React, { useState, useEffect, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { axiosInstance } from '../App';
import { toast } from 'sonner';
import { Settings, Calculator, Zap, Lock, Unlock, AlertTriangle, RefreshCw, CheckCircle } from 'lucide-react';

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
  const [profileId, setProfileId] = useState(null);
  
  // Modo: MANUAL ou AUTO_MODEL2
  const [mode, setMode] = useState('MANUAL');
  
  // Status de fechamento
  const [isClosed, setIsClosed] = useState(false);
  
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

  // X_real suggestion (Modelo 2)
  const [xRealData, setXRealData] = useState(null);
  const [loadingXReal, setLoadingXReal] = useState(false);

  // Calculate markup whenever form data changes
  useEffect(() => {
    const I = (formData.simplesEffectiveRate + formData.issRate) / 100;
    const X = formData.indirectsRate / 100;
    const Y = formData.financialRate / 100;
    const Z = formData.profitRate / 100;
    
    if (I >= 1) {
      setCalculated({ markupMultiplier: 0, bdiPercentage: 0 });
      return;
    }
    
    const numerator = (1 + X) * (1 + Y) * (1 + Z);
    const denominator = 1 - I;
    const markup = numerator / denominator;
    const bdi = (markup - 1) * 100;
    
    setCalculated({
      markupMultiplier: parseFloat(markup.toFixed(4)),
      bdiPercentage: parseFloat(bdi.toFixed(2))
    });
  }, [formData]);

  const loadProfile = useCallback(async () => {
    setLoading(true);
    try {
      const response = await axiosInstance.get(
        `/markup-profile/${companyId}/${selectedYear}/${selectedMonth}`
      );
      
      if (response.data.has_config) {
        const profile = response.data;
        setProfileId(profile.id);
        setIsClosed(profile.is_closed || false);
        setMode(profile.mode || 'MANUAL');
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
        // Reset to defaults
        setProfileId(null);
        setIsClosed(false);
        setMode('MANUAL');
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
  }, [companyId, selectedYear, selectedMonth]);

  const fetchXReal = useCallback(async () => {
    if (!companyId) return;
    setLoadingXReal(true);
    try {
      const response = await axiosInstance.get(
        `/markup-profile/calculate-x-real/${companyId}/${selectedYear}/${selectedMonth}`
      );
      setXRealData(response.data);
    } catch (error) {
      console.error('Erro ao calcular X_real:', error);
      setXRealData(null);
    } finally {
      setLoadingXReal(false);
    }
  }, [companyId, selectedYear, selectedMonth]);

  const applyXReal = () => {
    if (xRealData && !xRealData.error && xRealData.x_real_percent > 0) {
      setFormData(prev => ({
        ...prev,
        indirectsRate: xRealData.x_real_percent
      }));
      toast.success(`X aplicado: ${xRealData.x_real_percent}% (baseado em ${xRealData.periodo_referencia_label})`);
    }
  };

  const handleSave = async () => {
    if (isClosed) {
      toast.error('Este mês está fechado. Reabra para editar.');
      return;
    }
    
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
        notes: formData.notes,
        mode: mode,
        // Campos do Modelo 2 (se aplicável)
        x_real_applied: mode === 'AUTO_MODEL2' && xRealData ? xRealData.x_real_percent / 100 : null,
        x_real_base_month: mode === 'AUTO_MODEL2' && xRealData ? xRealData.periodo_referencia : null,
        x_real_indirects_total: mode === 'AUTO_MODEL2' && xRealData ? xRealData.despesas_indiretas : null,
        x_real_revenue_base: mode === 'AUTO_MODEL2' && xRealData ? xRealData.receita_base : null,
        x_real_calculated_at: mode === 'AUTO_MODEL2' && xRealData ? xRealData.calculated_at : null
      };
      
      await axiosInstance.post('/markup-profile', data);
      toast.success('Markup salvo com sucesso!');
      onSave?.();
      onClose();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Erro ao salvar');
    } finally {
      setSaving(false);
    }
  };

  const handleCloseMonth = async () => {
    if (!profileId) {
      toast.error('Salve o perfil primeiro antes de fechar o mês');
      return;
    }
    
    try {
      await axiosInstance.post(`/markup-profile/${profileId}/close-month`);
      toast.success('Mês fechado com sucesso!');
      setIsClosed(true);
    } catch (error) {
      toast.error('Erro ao fechar mês');
    }
  };

  const handleReopenMonth = async () => {
    if (!profileId) return;
    
    try {
      await axiosInstance.post(`/markup-profile/${profileId}/reopen-month`);
      toast.success('Mês reaberto!');
      setIsClosed(false);
    } catch (error) {
      toast.error('Erro ao reabrir mês');
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-zinc-900 border-zinc-800 max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-purple-400" />
            Configurar Markup/BDI
            {isClosed && (
              <Badge className="ml-2 bg-red-500/20 text-red-400 border-red-500/30">
                <Lock className="w-3 h-3 mr-1" />
                Mês Fechado
              </Badge>
            )}
          </DialogTitle>
          <DialogDescription className="text-zinc-400">
            Configure o markup para o mês selecionado
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="py-8 text-center text-zinc-400">Carregando...</div>
        ) : (
          <div className="space-y-4">
            {/* Seleção de Mês/Ano */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Mês</Label>
                <Select 
                  value={selectedMonth.toString()} 
                  onValueChange={(v) => setSelectedMonth(parseInt(v))}
                  disabled={isClosed}
                >
                  <SelectTrigger className="bg-zinc-800 border-zinc-700">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {MONTHS.map(m => (
                      <SelectItem key={m.value} value={m.value.toString()}>{m.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Ano</Label>
                <Select 
                  value={selectedYear.toString()} 
                  onValueChange={(v) => setSelectedYear(parseInt(v))}
                  disabled={isClosed}
                >
                  <SelectTrigger className="bg-zinc-800 border-zinc-700">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[today.getFullYear() - 1, today.getFullYear(), today.getFullYear() + 1].map(y => (
                      <SelectItem key={y} value={y.toString()}>{y}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Tabs: Manual / Automático */}
            <Tabs value={mode} onValueChange={(v) => !isClosed && setMode(v)}>
              <TabsList className="grid w-full grid-cols-2 bg-zinc-800">
                <TabsTrigger value="MANUAL" disabled={isClosed}>
                  <Calculator className="w-4 h-4 mr-2" />
                  Manual
                </TabsTrigger>
                <TabsTrigger value="AUTO_MODEL2" disabled={isClosed}>
                  <Zap className="w-4 h-4 mr-2" />
                  Automático (Modelo 2)
                </TabsTrigger>
              </TabsList>

              {/* Modo Automático - Card de Sugestão */}
              {mode === 'AUTO_MODEL2' && (
                <div className="mt-4">
                  {loadingXReal ? (
                    <Card className="bg-zinc-800 border-zinc-700">
                      <CardContent className="py-4 text-center text-zinc-400">
                        <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2" />
                        Calculando X_real...
                      </CardContent>
                    </Card>
                  ) : xRealData?.error ? (
                    <Card className="bg-orange-500/10 border-orange-500/30">
                      <CardContent className="py-4">
                        <div className="flex items-start gap-3">
                          <AlertTriangle className="w-5 h-5 text-orange-400 flex-shrink-0" />
                          <div>
                            <p className="font-medium text-orange-300">Atenção</p>
                            <p className="text-sm text-zinc-400">{xRealData.message}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ) : xRealData ? (
                    <Card className="bg-gradient-to-r from-blue-900/30 to-purple-900/30 border-blue-500/30">
                      <CardContent className="py-4">
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <p className="text-sm text-blue-300 font-medium">
                              Sugestão baseada em {xRealData.periodo_referencia_label}
                            </p>
                            <p className="text-3xl font-bold text-white">
                              X = {xRealData.x_real_percent}%
                            </p>
                          </div>
                          <Button 
                            onClick={applyXReal} 
                            disabled={isClosed || xRealData.x_real_percent === 0}
                            className="bg-blue-600 hover:bg-blue-700"
                          >
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Aplicar X_real
                          </Button>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div className="bg-zinc-800/50 rounded p-2">
                            <p className="text-zinc-400">Despesas Indiretas</p>
                            <p className="font-medium">{formatCurrency(xRealData.despesas_indiretas)}</p>
                          </div>
                          <div className="bg-zinc-800/50 rounded p-2">
                            <p className="text-zinc-400">Receita Base</p>
                            <p className="font-medium">{formatCurrency(xRealData.receita_base)}</p>
                          </div>
                        </div>

                        {xRealData.warning && (
                          <p className="text-xs text-orange-400 mt-2">
                            ⚠️ {xRealData.warning}
                          </p>
                        )}

                        {xRealData.categorias_usadas?.length > 0 && (
                          <div className="mt-3">
                            <p className="text-xs text-zinc-400 mb-1">Categorias consideradas:</p>
                            <div className="flex flex-wrap gap-1">
                              {xRealData.categorias_usadas.map(cat => (
                                <Badge key={cat} variant="outline" className="text-xs border-zinc-600">
                                  {cat}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ) : null}
                </div>
              )}
            </Tabs>

            {/* Impostos */}
            <Card className="bg-zinc-800 border-zinc-700">
              <CardContent className="pt-4">
                <p className="text-sm font-medium text-zinc-300 mb-3">I - Impostos sobre Venda</p>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs">Simples Nacional (%)</Label>
                    <Input
                      type="number"
                      step="0.1"
                      value={formData.simplesEffectiveRate}
                      onChange={(e) => setFormData({...formData, simplesEffectiveRate: parseFloat(e.target.value) || 0})}
                      className="bg-zinc-900 border-zinc-600"
                      disabled={isClosed}
                    />
                  </div>
                  <div>
                    <Label className="text-xs">ISS (%)</Label>
                    <Input
                      type="number"
                      step="0.1"
                      value={formData.issRate}
                      onChange={(e) => setFormData({...formData, issRate: parseFloat(e.target.value) || 0})}
                      className="bg-zinc-900 border-zinc-600"
                      disabled={isClosed}
                    />
                  </div>
                </div>
                <p className="text-xs text-zinc-500 mt-2">
                  Total I: {(formData.simplesEffectiveRate + formData.issRate).toFixed(1)}%
                </p>
              </CardContent>
            </Card>

            {/* X, Y, Z */}
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label className="flex items-center gap-1">
                  X - Indiretas (%)
                  {mode === 'AUTO_MODEL2' && <Zap className="w-3 h-3 text-blue-400" />}
                </Label>
                <Input
                  type="number"
                  step="0.1"
                  value={formData.indirectsRate}
                  onChange={(e) => setFormData({...formData, indirectsRate: parseFloat(e.target.value) || 0})}
                  className="bg-zinc-800 border-zinc-700"
                  disabled={isClosed}
                />
              </div>
              <div>
                <Label>Y - Financeiro (%)</Label>
                <Input
                  type="number"
                  step="0.1"
                  value={formData.financialRate}
                  onChange={(e) => setFormData({...formData, financialRate: parseFloat(e.target.value) || 0})}
                  className="bg-zinc-800 border-zinc-700"
                  disabled={isClosed}
                />
              </div>
              <div>
                <Label>Z - Lucro (%)</Label>
                <Input
                  type="number"
                  step="0.1"
                  value={formData.profitRate}
                  onChange={(e) => setFormData({...formData, profitRate: parseFloat(e.target.value) || 0})}
                  className="bg-zinc-800 border-zinc-700"
                  disabled={isClosed}
                />
              </div>
            </div>

            {/* Resultado */}
            <Card className="bg-gradient-to-r from-purple-900/50 to-blue-900/50 border-purple-500/30">
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-zinc-400">Markup Multiplicador</p>
                    <p className="text-3xl font-bold text-white">{calculated.markupMultiplier}x</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-zinc-400">BDI</p>
                    <p className="text-3xl font-bold text-purple-400">{calculated.bdiPercentage}%</p>
                  </div>
                </div>
                <p className="text-xs text-zinc-500 mt-3">
                  Fórmula: ((1+X) × (1+Y) × (1+Z)) / (1 - I)
                </p>
              </CardContent>
            </Card>

            {/* Observações */}
            <div>
              <Label>Observações</Label>
              <Textarea
                value={formData.notes}
                onChange={(e) => setFormData({...formData, notes: e.target.value})}
                className="bg-zinc-800 border-zinc-700"
                rows={2}
                disabled={isClosed}
              />
            </div>

            {/* Botões */}
            <div className="flex justify-between pt-4">
              <div>
                {profileId && (
                  isClosed ? (
                    <Button variant="outline" onClick={handleReopenMonth} className="border-zinc-700">
                      <Unlock className="w-4 h-4 mr-2" />
                      Reabrir Mês
                    </Button>
                  ) : (
                    <Button variant="outline" onClick={handleCloseMonth} className="border-orange-500 text-orange-400 hover:bg-orange-500/20">
                      <Lock className="w-4 h-4 mr-2" />
                      Fechar Mês
                    </Button>
                  )
                )}
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={onClose} className="border-zinc-700">
                  Cancelar
                </Button>
                <Button 
                  onClick={handleSave} 
                  disabled={saving || isClosed}
                  className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                >
                  {saving ? 'Salvando...' : 'Salvar Markup'}
                </Button>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default MarkupConfigModal;
