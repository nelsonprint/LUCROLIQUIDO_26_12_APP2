import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { axiosInstance } from '../App';
import { toast } from 'sonner';
import { Activity, AlertTriangle, TrendingUp, Sparkles, Loader2, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

export const IntelligentAnalysis = ({ companyId }) => {
  const [healthScore, setHealthScore] = useState(null);
  const [alerts, setAlerts] = useState(null);
  const [loadingScore, setLoadingScore] = useState(false);
  const [loadingAlerts, setLoadingAlerts] = useState(false);
  const [showCompleteAnalysis, setShowCompleteAnalysis] = useState(false);
  const [completeAnalysis, setCompleteAnalysis] = useState(null);
  const [loadingComplete, setLoadingComplete] = useState(false);
  const [analysisStarted, setAnalysisStarted] = useState(false);

  // Removido useEffect automático - agora carrega apenas quando usuário clicar
  // useEffect(() => {
  //   if (companyId) {
  //     fetchHealthScore();
  //     fetchAlerts();
  //   }
  // }, [companyId]);

  const startAnalysis = () => {
    setAnalysisStarted(true);
    fetchHealthScore();
    fetchAlerts();
  };

  const fetchHealthScore = async () => {
    setLoadingScore(true);
    try {
      const response = await axiosInstance.post('/business-health-score', {
        company_id: companyId
      });
      setHealthScore(response.data);
    } catch (error) {
      console.error('Erro ao buscar score:', error);
    } finally {
      setLoadingScore(false);
    }
  };

  const fetchAlerts = async () => {
    setLoadingAlerts(true);
    try {
      const response = await axiosInstance.post('/intelligent-alerts', {
        company_id: companyId
      });
      setAlerts(response.data);
    } catch (error) {
      console.error('Erro ao buscar alertas:', error);
    } finally {
      setLoadingAlerts(false);
    }
  };

  const generateCompleteAnalysis = async () => {
    setLoadingComplete(true);
    setShowCompleteAnalysis(true);

    try {
      const company = JSON.parse(localStorage.getItem('company') || '{}');
      const response = await axiosInstance.post('/complete-business-analysis', {
        company_id: companyId,
        business_sector: company.segment || 'não informado'
      });
      setCompleteAnalysis(response.data);
      toast.success('Análise completa gerada!');
    } catch (error) {
      toast.error('Erro ao gerar análise completa');
    } finally {
      setLoadingComplete(false);
    }
  };

  const parseScore = (text) => {
    const scoreMatch = text.match(/SCORE:\s*(\d+)/i);
    return scoreMatch ? parseInt(scoreMatch[1]) : 0;
  };

  const parseClassification = (text) => {
    const classMatch = text.match(/CLASSIFICAÇÃO:\s*(.+)/i);
    return classMatch ? classMatch[1].trim() : 'Não classificado';
  };

  const getScoreColor = (score) => {
    if (score >= 85) return 'text-green-400';
    if (score >= 70) return 'text-blue-400';
    if (score >= 50) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getClassificationBadge = (classification) => {
    const lower = classification.toLowerCase();
    if (lower.includes('excelente')) return 'bg-green-500/20 text-green-300 border-green-500/50';
    if (lower.includes('bom')) return 'bg-blue-500/20 text-blue-300 border-blue-500/50';
    if (lower.includes('atenção')) return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/50';
    return 'bg-red-500/20 text-red-300 border-red-500/50';
  };

  return (
    <>
      {/* Botão para iniciar análise (apenas se não foi iniciada) */}
      {!analysisStarted && !loadingScore && !loadingAlerts && (
        <Card className="glass border-white/10 mb-6">
          <CardContent className="flex flex-col items-center justify-center py-12 space-y-4">
            <Sparkles className="h-12 w-12 text-purple-400" />
            <h3 className="text-white text-2xl font-bold">Análise Inteligente com IA</h3>
            <p className="text-gray-300 text-center max-w-2xl">
              Obtenha insights poderosos sobre a saúde financeira do seu negócio, alertas inteligentes e recomendações estratégicas geradas por IA.
            </p>
            <Button 
              onClick={startAnalysis}
              className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white px-8 py-6 text-lg"
              data-testid="start-analysis-button"
            >
              <Sparkles className="mr-2 h-5 w-5" />
              Gerar Análise com IA
            </Button>
            <p className="text-sm text-gray-400">
              ⏱️ A análise leva aproximadamente 10-15 segundos
            </p>
          </CardContent>
        </Card>
      )}

      {/* Loading State */}
      {(loadingScore || loadingAlerts) && (
        <Card className="glass border-white/10 mb-6">
          <CardContent className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-purple-400 mr-3" />
            <span className="text-white text-lg">Analisando dados com IA...</span>
          </CardContent>
        </Card>
      )}

      {/* Score de Saúde do Negócio */}
      {healthScore && !loadingScore && (
        <Card className="glass border-white/10 mb-6" data-testid="health-score-card">
          <CardHeader>
            <CardTitle className="text-white flex items-center">
              <Activity className="mr-2 text-green-400" />
              Score de Saúde do Negócio
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between mb-6">
              <div className="flex-1">
                <div className="flex items-center space-x-4 mb-4">
                  <div className={`text-6xl font-bold ${getScoreColor(parseScore(healthScore.score_analysis))}`}>
                    {parseScore(healthScore.score_analysis)}
                  </div>
                  <div className="flex-1">
                    <Progress value={parseScore(healthScore.score_analysis)} className="h-3" />
                    <Badge className={`mt-2 ${getClassificationBadge(parseClassification(healthScore.score_analysis))}`}>
                      {parseClassification(healthScore.score_analysis)}
                    </Badge>
                  </div>
                </div>

                <div className="text-sm text-gray-300 whitespace-pre-line">
                  {healthScore.score_analysis}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Alertas Inteligentes */}
      {alerts && !loadingAlerts && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {alerts.alerts.split('ALERTA').filter(a => a.trim()).slice(0, 4).map((alert, index) => {
            const isCritical = alert.toLowerCase().includes('crítico');
            const isWarning = alert.toLowerCase().includes('atenção');
            
            return (
              <Card 
                key={index}
                className={`glass border-2 ${
                  isCritical ? 'border-red-500/50' :
                  isWarning ? 'border-yellow-500/50' :
                  'border-blue-500/50'
                }`}
                data-testid={`alert-card-${index}`}
              >
                <CardHeader className="pb-3">
                  <CardTitle className="text-white flex items-center text-sm">
                    {isCritical ? <XCircle className="mr-2 text-red-400" size={18} /> :
                     isWarning ? <AlertCircle className="mr-2 text-yellow-400" size={18} /> :
                     <CheckCircle className="mr-2 text-blue-400" size={18} />}
                    Alerta {index + 1}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-xs text-gray-300 whitespace-pre-line leading-relaxed">
                    {alert.substring(0, 300)}...
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Botão Análise Completa */}
      <Card className="glass border-white/10 mb-6" data-testid="complete-analysis-card">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <h3 className="text-xl font-bold text-white mb-2 flex items-center">
                <Sparkles className="mr-2 text-purple-400" />
                Análise Completa do Negócio com IA
              </h3>
              <p className="text-gray-400 text-sm">
                Diagnóstico profundo, tendências, previsões, gargalos e recomendações estratégicas personalizadas
              </p>
            </div>
            <Button
              onClick={generateCompleteAnalysis}
              disabled={loadingComplete}
              className="ml-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
              data-testid="generate-complete-analysis-button"
            >
              {loadingComplete ? (
                <>
                  <Loader2 className="mr-2 animate-spin" size={18} />
                  Analisando...
                </>
              ) : (
                <>
                  <TrendingUp className="mr-2" size={18} />
                  Gerar Análise Completa
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Modal Análise Completa */}
      <Dialog open={showCompleteAnalysis} onOpenChange={setShowCompleteAnalysis}>
        <DialogContent className="max-w-5xl max-h-[90vh] glass border-white/10 overflow-y-auto" data-testid="complete-analysis-dialog">
          <DialogHeader>
            <DialogTitle className="text-2xl text-white flex items-center">
              <Sparkles className="mr-2 text-purple-400" />
              Análise Financeira Completa
            </DialogTitle>
          </DialogHeader>

          {loadingComplete ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="animate-spin text-purple-400 mb-4" size={48} />
              <p className="text-gray-400">Gerando análise completa com IA...</p>
            </div>
          ) : completeAnalysis ? (
            <div className="space-y-4">
              {/* Métricas Rápidas */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="p-3 bg-white/5 rounded-lg">
                  <p className="text-xs text-gray-400">Faturamento</p>
                  <p className="text-lg font-bold text-white">
                    R$ {completeAnalysis.metrics.faturamento.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <div className="p-3 bg-white/5 rounded-lg">
                  <p className="text-xs text-gray-400">Lucro Líquido</p>
                  <p className="text-lg font-bold text-green-400">
                    R$ {completeAnalysis.metrics.lucro.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <div className="p-3 bg-white/5 rounded-lg">
                  <p className="text-xs text-gray-400">Margem Bruta</p>
                  <p className="text-lg font-bold text-blue-400">
                    {completeAnalysis.metrics.margem_bruta.toFixed(1)}%
                  </p>
                </div>
                <div className="p-3 bg-white/5 rounded-lg">
                  <p className="text-xs text-gray-400">Margem Líquida</p>
                  <p className="text-lg font-bold text-purple-400">
                    {completeAnalysis.metrics.margem_liquida.toFixed(1)}%
                  </p>
                </div>
              </div>

              {/* Análise Detalhada */}
              <Card className="bg-gradient-to-br from-purple-600/10 to-blue-600/10 border-purple-500/30">
                <CardContent className="p-6">
                  <div className="prose prose-invert max-w-none">
                    <div className="text-gray-200 whitespace-pre-line leading-relaxed">
                      {completeAnalysis.analysis}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  );
};
