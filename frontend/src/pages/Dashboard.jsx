import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Brain, Target, BookOpen, Trophy, LogOut, Zap } from 'lucide-react';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Dashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [progress, setProgress] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      const token = localStorage.getItem('synergi_token');
      const config = {
        headers: { Authorization: `Bearer ${token}` }
      };

      const [userRes, progressRes] = await Promise.all([
        axios.get(`${API}/auth/me`, config),
        axios.get(`${API}/user/progress`, config)
      ]);

      setUser(userRes.data);
      setProgress(progressRes.data);
    } catch (error) {
      console.error('Error fetching user data:', error);
      if (error.response?.status === 401) {
        toast.error('Sessão expirada. Faça login novamente.');
        handleLogout();
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('synergi_token');
    localStorage.removeItem('synergi_user');
    navigate('/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="spinner"></div>
      </div>
    );
  }

  const tools = [
    {
      icon: <Brain className="w-12 h-12 text-cyan-400" />,
      title: "AI Tutor Pro",
      description: "Converse com seu tutor de IA pessoal",
      path: "/ai-tutor",
      color: "from-blue-600 to-cyan-500",
      testId: "tool-ai-tutor"
    },
    {
      icon: <Target className="w-12 h-12 text-purple-400" />,
      title: "Prompt Challenge",
      description: "Teste suas habilidades em desafios",
      path: "/prompt-game",
      color: "from-purple-600 to-pink-500",
      testId: "tool-prompt-game"
    },
    {
      icon: <BookOpen className="w-12 h-12 text-green-400" />,
      title: "Avaliações",
      description: "Teste seu conhecimento",
      path: "/quiz/beginner",
      color: "from-green-600 to-emerald-500",
      testId: "tool-quiz"
    }
  ];

  return (
    <div className="min-h-screen" data-testid="dashboard">
      {/* Header */}
      <header className="glass border-b border-cyan-400/20">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-600 to-cyan-400 flex items-center justify-center">
              <Brain className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold gradient-text">Synergi AI</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-sm text-gray-400">Olá,</p>
              <p className="text-white font-semibold" data-testid="user-username">{user?.username}</p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleLogout}
              className="text-gray-400 hover:text-red-400"
              data-testid="logout-btn"
            >
              <LogOut className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Stats Section */}
        <div className="mb-12 fade-in-up">
          <h1 className="text-4xl font-bold mb-8 gradient-text">Seu Painel</h1>
          
          <div className="grid md:grid-cols-3 gap-6">
            <Card className="glass p-6 border-cyan-400/20">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-cyan-500/20 rounded-lg">
                  <Trophy className="w-8 h-8 text-cyan-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-400">Pontuação Total</p>
                  <p className="text-3xl font-bold text-white" data-testid="total-score">
                    {progress?.score || 0}
                  </p>
                </div>
              </div>
            </Card>

            <Card className="glass p-6 border-cyan-400/20">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-purple-500/20 rounded-lg">
                  <Target className="w-8 h-8 text-purple-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-400">Desafios Completos</p>
                  <p className="text-3xl font-bold text-white" data-testid="challenges-completed">
                    {progress?.completed_challenges?.length || 0}
                  </p>
                </div>
              </div>
            </Card>

            <Card className="glass p-6 border-cyan-400/20">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-green-500/20 rounded-lg">
                  <Zap className="w-8 h-8 text-green-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-400">Nível</p>
                  <p className="text-3xl font-bold text-white capitalize" data-testid="user-level">
                    {user?.level || 'beginner'}
                  </p>
                </div>
              </div>
            </Card>
          </div>
        </div>

        {/* Tools Section */}
        <div>
          <h2 className="text-3xl font-bold mb-6 text-white">Ferramentas de Aprendizado</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {tools.map((tool, index) => (
              <Card
                key={index}
                className="glass p-8 hover:scale-105 transition-all duration-300 cursor-pointer border-cyan-400/20"
                onClick={() => navigate(tool.path)}
                data-testid={tool.testId}
              >
                <div className="mb-6 float-animation">{tool.icon}</div>
                <h3 className="text-2xl font-bold mb-3 text-white">{tool.title}</h3>
                <p className="text-gray-300 mb-6">{tool.description}</p>
                <Button
                  className={`w-full bg-gradient-to-r ${tool.color} hover:opacity-90`}
                  data-testid={`${tool.testId}-btn`}
                >
                  Acessar
                </Button>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;