import React, { useState, useEffect } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { SubscriptionCard } from '@/components/SubscriptionCard';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { axiosInstance } from '../App';
import { toast } from 'sonner';
import { CreditCard, CheckCircle, Clock, QrCode } from 'lucide-react';

const Assinatura = ({ user, onLogout }) => {
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [paymentData, setPaymentData] = useState(null);

  useEffect(() => {
    fetchSubscription();
  }, []);

  const fetchSubscription = async () => {
    try {
      const userId = user?.id || user?.user_id;
      const response = await axiosInstance.get(`/subscription/status/${userId}`);
      setSubscription(response.data);
    } catch (error) {
      console.error('Erro ao carregar assinatura:', error);
      toast.error('Erro ao carregar assinatura');
    }
  };

  const createPayment = async () => {
    setLoading(true);

    try {
      const response = await axiosInstance.post('/subscription/create-payment', {
        user_id: user.user_id,
        email: user.email,
      });

      setPaymentData(response.data);
      setShowPaymentDialog(true);
      toast.success('QR Code PIX gerado!');
    } catch (error) {
      toast.error('Erro ao gerar pagamento');
    } finally {
      setLoading(false);
    }
  };

  const getStatusInfo = () => {
    if (!subscription) return null;

    switch (subscription.status) {
      case 'trial':
        return {
          icon: <Clock className="w-6 h-6" />,
          label: 'Período Trial',
          color: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/50',
          description: `Você tem ${subscription.days_remaining || 0} dias restantes de trial gratuito.`,
        };
      case 'active':
        return {
          icon: <CheckCircle className="w-6 h-6" />,
          label: 'Assinatura Ativa',
          color: 'bg-green-500/20 text-green-300 border-green-500/50',
          description: 'Sua assinatura está ativa e renovará automaticamente.',
        };
      case 'expired':
        return {
          icon: <Clock className="w-6 h-6" />,
          label: 'Assinatura Expirada',
          color: 'bg-red-500/20 text-red-300 border-red-500/50',
          description: 'Sua assinatura expirou. Renove para continuar usando.',
        };
      default:
        return {
          icon: <Clock className="w-6 h-6" />,
          label: 'Status Desconhecido',
          color: 'bg-gray-500/20 text-gray-300 border-gray-500/50',
          description: 'Status da assinatura não disponível.',
        };
    }
  };

  const statusInfo = getStatusInfo();

  return (
    <div className="flex min-h-screen" data-testid="assinatura-page">
      <Sidebar user={user} onLogout={onLogout} />

      <div className="flex-1 p-8">
        <SubscriptionCard user={user} />

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2" data-testid="assinatura-title">Assinatura</h1>
          <p className="text-gray-400">Gerencie sua assinatura e pagamentos</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Status da Assinatura */}
          {statusInfo && subscription && (
            <Card className="glass border-white/10" data-testid="subscription-status-card">
              <CardHeader>
                <CardTitle className="text-white">Status da Assinatura</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-4">
                  <div className={`p-3 rounded-full ${statusInfo.color.split(' ')[0]}`}>
                    {statusInfo.icon}
                  </div>
                  <div>
                    <Badge className={statusInfo.color} data-testid="subscription-status-badge">
                      {statusInfo.label}
                    </Badge>
                    <p className="text-sm text-gray-400 mt-2">{statusInfo.description}</p>
                  </div>
                </div>

                {subscription.status === 'trial' && (
                  <div className="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                    <p className="text-sm text-yellow-200">
                      ⚠️ Seu trial expira em{' '}
                      <strong>{new Date(subscription.trial_end).toLocaleDateString('pt-BR')}</strong>
                    </p>
                  </div>
                )}

                {subscription.status === 'active' && subscription.next_billing_date && (
                  <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
                    <p className="text-sm text-green-200">
                      ✅ Próxima cobrança:{' '}
                      <strong>{new Date(subscription.next_billing_date).toLocaleDateString('pt-BR')}</strong>
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Plano */}
          <Card className="glass border-white/10" data-testid="plan-card">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <CreditCard className="mr-2" />
                Plano Mensal
              </CardTitle>
              <CardDescription className="text-gray-400">
                Acesso completo a todas as funcionalidades
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center py-6">
                <p className="text-5xl font-bold text-white mb-2">R$ 49,90</p>
                <p className="text-gray-400">por mês</p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center text-gray-300">
                  <CheckCircle className="mr-2 text-green-400" size={18} />
                  Dashboard com métricas em tempo real
                </div>
                <div className="flex items-center text-gray-300">
                  <CheckCircle className="mr-2 text-green-400" size={18} />
                  Gestão ilimitada de lançamentos
                </div>
                <div className="flex items-center text-gray-300">
                  <CheckCircle className="mr-2 text-green-400" size={18} />
                  Análise financeira com IA (ChatGPT)
                </div>
                <div className="flex items-center text-gray-300">
                  <CheckCircle className="mr-2 text-green-400" size={18} />
                  Metas mensais e termômetro de progresso
                </div>
                <div className="flex items-center text-gray-300">
                  <CheckCircle className="mr-2 text-green-400" size={18} />
                  Calculadora de precificação
                </div>
                <div className="flex items-center text-gray-300">
                  <CheckCircle className="mr-2 text-green-400" size={18} />
                  Exportação para Excel
                </div>
              </div>

              {(subscription?.status === 'trial' || subscription?.status === 'expired') && (
                <Button
                  onClick={createPayment}
                  disabled={loading}
                  data-testid="subscribe-button"
                  className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                >
                  {loading ? 'Gerando...' : 'Assinar Agora com PIX'}
                </Button>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Informações Adicionais */}
        <Card className="glass border-white/10 mt-6" data-testid="additional-info-card">
          <CardHeader>
            <CardTitle className="text-white">Informações Importantes</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3 text-gray-300">
              <li className="flex items-start">
                <span className="mr-3">•</span>
                <span>O pagamento é processado via PIX pelo Mercado Pago</span>
              </li>
              <li className="flex items-start">
                <span className="mr-3">•</span>
                <span>Após a confirmação do pagamento, sua assinatura será ativada automaticamente</span>
              </li>
              <li className="flex items-start">
                <span className="mr-3">•</span>
                <span>A cobrança é mensal e renovada automaticamente</span>
              </li>
              <li className="flex items-start">
                <span className="mr-3">•</span>
                <span>Você pode cancelar sua assinatura a qualquer momento</span>
              </li>
              <li className="flex items-start">
                <span className="mr-3">•</span>
                <span>Seus dados estão seguros e protegidos</span>
              </li>
            </ul>
          </CardContent>
        </Card>

        {/* Dialog Pagamento PIX */}
        <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
          <DialogContent className="glass border-white/10 max-w-md" data-testid="payment-dialog">
            <DialogHeader>
              <DialogTitle className="text-white flex items-center">
                <QrCode className="mr-2" />
                Pagamento via PIX
              </DialogTitle>
            </DialogHeader>
            {paymentData && (
              <div className="space-y-4">
                <div className="text-center">
                  <p className="text-gray-400 mb-4">Escaneie o QR Code para pagar</p>
                  {paymentData.qr_code_base64 && (
                    <img
                      src={`data:image/png;base64,${paymentData.qr_code_base64}`}
                      alt="QR Code PIX"
                      data-testid="qr-code-image"
                      className="mx-auto bg-white p-4 rounded-lg"
                    />
                  )}
                </div>

                <div className="p-4 bg-white/5 rounded-lg">
                  <p className="text-sm text-gray-400 mb-2">Código PIX (Copiar e Colar)</p>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 text-xs bg-black/30 p-2 rounded text-white break-all" data-testid="pix-code">
                      {paymentData.qr_code}
                    </code>
                    <Button
                      size="sm"
                      onClick={() => {
                        navigator.clipboard.writeText(paymentData.qr_code);
                        toast.success('Código copiado!');
                      }}
                      data-testid="copy-pix-code-button"
                    >
                      Copiar
                    </Button>
                  </div>
                </div>

                <div className="text-center text-2xl font-bold text-white">
                  R$ {paymentData.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </div>

                <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                  <p className="text-sm text-blue-200">
                    🔔 Após o pagamento, sua assinatura será ativada automaticamente em alguns minutos.
                  </p>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default Assinatura;