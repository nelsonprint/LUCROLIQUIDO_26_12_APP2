import React, { useState } from 'react';
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
import { Calculator, DollarSign, TrendingUp, Users, Truck, UtensilsCrossed, Wrench, AlertTriangle, FileText } from 'lucide-react';
import { axiosInstance } from '../App';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

const Precificacao = ({ user, onLogout }) => {
  const [tipoPrecificacao, setTipoPrecificacao] = useState('produto');
  const [tipoCobrancaServico, setTipoCobrancaServico] = useState('por-m2');

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

          {/* Tabs: Produto vs Serviço */}
          <Tabs value={tipoPrecificacao} onValueChange={setTipoPrecificacao} className="w-full">
            <TabsList className="grid w-full max-w-md grid-cols-2 bg-zinc-900">
              <TabsTrigger value="produto">Produto</TabsTrigger>
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

              {/* ========== MODO: POR M² ========== */}
              {tipoCobrancaServico === 'por-m2' && (
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

              {/* ========== RESULTADO: SERVIÇO POR M² ========== */}
              {resultadoServico && tipoCobrancaServico === 'por-m2' && (
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
                </div>
              )}

              {/* ========== OUTROS TIPOS: POR HORA / VALOR FECHADO ========== */}
              {tipoCobrancaServico !== 'por-m2' && (
                <Card className="bg-zinc-900 border-zinc-800">
                  <CardContent className="py-12 text-center text-zinc-400">
                    <p>Modo &quot;{tipoCobrancaServico === 'por-hora' ? 'Por Hora' : 'Valor Fechado'}&quot; em desenvolvimento.</p>
                    <p className="text-sm mt-2">Por enquanto, utilize o modo &quot;Por m²&quot; para precificação detalhada.</p>
                  </CardContent>
                </Card>
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
    </div>
  );
};

export default Precificacao;