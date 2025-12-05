import React, { useState, useEffect } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { SubscriptionCard } from '@/components/SubscriptionCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { axiosInstance } from '../App';
import { toast } from 'sonner';
import { Plus, Edit, Trash2, Filter } from 'lucide-react';
import FinancialGlossary from '@/components/FinancialGlossary';

const Lancamentos = ({ user, onLogout }) => {
  const [transactions, setTransactions] = useState([]);
  const [filteredTransactions, setFilteredTransactions] = useState([]);
  const [categories, setCategories] = useState({ receita: [], custo: [], despesa: [] });
  const [availableCategories, setAvailableCategories] = useState([]);
  const [showDialog, setShowDialog] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [loading, setLoading] = useState(false);
  const [showGlossary, setShowGlossary] = useState(false);

  const [formData, setFormData] = useState({
    type: 'receita',
    description: '',
    amount: '',
    category: '',
    date: new Date().toISOString().slice(0, 10),
    status: 'realizado',
    notes: '',
  });

  const company = JSON.parse(localStorage.getItem('company') || '{}');

  useEffect(() => {
    fetchCategories();
    fetchTransactions();
  }, [selectedMonth]);

  useEffect(() => {
    applyFilters();
  }, [transactions, filterType, filterStatus]);

  const fetchCategories = async () => {
    try {
      const url = company.id ? `/categories?company_id=${company.id}` : '/categories';
      const response = await axiosInstance.get(url);
      setCategories(response.data);
      // Inicializar categorias disponíveis baseado no tipo inicial
      updateAvailableCategories('receita', response.data);
    } catch (error) {
      toast.error('Erro ao carregar categorias');
    }
  };

  // Atualizar categorias disponíveis quando o tipo mudar
  const updateAvailableCategories = (type, categoriesData = categories) => {
    if (type === 'receita') {
      setAvailableCategories(categoriesData.receita || []);
    } else if (type === 'custo') {
      setAvailableCategories(categoriesData.custo || []);
    } else if (type === 'despesa') {
      setAvailableCategories(categoriesData.despesa || []);
    } else {
      setAvailableCategories([]);
    }
  };

  // Handler para mudança de tipo - limpa categoria e atualiza opções
  const handleTypeChange = (newType) => {
    setFormData({
      ...formData,
      type: newType,
      category: '' // Limpar categoria ao mudar tipo
    });
    updateAvailableCategories(newType);
  };

  const fetchTransactions = async () => {
    if (!company.id) return;

    try {
      const response = await axiosInstance.get(`/transactions/${company.id}?month=${selectedMonth}`);
      setTransactions(response.data);
    } catch (error) {
      toast.error('Erro ao carregar lançamentos');
    }
  };

  const applyFilters = () => {
    let filtered = [...transactions];

    if (filterType !== 'all') {
      filtered = filtered.filter((t) => t.type === filterType);
    }

    if (filterStatus !== 'all') {
      filtered = filtered.filter((t) => t.status === filterStatus);
    }

    setFilteredTransactions(filtered);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const data = {
        company_id: company.id,
        user_id: user.user_id,
        ...formData,
        amount: parseFloat(formData.amount),
      };

      if (editingTransaction) {
        await axiosInstance.put(`/transactions/${editingTransaction.id}`, data);
        toast.success('Lançamento atualizado!');
      } else {
        await axiosInstance.post('/transactions', data);
        toast.success('Lançamento criado!');
      }

      resetForm();
      fetchTransactions();
    } catch (error) {
      toast.error('Erro ao salvar lançamento');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Deseja realmente excluir este lançamento?')) return;

    try {
      await axiosInstance.delete(`/transactions/${id}`);
      toast.success('Lançamento excluído!');
      fetchTransactions();
    } catch (error) {
      toast.error('Erro ao excluir lançamento');
    }
  };

  const handleEdit = (transaction) => {
    setEditingTransaction(transaction);
    // Atualizar categorias disponíveis baseado no tipo da transação
    updateAvailableCategories(transaction.type);
    setFormData({
      type: transaction.type,
      description: transaction.description,
      amount: transaction.amount.toString(),
      category: transaction.category,
      date: transaction.date,
      status: transaction.status,
      notes: transaction.notes || '',
    });
    setShowDialog(true);
  };

  const resetForm = () => {
    setFormData({
      type: 'receita',
      description: '',
      amount: '',
      category: '',
      date: new Date().toISOString().slice(0, 10),
      status: 'realizado',
      notes: '',
    });
    // Resetar categorias para receita (tipo padrão)
    updateAvailableCategories('receita');
    setEditingTransaction(null);
    setShowDialog(false);
  };

  const getCategoryOptions = () => {
    // Retorna categorias baseado no tipo selecionado
    return availableCategories;
  };

  const getTypeLabel = (type) => {
    const labels = { receita: 'Receita', custo: 'Custo', despesa: 'Despesa' };
    return labels[type] || type;
  };

  const getTypeBadgeColor = (type) => {
    const colors = {
      receita: 'bg-green-500/20 text-green-300 border-green-500/50',
      custo: 'bg-orange-500/20 text-orange-300 border-orange-500/50',
      despesa: 'bg-red-500/20 text-red-300 border-red-500/50',
    };
    return colors[type] || 'bg-gray-500/20 text-gray-300 border-gray-500/50';
  };

  const getStatusBadgeColor = (status) => {
    return status === 'realizado'
      ? 'bg-blue-500/20 text-blue-300 border-blue-500/50'
      : 'bg-yellow-500/20 text-yellow-300 border-yellow-500/50';
  };

  return (
    <div className="flex min-h-screen" data-testid="lancamentos-page">
      <Sidebar user={user} onLogout={onLogout} onOpenGlossary={() => setShowGlossary(true)} />

      <div className="flex-1 p-8">
        <SubscriptionCard user={user} />

        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2" data-testid="lancamentos-title">Lançamentos</h1>
            <p className="text-gray-400">Gerencie receitas, custos e despesas</p>
          </div>
          <Button
            onClick={() => setShowDialog(true)}
            data-testid="add-transaction-button"
            className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
          >
            <Plus className="mr-2" size={18} />
            Novo Lançamento
          </Button>
        </div>

        {/* Filtros */}
        <Card className="glass border-white/10 mb-6" data-testid="filters-card">
          <CardContent className="p-4">
            <div className="flex gap-4 items-center">
              <Filter size={20} className="text-gray-400" />
              <div className="flex-1 grid grid-cols-3 gap-4">
                <div>
                  <Label className="text-gray-400 text-sm">Mês</Label>
                  <Input
                    type="month"
                    data-testid="filter-month-input"
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(e.target.value)}
                    className="bg-white/5 border-white/10 text-white"
                  />
                </div>
                <div>
                  <Label className="text-gray-400 text-sm">Tipo</Label>
                  <Select value={filterType} onValueChange={setFilterType}>
                    <SelectTrigger className="bg-white/5 border-white/10 text-white" data-testid="filter-type-select">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      <SelectItem value="receita">Receitas</SelectItem>
                      <SelectItem value="custo">Custos</SelectItem>
                      <SelectItem value="despesa">Despesas</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-gray-400 text-sm">Status</Label>
                  <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger className="bg-white/5 border-white/10 text-white" data-testid="filter-status-select">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      <SelectItem value="previsto">Previsto</SelectItem>
                      <SelectItem value="realizado">Realizado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabela */}
        <Card className="glass border-white/10" data-testid="transactions-table-card">
          <CardHeader>
            <CardTitle className="text-white">Lançamentos ({filteredTransactions.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow className="border-white/10 hover:bg-white/5">
                  <TableHead className="text-gray-300">Data</TableHead>
                  <TableHead className="text-gray-300">Tipo</TableHead>
                  <TableHead className="text-gray-300">Descrição</TableHead>
                  <TableHead className="text-gray-300">Categoria</TableHead>
                  <TableHead className="text-gray-300 text-right">Valor</TableHead>
                  <TableHead className="text-gray-300">Status</TableHead>
                  <TableHead className="text-gray-300 text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTransactions.map((transaction) => (
                  <TableRow key={transaction.id} className="border-white/10 hover:bg-white/5" data-testid={`transaction-row-${transaction.id}`}>
                    <TableCell className="text-gray-300">
                      {new Date(transaction.date).toLocaleDateString('pt-BR')}
                    </TableCell>
                    <TableCell>
                      <Badge className={getTypeBadgeColor(transaction.type)}>
                        {getTypeLabel(transaction.type)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-white font-medium">{transaction.description}</TableCell>
                    <TableCell className="text-gray-400 text-sm">{transaction.category}</TableCell>
                    <TableCell className="text-white text-right font-semibold">
                      R$ {transaction.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusBadgeColor(transaction.status)}>
                        {transaction.status === 'realizado' ? 'Realizado' : 'Previsto'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEdit(transaction)}
                          data-testid={`edit-transaction-${transaction.id}`}
                          className="border-blue-500/50 text-blue-400 hover:bg-blue-500/10"
                        >
                          <Edit size={14} />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDelete(transaction.id)}
                          data-testid={`delete-transaction-${transaction.id}`}
                          className="border-red-500/50 text-red-400 hover:bg-red-500/10"
                        >
                          <Trash2 size={14} />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredTransactions.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-gray-400 py-8" data-testid="no-transactions-message">
                      Nenhum lançamento encontrado
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Dialog */}
        <Dialog open={showDialog} onOpenChange={(open) => !open && resetForm()}>
          <DialogContent className="glass border-white/10 max-w-2xl" data-testid="transaction-dialog">
            <DialogHeader>
              <DialogTitle className="text-white">
                {editingTransaction ? 'Editar Lançamento' : 'Novo Lançamento'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4" data-testid="transaction-form">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-gray-300">Tipo *</Label>
                  <Select
                    value={formData.type}
                    onValueChange={handleTypeChange}
                  >
                    <SelectTrigger className="bg-white/5 border-white/10 text-white" data-testid="transaction-type-select">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="receita">Receita</SelectItem>
                      <SelectItem value="custo">Custo</SelectItem>
                      <SelectItem value="despesa">Despesa</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-gray-300">
                    Categoria * 
                    {availableCategories.length === 0 && <span className="text-xs text-gray-500 ml-2">(selecione o tipo primeiro)</span>}
                  </Label>
                  <Select 
                    value={formData.category} 
                    onValueChange={(value) => setFormData({ ...formData, category: value })}
                    disabled={availableCategories.length === 0}
                  >
                    <SelectTrigger className="bg-white/5 border-white/10 text-white" data-testid="transaction-category-select">
                      <SelectValue placeholder={availableCategories.length === 0 ? "Selecione o tipo primeiro" : "Selecione a categoria"} />
                    </SelectTrigger>
                    <SelectContent>
                      {getCategoryOptions().map((cat) => (
                        <SelectItem key={cat} value={cat}>
                          {cat}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label className="text-gray-300">Descrição</Label>
                <Input
                  data-testid="transaction-description-input"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  required
                  className="bg-white/5 border-white/10 text-white"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label className="text-gray-300">Valor</Label>
                  <Input
                    type="number"
                    step="0.01"
                    data-testid="transaction-amount-input"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    required
                    className="bg-white/5 border-white/10 text-white"
                  />
                </div>
                <div>
                  <Label className="text-gray-300">Data</Label>
                  <Input
                    type="date"
                    data-testid="transaction-date-input"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    required
                    className="bg-white/5 border-white/10 text-white"
                  />
                </div>
                <div>
                  <Label className="text-gray-300">Status</Label>
                  <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                    <SelectTrigger className="bg-white/5 border-white/10 text-white" data-testid="transaction-status-select">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="realizado">Realizado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label className="text-gray-300">Observações (Opcional)</Label>
                <Textarea
                  data-testid="transaction-notes-input"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="bg-white/5 border-white/10 text-white"
                  rows={3}
                />
              </div>

              <div className="flex gap-3 justify-end">
                <Button type="button" variant="outline" onClick={resetForm} data-testid="transaction-cancel-button">
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  data-testid="transaction-submit-button"
                  disabled={loading}
                  className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                >
                  {loading ? 'Salvando...' : 'Salvar'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
      
      {/* Glossário Financeiro */}
      <FinancialGlossary isOpen={showGlossary} onClose={() => setShowGlossary(false)} />
    </div>
  );
};

export default Lancamentos;