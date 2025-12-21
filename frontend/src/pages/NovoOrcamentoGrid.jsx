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
import { 
  FileText, Users, Calendar, CreditCard, Save, ArrowLeft, 
  Plus, UserPlus, Loader2, Calculator, Package, AlertTriangle
} from 'lucide-react';
import { axiosInstance } from '../App';
import { toast } from 'sonner';
import { useNavigate, useLocation } from 'react-router-dom';
import OrcamentoItemsGrid from '@/components/OrcamentoItemsGrid';
import OrcamentoMateriais from '@/components/OrcamentoMateriais';

const NovoOrcamentoGrid = ({ user, onLogout }) => {
  const navigate = useNavigate();
  const company = JSON.parse(localStorage.getItem('company') || '{}');

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
  });

  // Itens do orçamento (Grid)
  const [orcamentoItems, setOrcamentoItems] = useState([]);

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

  // Validar e salvar orçamento
  const handleSalvarOrcamento = async () => {
    // Validações
    if (!orcamentoData.cliente_nome) {
      toast.error('Selecione ou preencha os dados do cliente');
      setActiveTab('cliente');
      return;
    }

    if (orcamentoItems.length === 0) {
      toast.error('Adicione pelo menos um item ao orçamento');
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
        // Valores calculados
        custo_total: orcamentoItems.reduce((acc, item) => acc + (item.pu1_used * item.quantity), 0),
        preco_minimo: totalServicos,
        preco_sugerido: totalServicos,
        preco_praticado: totalServicos,
        // Condições
        validade_proposta: orcamentoData.validade_proposta,
        condicoes_pagamento: orcamentoData.condicoes_pagamento,
        prazo_execucao: orcamentoData.prazo_execucao,
        observacoes: orcamentoData.observacoes,
        // Itens com snapshot (novidade!)
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
          }
        }
      };

      const response = await axiosInstance.post('/orcamentos', data);
      toast.success(`Orçamento ${response.data.numero_orcamento} criado com sucesso!`);
      navigate('/orcamentos');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Erro ao criar orçamento');
    } finally {
      setLoading(false);
    }
  };

  // Máscaras
  const maskCPF = (value) => {
    return value.replace(/\D/g, '')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})/, '$1-$2')
      .replace(/(-\d{2})\d+?$/, '$1');
  };

  const maskCNPJ = (value) => {
    return value.replace(/\D/g, '')
      .replace(/(\d{2})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1/$2')
      .replace(/(\d{4})(\d)/, '$1-$2')
      .replace(/(-\d{2})\d+?$/, '$1');
  };

  const maskPhone = (value) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 10) {
      return numbers.replace(/(\d{2})(\d)/, '($1) $2').replace(/(\d{4})(\d)/, '$1-$2');
    }
    return numbers.replace(/(\d{2})(\d)/, '($1) $2').replace(/(\d{5})(\d)/, '$1-$2').replace(/(-\d{4})\d+?$/, '$1');
  };

  return (
    <div className="flex min-h-screen bg-zinc-950 text-white">
      <Sidebar user={user} onLogout={onLogout} activePage="orcamentos" />

      <div className="flex-1 p-8 ml-64">
        <div className="max-w-6xl mx-auto space-y-6">
          <SubscriptionCard user={user} />

          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                onClick={() => navigate('/orcamentos')}
                className="text-zinc-400 hover:text-white"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Voltar
              </Button>
              <div>
                <h1 className="text-3xl font-bold">Novo Orçamento</h1>
                <p className="text-zinc-400">Crie um orçamento com itens detalhados</p>
              </div>
            </div>

            {/* Resumo do valor */}
            <Card className="bg-zinc-900 border-zinc-800 px-6 py-3">
              <div className="text-right">
                <p className="text-xs text-zinc-400">Total do Orçamento</p>
                <p className="text-2xl font-bold text-green-400">
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalServicos)}
                </p>
              </div>
            </Card>
          </div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3 bg-zinc-900">
              <TabsTrigger value="cliente" className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                Cliente
              </TabsTrigger>
              <TabsTrigger value="itens" className="flex items-center gap-2">
                <Calculator className="w-4 h-4" />
                Itens
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
                      Próximo: Itens
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Tab: Itens */}
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
                  <div className="grid grid-cols-3 gap-4">
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
                      <Label>Condições de Pagamento *</Label>
                      <Input
                        value={orcamentoData.condicoes_pagamento}
                        onChange={(e) => setOrcamentoData({...orcamentoData, condicoes_pagamento: e.target.value})}
                        className="bg-zinc-800 border-zinc-700"
                        placeholder="Ex: 50% entrada + 50% na entrega"
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
                        <div>
                          <p className="text-zinc-400">Itens: {orcamentoItems.length}</p>
                          <p className="text-zinc-400">Markup: {currentMarkup.toFixed(4)}x</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-zinc-400">Total do Orçamento</p>
                          <p className="text-3xl font-bold text-green-400">
                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalServicos)}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <div className="flex justify-between">
                    <Button variant="outline" onClick={() => setActiveTab('itens')} className="border-zinc-700">
                      Voltar: Itens
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
                      <Input
                        value={novoClienteForm.cpf}
                        onChange={(e) => setNovoClienteForm({...novoClienteForm, cpf: maskCPF(e.target.value)})}
                        className="bg-zinc-800 border-zinc-700"
                        placeholder="000.000.000-00"
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
                      <Input
                        value={novoClienteForm.cnpj}
                        onChange={(e) => setNovoClienteForm({...novoClienteForm, cnpj: maskCNPJ(e.target.value)})}
                        className="bg-zinc-800 border-zinc-700"
                        placeholder="00.000.000/0000-00"
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
        </div>
      </div>
    </div>
  );
};

export default NovoOrcamentoGrid;
