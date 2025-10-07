import { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { generateAccessCode } from '../lib/utils';
import SessionCreated from './SessionCreated';

interface CreateSessionProps {
  onBack: () => void;
}

export default function CreateSession({ onBack }: CreateSessionProps) {
  const [teacherName, setTeacherName] = useState('');
  const [wordListText, setWordListText] = useState('');
  const [keyboardMode, setKeyboardMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [createdSession, setCreatedSession] = useState<{ id: string; accessCode: string } | null>(null);
  const { user } = useAuth();

  async function handleCreateSession(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      const words = wordListText
        .split(/[\n,]+/)
        .map(w => w.trim())
        .filter(w => w.length > 0);

      if (words.length === 0) {
        alert('Veuillez entrer au moins un mot');
        setLoading(false);
        return;
      }

      const accessCode = generateAccessCode();

      const { data, error } = await supabase
        .from('sessions')
        .insert({
          teacher_name: teacherName,
          word_list: words,
          access_code: accessCode,
          keyboard_mode: keyboardMode,
          user_id: user?.id,
        })
        .select()
        .single();

      if (error) throw error;

      setCreatedSession({ id: data.id, accessCode: data.access_code });
    } catch (error) {
      console.error('Error creating session:', error);
      alert('Erreur lors de la création de la session');
    } finally {
      setLoading(false);
    }
  }

  if (createdSession) {
    return <SessionCreated sessionId={createdSession.id} accessCode={createdSession.accessCode} onBack={onBack} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-3xl mx-auto">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-gray-700 hover:text-gray-900 mb-6"
        >
          <ArrowLeft className="w-5 h-5" />
          Retour
        </button>

        <div className="bg-white rounded-xl shadow-lg p-8">
          <h2 className="text-3xl font-bold text-gray-800 mb-6">Créer une nouvelle dictée</h2>

          <form onSubmit={handleCreateSession} className="space-y-6">
            <div>
              <label htmlFor="teacherName" className="block text-gray-700 font-semibold mb-2">
                Votre nom (optionnel)
              </label>
              <input
                type="text"
                id="teacherName"
                value={teacherName}
                onChange={(e) => setTeacherName(e.target.value)}
                placeholder="Ex: Mme Dupont"
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none text-lg"
              />
            </div>

            <div>
              <label htmlFor="wordList" className="block text-gray-700 font-semibold mb-2">
                Liste des mots
                <span className="text-gray-500 font-normal ml-2">(un mot par ligne ou séparés par des virgules)</span>
              </label>
              <textarea
                id="wordList"
                value={wordListText}
                onChange={(e) => setWordListText(e.target.value)}
                placeholder="maison&#10;chat&#10;école&#10;soleil"
                rows={10}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none text-lg font-mono"
                required
              />
            </div>

            <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  id="keyboardMode"
                  checked={keyboardMode}
                  onChange={(e) => setKeyboardMode(e.target.checked)}
                  className="mt-1 w-5 h-5 text-blue-600 rounded focus:ring-blue-500 cursor-pointer"
                />
                <label htmlFor="keyboardMode" className="flex-1 cursor-pointer">
                  <span className="block text-gray-800 font-semibold mb-1">
                    Mode clavier complet (différenciation)
                  </span>
                  <span className="text-gray-600 text-sm">
                    Si coché, les élèves devront sélectionner les lettres parmi tout l'alphabet (A-Z) au lieu des lettres mélangées du mot.
                    Plus difficile, idéal pour complexifier la tâche.
                  </span>
                </label>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-4 rounded-lg hover:bg-blue-700 transition-colors font-bold text-lg disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
            >
              {loading ? 'Création en cours...' : 'Créer la session'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
