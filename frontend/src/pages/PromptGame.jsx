import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Target, ArrowLeft, Trophy, Send, CheckCircle2, XCircle } from 'lucide-react';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const PromptGame = () => {
  const navigate = useNavigate();
  const [challenges, setChallenges] = useState([]);
  const [currentChallenge, setCurrentChallenge] = useState(null);
  const [prompt, setPrompt] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [leaderboard, setLeaderboard] = useState([]);
  const [showLeaderboard, setShowLeaderboard] = useState(false);

  useEffect(() => {
    fetchChallenges();
    fetchLeaderboard();
  }, []);

  const fetchChallenges = async () => {
    try {
      const token = localStorage.getItem('synergi_token');
      const response = await axios.get(`${API}/game/challenges`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setChallenges(response.data.challenges);
      if (response.data.challenges.length > 0) {
        setCurrentChallenge(response.data.challenges[0]);
      }
    } catch (error) {
      console.error('Error fetching challenges:', error);
      toast.error('Erro ao carregar desafios');
    }
  };

  const fetchLeaderboard = async () => {
    try {
      const token = localStorage.getItem('synergi_token');
      const response = await axios.get(`${API}/game/leaderboard`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setLeaderboard(response.data);
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
    }
  };

  const submitPrompt = async () => {
    if (!prompt.trim()) {
      toast.error('Digite um prompt antes de enviar');
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const token = localStorage.getItem('synergi_token');
      const response = await axios.post(
        `${API}/game/submit`,
        {
          challenge_id: currentChallenge.id,
          prompt: prompt
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      setResult(response.data);
      if (response.data.passed) {
        toast.success('Parabéns! Você passou no desafio!');
      } else {
        toast.info('Continue tentando! Você pode melhorar.');
      }
      
      // Refresh leaderboard
      fetchLeaderboard();
    } catch (error) {
      console.error('Error submitting prompt:', error);
      toast.error('Erro ao enviar prompt');
    } finally {
      setLoading(false);
    }
  };

  const nextChallenge = () => {
    const currentIndex = challenges.findIndex(c => c.id === currentChallenge.id);
    if (currentIndex < challenges.length - 1) {
      setCurrentChallenge(challenges[currentIndex + 1]);
      setPrompt('');
      setResult(null);
    } else {
      toast.success('Você completou todos os desafios!');
    }
  };

  return (
    <div className="min-h-screen" data-testid="prompt-game-page">
      {/* Header */}
      <header className="glass border-b border-cyan-400/20">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/dashboard')}
              className="text-purple-400 hover:bg-purple-400/10"
              data-testid="back-to-dashboard-btn"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <Target className="w-8 h-8 text-purple-400" />
            <div>
              <h1 className="text-xl font-bold text-purple-400">Prompt Challenge Game</h1>
              <p className="text-xs text-gray-400">Teste suas habilidades</p>
            </div>
          </div>
          <Button
            variant="outline"
            onClick={() => setShowLeaderboard(!showLeaderboard)}
            className="border-purple-400 text-purple-400 hover:bg-purple-400/10"
            data-testid="toggle-leaderboard-btn"
          >
            <Trophy className="w-4 h-4 mr-2" />
            Leaderboard
          </Button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Challenge Area */}
          <div className="lg:col-span-2 space-y-6">
            {currentChallenge && (
              <>
                {/* Challenge Info */}
                <Card className="glass p-8 border-purple-400/20" data-testid="challenge-card">
                  <div className="flex items-start justify-between mb-6">
                    <div>
                      <span className="text-sm text-purple-400 font-semibold">Nível {currentChallenge.level}</span>
                      <h2 className="text-3xl font-bold text-white mt-1" data-testid="challenge-title">
                        {currentChallenge.title}
                      </h2>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-lg font-semibold text-white mb-2">Descrição:</h3>
                      <p className="text-gray-300">{currentChallenge.description}</p>
                    </div>
                    
                    <div>
                      <h3 className="text-lg font-semibold text-white mb-2">Cenário:</h3>
                      <p className="text-gray-300">{currentChallenge.scenario}</p>
                    </div>
                    
                    <div>
                      <h3 className="text-lg font-semibold text-white mb-2">Requisitos:</h3>
                      <ul className="list-disc list-inside text-gray-300 space-y-1">
                        {currentChallenge.requirements.map((req, idx) => (
                          <li key={idx}>{req}</li>
                        ))}
                      </ul>
                    </div>
                    
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-gray-400">Pontuação mínima:</span>
                      <span className="text-purple-400 font-bold">{currentChallenge.min_score}/100</span>
                    </div>
                  </div>
                </Card>

                {/* Prompt Input */}
                <Card className="glass p-6 border-purple-400/20">
                  <h3 className="text-lg font-semibold text-white mb-4">Seu Prompt:</h3>
                  <Textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="Digite seu prompt aqui..."
                    className="min-h-[150px] bg-white/5 border-purple-400/30 text-white focus:border-purple-400"
                    data-testid="prompt-input"
                  />
                  <div className="flex gap-3 mt-4">
                    <Button
                      onClick={submitPrompt}
                      disabled={loading || !prompt.trim()}
                      className="flex-1 bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-700 hover:to-pink-600"
                      data-testid="submit-prompt-btn"
                    >
                      {loading ? (
                        <div className="spinner mx-auto" style={{ width: '20px', height: '20px', borderWidth: '2px' }}></div>
                      ) : (
                        <>
                          <Send className="w-4 h-4 mr-2" />
                          Enviar Prompt
                        </>
                      )}
                    </Button>
                  </div>
                </Card>

                {/* Result */}
                {result && (
                  <Card className={`glass p-6 border-2 ${
                    result.passed ? 'border-green-400/50' : 'border-yellow-400/50'
                  }`} data-testid="result-card">
                    <div className="flex items-start gap-4">
                      {result.passed ? (
                        <CheckCircle2 className="w-8 h-8 text-green-400 flex-shrink-0" />
                      ) : (
                        <XCircle className="w-8 h-8 text-yellow-400 flex-shrink-0" />
                      )}
                      <div className="flex-1">
                        <h3 className="text-xl font-bold text-white mb-2">
                          Pontuação: <span data-testid="result-score">{result.score}/100</span>
                        </h3>
                        <p className="text-gray-300 mb-4" data-testid="result-feedback">{result.feedback}</p>
                        {result.passed && (
                          <Button
                            onClick={nextChallenge}
                            className="bg-gradient-to-r from-green-600 to-emerald-500"
                            data-testid="next-challenge-btn"
                          >
                            Próximo Desafio
                          </Button>
                        )}
                      </div>
                    </div>
                  </Card>
                )}
              </>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Challenge List */}
            <Card className="glass p-6 border-purple-400/20">
              <h3 className="text-lg font-bold text-white mb-4">Todos os Desafios</h3>
              <ScrollArea className="h-[300px]">
                <div className="space-y-2">
                  {challenges.map((challenge) => (
                    <button
                      key={challenge.id}
                      onClick={() => {
                        setCurrentChallenge(challenge);
                        setPrompt('');
                        setResult(null);
                      }}
                      className={`w-full text-left p-3 rounded-lg transition-all ${
                        currentChallenge?.id === challenge.id
                          ? 'bg-purple-500/20 border border-purple-400'
                          : 'bg-white/5 hover:bg-white/10 border border-transparent'
                      }`}
                      data-testid={`challenge-item-${challenge.id}`}
                    >
                      <div className="text-sm text-purple-400 font-semibold">Nível {challenge.level}</div>
                      <div className="text-white font-medium">{challenge.title}</div>
                    </button>
                  ))}
                </div>
              </ScrollArea>
            </Card>

            {/* Leaderboard */}
            {showLeaderboard && (
              <Card className="glass p-6 border-purple-400/20" data-testid="leaderboard">
                <div className="flex items-center gap-2 mb-4">
                  <Trophy className="w-5 h-5 text-yellow-400" />
                  <h3 className="text-lg font-bold text-white">Top 10</h3>
                </div>
                <ScrollArea className="h-[300px]">
                  <div className="space-y-2">
                    {leaderboard.map((entry, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 bg-white/5 rounded-lg"
                        data-testid={`leaderboard-entry-${index}`}
                      >
                        <div className="flex items-center gap-3">
                          <span className={`font-bold ${
                            index === 0 ? 'text-yellow-400' :
                            index === 1 ? 'text-gray-300' :
                            index === 2 ? 'text-orange-400' :
                            'text-gray-400'
                          }`}>
                            #{entry.rank}
                          </span>
                          <span className="text-white">{entry.username}</span>
                        </div>
                        <span className="text-purple-400 font-bold">{entry.score}</span>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PromptGame;