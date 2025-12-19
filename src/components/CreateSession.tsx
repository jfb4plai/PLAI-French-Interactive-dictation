import { useState, useEffect } from 'react';
import { ArrowLeft, Upload, Link as LinkIcon, X } from 'lucide-react';
import { supabase, Session } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { generateAccessCode } from '../lib/utils';
import SessionCreated from './SessionCreated';

interface CreateSessionProps {
  onBack: () => void;
  initialData?: Session;
}

interface WordConfig {
  word: string;
  image_url?: string;
  prefilled_indices?: number[];
}

function generateNextVersionTitle(originalTitle: string): string {
  const versionMatch = originalTitle.match(/^(.*?)(?:\s*[-–—]\s*Version\s+(\d+))$/i);
  if (versionMatch) {
    const baseName = versionMatch[1].trim();
    const currentVersion = parseInt(versionMatch[2]);
    return `${baseName} - Version ${currentVersion + 1}`;
  }

  const copieMatch = originalTitle.match(/^(.*?)(?:\s*[-–—]\s*Copie\s+(\d+))$/i);
  if (copieMatch) {
    const baseName = copieMatch[1].trim();
    const currentCopy = parseInt(copieMatch[2]);
    return `${baseName} - Copie ${currentCopy + 1}`;
  }

  const simpleCopieMatch = originalTitle.match(/^(.*?)(?:\s*[-–—]\s*Copie)$/i);
  if (simpleCopieMatch) {
    const baseName = simpleCopieMatch[1].trim();
    return `${baseName} - Copie 2`;
  }

  return `${originalTitle} - Version 2`;
}

