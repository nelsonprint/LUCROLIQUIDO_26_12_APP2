import React from 'react';
import { AlertTriangle, CreditCard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { useSubscription } from '../contexts/SubscriptionContext';

export const SubscriptionExpiredBanner = () => {
  const navigate = useNavigate();
  const { showExpiredBanner, isTrialExpired, isCancelled } = useSubscription();

  if (!showExpiredBanner) {
    return null;
  }

  const message = isTrialExpired 
    ? 'Seu período de teste expirou. Você pode visualizar seus dados, mas não pode criar ou editar.'
    : isCancelled 
    ? 'Sua assinatura foi cancelada. Reative para continuar usando todas as funcionalidades.'
    : 'Sua assinatura está inativa. Assine para continuar usando todas as funcionalidades.';

  return (
    <div className="bg-gradient-to-r from-red-600/90 to-orange-600/90 backdrop-blur-sm border-b border-red-500/50 px-4 py-3 shadow-lg">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-white animate-pulse" />
          <span className="text-white font-medium text-sm sm:text-base">
            {message}
          </span>
        </div>
        <Button
          onClick={() => navigate('/assinatura')}
          className="bg-white text-red-600 hover:bg-gray-100 font-semibold flex items-center gap-2 whitespace-nowrap"
          size="sm"
        >
          <CreditCard className="w-4 h-4" />
          Assinar Agora
        </Button>
      </div>
    </div>
  );
};

export default SubscriptionExpiredBanner;
