import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { axiosInstance } from '../App';

const SubscriptionContext = createContext();

export const useSubscription = () => {
  const context = useContext(SubscriptionContext);
  if (!context) {
    throw new Error('useSubscription must be used within a SubscriptionProvider');
  }
  return context;
};

export const SubscriptionProvider = ({ children, user }) => {
  const [subscription, setSubscription] = useState(null);
  const [canWrite, setCanWrite] = useState(true);
  const [loading, setLoading] = useState(true);
  const [showExpiredBanner, setShowExpiredBanner] = useState(false);

  const fetchSubscriptionStatus = useCallback(async () => {
    if (!user?.id && !user?.user_id) {
      setLoading(false);
      return;
    }

    try {
      const userId = user.id || user.user_id;
      const response = await axiosInstance.get(`/subscription/status/${userId}`);
      const sub = response.data;
      
      setSubscription(sub);
      setCanWrite(sub.can_write);
      setShowExpiredBanner(sub.status === 'expired' || sub.status === 'cancelled');
    } catch (error) {
      console.error('Erro ao verificar assinatura:', error);
      // Em caso de erro, permitir acesso (evitar bloquear usuário por erro de rede)
      setCanWrite(true);
      setShowExpiredBanner(false);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchSubscriptionStatus();
    
    // Verificar a cada 5 minutos
    const interval = setInterval(fetchSubscriptionStatus, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, [fetchSubscriptionStatus]);

  const refreshSubscription = useCallback(() => {
    fetchSubscriptionStatus();
  }, [fetchSubscriptionStatus]);

  const value = {
    subscription,
    canWrite,
    loading,
    showExpiredBanner,
    refreshSubscription,
    isTrialExpired: subscription?.status === 'expired',
    isCancelled: subscription?.status === 'cancelled',
    isActive: subscription?.status === 'active',
    isTrial: subscription?.status === 'trial',
    daysRemaining: subscription?.days_remaining || 0,
  };

  return (
    <SubscriptionContext.Provider value={value}>
      {children}
    </SubscriptionContext.Provider>
  );
};

export default SubscriptionContext;
