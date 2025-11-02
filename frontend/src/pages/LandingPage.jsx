import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Brain, Zap, Target, Award, BookOpen, Users } from 'lucide-react';

const LandingPage = () => {
  const navigate = useNavigate();

  const features = [
    {
      icon: <Brain className="w-12 h-12 text-cyan-400" />,
      title: "AI Tutor Pro",
      description: "Tutoria de IA 24/7 para dominar engenharia de prompt e conceitos avançados de IA"
    },
    {
      icon: <Target className="w-12 h-12 text-cyan-400" />,
      title: "Prompt Challenge Game",
      description: "Jogos dinâmicos com pontuação e leaderboards para testar suas habilidades de prompt"
    },
    {
      icon: <BookOpen className="w-12 h-12 text-cyan-400" />,
      title: "Avaliações Adaptativas",
      description: "Avaliações personalizadas que testam ativamente seu conhecimento sobre IA"
    }
  ];

  const methodology = [
    {
      icon: <Zap className="w-8 h-8 text-cyan-400" />,
      title: "Aprendizado Prático",
      description: "Exercícios hands-on e desafios reais"
    },
    {
      icon: <Award className="w-8 h-8 text-cyan-400" />,
      title: "Feedback Instantâneo",
      description: "Avaliação em tempo real com IA"
    },
    {
      icon: <Users className="w-8 h-8 text-cyan-400" />,
      title: "Comunidade Ativa",
      description: "Compete e aprenda com outros usuários"
    }
  ];

  return (
    <div className="min-h-screen">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-600 to-cyan-400 flex items-center justify-center">
              <Brain className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold gradient-text">Synergi AI</span>
          </div>
          <div className="flex gap-4">
            <Button
              variant="ghost"
              className="text-cyan-400 hover:bg-cyan-400/10"
              onClick={() => navigate('/login')}
              data-testid="nav-login-btn"
            >
              Login
            </Button>
            <Button
              className="bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600"
              onClick={() => navigate('/signup')}
              data-testid="nav-signup-btn"
            >
              Começar Grátis
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-7xl mx-auto text-center">
          <div className="mb-8 fade-in-up">
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold mb-6 leading-tight">
              <span className="gradient-text">
                A Sinergia da Mente Humana
              </span>
              <br />
              <span className="text-white">
                com a Inteligência Artificial
              </span>
            </h1>
            <p className="text-xl sm:text-2xl text-cyan-400 font-light mb-8">
              Domine o futuro do Prompt.
            </p>
            <p className="text-lg text-gray-300 max-w-3xl mx-auto mb-12">
              Aprenda engenharia de prompt de forma prática e gratuita.
              Desenvolva a sinergia perfeita entre criatividade humana e capacidades de IA.
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button
              size="lg"
              className="bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 text-lg px-8 py-6 glow-animation"
              onClick={() => navigate('/signup')}
              data-testid="hero-cta-btn"
            >
              <Brain className="w-5 h-5 mr-2" />
              Começar Agora - Grátis
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-2 border-cyan-400 text-cyan-400 hover:bg-cyan-400/10 text-lg px-8 py-6"
              onClick={() => document.getElementById('features').scrollIntoView({ behavior: 'smooth' })}
              data-testid="learn-more-btn"
            >
              Saiba Mais
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-4xl sm:text-5xl font-bold text-center mb-16 gradient-text">
            Três Pilares Interativos
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card
                key={index}
                className="glass p-8 hover:scale-105 transition-transform duration-300 border-cyan-400/20"
                data-testid={`feature-card-${index}`}
              >
                <div className="mb-6 float-animation">{feature.icon}</div>
                <h3 className="text-2xl font-bold mb-4 text-white">{feature.title}</h3>
                <p className="text-gray-300 leading-relaxed">{feature.description}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Methodology Section */}
      <section className="py-20 px-6 bg-gradient-to-b from-transparent to-blue-950/20">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-4xl sm:text-5xl font-bold text-center mb-6 gradient-text">
            Nossa Metodologia
          </h2>
          <p className="text-center text-xl text-gray-300 mb-16 max-w-3xl mx-auto">
            Aprendizado personalizado e guiado por IA para maximizar seu potencial
          </p>
          
          <div className="grid md:grid-cols-3 gap-8">
            {methodology.map((item, index) => (
              <div
                key={index}
                className="glass p-8 rounded-lg text-center hover:border-cyan-400/40 transition-all duration-300"
                data-testid={`methodology-${index}`}
              >
                <div className="flex justify-center mb-4">{item.icon}</div>
                <h3 className="text-xl font-bold mb-3 text-white">{item.title}</h3>
                <p className="text-gray-300">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto text-center glass p-12 rounded-2xl">
          <h2 className="text-4xl sm:text-5xl font-bold mb-6 gradient-text">
            Pronto para Dominar o Futuro?
          </h2>
          <p className="text-xl text-gray-300 mb-8">
            Junte-se a milhares de estudantes aprendendo engenharia de prompt
          </p>
          <Button
            size="lg"
            className="bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 text-lg px-12 py-6 glow-animation"
            onClick={() => navigate('/signup')}
            data-testid="cta-signup-btn"
          >
            Criar Conta Gratuita
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-cyan-400/20">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-3 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-600 to-cyan-400 flex items-center justify-center">
                  <Brain className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-bold gradient-text">Synergi AI</span>
              </div>
              <p className="text-gray-400 text-sm">
                Plataforma gratuita de aprendizado de IA
              </p>
            </div>
            
            <div>
              <h4 className="text-white font-bold mb-3">Legal</h4>
              <ul className="space-y-2">
                <li>
                  <a href="/TOS.html" target="_blank" className="text-gray-400 hover:text-cyan-400 transition-colors text-sm" data-testid="tos-link">
                    Termos de Uso
                  </a>
                </li>
                <li>
                  <a href="/Privacy.html" target="_blank" className="text-gray-400 hover:text-cyan-400 transition-colors text-sm" data-testid="privacy-link">
                    Política de Privacidade
                  </a>
                </li>
                <li>
                  <a href="/LICENSE.md" target="_blank" className="text-gray-400 hover:text-cyan-400 transition-colors text-sm" data-testid="license-link">
                    Licença CC BY-NC-SA 4.0
                  </a>
                </li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-white font-bold mb-3">Isenção de Responsabilidade</h4>
              <p className="text-gray-400 text-xs leading-relaxed">
                As ferramentas de IA podem gerar imprecisões ocasionais. 
                A Synergi AI não se responsabiliza por decisões tomadas com base nas respostas fornecidas.
                Use sempre seu julgamento crítico.
              </p>
            </div>
          </div>
          
          <div className="text-center pt-8 border-t border-cyan-400/10">
            <p className="text-gray-400 text-sm">
              © 2025 Synergi AI. Conteúdo educacional sob licença Creative Commons CC BY-NC-SA 4.0.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;