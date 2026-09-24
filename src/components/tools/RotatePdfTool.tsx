import React, { useState, useRef } from 'react';
import { Upload, Download, RefreshCw, RotateCw } from 'lucide-react';
import { PDFDocument, degrees } from 'pdf-lib';

export const RotatePdfTool: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [rotationAngle, setRotationAngle] = useState<number>(90);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [resultSize, setResultSize] = useState<number>(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelected = (selectedFile: File) => {
    setFile(selectedFile);
    setResultUrl(null);
  };

  const handleRotate = async () => {
    if (!file) return;
    setIsProcessing(true);

    try {
      const arrayBuf = await file.arrayBuffer();
      const pdf = await PDFDocument.load(arrayBuf);
      const pages = pdf.getPages();

      pages.forEach(page => {
        const currentRot = page.getRotation().angle;
        page.setRotation(degrees((currentRot + rotationAngle) % 360));
      });

      const pdfBytes = await pdf.save();
      const blob = new Blob([pdfBytes.buffer as ArrayBuffer], { type: 'application/pdf' });
      setResultUrl(URL.createObjectURL(blob));
      setResultSize(blob.size);
    } catch (err) {
      console.error('Error rotating PDF:', err);
      alert('Failed to rotate PDF pages.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = () => {
    if (!resultUrl || !file) return;
    const baseName = file.name.substring(0, file.name.lastIndexOf('.')) || 'rotated_document';
    const link = document.createElement('a');
    link.href = resultUrl;
    link.download = `${baseName}_rotated.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleReset = () => {
    setFile(null);
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
          PDF Rotator
        </span>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
          Rotate PDF Pages
        </h1>
        <p className="text-slate-600 max-w-2xl mx-auto text-sm sm:text-base">
          Rotate all pages in your PDF document by 90, 180, or 270 degrees instantly.
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
              <RotateCw className="w-8 h-8" />
            </div>
            <h3 className="font-bold text-lg text-slate-900 mb-1">Upload PDF Document</h3>
            <p className="text-xs text-slate-500 mb-4">Select PDF to rotate</p>
            <button className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-sm cursor-pointer">
              Browse PDF
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex items-center justify-between">
              <div>
                <span className="font-bold text-slate-900 block text-sm">{file.name}</span>
                <span className="text-xs text-slate-500">{formatBytes(file.size)}</span>
              </div>
              <button
                onClick={handleReset}
                className="py-1.5 px-3 rounded-lg bg-slate-200 text-slate-700 font-semibold text-xs cursor-pointer"
              >
                Change PDF
              </button>
            </div>

            <div>
              <label className="block font-bold text-slate-700 text-xs mb-2">Rotation Angle</label>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { angle: 90, label: '90° Clockwise' },
                  { angle: 180, label: '180° Upside Down' },
                  { angle: 270, label: '90° Counter-Clockwise' },
                ].map((item) => (
                  <button
                    key={item.angle}
                    onClick={() => setRotationAngle(item.angle)}
                    className={`py-3 px-4 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                      rotationAngle === item.angle
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row gap-3">
              {!resultUrl ? (
                <button
                  onClick={handleRotate}
                  disabled={isProcessing}
                  className="w-full py-3.5 px-6 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white font-bold text-sm shadow-sm transition-colors flex items-center justify-center gap-2 cursor-pointer"
                >
                  <RotateCw className="w-4 h-4" />
                  {isProcessing ? 'Rotating PDF...' : 'Rotate PDF Pages'}
                </button>
              ) : (
                <>
                  <button
                    onClick={handleDownload}
                    className="flex-1 py-3.5 px-6 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-sm transition-colors flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Download className="w-4 h-4" />
                    Download Rotated PDF ({formatBytes(resultSize)})
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
