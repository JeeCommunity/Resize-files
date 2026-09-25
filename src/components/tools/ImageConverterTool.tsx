import React, { useState, useRef } from 'react';
import { Upload, Download, RefreshCw, Check, ArrowRight, Image as ImageIcon, ShieldCheck, HelpCircle } from 'lucide-react';
import { useLanguage } from '../../i18n/LanguageContext';

interface ImageConverterToolProps {
  route: string;
  title: string;
  description: string;
  fromFormat: string;
  toFormat: string;
  mimeType: string;
  extension: string;
}

export const ImageConverterTool: React.FC<ImageConverterToolProps> = ({
  route,
  title,
  description,
  fromFormat,
  toFormat,
  mimeType,
  extension,
}) => {
  const { t } = useLanguage();
  const cleanRoute = route.replace('/', '');
  const parts = cleanRoute.split('-');
  const camelKey = parts[0] + parts.slice(1).map(p => p.charAt(0).toUpperCase() + p.slice(1)).join('');
  const localizedTitle = t(camelKey + 'Title') || title;
  const localizedDesc = t(camelKey + 'Desc') || description;
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [resultSize, setResultSize] = useState<number>(0);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [bgChoice, setBgChoice] = useState<'white' | 'black' | 'transparent'>('white');
  const [dragOver, setDragOver] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelected = (selectedFile: File) => {
    setFile(selectedFile);
    setPreviewUrl(URL.createObjectURL(selectedFile));
    setResultUrl(null);
    processImage(selectedFile, mimeType, bgChoice);
  };

  const processImage = (imgFile: File, targetMime: string, bg: 'white' | 'black' | 'transparent') => {
    setIsProcessing(true);
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          setIsProcessing(false);
          return;
        }

        // Handle background color for JPG (which doesn't support transparency)
        if (targetMime === 'image/jpeg') {
          ctx.fillStyle = bg === 'black' ? '#000000' : '#ffffff';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
        }

        ctx.drawImage(img, 0, 0);

        canvas.toBlob((blob) => {
          if (blob) {
            setResultUrl(URL.createObjectURL(blob));
            setResultSize(blob.size);
          }
          setIsProcessing(false);
        }, targetMime, 0.92);
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(imgFile);
  };

  const handleBgChange = (newBg: 'white' | 'black' | 'transparent') => {
    setBgChoice(newBg);
    if (file) {
      processImage(file, mimeType, newBg);
    }
  };

  const handleDownload = () => {
    if (!resultUrl || !file) return;
    const baseName = file.name.substring(0, file.name.lastIndexOf('.')) || 'converted';
    const link = document.createElement('a');
    link.href = resultUrl;
    link.download = `${baseName}_converted.${extension}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleReset = () => {
    setFile(null);
    setPreviewUrl(null);
    setResultUrl(null);
    setResultSize(0);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 KB';
    const kb = bytes / 1000;
    if (kb < 1000) return `${kb.toFixed(2)} KB`;
    return `${(kb / 1000).toFixed(2)} MB`;
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
      {/* Header SEO section */}
      <div className="text-center space-y-3">
        <span className="text-xs font-bold px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 uppercase tracking-wider">
          {fromFormat} to {toFormat} Converter
        </span>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
          {localizedTitle}
        </h1>
        <p className="text-slate-600 max-w-2xl mx-auto text-sm sm:text-base">
          {localizedDesc}
        </p>
      </div>

      {/* Main Tool Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6">
        {!file ? (
          <div
            onDrop={(e) => {
              e.preventDefault();
              setDragOver(false);
              e.dataTransfer.files?.[0] && handleFileSelected(e.dataTransfer.files[0]);
            }}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all ${
              dragOver ? 'border-emerald-500 bg-emerald-50/50' : 'border-slate-300 hover:border-emerald-500 hover:bg-slate-50'
            }`}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={(e) => e.target.files?.[0] && handleFileSelected(e.target.files[0])}
              accept={`image/${fromFormat.toLowerCase() === 'jpg' ? 'jpeg,jpg' : fromFormat.toLowerCase()}`}
              className="hidden"
            />
            <div className="w-16 h-16 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-4 shadow-xs">
              <Upload className="w-8 h-8" />
            </div>
            <h3 className="font-bold text-lg text-slate-900 mb-1">{t('dragAndDrop')}</h3>
            <p className="text-xs text-slate-500 mb-4">{t('supports')}</p>
            <button className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm cursor-pointer">
              {t('choosePhoto')}
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Background choice for JPG output */}
            {mimeType === 'image/jpeg' && (
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-wrap items-center justify-between gap-4">
                <span className="text-xs font-bold text-slate-700">Transparency Background Color:</span>
                <div className="flex items-center space-x-2">
                  {(['white', 'black'] as const).map((b) => (
                    <button
                      key={b}
                      onClick={() => handleBgChange(b)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize border transition-all cursor-pointer ${
                        bgChoice === b ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white text-slate-700 border-slate-200'
                      }`}
                    >
                      {b} Background
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Previews */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 items-center">
              <div className="space-y-2">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Original ({fromFormat})</span>
                <div className="aspect-square rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center overflow-hidden p-2">
                  {previewUrl && <img src={previewUrl} alt="Original" className="max-h-full max-w-full object-contain" />}
                </div>
                <div className="text-xs text-slate-500 text-right">{formatBytes(file.size)}</div>
              </div>

              <div className="space-y-2">
                <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider">Converted ({toFormat})</span>
                <div className="aspect-square rounded-xl bg-slate-100 border-2 border-emerald-500 flex items-center justify-center overflow-hidden p-2 relative">
                  {isProcessing && (
                    <div className="absolute inset-0 bg-white/80 backdrop-blur-xs flex items-center justify-center text-xs font-bold text-emerald-600">
                      {t('converting')}
                    </div>
                  )}
                  {resultUrl && <img src={resultUrl} alt="Converted" className="max-h-full max-w-full object-contain" />}
                </div>
                <div className="text-xs font-semibold text-emerald-700 text-right">{resultSize > 0 ? formatBytes(resultSize) : '...'}</div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-slate-100">
              <button
                onClick={handleDownload}
                disabled={isProcessing || !resultUrl}
                className="flex-1 py-3.5 px-6 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white font-bold text-sm shadow-sm transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <Download className="w-4 h-4" />
                Download {toFormat} ({resultSize > 0 ? formatBytes(resultSize) : ''})
              </button>
              <button
                onClick={handleReset}
                className="py-3.5 px-6 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-sm transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" />
                {t('convertAnother')}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* SEO Educational Content */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 space-y-6 text-slate-700 text-sm">
        <h2 className="text-xl font-bold text-slate-900">How to convert {fromFormat} to {toFormat} online</h2>
        <ol className="list-decimal pl-5 space-y-2">
          <li>Click the upload box or drag and drop your {fromFormat} image file.</li>
          <li>Our browser engine instantly converts your image to {toFormat} with high fidelity.</li>
          <li>Preview the result and click <strong>Download {toFormat}</strong> to save it directly to your device.</li>
        </ol>

        <h3 className="text-lg font-bold text-slate-900 pt-4">{t('faqHeader')}</h3>
        <div className="space-y-4">
          <div>
            <h4 className="font-semibold text-slate-900">{t('faqSecureTitle')}</h4>
            <p className="text-xs text-slate-600 mt-1">{t('faqSecureDesc')}</p>
          </div>
          <div>
            <h4 className="font-semibold text-slate-900">{t('faqInstallTitle')}</h4>
            <p className="text-xs text-slate-600 mt-1">{t('faqInstallDesc')}</p>
          </div>
        </div>
      </div>
    </div>
  );
};
