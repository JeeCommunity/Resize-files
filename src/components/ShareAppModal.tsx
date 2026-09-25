import React, { useState, useEffect, useRef } from 'react';
import { X, Share2, Copy, Check, Download, QrCode } from 'lucide-react';
import QRCode from 'qrcode';

interface ShareAppModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ShareAppModal: React.FC<ShareAppModalProps> = ({ isOpen, onClose }) => {
  const [copied, setCopied] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const appUrl = window.location.origin + window.location.pathname;

  useEffect(() => {
    if (isOpen) {
      QRCode.toDataURL(appUrl, { width: 256, margin: 2, color: { dark: '#065f46', light: '#ffffff' } })
        .then((url) => setQrCodeUrl(url))
        .catch((err) => console.error('QR code generation error:', err));
    }
  }, [isOpen, appUrl]);

  if (!isOpen) return null;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(appUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy', err);
    }
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'ResizeFiles - Free Image & PDF Tools',
          text: 'Check out ResizeFiles for secure browser-based image resizing and PDF tools!',
          url: appUrl,
        });
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          console.error('Share failed', err);
        }
      }
    } else {
      handleCopyLink();
    }
  };

  const handleDownloadQr = () => {
    if (!qrCodeUrl) return;
    const link = document.createElement('a');
    link.href = qrCodeUrl;
    link.download = 'resizefiles-qr-code.png';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 sm:p-8 z-10 space-y-6 animate-in fade-in zoom-in duration-200">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center shadow-xs">
              <Share2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 text-base">Share ResizeFiles App</h3>
              <p className="text-xs text-slate-500">Spread the word with friends & colleagues</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* QR Code Section */}
        <div className="flex flex-col items-center justify-center space-y-3 bg-slate-50 p-6 rounded-2xl border border-slate-200">
          <div className="w-44 h-44 bg-white p-3 rounded-2xl shadow-sm border border-slate-200 flex items-center justify-center">
            {qrCodeUrl ? (
              <img src={qrCodeUrl} alt="App QR Code" className="w-full h-full object-contain" />
            ) : (
              <div className="w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin" />
            )}
          </div>
          <button
            onClick={handleDownloadQr}
            disabled={!qrCodeUrl}
            className="py-2 px-4 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 font-bold text-xs shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5 text-emerald-600" />
            Download QR Code
          </button>
        </div>

        {/* Link & Copy */}
        <div className="space-y-2">
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">App Link</label>
          <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-xl border border-slate-200">
            <input
              type="text"
              readOnly
              value={appUrl}
              className="w-full bg-transparent px-2 text-xs text-slate-600 font-medium focus:outline-none select-all"
            />
            <button
              onClick={handleCopyLink}
              className="py-2 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-colors flex items-center gap-1.5 shrink-0 cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>
        </div>

        {/* Share buttons */}
        <div className="grid grid-cols-2 gap-3 pt-2">
          <button
            onClick={handleNativeShare}
            className="py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <Share2 className="w-4 h-4" />
            Share via...
          </button>
          <button
            onClick={onClose}
            className="py-3 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-all flex items-center justify-center cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
