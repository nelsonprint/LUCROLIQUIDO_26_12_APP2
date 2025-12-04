import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Clock, CheckCircle, XCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { axiosInstance } from '../App';
import { toast } from 'sonner';

export const SubscriptionCard = ({ user }) => {
  const navigate = useNavigate();
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSubscription();
  }, [user]);

  const fetchSubscription = async () => {
    try {
      const response = await axiosInstance.get(`/subscription/status/${user.user_id}`);
      setSubscription(response.data);
    } catch (error) {
      toast.error('Erro ao carregar assinatura');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return null;
  }

  if (!subscription) {
    return null;
  }

  const getStatusInfo = () => {
    switch (subscription.status) {
      case 'trial':
        return {
          icon: <Clock className="w-5 h-5" />,
          label: 'Período Trial',
          color: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/50',
          message: `${subscription.days_remaining || 0} dias restantes`,
        };
      case 'active':
        return {
          icon: <CheckCircle className="w-5 h-5" />,
          label: 'Ativo',
          color: 'bg-green-500/20 text-green-300 border-green-500/50',
          message: 'Assinatura ativa',
        };
      case 'expired':
        return {
          icon: <XCircle className="w-5 h-5" />,
          label: 'Expirado',
          color: 'bg-red-500/20 text-red-300 border-red-500/50',
          message: 'Assine para continuar',
        };
      default:
        return {
          icon: <XCircle className="w-5 h-5" />,
          label: 'Inativo',
          color: 'bg-gray-500/20 text-gray-300 border-gray-500/50',
          message: 'Status desconhecido',
        };
    }
  };

  const statusInfo = getStatusInfo();

  return (
    <Card className="glass border-white/10 mb-6" data-testid="subscription-card">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className={`p-2 rounded-full ${statusInfo.color.split(' ')[0]}`}>
              {statusInfo.icon}
            </div>
            <div>
              <Badge className={statusInfo.color} data-testid="subscription-status-badge">
                {statusInfo.label}
              </Badge>
              <p className="text-sm text-gray-400 mt-1" data-testid="subscription-message">{statusInfo.message}</p>
            </div>
          </div>

          {(subscription.status === 'trial' || subscription.status === 'expired') && (
            <Button
              onClick={() => navigate('/assinatura')}
              className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
              data-testid="subscribe-now-button"
            >
              Assinar Agora - R$ 49,90/mês
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};