import { useEffect, useRef, useState } from 'react';
import { Copy, Download, Check } from 'lucide-react';
import QRCode from 'qrcode';

interface SessionCreatedProps {
  sessionId: string;
  accessCode: string;
  onBack: () => void;
}

export default function SessionCreated({ accessCode, onBack }: SessionCreatedProps) {
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [copied, setCopied] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const studentUrl = `${window.location.origin}/eleve?code=${accessCode}`;

  useEffect(() => {
    generateQRCode();
  }, [accessCode]);

  async function generateQRCode() {
    try {
      const url = await QRCode.toDataURL(studentUrl, {
        width: 300,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF',
        },
      });
      setQrCodeUrl(url);
    } catch (error) {
      console.error('Error generating QR code:', error);
    }
  }

  async function copyToClipboard() {
    try {
      await navigator.clipboard.writeText(studentUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Error copying to clipboard:', error);
    }
  }

  function downloadQRCode() {
    if (!qrCodeUrl) return;

    const link = document.createElement('a');
    link.download = `qrcode-${accessCode}.png`;
    link.href = qrCodeUrl;
    link.click();
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white rounded-xl shadow-lg p-8">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-green-500 rounded-full mb-4">
              <Check className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-3xl font-bold text-gray-800 mb-2">Session créée avec succès!</h2>
            <p className="text-gray-600">Partagez ce code avec vos élèves</p>
          </div>

          <div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl p-8 mb-6">
            <p className="text-white text-center text-lg mb-2">Code de la session</p>
            <div className="text-center">
              <span className="text-6xl font-bold text-white tracking-wider">{accessCode}</span>
            </div>
          </div>

          <div className="flex justify-center mb-6">
            <div className="bg-white p-4 rounded-xl shadow-lg">
              {qrCodeUrl && (
                <img src={qrCodeUrl} alt="QR Code" className="w-64 h-64" />
              )}
            </div>
          </div>

          <div className="space-y-3 mb-6">
            <button
              onClick={copyToClipboard}
              className="w-full flex items-center justify-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-800 py-3 rounded-lg transition-colors font-semibold"
            >
              {copied ? (
                <>
                  <Check className="w-5 h-5" />
                  Copié!
                </>
              ) : (
                <>
                  <Copy className="w-5 h-5" />
                  Copier le lien
                </>
              )}
            </button>

            <button
              onClick={downloadQRCode}
              className="w-full flex items-center justify-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-800 py-3 rounded-lg transition-colors font-semibold"
            >
              <Download className="w-5 h-5" />
              Télécharger le QR code
            </button>
          </div>

          <div className="text-center text-sm text-gray-600 mb-6">
            <p>Les élèves peuvent scanner ce QR code ou entrer le code directement</p>
          </div>

          <button
            onClick={onBack}
            className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors font-semibold"
          >
            Retour au tableau de bord
          </button>
        </div>
      </div>
    </div>
  );
}
