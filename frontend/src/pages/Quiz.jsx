import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { BookOpen, ArrowLeft, CheckCircle2, XCircle } from 'lucide-react';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Quiz = () => {
  const navigate = useNavigate();
  const { level } = useParams();
  const [quiz, setQuiz] = useState(null);
  const [answers, setAnswers] = useState({});
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchQuiz();
  }, [level]);

  const fetchQuiz = async () => {
    try {
      const token = localStorage.getItem('synergi_token');
      const response = await axios.get(`${API}/quiz/${level}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setQuiz(response.data);
      setAnswers({});
      setResult(null);
    } catch (error) {
      console.error('Error fetching quiz:', error);
      toast.error('Erro ao carregar quiz');
    }
  };

  const handleAnswerChange = (questionId, answerIndex) => {
    setAnswers({ ...answers, [questionId]: answerIndex });
  };

  const submitQuiz = async () => {
    if (Object.keys(answers).length < quiz.questions.length) {
      toast.error('Por favor, responda todas as questões');
      return;
    }

    setLoading(true);

    try {
      const token = localStorage.getItem('synergi_token');
      const formattedAnswers = Object.entries(answers).map(([questionId, answerIndex]) => ({
        question_id: questionId,
        selected_answer: String(answerIndex)
      }));

      const response = await axios.post(
        `${API}/quiz/submit`,
        {
          quiz_level: level,
          answers: formattedAnswers
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      setResult(response.data);
      if (response.data.passed) {
        toast.success(`Parabéns! Você passou com ${response.data.percentage.toFixed(0)}%`);
      } else {
        toast.info('Continue estudando para melhorar seu desempenho!');
      }
    } catch (error) {
      console.error('Error submitting quiz:', error);
      toast.error('Erro ao enviar respostas');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen" data-testid="quiz-page">
      {/* Header */}
      <header className="glass border-b border-cyan-400/20">
        <div className="max-w-5xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/dashboard')}
              className="text-green-400 hover:bg-green-400/10"
              data-testid="back-to-dashboard-btn"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <BookOpen className="w-8 h-8 text-green-400" />
            <div>
              <h1 className="text-xl font-bold text-green-400">Avaliação de Conhecimento</h1>
              <p className="text-xs text-gray-400 capitalize">Nível: {level}</p>
            </div>
          </div>
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => navigate('/quiz/beginner')}
              className={`border-green-400 hover:bg-green-400/10 ${
                level === 'beginner' ? 'bg-green-400/20 text-green-300' : 'text-green-400'
              }`}
              data-testid="beginner-level-btn"
            >
              Iniciante
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate('/quiz/advanced')}
              className={`border-green-400 hover:bg-green-400/10 ${
                level === 'advanced' ? 'bg-green-400/20 text-green-300' : 'text-green-400'
              }`}
              data-testid="advanced-level-btn"
            >
              Avançado
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-6 py-8">
        {quiz && !result ? (
          <div className="space-y-8" data-testid="quiz-questions">
            <Card className="glass p-6 border-green-400/20">
              <p className="text-gray-300 text-center">
                Responda todas as questões abaixo. Você precisa de pelo menos 70% para passar.
              </p>
            </Card>

            {quiz.questions.map((question, index) => (
              <Card key={question.id} className="glass p-8 border-green-400/20" data-testid={`question-${index}`}>
                <div className="mb-6">
                  <span className="text-green-400 font-semibold">Questão {index + 1}</span>
                  <h3 className="text-xl font-bold text-white mt-2">{question.question}</h3>
                </div>

                <RadioGroup
                  value={String(answers[question.id] ?? '')}
                  onValueChange={(value) => handleAnswerChange(question.id, parseInt(value))}
                >
                  <div className="space-y-3">
                    {question.options.map((option, optionIndex) => (
                      <div
                        key={optionIndex}
                        className="flex items-center space-x-3 p-4 rounded-lg bg-white/5 hover:bg-white/10 transition-colors cursor-pointer"
                        data-testid={`question-${index}-option-${optionIndex}`}
                      >
                        <RadioGroupItem value={String(optionIndex)} id={`${question.id}-${optionIndex}`} />
                        <Label
                          htmlFor={`${question.id}-${optionIndex}`}
                          className="text-white cursor-pointer flex-1"
                        >
                          {option}
                        </Label>
                      </div>
                    ))}
                  </div>
                </RadioGroup>
              </Card>
            ))}

            <div className="flex justify-center">
              <Button
                onClick={submitQuiz}
                disabled={loading || Object.keys(answers).length < quiz.questions.length}
                size="lg"
                className="bg-gradient-to-r from-green-600 to-emerald-500 hover:from-green-700 hover:to-emerald-600 px-12"
                data-testid="submit-quiz-btn"
              >
                {loading ? (
                  <div className="spinner mx-auto" style={{ width: '20px', height: '20px', borderWidth: '2px' }}></div>
                ) : (
                  'Enviar Respostas'
                )}
              </Button>
            </div>
          </div>
        ) : result ? (
          <Card className={`glass p-12 border-2 text-center ${
            result.passed ? 'border-green-400/50' : 'border-yellow-400/50'
          }`} data-testid="quiz-result">
            <div className="flex justify-center mb-6">
              {result.passed ? (
                <CheckCircle2 className="w-20 h-20 text-green-400" />
              ) : (
                <XCircle className="w-20 h-20 text-yellow-400" />
              )}
            </div>
            
            <h2 className="text-4xl font-bold text-white mb-4">
              {result.passed ? 'Parabéns!' : 'Quase lá!'}
            </h2>
            
            <div className="text-6xl font-bold gradient-text mb-6" data-testid="quiz-percentage">
              {result.percentage.toFixed(0)}%
            </div>
            
            <p className="text-xl text-gray-300 mb-2">
              Você acertou <span className="text-green-400 font-bold" data-testid="quiz-score">{result.score}</span> de {result.total} questões
            </p>
            
            <p className="text-gray-400 mb-8">
              {result.passed 
                ? 'Excelente trabalho! Você dominou este nível.' 
                : 'Continue estudando e tente novamente para melhorar seu desempenho.'}
            </p>
            
            <div className="flex gap-4 justify-center">
              <Button
                onClick={fetchQuiz}
                variant="outline"
                className="border-green-400 text-green-400 hover:bg-green-400/10"
                data-testid="retry-quiz-btn"
              >
                Tentar Novamente
              </Button>
              <Button
                onClick={() => navigate('/dashboard')}
                className="bg-gradient-to-r from-green-600 to-emerald-500"
                data-testid="back-dashboard-btn"
              >
                Voltar ao Dashboard
              </Button>
            </div>
          </Card>
        ) : (
          <div className="flex justify-center items-center h-64">
            <div className="spinner"></div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Quiz;