import React, { useState, useEffect } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { SubscriptionCard } from '@/components/SubscriptionCard';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { MoneyInput } from '@/components/ui/money-input';
import { Calculator, DollarSign, TrendingUp, Users, Truck, UtensilsCrossed, Wrench, AlertTriangle, FileText, Clock, Plus, UserPlus, Settings2, Banknote } from 'lucide-react';
import { axiosInstance } from '../App';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import OrcamentoMateriais from '@/components/OrcamentoMateriais';
import CustosInternosModal from '@/components/CustosInternosModal';

const Precificacao = ({ user, onLogout }) => {
  const [tipoPrecificacao, setTipoPrecificacao] = useState('servico');
  const [tipoCobrancaServico, setTipoCobrancaServico] = useState('por-m2');
  const [showOrcamentoModal, setShowOrcamentoModal] = useState(false);
  const [loadingOrcamento, setLoadingOrcamento] = useState(false);
  const [totalMateriais, setTotalMateriais] = useState(0);
  const navigate = useNavigate();

  const company = JSON.parse(localStorage.getItem('company') || '{}');

  // Estados para Custos Internos
  const [showCustosInternosModal, setShowCustosInternosModal] = useState(false);
  const [custosInternos, setCustosInternos] = useState({
    hiddenCosts: [],
    workUseMaterials: [],
    totals: { totalCost: 0, totalPrice: 0 }
  });
  const [currentMarkup, setCurrentMarkup] = useState(1.0);

  // Buscar markup atual da empresa
  useEffect(() => {
    const fetchCurrentMarkup = async () => {
      if (!company?.id) return;
      try {
        const response = await axiosInstance.get(`/markup-profile/current/${company.id}`);
        if (response.data.has_config) {
          setCurrentMarkup(response.data.markup_multiplier);
        }
      } catch (error) {
        console.error('Erro ao buscar markup:', error);
      }
    };
    fetchCurrentMarkup();
  }, [company?.id]);

  // Estados para Clientes
  const [clientes, setClientes] = useState([]);
  const [clienteSelecionado, setClienteSelecionado] = useState('');
  const [showNovoClienteModal, setShowNovoClienteModal] = useState(false);
  const [loadingClientes, setLoadingClientes] = useState(false);
  
  // Estados para Vendedores
  const [vendedores, setVendedores] = useState([]);
  const [loadingVendedores, setLoadingVendedores] = useState(false);
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

  // Buscar clientes quando o modal de orçamento abrir
  useEffect(() => {
    if (showOrcamentoModal && company?.id) {
      fetchClientes();
      fetchVendedores();
    }
  }, [showOrcamentoModal, company?.id]);

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

  // Buscar vendedores
  const fetchVendedores = async () => {
    if (!company?.id) return;
    setLoadingVendedores(true);
    try {
      const response = await axiosInstance.get(`/vendedores/${company.id}`);
      setVendedores(response.data);
    } catch (error) {
      console.error('Erro ao buscar vendedores:', error);
    } finally {
      setLoadingVendedores(false);
    }
  };

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
        cliente_nome: nome,
        cliente_documento: documento || '',
        cliente_email: cliente.email || '',
        cliente_whatsapp: cliente.whatsapp || '',
        cliente_endereco: endereco,
      }));
    }
  };

  const maskCPF = (value) => {
    return value
      .replace(/\D/g, '')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})/, '$1-$2')
      .replace(/(-\d{2})\d+?$/, '$1');
  };

  const maskCNPJ = (value) => {
    return value
      .replace(/\D/g, '')
      .replace(/(\d{2})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1/$2')
      .replace(/(\d{4})(\d)/, '$1-$2')
      .replace(/(-\d{2})\d+?$/, '$1');
  };

  const maskPhone = (value) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 10) {
      return numbers
        .replace(/(\d{2})(\d)/, '($1) $2')
        .replace(/(\d{4})(\d)/, '$1-$2');
    }
    return numbers
      .replace(/(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{5})(\d)/, '$1-$2')
      .replace(/(-\d{4})\d+?$/, '$1');
  };

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
      
      // Recarregar lista de clientes
      await fetchClientes();
      
      // Selecionar o novo cliente
      const novoId = response.data.id;
      setClienteSelecionado(novoId);
      
      // Preencher dados do orçamento com o novo cliente
      const nome = tipoNovoCliente === 'PF' ? novoClienteForm.nome : (novoClienteForm.nome_fantasia || novoClienteForm.razao_social);
      const documento = tipoNovoCliente === 'PF' ? novoClienteForm.cpf : novoClienteForm.cnpj;
      const endereco = [novoClienteForm.logradouro, novoClienteForm.numero, novoClienteForm.bairro, novoClienteForm.cidade, novoClienteForm.estado]
        .filter(Boolean).join(', ');
      
      setOrcamentoData(prev => ({
        ...prev,
        cliente_nome: nome,
        cliente_documento: documento || '',
        cliente_email: novoClienteForm.email || '',
        cliente_whatsapp: novoClienteForm.whatsapp || '',
        cliente_endereco: endereco,
      }));
      
      // Fechar modal e resetar form
      setShowNovoClienteModal(false);
      setNovoClienteForm({
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
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Erro ao cadastrar cliente');
    }
  };

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
    // Forma de pagamento
    forma_pagamento: 'avista', // 'avista', 'entrada_parcelas' ou 'boleto'
    entrada_percentual: 30,
    num_parcelas: 2,
    parcelas: [],
    // Boleto bancário
    boleto_tipo: 'com_entrada', // 'com_entrada' ou 'primeiro_dias'
    boleto_num_parcelas: 1, // 1 a 20 parcelas (boletos após entrada)
    boleto_entrada_valor: 0, // Valor da entrada (quando boleto_tipo = 'com_entrada')
    boleto_entrada_percentual: 30, // Percentual da entrada
    boleto_primeiro_dias: 30, // Dias para o primeiro boleto (quando boleto_tipo = 'primeiro_dias')
    boleto_taxa: 0, // Taxa em R$ por boleto
    // Vendedor responsável
    vendedor_id: '',
    vendedor_nome: '',
    vendedor_comissao: true,
  });

  // ========== ESTADOS PARA PRODUTO (LÓGICA ANTIGA) ==========
  const [formProduto, setFormProduto] = useState({
    custosVariaveis: '',
    despesasFixasRateadas: '',
    margemLucro: '',
    impostos: '',
  });
  const [resultadoProduto, setResultadoProduto] = useState(null);

  // ========== ESTADOS PARA SERVIÇO POR M² ==========
  const [formServico, setFormServico] = useState({
    // Bloco A - Escopo
    nomeServico: '',
    areaTotal: '',
    produtividadeEquipe: '',
    quantidadeOperarios: '',
    diasServico: '',

    // Bloco B - Mão de obra
    salarioMensal: '',
    encargos: '',
    horasProdutivas: '',

    // Bloco C - Deslocamento
    distanciaIda: '',
    distanciaVolta: '',
    diasDeslocamento: '',
    consumoVeiculo: '',
    precoCombustivel: '',
    pedagios: '',

    // Bloco D - Alimentação
    custoAlimentacao: '',

    // Bloco E - Materiais
    materiais: '',
    aluguelMaquinas: '',
    taxasLicencas: '',
    descarte: '',
    outrosCustos: '',

    // Bloco F - Imprevistos
    reservaImprevistos: '',

    // Bloco G - Tributos e Lucro
    impostosFaturamento: '',
    taxasRecebimento: '',
    margemLucro: '',
  });
  const [resultadoServico, setResultadoServico] = useState(null);

  // ========== FUNÇÃO DE CÁLCULO - PRODUTO ==========
  const calcularProduto = (e) => {
    e.preventDefault();

    const custos = parseFloat(formProduto.custosVariaveis) || 0;
    const despesas = parseFloat(formProduto.despesasFixasRateadas) || 0;
    const margem = parseFloat(formProduto.margemLucro) || 0;
    const impostos = parseFloat(formProduto.impostos) || 0;

    const custoTotal = custos + despesas;
    const margemDecimal = margem / 100;
    const impostosDecimal = impostos / 100;

    const precoVenda = custoTotal / (1 - margemDecimal - impostosDecimal);
    const lucroUnitario = precoVenda - custoTotal - (precoVenda * impostosDecimal);

    setResultadoProduto({
      precoVenda: precoVenda.toFixed(2),
      custoTotal: custoTotal.toFixed(2),
      impostoTotal: (precoVenda * impostosDecimal).toFixed(2),
      lucroUnitario: lucroUnitario.toFixed(2),
      margemEfetiva: ((lucroUnitario / precoVenda) * 100).toFixed(2),
    });
  };

  // ========== FUNÇÃO DE CÁLCULO - SERVIÇO POR M² ==========
  const calcularServicoPorM2 = (e) => {
    e.preventDefault();

    // Extrair valores do formulário
    const areaTotal = parseFloat(formServico.areaTotal) || 0;
    const produtividadeEquipe = parseFloat(formServico.produtividadeEquipe) || 1;
    const quantidadeOperarios = parseFloat(formServico.quantidadeOperarios) || 1;
    const diasServico = parseFloat(formServico.diasServico) || 1;

    // Bloco B - Mão de obra
    const salarioMensal = parseFloat(formServico.salarioMensal) || 0;
    const encargos = parseFloat(formServico.encargos) || 0;
    const horasProdutivas = parseFloat(formServico.horasProdutivas) || 160;

    const salarioTotalOperario = salarioMensal * (1 + encargos / 100);
    const custoHoraOperario = salarioTotalOperario / horasProdutivas;
    const custoHoraEquipe = custoHoraOperario * quantidadeOperarios;
    const horasTotais = areaTotal / produtividadeEquipe;
    const custoMaoObra = horasTotais * custoHoraEquipe;

    // Bloco C - Deslocamento
    const distanciaIda = parseFloat(formServico.distanciaIda) || 0;
    const distanciaVolta = parseFloat(formServico.distanciaVolta) || 0;
    const diasDeslocamento = parseFloat(formServico.diasDeslocamento) || diasServico;
    const consumoVeiculo = parseFloat(formServico.consumoVeiculo) || 10;
    const precoCombustivel = parseFloat(formServico.precoCombustivel) || 0;
    const pedagios = parseFloat(formServico.pedagios) || 0;

    const distanciaTotal = (distanciaIda + distanciaVolta) * diasDeslocamento;
    const litrosNecessarios = distanciaTotal / consumoVeiculo;
    const custoCombustivel = litrosNecessarios * precoCombustivel;
    const custoDeslocamento = custoCombustivel + pedagios;

    // Bloco D - Alimentação
    const custoAlimentacao = parseFloat(formServico.custoAlimentacao) || 0;
    const alimentacaoTotal = custoAlimentacao * quantidadeOperarios * diasServico;

    // Bloco E - Materiais e equipamentos
    const materiais = parseFloat(formServico.materiais) || 0;
    const aluguelMaquinas = parseFloat(formServico.aluguelMaquinas) || 0;
    const taxasLicencas = parseFloat(formServico.taxasLicencas) || 0;
    const descarte = parseFloat(formServico.descarte) || 0;
    const outrosCustos = parseFloat(formServico.outrosCustos) || 0;
    const custoMateriaisEquip = materiais + aluguelMaquinas + taxasLicencas + descarte + outrosCustos;

    // Bloco F - Custo direto base + Reserva para imprevistos
    const custoDiretoBase = custoMaoObra + custoDeslocamento + alimentacaoTotal + custoMateriaisEquip;
    const reservaImprevistos = parseFloat(formServico.reservaImprevistos) || 0;
    const valorReserva = custoDiretoBase * (reservaImprevistos / 100);
    const custoDiretoTotal = custoDiretoBase + valorReserva;

    // Bloco G - Tributos e Lucro
    const impostosFaturamento = parseFloat(formServico.impostosFaturamento) || 0;
    const taxasRecebimento = parseFloat(formServico.taxasRecebimento) || 0;
    const margemLucro = parseFloat(formServico.margemLucro) || 0;

    // Cálculos finais
    const custoTotal = custoDiretoTotal;
    const aliquotaTotalSemLucro = (impostosFaturamento + taxasRecebimento) / 100;
    const precoMinimo = custoTotal / (1 - aliquotaTotalSemLucro);
    const aliquotaTotalComLucro = (impostosFaturamento + taxasRecebimento + margemLucro) / 100;
    const precoSugerido = custoTotal / (1 - aliquotaTotalComLucro);
    const precoPorM2 = precoSugerido / areaTotal;
    const lucroEmReais = precoSugerido - custoTotal - (precoSugerido * aliquotaTotalSemLucro);
    const lucroPercentual = (lucroEmReais / precoSugerido) * 100;

    setResultadoServico({
      // Resumo de mão de obra
      custoHoraOperario: custoHoraOperario.toFixed(2),
      custoHoraEquipe: custoHoraEquipe.toFixed(2),
      horasTotais: horasTotais.toFixed(2),
      custoMaoObra: custoMaoObra.toFixed(2),

      // Resumo de deslocamento
      distanciaTotal: distanciaTotal.toFixed(2),
      litrosNecessarios: litrosNecessarios.toFixed(2),
      custoCombustivel: custoCombustivel.toFixed(2),
      custoDeslocamento: custoDeslocamento.toFixed(2),

      // Resumo de alimentação
      alimentacaoTotal: alimentacaoTotal.toFixed(2),

      // Resumo de materiais
      custoMateriaisEquip: custoMateriaisEquip.toFixed(2),

      // Resumos finais
      custoDiretoBase: custoDiretoBase.toFixed(2),
      valorReserva: valorReserva.toFixed(2),
      custoDiretoTotal: custoDiretoTotal.toFixed(2),
      custoTotal: custoTotal.toFixed(2),
      precoMinimo: precoMinimo.toFixed(2),
      precoSugerido: precoSugerido.toFixed(2),
      precoPorM2: precoPorM2.toFixed(2),
      lucroEmReais: lucroEmReais.toFixed(2),
      lucroPercentual: lucroPercentual.toFixed(2),
    });
  };

  // ========== FUNÇÃO PARA GERAR ORÇAMENTO ==========
  const handleGerarOrcamento = () => {
    if (!resultadoServico && !resultadoProduto) {
      toast.error('Calcule o preço antes de gerar o orçamento');
      return;
    }
    setShowOrcamentoModal(true);
  };

  const handleCriarOrcamento = async (e) => {
    e.preventDefault();
    setLoadingOrcamento(true);

    try {
      const data = {
        empresa_id: company.id,
        usuario_id: (user?.id || user?.user_id),
        ...orcamentoData,
      };

      // Se for serviço por m²
      if (tipoPrecificacao === 'servico' && tipoCobrancaServico === 'por-m2' && resultadoServico) {
        data.tipo = 'servico_m2';
        data.descricao_servico_ou_produto = formServico.nomeServico || 'Serviço por m²';
        data.area_m2 = parseFloat(formServico.areaTotal) || 0;
        data.custo_total = parseFloat(resultadoServico.custoTotal);
        data.preco_minimo = parseFloat(resultadoServico.precoMinimo);
        data.preco_sugerido = parseFloat(resultadoServico.precoSugerido);
        data.preco_praticado = parseFloat(resultadoServico.precoSugerido);
      }
      // Se for produto
      else if (tipoPrecificacao === 'produto' && resultadoProduto) {
        data.tipo = 'produto';
        data.descricao_servico_ou_produto = 'Produto';
        data.custo_total = parseFloat(resultadoProduto.custoTotal);
        data.preco_minimo = parseFloat(resultadoProduto.precoVenda);
        data.preco_sugerido = parseFloat(resultadoProduto.precoVenda);
        data.preco_praticado = parseFloat(resultadoProduto.precoVenda);
        data.quantidade = 1;
      }

      const response = await axiosInstance.post('/orcamentos', data);
      toast.success(`Orçamento ${response.data.numero_orcamento} criado com sucesso!`);
      setShowOrcamentoModal(false);
      
      // Resetar form orçamento
      setOrcamentoData({
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
        vendedor_id: '',
        vendedor_nome: '',
      });

      // Redirecionar para página de orçamentos
      setTimeout(() => navigate('/orcamentos'), 1500);
    } catch (error) {
      toast.error('Erro ao criar orçamento');
    } finally {
      setLoadingOrcamento(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-zinc-950 text-white">
      <Sidebar user={user} onLogout={onLogout} activePage="precificacao" />

      <div className="flex-1 p-8 ml-64">
        <div className="max-w-7xl mx-auto space-y-6">
          <SubscriptionCard user={user} />

          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-2">Precificação</h1>
            <p className="text-zinc-400">Calculadora profissional de preço de venda</p>
          </div>

          {/* Apenas Serviço */}
          <Tabs value="servico" onValueChange={setTipoPrecificacao} className="w-full">
            <TabsList className="grid w-full max-w-md grid-cols-1 bg-zinc-900">
              <TabsTrigger value="servico">Serviço</TabsTrigger>
            </TabsList>

            {/* ========== TAB: PRODUTO ========== */}
            <TabsContent value="produto" className="space-y-6 mt-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Formulário Produto */}
                <Card className="bg-zinc-900 border-zinc-800">
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Calculator className="mr-2" />
                      Dados do Produto
                    </CardTitle>
                    <CardDescription className="text-zinc-400">
                      Insira os custos e margem desejada
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={calcularProduto} className="space-y-4">
                      <div>
                        <Label>Custos Variáveis (R$)</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={formProduto.custosVariaveis}
                          onChange={(e) => setFormProduto({ ...formProduto, custosVariaveis: e.target.value })}
                          placeholder="Ex: matéria-prima, embalagem"
                          required
                          className="bg-zinc-800 border-zinc-700"
                        />
                        <p className="text-xs text-zinc-500 mt-1">Custos que variam com a produção</p>
                      </div>

                      <div>
                        <Label>Despesas Fixas Rateadas (R$)</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={formProduto.despesasFixasRateadas}
                          onChange={(e) => setFormProduto({ ...formProduto, despesasFixasRateadas: e.target.value })}
                          placeholder="Ex: aluguel, salários"
                          required
                          className="bg-zinc-800 border-zinc-700"
                        />
                        <p className="text-xs text-zinc-500 mt-1">Despesas fixas divididas pelo volume de vendas</p>
                      </div>

                      <div>
                        <Label>Margem de Lucro Desejada (%)</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={formProduto.margemLucro}
                          onChange={(e) => setFormProduto({ ...formProduto, margemLucro: e.target.value })}
                          placeholder="Ex: 30"
                          required
                          className="bg-zinc-800 border-zinc-700"
                        />
                      </div>

                      <div>
                        <Label>Impostos (%)</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={formProduto.impostos}
                          onChange={(e) => setFormProduto({ ...formProduto, impostos: e.target.value })}
                          placeholder="Ex: 12"
                          required
                          className="bg-zinc-800 border-zinc-700"
                        />
                      </div>

                      <Button type="submit" className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700">
                        Calcular Preço de Venda
                      </Button>
                    </form>
                  </CardContent>
                </Card>

                {/* Resultado Produto */}
                {resultadoProduto && (
                  <Card className="bg-zinc-900 border-zinc-800">
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <DollarSign className="mr-2" />
                        Resultado da Precificação
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="p-6 bg-gradient-to-r from-purple-600/20 to-blue-600/20 rounded-lg border border-purple-500/30">
                        <p className="text-sm text-zinc-300 mb-2">Preço de Venda Sugerido</p>
                        <p className="text-4xl font-bold">
                          R$ {parseFloat(resultadoProduto.precoVenda).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </p>
                      </div>

                      <div className="space-y-3">
                        <div className="flex justify-between p-3 bg-zinc-800 rounded-lg">
                          <span className="text-zinc-400">Custo Total</span>
                          <span className="font-semibold">
                            R$ {parseFloat(resultadoProduto.custoTotal).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </span>
                        </div>

                        <div className="flex justify-between p-3 bg-zinc-800 rounded-lg">
                          <span className="text-zinc-400">Impostos</span>
                          <span className="text-orange-400 font-semibold">
                            R$ {parseFloat(resultadoProduto.impostoTotal).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </span>
                        </div>

                        <div className="flex justify-between p-3 bg-zinc-800 rounded-lg">
                          <span className="text-zinc-400">Lucro Unitário</span>
                          <span className="text-green-400 font-semibold">
                            R$ {parseFloat(resultadoProduto.lucroUnitario).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </span>
                        </div>

                        <div className="flex justify-between p-3 bg-zinc-800 rounded-lg">
                          <span className="text-zinc-400">Margem Efetiva</span>
                          <span className="text-purple-400 font-semibold">{resultadoProduto.margemEfetiva}%</span>
                        </div>
                      </div>

                      {/* Botão Gerar Orçamento */}
                      <div className="flex justify-center pt-4">
                        <Button
                          onClick={handleGerarOrcamento}
                          className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 px-6 py-5"
                        >
                          <FileText className="w-5 h-5 mr-2" />
                          Gerar Orçamento para Cliente
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </TabsContent>

            {/* ========== TAB: SERVIÇO ========== */}
            <TabsContent value="servico" className="space-y-6 mt-6">
              {/* Tipo de Cobrança do Serviço */}
              <Card className="bg-zinc-900 border-zinc-800">
                <CardHeader>
                  <CardTitle>Tipo de Cobrança do Serviço</CardTitle>
                </CardHeader>
                <CardContent>
                  <Select value={tipoCobrancaServico} onValueChange={setTipoCobrancaServico}>
                    <SelectTrigger className="bg-zinc-800 border-zinc-700">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="por-hora">Por Hora</SelectItem>
                      <SelectItem value="por-m2">Por m² (Metro Quadrado)</SelectItem>
                      <SelectItem value="valor-fechado">Valor Fechado</SelectItem>
                    </SelectContent>
                  </Select>
                </CardContent>
              </Card>

              {/* ========== FORMULÁRIO DE SERVIÇO ========== */}
              {(
                <form onSubmit={calcularServicoPorM2} className="space-y-6">
                  {/* Bloco A - Escopo do Serviço */}
                  <Card className="bg-zinc-900 border-zinc-800">
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <Calculator className="mr-2" />
                        Escopo do Serviço
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="md:col-span-2">
                        <Label>Nome do Serviço</Label>
                        <Input
                          value={formServico.nomeServico}
                          onChange={(e) => setFormServico({ ...formServico, nomeServico: e.target.value })}
                          placeholder="Ex: Instalação de piso"
                          className="bg-zinc-800 border-zinc-700"
                        />
                      </div>

                      <div>
                        <Label>Área Total (m²) *</Label>
                        <Input
                          type="number"
                          step="0.01"
                          required
                          value={formServico.areaTotal}
                          onChange={(e) => setFormServico({ ...formServico, areaTotal: e.target.value })}
                          placeholder="120"
                          className="bg-zinc-800 border-zinc-700"
                        />
                      </div>

                      <div>
                        <Label>Produtividade da Equipe (m²/hora) *</Label>
                        <Input
                          type="number"
                          step="0.01"
                          required
                          value={formServico.produtividadeEquipe}
                          onChange={(e) => setFormServico({ ...formServico, produtividadeEquipe: e.target.value })}
                          placeholder="20"
                          className="bg-zinc-800 border-zinc-700"
                        />
                        <p className="text-xs text-zinc-500 mt-1">Quantos m² a equipe executa por hora</p>
                      </div>

                      <div>
                        <Label>Quantidade de Operários *</Label>
                        <Input
                          type="number"
                          required
                          value={formServico.quantidadeOperarios}
                          onChange={(e) => setFormServico({ ...formServico, quantidadeOperarios: e.target.value })}
                          placeholder="3"
                          className="bg-zinc-800 border-zinc-700"
                        />
                      </div>

                      <div>
                        <Label>Dias Previstos de Serviço</Label>
                        <Input
                          type="number"
                          value={formServico.diasServico}
                          onChange={(e) => setFormServico({ ...formServico, diasServico: e.target.value })}
                          placeholder="5"
                          className="bg-zinc-800 border-zinc-700"
                        />
                      </div>
                    </CardContent>
                  </Card>

                  {/* Bloco B - Mão de Obra */}
                  <Card className="bg-zinc-900 border-zinc-800 border-l-4 border-l-blue-500">
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <Users className="mr-2" />
                        Custo de Mão de Obra
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <Label>Salário Mensal por Operário (R$) *</Label>
                        <Input
                          type="number"
                          step="0.01"
                          required
                          value={formServico.salarioMensal}
                          onChange={(e) => setFormServico({ ...formServico, salarioMensal: e.target.value })}
                          placeholder="2000"
                          className="bg-zinc-800 border-zinc-700"
                        />
                      </div>

                      <div>
                        <Label>Encargos sobre Salário (%)</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={formServico.encargos}
                          onChange={(e) => setFormServico({ ...formServico, encargos: e.target.value })}
                          placeholder="80"
                          className="bg-zinc-800 border-zinc-700"
                        />
                        <p className="text-xs text-zinc-500 mt-1">INSS, FGTS, benefícios</p>
                      </div>

                      <div>
                        <Label>Horas Produtivas/Mês</Label>
                        <Input
                          type="number"
                          value={formServico.horasProdutivas}
                          onChange={(e) => setFormServico({ ...formServico, horasProdutivas: e.target.value })}
                          placeholder="160"
                          className="bg-zinc-800 border-zinc-700"
                        />
                      </div>
                    </CardContent>
                  </Card>

                  {/* Bloco C - Deslocamento */}
                  <Card className="bg-zinc-900 border-zinc-800 border-l-4 border-l-green-500">
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <Truck className="mr-2" />
                        Deslocamento / Combustível
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <Label>Distância de Ida (km)</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={formServico.distanciaIda}
                          onChange={(e) => setFormServico({ ...formServico, distanciaIda: e.target.value })}
                          placeholder="50"
                          className="bg-zinc-800 border-zinc-700"
                        />
                      </div>

                      <div>
                        <Label>Distância de Volta (km)</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={formServico.distanciaVolta}
                          onChange={(e) => setFormServico({ ...formServico, distanciaVolta: e.target.value })}
                          placeholder="50"
                          className="bg-zinc-800 border-zinc-700"
                        />
                      </div>

                      <div>
                        <Label>Dias de Deslocamento</Label>
                        <Input
                          type="number"
                          value={formServico.diasDeslocamento}
                          onChange={(e) => setFormServico({ ...formServico, diasDeslocamento: e.target.value })}
                          placeholder="5"
                          className="bg-zinc-800 border-zinc-700"
                        />
                      </div>

                      <div>
                        <Label>Consumo do Veículo (km/L)</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={formServico.consumoVeiculo}
                          onChange={(e) => setFormServico({ ...formServico, consumoVeiculo: e.target.value })}
                          placeholder="10"
                          className="bg-zinc-800 border-zinc-700"
                        />
                      </div>

                      <div>
                        <Label>Preço do Combustível (R$/L)</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={formServico.precoCombustivel}
                          onChange={(e) => setFormServico({ ...formServico, precoCombustivel: e.target.value })}
                          placeholder="5.50"
                          className="bg-zinc-800 border-zinc-700"
                        />
                      </div>

                      <div>
                        <Label>Pedágios Totais (R$)</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={formServico.pedagios}
                          onChange={(e) => setFormServico({ ...formServico, pedagios: e.target.value })}
                          placeholder="0"
                          className="bg-zinc-800 border-zinc-700"
                        />
                      </div>
                    </CardContent>
                  </Card>

                  {/* Bloco D - Alimentação */}
                  <Card className="bg-zinc-900 border-zinc-800 border-l-4 border-l-yellow-500">
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <UtensilsCrossed className="mr-2" />
                        Alimentação e Benefícios
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label>Custo de Alimentação por Operário/Dia (R$)</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={formServico.custoAlimentacao}
                          onChange={(e) => setFormServico({ ...formServico, custoAlimentacao: e.target.value })}
                          placeholder="30"
                          className="bg-zinc-800 border-zinc-700"
                        />
                      </div>
                    </CardContent>
                  </Card>

                  {/* Bloco E - Materiais e Equipamentos */}
                  <Card className="bg-zinc-900 border-zinc-800 border-l-4 border-l-purple-500">
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <Wrench className="mr-2" />
                        Materiais, Equipamentos e Outros Custos
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label>Materiais e Insumos (R$)</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={formServico.materiais}
                          onChange={(e) => setFormServico({ ...formServico, materiais: e.target.value })}
                          placeholder="0"
                          className="bg-zinc-800 border-zinc-700"
                        />
                      </div>

                      <div>
                        <Label>Aluguel de Máquinas/Equipamentos (R$)</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={formServico.aluguelMaquinas}
                          onChange={(e) => setFormServico({ ...formServico, aluguelMaquinas: e.target.value })}
                          placeholder="0"
                          className="bg-zinc-800 border-zinc-700"
                        />
                      </div>

                      <div>
                        <Label>Taxas/Licenças Específicas (R$)</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={formServico.taxasLicencas}
                          onChange={(e) => setFormServico({ ...formServico, taxasLicencas: e.target.value })}
                          placeholder="0"
                          className="bg-zinc-800 border-zinc-700"
                        />
                      </div>

                      <div>
                        <Label>Descarte de Resíduos/Entulho (R$)</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={formServico.descarte}
                          onChange={(e) => setFormServico({ ...formServico, descarte: e.target.value })}
                          placeholder="0"
                          className="bg-zinc-800 border-zinc-700"
                        />
                      </div>

                      <div className="md:col-span-2">
                        <Label>Outros Custos Diretos (R$)</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={formServico.outrosCustos}
                          onChange={(e) => setFormServico({ ...formServico, outrosCustos: e.target.value })}
                          placeholder="0"
                          className="bg-zinc-800 border-zinc-700"
                        />
                      </div>
                    </CardContent>
                  </Card>

                  {/* Bloco F - Imprevistos */}
                  <Card className="bg-zinc-900 border-zinc-800 border-l-4 border-l-orange-500">
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <AlertTriangle className="mr-2" />
                        Reserva para Imprevistos
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div>
                        <Label>Reserva para Imprevistos (%)</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={formServico.reservaImprevistos}
                          onChange={(e) => setFormServico({ ...formServico, reservaImprevistos: e.target.value })}
                          placeholder="5"
                          className="bg-zinc-800 border-zinc-700"
                        />
                        <p className="text-xs text-zinc-500 mt-1">Aplicado sobre custos diretos</p>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Bloco G - Tributos e Margem de Lucro */}
                  <Card className="bg-zinc-900 border-zinc-800 border-l-4 border-l-red-500">
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <TrendingUp className="mr-2" />
                        Tributos, Taxas e Margem de Lucro
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <Label>Impostos sobre Faturamento (%) *</Label>
                        <Input
                          type="number"
                          step="0.01"
                          required
                          value={formServico.impostosFaturamento}
                          onChange={(e) => setFormServico({ ...formServico, impostosFaturamento: e.target.value })}
                          placeholder="6"
                          className="bg-zinc-800 border-zinc-700"
                        />
                      </div>

                      <div>
                        <Label>Taxas de Recebimento (%)</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={formServico.taxasRecebimento}
                          onChange={(e) => setFormServico({ ...formServico, taxasRecebimento: e.target.value })}
                          placeholder="2"
                          className="bg-zinc-800 border-zinc-700"
                        />
                        <p className="text-xs text-zinc-500 mt-1">Cartão, boleto, plataforma</p>
                      </div>

                      <div>
                        <Label>Margem de Lucro Desejada (%) *</Label>
                        <Input
                          type="number"
                          step="0.01"
                          required
                          value={formServico.margemLucro}
                          onChange={(e) => setFormServico({ ...formServico, margemLucro: e.target.value })}
                          placeholder="20"
                          className="bg-zinc-800 border-zinc-700"
                        />
                      </div>
                    </CardContent>
                  </Card>

                  {/* Botão Calcular */}
                  <Button type="submit" className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-lg py-6">
                    Calcular Preço de Venda do Serviço
                  </Button>
                </form>
              )}

              {/* ========== RESULTADO: SERVIÇO ========== */}
              {resultadoServico && (
                <div className="space-y-6">
                  {/* Card Principal de Resultado */}
                  <Card className="bg-gradient-to-br from-purple-600/20 to-blue-600/20 border-purple-500/30">
                    <CardHeader>
                      <CardTitle className="text-2xl">Resultado da Precificação</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {/* Preço Sugerido */}
                      <div className="p-8 bg-zinc-900 rounded-lg border border-purple-500/50">
                        <p className="text-sm text-zinc-400 mb-2">Preço de Venda Sugerido</p>
                        <p className="text-5xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
                          R$ {parseFloat(resultadoServico.precoSugerido).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </p>
                        <p className="text-zinc-400 mt-2">
                          Valor por m²: <span className="text-white font-bold">R$ {parseFloat(resultadoServico.precoPorM2).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}/m²</span>
                        </p>
                      </div>

                      {/* Grid de Resumos */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-4 bg-zinc-900 rounded-lg">
                          <p className="text-xs text-zinc-400 mb-1">Custo Total do Serviço</p>
                          <p className="text-2xl font-bold">
                            R$ {parseFloat(resultadoServico.custoTotal).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </p>
                        </div>

                        <div className="p-4 bg-zinc-900 rounded-lg">
                          <p className="text-xs text-zinc-400 mb-1">Preço Mínimo (sem lucro)</p>
                          <p className="text-2xl font-bold text-yellow-400">
                            R$ {parseFloat(resultadoServico.precoMinimo).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </p>
                        </div>

                        <div className="p-4 bg-zinc-900 rounded-lg">
                          <p className="text-xs text-zinc-400 mb-1">Lucro Estimado</p>
                          <p className="text-2xl font-bold text-green-400">
                            R$ {parseFloat(resultadoServico.lucroEmReais).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </p>
                          <p className="text-xs text-zinc-400 mt-1">{resultadoServico.lucroPercentual}% do preço de venda</p>
                        </div>

                        <div className="p-4 bg-zinc-900 rounded-lg">
                          <p className="text-xs text-zinc-400 mb-1">Margem Efetiva</p>
                          <p className="text-2xl font-bold text-purple-400">{resultadoServico.lucroPercentual}%</p>
                        </div>
                      </div>

                      {/* Insight */}
                      <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                        <p className="text-blue-200">
                          💡 <strong>Insight:</strong> Com esse preço, você está cobrando aproximadamente <strong>R$ {resultadoServico.precoPorM2}/m²</strong>, com margem de cerca de <strong>{resultadoServico.lucroPercentual}%</strong>.
                        </p>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Detalhamento dos Custos */}
                  <Card className="bg-zinc-900 border-zinc-800">
                    <CardHeader>
                      <CardTitle>Detalhamento dos Custos</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Mão de Obra */}
                      <div className="p-4 bg-zinc-800 rounded-lg">
                        <h4 className="font-semibold text-blue-400 mb-2 flex items-center">
                          <Users className="w-4 h-4 mr-2" />
                          Mão de Obra
                        </h4>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <span className="text-zinc-400">Custo/hora operário:</span>
                          <span>R$ {resultadoServico.custoHoraOperario}</span>
                          <span className="text-zinc-400">Custo/hora equipe:</span>
                          <span>R$ {resultadoServico.custoHoraEquipe}</span>
                          <span className="text-zinc-400">Horas totais estimadas:</span>
                          <span>{resultadoServico.horasTotais}h</span>
                          <span className="text-zinc-400 font-semibold">Total Mão de Obra:</span>
                          <span className="font-semibold">R$ {parseFloat(resultadoServico.custoMaoObra).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                        </div>
                      </div>

                      {/* Deslocamento */}
                      <div className="p-4 bg-zinc-800 rounded-lg">
                        <h4 className="font-semibold text-green-400 mb-2 flex items-center">
                          <Truck className="w-4 h-4 mr-2" />
                          Deslocamento
                        </h4>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <span className="text-zinc-400">Distância total:</span>
                          <span>{resultadoServico.distanciaTotal} km</span>
                          <span className="text-zinc-400">Litros necessários:</span>
                          <span>{resultadoServico.litrosNecessarios}L</span>
                          <span className="text-zinc-400">Custo combustível:</span>
                          <span>R$ {resultadoServico.custoCombustivel}</span>
                          <span className="text-zinc-400 font-semibold">Total Deslocamento:</span>
                          <span className="font-semibold">R$ {parseFloat(resultadoServico.custoDeslocamento).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                        </div>
                      </div>

                      {/* Alimentação */}
                      <div className="p-4 bg-zinc-800 rounded-lg">
                        <h4 className="font-semibold text-yellow-400 mb-2 flex items-center">
                          <UtensilsCrossed className="w-4 h-4 mr-2" />
                          Alimentação
                        </h4>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <span className="text-zinc-400 font-semibold">Total Alimentação:</span>
                          <span className="font-semibold">R$ {parseFloat(resultadoServico.alimentacaoTotal).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                        </div>
                      </div>

                      {/* Materiais */}
                      <div className="p-4 bg-zinc-800 rounded-lg">
                        <h4 className="font-semibold text-purple-400 mb-2 flex items-center">
                          <Wrench className="w-4 h-4 mr-2" />
                          Materiais e Equipamentos
                        </h4>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <span className="text-zinc-400 font-semibold">Total Materiais/Equipamentos:</span>
                          <span className="font-semibold">R$ {parseFloat(resultadoServico.custoMateriaisEquip).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                        </div>
                      </div>

                      {/* Resumo Final */}
                      <div className="p-4 bg-gradient-to-r from-purple-600/20 to-blue-600/20 rounded-lg border border-purple-500/30">
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <span className="text-zinc-300">Custo Direto Base:</span>
                          <span>R$ {parseFloat(resultadoServico.custoDiretoBase).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                          <span className="text-zinc-300">Reserva Imprevistos:</span>
                          <span>R$ {parseFloat(resultadoServico.valorReserva).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                          <span className="text-white font-bold">Custo Direto Total:</span>
                          <span className="font-bold">R$ {parseFloat(resultadoServico.custoDiretoTotal).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Botão Gerar Orçamento */}
                  <div className="flex justify-center">
                    <Button
                      onClick={handleGerarOrcamento}
                      className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-lg px-8 py-6"
                    >
                      <FileText className="w-5 h-5 mr-2" />
                      Gerar Orçamento para Cliente
                    </Button>
                  </div>
                </div>
              )}

              {/* ========== MODO: POR HORA ========== */}
              {tipoCobrancaServico === 'por-hora' && (
                <div className="space-y-6">
                  {/* Custos por Hora */}
                  <Card className="bg-zinc-900 border-zinc-800">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Clock className="text-blue-400" size={20} />
                        Custos por Hora
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="horas-estimadas">Horas Estimadas</Label>
                          <Input
                            id="horas-estimadas"
                            type="number"
                            step="0.5"
                            placeholder="Ex: 8"
                            value={formServico.horas_estimadas || ''}
                            onChange={(e) => setFormServico({ ...formServico, horas_estimadas: parseFloat(e.target.value) || 0 })}
                            className="bg-zinc-800 border-zinc-700"
                          />
                          <p className="text-xs text-zinc-500 mt-1">Tempo total para executar o serviço</p>
                        </div>

                        <div>
                          <Label htmlFor="valor-hora">Valor da Hora (R$)</Label>
                          <Input
                            id="valor-hora"
                            type="number"
                            step="0.01"
                            placeholder="Ex: 150.00"
                            value={formServico.valor_hora || ''}
                            onChange={(e) => setFormServico({ ...formServico, valor_hora: parseFloat(e.target.value) || 0 })}
                            className="bg-zinc-800 border-zinc-700"
                          />
                          <p className="text-xs text-zinc-500 mt-1">Quanto você cobra por hora</p>
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="custos-materiais-hora">Custos com Materiais (R$)</Label>
                        <Input
                          id="custos-materiais-hora"
                          type="number"
                          step="0.01"
                          placeholder="Ex: 500.00"
                          value={formServico.custos_materiais || ''}
                          onChange={(e) => setFormServico({ ...formServico, custos_materiais: parseFloat(e.target.value) || 0 })}
                          className="bg-zinc-800 border-zinc-700"
                        />
                        <p className="text-xs text-zinc-500 mt-1">Custo total dos materiais necessários</p>
                      </div>

                      <div>
                        <Label htmlFor="outros-custos-hora">Outros Custos (R$)</Label>
                        <Input
                          id="outros-custos-hora"
                          type="number"
                          step="0.01"
                          placeholder="Ex: 200.00"
                          value={formServico.outros_custos || ''}
                          onChange={(e) => setFormServico({ ...formServico, outros_custos: parseFloat(e.target.value) || 0 })}
                          className="bg-zinc-800 border-zinc-700"
                        />
                        <p className="text-xs text-zinc-500 mt-1">Despesas, deslocamento, equipamentos, etc.</p>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Cálculo do Preço */}
                  <Card className="bg-zinc-900 border-zinc-800">
                    <CardHeader>
                      <CardTitle>Cálculo do Preço</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {(() => {
                        const horas = formServico.horas_estimadas || 0;
                        const valorHora = formServico.valor_hora || 0;
                        const custosMateriais = formServico.custos_materiais || 0;
                        const outrosCustos = formServico.outros_custos || 0;

                        const custoMaoDeObra = horas * valorHora;
                        const custoTotal = custoMaoDeObra + custosMateriais + outrosCustos;
                        const margemDesejada = formServico.margem_desejada || 30;
                        const precoSugerido = custoTotal * (1 + margemDesejada / 100);

                        return (
                          <>
                            <div className="grid grid-cols-2 gap-4">
                              <div className="p-3 bg-zinc-800 rounded-lg">
                                <p className="text-sm text-zinc-400">Mão de Obra</p>
                                <p className="text-lg font-bold text-white">
                                  R$ {custoMaoDeObra.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                </p>
                                <p className="text-xs text-zinc-500">{horas}h × R$ {valorHora.toFixed(2)}</p>
                              </div>

                              <div className="p-3 bg-zinc-800 rounded-lg">
                                <p className="text-sm text-zinc-400">Custo Total</p>
                                <p className="text-lg font-bold text-yellow-400">
                                  R$ {custoTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                </p>
                              </div>
                            </div>

                            <div>
                              <Label htmlFor="margem-hora">Margem de Lucro Desejada (%)</Label>
                              <Input
                                id="margem-hora"
                                type="number"
                                step="1"
                                placeholder="Ex: 30"
                                value={formServico.margem_desejada || 30}
                                onChange={(e) => setFormServico({ ...formServico, margem_desejada: parseFloat(e.target.value) || 30 })}
                                className="bg-zinc-800 border-zinc-700"
                              />
                            </div>

                            <div className="p-4 bg-gradient-to-r from-purple-600/20 to-blue-600/20 rounded-lg border border-purple-500/50">
                              <p className="text-sm text-zinc-400 mb-1">Preço Sugerido para Cobrar</p>
                              <p className="text-3xl font-bold text-white">
                                R$ {precoSugerido.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                              </p>
                              <p className="text-sm text-green-400 mt-1">
                                Lucro: R$ {(precoSugerido - custoTotal).toLocaleString('pt-BR', { minimumFractionDigits: 2 })} ({margemDesejada}%)
                              </p>
                            </div>

                            <Button
                              onClick={() => handleGerarOrcamento({
                                tipo: 'servico_hora',
                                horas_estimadas: horas,
                                valor_hora: valorHora,
                                custo_total: custoTotal,
                                preco_sugerido: precoSugerido,
                              })}
                              className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                              disabled={!horas || !valorHora}
                            >
                              <FileText size={16} className="mr-2" />
                              Gerar Orçamento (Por Hora)
                            </Button>
                          </>
                        );
                      })()}
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* ========== MODO: VALOR FECHADO ========== */}
              {tipoCobrancaServico === 'valor-fechado' && (
                <div className="space-y-6">
                  {/* Custos do Projeto */}
                  <Card className="bg-zinc-900 border-zinc-800">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <DollarSign className="text-green-400" size={20} />
                        Custos do Projeto
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label htmlFor="custo-mao-obra-fechado">Custo de Mão de Obra (R$)</Label>
                        <Input
                          id="custo-mao-obra-fechado"
                          type="number"
                          step="0.01"
                          placeholder="Ex: 2000.00"
                          value={formServico.custo_mao_obra || ''}
                          onChange={(e) => setFormServico({ ...formServico, custo_mao_obra: parseFloat(e.target.value) || 0 })}
                          className="bg-zinc-800 border-zinc-700"
                        />
                        <p className="text-xs text-zinc-500 mt-1">Quanto vai custar a mão de obra total</p>
                      </div>

                      <div>
                        <Label htmlFor="custo-materiais-fechado">Custo de Materiais (R$)</Label>
                        <Input
                          id="custo-materiais-fechado"
                          type="number"
                          step="0.01"
                          placeholder="Ex: 1500.00"
                          value={formServico.custos_materiais || ''}
                          onChange={(e) => setFormServico({ ...formServico, custos_materiais: parseFloat(e.target.value) || 0 })}
                          className="bg-zinc-800 border-zinc-700"
                        />
                        <p className="text-xs text-zinc-500 mt-1">Custo total dos materiais</p>
                      </div>

                      <div>
                        <Label htmlFor="despesas-operacionais">Despesas Operacionais (R$)</Label>
                        <Input
                          id="despesas-operacionais"
                          type="number"
                          step="0.01"
                          placeholder="Ex: 500.00"
                          value={formServico.despesas_operacionais || ''}
                          onChange={(e) => setFormServico({ ...formServico, despesas_operacionais: parseFloat(e.target.value) || 0 })}
                          className="bg-zinc-800 border-zinc-700"
                        />
                        <p className="text-xs text-zinc-500 mt-1">Deslocamento, aluguel de equipamentos, etc.</p>
                      </div>

                      <div>
                        <Label htmlFor="impostos-taxas">Impostos e Taxas (R$ ou %)</Label>
                        <Input
                          id="impostos-taxas"
                          type="number"
                          step="0.01"
                          placeholder="Ex: 15 (para 15%)"
                          value={formServico.impostos_taxas || ''}
                          onChange={(e) => setFormServico({ ...formServico, impostos_taxas: parseFloat(e.target.value) || 0 })}
                          className="bg-zinc-800 border-zinc-700"
                        />
                        <p className="text-xs text-zinc-500 mt-1">Percentual de impostos sobre o projeto</p>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Cálculo do Preço Fechado */}
                  <Card className="bg-zinc-900 border-zinc-800">
                    <CardHeader>
                      <CardTitle>Cálculo do Preço Fechado</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {(() => {
                        const custoMaoObra = formServico.custo_mao_obra || 0;
                        const custoMateriais = formServico.custos_materiais || 0;
                        const despesasOp = formServico.despesas_operacionais || 0;
                        const impostos = formServico.impostos_taxas || 0;
                        
                        const custoBase = custoMaoObra + custoMateriais + despesasOp;
                        const custoImpostos = custoBase * (impostos / 100);
                        const custoTotal = custoBase + custoImpostos;
                        
                        const margemDesejada = formServico.margem_desejada || 30;
                        const valorFechado = custoTotal * (1 + margemDesejada / 100);

                        return (
                          <>
                            <div className="space-y-2">
                              <div className="flex justify-between p-3 bg-zinc-800 rounded-lg">
                                <span className="text-zinc-400">Mão de Obra</span>
                                <span className="font-semibold text-white">
                                  R$ {custoMaoObra.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                </span>
                              </div>
                              <div className="flex justify-between p-3 bg-zinc-800 rounded-lg">
                                <span className="text-zinc-400">Materiais</span>
                                <span className="font-semibold text-white">
                                  R$ {custoMateriais.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                </span>
                              </div>
                              <div className="flex justify-between p-3 bg-zinc-800 rounded-lg">
                                <span className="text-zinc-400">Despesas Operacionais</span>
                                <span className="font-semibold text-white">
                                  R$ {despesasOp.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                </span>
                              </div>
                              <div className="flex justify-between p-3 bg-zinc-800 rounded-lg">
                                <span className="text-zinc-400">Impostos ({impostos}%)</span>
                                <span className="font-semibold text-yellow-400">
                                  R$ {custoImpostos.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                </span>
                              </div>
                              <div className="flex justify-between p-3 bg-yellow-600/20 border border-yellow-600/50 rounded-lg">
                                <span className="font-semibold text-white">Custo Total</span>
                                <span className="font-bold text-yellow-400">
                                  R$ {custoTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                </span>
                              </div>
                            </div>

                            <div>
                              <Label htmlFor="margem-fechado">Margem de Lucro Desejada (%)</Label>
                              <Input
                                id="margem-fechado"
                                type="number"
                                step="1"
                                placeholder="Ex: 30"
                                value={formServico.margem_desejada || 30}
                                onChange={(e) => setFormServico({ ...formServico, margem_desejada: parseFloat(e.target.value) || 30 })}
                                className="bg-zinc-800 border-zinc-700"
                              />
                            </div>

                            <div className="p-6 bg-gradient-to-r from-green-600/20 to-emerald-600/20 rounded-lg border-2 border-green-500/50">
                              <p className="text-sm text-zinc-400 mb-2">Valor Fechado do Projeto</p>
                              <p className="text-4xl font-bold text-white mb-2">
                                R$ {valorFechado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                              </p>
                              <div className="flex justify-between text-sm">
                                <span className="text-zinc-400">Custo Total</span>
                                <span className="text-zinc-300">
                                  R$ {custoTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                </span>
                              </div>
                              <div className="flex justify-between text-sm">
                                <span className="text-green-400 font-semibold">Lucro Líquido ({margemDesejada}%)</span>
                                <span className="text-green-400 font-semibold">
                                  R$ {(valorFechado - custoTotal).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                </span>
                              </div>
                            </div>

                            <Button
                              onClick={() => handleGerarOrcamento({
                                tipo: 'valor_fechado',
                                custo_total: custoTotal,
                                preco_praticado: valorFechado,
                              })}
                              className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                              disabled={!custoMaoObra && !custoMateriais}
                            >
                              <FileText size={16} className="mr-2" />
                              Gerar Orçamento (Valor Fechado)
                            </Button>
                          </>
                        );
                      })()}
                    </CardContent>
                  </Card>
                </div>
              )}
            </TabsContent>
          </Tabs>

          {/* Dicas */}
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader>
              <CardTitle>Dicas de Precificação</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3 text-zinc-300">
                <li className="flex items-start">
                  <span className="mr-3">•</span>
                  <span>Sempre considere TODOS os custos: diretos, indiretos, fixos e variáveis</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-3">•</span>
                  <span>A margem de lucro deve cobrir imprevistos e permitir reinvestimento</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-3">•</span>
                  <span>Pesquise os preços da concorrência antes de definir o seu</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-3">•</span>
                  <span>Revise sua precificação periodicamente, especialmente após mudanças de custos</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-3">•</span>
                  <span>Para serviços por m², sempre valide a produtividade real da equipe</span>
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Modal de Criação de Orçamento */}
      <Dialog open={showOrcamentoModal} onOpenChange={setShowOrcamentoModal}>
        <DialogContent className="bg-zinc-900 border-zinc-800 text-white max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Gerar Orçamento para Cliente</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleCriarOrcamento} className="space-y-6">
            {/* Dados do Cliente */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold border-b border-zinc-700 pb-2">Dados do Cliente</h3>
              
              {/* Seleção de Cliente */}
              <div className="flex gap-2 items-end">
                <div className="flex-1">
                  <Label>Selecionar Cliente *</Label>
                  <Select value={clienteSelecionado} onValueChange={handleClienteChange}>
                    <SelectTrigger className="bg-zinc-800 border-zinc-700">
                      <SelectValue placeholder={loadingClientes ? "Carregando..." : "Selecione um cliente"} />
                    </SelectTrigger>
                    <SelectContent className="bg-zinc-800 border-zinc-700">
                      <SelectItem value="novo" className="text-green-400">
                        <span className="flex items-center gap-2">
                          <UserPlus size={16} />
                          + Cadastrar Novo Cliente
                        </span>
                      </SelectItem>
                      {clientes.length > 0 && (
                        <div className="border-t border-zinc-700 my-1" />
                      )}
                      {clientes.map((cliente) => (
                        <SelectItem key={cliente.id} value={cliente.id}>
                          <span className="flex items-center gap-2">
                            <span className={`text-xs px-1.5 py-0.5 rounded ${
                              cliente.tipo === 'PF' ? 'bg-blue-500/20 text-blue-300' : 'bg-green-500/20 text-green-300'
                            }`}>
                              {cliente.tipo}
                            </span>
                            {cliente.tipo === 'PF' ? cliente.nome : (cliente.nome_fantasia || cliente.razao_social)}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  type="button"
                  onClick={() => setShowNovoClienteModal(true)}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <Plus size={18} />
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Nome do Cliente *</Label>
                  <Input
                    required
                    value={orcamentoData.cliente_nome}
                    onChange={(e) => setOrcamentoData({ ...orcamentoData, cliente_nome: e.target.value })}
                    placeholder="Nome completo"
                    className="bg-zinc-800 border-zinc-700"
                  />
                </div>

                <div>
                  <Label>CPF/CNPJ</Label>
                  <Input
                    value={orcamentoData.cliente_documento}
                    onChange={(e) => setOrcamentoData({ ...orcamentoData, cliente_documento: e.target.value })}
                    placeholder="000.000.000-00"
                    className="bg-zinc-800 border-zinc-700"
                  />
                </div>

                <div>
                  <Label>WhatsApp *</Label>
                  <Input
                    required
                    value={orcamentoData.cliente_whatsapp}
                    onChange={(e) => setOrcamentoData({ ...orcamentoData, cliente_whatsapp: e.target.value })}
                    placeholder="(00) 00000-0000"
                    className="bg-zinc-800 border-zinc-700"
                  />
                  <p className="text-xs text-zinc-500 mt-1">Necessário para envio do orçamento</p>
                </div>

                <div>
                  <Label>E-mail</Label>
                  <Input
                    type="email"
                    value={orcamentoData.cliente_email}
                    onChange={(e) => setOrcamentoData({ ...orcamentoData, cliente_email: e.target.value })}
                    placeholder="cliente@email.com"
                    className="bg-zinc-800 border-zinc-700"
                  />
                </div>

                <div className="md:col-span-2">
                  <Label>Endereço</Label>
                  <Input
                    value={orcamentoData.cliente_endereco}
                    onChange={(e) => setOrcamentoData({ ...orcamentoData, cliente_endereco: e.target.value })}
                    placeholder="Endereço completo do cliente"
                    className="bg-zinc-800 border-zinc-700"
                  />
                </div>

                {/* Vendedor Responsável */}
                <div className="md:col-span-2 p-4 bg-gradient-to-r from-orange-900/20 to-yellow-900/20 rounded-lg border border-orange-500/30">
                  <Label className="text-orange-400 flex items-center gap-2 mb-1">
                    <Users size={16} />
                    Vendedor Responsável
                  </Label>
                  <p className="text-xs text-zinc-400 mb-2">
                    Selecione o vendedor responsável ou "Sem comissão" se for venda do proprietário.
                  </p>
                  <Select 
                    value={orcamentoData.vendedor_id || 'none'} 
                    onValueChange={(vendedorId) => {
                      if (vendedorId === 'none') {
                        setOrcamentoData(prev => ({
                          ...prev,
                          vendedor_id: '',
                          vendedor_nome: '',
                          vendedor_comissao: true
                        }));
                      } else if (vendedorId === 'sem_comissao') {
                        setOrcamentoData(prev => ({
                          ...prev,
                          vendedor_id: 'sem_comissao',
                          vendedor_nome: 'Sem comissão (Proprietário)',
                          vendedor_comissao: false
                        }));
                      } else {
                        const vendedor = vendedores.find(v => v.id === vendedorId);
                        setOrcamentoData(prev => ({
                          ...prev,
                          vendedor_id: vendedorId,
                          vendedor_nome: vendedor?.nome_completo || '',
                          vendedor_comissao: true
                        }));
                      }
                    }}
                  >
                    <SelectTrigger className="bg-zinc-800 border-zinc-700">
                      <SelectValue placeholder="Selecione um vendedor..." />
                    </SelectTrigger>
                    <SelectContent className="bg-zinc-800 border-zinc-700">
                      <SelectItem value="none">
                        <span className="text-zinc-500">Nenhum vendedor</span>
                      </SelectItem>
                      <SelectItem value="sem_comissao">
                        <span className="text-green-400 font-medium">💼 Sem comissão (Proprietário)</span>
                      </SelectItem>
                      {vendedores.map((vendedor) => (
                        <SelectItem key={vendedor.id} value={vendedor.id}>
                          {vendedor.nome_completo}
                          {vendedor.percentual_comissao > 0 && (
                            <span className="text-orange-400 ml-2">({vendedor.percentual_comissao}%)</span>
                          )}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {orcamentoData.vendedor_id === 'sem_comissao' && (
                    <p className="text-xs text-green-400 mt-1">
                      ✓ Venda do proprietário - nenhuma comissão será gerada.
                    </p>
                  )}
                  {vendedores.length === 0 && orcamentoData.vendedor_id !== 'sem_comissao' && (
                    <p className="text-xs text-yellow-500 mt-1">
                      ⚠️ Nenhum vendedor cadastrado. Use "Sem comissão" ou cadastre funcionários.
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Condições Comerciais */}
            {/* Composição do Preço (Custos Internos) */}
            <div className="p-4 bg-gradient-to-r from-orange-900/20 to-red-900/20 rounded-lg border border-orange-500/30">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-semibold text-orange-400 flex items-center gap-2">
                    <Settings2 size={20} />
                    Composição do Preço
                  </h3>
                  <p className="text-sm text-gray-400">Adicione custos indiretos e EPI/consumo interno</p>
                </div>
                <div className="flex items-center gap-4">
                  {custosInternos.totals.totalPrice > 0 && (
                    <div className="text-right">
                      <p className="text-xs text-gray-400">Custos Internos</p>
                      <p className="text-lg font-bold text-green-400">+ R$ {custosInternos.totals.totalPrice.toFixed(2)}</p>
                    </div>
                  )}
                  <Button
                    type="button"
                    onClick={() => setShowCustosInternosModal(true)}
                    variant="outline"
                    className="border-orange-500 text-orange-400 hover:bg-orange-500/20"
                  >
                    {custosInternos.totals.totalPrice > 0 ? 'Editar Custos' : 'Adicionar Custos'}
                  </Button>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold border-b border-zinc-700 pb-2">Condições Comerciais</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Validade da Proposta *</Label>
                  <Input
                    required
                    value={orcamentoData.validade_proposta}
                    onChange={(e) => setOrcamentoData({ ...orcamentoData, validade_proposta: e.target.value })}
                    placeholder="Ex: 30 dias"
                    className="bg-zinc-800 border-zinc-700"
                  />
                </div>

                <div>
                  <Label>Prazo de Execução *</Label>
                  <Input
                    required
                    value={orcamentoData.prazo_execucao}
                    onChange={(e) => setOrcamentoData({ ...orcamentoData, prazo_execucao: e.target.value })}
                    placeholder="Ex: 15 dias úteis"
                    className="bg-zinc-800 border-zinc-700"
                  />
                </div>

                <div className="md:col-span-2">
                  <Label>Condições de Pagamento *</Label>
                  <Input
                    required
                    value={orcamentoData.condicoes_pagamento}
                    onChange={(e) => setOrcamentoData({ ...orcamentoData, condicoes_pagamento: e.target.value })}
                    placeholder="Ex: 50% antecipado, 50% na entrega"
                    className="bg-zinc-800 border-zinc-700"
                  />
                </div>

                {/* Forma de Pagamento Avançada */}
                <div className="md:col-span-2 p-4 bg-gradient-to-r from-green-900/20 to-emerald-900/20 rounded-lg border border-green-500/30">
                  <Label className="text-green-400 flex items-center gap-2 mb-3">
                    <Banknote size={16} />
                    Forma de Pagamento
                  </Label>
                  <RadioGroup 
                    value={orcamentoData.forma_pagamento} 
                    onValueChange={(value) => setOrcamentoData({
                      ...orcamentoData, 
                      forma_pagamento: value,
                      entrada_percentual: value === 'avista' ? 100 : (value === 'boleto' ? 0 : 30),
                      num_parcelas: value === 'avista' ? 0 : (value === 'boleto' ? 0 : 2),
                      boleto_num_parcelas: value === 'boleto' ? 1 : orcamentoData.boleto_num_parcelas,
                    })}
                    className="grid grid-cols-3 gap-3"
                  >
                    <div className="flex items-center space-x-2 p-3 rounded-lg border border-zinc-700 hover:border-green-500/50 transition-colors">
                      <RadioGroupItem value="avista" id="prec_avista" />
                      <Label htmlFor="prec_avista" className="cursor-pointer flex-1">
                        <span className="font-medium text-sm">À Vista</span>
                        <p className="text-xs text-zinc-400">Pagamento único</p>
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2 p-3 rounded-lg border border-zinc-700 hover:border-green-500/50 transition-colors">
                      <RadioGroupItem value="entrada_parcelas" id="prec_entrada_parcelas" />
                      <Label htmlFor="prec_entrada_parcelas" className="cursor-pointer flex-1">
                        <span className="font-medium text-sm">Entrada + Parcelas</span>
                        <p className="text-xs text-zinc-400">Cartão de crédito</p>
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2 p-3 rounded-lg border border-zinc-700 hover:border-yellow-500/50 transition-colors">
                      <RadioGroupItem value="boleto" id="prec_boleto" />
                      <Label htmlFor="prec_boleto" className="cursor-pointer flex-1">
                        <span className="font-medium text-sm">Boleto Bancário</span>
                        <p className="text-xs text-zinc-400">1 a 20 parcelas</p>
                      </Label>
                    </div>
                  </RadioGroup>

                  {/* Configuração de Boleto */}
                  {orcamentoData.forma_pagamento === 'boleto' && (
                    <div className="mt-4 pt-4 border-t border-zinc-700 space-y-4">
                      {/* Tipo de Boleto */}
                      <div className="space-y-2">
                        <Label className="text-sm">Tipo de Parcelamento</Label>
                        <RadioGroup
                          value={orcamentoData.boleto_tipo}
                          onValueChange={(value) => setOrcamentoData({
                            ...orcamentoData,
                            boleto_tipo: value,
                            boleto_entrada_percentual: value === 'com_entrada' ? 30 : 0,
                            boleto_primeiro_dias: value === 'primeiro_dias' ? 30 : 0
                          })}
                          className="grid grid-cols-1 gap-2"
                        >
                          <div className="flex items-center space-x-2 p-2 rounded-lg border border-zinc-700 hover:border-zinc-500 cursor-pointer">
                            <RadioGroupItem value="com_entrada" id="prec_boleto_entrada" />
                            <Label htmlFor="prec_boleto_entrada" className="cursor-pointer flex-1">
                              <span className="font-medium text-sm">Entrada + Boletos</span>
                              <p className="text-xs text-zinc-500">Entrada à vista + boletos a partir de 30 dias</p>
                            </Label>
                          </div>
                          <div className="flex items-center space-x-2 p-2 rounded-lg border border-zinc-700 hover:border-zinc-500 cursor-pointer">
                            <RadioGroupItem value="primeiro_dias" id="prec_boleto_dias" />
                            <Label htmlFor="prec_boleto_dias" className="cursor-pointer flex-1">
                              <span className="font-medium text-sm">Boleto para X dias</span>
                              <p className="text-xs text-zinc-500">Primeiro boleto para X dias + demais mensais</p>
                            </Label>
                          </div>
                        </RadioGroup>
                      </div>

                      {/* Configuração: Entrada + Boletos */}
                      {orcamentoData.boleto_tipo === 'com_entrada' && (
                        <div className="space-y-3 p-3 bg-zinc-800/50 rounded-lg">
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <Label className="text-sm">Entrada (%)</Label>
                              <Select
                                value={String(orcamentoData.boleto_entrada_percentual)}
                                onValueChange={(value) => setOrcamentoData({
                                  ...orcamentoData,
                                  boleto_entrada_percentual: parseInt(value),
                                  boleto_entrada_valor: (parseFloat(orcamentoData.preco_sugerido || 0) * parseInt(value)) / 100
                                })}
                              >
                                <SelectTrigger className="bg-zinc-800 border-zinc-700">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="bg-zinc-800 border-zinc-700 max-h-[300px]">
                                  {[10, 20, 30, 40, 50, 60, 70].map(n => (
                                    <SelectItem key={n} value={String(n)}>{n}%</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <Label className="text-sm">Número de Boletos</Label>
                              <Select
                                value={String(orcamentoData.boleto_num_parcelas)}
                                onValueChange={(value) => setOrcamentoData({
                                  ...orcamentoData,
                                  boleto_num_parcelas: parseInt(value)
                                })}
                              >
                                <SelectTrigger className="bg-zinc-800 border-zinc-700">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="bg-zinc-800 border-zinc-700 max-h-[300px]">
                                  {Array.from({ length: 20 }, (_, i) => i + 1).map(n => (
                                    <SelectItem key={n} value={String(n)}>{n}x</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                          <div>
                            <Label className="text-sm">Taxa por Boleto (R$)</Label>
                            <MoneyInput
                              value={orcamentoData.boleto_taxa}
                              onChange={(value) => setOrcamentoData({
                                ...orcamentoData,
                                boleto_taxa: value
                              })}
                              className="bg-zinc-800 border-zinc-700"
                            />
                          </div>
                          {/* Resumo */}
                          <div className="p-2 bg-yellow-900/20 border border-yellow-700 rounded-lg text-xs">
                            <p className="text-yellow-400 font-medium">Resumo:</p>
                            <p className="text-zinc-300 mt-1">
                              <span className="text-green-400">Entrada:</span> R$ {((parseFloat(orcamentoData.preco_sugerido || 0) * orcamentoData.boleto_entrada_percentual) / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 })} ({orcamentoData.boleto_entrada_percentual}%)
                            </p>
                            <p className="text-zinc-300">
                              <span className="text-blue-400">{orcamentoData.boleto_num_parcelas}x Boletos:</span> R$ {(((parseFloat(orcamentoData.preco_sugerido || 0) * (100 - orcamentoData.boleto_entrada_percentual) / 100) + (orcamentoData.boleto_taxa * orcamentoData.boleto_num_parcelas)) / orcamentoData.boleto_num_parcelas).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Configuração: Primeiro boleto para X dias */}
                      {orcamentoData.boleto_tipo === 'primeiro_dias' && (
                        <div className="space-y-3 p-3 bg-zinc-800/50 rounded-lg">
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <Label className="text-sm">Primeiro Boleto para (dias)</Label>
                              <Select
                                value={String(orcamentoData.boleto_primeiro_dias)}
                                onValueChange={(value) => setOrcamentoData({
                                  ...orcamentoData,
                                  boleto_primeiro_dias: parseInt(value)
                                })}
                              >
                                <SelectTrigger className="bg-zinc-800 border-zinc-700">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="bg-zinc-800 border-zinc-700 max-h-[300px]">
                                  {[7, 14, 15, 21, 28, 30, 45, 60, 90].map(n => (
                                    <SelectItem key={n} value={String(n)}>{n} dias</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <Label className="text-sm">Total de Boletos</Label>
                              <Select
                                value={String(orcamentoData.boleto_num_parcelas)}
                                onValueChange={(value) => setOrcamentoData({
                                  ...orcamentoData,
                                  boleto_num_parcelas: parseInt(value)
                                })}
                              >
                                <SelectTrigger className="bg-zinc-800 border-zinc-700">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="bg-zinc-800 border-zinc-700 max-h-[300px]">
                                  {Array.from({ length: 20 }, (_, i) => i + 1).map(n => (
                                    <SelectItem key={n} value={String(n)}>{n}x</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                          <div>
                            <Label className="text-sm">Taxa por Boleto (R$)</Label>
                            <MoneyInput
                              value={orcamentoData.boleto_taxa}
                              onChange={(value) => setOrcamentoData({
                                ...orcamentoData,
                                boleto_taxa: value
                              })}
                              className="bg-zinc-800 border-zinc-700"
                            />
                          </div>
                          {/* Resumo */}
                          <div className="p-2 bg-yellow-900/20 border border-yellow-700 rounded-lg text-xs">
                            <p className="text-yellow-400 font-medium">Resumo:</p>
                            <p className="text-zinc-300 mt-1">
                              <span className="text-blue-400">1º Boleto ({orcamentoData.boleto_primeiro_dias} dias):</span> R$ {((precoFinal + (orcamentoData.boleto_taxa * orcamentoData.boleto_num_parcelas)) / orcamentoData.boleto_num_parcelas).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </p>
                            {orcamentoData.boleto_num_parcelas > 1 && (
                              <p className="text-zinc-300">
                                <span className="text-blue-400">{orcamentoData.boleto_num_parcelas - 1}x Boletos (mensais):</span> R$ {((precoFinal + (orcamentoData.boleto_taxa * orcamentoData.boleto_num_parcelas)) / orcamentoData.boleto_num_parcelas).toLocaleString('pt-BR', { minimumFractionDigits: 2 })} cada
                              </p>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Configuração de Entrada + Parcelas */}
                  {orcamentoData.forma_pagamento === 'entrada_parcelas' && (
                    <div className="mt-4 pt-4 border-t border-zinc-700 grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm">Entrada (%)</Label>
                        <Input
                          type="number"
                          min="0"
                          max="100"
                          value={orcamentoData.entrada_percentual}
                          onChange={(e) => setOrcamentoData({
                            ...orcamentoData, 
                            entrada_percentual: parseInt(e.target.value) || 0
                          })}
                          className="bg-zinc-800 border-zinc-700"
                        />
                      </div>
                      <div>
                        <Label className="text-sm">Número de Parcelas</Label>
                        <Select
                          value={String(orcamentoData.num_parcelas)}
                          onValueChange={(value) => setOrcamentoData({
                            ...orcamentoData, 
                            num_parcelas: parseInt(value)
                          })}
                        >
                          <SelectTrigger className="bg-zinc-800 border-zinc-700">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-zinc-800 border-zinc-700">
                            {Array.from({ length: 12 }, (_, i) => i + 1).map(n => (
                              <SelectItem key={n} value={String(n)}>{n}x</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  )}
                </div>

                <div className="md:col-span-2">
                  <Label>Observações</Label>
                  <Textarea
                    value={orcamentoData.observacoes}
                    onChange={(e) => setOrcamentoData({ ...orcamentoData, observacoes: e.target.value })}
                    placeholder="Observações adicionais sobre o orçamento..."
                    className="bg-zinc-800 border-zinc-700"
                    rows={3}
                  />
                </div>
              </div>
            </div>

            {/* Seção de Materiais */}
            <div className="space-y-4">
              <OrcamentoMateriais 
                orcamentoId={null}
                onTotalChange={(total) => setTotalMateriais(total)}
              />
            </div>

            {/* Resumo do Valor */}
            {(resultadoServico || resultadoProduto) && (
              <div className="p-4 bg-gradient-to-r from-purple-600/20 to-blue-600/20 rounded-lg border border-purple-500/30 space-y-2">
                {totalMateriais > 0 && (
                  <>
                    <div className="flex justify-between text-sm">
                      <span className="text-zinc-400">Serviço:</span>
                      <span className="text-white">
                        R$ {resultadoServico 
                          ? parseFloat(resultadoServico.precoSugerido).toLocaleString('pt-BR', { minimumFractionDigits: 2 })
                          : parseFloat(resultadoProduto.precoVenda).toLocaleString('pt-BR', { minimumFractionDigits: 2 })
                        }
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-zinc-400">Materiais:</span>
                      <span className="text-white">
                        R$ {totalMateriais.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                    <div className="pt-2 border-t border-purple-500/30">
                      <p className="text-sm text-zinc-400 mb-1">Valor Total da Proposta</p>
                      <p className="text-3xl font-bold text-green-400">
                        R$ {(
                          (resultadoServico 
                            ? parseFloat(resultadoServico.precoSugerido)
                            : parseFloat(resultadoProduto.precoVenda)
                          ) + totalMateriais
                        ).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                  </>
                )}
                {totalMateriais === 0 && (
                  <>
                    <p className="text-sm text-zinc-400 mb-2">Valor da Proposta</p>
                    <p className="text-3xl font-bold text-green-400">
                      R$ {resultadoServico 
                        ? parseFloat(resultadoServico.precoSugerido).toLocaleString('pt-BR', { minimumFractionDigits: 2 })
                        : parseFloat(resultadoProduto.precoVenda).toLocaleString('pt-BR', { minimumFractionDigits: 2 })
                      }
                    </p>
                  </>
                )}
              </div>
            )}

            {/* Botões */}
            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowOrcamentoModal(false)}
                className="border-zinc-700"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={loadingOrcamento}
                className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
              >
                {loadingOrcamento ? 'Criando...' : 'Criar Orçamento'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal de Cadastro Rápido de Cliente */}
      <Dialog open={showNovoClienteModal} onOpenChange={setShowNovoClienteModal}>
        <DialogContent className="bg-zinc-900 border-zinc-800 text-white max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="text-green-400" />
              Cadastro Rápido de Cliente
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleCriarNovoCliente} className="space-y-4">
            {/* Toggle Tipo */}
            <div className="flex gap-2">
              <Button
                type="button"
                onClick={() => setTipoNovoCliente('PF')}
                className={tipoNovoCliente === 'PF' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-zinc-700 hover:bg-zinc-600'}
              >
                Pessoa Física
              </Button>
              <Button
                type="button"
                onClick={() => setTipoNovoCliente('PJ')}
                className={tipoNovoCliente === 'PJ' ? 'bg-green-600 hover:bg-green-700' : 'bg-zinc-700 hover:bg-zinc-600'}
              >
                Pessoa Jurídica
              </Button>
            </div>

            {tipoNovoCliente === 'PF' ? (
              /* Pessoa Física */
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <Label>Nome Completo *</Label>
                  <Input
                    required
                    value={novoClienteForm.nome}
                    onChange={(e) => setNovoClienteForm({...novoClienteForm, nome: e.target.value})}
                    placeholder="Nome completo"
                    className="bg-zinc-800 border-zinc-700"
                  />
                </div>
                <div>
                  <Label>CPF *</Label>
                  <Input
                    required
                    value={novoClienteForm.cpf}
                    onChange={(e) => setNovoClienteForm({...novoClienteForm, cpf: maskCPF(e.target.value)})}
                    placeholder="000.000.000-00"
                    maxLength={14}
                    className="bg-zinc-800 border-zinc-700"
                  />
                </div>
                <div>
                  <Label>WhatsApp *</Label>
                  <Input
                    required
                    value={novoClienteForm.whatsapp}
                    onChange={(e) => setNovoClienteForm({...novoClienteForm, whatsapp: maskPhone(e.target.value)})}
                    placeholder="(00) 00000-0000"
                    className="bg-zinc-800 border-zinc-700"
                  />
                </div>
              </div>
            ) : (
              /* Pessoa Jurídica */
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Nome Fantasia *</Label>
                  <Input
                    required
                    value={novoClienteForm.nome_fantasia}
                    onChange={(e) => setNovoClienteForm({...novoClienteForm, nome_fantasia: e.target.value})}
                    placeholder="Nome Fantasia"
                    className="bg-zinc-800 border-zinc-700"
                  />
                </div>
                <div>
                  <Label>Razão Social *</Label>
                  <Input
                    required
                    value={novoClienteForm.razao_social}
                    onChange={(e) => setNovoClienteForm({...novoClienteForm, razao_social: e.target.value})}
                    placeholder="Razão Social"
                    className="bg-zinc-800 border-zinc-700"
                  />
                </div>
                <div>
                  <Label>CNPJ *</Label>
                  <Input
                    required
                    value={novoClienteForm.cnpj}
                    onChange={(e) => setNovoClienteForm({...novoClienteForm, cnpj: maskCNPJ(e.target.value)})}
                    placeholder="00.000.000/0000-00"
                    maxLength={18}
                    className="bg-zinc-800 border-zinc-700"
                  />
                </div>
                <div>
                  <Label>WhatsApp *</Label>
                  <Input
                    required
                    value={novoClienteForm.whatsapp}
                    onChange={(e) => setNovoClienteForm({...novoClienteForm, whatsapp: maskPhone(e.target.value)})}
                    placeholder="(00) 00000-0000"
                    className="bg-zinc-800 border-zinc-700"
                  />
                </div>
              </div>
            )}

            {/* Campos comuns */}
            <div>
              <Label>E-mail</Label>
              <Input
                type="email"
                value={novoClienteForm.email}
                onChange={(e) => setNovoClienteForm({...novoClienteForm, email: e.target.value})}
                placeholder="cliente@email.com"
                className="bg-zinc-800 border-zinc-700"
              />
            </div>

            {/* Endereço simplificado */}
            <div className="border-t border-zinc-700 pt-4">
              <h4 className="text-sm font-medium text-zinc-400 mb-3">Endereço (opcional)</h4>
              <div className="grid grid-cols-4 gap-3">
                <div className="col-span-3">
                  <Label>Logradouro</Label>
                  <Input
                    value={novoClienteForm.logradouro}
                    onChange={(e) => setNovoClienteForm({...novoClienteForm, logradouro: e.target.value})}
                    placeholder="Rua, Av..."
                    className="bg-zinc-800 border-zinc-700"
                  />
                </div>
                <div>
                  <Label>Nº</Label>
                  <Input
                    value={novoClienteForm.numero}
                    onChange={(e) => setNovoClienteForm({...novoClienteForm, numero: e.target.value})}
                    placeholder="123"
                    className="bg-zinc-800 border-zinc-700"
                  />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3 mt-3">
                <div>
                  <Label>Bairro</Label>
                  <Input
                    value={novoClienteForm.bairro}
                    onChange={(e) => setNovoClienteForm({...novoClienteForm, bairro: e.target.value})}
                    placeholder="Bairro"
                    className="bg-zinc-800 border-zinc-700"
                  />
                </div>
                <div>
                  <Label>Cidade</Label>
                  <Input
                    value={novoClienteForm.cidade}
                    onChange={(e) => setNovoClienteForm({...novoClienteForm, cidade: e.target.value})}
                    placeholder="Cidade"
                    className="bg-zinc-800 border-zinc-700"
                  />
                </div>
                <div>
                  <Label>UF</Label>
                  <Input
                    value={novoClienteForm.estado}
                    onChange={(e) => setNovoClienteForm({...novoClienteForm, estado: e.target.value.toUpperCase()})}
                    placeholder="SP"
                    maxLength={2}
                    className="bg-zinc-800 border-zinc-700"
                  />
                </div>
              </div>
            </div>

            {/* Botões */}
            <div className="flex justify-end gap-3 pt-4 border-t border-zinc-700">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowNovoClienteModal(false)}
                className="border-zinc-700"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
              >
                Cadastrar Cliente
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal de Custos Internos */}
      <CustosInternosModal
        open={showCustosInternosModal}
        onClose={() => setShowCustosInternosModal(false)}
        companyId={company?.id}
        markupMultiplier={currentMarkup}
        initialHiddenCosts={custosInternos.hiddenCosts}
        initialWorkUseMaterials={custosInternos.workUseMaterials}
        onCostChange={(data) => setCustosInternos(data)}
      />
    </div>
  );
};

export default Precificacao;