import React, { useState, useEffect } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Settings, Upload, Palette, FileText } from 'lucide-react';
import { axiosInstance } from '../App';
import { toast } from 'sonner';
import FinancialGlossary from '@/components/FinancialGlossary';

const ConfiguracaoOrcamento = ({ user, onLogout }) => {
  const [loading, setLoading] = useState(false);
  const [showGlossary, setShowGlossary] = useState(false);
  const [config, setConfig] = useState({
    logo_url: '',
    cor_primaria: '#7C3AED',
    cor_secundaria: '#3B82F6',
    texto_ciencia: '',
    texto_garantia: ''
  });

  const company = JSON.parse(localStorage.getItem('company') || '{}');

  useEffect(() => {
    if (company.id) {
      fetchConfig();
    }
  }, []);

  const fetchConfig = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get(`/orcamento-config/${company.id}`);
      setConfig(response.data);
    } catch (error) {
      console.error('Erro ao carregar configuração:', error);
      toast.error('Erro ao carregar configurações');
    } finally {
      setLoading(false);
    }
  };

  const handleLogoUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validar tipo de arquivo
    if (!file.type.startsWith('image/')) {
      toast.error('Apenas imagens são permitidas');
      return;
    }

    // Validar tamanho (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Imagem muito grande. Máximo: 5MB');
      return;
    }

    try {
      setLoading(true);
      const formData = new FormData();
      formData.append('file', file);

      const response = await axiosInstance.post('/upload-logo', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setConfig({ ...config, logo_url: response.data.logo_url });
      toast.success('Logo enviada com sucesso!');
    } catch (error) {
      console.error('Erro ao enviar logo:', error);
      toast.error('Erro ao enviar logo');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!company.id) {
      toast.error('Empresa não encontrada');
      return;
    }

    try {
      setLoading(true);
      await axiosInstance.post(`/orcamento-config?company_id=${company.id}`, config);
      toast.success('Configurações salvas com sucesso!');
    } catch (error) {
      console.error('Erro ao salvar:', error);
      toast.error('Erro ao salvar configurações');
    } finally {
      setLoading(false);
    }
  };

  const handleColorChange = (field, value) => {
    setConfig({ ...config, [field]: value });
  };

  if (loading && !config.texto_ciencia) {
    return (
      <div className="flex h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900">
        <Sidebar user={user} onLogout={onLogout} onOpenGlossary={() => setShowGlossary(true)} />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-white text-xl">Carregando...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900">
      <Sidebar user={user} onLogout={onLogout} onOpenGlossary={() => setShowGlossary(true)} />
      
      <div className="flex-1 overflow-auto">
        <div className="p-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center space-x-3 mb-2">
              <Settings className="text-purple-400" size={32} />
              <h1 className="text-3xl font-bold text-white">Configuração de Orçamento</h1>
            </div>
            <p className="text-gray-400">Personalize a aparência e conteúdo dos seus orçamentos em PDF</p>
          </div>

          <div className="space-y-6">
            {/* Card - Logo */}
            <Card className="glass border-white/10 border-l-4 border-l-blue-500">
              <CardHeader>
                <div className="flex items-center space-x-2">
                  <Upload className="text-blue-400" size={20} />
                  <CardTitle className="text-white">Logo da Empresa</CardTitle>
                </div>
                <CardDescription className="text-gray-400">
                  URL da logo que aparecerá no cabeçalho do PDF
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-gray-300">Upload de Logo</Label>
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={handleLogoUpload}
                      className="bg-white/5 border-white/10 text-white file:bg-purple-600 file:text-white file:border-0 file:px-4 file:py-2 file:rounded-md file:mr-4 cursor-pointer"
                    />
                    <p className="text-xs text-gray-500">
                      Escolha uma imagem (PNG, JPG, SVG). Máximo: 5MB. Recomendado: fundo transparente.
                    </p>
                  </div>

                  {/* Preview da logo */}
                  {config.logo_url && (
                    <div className="mt-4 p-4 bg-gray-800 rounded-lg">
                      <p className="text-sm text-gray-400 mb-3">Preview da logo:</p>
                      <div className="flex items-center justify-center bg-white/10 rounded-lg p-4">
                        <img 
                          src={`${process.env.REACT_APP_BACKEND_URL}${config.logo_url}`}
                          alt="Logo preview" 
                          className="max-h-32 object-contain"
                          onError={(e) => {
                            e.target.style.display = 'none';
                          }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Card - Cores */}
            <Card className="glass border-white/10 border-l-4 border-l-purple-500">
              <CardHeader>
                <div className="flex items-center space-x-2">
                  <Palette className="text-purple-400" size={20} />
                  <CardTitle className="text-white">Cores das Bordas</CardTitle>
                </div>
                <CardDescription className="text-gray-400">
                  Defina as duas cores para o degradê vertical nas bordas dos cards
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Cor Primária */}
                  <div className="space-y-2">
                    <Label className="text-gray-300">Cor Primária (Topo)</Label>
                    <div className="flex items-center space-x-3">
                      <input
                        type="color"
                        value={config.cor_primaria}
                        onChange={(e) => handleColorChange('cor_primaria', e.target.value)}
                        className="w-16 h-16 rounded-lg border-2 border-white/20 cursor-pointer"
                      />
                      <div className="flex-1">
                        <Input
                          type="text"
                          value={config.cor_primaria}
                          onChange={(e) => handleColorChange('cor_primaria', e.target.value)}
                          className="bg-white/5 border-white/10 text-white font-mono"
                          placeholder="#7C3AED"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Cor Secundária */}
                  <div className="space-y-2">
                    <Label className="text-gray-300">Cor Secundária (Base)</Label>
                    <div className="flex items-center space-x-3">
                      <input
                        type="color"
                        value={config.cor_secundaria}
                        onChange={(e) => handleColorChange('cor_secundaria', e.target.value)}
                        className="w-16 h-16 rounded-lg border-2 border-white/20 cursor-pointer"
                      />
                      <div className="flex-1">
                        <Input
                          type="text"
                          value={config.cor_secundaria}
                          onChange={(e) => handleColorChange('cor_secundaria', e.target.value)}
                          className="bg-white/5 border-white/10 text-white font-mono"
                          placeholder="#3B82F6"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Preview das cores */}
                <div className="mt-6 p-4 bg-gray-800 rounded-lg">
                  <p className="text-sm text-gray-400 mb-3">Preview do degradê:</p>
                  <div 
                    className="h-32 rounded-lg"
                    style={{
                      background: `linear-gradient(to bottom, ${config.cor_primaria}, ${config.cor_secundaria})`
                    }}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Card - Textos */}
            <Card className="glass border-white/10 border-l-4 border-l-green-500">
              <CardHeader>
                <div className="flex items-center space-x-2">
                  <FileText className="text-green-400" size={20} />
                  <CardTitle className="text-white">Textos do Orçamento</CardTitle>
                </div>
                <CardDescription className="text-gray-400">
                  Personalize os textos de ciência e garantia que aparecem no PDF
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Texto de Ciência */}
                <div className="space-y-2">
                  <Label className="text-gray-300">Texto de Ciência e Aceitação</Label>
                  <Textarea
                    value={config.texto_ciencia}
                    onChange={(e) => setConfig({ ...config, texto_ciencia: e.target.value })}
                    className="bg-white/5 border-white/10 text-white min-h-[100px]"
                    placeholder="Texto que será exibido na seção de ciência..."
                  />
                  <p className="text-xs text-gray-500">
                    Este texto aparecerá antes da assinatura do cliente no PDF.
                  </p>
                </div>

                {/* Texto de Garantia */}
                <div className="space-y-2">
                  <Label className="text-gray-300">Texto de Garantia dos Serviços</Label>
                  <Textarea
                    value={config.texto_garantia}
                    onChange={(e) => setConfig({ ...config, texto_garantia: e.target.value })}
                    className="bg-white/5 border-white/10 text-white min-h-[100px]"
                    placeholder="Texto sobre garantia dos serviços..."
                  />
                  <p className="text-xs text-gray-500">
                    Este texto aparecerá na seção de garantia do orçamento.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Botão Salvar */}
            <div className="flex justify-end">
              <Button
                onClick={handleSave}
                disabled={loading}
                className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-8"
              >
                {loading ? 'Salvando...' : 'Salvar Configurações'}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {showGlossary && <FinancialGlossary onClose={() => setShowGlossary(false)} />}
    </div>
  );
};

export default ConfiguracaoOrcamento;
