import React, { useState } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { SubscriptionCard } from '@/components/SubscriptionCard';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calculator, DollarSign } from 'lucide-react';

const Precificacao = ({ user, onLogout }) => {
  const [formData, setFormData] = useState({
    custosVariaveis: '',
    despesasFixasRateadas: '',
    margemLucro: '',
    impostos: '',
  });

  const [resultado, setResultado] = useState(null);

  const calcular = (e) => {
    e.preventDefault();

    const custos = parseFloat(formData.custosVariaveis) || 0;
    const despesas = parseFloat(formData.despesasFixasRateadas) || 0;
    const margem = parseFloat(formData.margemLucro) || 0;
    const impostos = parseFloat(formData.impostos) || 0;

    const custoTotal = custos + despesas;
    const margemDecimal = margem / 100;
    const impostosDecimal = impostos / 100;

    // Fórmula: Preço = (Custo Total / (1 - Margem - Impostos))
    const precoVenda = custoTotal / (1 - margemDecimal - impostosDecimal);
    const lucroUnitario = precoVenda - custoTotal - (precoVenda * impostosDecimal);

    setResultado({
      precoVenda: precoVenda.toFixed(2),
      custoTotal: custoTotal.toFixed(2),
      impostoTotal: (precoVenda * impostosDecimal).toFixed(2),
      lucroUnitario: lucroUnitario.toFixed(2),
      margemEfetiva: ((lucroUnitario / precoVenda) * 100).toFixed(2),
    });
  };

  return (
    <div className="flex min-h-screen" data-testid="precificacao-page">
      <Sidebar user={user} onLogout={onLogout} />

      <div className="flex-1 p-8">
        <SubscriptionCard user={user} />

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2" data-testid="precificacao-title">Precificação</h1>
          <p className="text-gray-400">Calculadora de preço de venda</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Formulário */}
          <Card className="glass border-white/10" data-testid="pricing-form-card">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <Calculator className="mr-2" />
                Dados do Produto/Serviço
              </CardTitle>
              <CardDescription className="text-gray-400">
                Insira os custos e margem desejada
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={calcular} className="space-y-4" data-testid="pricing-form">
                <div>
                  <Label className="text-gray-300">Custos Variáveis (R$)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    data-testid="custos-variaveis-input"
                    value={formData.custosVariaveis}
                    onChange={(e) => setFormData({ ...formData, custosVariaveis: e.target.value })}
                    placeholder="Ex: matéria-prima, embalagem"
                    required
                    className="bg-white/5 border-white/10 text-white"
                  />
                  <p className="text-xs text-gray-400 mt-1">Custos que variam com a produção</p>
                </div>

                <div>
                  <Label className="text-gray-300">Despesas Fixas Rateadas (R$)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    data-testid="despesas-fixas-input"
                    value={formData.despesasFixasRateadas}
                    onChange={(e) => setFormData({ ...formData, despesasFixasRateadas: e.target.value })}
                    placeholder="Ex: aluguel, salários"
                    required
                    className="bg-white/5 border-white/10 text-white"
                  />
                  <p className="text-xs text-gray-400 mt-1">Despesas fixas divididas pelo volume de vendas</p>
                </div>

                <div>
                  <Label className="text-gray-300">Margem de Lucro Desejada (%)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    data-testid="margem-lucro-input"
                    value={formData.margemLucro}
                    onChange={(e) => setFormData({ ...formData, margemLucro: e.target.value })}
                    placeholder="Ex: 30"
                    required
                    className="bg-white/5 border-white/10 text-white"
                  />
                  <p className="text-xs text-gray-400 mt-1">Percentual de lucro sobre o preço de venda</p>
                </div>

                <div>
                  <Label className="text-gray-300">Impostos (%)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    data-testid="impostos-input"
                    value={formData.impostos}
                    onChange={(e) => setFormData({ ...formData, impostos: e.target.value })}
                    placeholder="Ex: 12"
                    required
                    className="bg-white/5 border-white/10 text-white"
                  />
                  <p className="text-xs text-gray-400 mt-1">Percentual de impostos sobre a venda</p>
                </div>

                <Button
                  type="submit"
                  data-testid="calculate-button"
                  className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                >
                  Calcular Preço de Venda
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Resultado */}
          {resultado && (
            <Card className="glass border-white/10" data-testid="pricing-result-card">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <DollarSign className="mr-2" />
                  Resultado da Precificação
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Preço de Venda */}
                <div className="p-6 bg-gradient-to-r from-purple-600/20 to-blue-600/20 rounded-lg border border-purple-500/30">
                  <p className="text-sm text-gray-300 mb-2">Preço de Venda Sugerido</p>
                  <p className="text-4xl font-bold text-white" data-testid="suggested-price">
                    R$ {parseFloat(resultado.precoVenda).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </div>

                {/* Detalhamento */}
                <div className="space-y-3">
                  <div className="flex justify-between p-3 bg-white/5 rounded-lg">
                    <span className="text-gray-400">Custo Total</span>
                    <span className="text-white font-semibold" data-testid="total-cost">
                      R$ {parseFloat(resultado.custoTotal).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                  </div>

                  <div className="flex justify-between p-3 bg-white/5 rounded-lg">
                    <span className="text-gray-400">Impostos</span>
                    <span className="text-orange-400 font-semibold" data-testid="total-taxes">
                      R$ {parseFloat(resultado.impostoTotal).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                  </div>

                  <div className="flex justify-between p-3 bg-white/5 rounded-lg">
                    <span className="text-gray-400">Lucro Unitário</span>
                    <span className="text-green-400 font-semibold" data-testid="unit-profit">
                      R$ {parseFloat(resultado.lucroUnitario).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                  </div>

                  <div className="flex justify-between p-3 bg-white/5 rounded-lg">
                    <span className="text-gray-400">Margem Efetiva</span>
                    <span className="text-purple-400 font-semibold" data-testid="effective-margin">
                      {resultado.margemEfetiva}%
                    </span>
                  </div>
                </div>

                {/* Observação */}
                <div className="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                  <p className="text-sm text-yellow-200">
                    ⚠️ Este é um preço sugerido. Considere também o mercado, a concorrência e o valor percebido pelo cliente.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Dicas */}
        <Card className="glass border-white/10 mt-6" data-testid="pricing-tips-card">
          <CardHeader>
            <CardTitle className="text-white">Dicas de Precificação</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3 text-gray-300">
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
                <span>Lembre-se: preço baixo demais prejudica a sustentabilidade do negócio</span>
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Precificacao;