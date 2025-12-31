import React, { useState, useEffect } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { SubscriptionCard } from '@/components/SubscriptionCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { axiosInstance } from '../App';
import { toast } from 'sonner';
import { FileText, Download, MessageCircle, Eye, Edit, Trash2, Plus, Calculator, ChevronDown, Grid3X3 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useCanWrite } from '../hooks/useCanWrite';

const Orcamentos = ({ user, onLogout }) => {
  const [orcamentos, setOrcamentos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterCliente, setFilterCliente] = useState('');
  const navigate = useNavigate();
  const { canWrite, checkCanWrite } = useCanWrite();

  const company = JSON.parse(localStorage.getItem('company') || '{}');

  useEffect(() => {
    fetchOrcamentos();
  }, [filterStatus]);

  const fetchOrcamentos = async () => {
    if (!company.id) return;

    setLoading(true);
    try {
      let url = `/orcamentos/${company.id}`;
      const params = [];
      if (filterStatus !== 'all') params.push(`status=${filterStatus}`);
      if (filterCliente) params.push(`cliente=${filterCliente}`);
      if (params.length > 0) url += `?${params.join('&')}`;

      const response = await axiosInstance.get(url);
      setOrcamentos(response.data);
    } catch (error) {
      toast.error('Erro ao carregar orçamentos');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!checkCanWrite('excluir orçamento')) return;
    if (!window.confirm('Deseja realmente excluir este orçamento?')) return;

    try {
      await axiosInstance.delete(`/orcamento/${id}`);
      toast.success('Orçamento excluído!');
      fetchOrcamentos();
    } catch (error) {
      toast.error('Erro ao excluir orçamento');
    }
  };

  const handleDownloadPDF = async (id, numeroOrcamento) => {
    try {
      const response = await axiosInstance.get(`/orcamento/${id}/pdf`, {
        responseType: 'blob',
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `orcamento_${numeroOrcamento}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      toast.success('PDF baixado com sucesso!');
    } catch (error) {
      toast.error('Erro ao baixar PDF');
    }
  };

  const handleEnviarWhatsApp = async (orcamento) => {
    try {
      // Usar o endpoint que gera o link do HTML
      toast.info('Gerando link do orçamento...');
      
      const response = await axiosInstance.post(`/orcamento/${orcamento.id}/whatsapp`);
      const { whatsapp_url } = response.data;
      
      // Atualizar status para ENVIADO
      await axiosInstance.patch(`/orcamento/${orcamento.id}/status`, {
        status: 'ENVIADO',
        canal_envio: 'WhatsApp',
      });

      // Abrir WhatsApp com mensagem + link do orçamento
      window.open(whatsapp_url, '_blank');
      
      toast.success('✅ WhatsApp aberto com link do orçamento!');
      fetchOrcamentos();
    } catch (error) {
      console.error('Erro ao enviar por WhatsApp:', error);
      
      // Fallback: verificar se cliente tem WhatsApp
      const whatsapp = orcamento.cliente_whatsapp?.replace(/\D/g, '');
      if (!whatsapp) {
        toast.error('Cliente não possui WhatsApp cadastrado');
        return;
      }
      
      toast.error('Erro ao preparar envio por WhatsApp');
    }
  };

  const getStatusBadge = (status) => {
    const variants = {
      RASCUNHO: 'default',
      ENVIADO: 'secondary',
      APROVADO: 'success',
      NAO_APROVADO: 'destructive',
    };

    const labels = {
      RASCUNHO: 'Rascunho',
      ENVIADO: 'Enviado',
      APROVADO: 'Aprovado',
      NAO_APROVADO: 'Não Aprovado',
    };

    return <Badge variant={variants[status] || 'default'}>{labels[status] || status}</Badge>;
  };

  return (
    <div className="flex min-h-screen bg-zinc-950 text-white">
      <Sidebar user={user} onLogout={onLogout} activePage="orcamentos" />

      <div className="flex-1 p-8 ml-64">
        <div className="max-w-7xl mx-auto space-y-6">
          <SubscriptionCard user={user} />

          {/* Header */}
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold">Orçamentos</h1>
              <p className="text-zinc-400 mt-1">Gerencie seus orçamentos e propostas</p>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700">
                  <Plus className="w-4 h-4 mr-2" />
                  Novo Orçamento
                  <ChevronDown className="w-4 h-4 ml-2" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-zinc-900 border-zinc-800">
                <DropdownMenuItem 
                  onClick={() => navigate('/orcamentos/novo')}
                  className="cursor-pointer hover:bg-zinc-800"
                >
                  <Grid3X3 className="w-4 h-4 mr-2 text-purple-400" />
                  <div>
                    <p className="font-medium">Com Grid de Itens</p>
                    <p className="text-xs text-zinc-400">Tabela de preços + PU1/PU2</p>
                  </div>
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => navigate('/precificacao')}
                  className="cursor-pointer hover:bg-zinc-800"
                >
                  <Calculator className="w-4 h-4 mr-2 text-blue-400" />
                  <div>
                    <p className="font-medium">Precificação Clássica</p>
                    <p className="text-xs text-zinc-400">Por m², hora ou valor fechado</p>
                  </div>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
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
                      <SelectItem value="RASCUNHO">Rascunho</SelectItem>
                      <SelectItem value="ENVIADO">Enviado</SelectItem>
                      <SelectItem value="APROVADO">Aprovado</SelectItem>
                      <SelectItem value="NAO_APROVADO">Não Aprovado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex-1 min-w-[200px]">
                  <Label>Cliente</Label>
                  <Input
                    value={filterCliente}
                    onChange={(e) => setFilterCliente(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && fetchOrcamentos()}
                    placeholder="Buscar por nome"
                    className="bg-zinc-800 border-zinc-700"
                  />
                </div>

                <div className="flex items-end">
                  <Button onClick={fetchOrcamentos} variant="outline" className="border-zinc-700">
                    Filtrar
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tabela */}
          <Card className="bg-zinc-900 border-zinc-800">
            <CardContent className="pt-6">
              {loading ? (
                <div className="text-center py-8 text-zinc-400">Carregando orçamentos...</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="border-zinc-800">
                      <TableHead>Número</TableHead>
                      <TableHead>Cliente</TableHead>
                      <TableHead>Descrição</TableHead>
                      <TableHead>Valor</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Data</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {orcamentos.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center text-zinc-500 py-8">
                          Nenhum orçamento encontrado
                        </TableCell>
                      </TableRow>
                    ) : (
                      orcamentos.map((orcamento) => (
                        <TableRow key={orcamento.id} className="border-zinc-800">
                          <TableCell className="font-medium">{orcamento.numero_orcamento}</TableCell>
                          <TableCell>{orcamento.cliente_nome}</TableCell>
                          <TableCell className="max-w-[200px] truncate">
                            {orcamento.descricao_servico_ou_produto}
                          </TableCell>
                          <TableCell className="font-medium text-green-500">
                            R$ {parseFloat(orcamento.preco_praticado).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </TableCell>
                          <TableCell>{getStatusBadge(orcamento.status)}</TableCell>
                          <TableCell>
                            {orcamento.created_at ? new Date(orcamento.created_at).toLocaleDateString('pt-BR') : '-'}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => navigate(`/orcamento/${orcamento.id}`)}
                                className="border-zinc-700"
                                title="Visualizar"
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                              
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => navigate(`/orcamentos/novo?id=${orcamento.id}`)}
                                className="border-purple-600 text-purple-600 hover:bg-purple-600 hover:text-white"
                                title="Editar"
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleDownloadPDF(orcamento.id, orcamento.numero_orcamento)}
                                className="border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white"
                                title="Baixar PDF"
                              >
                                <Download className="w-4 h-4" />
                              </Button>
                              
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleEnviarWhatsApp(orcamento)}
                                className="border-green-600 text-green-600 hover:bg-green-600 hover:text-white"
                                title="Enviar WhatsApp"
                              >
                                <MessageCircle className="w-4 h-4" />
                              </Button>
                              
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleDelete(orcamento.id)}
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
    </div>
  );
};

export default Orcamentos;