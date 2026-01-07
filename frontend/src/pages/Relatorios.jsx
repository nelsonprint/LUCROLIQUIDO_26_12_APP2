import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sidebar } from '@/components/Sidebar';
import { SubscriptionCard } from '@/components/SubscriptionCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { axiosInstance } from '../App';
import { toast } from 'sonner';
import {
  Search, Star, Clock, FileText, DollarSign, Users, ShoppingCart,
  TrendingUp, PieChart, BarChart3, Calendar, Filter, ChevronRight,
  Wallet, CreditCard, Receipt, Target, AlertTriangle, Download
} from 'lucide-react';

const Relatorios = ({ user, onLogout }) => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [favorites, setFavorites] = useState([]);
  const [recents, setRecents] = useState([]);
  const [periodoFilter, setPeriodoFilter] = useState('mes');
  const [company, setCompany] = useState(JSON.parse(localStorage.getItem('company') || '{}'));

  // Categorias de relatórios
  const categories = [
    {
      id: 'financeiro-pagar',
      title: 'Contas a Pagar',
      icon: CreditCard,
      color: 'text-red-400',
      bgColor: 'bg-red-500/10',
      borderColor: 'border-red-500/30',
      reports: [
        { id: 'pagar-periodo', name: 'Contas por Período', description: 'Abertas, pagas e atrasadas' },
        { id: 'pagar-aging', name: 'Aging (Envelhecimento)', description: 'Faixas de vencimento' },
        { id: 'despesas-categoria', name: 'Despesas por Categoria', description: 'Top 10 + tendência' },
        { id: 'fornecedores-ranking', name: 'Ranking Fornecedores', description: 'Top fornecedores por valor' },
      ]
    },
    {
      id: 'financeiro-receber',
      title: 'Contas a Receber',
      icon: Wallet,
      color: 'text-green-400',
      bgColor: 'bg-green-500/10',
      borderColor: 'border-green-500/30',
      reports: [
        { id: 'receber-periodo', name: 'Contas por Período', description: 'Abertas, recebidas e atrasadas' },
        { id: 'receber-aging', name: 'Aging (Envelhecimento)', description: 'Faixas de vencimento' },
        { id: 'clientes-ranking', name: 'Ranking Clientes', description: 'Top clientes por receita' },
        { id: 'inadimplencia', name: 'Inadimplência', description: 'Análise de atrasos' },
      ]
    },
    {
      id: 'fluxo-caixa',
      title: 'Fluxo de Caixa',
      icon: TrendingUp,
      color: 'text-blue-400',
      bgColor: 'bg-blue-500/10',
      borderColor: 'border-blue-500/30',
      reports: [
        { id: 'fluxo-projetado', name: 'Fluxo Projetado', description: '30/60/90 dias' },
        { id: 'fluxo-realizado', name: 'Fluxo Realizado', description: 'Entradas e saídas' },
      ]
    },
    {
      id: 'contabil',
      title: 'Contábil',
      icon: FileText,
      color: 'text-purple-400',
      bgColor: 'bg-purple-500/10',
      borderColor: 'border-purple-500/30',
      reports: [
        { id: 'dre-gerencial', name: 'DRE Gerencial', description: 'Serviços + Materiais' },
        { id: 'dfc-completo', name: 'DFC Completo', description: 'Oper./Invest./Financ.' },
      ]
    },
    {
      id: 'comercial',
      title: 'Comercial',
      icon: ShoppingCart,
      color: 'text-orange-400',
      bgColor: 'bg-orange-500/10',
      borderColor: 'border-orange-500/30',
      reports: [
        { id: 'funil-orcamentos', name: 'Funil de Orçamentos', description: 'Conversão por etapa' },
        { id: 'orcamentos-periodo', name: 'Orçamentos por Período', description: 'Quantidade e valor' },
        { id: 'servicos-materiais', name: 'Serviços x Materiais', description: 'Composição' },
      ]
    },
    {
      id: 'clientes',
      title: 'Clientes',
      icon: Users,
      color: 'text-cyan-400',
      bgColor: 'bg-cyan-500/10',
      borderColor: 'border-cyan-500/30',
      reports: [
        { id: 'clientes-cadastro', name: 'Cadastro de Clientes', description: 'Lista completa' },
        { id: 'clientes-recorrencia', name: 'Recorrência', description: 'Frequência de compra' },
        { id: 'clientes-inadimplencia', name: 'Inadimplência', description: 'Por cliente' },
      ]
    },
    {
      id: 'gerencial',
      title: 'Gerencial',
      icon: Target,
      color: 'text-yellow-400',
      bgColor: 'bg-yellow-500/10',
      borderColor: 'border-yellow-500/30',
      reports: [
        { id: 'top-indicadores', name: 'Top 10 Indicadores', description: 'Painel executivo' },
        { id: 'alertas', name: 'Alertas Inteligentes', description: 'Riscos e oportunidades' },
        { id: 'comparativo', name: 'Comparativo', description: 'Mês atual vs anterior' },
        { id: 'pareto', name: 'Análise Pareto', description: '80/20' },
      ]
    },
  ];

  useEffect(() => {
    // Carregar favoritos e recentes do localStorage
    const savedFavorites = localStorage.getItem('report_favorites');
    const savedRecents = localStorage.getItem('report_recents');
    if (savedFavorites) setFavorites(JSON.parse(savedFavorites));
    if (savedRecents) setRecents(JSON.parse(savedRecents));
  }, []);

  const toggleFavorite = (reportId) => {
    const newFavorites = favorites.includes(reportId)
      ? favorites.filter(f => f !== reportId)
      : [...favorites, reportId];
    setFavorites(newFavorites);
    localStorage.setItem('report_favorites', JSON.stringify(newFavorites));
  };

  const addToRecents = (reportId) => {
    const newRecents = [reportId, ...recents.filter(r => r !== reportId)].slice(0, 5);
    setRecents(newRecents);
    localStorage.setItem('report_recents', JSON.stringify(newRecents));
  };

  const openReport = (reportId) => {
    addToRecents(reportId);
    navigate(`/relatorios/${reportId}?periodo=${periodoFilter}`);
  };

  const getReportById = (reportId) => {
    for (const cat of categories) {
      const report = cat.reports.find(r => r.id === reportId);
      if (report) return { ...report, category: cat };
    }
    return null;
  };

  // Filtrar relatórios pela busca
  const filteredCategories = categories.map(cat => ({
    ...cat,
    reports: cat.reports.filter(r =>
      r.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.description.toLowerCase().includes(searchTerm.toLowerCase())
    )
  })).filter(cat => cat.reports.length > 0);

  return (
    <div className="flex min-h-screen bg-zinc-950 text-white">
      <Sidebar user={user} onLogout={onLogout} activePage="relatorios" />

      <div className="flex-1 p-8 ml-64">
        <div className="max-w-7xl mx-auto space-y-6">
          <SubscriptionCard user={user} />

          {/* Header */}
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold">Central de Relatórios</h1>
              <p className="text-zinc-400 mt-1">Análise completa do seu negócio</p>
            </div>
          </div>

          {/* Filtros Globais */}
          <Card className="bg-zinc-900 border-zinc-800">
            <CardContent className="p-4">
              <div className="flex flex-wrap gap-4 items-center">
                {/* Busca */}
                <div className="relative flex-1 min-w-[250px]">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                  <Input
                    placeholder="Procure por relatório..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 bg-zinc-800 border-zinc-700"
                  />
                </div>

                {/* Período */}
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-zinc-500" />
                  <Select value={periodoFilter} onValueChange={setPeriodoFilter}>
                    <SelectTrigger className="w-[150px] bg-zinc-800 border-zinc-700">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="mes">Mês Atual</SelectItem>
                      <SelectItem value="trimestre">Trimestre</SelectItem>
                      <SelectItem value="ano">Ano</SelectItem>
                      <SelectItem value="personalizado">Personalizado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Empresa */}
                <Badge variant="outline" className="border-zinc-700 text-zinc-400">
                  {company?.name || 'Empresa'}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Favoritos */}
          {favorites.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <Star className="w-5 h-5 text-yellow-500" /> Favoritos
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                {favorites.map(favId => {
                  const report = getReportById(favId);
                  if (!report) return null;
                  return (
                    <Card
                      key={favId}
                      className="bg-zinc-900 border-zinc-800 hover:border-yellow-500/50 cursor-pointer transition-all"
                      onClick={() => openReport(favId)}
                    >
                      <CardContent className="p-4 flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${report.category.bgColor}`}>
                          <report.category.icon className={`w-4 h-4 ${report.category.color}`} />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-sm">{report.name}</p>
                          <p className="text-xs text-zinc-500">{report.category.title}</p>
                        </div>
                        <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          )}

          {/* Recentes */}
          {recents.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <Clock className="w-5 h-5 text-zinc-500" /> Acessados Recentemente
              </h2>
              <div className="flex gap-3 overflow-x-auto pb-2">
                {recents.map(recentId => {
                  const report = getReportById(recentId);
                  if (!report) return null;
                  return (
                    <Card
                      key={recentId}
                      className="bg-zinc-900 border-zinc-800 hover:border-zinc-600 cursor-pointer transition-all min-w-[200px]"
                      onClick={() => openReport(recentId)}
                    >
                      <CardContent className="p-3 flex items-center gap-2">
                        <report.category.icon className={`w-4 h-4 ${report.category.color}`} />
                        <span className="text-sm">{report.name}</span>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          )}

          {/* Categorias de Relatórios */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredCategories.map(category => (
              <Card key={category.id} className={`bg-zinc-900 border-zinc-800 border-l-4 ${category.borderColor}`}>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${category.bgColor}`}>
                      <category.icon className={`w-5 h-5 ${category.color}`} />
                    </div>
                    {category.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {category.reports.map(report => (
                    <div
                      key={report.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-zinc-800/50 hover:bg-zinc-800 cursor-pointer transition-all group"
                      onClick={() => openReport(report.id)}
                    >
                      <div className="flex-1">
                        <p className="font-medium text-sm">{report.name}</p>
                        <p className="text-xs text-zinc-500">{report.description}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          className="p-1 hover:bg-zinc-700 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleFavorite(report.id);
                          }}
                        >
                          <Star className={`w-4 h-4 ${favorites.includes(report.id) ? 'text-yellow-500 fill-yellow-500' : 'text-zinc-500'}`} />
                        </button>
                        <ChevronRight className="w-4 h-4 text-zinc-500 group-hover:text-white transition-colors" />
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Se não encontrou nenhum relatório */}
          {filteredCategories.length === 0 && (
            <div className="text-center py-12">
              <Search className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
              <p className="text-zinc-400">Nenhum relatório encontrado para "{searchTerm}"</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Relatorios;
