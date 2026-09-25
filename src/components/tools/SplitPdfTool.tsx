import React, { useState, useRef } from 'react';
import { Upload, Download, RefreshCw, Scissors, FileText } from 'lucide-react';
import { PDFDocument } from 'pdf-lib';
import { useLanguage } from '../../i18n/LanguageContext';

export const SplitPdfTool: React.FC = () => {
  const { t } = useLanguage();
  const [file, setFile] = useState<File | null>(null);
  const [pageCount, setPageCount] = useState<number>(0);
  const [splitRange, setSplitRange] = useState<string>('1-1');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [resultSize, setResultSize] = useState<number>(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelected = async (selectedFile: File) => {
    setFile(selectedFile);
    setIsProcessing(true);
    try {
      const arrayBuf = await selectedFile.arrayBuffer();
      const pdf = await PDFDocument.load(arrayBuf);
      const count = pdf.getPageCount();
      setPageCount(count);
      setSplitRange(`1-${count}`);
      setResultUrl(null);
    } catch (err) {
      console.error('Error reading PDF:', err);
      alert('Failed to read PDF file.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSplit = async () => {
    if (!file) return;
    setIsProcessing(true);

    try {
      const arrayBuf = await file.arrayBuffer();
      const srcPdf = await PDFDocument.load(arrayBuf);
      const newPdf = await PDFDocument.create();

      // Parse range e.g. "1-3" or "2"
      const parts = splitRange.split('-').map(p => parseInt(p.trim(), 10));
      let start = parts[0];
      let end = parts.length > 1 ? parts[1] : start;

      if (isNaN(start) || start < 1) start = 1;
      if (isNaN(end) || end > pageCount) end = pageCount;
      if (start > end) start = end;

      const indices = [];
      for (let i = start - 1; i <= end - 1; i++) {
        indices.push(i);
      }

      const copiedPages = await newPdf.copyPages(srcPdf, indices);
      copiedPages.forEach(p => newPdf.addPage(p));

      const pdfBytes = await newPdf.save();
      const blob = new Blob([pdfBytes.buffer as ArrayBuffer], { type: 'application/pdf' });
      setResultUrl(URL.createObjectURL(blob));
      setResultSize(blob.size);
    } catch (err) {
      console.error('Error splitting PDF:', err);
      alert('Failed to split PDF. Please check the page range.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = () => {
    if (!resultUrl || !file) return;
    const baseName = file.name.substring(0, file.name.lastIndexOf('.')) || 'split_document';
    const link = document.createElement('a');
    link.href = resultUrl;
    link.download = `${baseName}_split.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleReset = () => {
    setFile(null);
    setPageCount(0);
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
      <div className="text-center space-y-3">
        <span className="text-xs font-bold px-3 py-1 rounded-full bg-indigo-100 text-indigo-800 uppercase tracking-wider">
          {t('pdfTools')}
        </span>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
          {t('splitPdf')}
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
              <Scissors className="w-8 h-8" />
            </div>
            <h3 className="font-bold text-lg text-slate-900 mb-1">{t('uploadPdfDoc')}</h3>
            <p className="text-xs text-slate-500 mb-4">{t('selectPdfToSplit')}</p>
            <button className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-sm cursor-pointer">
              {t('uploadPdf')}
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex items-center justify-between">
              <div>
                <span className="font-bold text-slate-900 block text-sm">{file.name}</span>
                <span className="text-xs text-slate-500">{t('totalPages')}: {pageCount}</span>
              </div>
              <button
                onClick={handleReset}
                className="py-1.5 px-3 rounded-lg bg-slate-200 text-slate-700 font-semibold text-xs cursor-pointer"
              >
                {t('startOver')}
              </button>
            </div>

            <div>
              <label className="block font-bold text-slate-700 text-xs mb-2">Page Range to Extract (e.g., 1-3)</label>
              <input
                type="text"
                value={splitRange}
                onChange={(e) => setSplitRange(e.target.value)}
                placeholder={`1-${pageCount}`}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row gap-3">
              {!resultUrl ? (
                <button
                  onClick={handleSplit}
                  disabled={isProcessing}
                  className="w-full py-3.5 px-6 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white font-bold text-sm shadow-sm transition-colors flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Scissors className="w-4 h-4" />
                  {isProcessing ? t('optimizing') : t('splitPdf')}
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
                    className="py-3.5 px-6 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-sm transition-colors flex items-center justify-center gap-2 cursor-pointer"
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
