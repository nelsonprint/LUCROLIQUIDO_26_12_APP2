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
  const [uploadingCapa, setUploadingCapa] = useState(false);
  const [config, setConfig] = useState({
    logo_url: '',
    cor_primaria: '#7C3AED',
    cor_secundaria: '#3B82F6',
    texto_ciencia: '',
    texto_garantia: '',
    capa_tipo: 'modelo',
    capa_modelo: 1,
    capa_personalizada_url: ''
  });

  const company = JSON.parse(localStorage.getItem('company') || '{}');

  // Definição dos 20 modelos de capa
  const MODELOS_CAPA = [
    { id: 1, nome: 'Triângulos', desc: 'Formas triangulares modernas' },
    { id: 2, nome: 'Círculos', desc: 'Círculos e elipses fluidos' },
    { id: 3, nome: 'Hexágonos', desc: 'Padrão colmeia tecnológico' },
    { id: 4, nome: 'Ondas', desc: 'Curvas suaves e elegantes' },
    { id: 5, nome: 'Losangos', desc: 'Diamantes geométricos' },
    { id: 6, nome: 'Diagonais', desc: 'Linhas em diagonal' },
    { id: 7, nome: 'Grade', desc: 'Quadrados organizados' },
    { id: 8, nome: 'Semicírculos', desc: 'Arcos modernos' },
    { id: 9, nome: 'Retângulos', desc: 'Formas sobrepostas' },
    { id: 10, nome: 'Pontos', desc: 'Padrão de dots' },
    { id: 11, nome: 'Arcos', desc: 'Curvas arquitetônicas' },
    { id: 12, nome: 'Faixas H', desc: 'Faixas horizontais' },
    { id: 13, nome: 'Faixas V', desc: 'Faixas verticais' },
    { id: 14, nome: 'Cantos', desc: 'Decoração nos cantos' },
    { id: 15, nome: 'Moldura', desc: 'Borda elegante' },
    { id: 16, nome: 'Angular', desc: 'Gradiente angular' },
    { id: 17, nome: 'Concêntrico', desc: 'Círculos concêntricos' },
    { id: 18, nome: 'Mosaico', desc: 'Mix geométrico' },
    { id: 19, nome: 'Cruzado', desc: 'Linhas cruzadas' },
    { id: 20, nome: 'Fluido', desc: 'Formas orgânicas' },
  ];

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

  const handleCapaUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Validar tipo
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Apenas JPG e PNG são permitidos');
      return;
    }

    // Validar tamanho (10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Imagem muito grande. Máximo: 10MB');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);

    try {
      setUploadingCapa(true);
      const response = await axiosInstance.post('/upload-capa', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setConfig({ 
        ...config, 
        capa_personalizada_url: response.data.capa_url,
        capa_tipo: 'personalizado'
      });
      toast.success('Capa enviada com sucesso!');
    } catch (error) {
      console.error('Erro ao enviar capa:', error);
      toast.error('Erro ao enviar capa');
    } finally {
      setUploadingCapa(false);
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
                          src={config.logo_preview || `${process.env.REACT_APP_BACKEND_URL}${config.logo_url}`}
                          alt="Logo preview" 
                          className="max-h-32 object-contain"
                          onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.parentElement.innerHTML = '<p class="text-red-400 text-sm">Erro ao carregar logo</p>';
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

            {/* Card - Modelo da Capa */}
            <Card className="glass border-white/10 border-l-4 border-l-orange-500">
              <CardHeader>
                <div className="flex items-center space-x-2">
                  <FileText className="text-orange-400" size={20} />
                  <CardTitle className="text-white">Modelo da Capa do Orçamento</CardTitle>
                </div>
                <CardDescription className="text-gray-400">
                  Escolha um modelo pré-definido ou envie sua própria capa personalizada
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Seleção de tipo */}
                <div className="flex gap-4">
                  <button
                    onClick={() => setConfig({ ...config, capa_tipo: 'modelo' })}
                    className={`flex-1 p-4 rounded-lg border-2 transition-all ${
                      config.capa_tipo === 'modelo' 
                        ? 'border-orange-500 bg-orange-500/20' 
                        : 'border-white/20 bg-white/5 hover:border-white/40'
                    }`}
                  >
                    <p className="text-white font-medium">📐 Modelos Pré-definidos</p>
                    <p className="text-xs text-gray-400 mt-1">20 modelos geométricos</p>
                  </button>
                  <button
                    onClick={() => setConfig({ ...config, capa_tipo: 'personalizado' })}
                    className={`flex-1 p-4 rounded-lg border-2 transition-all ${
                      config.capa_tipo === 'personalizado' 
                        ? 'border-orange-500 bg-orange-500/20' 
                        : 'border-white/20 bg-white/5 hover:border-white/40'
                    }`}
                  >
                    <p className="text-white font-medium">🖼️ Template Personalizado</p>
                    <p className="text-xs text-gray-400 mt-1">Envie sua imagem JPG/PNG</p>
                  </button>
                </div>

                {/* Grid de modelos pré-definidos */}
                {config.capa_tipo === 'modelo' && (
                  <div>
                    <Label className="text-gray-300 mb-3 block">Selecione um modelo:</Label>
                    <div className="grid grid-cols-4 md:grid-cols-5 gap-3">
                      {MODELOS_CAPA.map((modelo) => (
                        <button
                          key={modelo.id}
                          onClick={() => setConfig({ ...config, capa_modelo: modelo.id })}
                          className={`relative p-3 rounded-lg border-2 transition-all aspect-[3/4] flex flex-col items-center justify-center ${
                            config.capa_modelo === modelo.id 
                              ? 'border-orange-500 bg-orange-500/20' 
                              : 'border-white/20 bg-white/5 hover:border-white/40'
                          }`}
                          title={modelo.desc}
                        >
                          {/* Miniatura visual do modelo */}
                          <div 
                            className="w-full h-full absolute inset-0 rounded-md overflow-hidden"
                            style={{
                              background: `linear-gradient(135deg, ${config.cor_primaria}30, ${config.cor_secundaria}30)`
                            }}
                          >
                            {/* Formas geométricas simplificadas para preview */}
                            {modelo.id === 1 && (
                              <>
                                <div className="absolute top-0 right-0 w-0 h-0 border-l-[40px] border-l-transparent border-b-[60px]" style={{ borderBottomColor: config.cor_primaria }} />
                                <div className="absolute bottom-0 left-0 w-0 h-0 border-r-[30px] border-r-transparent border-t-[40px]" style={{ borderTopColor: config.cor_secundaria }} />
                              </>
                            )}
                            {modelo.id === 2 && (
                              <>
                                <div className="absolute top-2 right-2 w-10 h-10 rounded-full" style={{ background: config.cor_primaria }} />
                                <div className="absolute bottom-4 left-2 w-6 h-6 rounded-full" style={{ background: config.cor_secundaria }} />
                              </>
                            )}
                            {modelo.id === 3 && (
                              <div className="absolute inset-0 flex items-center justify-center opacity-50">
                                <div className="grid grid-cols-3 gap-1">
                                  {[1,2,3,4,5,6].map(i => (
                                    <div key={i} className="w-3 h-3" style={{ background: i%2 ? config.cor_primaria : config.cor_secundaria, clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)' }} />
                                  ))}
                                </div>
                              </div>
                            )}
                            {modelo.id >= 4 && (
                              <div className="absolute inset-2 rounded opacity-30" style={{ background: `linear-gradient(${modelo.id * 18}deg, ${config.cor_primaria}, ${config.cor_secundaria})` }} />
                            )}
                          </div>
                          <span className="relative z-10 text-[10px] text-white font-medium text-center">{modelo.nome}</span>
                          {config.capa_modelo === modelo.id && (
                            <div className="absolute top-1 right-1 w-4 h-4 bg-orange-500 rounded-full flex items-center justify-center">
                              <span className="text-white text-[10px]">✓</span>
                            </div>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Upload de capa personalizada */}
                {config.capa_tipo === 'personalizado' && (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label className="text-gray-300">Upload de Template Personalizado</Label>
                      <Input
                        type="file"
                        accept="image/jpeg,image/jpg,image/png"
                        onChange={handleCapaUpload}
                        disabled={uploadingCapa}
                        className="bg-white/5 border-white/10 text-white file:bg-orange-600 file:text-white file:border-0 file:px-4 file:py-2 file:rounded-md file:mr-4 cursor-pointer"
                      />
                      <p className="text-xs text-gray-500">
                        Envie uma imagem JPG ou PNG (máximo 10MB). Tamanho recomendado: 595x842 pixels (A4).
                      </p>
                    </div>

                    {/* Preview da capa personalizada */}
                    {config.capa_personalizada_url && (
                      <div className="p-4 bg-gray-800 rounded-lg">
                        <p className="text-sm text-gray-400 mb-3">Preview da capa:</p>
                        <div className="flex items-center justify-center bg-white/10 rounded-lg p-4">
                          <img 
                            src={config.capa_preview || `${process.env.REACT_APP_BACKEND_URL}${config.capa_personalizada_url}`}
                            alt="Capa preview" 
                            className="max-h-48 object-contain rounded shadow-lg"
                            onError={(e) => {
                              e.target.style.display = 'none';
                            }}
                          />
                        </div>
                      </div>
                    )}

                    {!config.capa_personalizada_url && (
                      <div className="border-2 border-dashed border-white/20 rounded-lg p-8 text-center">
                        <p className="text-gray-400">Nenhuma capa personalizada enviada</p>
                        <p className="text-xs text-gray-500 mt-1">Envie uma imagem para usar como capa</p>
                      </div>
                    )}
                  </div>
                )}
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
