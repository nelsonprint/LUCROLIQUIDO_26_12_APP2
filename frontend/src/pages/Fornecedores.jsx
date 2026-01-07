import React, { useState, useEffect } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { SubscriptionCard } from '@/components/SubscriptionCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { maskPhone, onlyDigits, maskCpfCnpj } from '@/lib/formatters';
import { axiosInstance } from '../App';
import { toast } from 'sonner';
import { Truck, Plus, Edit, Trash2, Phone, MessageCircle, Mail, Globe, Search, Loader2 } from 'lucide-react';

// Lista de estados brasileiros
const ESTADOS_BR = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 
  'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 
  'SP', 'SE', 'TO'
];

const Fornecedores = ({ user, onLogout }) => {
  const company = JSON.parse(localStorage.getItem('company') || '{}');
  
  const [fornecedores, setFornecedores] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingFornecedor, setEditingFornecedor] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  const [formData, setFormData] = useState({
    nome: '',
    cnpj_cpf: '',
    telefone: '',
    whatsapp: '',
    email: '',
    endereco: '',
    cidade: '',
    uf: '',
    fornecedor_de: '',
    site: '',
    observacoes: ''
  });

  useEffect(() => {
    if (company?.id) {
      fetchFornecedores();
    }
  }, [company?.id, filterStatus]);

  const fetchFornecedores = async () => {
    try {
      setLoading(true);
      let url = `/fornecedores/${company.id}`;
      if (filterStatus !== 'all') url += `?status=${filterStatus}`;
      
      const response = await axiosInstance.get(url);
      setFornecedores(response.data);
    } catch (error) {
      toast.error('Erro ao carregar fornecedores');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (fornecedor = null) => {
    if (fornecedor) {
      setEditingFornecedor(fornecedor);
      setFormData({
        nome: fornecedor.nome || '',
        cnpj_cpf: fornecedor.cnpj_cpf || '',
        telefone: fornecedor.telefone || '',
        whatsapp: fornecedor.whatsapp || '',
        email: fornecedor.email || '',
        endereco: fornecedor.endereco || '',
        cidade: fornecedor.cidade || '',
        uf: fornecedor.uf || '',
        fornecedor_de: fornecedor.fornecedor_de || '',
        site: fornecedor.site || '',
        observacoes: fornecedor.observacoes || ''
      });
    } else {
      setEditingFornecedor(null);
      setFormData({
        nome: '',
        cnpj_cpf: '',
        telefone: '',
        whatsapp: '',
        email: '',
        endereco: '',
        cidade: '',
        uf: '',
        fornecedor_de: '',
        site: '',
        observacoes: ''
      });
    }
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.nome.trim()) {
      toast.error('Nome/Razão Social é obrigatório');
      return;
    }

    try {
      setLoading(true);
      const payload = {
        empresa_id: company.id,
        ...formData
      };

      if (editingFornecedor) {
        await axiosInstance.put(`/fornecedores/${editingFornecedor.id}`, payload);
        toast.success('Fornecedor atualizado!');
      } else {
        await axiosInstance.post('/fornecedores', payload);
        toast.success('Fornecedor cadastrado!');
      }

      setShowModal(false);
      fetchFornecedores();
    } catch (error) {
      toast.error('Erro ao salvar fornecedor');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Tem certeza que deseja excluir este fornecedor?')) return;

    try {
      await axiosInstance.delete(`/fornecedores/${id}`);
      toast.success('Fornecedor excluído!');
      fetchFornecedores();
    } catch (error) {
      toast.error('Erro ao excluir fornecedor');
    }
  };

  const handleToggleStatus = async (fornecedor) => {
    const novoStatus = fornecedor.status === 'Ativo' ? 'Inativo' : 'Ativo';
    try {
      await axiosInstance.patch(`/fornecedores/${fornecedor.id}/status`, { status: novoStatus });
      toast.success(`Fornecedor ${novoStatus === 'Ativo' ? 'ativado' : 'inativado'}!`);
      fetchFornecedores();
    } catch (error) {
      toast.error('Erro ao atualizar status');
    }
  };

  const openWhatsApp = (whatsapp) => {
    if (!whatsapp) return;
    const numero = onlyDigits(whatsapp);
    const numeroCompleto = numero.length === 11 ? `55${numero}` : numero.length === 13 ? numero : `55${numero}`;
    window.open(`https://wa.me/${numeroCompleto}`, '_blank');
  };

  const openSite = (site) => {
    if (!site) return;
    const url = site.startsWith('http') ? site : `https://${site}`;
    window.open(url, '_blank');
  };

  // Filtrar fornecedores pela busca
  const filteredFornecedores = fornecedores.filter(f => 
    f.nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    f.fornecedor_de?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    f.cidade?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Estatísticas
  const totalFornecedores = fornecedores.length;
  const fornecedoresAtivos = fornecedores.filter(f => f.status === 'Ativo').length;

  return (
    <div className="flex min-h-screen bg-zinc-950 text-white">
      <Sidebar user={user} onLogout={onLogout} activePage="fornecedores" />

      <div className="flex-1 p-8 ml-64">
        <div className="max-w-7xl mx-auto space-y-6">
          <SubscriptionCard user={user} />

          {/* Header */}
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-3">
                <Truck className="w-8 h-8 text-orange-400" />
                Fornecedores
              </h1>
              <p className="text-zinc-400 mt-1">Gerencie seus fornecedores e parceiros</p>
            </div>
            <Button onClick={() => handleOpenModal()} className="bg-orange-600 hover:bg-orange-700">
              <Plus className="w-4 h-4 mr-2" /> Novo Fornecedor
            </Button>
          </div>

          {/* Cards de Resumo */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="bg-zinc-900 border-zinc-800">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-zinc-400 text-sm">Total</p>
                    <p className="text-2xl font-bold">{totalFornecedores}</p>
                  </div>
                  <Truck className="w-8 h-8 text-orange-400" />
                </div>
              </CardContent>
            </Card>
            <Card className="bg-zinc-900 border-zinc-800">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-zinc-400 text-sm">Ativos</p>
                    <p className="text-2xl font-bold text-green-400">{fornecedoresAtivos}</p>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center">
                    <div className="w-3 h-3 rounded-full bg-green-500" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-zinc-900 border-zinc-800">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-zinc-400 text-sm">Inativos</p>
                    <p className="text-2xl font-bold text-zinc-500">{totalFornecedores - fornecedoresAtivos}</p>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-zinc-500/20 flex items-center justify-center">
                    <div className="w-3 h-3 rounded-full bg-zinc-500" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filtros */}
          <Card className="bg-zinc-900 border-zinc-800">
            <CardContent className="p-4">
              <div className="flex flex-wrap gap-4 items-center">
                <div className="relative flex-1 min-w-[200px]">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                  <Input
                    placeholder="Buscar por nome, tipo ou cidade..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 bg-zinc-800 border-zinc-700"
                  />
                </div>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="w-[150px] bg-zinc-800 border-zinc-700">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="Ativo">Ativos</SelectItem>
                    <SelectItem value="Inativo">Inativos</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Tabela de Fornecedores */}
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader>
              <CardTitle>Lista de Fornecedores</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-8 h-8 animate-spin text-orange-400" />
                </div>
              ) : filteredFornecedores.length === 0 ? (
                <div className="text-center py-8 text-zinc-500">
                  <Truck className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Nenhum fornecedor encontrado</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-zinc-800">
                        <TableHead>Nome/Razão Social</TableHead>
                        <TableHead>Fornecedor de</TableHead>
                        <TableHead>Cidade/UF</TableHead>
                        <TableHead>Contato</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredFornecedores.map((fornecedor) => (
                        <TableRow key={fornecedor.id} className="border-zinc-800 hover:bg-zinc-800/50">
                          <TableCell>
                            <div>
                              <p className="font-medium">{fornecedor.nome}</p>
                              {fornecedor.cnpj_cpf && (
                                <p className="text-xs text-zinc-500">{fornecedor.cnpj_cpf}</p>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className="text-zinc-400">{fornecedor.fornecedor_de || '-'}</span>
                          </TableCell>
                          <TableCell>
                            {fornecedor.cidade || fornecedor.uf ? (
                              <span>{fornecedor.cidade}{fornecedor.cidade && fornecedor.uf ? '/' : ''}{fornecedor.uf}</span>
                            ) : '-'}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {fornecedor.whatsapp && (
                                <button
                                  onClick={() => openWhatsApp(fornecedor.whatsapp)}
                                  className="p-1.5 rounded-lg bg-green-500/10 text-green-400 hover:bg-green-500/20 transition-colors"
                                  title="Abrir WhatsApp"
                                >
                                  <MessageCircle className="w-4 h-4" />
                                </button>
                              )}
                              {fornecedor.telefone && (
                                <a
                                  href={`tel:${onlyDigits(fornecedor.telefone)}`}
                                  className="p-1.5 rounded-lg bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 transition-colors"
                                  title="Ligar"
                                >
                                  <Phone className="w-4 h-4" />
                                </a>
                              )}
                              {fornecedor.email && (
                                <a
                                  href={`mailto:${fornecedor.email}`}
                                  className="p-1.5 rounded-lg bg-purple-500/10 text-purple-400 hover:bg-purple-500/20 transition-colors"
                                  title="Enviar email"
                                >
                                  <Mail className="w-4 h-4" />
                                </a>
                              )}
                              {fornecedor.site && (
                                <button
                                  onClick={() => openSite(fornecedor.site)}
                                  className="p-1.5 rounded-lg bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20 transition-colors"
                                  title="Abrir site"
                                >
                                  <Globe className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge 
                              variant="outline" 
                              className={fornecedor.status === 'Ativo' 
                                ? 'border-green-500/50 text-green-400 cursor-pointer hover:bg-green-500/10' 
                                : 'border-zinc-500/50 text-zinc-400 cursor-pointer hover:bg-zinc-500/10'
                              }
                              onClick={() => handleToggleStatus(fornecedor)}
                            >
                              {fornecedor.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleOpenModal(fornecedor)}
                                className="text-blue-400 hover:text-blue-300 hover:bg-blue-500/10"
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDelete(fornecedor.id)}
                                className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Modal de Cadastro/Edição */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="bg-zinc-900 border-zinc-800 max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Truck className="w-5 h-5 text-orange-400" />
              {editingFornecedor ? 'Editar Fornecedor' : 'Novo Fornecedor'}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Nome */}
            <div>
              <Label htmlFor="nome">Nome/Razão Social *</Label>
              <Input
                id="nome"
                value={formData.nome}
                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                className="bg-zinc-800 border-zinc-700"
                placeholder="Nome do fornecedor"
                required
              />
            </div>

            {/* CNPJ/CPF e Fornecedor de */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="cnpj_cpf">CNPJ/CPF</Label>
                <Input
                  id="cnpj_cpf"
                  value={formData.cnpj_cpf}
                  onChange={(e) => setFormData({ ...formData, cnpj_cpf: maskCpfCnpj(e.target.value) })}
                  className="bg-zinc-800 border-zinc-700"
                  placeholder="00.000.000/0001-00"
                />
              </div>
              <div>
                <Label htmlFor="fornecedor_de">Fornecedor de</Label>
                <Input
                  id="fornecedor_de"
                  value={formData.fornecedor_de}
                  onChange={(e) => setFormData({ ...formData, fornecedor_de: e.target.value })}
                  className="bg-zinc-800 border-zinc-700"
                  placeholder="Ex: Materiais elétricos, Mão de obra"
                />
              </div>
            </div>

            {/* Telefone e WhatsApp */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="telefone">Telefone</Label>
                <Input
                  id="telefone"
                  value={formData.telefone}
                  onChange={(e) => setFormData({ ...formData, telefone: maskPhone(e.target.value) })}
                  className="bg-zinc-800 border-zinc-700"
                  placeholder="(00) 0000-0000"
                />
              </div>
              <div>
                <Label htmlFor="whatsapp">WhatsApp</Label>
                <div className="flex gap-2">
                  <Input
                    id="whatsapp"
                    value={formData.whatsapp}
                    onChange={(e) => setFormData({ ...formData, whatsapp: maskPhone(e.target.value) })}
                    className="bg-zinc-800 border-zinc-700 flex-1"
                    placeholder="(00) 00000-0000"
                  />
                  {formData.whatsapp && (
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => openWhatsApp(formData.whatsapp)}
                      className="border-green-500/50 text-green-400 hover:bg-green-500/10"
                    >
                      <MessageCircle className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>
            </div>

            {/* Email e Site */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="bg-zinc-800 border-zinc-700"
                  placeholder="email@fornecedor.com"
                />
              </div>
              <div>
                <Label htmlFor="site">Site</Label>
                <div className="flex gap-2">
                  <Input
                    id="site"
                    value={formData.site}
                    onChange={(e) => setFormData({ ...formData, site: e.target.value })}
                    className="bg-zinc-800 border-zinc-700 flex-1"
                    placeholder="www.fornecedor.com.br"
                  />
                  {formData.site && (
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => openSite(formData.site)}
                      className="border-cyan-500/50 text-cyan-400 hover:bg-cyan-500/10"
                    >
                      <Globe className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>
            </div>

            {/* Endereço */}
            <div>
              <Label htmlFor="endereco">Endereço</Label>
              <Input
                id="endereco"
                value={formData.endereco}
                onChange={(e) => setFormData({ ...formData, endereco: e.target.value })}
                className="bg-zinc-800 border-zinc-700"
                placeholder="Rua, número, bairro"
              />
            </div>

            {/* Cidade e UF */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="cidade">Cidade</Label>
                <Input
                  id="cidade"
                  value={formData.cidade}
                  onChange={(e) => setFormData({ ...formData, cidade: e.target.value })}
                  className="bg-zinc-800 border-zinc-700"
                  placeholder="Cidade"
                />
              </div>
              <div>
                <Label htmlFor="uf">UF</Label>
                <Select value={formData.uf} onValueChange={(value) => setFormData({ ...formData, uf: value })}>
                  <SelectTrigger className="bg-zinc-800 border-zinc-700">
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {ESTADOS_BR.map((uf) => (
                      <SelectItem key={uf} value={uf}>{uf}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Observações */}
            <div>
              <Label htmlFor="observacoes">Observações</Label>
              <Textarea
                id="observacoes"
                value={formData.observacoes}
                onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                className="bg-zinc-800 border-zinc-700"
                placeholder="Observações sobre o fornecedor..."
                rows={3}
              />
            </div>

            <DialogFooter className="gap-2">
              <Button type="button" variant="outline" onClick={() => setShowModal(false)} className="border-zinc-700">
                Cancelar
              </Button>
              <Button type="submit" disabled={loading} className="bg-orange-600 hover:bg-orange-700">
                {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                {editingFornecedor ? 'Salvar' : 'Cadastrar'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Fornecedores;
