import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Volume2, Trophy, Award } from 'lucide-react';
import { supabase, Session, WordAttempt } from '../lib/supabase';
import { speechService } from '../lib/speech';
import { shuffleArray } from '../lib/utils';
import html2canvas from 'html2canvas';

interface WordConfig {
  word: string;
  image_url?: string;
  prefilled_indices?: number[];
}

export default function StudentGame() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const sessionId = searchParams.get('session');
  const studentName = searchParams.get('name');

  const [session, setSession] = useState<Session | null>(null);
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [shuffledWords, setShuffledWords] = useState<WordConfig[]>([]);
  const [availableLetters, setAvailableLetters] = useState<string[]>([]);
  const [placedLetters, setPlacedLetters] = useState<(string | null)[]>([]);
  const [currentImage, setCurrentImage] = useState<string | undefined>(undefined);
  const [score, setScore] = useState(0);
  const [attempts, setAttempts] = useState<WordAttempt[]>([]);
  const [attemptCount, setAttemptCount] = useState(0);
  const [showCorrect, setShowCorrect] = useState(false);
  const [showIncorrect, setShowIncorrect] = useState(false);
  const [incorrectPositions, setIncorrectPositions] = useState<number[]>([]);
  const [gameComplete, setGameComplete] = useState(false);
  const [showChallengeOffer, setShowChallengeOffer] = useState(false);
  const [isPerfectScore, setIsPerfectScore] = useState(false);
  const [startTime, setStartTime] = useState(Date.now());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!sessionId || !studentName) {
      navigate('/eleve');
      return;
    }
    loadSession();
  }, [sessionId]);

  useEffect(() => {
    if (session && shuffledWords.length > 0) {
      startWord();
    }
  }, [currentWordIndex, shuffledWords]);

  async function loadSession() {
    try {
      const { data, error } = await supabase
        .from('sessions')
        .select('*')
        .eq('id', sessionId)
        .single();

      if (error) throw error;

      setSession(data);
      const normalizedWords: WordConfig[] = data.word_list.map((item: any) => {
        if (typeof item === 'string') {
          return { word: item };
        }
        return item as WordConfig;
      });
      const randomizedWords = shuffleArray([...normalizedWords]);
      setShuffledWords(randomizedWords);
      setLoading(false);
    } catch (error) {
      console.error('Error loading session:', error);
      navigate('/eleve');
    }
  }

  function startWord() {
    if (currentWordIndex >= shuffledWords.length) {
      completeGame();
      return;
    }

    const wordConfig = shuffledWords[currentWordIndex];
    const word = wordConfig.word;
    const letters = word.split('');

    setCurrentImage(wordConfig.image_url);

    const specialChars = ['-', "'", ' '];
    const autoPrefilledIndices: number[] = [];
    letters.forEach((char, idx) => {
      if (specialChars.includes(char)) {
        autoPrefilledIndices.push(idx);
      }
    });

    const onlyLetters = letters.filter(char => !specialChars.includes(char));

    if (session?.keyboard_mode) {
      const alphabet = 'abcdefghijklmnopqrstuvwxyz'.split('');
      setAvailableLetters(alphabet);
    } else {
      setAvailableLetters(shuffleArray(onlyLetters));
    }

    const initialPlaced = new Array(letters.length).fill(null);

    autoPrefilledIndices.forEach(index => {
      initialPlaced[index] = letters[index];
    });

    if (wordConfig.prefilled_indices) {
      wordConfig.prefilled_indices.forEach(index => {
        if (index < letters.length) {
          initialPlaced[index] = letters[index];
        }
      });
    }

    setPlacedLetters(initialPlaced);
    setAttemptCount(0);
    setShowCorrect(false);
    setShowIncorrect(false);
    setIncorrectPositions([]);

    setTimeout(() => {
      speechService.speak(word);
    }, 500);
  }

  function handleLetterClick(letter: string, index: number) {
    const wordConfig = shuffledWords[currentWordIndex];
    const word = wordConfig.word;
    const letters = word.split('');
    const prefilledIndices = wordConfig.prefilled_indices || [];

    const specialChars = ['-', "'", ' '];
    const autoPrefilledIndices: number[] = [];
    letters.forEach((char, idx) => {
      if (specialChars.includes(char)) {
        autoPrefilledIndices.push(idx);
      }
    });

    const allPrefilledIndices = [...prefilledIndices, ...autoPrefilledIndices];

    const firstEmpty = placedLetters.findIndex((l, idx) => l === null && !allPrefilledIndices.includes(idx));
    if (firstEmpty === -1) return;

    if (!session?.keyboard_mode) {
      const newAvailable = [...availableLetters];
      newAvailable.splice(index, 1);
      setAvailableLetters(newAvailable);
    }

    const newPlaced = [...placedLetters];
    newPlaced[firstEmpty] = letter;
    setPlacedLetters(newPlaced);

    if (session?.pronunciation_mode && newPlaced.filter(l => l !== null).length >= 2) {
      const currentWord = newPlaced.filter(l => l !== null).join('');
      speechService.speak(currentWord);
    }

    const allFilled = newPlaced.every((l, idx) => l !== null || allPrefilledIndices.includes(idx));
    if (allFilled) {
      setTimeout(() => checkWord(newPlaced), 300);
    }
  }

  function handlePlacedLetterClick(index: number) {
    if (showCorrect || showIncorrect) return;

    const wordConfig = shuffledWords[currentWordIndex];
    const word = wordConfig.word;
    const letters = word.split('');
    const prefilledIndices = wordConfig.prefilled_indices || [];

    const specialChars = ['-', "'", ' '];
    const autoPrefilledIndices: number[] = [];
    letters.forEach((char, idx) => {
      if (specialChars.includes(char)) {
        autoPrefilledIndices.push(idx);
      }
    });

    const allPrefilledIndices = [...prefilledIndices, ...autoPrefilledIndices];

    if (allPrefilledIndices.includes(index)) return;

    const letter = placedLetters[index];
    if (!letter) return;

    const newPlaced = [...placedLetters];
    newPlaced[index] = null;
    setPlacedLetters(newPlaced);

    if (!session?.keyboard_mode) {
      setAvailableLetters([...availableLetters, letter]);
    }
  }

  async function checkWord(word: (string | null)[]) {
    const wordConfig = shuffledWords[currentWordIndex];
    const currentWord = wordConfig.word;
    const attempt = word.join('');

    await speechService.speak(attempt);

    const isCorrect = attempt === currentWord;
    const newAttemptCount = attemptCount + 1;
    setAttemptCount(newAttemptCount);

    if (isCorrect) {
      const points = 20;
      setScore(score + points);
      setShowCorrect(true);

      const wordAttempt: WordAttempt = {
        word: attempt,
        correct_word: currentWord,
        attempt_number: newAttemptCount,
        is_correct: true,
        points: points,
      };
      setAttempts([...attempts, wordAttempt]);

      setTimeout(() => {
        setCurrentWordIndex(currentWordIndex + 1);
      }, 3000);
    } else {
      const incorrectPos: number[] = [];
      word.forEach((letter, idx) => {
        if (letter !== currentWord[idx]) {
          incorrectPos.push(idx);
        }
      });

      setIncorrectPositions(incorrectPos);
      setShowIncorrect(true);

      const points = -5;
      setScore(Math.max(0, score + points));

      await captureScreenshot(word, currentWord, newAttemptCount);

      speechService.speak("Ce n'est pas correct, réessaie!");

      setTimeout(() => {
        setShowIncorrect(false);
      }, 2000);
    }
  }

  async function captureScreenshot(word: (string | null)[], correctWord: string, attemptNum: number) {
    try {
      const element = document.getElementById('word-area');
      if (!element) return;

      const canvas = await html2canvas(element, {
        backgroundColor: '#ffffff',
        scale: 2,
      });

      const screenshot = canvas.toDataURL('image/png');

      const wordAttempt: WordAttempt = {
        word: word.join(''),
        correct_word: correctWord,
        attempt_number: attemptNum,
        is_correct: false,
        screenshot: screenshot,
        points: -5,
      };

      setAttempts([...attempts, wordAttempt]);
    } catch (error) {
      console.error('Error capturing screenshot:', error);
    }
  }

  function handleRetry() {
    const wordConfig = shuffledWords[currentWordIndex];
    const word = wordConfig.word;
    const letters = word.split('');

    const specialChars = ['-', "'", ' '];
    const autoPrefilledIndices: number[] = [];
    letters.forEach((char, idx) => {
      if (specialChars.includes(char)) {
        autoPrefilledIndices.push(idx);
      }
    });

    const onlyLetters = letters.filter(char => !specialChars.includes(char));

    if (session?.keyboard_mode) {
      const alphabet = 'abcdefghijklmnopqrstuvwxyz'.split('');
      setAvailableLetters(alphabet);
    } else {
      setAvailableLetters(shuffleArray(onlyLetters));
    }

    const resetPlaced = new Array(letters.length).fill(null);

    autoPrefilledIndices.forEach(index => {
      resetPlaced[index] = letters[index];
    });

    if (wordConfig.prefilled_indices) {
      wordConfig.prefilled_indices.forEach(index => {
        if (index < letters.length) {
          resetPlaced[index] = letters[index];
        }
      });
    }

    setPlacedLetters(resetPlaced);
    setShowIncorrect(false);
    setIncorrectPositions([]);
  }

  function handleRelisten() {
    const penalty = 3;
    setScore(Math.max(0, score - penalty));
    const wordConfig = shuffledWords[currentWordIndex];
    speechService.speak(wordConfig.word);
  }

  async function completeGame() {
    if (attempts.length === 0) {
      setGameComplete(true);
      speechService.speak('Félicitations! Tes résultats ont été envoyés!');
      return;
    }

    const perfectScore = attempts.every(attempt => attempt.is_correct && attempt.attempt_number === 1);
    setIsPerfectScore(perfectScore);

    const duration = Math.floor((Date.now() - startTime) / 1000);

    try {
      await supabase.from('student_results').insert({
        session_id: sessionId,
        student_name: studentName,
        attempts: attempts,
        final_score: score,
        duration_seconds: duration,
        challenge_mode: session?.keyboard_mode || false,
      });

      if (perfectScore && !session?.keyboard_mode) {
        setShowChallengeOffer(true);
        speechService.speak('Parfait! Tu as réussi tous les mots!');
      } else {
        setGameComplete(true);
        speechService.speak('Félicitations! Tes résultats ont été envoyés!');
      }
    } catch (error) {
      console.error('Error saving results:', error);
      setGameComplete(true);
    }
  }

  function handleAcceptChallenge() {
    setShowChallengeOffer(false);
    setCurrentWordIndex(0);
    setScore(0);
    setAttempts([]);
    setStartTime(Date.now());

    if (session) {
      const challengeSession = { ...session, keyboard_mode: true };
      setSession(challengeSession);
      const normalizedWords: WordConfig[] = session.word_list.map((item: any) => {
        if (typeof item === 'string') {
          return { word: item };
        }
        return item as WordConfig;
      });
      const randomizedWords = shuffleArray([...normalizedWords]);
      setShuffledWords(randomizedWords);
    }
  }

  function handleDeclineChallenge() {
    setShowChallengeOffer(false);
    setGameComplete(true);
    speechService.speak('Félicitations! Tes résultats ont été envoyés!');
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-yellow-50 to-orange-100 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-orange-500 border-t-transparent mb-4"></div>
          <p className="text-xl text-gray-700">Chargement...</p>
        </div>
      </div>
    );
  }

  if (showChallengeOffer) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-100 flex items-center justify-center p-4">
        <div className="max-w-2xl w-full bg-white rounded-2xl shadow-2xl p-8 text-center">
          <div className="mb-6">
            <Award className="w-24 h-24 text-purple-500 mx-auto mb-4 animate-bounce" />
            <h1 className="text-5xl font-bold text-gray-800 mb-4">Sans faute!</h1>
            <p className="text-2xl text-gray-600 mb-4">Tu as réussi tous les mots du premier coup!</p>
          </div>

          <div className="bg-gradient-to-r from-purple-400 to-pink-500 rounded-xl p-8 mb-6">
            <p className="text-white text-xl mb-2">Ton score</p>
            <p className="text-6xl font-bold text-white">{score}</p>
          </div>

          <div className="bg-yellow-50 border-2 border-yellow-300 rounded-xl p-6 mb-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-3">Relève le défi!</h2>
            <p className="text-gray-700 text-lg mb-2">
              Veux-tu rejouer en <span className="font-bold text-purple-600">mode difficile</span>?
            </p>
            <p className="text-gray-600">
              Tu devras trouver les lettres parmi tout l'alphabet!
            </p>
          </div>

          <div className="flex gap-4 justify-center">
            <button
              onClick={handleAcceptChallenge}
              className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-8 py-4 rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all font-bold text-lg shadow-lg transform hover:scale-105"
            >
              Oui, je relève le défi!
            </button>
            <button
              onClick={handleDeclineChallenge}
              className="bg-gray-400 text-white px-8 py-4 rounded-lg hover:bg-gray-500 transition-colors font-semibold text-lg"
            >
              Non merci
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (gameComplete) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-yellow-50 to-orange-100 flex items-center justify-center p-4">
        <div className="max-w-2xl w-full bg-white rounded-2xl shadow-2xl p-8 text-center">
          <div className="mb-6">
            <Trophy className="w-24 h-24 text-yellow-500 mx-auto mb-4" />
            <h1 className="text-5xl font-bold text-gray-800 mb-4">Félicitations!</h1>
            <p className="text-2xl text-gray-600 mb-2">Tu as terminé la dictée</p>
          </div>

          <div className="bg-gradient-to-r from-yellow-400 to-orange-500 rounded-xl p-8 mb-6">
            <p className="text-white text-xl mb-2">Score final</p>
            <p className="text-6xl font-bold text-white">{score}</p>
          </div>

          <p className="text-gray-600 mb-6">Tes résultats ont été envoyés à ton enseignant!</p>

          <button
            onClick={() => navigate('/eleve')}
            className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 transition-colors font-semibold text-lg"
          >
            Retour à l'accueil
          </button>
        </div>
      </div>
    );
  }

  if (currentWordIndex >= shuffledWords.length) {
    return null;
  }

  const currentWordConfig = shuffledWords[currentWordIndex];
  if (!currentWordConfig) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 to-orange-100 p-4">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-lg">Bonjour, {studentName}!</p>
              <p className="text-2xl font-bold text-gray-800">
                Mot {currentWordIndex + 1}/{shuffledWords.length}
              </p>
            </div>
            {currentWordConfig.image_url && (
              <div className="flex items-center">
                <img
                  src={currentWordConfig.image_url}
                  alt="Indice"
                  className="h-16 w-auto rounded-lg border-2 border-gray-300 shadow-md"
                />
              </div>
            )}
            <div className="text-right">
              <p className="text-gray-600">Score</p>
              <p className="text-4xl font-bold text-orange-600">{score}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-8">
          {currentWordConfig.image_url && (
            <div className="mb-6 flex justify-center">
              <img
                src={currentWordConfig.image_url}
                alt="Indice"
                className="max-h-48 w-auto rounded-lg border-4 border-blue-300 shadow-lg"
              />
            </div>
          )}
          <div className="mb-6 flex justify-center">
            <button
              onClick={handleRelisten}
              className="flex items-center gap-2 bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 transition-colors font-semibold shadow-lg"
            >
              <Volume2 className="w-5 h-5" />
              Réécouter (-3 points)
            </button>
          </div>

          <div id="word-area" className="mb-8">
            <p className="text-center text-gray-600 mb-4 text-lg">Zone de travail</p>
            <div className="flex justify-center gap-1 mb-8 flex-wrap max-w-full">
              {placedLetters.map((letter, index) => {
                const word = currentWordConfig.word;
                const letters = word.split('');
                const prefilledIndices = currentWordConfig.prefilled_indices || [];

                const specialChars = ['-', "'", ' '];
                const autoPrefilledIndices: number[] = [];
                letters.forEach((char, idx) => {
                  if (specialChars.includes(char)) {
                    autoPrefilledIndices.push(idx);
                  }
                });

                const allPrefilledIndices = [...prefilledIndices, ...autoPrefilledIndices];
                const isPrefilled = allPrefilledIndices.includes(index);
                const isSpecialChar = letter && specialChars.includes(letter);

                return (
                  <button
                    key={index}
                    onClick={() => handlePlacedLetterClick(index)}
                    disabled={showCorrect || showIncorrect || isPrefilled}
                    className={`w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 border-4 rounded-lg text-2xl sm:text-3xl font-bold flex items-center justify-center transition-all ${
                      showIncorrect && incorrectPositions.includes(index)
                        ? 'border-red-500 bg-red-100 text-red-700 animate-shake'
                        : showCorrect
                        ? 'border-green-500 bg-green-100 text-green-700'
                        : letter
                        ? isSpecialChar
                          ? 'border-gray-400 bg-gray-200 text-gray-600 cursor-not-allowed'
                          : 'border-blue-500 bg-blue-50 text-gray-800 hover:bg-blue-100 cursor-pointer'
                        : 'border-gray-300 bg-gray-50'
                    } ${isPrefilled ? 'cursor-not-allowed' : ''} disabled:cursor-not-allowed`}
                  >
                    {letter === ' ' ? '␣' : letter}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <p className="text-center text-gray-600 mb-4 text-lg">
              {session?.keyboard_mode ? 'Clavier complet' : 'Lettres disponibles'}
            </p>
            <div className={`flex justify-center gap-2 flex-wrap ${session?.keyboard_mode ? 'max-w-2xl mx-auto' : ''}`}>
              {availableLetters.map((letter, index) => {
                const isVowel = session?.keyboard_mode && ['a', 'e', 'i', 'o', 'u', 'y'].includes(letter.toLowerCase());
                const baseColor = isVowel ? 'bg-blue-300' : 'bg-orange-500';
                const hoverColor = isVowel ? 'hover:bg-blue-400' : 'hover:bg-orange-600';

                return (
                  <button
                    key={session?.keyboard_mode ? letter : index}
                    onClick={() => handleLetterClick(letter, index)}
                    disabled={showCorrect || showIncorrect}
                    className={`${session?.keyboard_mode ? 'w-12 h-12 text-xl' : 'w-16 h-16 text-3xl'} ${baseColor} text-white rounded-lg font-bold ${hoverColor} transition-all transform hover:scale-110 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg`}
                  >
                    {letter}
                  </button>
                );
              })}
            </div>
          </div>

          {showIncorrect && (
            <div className="mt-6 text-center">
              <button
                onClick={handleRetry}
                className="bg-red-500 text-white px-8 py-3 rounded-lg hover:bg-red-600 transition-colors font-bold text-lg shadow-lg"
              >
                Réessayer
              </button>
            </div>
          )}

          {showCorrect && (
            <div className="mt-6 text-center">
              <p className="text-3xl font-bold text-green-600 animate-bounce">Bravo! +20 points</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
