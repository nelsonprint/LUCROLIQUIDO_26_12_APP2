import React, { useState, useEffect } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { SubscriptionCard } from '@/components/SubscriptionCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CPFInput, CNPJInput } from '@/components/ui/cpf-cnpj-input';
import { maskPhone, isValidCPF, isValidCNPJ, onlyDigits } from '@/lib/formatters';
import { axiosInstance } from '../App';
import { toast } from 'sonner';
import { Users, Plus, Edit, Trash2, Phone } from 'lucide-react';

export const Clientes = ({ user, onLogout }) => {
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingCliente, setEditingCliente] = useState(null);
  const [tipoCliente, setTipoCliente] = useState('PF'); // PF ou PJ
  const [cpfValido, setCpfValido] = useState(true);
  const [cnpjValido, setCnpjValido] = useState(true);

  const [formData, setFormData] = useState({
    tipo: 'PF',
    // PF
    nome: '',
    sexo: 'Masculino',
    cpf: '',
    profissao: '',
    // PJ
    nome_fantasia: '',
    razao_social: '',
    cnpj: '',
    inscricao_municipal: '',
    inscricao_estadual: '',
    ramo_atuacao: '',
    site: '',
    // Contato Financeiro PJ
    contato_financeiro_nome: '',
    contato_financeiro_whatsapp: '',
    contato_financeiro_email: '',
    // Endereço
    logradouro: '',
    numero: '',
    complemento: '',
    bairro: '',
    ponto_referencia: '',
    cep: '',
    cidade: '',
    estado: '',
    // Contato
    telefone_fixo: '',
    whatsapp: '',
    email: ''
  });

  useEffect(() => {
    fetchCompany();
  }, []);

  useEffect(() => {
    if (selectedCompany) {
      fetchClientes();
    }
  }, [selectedCompany]);

  const fetchCompany = async () => {
    try {
      const userId = user.user_id || user.id;
      const response = await axiosInstance.get(`/companies/${userId}`);
      if (response.data.length > 0) {
        setSelectedCompany(response.data[0]);
      }
    } catch (error) {
      console.error('Erro ao buscar empresa:', error);
      toast.error('Erro ao carregar empresa');
    }
  };

  const fetchClientes = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get(`/clientes/${selectedCompany.id}`);
      setClientes(response.data);
    } catch (error) {
      toast.error('Erro ao carregar clientes');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (cliente = null) => {
    if (cliente) {
      setEditingCliente(cliente);
      setTipoCliente(cliente.tipo);
      setFormData(cliente);
    } else {
      setEditingCliente(null);
      setTipoCliente('PF');
      setFormData({
        tipo: 'PF',
        nome: '',
        sexo: 'Masculino',
        cpf: '',
        profissao: '',
        nome_fantasia: '',
        razao_social: '',
        cnpj: '',
        inscricao_municipal: '',
        inscricao_estadual: '',
        ramo_atuacao: '',
        site: '',
        contato_financeiro_nome: '',
        contato_financeiro_whatsapp: '',
        contato_financeiro_email: '',
        logradouro: '',
        numero: '',
        complemento: '',
        bairro: '',
        ponto_referencia: '',
        cep: '',
        cidade: '',
        estado: '',
        telefone_fixo: '',
        whatsapp: '',
        email: ''
      });
    }
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validação de CPF/CNPJ antes de enviar
    if (tipoCliente === 'PF') {
      if (formData.cpf && !isValidCPF(formData.cpf)) {
        toast.error('CPF inválido. Por favor, corrija antes de continuar.');
        setCpfValido(false);
        return;
      }
      // CPF é obrigatório para PF
      if (!formData.cpf || onlyDigits(formData.cpf).length < 11) {
        toast.error('CPF é obrigatório para Pessoa Física.');
        setCpfValido(false);
        return;
      }
    }
    
    if (tipoCliente === 'PJ') {
      if (formData.cnpj && !isValidCNPJ(formData.cnpj)) {
        toast.error('CNPJ inválido. Por favor, corrija antes de continuar.');
        setCnpjValido(false);
        return;
      }
      // CNPJ é obrigatório para PJ
      if (!formData.cnpj || onlyDigits(formData.cnpj).length < 14) {
        toast.error('CNPJ é obrigatório para Pessoa Jurídica.');
        setCnpjValido(false);
        return;
      }
    }
    
    try {
      const data = {
        ...formData,
        tipo: tipoCliente,
        empresa_id: selectedCompany.id
      };

      if (editingCliente) {
        await axiosInstance.put(`/clientes/${editingCliente.id}`, data);
        toast.success('Cliente atualizado com sucesso!');
      } else {
        await axiosInstance.post('/clientes', data);
        toast.success('Cliente cadastrado com sucesso!');
      }

      setShowModal(false);
      fetchClientes();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Erro ao salvar cliente');
    }
  };

  const handleDelete = async (clienteId) => {
    if (!window.confirm('Deseja realmente excluir este cliente?')) return;

    try {
      await axiosInstance.delete(`/clientes/${clienteId}`);
      toast.success('Cliente excluído com sucesso!');
      fetchClientes();
    } catch (error) {
      toast.error('Erro ao excluir cliente');
    }
  };

  const formatPhone = (phone) => {
    if (!phone) return '';
    const numbers = phone.replace(/\D/g, '');
    return numbers;
  };

  const openWhatsApp = (phone) => {
    const numbers = formatPhone(phone);
    window.open(`https://wa.me/55${numbers}`, '_blank');
  };

  // Funções de máscara agora são importadas de @/lib/formatters

  if (!selectedCompany) {
    return (
      <div className="min-h-screen gradient-bg flex">
        <Sidebar user={user} onLogout={onLogout} />
        <div className="flex-1 p-8">
          <Card className="glass border-white/10">
            <CardContent className="p-8 text-center">
              <p className="text-gray-400">Selecione uma empresa para gerenciar clientes</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen gradient-bg flex">
      <Sidebar user={user} onLogout={onLogout} />
      
      <div className="flex-1 p-8 overflow-auto">
        <SubscriptionCard />

        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">Clientes</h1>
            <p className="text-gray-400">{selectedCompany.name}</p>
          </div>
          <Button
            onClick={() => handleOpenModal()}
            className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
          >
            <Plus className="mr-2" size={18} />
            Novo Cliente
          </Button>
        </div>

        {loading ? (
          <div className="text-center text-white">Carregando...</div>
        ) : clientes.length === 0 ? (
          <Card className="glass border-white/10">
            <CardContent className="p-12 text-center">
              <Users className="mx-auto mb-4 text-gray-400" size={48} />
              <p className="text-gray-400">Nenhum cliente cadastrado ainda</p>
              <Button
                onClick={() => handleOpenModal()}
                className="mt-4 bg-purple-600 hover:bg-purple-700"
              >
                Cadastrar Primeiro Cliente
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card className="glass border-white/10">
            <CardHeader>
              <CardTitle className="text-white">Lista de Clientes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/10">
                      <th className="text-left p-3 text-gray-400">Tipo</th>
                      <th className="text-left p-3 text-gray-400">Nome</th>
                      <th className="text-left p-3 text-gray-400">CPF/CNPJ</th>
                      <th className="text-left p-3 text-gray-400">WhatsApp</th>
                      <th className="text-left p-3 text-gray-400">Cidade</th>
                      <th className="text-right p-3 text-gray-400">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {clientes.map((cliente) => (
                      <tr key={cliente.id} className="border-b border-white/5 hover:bg-white/5">
                        <td className="p-3">
                          <span className={`px-2 py-1 rounded text-xs ${
                            cliente.tipo === 'PF' ? 'bg-blue-500/20 text-blue-300' : 'bg-green-500/20 text-green-300'
                          }`}>
                            {cliente.tipo}
                          </span>
                        </td>
                        <td className="p-3 text-white">
                          {cliente.tipo === 'PF' ? cliente.nome : cliente.nome_fantasia || cliente.razao_social}
                        </td>
                        <td className="p-3 text-gray-300">
                          {cliente.tipo === 'PF' ? cliente.cpf : cliente.cnpj}
                        </td>
                        <td className="p-3">
                          {cliente.whatsapp && (
                            <button
                              onClick={() => openWhatsApp(cliente.whatsapp)}
                              className="text-green-400 hover:text-green-300 flex items-center"
                            >
                              <Phone size={16} className="mr-1" />
                              {maskPhone(cliente.whatsapp)}
                            </button>
                          )}
                        </td>
                        <td className="p-3 text-gray-300">{cliente.cidade}</td>
                        <td className="p-3 text-right">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleOpenModal(cliente)}
                            className="text-blue-400 hover:text-blue-300"
                          >
                            <Edit size={16} />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDelete(cliente.id)}
                            className="text-red-400 hover:text-red-300"
                          >
                            <Trash2 size={16} />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Modal de Cadastro */}
        <Dialog open={showModal} onOpenChange={setShowModal}>
          <DialogContent className="glass border-white/10 max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-white text-2xl">
                {editingCliente ? 'Editar Cliente' : 'Novo Cliente'}
              </DialogTitle>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Toggle Tipo */}
              <div className="flex gap-4">
                <Button
                  type="button"
                  onClick={() => setTipoCliente('PF')}
                  className={tipoCliente === 'PF' ? 'bg-blue-600' : 'bg-gray-600'}
                >
                  Pessoa Física
                </Button>
                <Button
                  type="button"
                  onClick={() => setTipoCliente('PJ')}
                  className={tipoCliente === 'PJ' ? 'bg-green-600' : 'bg-gray-600'}
                >
                  Pessoa Jurídica
                </Button>
              </div>

              {tipoCliente === 'PF' ? (
                /* PESSOA FÍSICA */
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-white">Nome Completo *</Label>
                      <Input
                        value={formData.nome}
                        onChange={(e) => setFormData({...formData, nome: e.target.value})}
                        required
                        className="glass border-white/10 text-white"
                      />
                    </div>
                    <div>
                      <Label className="text-white">Sexo</Label>
                      <select
                        value={formData.sexo}
                        onChange={(e) => setFormData({...formData, sexo: e.target.value})}
                        className="w-full p-2 glass border-white/10 text-white rounded-md"
                      >
                        <option value="Masculino">Masculino</option>
                        <option value="Feminino">Feminino</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-white">CPF *</Label>
                      <CPFInput
                        value={formData.cpf}
                        onChange={(value) => setFormData({...formData, cpf: value})}
                        required
                        className="glass border-white/10 text-white"
                      />
                    </div>
                    <div>
                      <Label className="text-white">Profissão</Label>
                      <Input
                        value={formData.profissao}
                        onChange={(e) => setFormData({...formData, profissao: e.target.value})}
                        className="glass border-white/10 text-white"
                      />
                    </div>
                  </div>
                </>
              ) : (
                /* PESSOA JURÍDICA */
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-white">Nome Fantasia *</Label>
                      <Input
                        value={formData.nome_fantasia}
                        onChange={(e) => setFormData({...formData, nome_fantasia: e.target.value})}
                        required
                        className="glass border-white/10 text-white"
                      />
                    </div>
                    <div>
                      <Label className="text-white">Razão Social *</Label>
                      <Input
                        value={formData.razao_social}
                        onChange={(e) => setFormData({...formData, razao_social: e.target.value})}
                        required
                        className="glass border-white/10 text-white"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label className="text-white">CNPJ *</Label>
                      <CNPJInput
                        value={formData.cnpj}
                        onChange={(value) => setFormData({...formData, cnpj: value})}
                        required
                        className="glass border-white/10 text-white"
                      />
                    </div>
                    <div>
                      <Label className="text-white">Inscrição Municipal</Label>
                      <Input
                        value={formData.inscricao_municipal}
                        onChange={(e) => setFormData({...formData, inscricao_municipal: e.target.value})}
                        className="glass border-white/10 text-white"
                      />
                    </div>
                    <div>
                      <Label className="text-white">Inscrição Estadual</Label>
                      <Input
                        value={formData.inscricao_estadual}
                        onChange={(e) => setFormData({...formData, inscricao_estadual: e.target.value})}
                        className="glass border-white/10 text-white"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-white">Ramo de Atuação</Label>
                      <Input
                        value={formData.ramo_atuacao}
                        onChange={(e) => setFormData({...formData, ramo_atuacao: e.target.value})}
                        className="glass border-white/10 text-white"
                      />
                    </div>
                    <div>
                      <Label className="text-white">Site/URL</Label>
                      <Input
                        value={formData.site}
                        onChange={(e) => setFormData({...formData, site: e.target.value})}
                        placeholder="https://"
                        className="glass border-white/10 text-white"
                      />
                    </div>
                  </div>

                  {/* Contato Financeiro */}
                  <div className="border-t border-white/10 pt-4">
                    <h3 className="text-white font-bold mb-3">Contato Financeiro</h3>
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <Label className="text-white">Nome</Label>
                        <Input
                          value={formData.contato_financeiro_nome}
                          onChange={(e) => setFormData({...formData, contato_financeiro_nome: e.target.value})}
                          className="glass border-white/10 text-white"
                        />
                      </div>
                      <div>
                        <Label className="text-white">WhatsApp</Label>
                        <Input
                          value={formData.contato_financeiro_whatsapp}
                          onChange={(e) => setFormData({...formData, contato_financeiro_whatsapp: maskPhone(e.target.value)})}
                          placeholder="(00) 00000-0000"
                          className="glass border-white/10 text-white"
                        />
                      </div>
                      <div>
                        <Label className="text-white">E-mail</Label>
                        <Input
                          type="email"
                          value={formData.contato_financeiro_email}
                          onChange={(e) => setFormData({...formData, contato_financeiro_email: e.target.value})}
                          className="glass border-white/10 text-white"
                        />
                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* Endereço (comum) */}
              <div className="border-t border-white/10 pt-4">
                <h3 className="text-white font-bold mb-3">Endereço</h3>
                <div className="grid grid-cols-4 gap-4">
                  <div className="col-span-3">
                    <Label className="text-white">Logradouro</Label>
                    <Input
                      value={formData.logradouro}
                      onChange={(e) => setFormData({...formData, logradouro: e.target.value})}
                      className="glass border-white/10 text-white"
                    />
                  </div>
                  <div>
                    <Label className="text-white">Número</Label>
                    <Input
                      value={formData.numero}
                      onChange={(e) => setFormData({...formData, numero: e.target.value})}
                      className="glass border-white/10 text-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4 mt-4">
                  <div>
                    <Label className="text-white">{tipoCliente === 'PF' ? 'Complemento (AP/Casa)' : 'Complemento (Sala)'}</Label>
                    <Input
                      value={formData.complemento}
                      onChange={(e) => setFormData({...formData, complemento: e.target.value})}
                      className="glass border-white/10 text-white"
                    />
                  </div>
                  <div>
                    <Label className="text-white">Bairro</Label>
                    <Input
                      value={formData.bairro}
                      onChange={(e) => setFormData({...formData, bairro: e.target.value})}
                      className="glass border-white/10 text-white"
                    />
                  </div>
                  <div>
                    <Label className="text-white">CEP</Label>
                    <Input
                      value={formData.cep}
                      onChange={(e) => setFormData({...formData, cep: e.target.value})}
                      className="glass border-white/10 text-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4 mt-4">
                  <div>
                    <Label className="text-white">Cidade</Label>
                    <Input
                      value={formData.cidade}
                      onChange={(e) => setFormData({...formData, cidade: e.target.value})}
                      className="glass border-white/10 text-white"
                    />
                  </div>
                  <div>
                    <Label className="text-white">Estado (UF)</Label>
                    <Input
                      value={formData.estado}
                      onChange={(e) => setFormData({...formData, estado: e.target.value.toUpperCase()})}
                      maxLength={2}
                      placeholder="SP"
                      className="glass border-white/10 text-white"
                    />
                  </div>
                  <div>
                    <Label className="text-white">Ponto de Referência</Label>
                    <Input
                      value={formData.ponto_referencia}
                      onChange={(e) => setFormData({...formData, ponto_referencia: e.target.value})}
                      className="glass border-white/10 text-white"
                    />
                  </div>
                </div>
              </div>

              {/* Contato (comum) */}
              <div className="border-t border-white/10 pt-4">
                <h3 className="text-white font-bold mb-3">Contato</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label className="text-white">Telefone Fixo</Label>
                    <Input
                      value={formData.telefone_fixo}
                      onChange={(e) => setFormData({...formData, telefone_fixo: maskPhone(e.target.value)})}
                      placeholder="(00) 0000-0000"
                      className="glass border-white/10 text-white"
                    />
                  </div>
                  <div>
                    <Label className="text-white">WhatsApp</Label>
                    <Input
                      value={formData.whatsapp}
                      onChange={(e) => setFormData({...formData, whatsapp: maskPhone(e.target.value)})}
                      placeholder="(00) 00000-0000"
                      className="glass border-white/10 text-white"
                    />
                  </div>
                  <div>
                    <Label className="text-white">E-mail</Label>
                    <Input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      className="glass border-white/10 text-white"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-4 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowModal(false)}
                  className="border-white/10"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                >
                  {editingCliente ? 'Atualizar' : 'Cadastrar'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};
