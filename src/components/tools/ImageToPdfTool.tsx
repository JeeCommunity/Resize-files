import React, { useState, useRef } from 'react';
import { Upload, Download, RefreshCw, FileText, ArrowRight, Trash2, ShieldCheck } from 'lucide-react';
import { PDFDocument } from 'pdf-lib';

interface ImageToPdfToolProps {
  title: string;
  description: string;
  allowedExts?: string;
}

export const ImageToPdfTool: React.FC<ImageToPdfToolProps> = ({
  title,
  description,
  allowedExts = "image/jpeg,image/png,image/webp"
}) => {
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [pageSize, setPageSize] = useState<'a4' | 'letter' | 'fit'>('a4');
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
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

  const handleGeneratePdf = async () => {
    if (files.length === 0) return;
    setIsProcessing(true);

    try {
      const pdfDoc = await PDFDocument.create();

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const arrayBuf = await file.arrayBuffer();
        
        let embeddedImage;
        if (file.type === 'image/png') {
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

      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes.buffer as ArrayBuffer], { type: 'application/pdf' });
      setPdfResultUrl(URL.createObjectURL(blob));
      setPdfSize(blob.size);
    } catch (err) {
      console.error('Error generating PDF:', err);
      alert('Failed to generate PDF. Please ensure valid image formats are used.');
    } finally {
      setIsProcessing(false);
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
          PDF Creator
        </span>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
          {title}
        </h1>
        <p className="text-slate-600 max-w-2xl mx-auto text-sm sm:text-base">
          {description} Combine multiple images into a single professional PDF document securely in your browser.
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
            <h3 className="font-bold text-lg text-slate-900 mb-1">Upload Images</h3>
            <p className="text-xs text-slate-500 mb-4">Select one or multiple JPG/PNG images</p>
            <button className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-sm cursor-pointer">
              Browse Images
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Options */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Page Size</label>
                <select
                  value={pageSize}
                  onChange={(e) => setPageSize(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white font-medium"
                >
                  <option value="a4">A4 Standard</option>
                  <option value="letter">US Letter</option>
                  <option value="fit">Fit to Image Size</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Orientation</label>
                <select
                  value={orientation}
                  onChange={(e) => setOrientation(e.target.value as any)}
                  disabled={pageSize === 'fit'}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white font-medium disabled:opacity-50"
                >
                  <option value="portrait">Portrait</option>
                  <option value="landscape">Landscape</option>
                </select>
              </div>
            </div>

            {/* Thumbnail Grid */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">Selected Images ({files.length})</span>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="text-xs font-bold text-indigo-600 hover:text-indigo-700 cursor-pointer"
                >
                  + Add More Images
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
                  <FileText className="w-4 h-4" />
                  {isProcessing ? 'Generating PDF...' : `Generate PDF from ${files.length} Images`}
                </button>
              ) : (
                <>
                  <button
                    onClick={handleDownload}
                    className="flex-1 py-3.5 px-6 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-sm transition-colors flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Download className="w-4 h-4" />
                    Download PDF ({formatBytes(pdfSize)})
                  </button>
                  <button
                    onClick={handleReset}
                    className="py-3.5 px-6 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-sm transition-colors flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Start Over
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
