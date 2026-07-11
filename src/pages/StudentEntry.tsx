import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { supabase } from '../lib/supabase';

export default function StudentEntry() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [accessCode, setAccessCode] = useState(searchParams.get('code') || '');
  const [studentName, setStudentName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleStart(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { data, error: dbError } = await supabase
        .from('dictee_sessions')
        .select('*')
        .eq('access_code', accessCode.toUpperCase())
        .maybeSingle();

      if (dbError) throw dbError;

      if (!data) {
        setError('Code invalide. Veuillez vérifier le code et réessayer.');
        setLoading(false);
        return;
      }

      navigate(`/eleve/jeu?session=${data.id}&name=${encodeURIComponent(studentName)}`);
    } catch (error) {
      console.error('Error checking session:', error);
      setError('Une erreur est survenue. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-teal-100 p-4">
      <div className="max-w-2xl mx-auto">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-gray-700 hover:text-gray-900 mb-6"
        >
          <ArrowLeft className="w-5 h-5" />
          Retour
        </Link>

        <div className="bg-white rounded-xl shadow-lg p-8">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-800 mb-2">Espace Élève</h1>
            <p className="text-gray-600">Entre ton code de session pour commencer</p>
          </div>

          <form onSubmit={handleStart} className="space-y-6">
            <div>
              <label htmlFor="accessCode" className="block text-gray-700 font-semibold mb-2 text-lg">
                Code de session
              </label>
              <input
                type="text"
                id="accessCode"
                value={accessCode}
                onChange={(e) => setAccessCode(e.target.value.toUpperCase())}
                placeholder="Ex: ABC123"
                maxLength={6}
                className="w-full px-4 py-4 border-2 border-gray-300 rounded-lg focus:border-green-500 focus:outline-none text-2xl font-bold text-center tracking-wider uppercase"
                required
              />
            </div>

            <div>
              <label htmlFor="studentName" className="block text-gray-700 font-semibold mb-2 text-lg">
                Ton prénom
              </label>
              <input
                type="text"
                id="studentName"
                value={studentName}
                onChange={(e) => setStudentName(e.target.value)}
                placeholder="Ex: Lucas"
                className="w-full px-4 py-4 border-2 border-gray-300 rounded-lg focus:border-green-500 focus:outline-none text-xl"
                required
              />
            </div>

            {error && (
              <div className="bg-red-100 border-2 border-red-400 text-red-700 px-4 py-3 rounded-lg">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-green-600 text-white py-4 rounded-lg hover:bg-green-700 transition-colors font-bold text-xl disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
            >
              {loading ? 'Chargement...' : 'Commencer la dictée'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
