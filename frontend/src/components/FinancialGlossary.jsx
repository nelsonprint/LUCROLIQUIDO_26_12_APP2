import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { BookOpen, Terminal, Loader2, Send } from 'lucide-react';
import { axiosInstance } from '../App';
import { toast } from 'sonner';

const FinancialGlossary = ({ isOpen, onClose }) => {
  const [showGlossary, setShowGlossary] = useState(false);
  const [showTerminal, setShowTerminal] = useState(false);
  const [selectedTerm, setSelectedTerm] = useState('');
  const [generalExplanation, setGeneralExplanation] = useState('');
  const [personalizedExplanation, setPersonalizedExplanation] = useState('');
  const [businessSector, setBusinessSector] = useState('');
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1); // 1 = explicação geral, 2 = pergunta setor, 3 = explicação personalizada

  const financialTerms = {
    'Receitas': [
      'Receita',
      'Receita Bruta',
      'Receita Líquida',
      'Receitas Recorrentes',
      'Receitas Não Recorrentes',
      'Receita Operacional',
      'Receita Não Operacional'
    ],
    'Custos': [
      'Custo',
      'Custos Fixos',
      'Custos Variáveis',
      'Custos Diretos',
      'Custos Indiretos',
      'Custo de Produção',
      'Custo de Mercadorias Vendidas (CMV)',
      'Custo de Serviço Prestado (CSP)'
    ],
    'Despesas': [
      'Despesa',
      'Despesas Operacionais',
      'Despesas Administrativas',
      'Despesas Comerciais',
      'Despesas Financeiras',
      'Despesas Não Operacionais',
      'Despesas Diretas',
      'Despesas Indiretas'
    ],
    'Lucro e Margens': [
      'Lucro Bruto',
      'Lucro Operacional',
      'Lucro Antes dos Impostos',
      'Lucro Líquido',
      'Margem Bruta',
      'Margem Operacional',
      'Margem Líquida',
      'Rentabilidade',
      'Lucratividade'
    ],
    'Fluxo de Caixa': [
      'Fluxo de Caixa',
      'Fluxo de Caixa Operacional',
      'Saldo de Caixa',
      'Caixa Livre',
      'Contas a Receber',
      'Contas a Pagar',
      'Capital de Giro',
      'Capital de Giro Necessário',
      'Ciclo Financeiro',
      'Ciclo Operacional'
    ],
    'Análise Financeira': [
      'Ponto de Equilíbrio',
      'Margem de Contribuição',
      'Margem de Contribuição Unitária',
      'Margem de Contribuição Total',
      'Índice de Endividamento',
      'Liquidez Corrente',
      'Liquidez Seca',
      'Liquidez Imediata',
      'Grau de Alavancagem Operacional'
    ],
    'Impostos e Tributos': [
      'Impostos sobre Faturamento',
      'Tributos Diretos',
      'Tributos Indiretos',
      'Regime Tributário',
      'Simples Nacional',
      'Lucro Presumido',
      'Lucro Real',
      'Retenções de Impostos',
      'Encargos Sociais'
    ],
    'Contabilidade': [
      'Investimentos (CAPEX)',
      'Despesas Operacionais (OPEX)',
      'Ativo',
      'Passivo',
      'Patrimônio Líquido',
      'Balanço Patrimonial',
      'Demonstração do Resultado (DRE)',
      'Depreciação',
      'Amortização'
    ],
    'Métricas de Vendas': [
      'Ticket Médio',
      'Volume de Vendas',
      'Mix de Produtos',
      'Churn',
      'CAC – Custo de Aquisição de Cliente',
      'LTV – Lifetime Value',
      'Taxa de Conversão',
      'Retenção de Clientes'
    ],
    'Precificação': [
      'Preço de Venda',
      'Markup',
      'Margem de Lucro',
      'Desconto Médio',
      'ROI – Retorno sobre o Investimento',
      'Payback'
    ],
    'Distribuição de Resultados': [
      'Pró-Labore',
      'Distribuição de Lucros',
      'Retirada de Sócios'
    ],
    'Planejamento': [
      'Orçamento Empresarial',
      'Projeção de Resultados',
      'Análise de Cenários',
      'Risco Financeiro',
      'Reserva de Emergência Empresarial'
    ]
  };

  const handleTermClick = async (term) => {
    setSelectedTerm(term);
    setShowTerminal(true);
    setStep(1);
    setGeneralExplanation('');
    setPersonalizedExplanation('');
    setBusinessSector('');
    setLoading(true);

    try {
      const response = await axiosInstance.post('/financial-term-explanation', {
        term: term
      });
      
      setGeneralExplanation(response.data.explanation);
      setStep(2); // Ir para pergunta do setor
    } catch (error) {
      toast.error('Erro ao buscar explicação');
      setShowTerminal(false);
    } finally {
      setLoading(false);
    }
  };

  const handleSectorSubmit = async (e) => {
    e.preventDefault();
    
    if (!businessSector.trim()) {
      toast.error('Por favor, informe sua área de atuação');
      return;
    }

    setLoading(true);

    try {
      const response = await axiosInstance.post('/financial-term-explanation', {
        term: selectedTerm,
        business_sector: businessSector
      });
      
      setPersonalizedExplanation(response.data.explanation);
      setStep(3); // Mostrar explicação personalizada
    } catch (error) {
      toast.error('Erro ao buscar explicação personalizada');
    } finally {
      setLoading(false);
    }
  };

  // Sincronizar estado com props
  React.useEffect(() => {
    setShowGlossary(isOpen);
  }, [isOpen]);

  const handleClose = (open) => {
    setShowGlossary(open);
    if (!open && onClose) {
      onClose();
    }
  };

  return (
    <>
      {/* Modal com sanfona */}
      <Dialog open={showGlossary} onOpenChange={handleClose}>
        <DialogContent className="glass border-white/10 max-w-2xl max-h-[80vh] overflow-y-auto" data-testid="glossary-dialog">
          <DialogHeader>
            <DialogTitle className="text-2xl text-white flex items-center">
              <BookOpen className="mr-2 text-purple-400" />
              Glossário Financeiro
            </DialogTitle>
          </DialogHeader>
          
          <div className="mt-4">
            <p className="text-gray-400 mb-4">
              Clique em qualquer termo para aprender sobre ele e entender como se aplica ao seu negócio.
            </p>

            <Accordion type="single" collapsible className="space-y-2">
              {Object.entries(financialTerms).map(([category, terms]) => (
                <AccordionItem key={category} value={category} className="glass border-white/10 rounded-lg px-4">
                  <AccordionTrigger className="text-white font-semibold hover:text-purple-400">
                    {category} ({terms.length})
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="grid grid-cols-1 gap-2 mt-2">
                      {terms.map((term) => (
                        <button
                          key={term}
                          onClick={() => handleTermClick(term)}
                          className="text-left p-3 bg-white/5 hover:bg-white/10 rounded-lg text-gray-300 hover:text-white transition-all border border-transparent hover:border-purple-500/50"
                          data-testid={`term-${term.toLowerCase().replace(/\s/g, '-')}`}
                        >
                          → {term}
                        </button>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal Terminal */}
      <Dialog open={showTerminal} onOpenChange={setShowTerminal}>
        <DialogContent className="max-w-4xl max-h-[90vh] bg-gray-900 border-2 border-green-500/50 p-0 overflow-hidden" data-testid="terminal-dialog">
          <div className="bg-gray-800 px-4 py-2 flex items-center space-x-2 border-b border-green-500/30">
            <Terminal className="text-green-400" size={18} />
            <span className="text-green-400 font-mono text-sm">finance-terminal ~ {selectedTerm}</span>
          </div>
          
          <div className="p-6 font-mono text-sm overflow-y-auto max-h-[calc(90vh-60px)] bg-black/50">
            {loading && step === 1 ? (
              <div className="flex items-center space-x-2 text-green-400">
                <Loader2 className="animate-spin" size={18} />
                <span>Carregando explicação...</span>
              </div>
            ) : (
              <>
                {/* Explicação Geral */}
                {step >= 2 && (
                  <div className="mb-6">
                    <div className="text-green-400 mb-2">$ explain {selectedTerm}</div>
                    <div className="text-gray-300 whitespace-pre-line leading-relaxed">
                      {generalExplanation}
                    </div>
                  </div>
                )}

                {/* Pergunta do Setor */}
                {step === 2 && !loading && (
                  <div className="mt-6 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded">
                    <div className="text-yellow-400 mb-4">
                      💡 Em que área de mercado você atua? Assim posso te explicar como "{selectedTerm}" se relaciona com o seu negócio e qual é a importância dele para a sua empresa.
                    </div>
                    
                    <form onSubmit={handleSectorSubmit} className="flex gap-2">
                      <Input
                        value={businessSector}
                        onChange={(e) => setBusinessSector(e.target.value)}
                        placeholder="Ex: Varejo, Restaurante, E-commerce, Consultoria..."
                        className="bg-gray-800 border-yellow-500/50 text-white"
                        data-testid="business-sector-input"
                      />
                      <Button 
                        type="submit" 
                        className="bg-yellow-600 hover:bg-yellow-700"
                        data-testid="submit-sector-button"
                      >
                        <Send size={18} />
                      </Button>
                    </form>
                  </div>
                )}

                {/* Loading Explicação Personalizada */}
                {loading && step === 2 && (
                  <div className="flex items-center space-x-2 text-green-400 mt-4">
                    <Loader2 className="animate-spin" size={18} />
                    <span>Gerando explicação personalizada para {businessSector}...</span>
                  </div>
                )}

                {/* Explicação Personalizada */}
                {step === 3 && personalizedExplanation && (
                  <div className="mt-6 p-4 bg-green-500/10 border border-green-500/30 rounded">
                    <div className="text-green-400 mb-2">$ apply-to-business {businessSector}</div>
                    <div className="text-gray-300 whitespace-pre-line leading-relaxed">
                      {personalizedExplanation}
                    </div>
                  </div>
                )}

                {/* Footer Terminal */}
                <div className="mt-6 pt-4 border-t border-green-500/30">
                  <div className="text-green-400 text-xs">
                    [Lucro Líquido Terminal v1.0] - Educação Financeira com IA
                  </div>
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default FinancialGlossary;
