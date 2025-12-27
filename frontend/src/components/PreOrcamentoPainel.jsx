import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { 
  X, ChevronDown, ChevronUp, User, Phone, MapPin, Calendar, 
  FileText, Play, Pause, Volume2, Image, Trash2, UserCheck
} from 'lucide-react';
import { axiosInstance } from '../App';
import { toast } from 'sonner';

const PreOrcamentoPainel = ({ 
  companyId, 
  clienteSelecionado, 
  onUsarDadosCliente,
  onClose 
}) => {
  const [preOrcamentos, setPreOrcamentos] = useState([]);
  const [preOrcamentoSelecionado, setPreOrcamentoSelecionado] = useState(null);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(true);
  const [playingAudio, setPlayingAudio] = useState(null);
  const audioRef = useRef(null);

  // Buscar pré-orçamentos da empresa
  useEffect(() => {
    if (companyId) {
      fetchPreOrcamentos();
    }
  }, [companyId]);

  const fetchPreOrcamentos = async () => {
    setLoading(true);
    try {
      const response = await axiosInstance.get(`/pre-orcamentos/${companyId}`);
      setPreOrcamentos(response.data || []);
    } catch (error) {
      console.error('Erro ao buscar pré-orçamentos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectPreOrcamento = (preOrcamentoId) => {
    const preOrc = preOrcamentos.find(p => p.id === preOrcamentoId);
    setPreOrcamentoSelecionado(preOrc);
  };

  const handleUsarDados = () => {
    if (preOrcamentoSelecionado && onUsarDadosCliente) {
      onUsarDadosCliente(preOrcamentoSelecionado);
      toast.success('Dados do cliente carregados!');
    }
  };

  const handleRemoverPreOrcamento = async () => {
    if (!preOrcamentoSelecionado) return;
    
    if (!confirm('Deseja remover este pré-orçamento?')) return;
    
    try {
      await axiosInstance.delete(`/pre-orcamento/${preOrcamentoSelecionado.id}`);
      toast.success('Pré-orçamento removido!');
      setPreOrcamentoSelecionado(null);
      fetchPreOrcamentos();
    } catch (error) {
      toast.error('Erro ao remover pré-orçamento');
    }
  };

  const toggleAudio = (audioUrl, itemIndex) => {
    if (playingAudio === itemIndex) {
      audioRef.current?.pause();
      setPlayingAudio(null);
    } else {
      if (audioRef.current) {
        audioRef.current.src = audioUrl;
        audioRef.current.play();
        setPlayingAudio(itemIndex);
      }
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr + 'T12:00:00').toLocaleDateString('pt-BR');
  };

  return (
    <div className="w-80 bg-zinc-900 border-l border-zinc-800 flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/50">
        <div className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-orange-500" />
          <h3 className="font-semibold text-white">Pré-Orçamentos</h3>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          className="text-zinc-400 hover:text-white h-8 w-8 p-0"
        >
          <X className="w-4 h-4" />
        </Button>
      </div>

      {/* Seletor de Pré-Orçamento */}
      <div className="p-4 border-b border-zinc-800">
        <Select 
          value={preOrcamentoSelecionado?.id || ''} 
          onValueChange={handleSelectPreOrcamento}
        >
          <SelectTrigger className="bg-zinc-800 border-zinc-700">
            <SelectValue placeholder="Selecione um pré-orçamento..." />
          </SelectTrigger>
          <SelectContent className="bg-zinc-800 border-zinc-700">
            {preOrcamentos.map((pre) => (
              <SelectItem key={pre.id} value={pre.id}>
                {pre.cliente_nome} - {formatDate(pre.created_at?.split('T')[0])}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Conteúdo do Pré-Orçamento */}
      {preOrcamentoSelecionado ? (
        <div className="flex-1 overflow-y-auto">
          {/* Dados do Cliente */}
          <div className="p-4 border-b border-zinc-800">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-semibold text-orange-500">Cliente</h4>
              <Badge variant="outline" className="text-xs border-orange-500 text-orange-500">
                {preOrcamentoSelecionado.status || 'Pendente'}
              </Badge>
            </div>
            
            <div className="space-y-2 text-sm">
              <div className="flex items-start gap-2">
                <User className="w-4 h-4 text-zinc-500 mt-0.5" />
                <span className="text-zinc-300">{preOrcamentoSelecionado.cliente_nome}</span>
              </div>
              {preOrcamentoSelecionado.cliente_whatsapp && (
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-zinc-500" />
                  <span className="text-zinc-400">{preOrcamentoSelecionado.cliente_whatsapp}</span>
                </div>
              )}
            </div>
          </div>

          {/* Informações */}
          <div className="p-4 border-b border-zinc-800">
            <h4 className="text-sm font-semibold text-orange-500 mb-3">Informações</h4>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-zinc-500" />
                <span className="text-zinc-400">Vendedor:</span>
                <span className="text-zinc-300">{preOrcamentoSelecionado.vendedor_nome || '-'}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-zinc-500" />
                <span className="text-zinc-400">Data:</span>
                <span className="text-zinc-300">{formatDate(preOrcamentoSelecionado.created_at?.split('T')[0])}</span>
              </div>
              {preOrcamentoSelecionado.data_entrega && (
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-zinc-500" />
                  <span className="text-zinc-400">Previsão:</span>
                  <span className="text-zinc-300">{formatDate(preOrcamentoSelecionado.data_entrega)}</span>
                </div>
              )}
            </div>
          </div>

          {/* Observações */}
          {preOrcamentoSelecionado.observacoes && (
            <div className="p-4 border-b border-zinc-800">
              <h4 className="text-sm font-semibold text-orange-500 mb-2">Observações</h4>
              <p className="text-sm text-zinc-400">{preOrcamentoSelecionado.observacoes}</p>
            </div>
          )}

          {/* Itens do Pré-Orçamento */}
          <div className="p-4">
            <h4 className="text-sm font-semibold text-orange-500 mb-3">
              Itens ({preOrcamentoSelecionado.itens?.length || 0})
            </h4>
            
            <div className="space-y-4">
              {preOrcamentoSelecionado.itens?.map((item, index) => (
                <div key={index} className="bg-zinc-800/50 rounded-lg p-3 space-y-3">
                  {/* Número do Item */}
                  <div className="flex items-center justify-between">
                    <Badge className="bg-orange-500/20 text-orange-500 border-orange-500/30">
                      Item {String(index + 1).padStart(3, '0')}
                    </Badge>
                    <span className="text-xs text-zinc-500">Qtd: {item.quantidade || 1}</span>
                  </div>

                  {/* Foto */}
                  {item.foto_url && (
                    <div className="relative">
                      <img 
                        src={item.foto_url} 
                        alt={`Item ${index + 1}`}
                        className="w-full h-40 object-cover rounded-lg border border-zinc-700"
                      />
                    </div>
                  )}

                  {/* Descrição */}
                  {item.descricao && (
                    <div>
                      <p className="text-xs text-zinc-500 mb-1">Descrição:</p>
                      <p className="text-sm text-zinc-300">{item.descricao}</p>
                    </div>
                  )}

                  {/* Áudio */}
                  {item.audio_url && (
                    <div className="flex items-center gap-2 bg-zinc-900 rounded-lg p-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleAudio(item.audio_url, index)}
                        className={`h-8 w-8 p-0 ${playingAudio === index ? 'text-orange-500' : 'text-zinc-400'}`}
                      >
                        {playingAudio === index ? (
                          <Pause className="w-4 h-4" />
                        ) : (
                          <Play className="w-4 h-4" />
                        )}
                      </Button>
                      <div className="flex-1">
                        <div className="h-1 bg-zinc-700 rounded-full">
                          <div 
                            className={`h-1 bg-orange-500 rounded-full transition-all ${playingAudio === index ? 'w-1/2' : 'w-0'}`}
                          />
                        </div>
                      </div>
                      <Volume2 className="w-4 h-4 text-zinc-500" />
                    </div>
                  )}
                </div>
              ))}

              {(!preOrcamentoSelecionado.itens || preOrcamentoSelecionado.itens.length === 0) && (
                <p className="text-center text-zinc-500 text-sm py-4">
                  Nenhum item registrado
                </p>
              )}
            </div>
          </div>

          {/* Ações */}
          <div className="p-4 border-t border-zinc-800 space-y-2 bg-zinc-900/50">
            <Button
              onClick={handleUsarDados}
              className="w-full bg-orange-500 hover:bg-orange-600 text-white"
            >
              <UserCheck className="w-4 h-4 mr-2" />
              Usar dados do cliente
            </Button>
            <Button
              variant="outline"
              onClick={handleRemoverPreOrcamento}
              className="w-full border-red-500/50 text-red-500 hover:bg-red-500/10"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Remover pré-orçamento
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="text-center text-zinc-500">
            <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p className="text-sm">Selecione um pré-orçamento para visualizar os detalhes</p>
          </div>
        </div>
      )}

      {/* Audio element hidden */}
      <audio 
        ref={audioRef} 
        onEnded={() => setPlayingAudio(null)}
        className="hidden"
      />
    </div>
  );
};

export default PreOrcamentoPainel;
