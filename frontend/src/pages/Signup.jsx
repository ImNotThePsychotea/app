import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Brain } from 'lucide-react';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Signup = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await axios.post(`${API}/auth/signup`, formData);
      localStorage.setItem('synergi_token', response.data.access_token);
      localStorage.setItem('synergi_user', JSON.stringify(response.data.user));
      toast.success('Conta criada com sucesso!');
      navigate('/dashboard');
    } catch (error) {
      console.error('Signup error:', error);
      toast.error(error.response?.data?.detail || 'Erro ao criar conta');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-12">
      <Card className="glass max-w-md w-full p-8 border-cyan-400/20">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-600 to-cyan-400 flex items-center justify-center">
              <Brain className="w-10 h-10 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold gradient-text mb-2">Criar Conta</h1>
          <p className="text-gray-400">Comece sua jornada de aprendizado IA</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6" data-testid="signup-form">
          <div>
            <Label htmlFor="username" className="text-white mb-2 block">Nome de Usuário</Label>
            <Input
              id="username"
              name="username"
              type="text"
              required
              value={formData.username}
              onChange={handleChange}
              className="bg-white/5 border-cyan-400/30 text-white focus:border-cyan-400"
              placeholder="seu_nome"
              data-testid="signup-username-input"
            />
          </div>

          <div>
            <Label htmlFor="email" className="text-white mb-2 block">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              required
              value={formData.email}
              onChange={handleChange}
              className="bg-white/5 border-cyan-400/30 text-white focus:border-cyan-400"
              placeholder="seu@email.com"
              data-testid="signup-email-input"
            />
          </div>

          <div>
            <Label htmlFor="password" className="text-white mb-2 block">Senha</Label>
            <Input
              id="password"
              name="password"
              type="password"
              required
              minLength={6}
              value={formData.password}
              onChange={handleChange}
              className="bg-white/5 border-cyan-400/30 text-white focus:border-cyan-400"
              placeholder="••••••••"
              data-testid="signup-password-input"
            />
          </div>

          <Button
            type="submit"
            className="w-full bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 py-6"
            disabled={loading}
            data-testid="signup-submit-btn"
          >
            {loading ? (
              <div className="spinner mx-auto" style={{ width: '20px', height: '20px', borderWidth: '2px' }}></div>
            ) : (
              'Criar Conta'
            )}
          </Button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-gray-400">
            Já tem uma conta?{' '}
            <button
              onClick={() => navigate('/login')}
              className="text-cyan-400 hover:text-cyan-300 font-semibold"
              data-testid="goto-login-btn"
            >
              Faça login
            </button>
          </p>
        </div>

        <div className="mt-4 text-center">
          <button
            onClick={() => navigate('/')}
            className="text-gray-500 hover:text-gray-400 text-sm"
            data-testid="back-home-btn"
          >
            ← Voltar para home
          </button>
        </div>
      </Card>
    </div>
  );
};

export default Signup;