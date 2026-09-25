import React, { useState, useRef } from 'react';
import { Upload, Download, RefreshCw, FileText, X, Check, Eye } from 'lucide-react';
import { useLanguage } from '../../i18n/LanguageContext';
import { convertPdfToImages, createZip, downloadBlob, ConvertedPageResult } from '../../utils/pdfToImageService';

interface PdfToImageToolProps {
  titleKey?: string;
  descKey?: string;
  title?: string;
  description?: string;
  outputFormat: 'image/jpeg' | 'image/png';
  extension: string;
}

export const PdfToImageTool: React.FC<PdfToImageToolProps> = ({
  titleKey,
  descKey,
  title,
  description,
  outputFormat: initialFormat,
  extension: initialExtension,
}) => {
  const { t } = useLanguage();
  const displayTitle = titleKey ? t(titleKey) : (title || t('pdfToJpgTitle'));
  const displayDesc = descKey ? t(descKey) : (description || t('pdfToJpgDesc'));

  const [file, setFile] = useState<File | null>(null);
  const [format, setFormat] = useState<'jpg' | 'png'>(initialFormat === 'image/png' ? 'png' : 'jpg');
  const [quality, setQuality] = useState<number>(0.9); // 0.6, 0.8, 0.9, 1.0
  const [scale, setScale] = useState<number>(1.5); // 1.0 = standard, 1.5 = high, 2.0 = ultra
  const [pageSelectionMode, setPageSelectionMode] = useState<'all' | 'custom'>('all');
  const [customPagesInput, setCustomPagesInput] = useState<string>('');
  const [totalPagesCount, setTotalPagesCount] = useState<number>(0);

  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [progressPercent, setProgressPercent] = useState<number>(0);
  const [progressText, setProgressText] = useState<string>('');
  const [results, setResults] = useState<ConvertedPageResult[]>([]);
  const [abortController, setAbortController] = useState<AbortController | null>(null);
  const [isZipping, setIsZipping] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelected = async (selectedFile: File) => {
    if (selectedFile.type !== 'application/pdf') {
      alert('Please select a valid PDF file.');
      return;
    }
    setFile(selectedFile);
    setResults([]);

    try {
      const arrayBuffer = await selectedFile.arrayBuffer();
      import('pdfjs-dist').then(async (pdfjsLib) => {
        pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js`;
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        setTotalPagesCount(pdf.numPages);
      });
    } catch (e) {
      console.error('Error reading pdf info:', e);
    }
  };

  const handleStartConversion = async () => {
    if (!file) return;

    setIsProcessing(true);
    setProgressPercent(0);
    setProgressText(t('preparingConversion'));
    const controller = new AbortController();
    setAbortController(controller);

    let selectedPages: number[] | null = null;
    if (pageSelectionMode === 'custom' && customPagesInput.trim()) {
      const parsed = customPagesInput
        .split(',')
        .map((p) => parseInt(p.trim(), 10))
        .filter((p) => !isNaN(p) && p > 0);
      if (parsed.length > 0) {
        selectedPages = parsed;
      }
    }

    try {
      const converted = await convertPdfToImages(file, {
        format,
        quality,
        scale,
        selectedPages,
        onProgress: (p) => {
          setProgressPercent(p.percent);
          setProgressText(`${t('renderingPageOf')} ${p.current} / ${p.total} (${p.percent}%)...`);
        },
        signal: controller.signal,
      });

      setResults(converted);
    } catch (err: any) {
      if (err.name === 'AbortError') {
        setProgressText(t('conversionCancelled'));
      } else {
        console.error('Conversion error:', err);
        alert(err.message || 'Failed to convert PDF to images.');
      }
    } finally {
      setIsProcessing(false);
      setAbortController(null);
    }
  };

  const handleCancel = () => {
    if (abortController) {
      abortController.abort();
    }
  };

  const handleDownloadSingle = (res: ConvertedPageResult) => {
    downloadBlob(res.blob, res.filename);
  };

  const handleDownloadZip = async () => {
    if (results.length === 0) return;
    setIsZipping(true);
    try {
      const zipBlob = await createZip(results);
      const baseName = file ? file.name.substring(0, file.name.lastIndexOf('.')) || 'document' : 'converted';
      downloadBlob(zipBlob, `${baseName}_images.zip`);
    } catch (err) {
      console.error('Error creating ZIP:', err);
      alert('Failed to create ZIP archive.');
    } finally {
      setIsZipping(false);
    }
  };

  const handleReset = () => {
    setFile(null);
    setResults([]);
    setTotalPagesCount(0);
    setCustomPagesInput('');
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
          {t('pdfToImageConverter')}
        </span>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
          {displayTitle}
        </h1>
        <p className="text-slate-600 max-w-2xl mx-auto text-sm sm:text-base">
          {displayDesc}
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
              <Upload className="w-8 h-8" />
            </div>
            <h3 className="font-bold text-lg text-slate-900 mb-1">{t('uploadPdfDoc')}</h3>
            <p className="text-xs text-slate-500 mb-4">{t('selectPdfFileToExtractPages')}</p>
            <button className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-sm cursor-pointer">
              {t('uploadPdf')}
            </button>
          </div>
        ) : results.length === 0 && !isProcessing ? (
          <div className="space-y-6">
            <div className="flex items-center justify-between bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div>
                <span className="font-bold text-slate-900 block text-sm">{file.name}</span>
                <span className="text-xs text-slate-500">
                  {totalPagesCount > 0 ? `${totalPagesCount} pages detected` : 'PDF loaded'}
                </span>
              </div>
              <button
                onClick={handleReset}
                className="py-1.5 px-3 rounded-lg bg-slate-200 text-slate-700 font-semibold text-xs cursor-pointer"
              >
                {t('startOver')}
              </button>
            </div>

            {/* Options configuration */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">{t('outputFormatLabel')}</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setFormat('jpg')}
                    className={`py-2.5 rounded-xl font-bold text-xs border transition-all cursor-pointer ${
                      format === 'jpg'
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    {t('jpgImage')}
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormat('png')}
                    className={`py-2.5 rounded-xl font-bold text-xs border transition-all cursor-pointer ${
                      format === 'png'
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    {t('pngImage')}
                  </button>
                </div>
              </div>

              {format === 'jpg' && (
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">{t('jpgQuality')}</label>
                  <select
                    value={quality}
                    onChange={(e) => setQuality(parseFloat(e.target.value))}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value={0.6}>60% ({t('smallerSize')})</option>
                    <option value={0.8}>80% ({t('goodQuality')})</option>
                    <option value={0.9}>90% ({t('highQuality')})</option>
                    <option value={1.0}>100% ({t('maximumQuality')})</option>
                  </select>
                </div>
              )}

              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">{t('resolutionScale')}</label>
                <select
                  value={scale}
                  onChange={(e) => setScale(parseFloat(e.target.value))}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value={1.0}>{t('standardScale')}</option>
                  <option value={1.5}>{t('highScale')}</option>
                  <option value={2.0}>{t('ultraScale')}</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">{t('pagesToConvert')}</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setPageSelectionMode('all')}
                    className={`py-2.5 rounded-xl font-bold text-xs border transition-all cursor-pointer ${
                      pageSelectionMode === 'all'
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    {t('allPages')} ({totalPagesCount})
                  </button>
                  <button
                    type="button"
                    onClick={() => setPageSelectionMode('custom')}
                    className={`py-2.5 rounded-xl font-bold text-xs border transition-all cursor-pointer ${
                      pageSelectionMode === 'custom'
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    {t('customPages')}
                  </button>
                </div>
              </div>
            </div>

            {pageSelectionMode === 'custom' && (
              <div className="space-y-1.5 pt-2">
                <label className="block text-xs font-bold text-slate-700">{t('enterPageNumbers')}</label>
                <input
                  type="text"
                  value={customPagesInput}
                  onChange={(e) => setCustomPagesInput(e.target.value)}
                  placeholder="e.g. 1, 2, 4"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            )}

            <button
              onClick={handleStartConversion}
              className="w-full py-4 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>{t('convertPdfButton')} {format.toUpperCase()}</span>
            </button>
          </div>
        ) : isProcessing ? (
          <div className="py-16 text-center space-y-6">
            <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
            <div className="space-y-2 max-w-sm mx-auto">
              <div className="flex justify-between text-xs font-bold text-slate-700">
                <span>{progressText}</span>
                <span>{progressPercent}%</span>
              </div>
              <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden">
                <div className="bg-indigo-600 h-full transition-all duration-200" style={{ width: `${progressPercent}%` }} />
              </div>
            </div>
            <button
              onClick={handleCancel}
              className="py-2.5 px-6 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs transition-colors cursor-pointer border border-rose-200"
            >
              {t('cancelConversion')}
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-center justify-between bg-slate-50 p-4 rounded-xl border border-slate-200 gap-3">
              <div>
                <span className="font-bold text-slate-900 block text-sm">{file.name}</span>
                <span className="text-xs text-slate-500">{results.length} {t('pagesSuccessfullyConverted')} ({format.toUpperCase()})</span>
              </div>
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  onClick={handleDownloadZip}
                  disabled={isZipping}
                  className="flex-1 sm:flex-none py-2.5 px-5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:bg-slate-300"
                >
                  <Download className="w-4 h-4" />
                  {isZipping ? t('generatingZip') : t('downloadAllZip')}
                </button>
                <button
                  onClick={handleReset}
                  className="py-2.5 px-4 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold text-xs transition-colors cursor-pointer"
                >
                  {t('startOver')}
                </button>
              </div>
            </div>

            {/* Previews Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 max-h-[550px] overflow-y-auto p-2">
              {results.map((res) => (
                <div key={res.pageNumber} className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex flex-col justify-between space-y-3">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                    <span>Page {res.pageNumber} ({format.toUpperCase()})</span>
                    <span className="text-slate-400 font-normal">{formatBytes(res.sizeBytes)}</span>
                  </div>
                  <div className="aspect-[3/4] rounded-lg bg-slate-100 border border-slate-100 overflow-hidden flex items-center justify-center p-2 relative group">
                    <img src={res.url} alt={`Page ${res.pageNumber}`} className="max-h-full max-w-full object-contain shadow-xs" />
                    <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <a
                        href={res.url}
                        target="_blank"
                        rel="noreferrer"
                        className="p-2 rounded-lg bg-white text-slate-800 hover:bg-slate-100 shadow-sm"
                        title={t('viewFullSize')}
                      >
                        <Eye className="w-4 h-4" />
                      </a>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDownloadSingle(res)}
                    className="w-full py-2 px-3 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    {t('downloadPage')} {res.pageNumber}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
