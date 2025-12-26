import React, { useState, useEffect } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { SubscriptionCard } from '@/components/SubscriptionCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { CPFInput } from '@/components/ui/cpf-cnpj-input';
import { MoneyInput } from '@/components/ui/money-input';
import { maskPhone, isValidCPF, onlyDigits, formatBRL, parseBRL } from '@/lib/formatters';
import { axiosInstance } from '../App';
import { toast } from 'sonner';
import { Users, Plus, Edit, Trash2, Phone, MessageCircle, Mail, UserPlus, Loader2 } from 'lucide-react';

// Lista de estados brasileiros
const ESTADOS_BR = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 
  'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 
  'SP', 'SE', 'TO'
];

const Funcionarios = ({ user, onLogout }) => {
  const company = JSON.parse(localStorage.getItem('company') || '{}');
  
  const [funcionarios, setFuncionarios] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showCategoriaModal, setShowCategoriaModal] = useState(false);
  const [editingFuncionario, setEditingFuncionario] = useState(null);
  const [cpfValido, setCpfValido] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterCategoria, setFilterCategoria] = useState('all');
  const [novaCategoriaForm, setNovaCategoriaForm] = useState({ nome: '', descricao: '' });

  const [formData, setFormData] = useState({
    nome_completo: '',
    cpf: '',
    endereco: '',
    cidade: '',
    uf: '',
    telefone_celular: '',
    whatsapp: '',
    email: '',
    salario: 0,
    categoria_id: '',
    data_admissao: '',
    data_nascimento: '',
    status: 'Ativo',
    login_email: '',
    login_senha: ''
  });

  useEffect(() => {
    if (company?.id) {
      fetchFuncionarios();
      fetchCategorias();
    }
  }, [company?.id, filterStatus, filterCategoria]);

  const fetchFuncionarios = async () => {
    try {
      setLoading(true);
      let url = `/funcionarios/${company.id}`;
      const params = [];
      if (filterStatus !== 'all') params.push(`status=${filterStatus}`);
      if (filterCategoria !== 'all') params.push(`categoria_id=${filterCategoria}`);
      if (params.length > 0) url += `?${params.join('&')}`;
      
      const response = await axiosInstance.get(url);
      setFuncionarios(response.data);
    } catch (error) {
      toast.error('Erro ao carregar funcionários');
    } finally {
      setLoading(false);
    }
  };

  const fetchCategorias = async () => {
    try {
      const response = await axiosInstance.get(`/funcionarios/categorias/${company.id}`);
      setCategorias(response.data);
    } catch (error) {
      console.error('Erro ao carregar categorias:', error);
    }
  };

  const handleOpenModal = (funcionario = null) => {
    if (funcionario) {
      setEditingFuncionario(funcionario);
      setFormData({
        ...funcionario,
        salario: funcionario.salario || 0
      });
      setCpfValido(true);
    } else {
      setEditingFuncionario(null);
      setFormData({
        nome_completo: '',
        cpf: '',
        endereco: '',
        cidade: '',
        uf: '',
        telefone_celular: '',
        whatsapp: '',
        email: '',
        salario: 0,
        categoria_id: '',
        data_admissao: '',
        data_nascimento: '',
        status: 'Ativo'
      });
      setCpfValido(true);
    }
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validação de CPF
    if (!formData.cpf || onlyDigits(formData.cpf).length < 11) {
      toast.error('CPF é obrigatório');
      setCpfValido(false);
      return;
    }
    
    if (!isValidCPF(formData.cpf)) {
      toast.error('CPF inválido. Por favor, corrija antes de continuar.');
      setCpfValido(false);
      return;
    }

    if (!formData.nome_completo) {
      toast.error('Nome completo é obrigatório');
      return;
    }

    try {
      const data = {
        ...formData,
        empresa_id: company.id
      };

      if (editingFuncionario) {
        await axiosInstance.put(`/funcionarios/${editingFuncionario.id}`, data);
        toast.success('Funcionário atualizado com sucesso!');
      } else {
        await axiosInstance.post('/funcionarios', data);
        toast.success('Funcionário cadastrado com sucesso!');
      }

      setShowModal(false);
      fetchFuncionarios();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Erro ao salvar funcionário');
    }
  };

  const handleDelete = async (funcionarioId) => {
    if (!window.confirm('Deseja realmente excluir este funcionário?')) return;

    try {
      await axiosInstance.delete(`/funcionarios/${funcionarioId}`);
      toast.success('Funcionário excluído com sucesso!');
      fetchFuncionarios();
    } catch (error) {
      toast.error('Erro ao excluir funcionário');
    }
  };

  const handleCriarCategoria = async (e) => {
    e.preventDefault();
    
    if (!novaCategoriaForm.nome) {
      toast.error('Nome da categoria é obrigatório');
      return;
    }

    try {
      const response = await axiosInstance.post('/funcionarios/categorias', {
        empresa_id: company.id,
        nome: novaCategoriaForm.nome,
        descricao: novaCategoriaForm.descricao
      });
      
      toast.success('Categoria criada com sucesso!');
      setShowCategoriaModal(false);
      setNovaCategoriaForm({ nome: '', descricao: '' });
      fetchCategorias();
      
      // Selecionar a nova categoria automaticamente
      if (response.data.categoria?.id) {
        setFormData(prev => ({ ...prev, categoria_id: response.data.categoria.id }));
      }
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Erro ao criar categoria');
    }
  };

  const openWhatsApp = (phone) => {
    const numbers = onlyDigits(phone);
    window.open(`https://wa.me/55${numbers}`, '_blank');
  };

  const getStatusBadge = (status) => {
    const variants = {
      'Ativo': 'success',
      'Inativo': 'destructive',
      'Férias': 'warning',
      'Afastado': 'secondary'
    };
    return <Badge variant={variants[status] || 'default'}>{status}</Badge>;
  };

  if (!company?.id) {
    return (
      <div className="flex min-h-screen bg-zinc-950 text-white">
        <Sidebar user={user} onLogout={onLogout} activePage="funcionarios" />
        <div className="flex-1 p-8 ml-64">
          <Card className="bg-zinc-900 border-zinc-800">
            <CardContent className="p-8 text-center">
              <p className="text-zinc-400">Carregando empresa...</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-zinc-950 text-white">
      <Sidebar user={user} onLogout={onLogout} activePage="funcionarios" />

      <div className="flex-1 p-8 ml-64">
        <div className="max-w-7xl mx-auto space-y-6">
          <SubscriptionCard user={user} />

          {/* Header */}
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold">Funcionários</h1>
              <p className="text-zinc-400 mt-1">Gerencie sua equipe</p>
            </div>
            <Button
              onClick={() => handleOpenModal()}
              className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Novo Funcionário
            </Button>
          </div>

          {/* Filtros */}
          <Card className="bg-zinc-900 border-zinc-800">
            <CardContent className="pt-6">
              <div className="flex flex-wrap gap-4">
                <div className="flex-1 min-w-[200px]">
                  <Label>Status</Label>
                  <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger className="bg-zinc-800 border-zinc-700">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      <SelectItem value="Ativo">Ativo</SelectItem>
                      <SelectItem value="Inativo">Inativo</SelectItem>
                      <SelectItem value="Férias">Férias</SelectItem>
                      <SelectItem value="Afastado">Afastado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex-1 min-w-[200px]">
                  <Label>Categoria</Label>
                  <Select value={filterCategoria} onValueChange={setFilterCategoria}>
                    <SelectTrigger className="bg-zinc-800 border-zinc-700">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas</SelectItem>
                      {categorias.map(cat => (
                        <SelectItem key={cat.id} value={cat.id}>{cat.nome}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tabela */}
          <Card className="bg-zinc-900 border-zinc-800">
            <CardContent className="pt-6">
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="border-zinc-800">
                      <TableHead>Nome</TableHead>
                      <TableHead>Categoria</TableHead>
                      <TableHead>Contato</TableHead>
                      <TableHead>Salário</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {funcionarios.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center text-zinc-500 py-8">
                          Nenhum funcionário encontrado
                        </TableCell>
                      </TableRow>
                    ) : (
                      funcionarios.map((func) => (
                        <TableRow key={func.id} className="border-zinc-800">
                          <TableCell>
                            <div>
                              <p className="font-medium">{func.nome_completo}</p>
                              <p className="text-xs text-zinc-500">{func.cpf}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{func.categoria_nome || '-'}</Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              {func.whatsapp && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => openWhatsApp(func.whatsapp)}
                                  className="h-8 w-8 p-0 text-green-500 hover:text-green-400"
                                  title="WhatsApp"
                                >
                                  <MessageCircle className="w-4 h-4" />
                                </Button>
                              )}
                              {func.email && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => window.open(`mailto:${func.email}`)}
                                  className="h-8 w-8 p-0 text-blue-500 hover:text-blue-400"
                                  title="E-mail"
                                >
                                  <Mail className="w-4 h-4" />
                                </Button>
                              )}
                              {func.telefone_celular && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => window.open(`tel:${onlyDigits(func.telefone_celular)}`)}
                                  className="h-8 w-8 p-0 text-zinc-400 hover:text-white"
                                  title="Ligar"
                                >
                                  <Phone className="w-4 h-4" />
                                </Button>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="font-medium text-green-500">
                            {formatBRL(func.salario || 0)}
                          </TableCell>
                          <TableCell>{getStatusBadge(func.status)}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleOpenModal(func)}
                                className="border-purple-600 text-purple-600 hover:bg-purple-600 hover:text-white"
                                title="Editar"
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleDelete(func.id)}
                                className="border-red-600 text-red-600 hover:bg-red-600 hover:text-white"
                                title="Excluir"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Modal de Cadastro/Edição */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="bg-zinc-900 border-zinc-800 max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl">
              {editingFuncionario ? 'Editar Funcionário' : 'Novo Funcionário'}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Dados Pessoais */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-zinc-400 border-b border-zinc-800 pb-2">
                Dados Pessoais
              </h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <Label>Nome Completo *</Label>
                  <Input
                    value={formData.nome_completo}
                    onChange={(e) => setFormData({ ...formData, nome_completo: e.target.value })}
                    className="bg-zinc-800 border-zinc-700"
                    placeholder="Nome completo do funcionário"
                    required
                  />
                </div>

                <div>
                  <Label>CPF *</Label>
                  <CPFInput
                    value={formData.cpf}
                    onChange={(value, isValid) => {
                      setFormData({ ...formData, cpf: value });
                      setCpfValido(isValid);
                    }}
                    required
                  />
                </div>

                <div>
                  <Label>Data de Nascimento</Label>
                  <Input
                    type="date"
                    value={formData.data_nascimento}
                    onChange={(e) => setFormData({ ...formData, data_nascimento: e.target.value })}
                    className="bg-zinc-800 border-zinc-700"
                  />
                </div>
              </div>
            </div>

            {/* Endereço */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-zinc-400 border-b border-zinc-800 pb-2">
                Endereço
              </h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <Label>Endereço Completo</Label>
                  <Input
                    value={formData.endereco}
                    onChange={(e) => setFormData({ ...formData, endereco: e.target.value })}
                    className="bg-zinc-800 border-zinc-700"
                    placeholder="Rua, número, bairro..."
                  />
                </div>

                <div>
                  <Label>Cidade</Label>
                  <Input
                    value={formData.cidade}
                    onChange={(e) => setFormData({ ...formData, cidade: e.target.value })}
                    className="bg-zinc-800 border-zinc-700"
                  />
                </div>

                <div>
                  <Label>UF</Label>
                  <Select
                    value={formData.uf}
                    onValueChange={(value) => setFormData({ ...formData, uf: value })}
                  >
                    <SelectTrigger className="bg-zinc-800 border-zinc-700">
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      {ESTADOS_BR.map(uf => (
                        <SelectItem key={uf} value={uf}>{uf}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Contato */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-zinc-400 border-b border-zinc-800 pb-2">
                Contato
              </h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Telefone Celular</Label>
                  <Input
                    value={formData.telefone_celular}
                    onChange={(e) => setFormData({ ...formData, telefone_celular: maskPhone(e.target.value) })}
                    className="bg-zinc-800 border-zinc-700"
                    placeholder="(00) 00000-0000"
                  />
                </div>

                <div>
                  <Label>WhatsApp</Label>
                  <Input
                    value={formData.whatsapp}
                    onChange={(e) => setFormData({ ...formData, whatsapp: maskPhone(e.target.value) })}
                    className="bg-zinc-800 border-zinc-700"
                    placeholder="(00) 00000-0000"
                  />
                </div>

                <div className="col-span-2">
                  <Label>E-mail</Label>
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="bg-zinc-800 border-zinc-700"
                    placeholder="email@exemplo.com"
                  />
                </div>
              </div>
            </div>

            {/* Informações Profissionais */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-zinc-400 border-b border-zinc-800 pb-2">
                Informações Profissionais
              </h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Categoria</Label>
                  <div className="flex gap-2">
                    <Select
                      value={formData.categoria_id}
                      onValueChange={(value) => setFormData({ ...formData, categoria_id: value })}
                    >
                      <SelectTrigger className="bg-zinc-800 border-zinc-700 flex-1">
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        {categorias.map(cat => (
                          <SelectItem key={cat.id} value={cat.id}>{cat.nome}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => setShowCategoriaModal(true)}
                      className="border-zinc-700"
                      title="Nova categoria"
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <div>
                  <Label>Salário</Label>
                  <MoneyInput
                    value={formData.salario}
                    onChange={(value) => setFormData({ ...formData, salario: value })}
                  />
                </div>

                <div>
                  <Label>Data de Admissão</Label>
                  <Input
                    type="date"
                    value={formData.data_admissao}
                    onChange={(e) => setFormData({ ...formData, data_admissao: e.target.value })}
                    className="bg-zinc-800 border-zinc-700"
                  />
                </div>

                <div>
                  <Label>Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) => setFormData({ ...formData, status: value })}
                  >
                    <SelectTrigger className="bg-zinc-800 border-zinc-700">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Ativo">Ativo</SelectItem>
                      <SelectItem value="Inativo">Inativo</SelectItem>
                      <SelectItem value="Férias">Férias</SelectItem>
                      <SelectItem value="Afastado">Afastado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={() => setShowModal(false)}>
                Cancelar
              </Button>
              <Button
                type="submit"
                className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
              >
                {editingFuncionario ? 'Atualizar' : 'Cadastrar'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal de Nova Categoria */}
      <Dialog open={showCategoriaModal} onOpenChange={setShowCategoriaModal}>
        <DialogContent className="bg-zinc-900 border-zinc-800">
          <DialogHeader>
            <DialogTitle>Nova Categoria de Funcionário</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleCriarCategoria} className="space-y-4">
            <div>
              <Label>Nome da Categoria *</Label>
              <Input
                value={novaCategoriaForm.nome}
                onChange={(e) => setNovaCategoriaForm({ ...novaCategoriaForm, nome: e.target.value })}
                className="bg-zinc-800 border-zinc-700"
                placeholder="Ex: Técnico, Auxiliar..."
                required
              />
            </div>

            <div>
              <Label>Descrição</Label>
              <Input
                value={novaCategoriaForm.descricao}
                onChange={(e) => setNovaCategoriaForm({ ...novaCategoriaForm, descricao: e.target.value })}
                className="bg-zinc-800 border-zinc-700"
                placeholder="Descrição opcional"
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowCategoriaModal(false)}>
                Cancelar
              </Button>
              <Button
                type="submit"
                className="bg-gradient-to-r from-purple-600 to-blue-600"
              >
                Criar Categoria
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Funcionarios;
