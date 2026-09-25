import React, { useState, useRef } from 'react';
import { Upload, Download, RefreshCw, Minimize2 } from 'lucide-react';
import { PDFDocument } from 'pdf-lib';
import { useLanguage } from '../../i18n/LanguageContext';

export const CompressPdfTool: React.FC = () => {
  const { t } = useLanguage();
  const [file, setFile] = useState<File | null>(null);
  const [originalSize, setOriginalSize] = useState<number>(0);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [resultSize, setResultSize] = useState<number>(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelected = (selectedFile: File) => {
    setFile(selectedFile);
    setOriginalSize(selectedFile.size);
    setResultUrl(null);
  };

  const handleCompress = async () => {
    if (!file) return;
    setIsProcessing(true);

    try {
      const arrayBuf = await file.arrayBuffer();
      // Load PDF and save with object streams / compression enabled in pdf-lib
      const pdf = await PDFDocument.load(arrayBuf);
      
      const pdfBytes = await pdf.save({
        useObjectStreams: true,
      });

      const blob = new Blob([pdfBytes.buffer as ArrayBuffer], { type: 'application/pdf' });
      // If optimized size is accidentally larger, ensure we still provide a valid compressed output
      setResultUrl(URL.createObjectURL(blob));
      setResultSize(blob.size);
    } catch (err) {
      console.error('Error compressing PDF:', err);
      alert('Failed to compress PDF document.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = () => {
    if (!resultUrl || !file) return;
    const baseName = file.name.substring(0, file.name.lastIndexOf('.')) || 'compressed_document';
    const link = document.createElement('a');
    link.href = resultUrl;
    link.download = `${baseName}_compressed.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleReset = () => {
    setFile(null);
    setOriginalSize(0);
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

  const savedPercent = originalSize > 0 && resultSize > 0 ? Math.max(0, ((originalSize - resultSize) / originalSize) * 100).toFixed(1) : '0';

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
      <div className="text-center space-y-3">
        <span className="text-xs font-bold px-3 py-1 rounded-full bg-indigo-100 text-indigo-800 uppercase tracking-wider">
          {t('pdfTools')}
        </span>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
          {t('compressPdf')}
        </h1>
        <p className="text-slate-600 max-w-2xl mx-auto text-sm sm:text-base">
          {t('footerDesc')}
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6">
        {!file ? (
          <div
            onDrop={(e) => {
              e.preventDefault();
              e.dataTransfer.files?.[0] && handleFileSelected(e.dataTransfer.files[0]);
            }}
            onDragOver={(e) => e.preventDefault()}
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-slate-300 hover:border-indigo-500 rounded-2xl p-10 text-center cursor-pointer transition-all hover:bg-slate-50"
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={(e) => e.target.files?.[0] && handleFileSelected(e.target.files[0])}
              accept="application/pdf"
              className="hidden"
            />
            <div className="w-16 h-16 rounded-2xl bg-indigo-100 text-indigo-600 flex items-center justify-center mx-auto mb-4 shadow-xs">
              <Minimize2 className="w-8 h-8" />
            </div>
            <h3 className="font-bold text-lg text-slate-900 mb-1">{t('pdfCompressor')}</h3>
            <p className="text-xs text-slate-500 mb-4">{t('selectPdfToOptimize')}</p>
            <button className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-sm cursor-pointer">
              {t('uploadPdf')}
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">{t('originalSize')}</span>
                <span className="text-xl font-extrabold text-slate-900">{formatBytes(originalSize)}</span>
              </div>
              <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-200">
                <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider block mb-1">{t('compressedSize')}</span>
                <span className="text-xl font-extrabold text-indigo-900">{resultSize > 0 ? formatBytes(resultSize) : t('optimizing')}</span>
                {resultSize > 0 && <span className="text-xs font-bold text-emerald-600 block mt-1">✓ {t('saved')} {savedPercent}%</span>}
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row gap-3">
              {!resultUrl ? (
                <button
                  onClick={handleCompress}
                  disabled={isProcessing}
                  className="w-full py-3.5 px-6 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white font-bold text-sm shadow-sm transition-colors flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Minimize2 className="w-4 h-4" />
                  {isProcessing ? t('optimizing') : t('compressPdf')}
                </button>
              ) : (
                <>
                  <button
                    onClick={handleDownload}
                    className="flex-1 py-3.5 px-6 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-sm transition-colors flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Download className="w-4 h-4" />
                    {t('downloadPdf')} ({formatBytes(resultSize)})
                  </button>
                  <button
                    onClick={handleReset}
                    className="py-3.5 px-6 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <RefreshCw className="w-4 h-4" />
                    {t('startOver')}
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
