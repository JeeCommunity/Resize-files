import React, { useState, useRef } from 'react';
import { Upload, Download, RefreshCw, FileText, ArrowRight, Trash2, Check } from 'lucide-react';
import * as pdfjsLib from 'pdfjs-dist';

// Set worker source for pdfjs
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

interface PdfToImageToolProps {
  title: string;
  description: string;
  outputFormat: 'image/jpeg' | 'image/png';
  extension: string;
}

export const PdfToImageTool: React.FC<PdfToImageToolProps> = ({
  title,
  description,
  outputFormat,
  extension,
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [pages, setPages] = useState<{ pageNumber: number; url: string; blob: Blob; size: number }[]>([]);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [progressText, setProgressText] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelected = async (selectedFile: File) => {
    setFile(selectedFile);
    setIsProcessing(true);
    setProgressText('Loading PDF...');
    setPages([]);

    try {
      const arrayBuffer = await selectedFile.arrayBuffer();
      const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
      const pdfDoc = await loadingTask.promise;
      const numPages = pdfDoc.numPages;

      const renderedPages = [];

      for (let i = 1; i <= numPages; i++) {
        setProgressText(`Rendering page ${i} of ${numPages}...`);
        const page = await pdfDoc.getPage(i);
        const viewport = page.getViewport({ scale: 1.5 }); // High quality render scale

        const canvas = document.createElement('canvas');
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        const ctx = canvas.getContext('2d');

        if (ctx) {
          await page.render({ canvasContext: ctx, viewport, canvas: canvas as any }).promise;

          // Background fill for jpeg if transparent
          if (outputFormat === 'image/jpeg') {
            const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            // Simple check or fill white background
            ctx.globalCompositeOperation = 'destination-over';
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
          }

          const blob: Blob = await new Promise((resolve) => {
            canvas.toBlob((b) => resolve(b!), outputFormat, 0.92);
          });

          renderedPages.push({
            pageNumber: i,
            url: URL.createObjectURL(blob),
            blob,
            size: blob.size,
          });
        }
      }

      setPages(renderedPages);
    } catch (err) {
      console.error('Error rendering PDF pages:', err);
      alert('Failed to parse PDF file. Please ensure it is a valid PDF document.');
    } finally {
      setIsProcessing(false);
      setProgressText('');
    }
  };

  const handleDownloadSingle = (pageObj: { pageNumber: number; url: string; blob: Blob }) => {
    if (!file) return;
    const baseName = file.name.substring(0, file.name.lastIndexOf('.')) || 'document';
    const link = document.createElement('a');
    link.href = pageObj.url;
    link.download = `${baseName}_page_${pageObj.pageNumber}.${extension}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownloadAll = () => {
    pages.forEach((pageObj) => {
      handleDownloadSingle(pageObj);
    });
  };

  const handleReset = () => {
    setFile(null);
    setPages([]);
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
          PDF to Image Converter
        </span>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
          {title}
        </h1>
        <p className="text-slate-600 max-w-2xl mx-auto text-sm sm:text-base">
          {description} Extract every page of your PDF into high-resolution {extension.toUpperCase()} images instantly in your browser.
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
            <h3 className="font-bold text-lg text-slate-900 mb-1">Upload PDF Document</h3>
            <p className="text-xs text-slate-500 mb-4">Select a PDF file to extract pages</p>
            <button className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-sm cursor-pointer">
              Browse PDF
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {isProcessing ? (
              <div className="py-16 text-center space-y-3">
                <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
                <div className="text-sm font-bold text-slate-800">{progressText}</div>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="flex items-center justify-between bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <div>
                    <span className="font-bold text-slate-900 block text-sm">{file.name}</span>
                    <span className="text-xs text-slate-500">{pages.length} Pages Extracted</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleDownloadAll}
                      className="py-2 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm transition-colors flex items-center gap-1.5 cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" />
                      Download All
                    </button>
                    <button
                      onClick={handleReset}
                      className="py-2 px-4 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold text-xs transition-colors cursor-pointer"
                    >
                      Reset
                    </button>
                  </div>
                </div>

                {/* Page Previews Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 max-h-[500px] overflow-y-auto p-2">
                  {pages.map((pageObj) => (
                    <div key={pageObj.pageNumber} className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex flex-col justify-between space-y-3">
                      <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                        <span>Page {pageObj.pageNumber}</span>
                        <span className="text-slate-400 font-normal">{formatBytes(pageObj.size)}</span>
                      </div>
                      <div className="aspect-[3/4] rounded-lg bg-slate-100 border border-slate-100 overflow-hidden flex items-center justify-center p-2">
                        <img src={pageObj.url} alt={`Page ${pageObj.pageNumber}`} className="max-h-full max-w-full object-contain shadow-xs" />
                      </div>
                      <button
                        onClick={() => handleDownloadSingle(pageObj)}
                        className="w-full py-2 px-3 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Download className="w-3.5 h-3.5" />
                        Download Page {pageObj.pageNumber}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
