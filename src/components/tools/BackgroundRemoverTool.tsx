import React, { useState, useRef } from 'react';
import { 
  Upload, 
  Download, 
  RefreshCw, 
  AlertCircle, 
  Sparkles, 
  ShieldCheck,
  Cpu
} from 'lucide-react';
import { useLanguage } from '../../i18n/LanguageContext';

export const BackgroundRemoverTool: React.FC = () => {
  const { t } = useLanguage();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [originalUrl, setOriginalUrl] = useState<string>('');
  const [resultUrl, setResultUrl] = useState<string>('');
  const [status, setStatus] = useState<'idle' | 'loading_model' | 'processing' | 'success' | 'error'>('idle');
  const [progressMessage, setProgressMessage] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'bg' | 'crop' | 'adjust'>('bg');

  // Editor states
  const [width, setWidth] = useState<number>(800);
  const [height, setHeight] = useState<number>(800);
  const [blur, setBlur] = useState<number>(0);
  const [grayscale, setGrayscale] = useState<boolean>(false);
  const [sepia, setSepia] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelected = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setErrorMessage('Please upload a valid image file (JPG, PNG, WebP).');
      setStatus('error');
      return;
    }
    if (file.size > 50 * 1024 * 1024) {
      setErrorMessage('File size exceeds 50MB limit.');
      setStatus('error');
      return;
    }

    setErrorMessage('');
    setSelectedFile(file);
    if (originalUrl) URL.revokeObjectURL(originalUrl);
    setOriginalUrl(URL.createObjectURL(file));
    setResultUrl('');
    setStatus('idle');
  };

  async function removeBackgroundFromResizeFiles(imageFile: File) {
    const formData = new FormData();
    formData.append("file", imageFile);
    formData.append("model", "u2netp"); // Fast, lightweight & zero-download model (~4.7 MB)

    const response = await fetch("https://background-removal.resizefiles.blitz.cloud/remove-background", {
        method: "POST",
        body: formData
    });

    if (!response.ok) {
        throw new Error(`Background removal failed with status ${response.status}`);
    }

    // Server returns a transparent PNG blob
    const blob = await response.blob();
    const transparentImageUrl = URL.createObjectURL(blob);
    
    return transparentImageUrl; // Use this URL in your <img> tag src
  }

  const processImageLocally = async (operationType: string) => {
    if (!selectedFile) return;
    setErrorMessage('');

    try {
      if (operationType === 'bg_remove') {
        setStatus('loading_model');
        setProgressMessage('Uploading image to background removal backend...');

        const imageUrl = await removeBackgroundFromResizeFiles(selectedFile);
        if (!imageUrl) {
          throw new Error('Background removal failed.');
        }

        setStatus('success');
        setResultUrl(imageUrl);
      } else {
        // Fallback local canvas processing for resize/filters
        setStatus('processing');
        setProgressMessage('Processing image locally...');

        const img = new Image();
        img.src = originalUrl;
        await new Promise((resolve, reject) => {
          img.onload = resolve;
          img.onerror = reject;
        });

        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error('Canvas context failed');

        const w = width || img.naturalWidth;
        const h = height || img.naturalHeight;
        canvas.width = w;
        canvas.height = h;

        if (grayscale) ctx.filter = 'grayscale(100%)';
        if (sepia) ctx.filter = (ctx.filter ? ctx.filter + ' ' : '') + 'sepia(100%)';
        if (blur > 0) ctx.filter = (ctx.filter ? ctx.filter + ' ' : '') + `blur(${blur}px)`;

        ctx.drawImage(img, 0, 0, w, h);

        canvas.toBlob((blob) => {
          if (blob) {
            setResultUrl(URL.createObjectURL(blob));
            setStatus('success');
          } else {
            throw new Error('Failed to generate image blob');
          }
        }, 'image/png');
      }
    } catch (err: any) {
      console.error(err);
      setStatus('error');
      setErrorMessage(err.message || 'Background removal failed.');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight flex items-center justify-center gap-2">
          <Sparkles className="w-8 h-8 text-indigo-600" />
          AI Background Remover
        </h1>
        <p className="text-gray-600 mt-2 max-w-2xl mx-auto">
          Remove backgrounds instantly using high-performance AI background removal backend.
        </p>
        <div className="mt-3 inline-flex items-center gap-2 px-3 py-1 bg-emerald-50 text-emerald-700 text-xs font-medium rounded-full">
          <ShieldCheck className="w-4 h-4" /> Fast AI Processing
        </div>
      </div>

      {!selectedFile ? (
        <div 
          className="border-2 border-dashed border-gray-300 rounded-2xl p-12 text-center bg-white hover:border-indigo-500 transition-colors cursor-pointer shadow-sm"
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            if (e.dataTransfer.files?.[0]) handleFileSelected(e.dataTransfer.files[0]);
          }}
          onClick={() => fileInputRef.current?.click()}
        >
          <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Upload className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-semibold text-gray-800">Upload an image for AI background removal</h3>
          <p className="text-sm text-gray-500 mt-1">Supports JPG, PNG, WebP up to 50MB</p>
          <button className="mt-6 px-6 py-2.5 bg-indigo-600 text-white font-medium rounded-xl hover:bg-indigo-700 transition shadow-md">
            Select Image
          </button>
          <input 
            ref={fileInputRef} 
            type="file" 
            accept="image/*" 
            className="hidden" 
            onChange={(e) => e.target.files?.[0] && handleFileSelected(e.target.files[0])} 
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-800">Preview Studio</h3>
                <button 
                  onClick={() => setSelectedFile(null)}
                  className="text-sm text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-1"
                >
                  <RefreshCw className="w-4 h-4" /> Upload New Image
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="border border-gray-200 rounded-xl p-3 bg-gray-50 text-center">
                  <span className="text-xs font-semibold uppercase tracking-wider text-gray-500 block mb-2">Original Image</span>
                  <div className="h-64 flex items-center justify-center overflow-hidden bg-white rounded-lg border border-gray-100">
                    <img src={originalUrl} alt="Original" className="max-h-full max-w-full object-contain" />
                  </div>
                </div>

                <div className="border border-gray-200 rounded-xl p-3 bg-gray-50 text-center">
                  <span className="text-xs font-semibold uppercase tracking-wider text-indigo-600 block mb-2">Processed Result (Transparent PNG)</span>
                  <div className="h-64 flex items-center justify-center overflow-hidden rounded-lg border border-gray-100 relative" style={{ background: 'repeating-conic-gradient(#e5e7eb 0% 25%, #ffffff 0% 50%) 50% / 16px 16px' }}>
                    {(status === 'loading_model' || status === 'processing') ? (
                      <div className="flex flex-col items-center justify-center gap-3 p-4 text-center bg-white/90 inset-0 absolute">
                        <Cpu className="w-8 h-8 text-indigo-600 animate-pulse" />
                        <span className="text-sm text-gray-700 font-medium">{progressMessage}</span>
                      </div>
                    ) : resultUrl ? (
                      <img src={resultUrl} alt="Processed" className="max-h-full max-w-full object-contain" />
                    ) : (
                      <span className="text-sm text-gray-400">Click Remove Background to run AI</span>
                    )}
                  </div>
                </div>
              </div>

              {resultUrl && (
                <div className="mt-6 flex justify-end gap-3">
                  <a 
                    href={resultUrl} 
                    download="transparent-cutout.png"
                    className="px-6 py-2.5 bg-emerald-600 text-white font-medium rounded-xl hover:bg-emerald-700 transition shadow-md flex items-center gap-2"
                  >
                    <Download className="w-5 h-5" /> Download Transparent PNG
                  </a>
                </div>
              )}

              {errorMessage && (
                <div className="mt-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 shrink-0" /> {errorMessage}
                </div>
              )}
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 space-y-6">
            <h3 className="font-semibold text-gray-800 border-b pb-3">AI Studio</h3>

            <div className="flex flex-wrap gap-2">
              <button 
                onClick={() => setActiveTab('bg')}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition ${activeTab === 'bg' ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
              >
                AI Remove
              </button>
              <button 
                onClick={() => setActiveTab('crop')}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition ${activeTab === 'crop' ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
              >
                Resize
              </button>
              <button 
                onClick={() => setActiveTab('adjust')}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition ${activeTab === 'adjust' ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
              >
                Filters
              </button>
            </div>

            {activeTab === 'bg' && (
              <div className="space-y-4 pt-2">
                <h4 className="text-sm font-semibold text-gray-700">AI Background Removal</h4>
                <p className="text-xs text-gray-500">Extracts subject using high-performance background removal backend and returns transparent PNG.</p>
                <button 
                  onClick={() => processImageLocally('bg_remove')}
                  disabled={status === 'loading_model' || status === 'processing'}
                  className="w-full py-3 bg-indigo-600 text-white font-medium rounded-xl hover:bg-indigo-700 transition shadow-sm flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <Sparkles className="w-5 h-5" /> 
                  {status === 'loading_model' ? 'Removing Background...' : status === 'processing' ? 'Processing...' : 'Remove Background (AI)'}
                </button>
              </div>
            )}

            {activeTab === 'crop' && (
              <div className="space-y-4 pt-2">
                <h4 className="text-sm font-semibold text-gray-700">Resize Image</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-gray-600 block mb-1">Width (px)</label>
                    <input 
                      type="number" 
                      value={width} 
                      onChange={(e) => setWidth(parseInt(e.target.value) || 400)}
                      className="w-full border border-gray-300 rounded-xl px-3 py-1.5 text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-600 block mb-1">Height (px)</label>
                    <input 
                      type="number" 
                      value={height} 
                      onChange={(e) => setHeight(parseInt(e.target.value) || 400)}
                      className="w-full border border-gray-300 rounded-xl px-3 py-1.5 text-sm"
                    />
                  </div>
                </div>
                <button 
                  onClick={() => processImageLocally('smart_crop')}
                  className="w-full py-2.5 bg-indigo-600 text-white font-medium rounded-xl hover:bg-indigo-700 transition shadow-sm"
                >
                  Resize Image
                </button>
              </div>
            )}

            {activeTab === 'adjust' && (
              <div className="space-y-4 pt-2">
                <h4 className="text-sm font-semibold text-gray-700">Filters</h4>
                <div>
                  <label className="text-xs font-medium text-gray-600 block mb-1">Blur: {blur}</label>
                  <input 
                    type="range" min="0" max="10" step="0.5" value={blur}
                    onChange={(e) => setBlur(parseFloat(e.target.value))}
                    className="w-full accent-indigo-600"
                  />
                </div>
                <div className="flex items-center gap-4 pt-2">
                  <label className="flex items-center gap-2 text-xs font-medium text-gray-700 cursor-pointer">
                    <input type="checkbox" checked={grayscale} onChange={(e) => setGrayscale(e.target.checked)} className="rounded text-indigo-600" /> Grayscale
                  </label>
                  <label className="flex items-center gap-2 text-xs font-medium text-gray-700 cursor-pointer">
                    <input type="checkbox" checked={sepia} onChange={(e) => setSepia(e.target.checked)} className="rounded text-indigo-600" /> Sepia
                  </label>
                </div>
                <button 
                  onClick={() => processImageLocally('adjust')}
                  className="w-full py-2.5 bg-indigo-600 text-white font-medium rounded-xl hover:bg-indigo-700 transition shadow-sm"
                >
                  Apply Filters
                </button>
              </div>
            )}

          </div>
        </div>
      )}
    </div>
  );
};

