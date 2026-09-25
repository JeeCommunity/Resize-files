import React, { useState, useRef } from 'react';
import { 
  Upload, 
  Download, 
  RefreshCw, 
  CheckCircle2, 
  AlertCircle, 
  ShieldCheck, 
  Sparkles, 
  Palette,
  Sliders
} from 'lucide-react';
import { useLanguage } from '../../i18n/LanguageContext';

interface BackgroundRemoverToolProps {
  title?: string;
  description?: string;
}

export const BackgroundRemoverTool: React.FC<BackgroundRemoverToolProps> = () => {
  const { t } = useLanguage();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [originalUrl, setOriginalUrl] = useState<string>('');
  const [resultBlob, setResultBlob] = useState<Blob | null>(null);
  const [resultUrl, setResultUrl] = useState<string>('');
  
  const [imageDimensions, setImageDimensions] = useState<{ width: number; height: number }>({ width: 0, height: 0 });
  const [status, setStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string>('');
  
  const [removalMode, setRemovalMode] = useState<'white' | 'black' | 'auto'>('auto');
  const [tolerance, setTolerance] = useState<number>(35);
  const [bgColor, setBgColor] = useState<string>('transparent');
  const [processingTimeMs, setProcessingTimeMs] = useState<number>(0);
  const [outputFileSize, setOutputFileSize] = useState<number>(0);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState<boolean>(false);

  const handleFileSelected = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setErrorMessage('Please upload a valid image file (JPG, PNG, WebP).');
      setStatus('error');
      return;
    }

    if (file.size > 40 * 1024 * 1024) {
      setErrorMessage('Image size is too large (> 40MB). Please select a smaller image.');
      setStatus('error');
      return;
    }

    setErrorMessage('');
    setSelectedFile(file);
    setResultBlob(null);
    setResultUrl('');
    setStatus('idle');

    if (originalUrl) URL.revokeObjectURL(originalUrl);
    const url = URL.createObjectURL(file);
    setOriginalUrl(url);

    const img = new window.Image();
    img.onload = () => {
      setImageDimensions({ width: img.naturalWidth, height: img.naturalHeight });
      processImage(file, removalMode, tolerance, bgColor);
    };
    img.src = url;
  };

  const processImage = (fileToProcess: File, mode: 'white' | 'black' | 'auto', tol: number, bg: string) => {
    const startTime = performance.now();
    setStatus('processing');

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new window.Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          setStatus('error');
          setErrorMessage('Could not initialize canvas context.');
          return;
        }

        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        ctx.drawImage(img, 0, 0);

        const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imgData.data;

        // Determine background color to remove
        let targetR = 255, targetG = 255, targetB = 255;
        if (mode === 'black') {
          targetR = 0; targetG = 0; targetB = 0;
        } else if (mode === 'auto') {
          // Sample top-left corner pixel as background reference
          targetR = data[0];
          targetG = data[1];
          targetB = data[2];
        }

        // Process pixels
        for (let i = 0; i < data.length; i += 4) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];

          // Calculate color distance from target background
          const diff = Math.sqrt(
            Math.pow(r - targetR, 2) +
            Math.pow(g - targetG, 2) +
            Math.pow(b - targetB, 2)
          );

          if (diff <= tol) {
            if (bg === 'transparent') {
              data[i + 3] = 0; // Make transparent
            } else if (bg === 'white') {
              data[i] = 255; data[i + 1] = 255; data[i + 2] = 255; data[i + 3] = 255;
            } else if (bg === 'black') {
              data[i] = 0; data[i + 1] = 0; data[i + 2] = 0; data[i + 3] = 255;
            } else if (bg === 'red') {
              data[i] = 239; data[i + 1] = 68; data[i + 2] = 68; data[i + 3] = 255;
            } else if (bg === 'blue') {
              data[i] = 59; data[i + 1] = 130; data[i + 2] = 246; data[i + 3] = 255;
            }
          }
        }

        ctx.putImageData(imgData, 0, 0);

        canvas.toBlob((blob) => {
          if (blob) {
            setResultBlob(blob);
            setResultUrl(URL.createObjectURL(blob));
            setOutputFileSize(blob.size);
            const endTime = performance.now();
            setProcessingTimeMs(Math.round(endTime - startTime));
            setStatus('success');
          } else {
            setStatus('error');
            setErrorMessage('Failed to generate output image.');
          }
        }, 'image/png', 0.95);
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(fileToProcess);
  };

  const handleModeChange = (newMode: 'white' | 'black' | 'auto') => {
    setRemovalMode(newMode);
    if (selectedFile) {
      processImage(selectedFile, newMode, tolerance, bgColor);
    }
  };

  const handleToleranceChange = (newTol: number) => {
    setTolerance(newTol);
    if (selectedFile) {
      processImage(selectedFile, removalMode, newTol, bgColor);
    }
  };

  const handleBgColorChange = (newBg: string) => {
    setBgColor(newBg);
    if (selectedFile) {
      processImage(selectedFile, removalMode, tolerance, newBg);
    }
  };

  const handleDownload = () => {
    if (!resultBlob || !selectedFile) return;
    const baseName = selectedFile.name.substring(0, selectedFile.name.lastIndexOf('.')) || 'image';
    const link = document.createElement('a');
    link.href = resultUrl;
    link.download = `${baseName}_no_bg.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleReset = () => {
    setSelectedFile(null);
    setOriginalUrl('');
    setResultBlob(null);
    setResultUrl('');
    setStatus('idle');
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
          AI Background Remover
        </span>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
          {t('bgRemoverTitle')}
        </h1>
        <p className="text-slate-600 max-w-2xl mx-auto text-sm sm:text-base">
          {t('bgRemoverDesc')}
        </p>
      </div>

      {/* Main Tool Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6">
        {!selectedFile ? (
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
              accept="image/*"
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
            {/* Controls */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">{t('backgroundDetection')}</label>
                <div className="flex gap-1">
                  {(['auto', 'white', 'black'] as const).map((m) => (
                    <button
                      key={m}
                      onClick={() => handleModeChange(m)}
                      className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-semibold uppercase border transition-all cursor-pointer ${
                        removalMode === m ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white text-slate-700 border-slate-200'
                      }`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">{t('sensitivityTolerance')} ({tolerance})</label>
                <input
                  type="range"
                  min="5"
                  max="100"
                  value={tolerance}
                  onChange={(e) => handleToleranceChange(Number(e.target.value))}
                  className="w-full accent-emerald-600 mt-2"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">{t('backgroundFill')}</label>
                <div className="flex gap-1">
                  {[
                    { id: 'transparent', label: 'Trans' },
                    { id: 'white', label: 'White' },
                    { id: 'red', label: 'Red' },
                    { id: 'blue', label: 'Blue' }
                  ].map((bg) => (
                    <button
                      key={bg.id}
                      onClick={() => handleBgColorChange(bg.id)}
                      className={`flex-1 py-1.5 px-1 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                        bgColor === bg.id ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white text-slate-700 border-slate-200'
                      }`}
                    >
                      {bg.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Previews */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 items-center">
              <div className="space-y-2">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">{t('originalImage')}</span>
                <div className="aspect-square rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center overflow-hidden p-2">
                  <img src={originalUrl} alt="Original" className="max-h-full max-w-full object-contain" />
                </div>
                <div className="text-xs text-slate-500 text-right">{imageDimensions.width}x{imageDimensions.height} px ({formatBytes(selectedFile.size)})</div>
              </div>

              <div className="space-y-2">
                <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider">{t('backgroundRemovedPng')}</span>
                <div 
                  className="aspect-square rounded-xl border-2 border-emerald-500 flex items-center justify-center overflow-hidden p-2 relative"
                  style={{
                    backgroundColor: bgColor === 'transparent' ? undefined : bgColor,
                    backgroundImage: bgColor === 'transparent' ? 'linear-gradient(45deg, #e2e8f0 25%, transparent 25%), linear-gradient(-45deg, #e2e8f0 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #e2e8f0 75%), linear-gradient(-45deg, transparent 75%, #e2e8f0 75%)' : undefined,
                    backgroundSize: '16px 16px',
                    backgroundPosition: '0 0, 0 8px, 8px -8px, -8px 0px'
                  }}
                >
                  {status === 'processing' && (
                    <div className="absolute inset-0 bg-white/80 backdrop-blur-xs flex items-center justify-center text-xs font-bold text-emerald-600">
                      {t('processingBackground')}
                    </div>
                  )}
                  {resultUrl && <img src={resultUrl} alt="Result" className="max-h-full max-w-full object-contain" />}
                </div>
                <div className="text-xs font-semibold text-emerald-700 text-right">
                  {status === 'success' ? `${formatBytes(outputFileSize)} • ${processingTimeMs}ms` : '...'}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-slate-100">
              <button
                onClick={handleDownload}
                disabled={status === 'processing' || !resultUrl}
                className="flex-1 py-3.5 px-6 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white font-bold text-sm shadow-sm transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <Download className="w-4 h-4" />
                {t('downloadTransparentPng')} ({formatBytes(outputFileSize)})
              </button>
              <button
                onClick={handleReset}
                className="py-3.5 px-6 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-sm transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" />
                {t('removeAnotherBackground')}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* SEO Educational Content */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 space-y-6 text-slate-700 text-sm">
        <h2 className="text-xl font-bold text-slate-900">{t('howToRemoveBg')}</h2>
        <ol className="list-decimal pl-5 space-y-2">
          <li>Upload your photo or drag and drop it into the upload box.</li>
          <li>Our browser engine instantly detects and removes the background pixels.</li>
          <li>Adjust tolerance if needed, then click <strong>{t('downloadTransparentPng')}</strong>.</li>
        </ol>

        <h3 className="text-lg font-bold text-slate-900 pt-4">{t('faq')}</h3>
        <div className="space-y-4">
          <div>
            <h4 className="font-semibold text-slate-900">{t('isMyDataSecure')}</h4>
            <p className="text-xs text-slate-600 mt-1">{t('isMyDataSecureDesc')}</p>
          </div>
          <div>
            <h4 className="font-semibold text-slate-900">{t('doINeedSoftware')}</h4>
            <p className="text-xs text-slate-600 mt-1">{t('doINeedSoftwareDesc')}</p>
          </div>
        </div>
      </div>
    </div>
  );
};
