import React, { useState, useEffect, useCallback } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { SubscriptionCard } from '@/components/SubscriptionCard';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { CPFInput, CNPJInput } from '@/components/ui/cpf-cnpj-input';
import { MoneyInput } from '@/components/ui/money-input';
import { maskPhone, isValidCPF, isValidCNPJ, formatBRL, parseBRL } from '@/lib/formatters';
import { 
  FileText, Users, Calendar, CreditCard, Save, ArrowLeft, 
  Plus, UserPlus, Loader2, Calculator, Package, AlertTriangle, Banknote
} from 'lucide-react';
import { axiosInstance } from '../App';
import { toast } from 'sonner';
import { useNavigate, useLocation } from 'react-router-dom';
import OrcamentoItemsGrid from '@/components/OrcamentoItemsGrid';
import OrcamentoMateriais from '@/components/OrcamentoMateriais';

const NovoOrcamentoGrid = ({ user, onLogout }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const company = JSON.parse(localStorage.getItem('company') || '{}');

  // Verificar se é modo edição (ID passado na URL ou state)
  const orcamentoIdParam = new URLSearchParams(location.search).get('id');
  const [orcamentoId, setOrcamentoId] = useState(orcamentoIdParam);
  const [modoEdicao, setModoEdicao] = useState(!!orcamentoIdParam);
  const [loadingOrcamento, setLoadingOrcamento] = useState(false);

  // Estados principais
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('cliente');
  
  // Markup atual
  const [currentMarkup, setCurrentMarkup] = useState(1.0);
  const [markupRef, setMarkupRef] = useState('');
  
  // Clientes
  const [clientes, setClientes] = useState([]);
  const [clienteSelecionado, setClienteSelecionado] = useState('');
  const [showNovoClienteModal, setShowNovoClienteModal] = useState(false);
  const [loadingClientes, setLoadingClientes] = useState(false);
  const [tipoNovoCliente, setTipoNovoCliente] = useState('PF');
  const [novoClienteForm, setNovoClienteForm] = useState({
    tipo: 'PF',
    nome: '',
    cpf: '',
    nome_fantasia: '',
    razao_social: '',
    cnpj: '',
    whatsapp: '',
    email: '',
    logradouro: '',
    numero: '',
    bairro: '',
    cidade: '',
    estado: '',
  });

  // Dados do orçamento
  const [orcamentoData, setOrcamentoData] = useState({
    cliente_nome: '',
    cliente_documento: '',
    cliente_email: '',
    cliente_telefone: '',
    cliente_whatsapp: '',
    cliente_endereco: '',
    validade_proposta: '',
    condicoes_pagamento: '',
    prazo_execucao: '',
    observacoes: '',
    // Forma de pagamento avançada
    forma_pagamento: 'entrada_parcelas', // 'avista' ou 'entrada_parcelas'
    entrada_percentual: 30, // Percentual de entrada
    valor_entrada: 0, // Valor calculado da entrada
    num_parcelas: 2, // Número de parcelas após entrada
    parcelas: [], // Array com detalhes de cada parcela [{numero, valor, editado}]
  });

  // Itens do orçamento (Grid)
  const [orcamentoItems, setOrcamentoItems] = useState([]);

  // Materiais do orçamento
  const [totalMateriais, setTotalMateriais] = useState(0);

  // Modal de confirmação para sair
  const [showExitModal, setShowExitModal] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState(null);

  // Verificar se há dados não salvos
  const hasUnsavedData = useCallback(() => {
    return (
      orcamentoData.cliente_nome ||
      orcamentoItems.length > 0 ||
      totalMateriais > 0 ||
      orcamentoData.validade_proposta ||
      orcamentoData.condicoes_pagamento ||
      orcamentoData.prazo_execucao ||
      orcamentoData.observacoes
    );
  }, [orcamentoData, orcamentoItems, totalMateriais]);

  // Interceptar navegação
  const handleNavigate = useCallback((path) => {
    if (hasUnsavedData()) {
      setPendingNavigation(path);
      setShowExitModal(true);
    } else {
      navigate(path);
    }
  }, [hasUnsavedData, navigate]);

  // Confirmar saída
  const confirmExit = () => {
    setShowExitModal(false);
    if (pendingNavigation) {
      navigate(pendingNavigation);
    }
  };

  // Cancelar saída
  const cancelExit = () => {
    setShowExitModal(false);
    setPendingNavigation(null);
  };

  // Carregar orçamento existente para edição
  useEffect(() => {
    const carregarOrcamentoParaEdicao = async () => {
      if (!orcamentoId || !company?.id) return;
      
      setLoadingOrcamento(true);
      try {
        // Buscar dados do orçamento
        const response = await axiosInstance.get(`/orcamento/${orcamentoId}`);
        const orc = response.data;
        
        // Preencher dados do cliente e condições
        setOrcamentoData({
          cliente_nome: orc.cliente_nome || '',
          cliente_documento: orc.cliente_documento || '',
          cliente_email: orc.cliente_email || '',
          cliente_telefone: orc.cliente_telefone || '',
          cliente_whatsapp: orc.cliente_whatsapp || '',
          cliente_endereco: orc.cliente_endereco || '',
          validade_proposta: orc.validade_proposta || '',
          condicoes_pagamento: orc.condicoes_pagamento || '',
          prazo_execucao: orc.prazo_execucao || '',
          observacoes: orc.observacoes || '',
          // Forma de pagamento
          forma_pagamento: orc.forma_pagamento || 'avista',
          entrada_percentual: orc.entrada_percentual || 0,
          valor_entrada: orc.valor_entrada || 0,
          num_parcelas: orc.num_parcelas || 0,
          parcelas: orc.parcelas || [],
        });
        
        // Carregar itens do orçamento (se existir)
        if (orc.detalhes_itens?.items) {
          setOrcamentoItems(orc.detalhes_itens.items);
        }
        
        // Carregar materiais é feito pelo componente OrcamentoMateriais
        
        toast.success(`Orçamento ${orc.numero_orcamento} carregado para edição`);
      } catch (error) {
        console.error('Erro ao carregar orçamento:', error);
        toast.error('Erro ao carregar orçamento para edição');
        navigate('/orcamentos');
      } finally {
        setLoadingOrcamento(false);
      }
    };
    
    carregarOrcamentoParaEdicao();
  }, [orcamentoId, company?.id]);

  // Buscar markup atual
  useEffect(() => {
    const fetchMarkup = async () => {
      if (!company?.id) return;
      try {
        const response = await axiosInstance.get(`/markup-profile/current/${company.id}`);
        if (response.data.has_config) {
          setCurrentMarkup(response.data.markup_multiplier);
          const now = new Date();
          setMarkupRef(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`);
        }
      } catch (error) {
        console.error('Erro ao buscar markup:', error);
      }
    };
    fetchMarkup();
  }, [company?.id]);

  // Buscar clientes
  useEffect(() => {
    const fetchClientes = async () => {
      if (!company?.id) return;
      setLoadingClientes(true);
      try {
        const response = await axiosInstance.get(`/clientes/${company.id}`);
        setClientes(response.data);
      } catch (error) {
        console.error('Erro ao buscar clientes:', error);
      } finally {
        setLoadingClientes(false);
      }
    };
    fetchClientes();
  }, [company?.id]);

  // Selecionar cliente
  const handleClienteChange = (clienteId) => {
    setClienteSelecionado(clienteId);
    if (clienteId === 'novo') {
      setShowNovoClienteModal(true);
      return;
    }
    
    const cliente = clientes.find(c => c.id === clienteId);
    if (cliente) {
      const nome = cliente.tipo === 'PF' ? cliente.nome : (cliente.nome_fantasia || cliente.razao_social);
      const documento = cliente.tipo === 'PF' ? cliente.cpf : cliente.cnpj;
      const endereco = [cliente.logradouro, cliente.numero, cliente.bairro, cliente.cidade, cliente.estado]
        .filter(Boolean).join(', ');
      
      setOrcamentoData(prev => ({
        ...prev,
        cliente_nome: nome || '',
        cliente_documento: documento || '',
        cliente_email: cliente.email || '',
        cliente_whatsapp: cliente.whatsapp || '',
        cliente_endereco: endereco,
      }));
    }
  };

  // Criar novo cliente
  const handleCriarNovoCliente = async (e) => {
    e.preventDefault();
    try {
      const data = {
        ...novoClienteForm,
        tipo: tipoNovoCliente,
        empresa_id: company.id
      };
      
      const response = await axiosInstance.post('/clientes', data);
      toast.success('Cliente cadastrado com sucesso!');
      
      // Recarregar clientes
      const clientesResponse = await axiosInstance.get(`/clientes/${company.id}`);
      setClientes(clientesResponse.data);
      
      // Selecionar novo cliente
      handleClienteChange(response.data.cliente.id);
      setShowNovoClienteModal(false);
      setNovoClienteForm({
        tipo: 'PF', nome: '', cpf: '', nome_fantasia: '', razao_social: '',
        cnpj: '', whatsapp: '', email: '', logradouro: '', numero: '',
        bairro: '', cidade: '', estado: '',
      });
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Erro ao cadastrar cliente');
    }
  };

  // Calcular totais
  const totalServicos = orcamentoItems.reduce((acc, item) => acc + (item.line_total || 0), 0);
  const totalGeral = totalServicos + totalMateriais;

  // Validar e salvar orçamento
  const handleSalvarOrcamento = async () => {
    // Validações
    if (!orcamentoData.cliente_nome) {
      toast.error('Selecione ou preencha os dados do cliente');
      setActiveTab('cliente');
      return;
    }

    if (orcamentoItems.length === 0 && totalMateriais === 0) {
      toast.error('Adicione pelo menos um item ou material ao orçamento');
      setActiveTab('itens');
      return;
    }

    if (!orcamentoData.validade_proposta || !orcamentoData.condicoes_pagamento || !orcamentoData.prazo_execucao) {
      toast.error('Preencha as condições comerciais');
      setActiveTab('condicoes');
      return;
    }

    setLoading(true);
    try {
      // Preparar dados do orçamento
      const data = {
        empresa_id: company.id,
        usuario_id: user?.id || user?.user_id,
        // Cliente
        cliente_nome: orcamentoData.cliente_nome,
        cliente_documento: orcamentoData.cliente_documento,
        cliente_email: orcamentoData.cliente_email,
        cliente_telefone: orcamentoData.cliente_telefone,
        cliente_whatsapp: orcamentoData.cliente_whatsapp,
        cliente_endereco: orcamentoData.cliente_endereco,
        // Tipo e descrição
        tipo: 'servico_itens',
        descricao_servico_ou_produto: orcamentoItems.map(i => i.description).join(', ').substring(0, 200),
        // Valores calculados (agora incluindo materiais)
        custo_total: orcamentoItems.reduce((acc, item) => acc + (item.pu1_used * item.quantity), 0),
        preco_minimo: totalGeral,
        preco_sugerido: totalGeral,
        preco_praticado: totalGeral,
        // Condições
        validade_proposta: orcamentoData.validade_proposta,
        condicoes_pagamento: orcamentoData.condicoes_pagamento,
        prazo_execucao: orcamentoData.prazo_execucao,
        observacoes: orcamentoData.observacoes,
        // Forma de Pagamento Detalhada
        forma_pagamento: orcamentoData.forma_pagamento,
        entrada_percentual: orcamentoData.entrada_percentual,
        valor_entrada: orcamentoData.valor_entrada,
        num_parcelas: orcamentoData.num_parcelas,
        parcelas: orcamentoData.parcelas.map((p, idx) => ({
          numero: p.numero,
          valor: p.valor,
          editado: p.editado || false
        })),
        // Itens com snapshot
        detalhes_itens: {
          items: orcamentoItems.map(item => ({
            item_number: item.item_number,
            service_price_id: item.service_price_id,
            description: item.description,
            unit: item.unit,
            quantity: item.quantity,
            pu1_used: item.pu1_used,
            markup_used: item.markup_used,
            pu2_used: item.pu2_used,
            line_total: item.line_total,
            pricing_ref: item.pricing_ref,
          })),
          markup_snapshot: {
            multiplier: currentMarkup,
            reference: markupRef,
          },
          totals: {
            services_total: totalServicos,
            materials_total: totalMateriais,
            grand_total: totalGeral,
          }
        }
      };

      let response;
      if (modoEdicao && orcamentoId) {
        // Modo edição - PUT
        response = await axiosInstance.put(`/orcamento/${orcamentoId}`, data);
        toast.success(`Orçamento atualizado com sucesso!`);
      } else {
        // Novo orçamento - POST
        response = await axiosInstance.post('/orcamentos', data);
        toast.success(`Orçamento ${response.data.numero_orcamento} criado com sucesso!`);
      }
      navigate('/orcamentos');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Erro ao salvar orçamento');
    } finally {
      setLoading(false);
    }
  };

  // Máscaras importadas de @/lib/formatters

  // Função para calcular parcelas
  const calcularParcelas = useCallback((valorTotal, numParcelas, valorEntrada = 0, formaPagamento) => {
    if (formaPagamento === 'avista') {
      return {
        parcelas: [],
        texto: `À vista: ${formatBRL(valorTotal)}`
      };
    }

    const valorRestante = valorTotal - valorEntrada;
    const valorParcela = valorRestante / numParcelas;
    
    const parcelas = [];
    for (let i = 1; i <= numParcelas; i++) {
      parcelas.push({
        numero: i,
        valor: valorParcela,
        vencimento: '' // Pode ser preenchido depois
      });
    }

    let texto = '';
    if (formaPagamento === 'entrada_parcelas' && valorEntrada > 0) {
      texto = `Entrada: ${formatBRL(valorEntrada)} + ${numParcelas}x de ${formatBRL(valorParcela)}`;
    } else {
      texto = `${numParcelas}x de ${formatBRL(valorParcela)}`;
    }

    return { parcelas, texto };
  }, []);

  // Função para recalcular parcelas quando valores mudam
  const recalcularParcelas = useCallback((valorTotal, entradaPercentual, numParcelas, parcelasAtuais = []) => {
    if (valorTotal <= 0) return { valorEntrada: 0, parcelas: [], texto: '' };

    const valorEntrada = (valorTotal * entradaPercentual) / 100;
    const valorRestante = valorTotal - valorEntrada;
    
    // Calcular valor base de cada parcela
    const valorParcelaBase = valorRestante / numParcelas;
    
    // Criar array de parcelas
    const parcelas = [];
    let somaParcelasEditadas = 0;
    let parcelasNaoEditadas = 0;
    
    // Primeiro, identificar parcelas editadas manualmente
    for (let i = 0; i < numParcelas; i++) {
      const parcelaExistente = parcelasAtuais[i];
      if (parcelaExistente && parcelaExistente.editado) {
        somaParcelasEditadas += parcelaExistente.valor;
        parcelas.push({ ...parcelaExistente });
      } else {
        parcelasNaoEditadas++;
        parcelas.push({ numero: i + 1, valor: 0, editado: false });
      }
    }
    
    // Distribuir o restante entre parcelas não editadas
    const valorRestanteParaNaoEditadas = valorRestante - somaParcelasEditadas;
    const valorParcelaNaoEditada = parcelasNaoEditadas > 0 ? valorRestanteParaNaoEditadas / parcelasNaoEditadas : 0;
    
    parcelas.forEach((p, i) => {
      if (!p.editado) {
        parcelas[i].valor = Math.max(0, valorParcelaNaoEditada);
      }
    });
    
    // Gerar texto das condições
    let texto = '';
    if (entradaPercentual > 0) {
      texto = `Entrada (${entradaPercentual}%): ${formatBRL(valorEntrada)}`;
      if (numParcelas > 0) {
        texto += ` + ${numParcelas} parcela(s)`;
      }
    } else {
      texto = `${numParcelas}x de ${formatBRL(valorParcelaBase)}`;
    }

    return { valorEntrada, parcelas, texto };
  }, []);

  // Atualizar parcelas quando valores relevantes mudam
  useEffect(() => {
    if (orcamentoData.forma_pagamento === 'avista') {
      setOrcamentoData(prev => ({
        ...prev,
        valor_entrada: totalGeral,
        parcelas: [],
        condicoes_pagamento: `À vista: ${formatBRL(totalGeral)}`
      }));
    } else {
      const { valorEntrada, parcelas, texto } = recalcularParcelas(
        totalGeral,
        orcamentoData.entrada_percentual,
        orcamentoData.num_parcelas,
        orcamentoData.parcelas
      );
      
      setOrcamentoData(prev => ({
        ...prev,
        valor_entrada: valorEntrada,
        parcelas: parcelas,
        condicoes_pagamento: texto
      }));
    }
  }, [totalGeral, orcamentoData.forma_pagamento, orcamentoData.entrada_percentual, orcamentoData.num_parcelas, recalcularParcelas]);

  // Função para atualizar valor de uma parcela específica
  const atualizarValorParcela = (index, novoValor) => {
    setOrcamentoData(prev => {
      const novasParcelas = [...prev.parcelas];
      novasParcelas[index] = {
        ...novasParcelas[index],
        valor: novoValor,
        editado: true
      };
      
      // Recalcular as outras parcelas
      const valorRestante = totalGeral - prev.valor_entrada;
      const somaEditadas = novasParcelas.reduce((acc, p) => p.editado ? acc + p.valor : acc, 0);
      const naoEditadas = novasParcelas.filter(p => !p.editado).length;
      const valorParaNaoEditadas = (valorRestante - somaEditadas) / naoEditadas;
      
      novasParcelas.forEach((p, i) => {
        if (!p.editado) {
          novasParcelas[i].valor = Math.max(0, valorParaNaoEditadas);
        }
      });
      
      return { ...prev, parcelas: novasParcelas };
    });
  };

  return (
    <div className="flex min-h-screen bg-zinc-950 text-white">
      <Sidebar user={user} onLogout={onLogout} activePage="orcamentos" onNavigate={handleNavigate} />

      <div className="flex-1 p-8 ml-64">
        <div className="max-w-6xl mx-auto space-y-6">
          <SubscriptionCard user={user} />

          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                onClick={() => handleNavigate('/orcamentos')}
                className="text-zinc-400 hover:text-white"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Voltar
              </Button>
              <div>
                <h1 className="text-3xl font-bold">
                  {modoEdicao ? 'Editar Orçamento' : 'Novo Orçamento'}
                </h1>
                <p className="text-zinc-400">
                  {modoEdicao ? 'Edite os dados do orçamento' : 'Crie um orçamento com itens detalhados'}
                </p>
              </div>
            </div>

            {/* Resumo do valor */}
            <Card className="bg-zinc-900 border-zinc-800 px-6 py-3">
              <div className="text-right">
                <p className="text-xs text-zinc-400">Total do Orçamento</p>
                <p className="text-2xl font-bold text-green-400">
                  {formatBRL(totalGeral)}
                </p>
                {totalMateriais > 0 && (
                  <p className="text-xs text-zinc-500">
                    Serviços: {formatBRL(totalServicos)} | 
                    Materiais: {formatBRL(totalMateriais)}
                  </p>
                )}
              </div>
            </Card>
          </div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4 bg-zinc-900">
              <TabsTrigger value="cliente" className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                Cliente
              </TabsTrigger>
              <TabsTrigger value="itens" className="flex items-center gap-2">
                <Calculator className="w-4 h-4" />
                Serviços
              </TabsTrigger>
              <TabsTrigger value="materiais" className="flex items-center gap-2">
                <Package className="w-4 h-4" />
                Materiais
                {totalMateriais > 0 && (
                  <span className="ml-1 text-xs bg-green-500/20 text-green-400 px-1.5 py-0.5 rounded">
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalMateriais)}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value="condicoes" className="flex items-center gap-2">
                <CreditCard className="w-4 h-4" />
                Condições
              </TabsTrigger>
            </TabsList>

            {/* Tab: Cliente */}
            <TabsContent value="cliente" className="space-y-4 mt-4">
              <Card className="bg-zinc-900 border-zinc-800">
                <CardHeader>
                  <CardTitle>Dados do Cliente</CardTitle>
                  <CardDescription className="text-zinc-400">
                    Selecione um cliente existente ou cadastre um novo
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Seletor de cliente */}
                  <div className="flex gap-2">
                    <Select 
                      value={clienteSelecionado} 
                      onValueChange={handleClienteChange}
                    >
                      <SelectTrigger className="bg-zinc-800 border-zinc-700 flex-1">
                        <SelectValue placeholder="Selecione um cliente..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="novo">
                          <span className="flex items-center gap-2 text-purple-400">
                            <UserPlus className="w-4 h-4" />
                            Cadastrar novo cliente
                          </span>
                        </SelectItem>
                        {clientes.map((cliente) => (
                          <SelectItem key={cliente.id} value={cliente.id}>
                            {cliente.tipo === 'PF' ? cliente.nome : (cliente.nome_fantasia || cliente.razao_social)}
                            {cliente.tipo === 'PJ' && <span className="text-zinc-500 ml-2">(PJ)</span>}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Dados do cliente selecionado */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Nome do Cliente *</Label>
                      <Input
                        value={orcamentoData.cliente_nome}
                        onChange={(e) => setOrcamentoData({...orcamentoData, cliente_nome: e.target.value})}
                        className="bg-zinc-800 border-zinc-700"
                        placeholder="Nome completo"
                      />
                    </div>
                    <div>
                      <Label>CPF/CNPJ</Label>
                      <Input
                        value={orcamentoData.cliente_documento}
                        onChange={(e) => setOrcamentoData({...orcamentoData, cliente_documento: e.target.value})}
                        className="bg-zinc-800 border-zinc-700"
                        placeholder="000.000.000-00"
                      />
                    </div>
                    <div>
                      <Label>E-mail</Label>
                      <Input
                        type="email"
                        value={orcamentoData.cliente_email}
                        onChange={(e) => setOrcamentoData({...orcamentoData, cliente_email: e.target.value})}
                        className="bg-zinc-800 border-zinc-700"
                        placeholder="email@exemplo.com"
                      />
                    </div>
                    <div>
                      <Label>WhatsApp</Label>
                      <Input
                        value={orcamentoData.cliente_whatsapp}
                        onChange={(e) => setOrcamentoData({...orcamentoData, cliente_whatsapp: maskPhone(e.target.value)})}
                        className="bg-zinc-800 border-zinc-700"
                        placeholder="(00) 00000-0000"
                      />
                    </div>
                    <div className="col-span-2">
                      <Label>Endereço</Label>
                      <Input
                        value={orcamentoData.cliente_endereco}
                        onChange={(e) => setOrcamentoData({...orcamentoData, cliente_endereco: e.target.value})}
                        className="bg-zinc-800 border-zinc-700"
                        placeholder="Rua, número, bairro, cidade - UF"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <Button onClick={() => setActiveTab('itens')} className="bg-purple-600 hover:bg-purple-700">
                      Próximo: Serviços
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Tab: Itens/Serviços */}
            <TabsContent value="itens" className="space-y-4 mt-4">
              <OrcamentoItemsGrid
                companyId={company.id}
                markup={currentMarkup}
                markupRef={markupRef}
                items={orcamentoItems}
                onItemsChange={setOrcamentoItems}
              />

              <div className="flex justify-between">
                <Button variant="outline" onClick={() => setActiveTab('cliente')} className="border-zinc-700">
                  Voltar: Cliente
                </Button>
                <Button onClick={() => setActiveTab('materiais')} className="bg-purple-600 hover:bg-purple-700">
                  Próximo: Materiais
                </Button>
              </div>
            </TabsContent>

            {/* Tab: Materiais */}
            <TabsContent value="materiais" className="space-y-4 mt-4">
              <Card className="bg-zinc-900 border-zinc-800">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="w-5 h-5 text-orange-400" />
                    Materiais para Revenda
                  </CardTitle>
                  <CardDescription className="text-zinc-400">
                    Adicione materiais que serão revendidos ao cliente com margem de lucro
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <OrcamentoMateriais 
                    orcamentoId={null}
                    onTotalChange={(total) => setTotalMateriais(total)}
                  />
                </CardContent>
              </Card>

              {totalMateriais > 0 && (
                <Card className="bg-zinc-800 border-zinc-700">
                  <CardContent className="pt-4">
                    <div className="flex justify-between items-center">
                      <span className="text-zinc-400">Total dos Materiais:</span>
                      <span className="text-xl font-bold text-orange-400">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalMateriais)}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              )}

              <div className="flex justify-between">
                <Button variant="outline" onClick={() => setActiveTab('itens')} className="border-zinc-700">
                  Voltar: Serviços
                </Button>
                <Button onClick={() => setActiveTab('condicoes')} className="bg-purple-600 hover:bg-purple-700">
                  Próximo: Condições
                </Button>
              </div>
            </TabsContent>

            {/* Tab: Condições */}
            <TabsContent value="condicoes" className="space-y-4 mt-4">
              <Card className="bg-zinc-900 border-zinc-800">
                <CardHeader>
                  <CardTitle>Condições Comerciais</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Validade da Proposta *</Label>
                      <Input
                        type="date"
                        value={orcamentoData.validade_proposta}
                        onChange={(e) => setOrcamentoData({...orcamentoData, validade_proposta: e.target.value})}
                        className="bg-zinc-800 border-zinc-700"
                      />
                    </div>
                    <div>
                      <Label>Prazo de Execução *</Label>
                      <Input
                        value={orcamentoData.prazo_execucao}
                        onChange={(e) => setOrcamentoData({...orcamentoData, prazo_execucao: e.target.value})}
                        className="bg-zinc-800 border-zinc-700"
                        placeholder="Ex: 15 dias úteis"
                      />
                    </div>
                  </div>

                  {/* Forma de Pagamento */}
                  <Card className="bg-zinc-800/50 border-zinc-700">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Banknote className="w-5 h-5 text-green-400" />
                        Forma de Pagamento
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Tipo de Pagamento */}
                      <RadioGroup 
                        value={orcamentoData.forma_pagamento} 
                        onValueChange={(value) => setOrcamentoData({
                          ...orcamentoData, 
                          forma_pagamento: value,
                          entrada_percentual: value === 'avista' ? 100 : 30,
                          num_parcelas: value === 'avista' ? 0 : 2,
                          parcelas: []
                        })}
                        className="grid grid-cols-2 gap-4"
                      >
                        <div className="flex items-center space-x-2 p-3 rounded-lg border border-zinc-700 hover:border-green-500/50 transition-colors">
                          <RadioGroupItem value="avista" id="avista" />
                          <Label htmlFor="avista" className="cursor-pointer flex-1">
                            <span className="font-medium">À Vista</span>
                            <p className="text-xs text-zinc-400">Pagamento único</p>
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2 p-3 rounded-lg border border-zinc-700 hover:border-green-500/50 transition-colors">
                          <RadioGroupItem value="entrada_parcelas" id="entrada_parcelas" />
                          <Label htmlFor="entrada_parcelas" className="cursor-pointer flex-1">
                            <span className="font-medium">Entrada + Parcelas</span>
                            <p className="text-xs text-zinc-400">Pagamento parcelado</p>
                          </Label>
                        </div>
                      </RadioGroup>

                      {/* Configuração de Entrada e Parcelas */}
                      {orcamentoData.forma_pagamento === 'entrada_parcelas' && (
                        <div className="space-y-4 pt-2 border-t border-zinc-700">
                          {/* Entrada */}
                          <div className="grid grid-cols-3 gap-4">
                            <div>
                              <Label>Entrada (%)</Label>
                              <Select
                                value={String(orcamentoData.entrada_percentual)}
                                onValueChange={(value) => setOrcamentoData({
                                  ...orcamentoData, 
                                  entrada_percentual: parseInt(value),
                                  parcelas: [] // Reset parcelas editadas
                                })}
                              >
                                <SelectTrigger className="bg-zinc-800 border-zinc-700">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="bg-zinc-800 border-zinc-700">
                                  {[0, 10, 15, 20, 25, 30, 35, 40, 45, 50].map(n => (
                                    <SelectItem key={n} value={String(n)}>{n}%</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <Label>Valor da Entrada</Label>
                              <div className="flex items-center gap-2">
                                <MoneyInput
                                  value={orcamentoData.valor_entrada}
                                  onChange={(value) => {
                                    const newPercentual = totalGeral > 0 ? Math.round((value / totalGeral) * 100) : 0;
                                    setOrcamentoData({
                                      ...orcamentoData, 
                                      valor_entrada: value,
                                      entrada_percentual: newPercentual,
                                      parcelas: []
                                    });
                                  }}
                                  className="bg-zinc-800 border-zinc-700"
                                />
                              </div>
                            </div>
                            <div>
                              <Label>Nº de Parcelas</Label>
                              <Select
                                value={String(orcamentoData.num_parcelas)}
                                onValueChange={(value) => setOrcamentoData({
                                  ...orcamentoData, 
                                  num_parcelas: parseInt(value),
                                  parcelas: []
                                })}
                              >
                                <SelectTrigger className="bg-zinc-800 border-zinc-700">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="bg-zinc-800 border-zinc-700">
                                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(n => (
                                    <SelectItem key={n} value={String(n)}>{n}x</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          </div>

                          {/* Lista de Parcelas Editáveis */}
                          {orcamentoData.parcelas.length > 0 && (
                            <div className="space-y-2">
                              <Label className="text-sm text-zinc-400">Parcelas (clique para editar)</Label>
                              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                                {orcamentoData.parcelas.map((parcela, index) => (
                                  <div 
                                    key={index} 
                                    className={`p-3 rounded-lg border ${parcela.editado ? 'border-orange-500 bg-orange-500/10' : 'border-zinc-700 bg-zinc-900'}`}
                                  >
                                    <p className="text-xs text-zinc-400 mb-1">Parcela {parcela.numero}</p>
                                    <MoneyInput
                                      value={parcela.valor}
                                      onChange={(value) => atualizarValorParcela(index, value)}
                                      showSymbol={false}
                                      className="bg-transparent border-none p-0 h-auto text-lg font-semibold text-white"
                                    />
                                    {parcela.editado && (
                                      <span className="text-xs text-orange-400">editado</span>
                                    )}
                                  </div>
                                ))}
                              </div>
                              <p className="text-xs text-zinc-500">
                                * Ao editar uma parcela, as demais são recalculadas automaticamente
                              </p>
                            </div>
                          )}

                          {/* Resumo do Parcelamento */}
                          <div className="p-4 rounded-lg bg-zinc-900 border border-green-500/30">
                            <div className="flex justify-between items-center mb-3">
                              <span className="text-zinc-400">Valor Total</span>
                              <span className="text-xl font-bold text-white">{formatBRL(totalGeral)}</span>
                            </div>
                            <div className="flex justify-between items-center mb-2">
                              <span className="text-zinc-400">Entrada ({orcamentoData.entrada_percentual}%)</span>
                              <span className="text-green-400 font-semibold">{formatBRL(orcamentoData.valor_entrada)}</span>
                            </div>
                            <div className="flex justify-between items-center mb-2">
                              <span className="text-zinc-400">Restante ({orcamentoData.num_parcelas}x)</span>
                              <span className="text-white">{formatBRL(totalGeral - orcamentoData.valor_entrada)}</span>
                            </div>
                            <div className="border-t border-zinc-700 pt-2 mt-2">
                              <p className="text-sm text-zinc-400">Condição:</p>
                              <p className="text-green-400 font-medium">{orcamentoData.condicoes_pagamento}</p>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* À Vista */}
                      {orcamentoData.forma_pagamento === 'avista' && (
                        <div className="p-4 rounded-lg bg-zinc-900 border border-green-500/30">
                          <div className="flex justify-between items-center">
                            <span className="text-zinc-400">Valor à Vista</span>
                            <span className="text-2xl font-bold text-green-400">{formatBRL(totalGeral)}</span>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  <div>
                    <Label>Observações</Label>
                    <Textarea
                      value={orcamentoData.observacoes}
                      onChange={(e) => setOrcamentoData({...orcamentoData, observacoes: e.target.value})}
                      className="bg-zinc-800 border-zinc-700"
                      rows={4}
                      placeholder="Observações adicionais sobre o serviço..."
                    />
                  </div>

                  {/* Resumo */}
                  <Card className="bg-zinc-800 border-zinc-700">
                    <CardContent className="pt-4">
                      <div className="flex justify-between items-center">
                        <div className="space-y-1">
                          <p className="text-zinc-400">Serviços: {orcamentoItems.length} itens</p>
                          {totalMateriais > 0 && (
                            <p className="text-zinc-400">Materiais: {formatBRL(totalMateriais)}</p>
                          )}
                          <p className="text-zinc-400">Markup: {currentMarkup.toFixed(4)}x</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-zinc-400">Total do Orçamento</p>
                          <p className="text-3xl font-bold text-green-400">
                            {formatBRL(totalGeral)}
                          </p>
                          {totalMateriais > 0 && (
                            <p className="text-xs text-zinc-500">
                              (Serviços: {formatBRL(totalServicos)})
                            </p>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <div className="flex justify-between">
                    <Button variant="outline" onClick={() => setActiveTab('materiais')} className="border-zinc-700">
                      Voltar: Materiais
                    </Button>
                    <Button 
                      onClick={handleSalvarOrcamento} 
                      disabled={loading}
                      className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Salvando...
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4 mr-2" />
                          Salvar Orçamento
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Modal: Novo Cliente */}
          <Dialog open={showNovoClienteModal} onOpenChange={setShowNovoClienteModal}>
            <DialogContent className="bg-zinc-900 border-zinc-800 max-w-2xl">
              <DialogHeader>
                <DialogTitle>Cadastrar Novo Cliente</DialogTitle>
              </DialogHeader>

              <form onSubmit={handleCriarNovoCliente} className="space-y-4">
                {/* Tipo de cliente */}
                <div className="flex gap-4">
                  <Button
                    type="button"
                    variant={tipoNovoCliente === 'PF' ? 'default' : 'outline'}
                    onClick={() => setTipoNovoCliente('PF')}
                    className={tipoNovoCliente === 'PF' ? 'bg-purple-600' : 'border-zinc-700'}
                  >
                    Pessoa Física
                  </Button>
                  <Button
                    type="button"
                    variant={tipoNovoCliente === 'PJ' ? 'default' : 'outline'}
                    onClick={() => setTipoNovoCliente('PJ')}
                    className={tipoNovoCliente === 'PJ' ? 'bg-purple-600' : 'border-zinc-700'}
                  >
                    Pessoa Jurídica
                  </Button>
                </div>

                {tipoNovoCliente === 'PF' ? (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Nome Completo *</Label>
                      <Input
                        value={novoClienteForm.nome}
                        onChange={(e) => setNovoClienteForm({...novoClienteForm, nome: e.target.value})}
                        required
                        className="bg-zinc-800 border-zinc-700"
                      />
                    </div>
                    <div>
                      <Label>CPF</Label>
                      <CPFInput
                        value={novoClienteForm.cpf}
                        onChange={(value) => setNovoClienteForm({...novoClienteForm, cpf: value})}
                        className="bg-zinc-800 border-zinc-700"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Nome Fantasia *</Label>
                      <Input
                        value={novoClienteForm.nome_fantasia}
                        onChange={(e) => setNovoClienteForm({...novoClienteForm, nome_fantasia: e.target.value})}
                        required
                        className="bg-zinc-800 border-zinc-700"
                      />
                    </div>
                    <div>
                      <Label>CNPJ</Label>
                      <CNPJInput
                        value={novoClienteForm.cnpj}
                        onChange={(value) => setNovoClienteForm({...novoClienteForm, cnpj: value})}
                        className="bg-zinc-800 border-zinc-700"
                      />
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>WhatsApp</Label>
                    <Input
                      value={novoClienteForm.whatsapp}
                      onChange={(e) => setNovoClienteForm({...novoClienteForm, whatsapp: maskPhone(e.target.value)})}
                      className="bg-zinc-800 border-zinc-700"
                      placeholder="(00) 00000-0000"
                    />
                  </div>
                  <div>
                    <Label>E-mail</Label>
                    <Input
                      type="email"
                      value={novoClienteForm.email}
                      onChange={(e) => setNovoClienteForm({...novoClienteForm, email: e.target.value})}
                      className="bg-zinc-800 border-zinc-700"
                    />
                  </div>
                </div>

                <DialogFooter className="gap-2">
                  <Button type="button" variant="outline" onClick={() => setShowNovoClienteModal(false)} className="border-zinc-700">
                    Cancelar
                  </Button>
                  <Button type="submit" className="bg-purple-600 hover:bg-purple-700">
                    Cadastrar Cliente
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>

          {/* Modal de Confirmação para Sair */}
          <Dialog open={showExitModal} onOpenChange={setShowExitModal}>
            <DialogContent className="bg-zinc-900 border-zinc-800 max-w-md">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-yellow-400">
                  <AlertTriangle className="w-5 h-5" />
                  Cancelar Orçamento?
                </DialogTitle>
              </DialogHeader>
              
              <div className="py-4">
                <p className="text-zinc-300">
                  Você tem dados não salvos neste orçamento. Se sair agora, perderá todas as informações inseridas.
                </p>
                <p className="text-zinc-400 mt-2 text-sm">
                  Deseja realmente cancelar este orçamento?
                </p>
              </div>

              <DialogFooter className="gap-2">
                <Button 
                  variant="outline" 
                  onClick={cancelExit}
                  className="border-zinc-700"
                >
                  Não, continuar editando
                </Button>
                <Button 
                  onClick={confirmExit}
                  className="bg-red-600 hover:bg-red-700"
                >
                  Sim, cancelar orçamento
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </div>
  );
};

export default NovoOrcamentoGrid;
