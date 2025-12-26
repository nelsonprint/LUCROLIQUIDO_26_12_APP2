/**
 * Painel de Notificações Persistentes
 * Mostra notificações que só desaparecem quando o usuário clica no X
 * Posicionado no canto superior direito da tela
 */
import React, { useState, useEffect, useCallback } from 'react';
import { Bell, X, CheckCircle, AlertCircle, Info, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { axiosInstance } from '../App';

const NotificacoesPanel = ({ companyId, userId }) => {
  const [notificacoes, setNotificacoes] = useState([]);
  const [showPanel, setShowPanel] = useState(false);
  const [loading, setLoading] = useState(false);

  // Buscar notificações não lidas
  const fetchNotificacoes = useCallback(async () => {
    if (!companyId) return;
    
    try {
      const response = await axiosInstance.get(`/notificacoes/${companyId}`);
      setNotificacoes(response.data.filter(n => !n.lida));
    } catch (error) {
      console.error('Erro ao buscar notificações:', error);
    }
  }, [companyId]);

  // Buscar notificações ao montar e a cada 30 segundos
  useEffect(() => {
    fetchNotificacoes();
    const interval = setInterval(fetchNotificacoes, 30000);
    return () => clearInterval(interval);
  }, [fetchNotificacoes]);

  // Marcar notificação como lida
  const marcarComoLida = async (notificacaoId) => {
    try {
      await axiosInstance.patch(`/notificacao/${notificacaoId}/lida`);
      setNotificacoes(prev => prev.filter(n => n.id !== notificacaoId));
    } catch (error) {
      console.error('Erro ao marcar notificação como lida:', error);
    }
  };

  // Ícone baseado no tipo
  const getIcon = (tipo) => {
    switch (tipo) {
      case 'ORCAMENTO_ACEITO':
        return <CheckCircle className="w-5 h-5 text-green-400" />;
      case 'ALERTA':
        return <AlertCircle className="w-5 h-5 text-orange-400" />;
      default:
        return <Info className="w-5 h-5 text-blue-400" />;
    }
  };

  // Cor de fundo baseado no tipo
  const getBgColor = (tipo) => {
    switch (tipo) {
      case 'ORCAMENTO_ACEITO':
        return 'bg-green-500/10 border-green-500/30';
      case 'ALERTA':
        return 'bg-orange-500/10 border-orange-500/30';
      default:
        return 'bg-blue-500/10 border-blue-500/30';
    }
  };

  const naoLidas = notificacoes.length;

  return (
    <>
      {/* Botão do sino */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setShowPanel(!showPanel)}
        className="relative text-zinc-400 hover:text-white"
      >
        <Bell className="w-5 h-5" />
        {naoLidas > 0 && (
          <Badge 
            className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 bg-red-500 text-white text-xs animate-pulse"
          >
            {naoLidas}
          </Badge>
        )}
      </Button>

      {/* Overlay para fechar ao clicar fora */}
      {showPanel && (
        <div 
          className="fixed inset-0 z-[9998]" 
          onClick={() => setShowPanel(false)}
        />
      )}

      {/* Painel de notificações - FIXO no canto superior direito */}
      {showPanel && (
        <div className="fixed top-4 right-4 w-96 max-h-[500px] overflow-y-auto bg-zinc-900 border border-zinc-700 rounded-lg shadow-2xl z-[9999]">
          <div className="sticky top-0 bg-zinc-900 p-4 border-b border-zinc-700 flex items-center justify-between">
            <h3 className="font-semibold text-white flex items-center gap-2">
              <Bell className="w-4 h-4" />
              Notificações
            </h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowPanel(false)}
              className="text-zinc-400 hover:text-white h-6 w-6 p-0"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          <div className="p-2">
            {naoLidas === 0 ? (
              <div className="p-8 text-center text-zinc-500">
                <Bell className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>Nenhuma notificação nova</p>
              </div>
            ) : (
              <div className="space-y-2">
                {notificacoes.map((notif) => (
                  <div
                    key={notif.id}
                    className={`relative p-4 rounded-lg border ${getBgColor(notif.tipo)} transition-all`}
                  >
                    {/* Botão X para fechar */}
                    <button
                      onClick={() => marcarComoLida(notif.id)}
                      className="absolute top-2 right-2 text-zinc-500 hover:text-white transition-colors"
                      title="Fechar notificação"
                    >
                      <X className="w-4 h-4" />
                    </button>

                    {/* Conteúdo */}
                    <div className="flex gap-3 pr-6">
                      <div className="flex-shrink-0 mt-1">
                        {getIcon(notif.tipo)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-white text-sm">
                          {notif.titulo}
                        </h4>
                        <p className="text-zinc-400 text-sm mt-1 whitespace-pre-line">
                          {notif.mensagem}
                        </p>
                        
                        {/* Data */}
                        <p className="text-zinc-600 text-xs mt-2">
                          {new Date(notif.created_at).toLocaleString('pt-BR')}
                        </p>

                        {/* Link para WhatsApp da empresa (se houver) */}
                        {notif.whatsapp_url && (
                          <a
                            href={notif.whatsapp_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 mt-2 text-green-400 hover:text-green-300 text-sm"
                          >
                            <ExternalLink className="w-3 h-3" />
                            Ver no WhatsApp
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default NotificacoesPanel;
