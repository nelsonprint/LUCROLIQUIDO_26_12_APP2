import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { axiosInstance } from '../App';
import { useNavigate } from 'react-router-dom';
import { 
  TrendingUp, TrendingDown, ArrowRight, AlertTriangle,
  Banknote, Building2, PiggyBank, Wallet, ChevronRight
} from 'lucide-react';

const DFCResumoCard = ({ companyId }) => {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchDFCResumo = useCallback(async () => {
    if (!companyId) return;
    
    try {
      const response = await axiosInstance.get(`/dfc/resumo-mensal/${companyId}`);
      setData(response.data);
    } catch (error) {
      console.error('Erro ao carregar DFC resumo:', error);
    } finally {
      setLoading(false);
    }
  }, [companyId]);

  useEffect(() => {
    fetchDFCResumo();
  }, [fetchDFCResumo]);

  const formatCurrency = (value) => {
    if (value === undefined || value === null) return '—';
    const prefix = value >= 0 ? '+' : '';
    return `${prefix}R$ ${Math.abs(value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
  };

  const formatCurrencySimple = (value) => {
    if (value === undefined || value === null) return '—';
    return `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
  };

  // Loading state
  if (loading) {
    return (
      <Card className="glass border-white/10 hover-lift cursor-pointer" onClick={() => navigate('/dfc')}>
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-medium text-gray-200 flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Banknote className="text-blue-400" size={18} />
              DFC — Fluxo de Caixa
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[120px] flex items-center justify-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Empty state
  if (!data) {
    return (
      <Card className="glass border-white/10 hover-lift cursor-pointer" onClick={() => navigate('/dfc')}>
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-medium text-gray-200 flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Banknote className="text-blue-400" size={18} />
              DFC — Fluxo de Caixa
            </span>
            <ChevronRight size={18} className="text-gray-500" />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-500 text-center py-4">
            Sem dados para o período
          </p>
        </CardContent>
      </Card>
    );
  }

  const mesLabel = new Date(data.mes + '-01').toLocaleString('pt-BR', { month: 'long', year: 'numeric' }).replace(/^\w/, c => c.toUpperCase());

  return (
    <Card 
      className="glass border-white/10 hover-lift cursor-pointer transition-all hover:border-blue-500/30" 
      onClick={() => navigate('/dfc')}
    >
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-medium text-gray-200 flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Banknote className="text-blue-400" size={18} />
            DFC — Fluxo de Caixa
            <span className="text-xs text-gray-500 font-normal">({mesLabel})</span>
          </span>
          <div className="flex items-center gap-2">
            {data.alertas > 0 && (
              <AlertTriangle size={16} className="text-amber-400" />
            )}
            <ChevronRight size={18} className="text-gray-500" />
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        {/* Fluxo Visual Simplificado */}
        <div className="flex items-center justify-between mb-3">
          {/* Saldo Inicial */}
          <div className="text-center">
            <p className="text-[10px] text-gray-500 uppercase tracking-wider">Inicial</p>
            <p className="text-sm font-semibold text-gray-300">
              {formatCurrencySimple(data.saldo_inicial)}
            </p>
          </div>

          <ArrowRight size={14} className="text-gray-600" />

          {/* Variação */}
          <div className={`text-center px-2 py-1 rounded ${
            data.variacao_liquida >= 0 ? 'bg-emerald-900/30' : 'bg-rose-900/30'
          }`}>
            <p className="text-[10px] text-gray-500 uppercase tracking-wider">Variação</p>
            <p className={`text-sm font-bold ${
              data.variacao_liquida >= 0 ? 'text-emerald-400' : 'text-rose-400'
            }`}>
              {formatCurrency(data.variacao_liquida)}
            </p>
          </div>

          <ArrowRight size={14} className="text-gray-600" />

          {/* Saldo Final */}
          <div className="text-center">
            <p className="text-[10px] text-gray-500 uppercase tracking-wider">Final</p>
            <p className={`text-sm font-semibold ${
              data.saldo_final >= 0 ? 'text-blue-400' : 'text-rose-400'
            }`}>
              {formatCurrencySimple(data.saldo_final)}
            </p>
          </div>
        </div>

        {/* Breakdown dos 3 Fluxos */}
        <div className="grid grid-cols-3 gap-2 pt-2 border-t border-zinc-800">
          {/* Operacional */}
          <div className={`text-center p-2 rounded ${
            data.operacional >= 0 ? 'bg-emerald-900/20' : 'bg-rose-900/20'
          }`}>
            <div className="flex items-center justify-center gap-1 mb-1">
              <Building2 size={12} className={data.operacional >= 0 ? 'text-emerald-400' : 'text-rose-400'} />
              <span className="text-[10px] text-gray-400">Operacional</span>
            </div>
            <p className={`text-xs font-bold ${
              data.operacional >= 0 ? 'text-emerald-400' : 'text-rose-400'
            }`}>
              {data.operacional >= 0 ? '+' : ''}{(data.operacional / 1000).toFixed(1)}k
            </p>
          </div>

          {/* Investimento */}
          <div className={`text-center p-2 rounded ${
            data.investimento >= 0 ? 'bg-purple-900/20' : 'bg-orange-900/20'
          }`}>
            <div className="flex items-center justify-center gap-1 mb-1">
              <PiggyBank size={12} className={data.investimento >= 0 ? 'text-purple-400' : 'text-orange-400'} />
              <span className="text-[10px] text-gray-400">Investimento</span>
            </div>
            <p className={`text-xs font-bold ${
              data.investimento >= 0 ? 'text-purple-400' : 'text-orange-400'
            }`}>
              {data.investimento >= 0 ? '+' : ''}{(data.investimento / 1000).toFixed(1)}k
            </p>
          </div>

          {/* Financiamento */}
          <div className={`text-center p-2 rounded ${
            data.financiamento >= 0 ? 'bg-cyan-900/20' : 'bg-amber-900/20'
          }`}>
            <div className="flex items-center justify-center gap-1 mb-1">
              <Wallet size={12} className={data.financiamento >= 0 ? 'text-cyan-400' : 'text-amber-400'} />
              <span className="text-[10px] text-gray-400">Financiam.</span>
            </div>
            <p className={`text-xs font-bold ${
              data.financiamento >= 0 ? 'text-cyan-400' : 'text-amber-400'
            }`}>
              {data.financiamento >= 0 ? '+' : ''}{(data.financiamento / 1000).toFixed(1)}k
            </p>
          </div>
        </div>

        {/* Link para relatório completo */}
        <div className="mt-3 pt-2 border-t border-zinc-800 text-center">
          <span className="text-xs text-blue-400 hover:text-blue-300">
            Ver relatório completo →
          </span>
        </div>
      </CardContent>
    </Card>
  );
};

export default DFCResumoCard;
