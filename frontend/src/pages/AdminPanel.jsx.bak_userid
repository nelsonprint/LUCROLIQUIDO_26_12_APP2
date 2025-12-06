import React, { useState, useEffect } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { axiosInstance } from '../App';
import { toast } from 'sonner';
import { Users, TrendingUp, DollarSign, Building, BarChart as BarChartIcon } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useNavigate } from 'react-router-dom';

const AdminPanel = ({ user, onLogout }) => {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [subscriptions, setSubscriptions] = useState([]);
  const [revenueChart, setRevenueChart] = useState([]);
  const [filterStatus, setFilterStatus] = useState('all');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Verificar se é admin
    if (user.role !== 'admin') {
      toast.error('Acesso negado. Apenas administradores.');
      navigate('/dashboard');
      return;
    }

    fetchStats();
    fetchUsers();
    fetchSubscriptions();
    fetchRevenueChart();
  }, [user, navigate]);

  const fetchStats = async () => {
    try {
      const response = await axiosInstance.get(`/admin/stats?user_id=${user.user_id}`);
      setStats(response.data);
    } catch (error) {
      toast.error('Erro ao carregar estatísticas');
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await axiosInstance.get(`/admin/users?user_id=${user.user_id}`);
      setUsers(response.data);
    } catch (error) {
      toast.error('Erro ao carregar usuários');
    }
  };

  const fetchSubscriptions = async () => {
    try {
      const status = filterStatus === 'all' ? '' : filterStatus;
      const response = await axiosInstance.get(
        `/admin/subscriptions?user_id=${user.user_id}${status ? `&status=${status}` : ''}`
      );
      setSubscriptions(response.data);
    } catch (error) {
      toast.error('Erro ao carregar assinaturas');
    }
  };

  const fetchRevenueChart = async () => {
    try {
      const response = await axiosInstance.get(`/admin/revenue-chart?admin_user_id=${user.user_id}`);
      setRevenueChart(response.data);
    } catch (error) {
      console.error('Erro ao carregar gráfico:', error);
    }
  };

  const toggleUserStatus = async (targetUserId) => {
    setLoading(true);

    try {
      const response = await axiosInstance.post(
        `/admin/user/${targetUserId}/toggle-status?admin_user_id=${user.user_id}`
      );
      toast.success(response.data.message);
      fetchUsers();
      fetchSubscriptions();
      fetchStats();
    } catch (error) {
      toast.error('Erro ao alterar status');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user.role === 'admin') {
      fetchSubscriptions();
    }
  }, [filterStatus]);

  const getStatusBadgeColor = (status) => {
    const colors = {
      trial: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/50',
      active: 'bg-green-500/20 text-green-300 border-green-500/50',
      expired: 'bg-red-500/20 text-red-300 border-red-500/50',
      cancelled: 'bg-gray-500/20 text-gray-300 border-gray-500/50',
    };
    return colors[status] || 'bg-gray-500/20 text-gray-300 border-gray-500/50';
  };

  const getStatusLabel = (status) => {
    const labels = {
      trial: 'Trial',
      active: 'Ativo',
      expired: 'Expirado',
      cancelled: 'Cancelado',
    };
    return labels[status] || status;
  };

  if (user.role !== 'admin') {
    return null;
  }

  return (
    <div className="flex min-h-screen" data-testid="admin-panel-page">
      <Sidebar user={user} onLogout={onLogout} />

      <div className="flex-1 p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2" data-testid="admin-panel-title">
            Painel Administrativo
          </h1>
          <p className="text-gray-400">Visão completa do sistema</p>
        </div>

        {/* KPIs */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card className="glass border-white/10 hover-lift" data-testid="admin-kpi-users">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-400 flex items-center">
                  <Users className="mr-2" size={18} />
                  Total de Usuários
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-white">{stats.total_users}</p>
              </CardContent>
            </Card>

            <Card className="glass border-white/10 hover-lift" data-testid="admin-kpi-active-subs">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-400 flex items-center">
                  <TrendingUp className="mr-2" size={18} />
                  Assinaturas Ativas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-white">{stats.active_subscriptions}</p>
              </CardContent>
            </Card>

            <Card className="glass border-white/10 hover-lift" data-testid="admin-kpi-mrr">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-400 flex items-center">
                  <DollarSign className="mr-2" size={18} />
                  MRR (Mensal)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-white">
                  R$ {stats.mrr.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </CardContent>
            </Card>

            <Card className="glass border-white/10 hover-lift" data-testid="admin-kpi-arr">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-400 flex items-center">
                  <DollarSign className="mr-2" size={18} />
                  ARR (Anual)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-white">
                  R$ {stats.arr.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Gráfico de Receita */}
        <Card className="glass border-white/10 mb-8" data-testid="admin-revenue-chart">
          <CardHeader>
            <CardTitle className="text-white flex items-center">
              <BarChartIcon className="mr-2" />
              Evolução do MRR
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={revenueChart}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="month" stroke="#9CA3AF" />
                <YAxis stroke="#9CA3AF" />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151' }}
                  labelStyle={{ color: '#F3F4F6' }}
                />
                <Bar dataKey="revenue" fill="#7C3AED" name="Receita (R$)" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs defaultValue="users" className="w-full" data-testid="admin-tabs">
          <TabsList className="glass border-white/10 mb-6">
            <TabsTrigger value="users" data-testid="admin-tab-users">Usuários</TabsTrigger>
            <TabsTrigger value="subscriptions" data-testid="admin-tab-subscriptions">Assinaturas</TabsTrigger>
          </TabsList>

          {/* Tab Usuários */}
          <TabsContent value="users">
            <Card className="glass border-white/10" data-testid="admin-users-table">
              <CardHeader>
                <CardTitle className="text-white">Gestão de Usuários ({users.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow className="border-white/10 hover:bg-white/5">
                      <TableHead className="text-gray-300">Nome</TableHead>
                      <TableHead className="text-gray-300">Email</TableHead>
                      <TableHead className="text-gray-300">Cadastro</TableHead>
                      <TableHead className="text-gray-300">Status</TableHead>
                      <TableHead className="text-gray-300">Empresas</TableHead>
                      <TableHead className="text-gray-300 text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((u) => (
                      <TableRow key={u.id} className="border-white/10 hover:bg-white/5" data-testid={`user-row-${u.id}`}>
                        <TableCell className="text-white font-medium">{u.name}</TableCell>
                        <TableCell className="text-gray-400">{u.email}</TableCell>
                        <TableCell className="text-gray-400">
                          {new Date(u.created_at).toLocaleDateString('pt-BR')}
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusBadgeColor(u.subscription_status)}>
                            {getStatusLabel(u.subscription_status)}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-gray-300">{u.companies_count}</TableCell>
                        <TableCell className="text-right">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => toggleUserStatus(u.id)}
                            disabled={loading}
                            data-testid={`toggle-user-${u.id}`}
                            className={
                              u.subscription_status === 'active'
                                ? 'border-red-500/50 text-red-400 hover:bg-red-500/10'
                                : 'border-green-500/50 text-green-400 hover:bg-green-500/10'
                            }
                          >
                            {u.subscription_status === 'active' ? 'Desativar' : 'Ativar'}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab Assinaturas */}
          <TabsContent value="subscriptions">
            <Card className="glass border-white/10" data-testid="admin-subscriptions-table">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle className="text-white">Gestão de Assinaturas ({subscriptions.length})</CardTitle>
                  <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger className="w-40 bg-white/5 border-white/10 text-white" data-testid="filter-status-select">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas</SelectItem>
                      <SelectItem value="trial">Trial</SelectItem>
                      <SelectItem value="active">Ativas</SelectItem>
                      <SelectItem value="expired">Expiradas</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow className="border-white/10 hover:bg-white/5">
                      <TableHead className="text-gray-300">Usuário</TableHead>
                      <TableHead className="text-gray-300">Email</TableHead>
                      <TableHead className="text-gray-300">Status</TableHead>
                      <TableHead className="text-gray-300">Início Trial</TableHead>
                      <TableHead className="text-gray-300">Fim Trial</TableHead>
                      <TableHead className="text-gray-300">Início Assinatura</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {subscriptions.map((sub) => (
                      <TableRow key={sub.id} className="border-white/10 hover:bg-white/5" data-testid={`subscription-row-${sub.id}`}>
                        <TableCell className="text-white font-medium">{sub.user_name}</TableCell>
                        <TableCell className="text-gray-400">{sub.user_email}</TableCell>
                        <TableCell>
                          <Badge className={getStatusBadgeColor(sub.status)}>
                            {getStatusLabel(sub.status)}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-gray-400">
                          {new Date(sub.trial_start).toLocaleDateString('pt-BR')}
                        </TableCell>
                        <TableCell className="text-gray-400">
                          {new Date(sub.trial_end).toLocaleDateString('pt-BR')}
                        </TableCell>
                        <TableCell className="text-gray-400">
                          {sub.subscription_start
                            ? new Date(sub.subscription_start).toLocaleDateString('pt-BR')
                            : '-'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminPanel;