export default function CreateSession({ onBack, initialData }: CreateSessionProps) {
  const [title, setTitle] = useState('');
  const [teacherName, setTeacherName] = useState('');
  const [wordListText, setWordListText] = useState('');
  const [keyboardMode, setKeyboardMode] = useState(false);
  const [pronunciationMode, setPronunciationMode] = useState(false);
  const [enableImages, setEnableImages] = useState(false);
  const [enablePrefilled, setEnablePrefilled] = useState(false);
  const [wordConfigs, setWordConfigs] = useState<WordConfig[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState<number | null>(null);
  const [createdSession, setCreatedSession] = useState<{ id: string; accessCode: string } | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    if (initialData) {
      setTitle(initialData.title ? generateNextVersionTitle(initialData.title) : '');
      setTeacherName(initialData.teacher_name || '');
      setKeyboardMode(initialData.keyboard_mode || false);
      setPronunciationMode(initialData.pronunciation_mode || false);

      const wordList = initialData.word_list;
      const hasComplexWords = wordList.some((w: any) => typeof w === 'object');

      if (hasComplexWords) {
        const hasImages = wordList.some((w: any) => w.image_url);
        const hasPrefilled = wordList.some((w: any) => w.prefilled_indices && w.prefilled_indices.length > 0);

        setEnableImages(hasImages);
        setEnablePrefilled(hasPrefilled);

        const configs: WordConfig[] = wordList.map((w: any) => {
          if (typeof w === 'string') {
            return { word: w };
          }
          return {
            word: w.word,
            image_url: w.image_url,
            prefilled_indices: w.prefilled_indices
          };
        });
        setWordConfigs(configs);
        setWordListText(configs.map(c => c.word).join('\n'));
      } else {
        const simpleWords = wordList.map((w: any) => typeof w === 'string' ? w : w.word);
        setWordListText(simpleWords.join('\n'));
      }
    }
  }, [initialData]);

  useEffect(() => {
    if ((enableImages || enablePrefilled) && wordListText.trim()) {
      parseWordList();
    }
  }, [enableImages, enablePrefilled]);

  function parseWordList() {
    const words = wordListText
      .split(/[\n,]+/)
      .map(w => w.trim())
      .filter(w => w.length > 0);

    if (words.length === 0) {
      setWordConfigs([]);
      return;
    }

    if (words.length !== wordConfigs.length) {
      const newConfigs = words.map((word, index) => {
        const existingConfig = wordConfigs.find(c => c.word === word);
        return existingConfig || { word };
      });
      setWordConfigs(newConfigs);
    } else {
      const updated = words.map((word, index) => {
        if (wordConfigs[index]?.word === word) {
          return wordConfigs[index];
        }
        return { word };
      });
      setWordConfigs(updated);
    }
  }

  function checkCaseMixing(): boolean {
    const words = wordListText
      .split(/[\n,]+/)
      .map(w => w.trim())
      .filter(w => w.length > 0);

    if (words.length === 0) return false;

    const firstWord = words[0];
    const firstLetter = firstWord.split('').find(c => /[a-zA-ZÀ-ÿ]/.test(c));

    if (!firstLetter) return false;

    const expectedCase = /[A-ZÀ-Ý]/.test(firstLetter) ? 'upper' : 'lower';

    for (const word of words) {
      const firstLetterOfWord = word.split('').find(c => /[a-zA-ZÀ-ÿ]/.test(c));
      if (!firstLetterOfWord) continue;

      const isUpper = /[A-ZÀ-Ý]/.test(firstLetterOfWord);
      const wordCase = isUpper ? 'upper' : 'lower';

      if (wordCase !== expectedCase) {
        return true;
      }
    }

    return false;
  }

  async function handleImageUpload(wordIndex: number, file: File) {
    setUploadingImage(wordIndex);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('word-images')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('word-images')
        .getPublicUrl(filePath);

      const newConfigs = [...wordConfigs];
      newConfigs[wordIndex].image_url = publicUrl;
      setWordConfigs(newConfigs);
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('Erreur lors du téléchargement de l\'image');
    } finally {
      setUploadingImage(null);
    }
  }

  function handleImageUrl(wordIndex: number, url: string) {
    const newConfigs = [...wordConfigs];
    newConfigs[wordIndex].image_url = url;
    setWordConfigs(newConfigs);
  }

  function togglePrefilledLetter(wordIndex: number, letterIndex: number) {
    const newConfigs = [...wordConfigs];
    const currentIndices = newConfigs[wordIndex].prefilled_indices || [];

    if (currentIndices.includes(letterIndex)) {
      newConfigs[wordIndex].prefilled_indices = currentIndices.filter(i => i !== letterIndex);
    } else {
      newConfigs[wordIndex].prefilled_indices = [...currentIndices, letterIndex].sort((a, b) => a - b);
    }

    setWordConfigs(newConfigs);
  }

  async function handleCreateSession(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      if (!user?.id) {
        alert('Vous devez être connecté pour créer une session');
        setLoading(false);
        return;
      }

      const words = wordListText
        .split(/[\n,]+/)
        .map(w => w.trim())
        .filter(w => w.length > 0);

      if (words.length === 0) {
        alert('Veuillez entrer au moins un mot');
        setLoading(false);
        return;
      }

      let wordList: any[] = words;

      if (enableImages || enablePrefilled) {
        wordList = wordConfigs.map((config, index) => {
          const result: any = { word: config.word };
          if (enableImages && config.image_url) {
            result.image_url = config.image_url;
          }
          if (enablePrefilled && config.prefilled_indices && config.prefilled_indices.length > 0) {
            result.prefilled_indices = config.prefilled_indices;
          }
          return result;
        });
      }

      const accessCode = generateAccessCode();

      console.log('Creating session with user_id:', user.id);
      console.log('Word list:', wordList);

      const { data, error } = await supabase
        .from('sessions')
        .insert({
          title: title,
          teacher_name: teacherName,
          word_list: wordList,
          access_code: accessCode,
          keyboard_mode: keyboardMode,
          pronunciation_mode: pronunciationMode,
          user_id: user.id,
        })
        .select()
        .single();

      if (error) {
        console.error('Database error details:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code,
        });
        throw error;
      }

      console.log('Session created successfully:', data);
      setCreatedSession({ id: data.id, accessCode: data.access_code });
    } catch (error: any) {
      console.error('Full error object:', error);
      const errorMessage = error?.message || 'Erreur inconnue';
      const errorDetails = error?.details ? `\nDétails: ${error.details}` : '';
      const errorHint = error?.hint ? `\nSuggestion: ${error.hint}` : '';
      alert(`Erreur lors de la création de la session: ${errorMessage}${errorDetails}${errorHint}`);
    } finally {
      setLoading(false);
    }
  }

  if (createdSession) {
    return <SessionCreated sessionId={createdSession.id} accessCode={createdSession.accessCode} onBack={onBack} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-sky-100 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <img
            src="/plai-logo.jpg"
            alt="PlAI - Pôle Liégeois d'Accompagnement vers une École Inclusive"
            className="h-16 w-auto object-contain mb-4"
          />
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-gray-700 hover:text-gray-900"
          >
            <ArrowLeft className="w-5 h-5" />
            Retour
          </button>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-8">
          <h2 className="text-3xl font-bold text-gray-800 mb-6">
            {initialData ? 'Dupliquer une dictée' : 'Créer une nouvelle dictée'}
          </h2>

          {initialData && (
            <div className="mb-6 bg-green-50 border-2 border-green-300 rounded-lg p-4">
              <p className="text-green-800 font-semibold">
                Duplication en cours
              </p>
              <p className="text-green-700 text-sm mt-1">
                Les paramètres de la session originale ont été copiés. Vous pouvez les modifier avant de créer la nouvelle version.
              </p>
            </div>
          )}

          <form onSubmit={handleCreateSession} className="space-y-6">
            <div>
              <label htmlFor="title" className="block text-gray-700 font-semibold mb-2">
                Titre de la dictée
              </label>
              <input
                type="text"
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ex: Dictée du 14 octobre - Les animaux"
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none text-lg"
                required
              />
            </div>

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
              <div className="mb-3 bg-blue-50 border border-blue-300 rounded-lg p-3">
                <p className="text-blue-800 text-sm">
                  <strong>ℹ️ Important :</strong> Un exercice ne peut contenir que des mots en <strong>minuscules</strong> (ex: école, élève) OU que des mots en <strong>MAJUSCULES</strong> (ex: ÉCOLE, ÉLÈVE). La première lettre du premier mot détermine le type de clavier.
                </p>
              </div>
              <textarea
                id="wordList"
                value={wordListText}
                onChange={(e) => {
                  setWordListText(e.target.value);
                  parseWordList();
                }}
                onBlur={parseWordList}
                placeholder="maison&#10;chat&#10;école&#10;soleil"
                rows={8}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none text-lg font-mono"
                required
              />
              {checkCaseMixing() && (
                <div className="mt-3 bg-red-50 border-2 border-red-400 rounded-lg p-4">
                  <p className="text-red-800 font-semibold">❌ Erreur</p>
                  <p className="text-red-700 text-sm mt-1">
                    Votre liste mélange des mots en minuscules et en majuscules. Utilisez uniquement des <strong>minuscules</strong> ou uniquement des <strong>MAJUSCULES</strong> pour tous les mots.
                  </p>
                </div>
              )}
            </div>

            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-gray-800">Options d'exercice</h3>

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
                      Mode clavier alphabétique complet
                    </span>
                    <span className="text-gray-600 text-sm">
                      Les élèves devront sélectionner les lettres parmi tout l'alphabet (A-Z ou a-z selon la casse de vos mots) au lieu des lettres mélangées du mot.
                    </span>
                  </label>
                </div>
              </div>

              <div className="bg-green-50 border-2 border-green-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    id="pronunciationMode"
                    checked={pronunciationMode}
                    onChange={(e) => setPronunciationMode(e.target.checked)}
                    className="mt-1 w-5 h-5 text-green-600 rounded focus:ring-green-500 cursor-pointer"
                  />
                  <label htmlFor="pronunciationMode" className="flex-1 cursor-pointer">
                    <span className="block text-gray-800 font-semibold mb-1">
                      Prononcer les lettres au fur et à mesure
                    </span>
                    <span className="text-gray-600 text-sm">
                      Le mot sera prononcé lettre par lettre dès la 2ème lettre tapée, uniquement à l'ajout de lettres.
                    </span>
                  </label>
                </div>
              </div>

              <div className="bg-purple-50 border-2 border-purple-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    id="enableImages"
                    checked={enableImages}
                    onChange={(e) => setEnableImages(e.target.checked)}
                    className="mt-1 w-5 h-5 text-purple-600 rounded focus:ring-purple-500 cursor-pointer"
                  />
                  <label htmlFor="enableImages" className="flex-1 cursor-pointer">
                    <span className="block text-gray-800 font-semibold mb-1">
                      Ajouter des images pour chaque mot
                    </span>
                    <span className="text-gray-600 text-sm">
                      Les images resteront visibles pendant tout l'exercice pour aider les élèves.
                    </span>
                  </label>
                </div>
              </div>

              <div className="bg-orange-50 border-2 border-orange-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    id="enablePrefilled"
                    checked={enablePrefilled}
                    onChange={(e) => setEnablePrefilled(e.target.checked)}
                    className="mt-1 w-5 h-5 text-orange-600 rounded focus:ring-orange-500 cursor-pointer"
                  />
                  <label htmlFor="enablePrefilled" className="flex-1 cursor-pointer">
                    <span className="block text-gray-800 font-semibold mb-1">
                      Pré-remplir certaines lettres
                    </span>
                    <span className="text-gray-600 text-sm">
                      Choisissez les lettres à afficher pour faciliter l'exercice. Les lettres pré-remplies auront le même formatage que les autres.
                    </span>
                  </label>
                </div>
              </div>
            </div>

            {(enableImages || enablePrefilled) && wordConfigs.length > 0 && (
              <div className="border-2 border-gray-200 rounded-lg p-6 bg-gray-50">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Configuration des mots</h3>
                <div className="space-y-6">
                  {wordConfigs.map((config, wordIndex) => (
                    <div key={wordIndex} className="bg-white rounded-lg p-4 border-2 border-gray-200">
                      <h4 className="text-xl font-bold text-gray-800 mb-3">{config.word}</h4>

                      {enableImages && (
                        <div className="mb-4">
                          <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Image (optionnel)
                          </label>
                          <div className="flex gap-2 mb-2">
                            <label className="flex-1 cursor-pointer">
                              <div className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors">
                                <Upload className="w-4 h-4" />
                                <span className="text-sm">Télécharger</span>
                              </div>
                              <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) handleImageUpload(wordIndex, file);
                                }}
                                className="hidden"
                                disabled={uploadingImage === wordIndex}
                              />
                            </label>
                            <input
                              type="text"
                              placeholder="ou coller l'URL d'une image"
                              value={config.image_url || ''}
                              onChange={(e) => handleImageUrl(wordIndex, e.target.value)}
                              className="flex-1 px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none text-sm"
                            />
                          </div>
                          {config.image_url && (
                            <div className="relative inline-block">
                              <img
                                src={config.image_url}
                                alt={config.word}
                                className="h-24 w-auto rounded border-2 border-gray-300"
                              />
                              <button
                                type="button"
                                onClick={() => handleImageUrl(wordIndex, '')}
                                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          )}
                          {uploadingImage === wordIndex && (
                            <p className="text-sm text-blue-600">Téléchargement en cours...</p>
                          )}
                        </div>
                      )}

                      {enablePrefilled && (
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Lettres pré-remplies (cliquez pour sélectionner)
                          </label>
                          <div className="flex gap-2 flex-wrap">
                            {config.word.split('').map((letter, letterIndex) => {
                              const isPrefilled = config.prefilled_indices?.includes(letterIndex);
                              return (
                                <button
                                  key={letterIndex}
                                  type="button"
                                  onClick={() => togglePrefilledLetter(wordIndex, letterIndex)}
                                  className={`w-10 h-10 rounded-lg font-bold text-lg transition-all ${
                                    isPrefilled
                                      ? 'bg-orange-500 text-white border-2 border-orange-600'
                                      : 'bg-white text-gray-700 border-2 border-gray-300 hover:border-orange-400'
                                  }`}
                                >
                                  {letter}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

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
