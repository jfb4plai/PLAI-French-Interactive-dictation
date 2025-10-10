import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Plus, Eye, LogOut, FileText } from 'lucide-react';
import { supabase, Session } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import CreateSession from '../components/CreateSession';

export default function TeacherDashboard() {
  const [view, setView] = useState<'list' | 'create'>('list');
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const { signOut, user } = useAuth();

  useEffect(() => {
    loadSessions();
  }, []);

  async function loadSessions() {
    try {
      const { data, error } = await supabase
        .from('sessions')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSessions(data || []);
    } catch (error) {
      console.error('Error loading sessions:', error);
    } finally {
      setLoading(false);
    }
  }

  async function getResultsCount(sessionId: string): Promise<number> {
    const { count } = await supabase
      .from('student_results')
      .select('*', { count: 'exact', head: true })
      .eq('session_id', sessionId);

    return count || 0;
  }

  if (view === 'create') {
    return (
      <CreateSession
        onBack={() => {
          setView('list');
          loadSessions();
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-sky-100 p-4">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <img
              src="/plai-logo.jpg"
              alt="PlAI - Pôle Liégeois d'Accompagnement vers une École Inclusive"
              className="h-16 w-auto object-contain"
            />
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                to="/"
                className="p-2 hover:bg-white rounded-lg transition-colors"
              >
                <ArrowLeft className="w-6 h-6 text-gray-700" />
              </Link>
              <h1 className="text-4xl font-bold text-gray-800">Espace Enseignant</h1>
            </div>
            <div className="flex items-center gap-3">
            <button
              onClick={() => setView('create')}
              className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-semibold shadow-lg"
            >
              <Plus className="w-5 h-5" />
              Créer une dictée
            </button>
            <button
              onClick={signOut}
              className="flex items-center gap-2 bg-gray-600 text-white px-4 py-3 rounded-lg hover:bg-gray-700 transition-colors font-semibold shadow-lg"
              title="Se déconnecter"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
          </div>
        ) : sessions.length === 0 ? (
          <div className="bg-white rounded-xl shadow-lg p-12 text-center">
            <p className="text-gray-600 text-lg mb-4">Aucune dictée créée pour le moment</p>
            <button
              onClick={() => setView('create')}
              className="text-blue-600 hover:text-blue-700 font-semibold"
            >
              Créer votre première dictée
            </button>
          </div>
        ) : (
          <div className="grid gap-4">
            {sessions.map((session) => (
              <SessionCard key={session.id} session={session} getResultsCount={getResultsCount} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function SessionCard({ session, getResultsCount }: { session: Session; getResultsCount: (id: string) => Promise<number> }) {
  const [resultsCount, setResultsCount] = useState<number>(0);

  useEffect(() => {
    getResultsCount(session.id).then(setResultsCount);
  }, [session.id]);

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h3 className="text-xl font-bold text-gray-800">
              {session.teacher_name || 'Session sans nom'}
            </h3>
            <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-semibold">
              {session.access_code}
            </span>
            {session.keyboard_mode && (
              <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm font-semibold">
                Clavier complet
              </span>
            )}
          </div>
          <div className="flex items-center gap-6 text-gray-600">
            <span>{session.word_list.length} mots</span>
            <span>{resultsCount} élève{resultsCount > 1 ? 's' : ''}</span>
            <span>{new Date(session.created_at).toLocaleDateString('fr-FR')}</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Link
            to={`/enseignant/session/${session.id}`}
            className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2 rounded-lg hover:bg-blue-700 transition-colors font-semibold"
          >
            <FileText className="w-4 h-4" />
            Détails
          </Link>
          <Link
            to={`/enseignant/resultats/${session.id}`}
            className="flex items-center gap-2 bg-green-600 text-white px-5 py-2 rounded-lg hover:bg-green-700 transition-colors font-semibold"
          >
            <Eye className="w-4 h-4" />
            Résultats
          </Link>
        </div>
      </div>
    </div>
  );
}
