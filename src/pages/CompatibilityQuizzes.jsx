import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { ArrowLeft, Play, Sparkles, CheckCircle2, Award } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import AfricanPattern from '@/components/shared/AfricanPattern';
import LoadingSkeleton from '@/components/shared/LoadingSkeleton';
import CouplesComparison from '@/components/quizzes/CouplesComparison';
import { Heart } from 'lucide-react';

export default function CompatibilityQuizzes() {
  const [showCouplesComparison, setShowCouplesComparison] = useState(false);
  const [myProfile, setMyProfile] = useState(null);
  const [activeQuiz, setActiveQuiz] = useState(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState([]);
  const [showResult, setShowResult] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const user = await base44.auth.me();
        const profiles = await base44.entities.UserProfile.filter({ user_id: user.id });
        if (profiles.length > 0) {
          setMyProfile(profiles[0]);
        }
      } catch (e) {
        console.error("Error fetching profile:", e);
      }
    };
    fetchProfile();
  }, []);

  const { data: quizzes, isLoading: loadingQuizzes } = useQuery({
    queryKey: ['compatibility-quizzes'],
    queryFn: () => base44.entities.CompatibilityQuiz.filter({ is_active: true }),
    staleTime: 300000,
    retry: 1
  });

  const { data: myQuizResults, isLoading: loadingResults } = useQuery({
    queryKey: ['my-quiz-results', myProfile?.id],
    queryFn: () => myProfile ? base44.entities.QuizResult.filter({ user_profile_id: myProfile.id }) : [],
    enabled: !!myProfile,
    staleTime: 300000,
    retry: 1
  });

  const submitQuizMutation = useMutation({
    mutationFn: async (resultData) => {
      await base44.entities.QuizResult.create(resultData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['my-quiz-results']);
    }
  });

  const startQuiz = (quiz) => {
    setActiveQuiz(quiz);
    setCurrentQuestionIndex(0);
    setSelectedAnswers([]);
    setShowResult(false);
  };

  const handleAnswer = (optionIndex) => {
    const newAnswers = [...selectedAnswers, { question_index: currentQuestionIndex, selected_option_index: optionIndex }];
    setSelectedAnswers(newAnswers);
    
    if (currentQuestionIndex < activeQuiz.questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      calculateResult(newAnswers);
    }
  };

  const calculateResult = (answers) => {
    const compatibilityScores = {};
    activeQuiz.compatibility_types.forEach(type => compatibilityScores[type.type_name] = 0);

    answers.forEach(answer => {
      const question = activeQuiz.questions[answer.question_index];
      const selectedOption = question.options[answer.selected_option_index];
      
      for (const type in selectedOption.score_modifier) {
        if (compatibilityScores.hasOwnProperty(type)) {
          compatibilityScores[type] += selectedOption.score_modifier[type];
        }
      }
    });

    let dominantType = '';
    let maxScore = -Infinity;

    for (const type in compatibilityScores) {
      if (compatibilityScores[type] > maxScore) {
        maxScore = compatibilityScores[type];
        dominantType = type;
      }
    }

    const resultData = {
      quiz_id: activeQuiz.id,
      user_profile_id: myProfile.id,
      answers: answers,
      compatibility_score: compatibilityScores,
      result_type: dominantType
    };
    submitQuizMutation.mutate(resultData);
    setShowResult(true);
  };

  const getResultForQuiz = (quizId) => {
    return myQuizResults?.find(r => r.quiz_id === quizId);
  };

  const getResultDescription = (result, quiz) => {
    if (!result || !quiz) return null;
    const type = quiz.compatibility_types.find(t => t.type_name === result.result_type);
    return type?.description;
  };

  const currentQuestion = activeQuiz?.questions[currentQuestionIndex];
  const progress = activeQuiz ? ((currentQuestionIndex / activeQuiz.questions.length) * 100) : 0;
  const userHasResultForQuiz = (quizId) => myQuizResults?.some(r => r.quiz_id === quizId);

  if (loadingQuizzes || loadingResults) {
    return <LoadingSkeleton />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-purple-50/30 to-amber-50/20 relative pb-24">
      <AfricanPattern className="text-purple-600" opacity={0.03} />

      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-lg border-b">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center gap-3">
          <Link to={createPageUrl('Home')}>
            <Button variant="ghost" size="icon">
              <ArrowLeft size={24} />
            </Button>
          </Link>
          <h1 className="text-lg font-bold">Compatibility Quizzes</h1>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        <h2 className="text-3xl font-bold text-gray-800 mb-6 text-center">Discover Your Compatibility Type</h2>
        <p className="text-gray-600 mb-8 text-center max-w-2xl mx-auto">
          Take fun quizzes to improve your matches and find your perfect partner. Your results help us connect you with people who truly understand you.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Couples Comparison Card */}
          <Card className="bg-white/70 backdrop-blur-md border-2 border-purple-200 shadow-lg hover:shadow-xl transition-all cursor-pointer transform hover:scale-105" onClick={() => setShowCouplesComparison(true)}>
            <CardHeader className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-t-lg pb-10 mb-[-2rem]">
               <div className="flex justify-between items-start">
                 <div className="flex -space-x-2">
                   <div className="w-8 h-8 rounded-full bg-white/30 border-2 border-white flex items-center justify-center">You</div>
                   <div className="w-8 h-8 rounded-full bg-white/30 border-2 border-white flex items-center justify-center">?</div>
                 </div>
                 <Badge className="bg-amber-400 text-black border-none font-bold">Premium</Badge>
               </div>
            </CardHeader>
            <CardContent className="pt-12">
               <CardTitle className="text-xl font-bold text-gray-800 mb-2">Couples Comparison</CardTitle>
               <p className="text-sm text-gray-600 mb-4">Compare compatibility with your matches. Unlock deep insights for just $2.</p>
               <Button className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white border-0">
                 Compare Now
               </Button>
            </CardContent>
          </Card>

          {quizzes?.map(quiz => {
            const userResult = getResultForQuiz(quiz.id);
            return (
              <Card key={quiz.id} className="bg-white/70 backdrop-blur-md border border-gray-200 shadow-lg hover:shadow-xl transition-all">
                <CardHeader>
                  <img src={quiz.image_url || 'https://images.unsplash.com/photo-1517457210338-f00f72676767?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D'} alt={quiz.title} className="rounded-lg mb-4 object-cover h-40 w-full" />
                  <CardTitle className="text-xl font-bold text-gray-800">{quiz.title}</CardTitle>
                  <p className="text-sm text-gray-600 mt-2">{quiz.description}</p>
                </CardHeader>
                <CardContent className="space-y-3">
                  {userResult && (
                    <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 mb-3">
                      <div className="flex items-center gap-2 mb-2">
                        <Award size={18} className="text-purple-600" />
                        <p className="font-semibold text-purple-900">Your Result</p>
                      </div>
                      <p className="text-purple-700 font-bold">{userResult.result_type}</p>
                      <p className="text-sm text-gray-600 mt-1">{getResultDescription(userResult, quiz)}</p>
                    </div>
                  )}

                  {userResult ? (
                    <Button variant="outline" className="w-full" onClick={() => startQuiz(quiz)}>
                      <CheckCircle2 size={18} className="mr-2 text-green-600" />
                      Retake Quiz
                    </Button>
                  ) : (
                    <Button className="w-full bg-purple-600 hover:bg-purple-700" onClick={() => startQuiz(quiz)}>
                      <Play size={18} className="mr-2" />
                      Start Quiz
                    </Button>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </main>

      <Dialog open={!!activeQuiz} onOpenChange={() => setActiveQuiz(null)}>
        <DialogContent className="max-w-2xl p-6 bg-white/90 backdrop-blur-lg rounded-2xl shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-gray-800">{activeQuiz?.title}</DialogTitle>
          </DialogHeader>

          {!showResult ? (
            <div className="space-y-6">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-gray-600">Question {currentQuestionIndex + 1} of {activeQuiz?.questions.length}</p>
                <p className="text-sm font-semibold text-purple-600">{Math.round(progress)}%</p>
              </div>
              <Progress value={progress} className="w-full h-2" />
              <h3 className="text-xl font-semibold text-gray-800 mt-4">{currentQuestion?.question_text}</h3>
              <div className="space-y-3">
                {currentQuestion?.options.map((option, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    className="w-full justify-start py-6 text-left text-base border-2 border-gray-300 hover:bg-purple-50 hover:border-purple-600 transition-all"
                    onClick={() => handleAnswer(index)}
                  >
                    <span className="flex items-center gap-3">
                      <span className="flex-shrink-0 w-6 h-6 rounded-full border-2 border-purple-600 flex items-center justify-center text-xs font-semibold">
                        {String.fromCharCode(65 + index)}
                      </span>
                      {typeof option === 'string' ? option : option.option_text}
                    </span>
                  </Button>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center p-6">
              <Award size={80} className="mx-auto text-amber-500 mb-6 animate-pulse" />
              <h3 className="text-3xl font-bold text-gray-900 mb-3">Congratulations!</h3>
              <p className="text-lg text-gray-600 mb-4">Your Compatibility Type:</p>
              <div className="bg-purple-100 border-2 border-purple-600 rounded-xl p-6 mb-6">
                <p className="text-3xl font-bold text-purple-600 mb-3">
                  {myQuizResults?.find(r => r.quiz_id === activeQuiz?.id)?.result_type}
                </p>
                <p className="text-gray-700 text-base leading-relaxed">
                  {getResultDescription(
                    myQuizResults?.find(r => r.quiz_id === activeQuiz?.id),
                    activeQuiz
                  )}
                </p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <p className="text-sm text-gray-600 mb-2">Your Compatibility Scores:</p>
                {Object.entries(myQuizResults?.find(r => r.quiz_id === activeQuiz?.id)?.compatibility_score || {})
                  .sort(([, a], [, b]) => b - a)
                  .map(([type, score]) => (
                    <div key={type} className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-700">{type}</span>
                      <div className="flex items-center gap-2">
                        <div className="w-32 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-purple-600 h-2 rounded-full transition-all" 
                            style={{ width: `${Math.min(score * 3, 100)}%` }}
                          />
                        </div>
                        <span className="text-sm font-semibold text-gray-700 w-8">{score}</span>
                      </div>
                    </div>
                  ))}
              </div>
              <Button onClick={() => {
                setActiveQuiz(null);
                setShowResult(false);
              }} className="bg-purple-600 hover:bg-purple-700 w-full">
                Back to Quizzes
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <CouplesComparison isOpen={showCouplesComparison} onClose={() => setShowCouplesComparison(false)} />
    </div>
  );
}