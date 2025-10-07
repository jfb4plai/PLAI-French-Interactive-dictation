import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Download } from 'lucide-react';
import { supabase, Session } from '../lib/supabase';
import QRCode from 'qrcode';

export default function SessionDetails() {
  const { sessionId } = useParams();
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    loadSession();
  }, [sessionId]);

  async function loadSession() {
    try {
      const { data, error } = await supabase
        .from('sessions')
        .select('*')
        .eq('id', sessionId)
        .single();

      if (error) throw error;
      setSession(data);

      const url = `${window.location.origin}/eleve?code=${data.access_code}`;
      const qrDataUrl = await QRCode.toDataURL(url, {
        width: 300,
        margin: 2,
      });
      setQrCodeUrl(qrDataUrl);
    } catch (error) {
      console.error('Error loading session:', error);
    } finally {
      setLoading(false);
    }
  }

  function downloadQRCode() {
    if (!qrCodeUrl || !session) return;

    const link = document.createElement('a');
    link.download = `qr-code-${session.access_code}.png`;
    link.href = qrCodeUrl;
    link.click();
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
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <div className="max-w-4xl mx-auto">
          <Link
            to="/enseignant/dashboard"
            className="flex items-center gap-2 text-gray-700 hover:text-gray-900 mb-6"
          >
            <ArrowLeft className="w-5 h-5" />
            Retour au dashboard
          </Link>
          <div className="bg-white rounded-xl shadow-lg p-8 text-center">
            <p className="text-gray-600 text-lg">Session non trouvée</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-4xl mx-auto">
        <Link
          to="/enseignant/dashboard"
          className="flex items-center gap-2 text-gray-700 hover:text-gray-900 mb-6"
        >
          <ArrowLeft className="w-5 h-5" />
          Retour au dashboard
        </Link>

        <div className="bg-white rounded-xl shadow-lg p-8">
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-gray-800 mb-2">
              {session.teacher_name || 'Session sans nom'}
            </h2>
            <div className="flex items-center gap-3 flex-wrap">
              <span className="px-4 py-2 bg-blue-100 text-blue-800 rounded-full text-lg font-bold">
                Code: {session.access_code}
              </span>
              {session.keyboard_mode && (
                <span className="px-4 py-2 bg-purple-100 text-purple-800 rounded-full text-sm font-semibold">
                  Mode clavier complet
                </span>
              )}
              <span className="text-gray-600">
                Créée le {new Date(session.created_at).toLocaleDateString('fr-FR')}
              </span>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-xl font-bold text-gray-800 mb-4">Liste des mots</h3>
              <div className="bg-gray-50 rounded-lg p-4 max-h-96 overflow-y-auto">
                <ol className="space-y-2">
                  {session.word_list.map((word, index) => (
                    <li key={index} className="flex items-center gap-2">
                      <span className="text-gray-600 font-semibold">{index + 1}.</span>
                      <span className="text-gray-800 text-lg font-mono">{word}</span>
                    </li>
                  ))}
                </ol>
              </div>
              <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-gray-700">
                  <span className="font-semibold">Total:</span> {session.word_list.length} mots
                </p>
              </div>
            </div>

            <div>
              <h3 className="text-xl font-bold text-gray-800 mb-4">QR Code d'accès</h3>
              <div className="bg-white border-2 border-gray-200 rounded-lg p-6 text-center">
                {qrCodeUrl && (
                  <div className="space-y-4">
                    <img
                      src={qrCodeUrl}
                      alt="QR Code"
                      className="mx-auto"
                      style={{ width: 300, height: 300 }}
                    />
                    <button
                      onClick={downloadQRCode}
                      className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors font-semibold mx-auto"
                    >
                      <Download className="w-4 h-4" />
                      Télécharger le QR Code
                    </button>
                  </div>
                )}
              </div>
              <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-700">
                  Les élèves peuvent scanner ce QR code ou entrer le code <span className="font-bold">{session.access_code}</span> pour rejoindre la session.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-8 flex justify-center">
            <Link
              to={`/enseignant/resultats/${session.id}`}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-semibold shadow-lg"
            >
              Voir les résultats des élèves
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
