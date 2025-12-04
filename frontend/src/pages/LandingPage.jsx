import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { axiosInstance } from '../App';
import { toast } from 'sonner';
import { TrendingUp, Shield, Zap, BarChart3, MessageCircle, Check, Star, Play } from 'lucide-react';

const LandingPage = ({ setUser }) => {
  const [registerData, setRegisterData] = useState({ 
    name: '', 
    email: '', 
    password: '', 
    whatsapp: '', 
    company_name: '' 
  });
  const [loginData, setLoginData] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await axiosInstance.post('/auth/register', registerData);
      toast.success(`Registro realizado! ${response.data.trial_days} dias de trial grátis!`);
      
      // Fazer login automático
      const loginResponse = await axiosInstance.post('/auth/login', {
        email: registerData.email,
        password: registerData.password,
      });
      
      const userData = loginResponse.data;
      localStorage.setItem('user', JSON.stringify(userData));
      setUser(userData);
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Erro ao registrar');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await axiosInstance.post('/auth/login', loginData);
      const userData = response.data;
      localStorage.setItem('user', JSON.stringify(userData));
      setUser(userData);
      toast.success('Login realizado com sucesso!');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Erro ao fazer login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16 flex-1 flex flex-col items-center justify-center">
        <div className="text-center mb-12 space-y-6">
          <h1 className="text-6xl font-bold gradient-text mb-4" data-testid="landing-title">
            Lucro Líquido
          </h1>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto" data-testid="landing-subtitle">
            Gestão Financeira Inteligente para seu Negócio
          </p>
          <p className="text-lg text-gray-400" data-testid="landing-description">
            Controle receitas, custos e despesas com análise de IA
          </p>
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12 max-w-5xl">
          <div className="glass p-6 rounded-lg text-center hover-lift" data-testid="feature-card-metrics">
            <BarChart3 className="w-12 h-12 mx-auto mb-3 text-purple-400" />
            <h3 className="font-semibold text-white mb-2">Métricas em Tempo Real</h3>
            <p className="text-sm text-gray-400">Acompanhe KPIs importantes</p>
          </div>
          <div className="glass p-6 rounded-lg text-center hover-lift" data-testid="feature-card-ai">
            <Zap className="w-12 h-12 mx-auto mb-3 text-blue-400" />
            <h3 className="font-semibold text-white mb-2">Análise com IA</h3>
            <p className="text-sm text-gray-400">Insights com ChatGPT</p>
          </div>
          <div className="glass p-6 rounded-lg text-center hover-lift" data-testid="feature-card-goals">
            <TrendingUp className="w-12 h-12 mx-auto mb-3 text-green-400" />
            <h3 className="font-semibold text-white mb-2">Metas Mensais</h3>
            <p className="text-sm text-gray-400">Defina e acompanhe metas</p>
          </div>
          <div className="glass p-6 rounded-lg text-center hover-lift" data-testid="feature-card-security">
            <Shield className="w-12 h-12 mx-auto mb-3 text-yellow-400" />
            <h3 className="font-semibold text-white mb-2">Seguro e Confiável</h3>
            <p className="text-sm text-gray-400">Seus dados protegidos</p>
          </div>
        </div>

        {/* Auth Tabs */}
        <Card className="w-full max-w-md glass border-white/10" data-testid="auth-card">
          <CardHeader>
            <CardTitle className="text-2xl text-center text-white">Começar Agora</CardTitle>
            <CardDescription className="text-center text-gray-400">
              7 dias grátis, sem cartão de crédito
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="register" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6" data-testid="auth-tabs">
                <TabsTrigger value="register" data-testid="register-tab">Registrar</TabsTrigger>
                <TabsTrigger value="login" data-testid="login-tab">Entrar</TabsTrigger>
              </TabsList>

              <TabsContent value="register">
                <form onSubmit={handleRegister} className="space-y-4" data-testid="register-form">
                  <div>
                    <Label htmlFor="register-name" className="text-gray-300">Nome Completo</Label>
                    <Input
                      id="register-name"
                      data-testid="register-name-input"
                      type="text"
                      placeholder="Seu nome"
                      value={registerData.name}
                      onChange={(e) => setRegisterData({ ...registerData, name: e.target.value })}
                      required
                      className="bg-white/5 border-white/10 text-white"
                    />
                  </div>
                  <div>
                    <Label htmlFor="register-email" className="text-gray-300">Email</Label>
                    <Input
                      id="register-email"
                      data-testid="register-email-input"
                      type="email"
                      placeholder="seu@email.com"
                      value={registerData.email}
                      onChange={(e) => setRegisterData({ ...registerData, email: e.target.value })}
                      required
                      className="bg-white/5 border-white/10 text-white"
                    />
                  </div>
                  <div>
                    <Label htmlFor="register-password" className="text-gray-300">Senha</Label>
                    <Input
                      id="register-password"
                      data-testid="register-password-input"
                      type="password"
                      placeholder="Mínimo 6 caracteres"
                      value={registerData.password}
                      onChange={(e) => setRegisterData({ ...registerData, password: e.target.value })}
                      required
                      className="bg-white/5 border-white/10 text-white"
                    />
                  </div>
                  <Button
                    type="submit"
                    data-testid="register-submit-button"
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                  >
                    {loading ? 'Registrando...' : 'Começar Trial Grátis'}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="login">
                <form onSubmit={handleLogin} className="space-y-4" data-testid="login-form">
                  <div>
                    <Label htmlFor="login-email" className="text-gray-300">Email</Label>
                    <Input
                      id="login-email"
                      data-testid="login-email-input"
                      type="email"
                      placeholder="seu@email.com"
                      value={loginData.email}
                      onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                      required
                      className="bg-white/5 border-white/10 text-white"
                    />
                  </div>
                  <div>
                    <Label htmlFor="login-password" className="text-gray-300">Senha</Label>
                    <Input
                      id="login-password"
                      data-testid="login-password-input"
                      type="password"
                      placeholder="Sua senha"
                      value={loginData.password}
                      onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                      required
                      className="bg-white/5 border-white/10 text-white"
                    />
                  </div>
                  <Button
                    type="submit"
                    data-testid="login-submit-button"
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                  >
                    {loading ? 'Entrando...' : 'Entrar'}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default LandingPage;