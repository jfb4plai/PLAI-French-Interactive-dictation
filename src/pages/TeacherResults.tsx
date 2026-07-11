import { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, User, Clock, Award } from 'lucide-react';
import { supabase, Session, StudentResult } from '../lib/supabase';
import { formatDuration, calculateWordStats } from '../lib/utils';

export default function TeacherResults() {
  const { sessionId } = useParams();
  const [session, setSession] = useState<Session | null>(null);
  const [results, setResults] = useState<StudentResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStudent, setSelectedStudent] = useState<StudentResult | null>(null);

  useEffect(() => {
    loadData();
  }, [sessionId]);

  async function loadData() {
    try {
      const { data: sessionData, error: sessionError } = await supabase
        .from('sessions')
        .select('*')
        .eq('id', sessionId)
        .single();

      if (sessionError) throw sessionError;
      setSession(sessionData);

      const { data: resultsData, error: resultsError } = await supabase
        .from('student_results')
        .select('*')
        .eq('session_id', sessionId)
        .order('completed_at', { ascending: false });

      if (resultsError) throw resultsError;
      setResults(resultsData || []);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl text-gray-700">Session introuvable</p>
          <Link to="/enseignant" className="text-blue-600 hover:text-blue-700 mt-4 inline-block">
            Retour au tableau de bord
          </Link>
        </div>
      </div>
    );
  }

  const averageScore = results.length > 0
    ? Math.round(results.reduce((sum, r) => sum + r.final_score, 0) / results.length)
    : 0;

  const allAttempts = results.flatMap(r => r.attempts);
  const wordStats = calculateWordStats(allAttempts);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-sky-100 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <img
            src="/plai-logo.jpg"
            alt="PlAI - Pôle Liégeois d'Accompagnement vers une École Inclusive"
            className="h-16 w-auto object-contain mb-4"
          />
          <div className="flex items-center gap-4">
            <Link
              to="/enseignant"
              className="p-2 hover:bg-white rounded-lg transition-colors"
            >
              <ArrowLeft className="w-6 h-6 text-gray-700" />
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-800">
                Résultats: {session.teacher_name || 'Session'}
              </h1>
              <p className="text-gray-600">Code: {session.access_code}</p>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <User className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-gray-600">Élèves</p>
                <p className="text-2xl font-bold text-gray-800">{results.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <Award className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-gray-600">Score moyen</p>
                <p className="text-2xl font-bold text-gray-800">{averageScore}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <Clock className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <p className="text-gray-600">Mots</p>
                <p className="text-2xl font-bold text-gray-800">{session.word_list?.length ?? 0}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Résultats par élève</h2>
            <div className="space-y-3">
              {results.length === 0 ? (
                <div className="bg-white rounded-xl shadow-lg p-6 text-center text-gray-600">
                  Aucun résultat pour le moment
                </div>
              ) : (
                results.map((result) => (
                  <button
                    key={result.id}
                    onClick={() => setSelectedStudent(result)}
                    className="w-full bg-white rounded-xl shadow-lg p-4 hover:shadow-xl transition-all text-left"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-bold text-lg text-gray-800">{result.student_name}</p>
                          {result.challenge_mode && (
                            <span className="px-2 py-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-full text-xs font-semibold">
                              Défi relevé!
                            </span>
                          )}
                        </div>
                        <p className="text-gray-600">
                          Durée: {formatDuration(result.duration_seconds)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-3xl font-bold text-blue-600">{result.final_score}</p>
                        <p className="text-sm text-gray-600">points</p>
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>

          <div>
            {selectedStudent ? (
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <h2 className="text-2xl font-bold text-gray-800">
                    Détails: {selectedStudent.student_name}
                  </h2>
                  {selectedStudent.challenge_mode && (
                    <span className="px-3 py-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-full text-sm font-semibold">
                      Défi relevé!
                    </span>
                  )}
                </div>
                <div className="bg-white rounded-xl shadow-lg p-6">
                  <div className="mb-6">
                    <div className="flex justify-between mb-2">
                      <span className="text-gray-600">Score final:</span>
                      <span className="font-bold text-xl">{selectedStudent.final_score}</span>
                    </div>
                    <div className="flex justify-between mb-2">
                      <span className="text-gray-600">Durée:</span>
                      <span className="font-bold">{formatDuration(selectedStudent.duration_seconds)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Mode:</span>
                      <span className="font-bold">
                        {selectedStudent.challenge_mode ? 'Clavier complet (difficile)' : 'Lettres mélangées (facile)'}
                      </span>
                    </div>
                  </div>

                  <h3 className="font-bold text-lg mb-3">Tentatives par mot</h3>
                  <div className="space-y-3 max-h-[600px] overflow-y-auto">
                    {Object.entries(
                      selectedStudent.attempts.reduce((acc, attempt) => {
                        const word = attempt.correct_word;
                        if (!acc[word]) acc[word] = [];
                        acc[word].push(attempt);
                        return acc;
                      }, {} as Record<string, typeof selectedStudent.attempts>)
                    ).map(([word, wordAttempts]) => {
                      const successAttempt = wordAttempts.find(a => a.is_correct);
                      const failedAttempts = wordAttempts.filter(a => !a.is_correct);

                      return (
                        <div key={word} className="border-2 border-gray-200 rounded-lg p-4">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-bold text-lg">{word}</span>
                            {successAttempt ? (
                              <span className="text-green-600 font-semibold">
                                {failedAttempts.length === 0 ? '✓ 1er coup' : `✓ ${wordAttempts.length} essais`}
                              </span>
                            ) : (
                              <span className="text-red-600 font-semibold">✗ Échec</span>
                            )}
                          </div>

                          {failedAttempts.length > 0 && (
                            <div>
                              <p className="text-sm text-gray-600 mb-2">Erreurs:</p>
                              <div className="flex gap-2 flex-wrap">
                                {failedAttempts.map((attempt, idx) => (
                                  <div key={idx}>
                                    {attempt.screenshot && (
                                      <img
                                        src={attempt.screenshot}
                                        alt={`Erreur ${idx + 1}`}
                                        className="w-[512px] h-auto border-2 border-red-300 rounded cursor-pointer hover:scale-110 transition-transform"
                                        onClick={(e) => {
                                          const img = e.currentTarget;
                                          if (img.style.position === 'fixed') {
                                            img.style.position = '';
                                            img.style.top = '';
                                            img.style.left = '';
                                            img.style.zIndex = '';
                                            img.style.transform = '';
                                          } else {
                                            img.style.position = 'fixed';
                                            img.style.top = '50%';
                                            img.style.left = '50%';
                                            img.style.transform = 'translate(-50%, -50%) scale(2)';
                                            img.style.zIndex = '1000';
                                          }
                                        }}
                                      />
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-lg p-12 text-center">
                <p className="text-gray-600">Sélectionnez un élève pour voir les détails</p>
              </div>
            )}
          </div>
        </div>

        {Object.keys(wordStats).length > 0 && (
          <div className="mt-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Statistiques par mot</h2>
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="grid md:grid-cols-3 gap-4">
                {Object.entries(wordStats)
                  .sort((a, b) => b[1].errors - a[1].errors)
                  .map(([word, stats]) => {
                    const errorRate = Math.round((stats.errors / stats.total) * 100);
                    return (
                      <div key={word} className="border-2 border-gray-200 rounded-lg p-4">
                        <p className="font-bold text-lg mb-2">{word}</p>
                        <div className="text-sm text-gray-600">
                          <p>Tentatives: {stats.total}</p>
                          <p>Erreurs: {stats.errors}</p>
                          <div className="mt-2">
                            <div className="bg-gray-200 rounded-full h-2">
                              <div
                                className={`h-2 rounded-full ${
                                  errorRate > 50 ? 'bg-red-500' : errorRate > 20 ? 'bg-orange-500' : 'bg-green-500'
                                }`}
                                style={{ width: `${100 - errorRate}%` }}
                              ></div>
                            </div>
                            <p className="text-xs mt-1">{100 - errorRate}% de réussite</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
