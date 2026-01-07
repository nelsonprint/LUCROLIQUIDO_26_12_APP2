import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { axiosInstance } from '../App';
import { useNavigate } from 'react-router-dom';
import { 
  TrendingUp, TrendingDown, ArrowRight, AlertTriangle,
  Banknote, Building2, PiggyBank, Wallet, ChevronRight, ArrowUpRight, ArrowDownRight
} from 'lucide-react';

const DFCResumoCard = ({ companyId, fullWidth = false }) => {
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

  const formatCurrencyShort = (value) => {
    if (value === undefined || value === null) return '—';
    if (Math.abs(value) >= 1000000) {
      return `R$ ${(value / 1000000).toFixed(1)}M`;
    }
    if (Math.abs(value) >= 1000) {
      return `R$ ${(value / 1000).toFixed(1)}k`;
    }
    return `R$ ${value.toFixed(0)}`;
  };

  // Loading state
  if (loading) {
    return (
      <Card className="glass border-white/10 hover-lift cursor-pointer" onClick={() => navigate('/dfc')}>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-medium text-gray-200 flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Banknote className="text-blue-400" size={20} />
              DFC — Demonstrativo do Fluxo de Caixa
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[100px] flex items-center justify-center">
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
          <CardTitle className="text-lg font-medium text-gray-200 flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Banknote className="text-blue-400" size={20} />
              DFC — Demonstrativo do Fluxo de Caixa
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
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-medium text-gray-200 flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Banknote className="text-blue-400" size={20} />
            DFC — Demonstrativo do Fluxo de Caixa
            <span className="text-sm text-gray-500 font-normal ml-2">({mesLabel})</span>
          </span>
          <div className="flex items-center gap-3">
            {data.alertas > 0 && (
              <span className="flex items-center gap-1 text-amber-400 text-sm">
                <AlertTriangle size={16} />
                {data.alertas} alerta(s)
              </span>
            )}
            <Button
              variant="ghost"
              size="sm"
              className="text-blue-400 hover:text-blue-300 hover:bg-blue-500/10"
              onClick={(e) => {
                e.stopPropagation();
                navigate('/dfc');
              }}
            >
              Ver relatório completo <ChevronRight size={16} />
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        {/* Layout Horizontal - Fluxo Visual */}
        <div className="grid grid-cols-2 md:grid-cols-7 gap-4 items-center">
          {/* Saldo Inicial */}
          <div className="p-4 rounded-lg bg-gradient-to-br from-blue-900/30 to-blue-800/10 border border-blue-500/30 text-center">
            <p className="text-xs text-blue-400 font-medium uppercase tracking-wider mb-1">Saldo Inicial</p>
            <p className="text-xl font-bold text-blue-400">
              {formatCurrencyShort(data.saldo_inicial)}
            </p>
          </div>

          {/* Seta */}
          <div className="hidden md:flex justify-center">
            <ArrowRight size={24} className="text-gray-600" />
          </div>

          {/* 3 Fluxos */}
          <div className="col-span-2 md:col-span-3 grid grid-cols-3 gap-3">
            {/* Operacional */}
            <div className={`p-3 rounded-lg text-center ${
              data.operacional >= 0 
                ? 'bg-gradient-to-br from-emerald-900/30 to-emerald-800/10 border border-emerald-500/30' 
                : 'bg-gradient-to-br from-rose-900/30 to-rose-800/10 border border-rose-500/30'
            }`}>
              <div className="flex items-center justify-center gap-1 mb-1">
                <Building2 size={14} className={data.operacional >= 0 ? 'text-emerald-400' : 'text-rose-400'} />
                <span className="text-xs text-gray-400">Operacional</span>
              </div>
              <p className={`text-lg font-bold ${data.operacional >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {data.operacional >= 0 ? '+' : ''}{formatCurrencyShort(data.operacional)}
              </p>
            </div>

            {/* Investimento */}
            <div className={`p-3 rounded-lg text-center ${
              data.investimento >= 0 
                ? 'bg-gradient-to-br from-purple-900/30 to-purple-800/10 border border-purple-500/30' 
                : 'bg-gradient-to-br from-orange-900/30 to-orange-800/10 border border-orange-500/30'
            }`}>
              <div className="flex items-center justify-center gap-1 mb-1">
                <PiggyBank size={14} className={data.investimento >= 0 ? 'text-purple-400' : 'text-orange-400'} />
                <span className="text-xs text-gray-400">Investimento</span>
              </div>
              <p className={`text-lg font-bold ${data.investimento >= 0 ? 'text-purple-400' : 'text-orange-400'}`}>
                {data.investimento >= 0 ? '+' : ''}{formatCurrencyShort(data.investimento)}
              </p>
            </div>

            {/* Financiamento */}
            <div className={`p-3 rounded-lg text-center ${
              data.financiamento >= 0 
                ? 'bg-gradient-to-br from-cyan-900/30 to-cyan-800/10 border border-cyan-500/30' 
                : 'bg-gradient-to-br from-amber-900/30 to-amber-800/10 border border-amber-500/30'
            }`}>
              <div className="flex items-center justify-center gap-1 mb-1">
                <Wallet size={14} className={data.financiamento >= 0 ? 'text-cyan-400' : 'text-amber-400'} />
                <span className="text-xs text-gray-400">Financiam.</span>
              </div>
              <p className={`text-lg font-bold ${data.financiamento >= 0 ? 'text-cyan-400' : 'text-amber-400'}`}>
                {data.financiamento >= 0 ? '+' : ''}{formatCurrencyShort(data.financiamento)}
              </p>
            </div>
          </div>

          {/* Seta */}
          <div className="hidden md:flex justify-center">
            <ArrowRight size={24} className="text-gray-600" />
          </div>

          {/* Saldo Final */}
          <div className={`p-4 rounded-lg text-center ${
            data.saldo_final >= 0 
              ? 'bg-gradient-to-br from-indigo-900/40 to-indigo-800/20 border-2 border-indigo-500/50' 
              : 'bg-gradient-to-br from-rose-900/40 to-rose-800/20 border-2 border-rose-500/50'
          }`}>
            <p className="text-xs text-gray-400 font-medium uppercase tracking-wider mb-1">Saldo Final</p>
            <p className={`text-xl font-bold ${data.saldo_final >= 0 ? 'text-indigo-400' : 'text-rose-400'}`}>
              {formatCurrencyShort(data.saldo_final)}
            </p>
            <div className={`flex items-center justify-center gap-1 mt-1 text-xs ${
              data.variacao_liquida >= 0 ? 'text-emerald-400' : 'text-rose-400'
            }`}>
              {data.variacao_liquida >= 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
              <span>{formatCurrency(data.variacao_liquida)}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default DFCResumoCard;
