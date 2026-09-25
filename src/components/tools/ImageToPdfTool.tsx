import React, { useState, useRef } from 'react';
import { Upload, Download, RefreshCw, FileText, Trash2, Loader2 } from 'lucide-react';
import { PDFDocument } from 'pdf-lib';
import { useLanguage } from '../../i18n/LanguageContext';

interface ImageToPdfToolProps {
  titleKey?: string;
  descKey?: string;
  title?: string;
  description?: string;
  allowedExts?: string;
}

export const ImageToPdfTool: React.FC<ImageToPdfToolProps> = ({
  titleKey,
  descKey,
  title,
  description,
  allowedExts = "image/jpeg,image/png,image/webp,image/bmp"
}) => {
  const { t } = useLanguage();
  const displayTitle = titleKey ? t(titleKey) : (title || t('convertImagesToPdfTitle'));
  const displayDesc = descKey ? t(descKey) : (description || t('convertImagesToPdfDesc'));
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [pageSize, setPageSize] = useState<'a4' | 'letter' | 'fit'>('a4');
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [progressText, setProgressText] = useState<string>('');
  const [pdfResultUrl, setPdfResultUrl] = useState<string | null>(null);
  const [pdfSize, setPdfSize] = useState<number>(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFilesSelected = (newFiles: FileList | File[]) => {
    const fileArray = Array.from(newFiles);
    const updatedFiles = [...files, ...fileArray];
    setFiles(updatedFiles);

    const newPreviews = fileArray.map(f => URL.createObjectURL(f));
    setPreviews(prev => [...prev, ...newPreviews]);
    setPdfResultUrl(null);
  };

  const removeFile = (index: number) => {
    const updatedFiles = files.filter((_, i) => i !== index);
    const updatedPreviews = previews.filter((_, i) => i !== index);
    setFiles(updatedFiles);
    setPreviews(updatedPreviews);
    setPdfResultUrl(null);
  };

  // Robust image loader & normalizer via canvas (handles WebP, PNG, JPEG, BMP & prevents OOM on 40+ high-res images)
  const processImageToBuffer = async (file: File): Promise<{ arrayBuf: ArrayBuffer; isPng: boolean }> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          
          // Limit max dimension to 2000px to ensure smooth batch processing of 40+ images without memory issues
          const MAX_DIMENSION = 2000;
          if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
            if (width > height) {
              height = Math.round((height * MAX_DIMENSION) / width);
              width = MAX_DIMENSION;
            } else {
              width = Math.round((width * MAX_DIMENSION) / height);
              height = MAX_DIMENSION;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error('Could not initialize canvas context'));
            return;
          }

          // Fill white background for transparent images when converted to JPEG
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(0, 0, width, height);
          ctx.drawImage(img, 0, 0, width, height);

          const isPng = file.type === 'image/png';
          const mimeType = isPng ? 'image/png' : 'image/jpeg';
          const quality = isPng ? undefined : 0.90;

          canvas.toBlob(
            (blob) => {
              if (!blob) {
                reject(new Error('Failed to encode image blob'));
                return;
              }
              blob.arrayBuffer().then((buf) => {
                resolve({ arrayBuf: buf, isPng });
              }).catch(reject);
            },
            mimeType,
            quality
          );
        };
        img.onerror = () => reject(new Error(`Failed to decode image: ${file.name}`));
        img.src = e.target?.result as string;
      };
      reader.onerror = () => reject(new Error(`Failed to read file: ${file.name}`));
      reader.readAsDataURL(file);
    });
  };

  const handleGeneratePdf = async () => {
    if (files.length === 0) return;
    setIsProcessing(true);
    setProgressText(t('initializingPdf'));

    try {
      const pdfDoc = await PDFDocument.create();

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        setProgressText(`${t('processingImageOf')} ${i + 1} of ${files.length}...`);

        let arrayBuf: ArrayBuffer;
        let isPng: boolean;

        try {
          const processed = await processImageToBuffer(file);
          arrayBuf = processed.arrayBuf;
          isPng = processed.isPng;
        } catch (imgErr) {
          console.warn(`Skipping corrupted or unsupported image #${i + 1} (${file.name}):`, imgErr);
          continue; // Skip faulty image rather than aborting entire batch
        }
        
        let embeddedImage;
        if (isPng) {
          embeddedImage = await pdfDoc.embedPng(arrayBuf);
        } else {
          embeddedImage = await pdfDoc.embedJpg(arrayBuf);
        }

        const imgDims = embeddedImage.scale(1);

        // Page dimensions in points (72 pt per inch)
        let pageWidth = 595.28; // A4 width
        let pageHeight = 841.89; // A4 height

        if (pageSize === 'letter') {
          pageWidth = 612;
          pageHeight = 792;
        } else if (pageSize === 'fit') {
          pageWidth = imgDims.width;
          pageHeight = imgDims.height;
        }

        if (orientation === 'landscape' && pageSize !== 'fit') {
          const temp = pageWidth;
          pageWidth = pageHeight;
          pageHeight = temp;
        }

        const page = pdfDoc.addPage([pageWidth, pageHeight]);

        if (pageSize === 'fit') {
          page.drawImage(embeddedImage, {
            x: 0,
            y: 0,
            width: imgDims.width,
            height: imgDims.height,
          });
        } else {
          // Scale to fit inside page with margins
          const margin = 40;
          const availableWidth = pageWidth - (margin * 2);
          const availableHeight = pageHeight - (margin * 2);

          const scale = Math.min(availableWidth / imgDims.width, availableHeight / imgDims.height);
          const w = imgDims.width * scale;
          const h = imgDims.height * scale;
          const x = (pageWidth - w) / 2;
          const y = (pageHeight - h) / 2;

          page.drawImage(embeddedImage, {
            x,
            y,
            width: w,
            height: h,
          });
        }
      }

      setProgressText(t('finalizingPdfDocument'));
      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes.buffer as ArrayBuffer], { type: 'application/pdf' });
      setPdfResultUrl(URL.createObjectURL(blob));
      setPdfSize(blob.size);
    } catch (err: any) {
      console.error('Error generating PDF:', err);
      alert(`Failed to generate PDF: ${err?.message || 'Please check uploaded image files.'}`);
    } finally {
      setIsProcessing(false);
      setProgressText('');
    }
  };

  const handleDownload = () => {
    if (!pdfResultUrl) return;
    const link = document.createElement('a');
    link.href = pdfResultUrl;
    link.download = `converted_images.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleReset = () => {
    setFiles([]);
    setPreviews([]);
    setPdfResultUrl(null);
    setPdfSize(0);
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
          {t('pdfCreator')}
        </span>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
          {displayTitle}
        </h1>
        <p className="text-slate-600 max-w-2xl mx-auto text-sm sm:text-base">
          {displayDesc}
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6">
        {files.length === 0 ? (
          <div
            onDrop={(e) => {
              e.preventDefault();
              e.dataTransfer.files && handleFilesSelected(e.dataTransfer.files);
            }}
            onDragOver={(e) => e.preventDefault()}
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-slate-300 hover:border-indigo-500 rounded-2xl p-10 text-center cursor-pointer transition-all hover:bg-slate-50"
          >
            <input
              type="file"
              ref={fileInputRef}
              multiple
              onChange={(e) => e.target.files && handleFilesSelected(e.target.files)}
              accept={allowedExts}
              className="hidden"
            />
            <div className="w-16 h-16 rounded-2xl bg-indigo-100 text-indigo-600 flex items-center justify-center mx-auto mb-4 shadow-xs">
              <Upload className="w-8 h-8" />
            </div>
            <h3 className="font-bold text-lg text-slate-900 mb-1">{t('uploadImages')}</h3>
            <p className="text-xs text-slate-500 mb-4">{t('selectImagesPrompt')}</p>
            <button className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-sm cursor-pointer">
              {t('uploadImage')}
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Options */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">{t('pageSize')}</label>
                <select
                  value={pageSize}
                  onChange={(e) => setPageSize(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white font-medium"
                >
                  <option value="a4">{t('a4Standard')}</option>
                  <option value="letter">{t('usLetter')}</option>
                  <option value="fit">{t('fitToImage')}</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">{t('orientation')}</label>
                <select
                  value={orientation}
                  onChange={(e) => setOrientation(e.target.value as any)}
                  disabled={pageSize === 'fit'}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white font-medium disabled:opacity-50"
                >
                  <option value="portrait">{t('portrait')}</option>
                  <option value="landscape">{t('landscape')}</option>
                </select>
              </div>
            </div>

            {/* Thumbnail Grid */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">{t('selectedImages')} ({files.length})</span>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="text-xs font-bold text-indigo-600 hover:text-indigo-700 cursor-pointer"
                >
                  {t('addMoreImages')}
                </button>
                <input
                  type="file"
                  ref={fileInputRef}
                  multiple
                  onChange={(e) => e.target.files && handleFilesSelected(e.target.files)}
                  accept={allowedExts}
                  className="hidden"
                />
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-h-60 overflow-y-auto p-2 border border-slate-200 rounded-xl bg-slate-50">
                {previews.map((url, idx) => (
                  <div key={idx} className="relative aspect-square rounded-lg bg-white border border-slate-200 overflow-hidden group shadow-xs">
                    <img src={url} alt={`Preview ${idx}`} className="w-full h-full object-cover" />
                    <button
                      onClick={() => removeFile(idx)}
                      className="absolute top-1 right-1 w-6 h-6 rounded-full bg-red-600 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                    <span className="absolute bottom-1 left-1 bg-black/60 text-white text-[10px] px-1.5 py-0.5 rounded font-mono">
                      #{idx + 1}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Result & Generate */}
            <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row gap-3">
              {!pdfResultUrl ? (
                <button
                  onClick={handleGeneratePdf}
                  disabled={isProcessing}
                  className="w-full py-3.5 px-6 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white font-bold text-sm shadow-sm transition-colors flex items-center justify-center gap-2 cursor-pointer"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      {progressText || t('generatingPdf')}
                    </>
                  ) : (
                    <>
                      <FileText className="w-4 h-4" />
                      {`${t('generatePdfFromImages')} (${files.length})`}
                    </>
                  )}
                </button>
              ) : (
                <>
                  <button
                    onClick={handleDownload}
                    className="flex-1 py-3.5 px-6 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-sm transition-colors flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Download className="w-4 h-4" />
                    {t('downloadPdf')} ({formatBytes(pdfSize)})
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
