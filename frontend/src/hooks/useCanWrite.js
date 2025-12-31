import { useSubscription } from '../contexts/SubscriptionContext';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

/**
 * Hook para verificar se o usuário pode realizar operações de escrita
 * Retorna uma função que pode ser usada para verificar antes de qualquer ação
 */
export const useCanWrite = () => {
  const { canWrite, showExpiredBanner } = useSubscription();
  const navigate = useNavigate();

  /**
   * Verifica se pode realizar a ação e mostra mensagem se não puder
   * @param {string} action - Descrição da ação (ex: "criar orçamento")
   * @returns {boolean} - true se pode realizar, false se não pode
   */
  const checkCanWrite = (action = 'realizar esta ação') => {
    if (!canWrite) {
      toast.error(
        `Não é possível ${action}. Seu período de teste expirou.`,
        {
          action: {
            label: 'Assinar',
            onClick: () => navigate('/assinatura'),
          },
          duration: 5000,
        }
      );
      return false;
    }
    return true;
  };

  return {
    canWrite,
    checkCanWrite,
    showExpiredBanner,
  };
};

export default useCanWrite;
