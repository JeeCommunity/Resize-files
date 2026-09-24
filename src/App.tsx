/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Upload,
  Download,
  RefreshCw,
  FileText,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  Sliders,
  Maximize2,
  HelpCircle,
  Info,
  Sparkles,
  Copy,
  Check,
  Image as ImageIcon,
  ArrowRight,
  Zap,
  Lock,
  Award,
  Settings2,
  Crop,
  FileCheck
} from 'lucide-react';
import { CropModal } from './components/CropModal';
import { jsPDF } from 'jspdf';
import { Menu } from 'lucide-react';
import { NavigationDrawer } from './components/NavigationDrawer';
import { ImageConverterTool } from './components/tools/ImageConverterTool';
import { ImageToPdfTool } from './components/tools/ImageToPdfTool';
import { PdfToImageTool } from './components/tools/PdfToImageTool';
import { MergePdfTool } from './components/tools/MergePdfTool';
import { SplitPdfTool } from './components/tools/SplitPdfTool';
import { RotatePdfTool } from './components/tools/RotatePdfTool';
import { CompressPdfTool } from './components/tools/CompressPdfTool';
import { TargetSizeSeoContent } from './components/tools/TargetSizeSeoContent';
import { AboutPage } from './components/tools/AboutPage';
import { PrivacyPage } from './components/tools/PrivacyPage';
import { ContactPage } from './components/tools/ContactPage';
import { GeneralSeoPage } from './components/tools/GeneralSeoPage';
import { Footer } from './components/Footer';

interface CompressionResult {
  blob: Blob;
  url: string;
  sizeBytes: number;
  width: number;
  height: number;
  qualityUsed: number;
  iterations: number;
}

interface ExamPreset {
  name: string;
  sizeKB: number;
  desc: string;
  maxWidth?: number;
}

const EXAM_PRESETS: ExamPreset[] = [
  { name: 'UPSC Civil Services Photo', sizeKB: 50, desc: '350x350 px recommended', maxWidth: 350 },
  { name: 'UPSC Signature', sizeKB: 20, desc: '350x150 px recommended', maxWidth: 350 },
  { name: 'SSC CGL Photo', sizeKB: 50, desc: 'Standard passport photo', maxWidth: 400 },
  { name: 'SSC CGL Signature', sizeKB: 20, desc: 'Standard signature size', maxWidth: 300 },
  { name: 'IBPS / SBI Banking Photo', sizeKB: 50, desc: '200x230 px', maxWidth: 200 },
  { name: 'IBPS / SBI Signature', sizeKB: 20, desc: '140x60 px', maxWidth: 140 },
  { name: 'NEET / JEE Exam Photo', sizeKB: 100, desc: 'Passport size with name & date', maxWidth: 600 },
  { name: 'General Job Application', sizeKB: 100, desc: 'Standard resume photo', maxWidth: 800 },
];

export default function App() {
  const [currentRoute, setCurrentRoute] = useState<string>(window.location.pathname || '/');
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);

  useEffect(() => {
    const handlePopState = () => {
      setCurrentRoute(window.location.pathname || '/');
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const handleNavigate = (route: string) => {
    window.history.pushState({}, '', route);
    setCurrentRoute(route);
  };

  useEffect(() => {
    const match = currentRoute.match(/\/compress-image-to-(\d+)kb/);
    if (match) {
      const kb = match[1];
      setTargetSizeInput(kb);
      setSizeMode('under');
    }
  }, [currentRoute]);

  const generalSeoMatch = [
    '/image-resizer',
    '/compress-image',
    '/photo-resizer',
    '/signature-resizer',
    '/passport-photo-resizer'
  ].includes(currentRoute);

  const getGeneralToolType = (): 'image-resizer' | 'compress-image' | 'photo-resizer' | 'signature-resizer' | 'passport-photo-resizer' => {
    if (currentRoute === '/image-resizer') return 'image-resizer';
    if (currentRoute === '/photo-resizer') return 'photo-resizer';
    if (currentRoute === '/signature-resizer') return 'signature-resizer';
    if (currentRoute === '/passport-photo-resizer') return 'passport-photo-resizer';
    return 'compress-image';
  };

  const [originalFile, setOriginalFile] = useState<File | null>(null);
  const [originalUrl, setOriginalUrl] = useState<string | null>(null);
  const [originalSize, setOriginalSize] = useState<number>(0);
  const [originalDimensions, setOriginalDimensions] = useState<{ width: number; height: number }>({ width: 0, height: 0 });
  
  const [targetSizeInput, setTargetSizeInput] = useState<string>('50');
  const [sizeMode, setSizeMode] = useState<'under' | 'target'>('under');
  const [outputFormat, setOutputFormat] = useState<'image/jpeg' | 'image/webp' | 'image/png' | 'application/pdf'>('image/jpeg');
  const [maxWidth, setMaxWidth] = useState<string>('none');
  const [compressionMode, setCompressionMode] = useState<'quality' | 'balanced' | 'smallest'>('quality');
  
  const [isCompressing, setIsCompressing] = useState<boolean>(false);
  const [result, setResult] = useState<CompressionResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [warningMsg, setWarningMsg] = useState<string | null>(null);
  const [copied, setCopied] = useState<boolean>(false);
  const [dragOver, setDragOver] = useState<boolean>(false);

  // Image editing states
  const [rotation, setRotation] = useState<number>(0);
  const [flipH, setFlipH] = useState<boolean>(false);
  const [flipV, setFlipV] = useState<boolean>(false);
  const [cropBox, setCropBox] = useState<{ x: number; y: number; width: number; height: number } | null>(null);
  const [isCropModalOpen, setIsCropModalOpen] = useState<boolean>(false);
  const [baseImageForCropUrl, setBaseImageForCropUrl] = useState<string | null>(null);
  const [baseImageForCropDims, setBaseImageForCropDims] = useState<{ width: number; height: number }>({ width: 0, height: 0 });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const imgElementRef = useRef<HTMLImageElement | null>(null);

  // Parse target size input safely
  const trimmedTarget = targetSizeInput.trim();
  const parsedTargetKB = parseFloat(trimmedTarget);
  const isTargetEmpty = trimmedTarget === '';
  const isTargetInvalid = isNaN(parsedTargetKB);
  const isTargetNonPositive = !isTargetInvalid && parsedTargetKB <= 0;

  let targetValidationError: string | null = null;
  if (isTargetEmpty) {
    targetValidationError = 'Please enter a target file size.';
  } else if (isTargetInvalid) {
    targetValidationError = 'Please enter a valid target size.';
  } else if (isTargetNonPositive) {
    targetValidationError = 'Target size must be greater than 0 KB.';
  }

  const effectiveTargetKB = targetValidationError ? 50 : parsedTargetKB;

  // Handle file selection
  const handleFileSelected = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setErrorMsg('Please upload a valid image file (JPEG, PNG, or WebP).');
      return;
    }
    setErrorMsg(null);
    setWarningMsg(null);
    setOriginalFile(file);
    setOriginalSize(file.size);
    
    const url = URL.createObjectURL(file);
    setOriginalUrl(url);

    const img = new Image();
    img.onload = () => {
      setOriginalDimensions({ width: img.naturalWidth, height: img.naturalHeight });
      imgElementRef.current = img;
      if (!targetValidationError) {
        runCompression(img, effectiveTargetKB, outputFormat === 'application/pdf' ? 'image/jpeg' : outputFormat, maxWidth, file, compressionMode, sizeMode);
      }
    };
    img.src = url;
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelected(e.dataTransfer.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
  };

  // Robust compression engine following all rules
  const runCompression = useCallback(async (
    img: HTMLImageElement,
    targetKB: number,
    format: 'image/jpeg' | 'image/webp' | 'image/png',
    maxWStr: string,
    fileObj: File,
    mode: 'quality' | 'balanced' | 'smallest',
    sizeModeVal: 'under' | 'target'
  ) => {
    if (!img) return;
    setIsCompressing(true);
    setErrorMsg(null);
    setWarningMsg(null);

    try {
      const targetBytes = targetKB * 1000;
      const origW = img.naturalWidth;
      const origH = img.naturalHeight;
      const originalAspect = origW / origH;

      const isFormatSame = fileObj.type === format || (fileObj.type.includes('jpeg') && format === 'image/jpeg');
      
      // Mode 1: Under target & original already under target
      if (sizeModeVal === 'under' && fileObj.size <= targetBytes && maxWStr === 'none' && isFormatSame) {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (ctx) {
          canvas.width = origW;
          canvas.height = origH;
          if (format === 'image/jpeg') {
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(0, 0, origW, origH);
          }
          ctx.drawImage(img, 0, 0, origW, origH);
          const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, format, 0.95));
          if (blob) {
            const finalUrl = URL.createObjectURL(blob);
            setResult({
              blob,
              url: finalUrl,
              sizeBytes: blob.size,
              width: origW,
              height: origH,
              qualityUsed: 0.95,
              iterations: 0
            });
            setWarningMsg(`Original image is already under ${targetKB} KB.`);
            setIsCompressing(false);
            return;
          }
        }
      }

      // Mode 2: Target size & original already under/equal target size
      if (sizeModeVal === 'target' && fileObj.size <= targetBytes && maxWStr === 'none' && isFormatSame) {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (ctx) {
          canvas.width = origW;
          canvas.height = origH;
          if (format === 'image/jpeg') {
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(0, 0, origW, origH);
          }
          ctx.drawImage(img, 0, 0, origW, origH);
          let blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, format, 0.95));
          if (blob) {
            if (blob.size < targetBytes) {
              const diff = targetBytes - blob.size;
              const padding = new Uint8Array(diff);
              blob = new Blob([blob, padding], { type: blob.type });
            }
            const finalUrl = URL.createObjectURL(blob);
            setResult({
              blob,
              url: finalUrl,
              sizeBytes: blob.size,
              width: origW,
              height: origH,
              qualityUsed: 0.95,
              iterations: 0
            });
            setWarningMsg(`Target size reached (original visual quality preserved).`);
            setIsCompressing(false);
            return;
          }
        }
      }

      let mw = maxWStr === 'none' ? undefined : parseInt(maxWStr, 10);
      let targetW = origW;
      let targetH = origH;

      if (mw && targetW > mw) {
        targetW = mw;
        targetH = Math.round(targetW / originalAspect);
      }

      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Canvas 2D context not supported');

      // Rule 3: Every render must render directly from the ORIGINAL source image onto a fresh canvas.
      const renderCanvas = (w: number, h: number) => {
        canvas.width = w;
        canvas.height = h;
        ctx.clearRect(0, 0, w, h);
        if (format === 'image/jpeg') {
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(0, 0, w, h);
        }
        ctx.drawImage(img, 0, 0, w, h);
      };

      let bestBlob: Blob | null = null;
      let bestQuality = 0.85;
      let bestW = targetW;
      let bestH = targetH;
      let iterations = 0;

      const minQuality = mode === 'smallest' ? 0.05 : mode === 'balanced' ? 0.20 : 0.35; // Rule 5: minimum quality protection

      if (format === 'image/png') {
        // PNG dimensional scaling (PNG quality is lossless)
        let scaleSteps = [1.0, 0.95, 0.90, 0.85, 0.80, 0.75, 0.70, 0.65, 0.60, 0.55, 0.50, 0.45, 0.40, 0.35, 0.30];
        if (mw) {
          scaleSteps = scaleSteps.filter(s => (targetW * s) <= mw);
        }

        for (const scale of scaleSteps) {
          iterations++;
          const curW = Math.max(40, Math.round(targetW * scale));
          const curH = Math.max(40, Math.round(curW / originalAspect));
          
          renderCanvas(curW, curH);
          const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'));
          if (!blob) continue;

          bestBlob = blob;
          bestW = curW;
          bestH = curH;

          if (blob.size <= targetBytes) {
            break;
          }
        }

        if (!bestBlob) {
          renderCanvas(targetW, targetH);
          bestBlob = await new Promise<Blob>((resolve) => canvas.toBlob((b) => resolve(b!), 'image/png'));
          bestW = targetW;
          bestH = targetH;
        }

        const finalUrl = URL.createObjectURL(bestBlob);
        setResult({
          blob: bestBlob,
          url: finalUrl,
          sizeBytes: bestBlob.size,
          width: bestW,
          height: bestH,
          qualityUsed: 1.0,
          iterations
        });

      } else {
        // JPEG or WebP binary search & gradual dimension reduction (Rules 4, 6, 11)
        let scaleFactors = mode === 'quality' ? [1.0, 0.95, 0.90, 0.85, 0.80, 0.75, 0.70, 0.65, 0.60] : [1.0, 0.9, 0.8, 0.7, 0.6, 0.5, 0.4];
        if (mw) {
          scaleFactors = scaleFactors.filter(s => (targetW * s) <= mw);
        }

        let foundValidCandidate = false;
        let candidateList: Array<{ blob: Blob; quality: number; width: number; height: number; size: number }> = [];

        for (const scale of scaleFactors) {
          const curW = Math.max(50, Math.round(targetW * scale));
          const curH = Math.max(50, Math.round(curW / originalAspect));

          renderCanvas(curW, curH);

          // Binary search on quality (0.05 to 0.97)
          let low = minQuality;
          let high = 0.97;
          let bestQForScale = high;
          let bestBlobForScale: Blob | null = null;
          let minDiff = Infinity;

          for (let step = 0; step < 7; step++) {
            iterations++;
            const mid = (low + high) / 2;
            const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, format, mid));
            if (!blob) continue;

            const diff = blob.size - targetBytes;
            if (blob.size <= targetBytes) {
              if (Math.abs(diff) < minDiff || !bestBlobForScale) {
                minDiff = Math.abs(diff);
                bestBlobForScale = blob;
                bestQForScale = mid;
              }
              low = mid; // can try higher quality
            } else {
              high = mid; // too large, lower quality
            }
          }

          if (bestBlobForScale) {
            foundValidCandidate = true;
            candidateList.push({
              blob: bestBlobForScale,
              quality: bestQForScale,
              width: curW,
              height: curH,
              size: bestBlobForScale.size
            });

            if (mode === 'quality' && scale === 1.0 && bestBlobForScale.size >= targetBytes * 0.85) {
              // If quality priority and scale 1.0 hits close to target, we are very happy
              break;
            }
            if (bestBlobForScale.size >= targetBytes * 0.80) {
              break;
            }
          } else {
            // Even at min quality, is it still too big for this scale?
            const lowBlob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, format, minQuality));
            if (lowBlob) {
              candidateList.push({
                blob: lowBlob,
                quality: minQuality,
                width: curW,
                height: curH,
                size: lowBlob.size
              });
            }
          }

          if (foundValidCandidate && mode === 'quality') {
            break;
          }
        }

        // Rule 11: Prefer candidate with highest quality and/or largest dimensions that is <= targetBytes
        const validCandidates = candidateList.filter(c => c.size <= targetBytes);

        if (validCandidates.length > 0) {
          // Sort by size descending to pick the largest valid candidate <= targetBytes (closest to target from below)
          validCandidates.sort((a, b) => b.size - a.size);
          const best = validCandidates[0];
          bestBlob = best.blob;
          bestQuality = best.quality;
          bestW = best.width;
          bestH = best.height;
        } else if (candidateList.length > 0) {
          // If none are <= targetBytes, pick the smallest one available
          candidateList.sort((a, b) => a.size - b.size);
          const best = candidateList[0];
          bestBlob = best.blob;
          bestQuality = best.quality;
          bestW = best.width;
          bestH = best.height;
        }

        if (!bestBlob) {
          renderCanvas(targetW, targetH);
          bestBlob = await new Promise<Blob>((resolve) => canvas.toBlob((b) => resolve(b!), format, 0.5));
          bestW = targetW;
          bestH = targetH;
          bestQuality = 0.5;
        }

        // Rule 12: Add quality warning if quality or dimensions were significantly reduced
        if (bestQuality < 0.40 || (bestW < origW * 0.6)) {
          setWarningMsg("To reach this small file size, image quality or dimensions had to be reduced.");
        }



        const finalUrl = URL.createObjectURL(bestBlob);
        
        // Rule 16: Automated sanity checks in JavaScript
        if (bestW === 0 || bestH === 0) throw new Error('Sanity check failed: output dimensions are 0');
        if (!(bestBlob instanceof Blob)) throw new Error('Sanity check failed: output Blob does not exist');
        if (bestBlob.size === 0) throw new Error('Sanity check failed: output Blob size is 0');
        const aspectDiff = Math.abs((bestW / bestH) - originalAspect);
        if (aspectDiff > 0.02) {
          console.warn('Aspect ratio check warning:', aspectDiff);
        }

        setResult({
          blob: bestBlob,
          url: finalUrl,
          sizeBytes: bestBlob.size,
          width: bestW,
          height: bestH,
          qualityUsed: bestQuality,
          iterations
        });
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg('Compression failed. Please try another image.');
    } finally {
      setIsCompressing(false);
    }
  }, []);

  const processEditedImage = async (
    img: HTMLImageElement,
    rot: number,
    fH: boolean,
    fV: boolean,
    crop: { x: number; y: number; width: number; height: number } | null
  ): Promise<{ processedImg: HTMLImageElement; width: number; height: number }> => {
    const canvas1 = document.createElement('canvas');
    const ctx1 = canvas1.getContext('2d');
    if (!ctx1) throw new Error('Canvas 2D context not supported');

    const origW = img.naturalWidth;
    const origH = img.naturalHeight;

    let w1 = origW;
    let h1 = origH;
    if (rot === 90 || rot === 270) {
      w1 = origH;
      h1 = origW;
    }

    canvas1.width = w1;
    canvas1.height = h1;

    ctx1.save();
    ctx1.translate(w1 / 2, h1 / 2);
    ctx1.rotate((rot * Math.PI) / 180);
    ctx1.scale(fH ? -1 : 1, fV ? -1 : 1);
    ctx1.drawImage(img, -origW / 2, -origH / 2);
    ctx1.restore();

    let finalCanvas = canvas1;
    if (crop && crop.width > 0 && crop.height > 0) {
      const canvas2 = document.createElement('canvas');
      const ctx2 = canvas2.getContext('2d');
      if (ctx2) {
        canvas2.width = Math.round(crop.width);
        canvas2.height = Math.round(crop.height);
        ctx2.drawImage(
          canvas1,
          crop.x,
          crop.y,
          crop.width,
          crop.height,
          0,
          0,
          crop.width,
          crop.height
        );
        finalCanvas = canvas2;
      }
    }

    const dataUrl = finalCanvas.toDataURL('image/png');
    return new Promise((resolve, reject) => {
      const newImg = new Image();
      newImg.onload = () => {
        resolve({
          processedImg: newImg,
          width: finalCanvas.width,
          height: finalCanvas.height,
        });
      };
      newImg.onerror = reject;
      newImg.src = dataUrl;
    });
  };

  const runCompressionOnEdited = useCallback(async () => {
    if (!imgElementRef.current || !originalFile) return;
    try {
      const { processedImg } = await processEditedImage(
        imgElementRef.current,
        rotation,
        flipH,
        flipV,
        cropBox
      );
      if (!targetValidationError) {
        runCompression(processedImg, effectiveTargetKB, outputFormat === 'application/pdf' ? 'image/jpeg' : outputFormat, maxWidth, originalFile, compressionMode, sizeMode);
        setErrorMsg(null);
      } else {
        setErrorMsg(targetValidationError);
      }
    } catch (err) {
      console.error(err);
      setErrorMsg('Failed to process image edits.');
    }
  }, [imgElementRef, originalFile, rotation, flipH, flipV, cropBox, targetValidationError, effectiveTargetKB, outputFormat, maxWidth, compressionMode, sizeMode, runCompression]);

  // Re-trigger when settings or edits change
  useEffect(() => {
    if (imgElementRef.current && originalFile) {
      runCompressionOnEdited();
    }
  }, [targetSizeInput, sizeMode, outputFormat, maxWidth, compressionMode, rotation, flipH, flipV, cropBox, originalFile, runCompressionOnEdited]);

  const handleOpenCropModal = () => {
    if (!imgElementRef.current) return;
    setIsCropModalOpen(true);
  };

  const handleResetEdits = () => {
    setRotation(0);
    setFlipH(false);
    setFlipV(false);
    setCropBox(null);
  };

  const handlePresetSelect = (size: number, customMaxWidth?: number) => {
    setTargetSizeInput(size.toString());
    if (customMaxWidth) {
      setMaxWidth(customMaxWidth.toString());
    }
  };

  const handleDownload = () => {
    if (!result || !originalFile) return;
    if (outputFormat === 'application/pdf') {
      handleDownloadPDF();
      return;
    }
    const ext = outputFormat === 'image/webp' ? 'webp' : outputFormat === 'image/png' ? 'png' : 'jpg';
    const baseName = originalFile.name.substring(0, originalFile.name.lastIndexOf('.')) || 'photo';
    const filename = `${baseName}_under_${effectiveTargetKB}kb.${ext}`;

    const link = document.createElement('a');
    link.href = result.url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownloadPDF = () => {
    if (!result || !originalFile) return;
    const url = URL.createObjectURL(result.blob);
    const img = new Image();
    img.onload = () => {
      const pdf = new jsPDF({
        orientation: img.width > img.height ? 'landscape' : 'portrait',
        unit: 'px',
        format: [img.width, img.height]
      });
      pdf.addImage(url, 'JPEG', 0, 0, img.width, img.height);
      const baseName = originalFile.name.substring(0, originalFile.name.lastIndexOf('.')) || 'document';
      pdf.save(`${baseName}_under_${effectiveTargetKB}kb.pdf`);
      URL.revokeObjectURL(url);
    };
    img.src = url;
  };

  const handleCopy = async () => {
    if (!result) return;
    try {
      const item = new ClipboardItem({ [result.blob.type]: result.blob });
      await navigator.clipboard.write([item]);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy image to clipboard', err);
      alert('Clipboard copy not supported in this browser preview. Please use the Download button.');
    }
  };

  const handleReset = () => {
    setOriginalFile(null);
    setOriginalUrl(null);
    setOriginalSize(0);
    setResult(null);
    setWarningMsg(null);
    setRotation(0);
    setFlipH(false);
    setFlipV(false);
    setCropBox(null);
    imgElementRef.current = null;
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 KB';
    const kb = bytes / 1000;
    if (kb < 1000) {
      const fixed = kb.toFixed(2);
      return `${parseFloat(fixed)} KB`;
    }
    return `${(kb / 1000).toFixed(2)} MB`;
  };

  const targetBytes = effectiveTargetKB * 1000;
  const isTargetReached = result ? (
    sizeMode === 'target'
      ? result.sizeBytes <= targetBytes && Math.abs(result.sizeBytes - targetBytes) <= 1000 * 5
      : result.sizeBytes <= targetBytes
  ) : false;

  const diffBytes = result ? result.sizeBytes - targetBytes : 0;
  const diffKB = diffBytes / 1000;
  const sizeDiffPercent = originalSize > 0 && result ? ((originalSize - result.sizeBytes) / originalSize) * 100 : 0;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans antialiased selection:bg-emerald-500 selection:text-white">
      {/* Top Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
        <div className="max-w-6xl mx-auto px-3 sm:px-6 h-16 flex items-center justify-between gap-2">
          <div className="flex items-center space-x-2 sm:space-x-3 min-w-0">
            <button
              onClick={() => setIsDrawerOpen(true)}
              className="p-2 rounded-xl text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer shrink-0"
              aria-label="Open menu"
            >
              <Menu className="w-6 h-6" />
            </button>
            <div 
              onClick={() => handleNavigate('/')}
              className="flex items-center space-x-2.5 sm:space-x-3 cursor-pointer min-w-0"
            >
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs shrink-0">
                <Sliders className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <span className="text-base sm:text-lg font-extrabold tracking-tight text-slate-900 whitespace-nowrap">
                    Resize files
                  </span>
                  <span className="hidden sm:inline-flex text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 shrink-0">
                    100% Secure
                  </span>
                </div>
                <p className="text-xs text-slate-500 hidden sm:block truncate">Exact photo size compressor for government forms & exams</p>
              </div>
            </div>
          </div>

          <div className="shrink-0">
            {/* Desktop badge */}
            <div className="hidden md:flex items-center space-x-2 text-xs font-medium text-slate-600 bg-slate-100 px-3 py-1.5 rounded-full border border-slate-200">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Files never leave your device</span>
            </div>
            {/* Mobile compact badge */}
            <div className="md:hidden flex items-center space-x-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>100% Secure</span>
            </div>
          </div>
        </div>
      </header>

      <NavigationDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        currentRoute={currentRoute}
        onNavigate={handleNavigate}
      />

      {/* Main Container */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        {currentRoute === '/jpg-to-png' && (
          <ImageConverterTool route="/jpg-to-png" title="Convert JPG to PNG Online" description="Convert JPG or JPEG images to PNG format with high quality." fromFormat="JPG" toFormat="PNG" mimeType="image/png" extension="png" />
        )}
        {currentRoute === '/png-to-jpg' && (
          <ImageConverterTool route="/png-to-jpg" title="Convert PNG to JPG Online" description="Convert PNG images to JPG/JPEG format with customizable background color." fromFormat="PNG" toFormat="JPG" mimeType="image/jpeg" extension="jpg" />
        )}
        {currentRoute === '/jpg-to-webp' && (
          <ImageConverterTool route="/jpg-to-webp" title="Convert JPG to WebP Online" description="Convert JPG/JPEG images to modern WebP format for superior compression." fromFormat="JPG" toFormat="WebP" mimeType="image/webp" extension="webp" />
        )}
        {currentRoute === '/png-to-webp' && (
          <ImageConverterTool route="/png-to-webp" title="Convert PNG to WebP Online" description="Convert PNG images to modern WebP format while preserving transparency." fromFormat="PNG" toFormat="WebP" mimeType="image/webp" extension="webp" />
        )}
        {currentRoute === '/webp-to-jpg' && (
          <ImageConverterTool route="/webp-to-jpg" title="Convert WebP to JPG Online" description="Convert WebP images to JPG/JPEG format for universal compatibility." fromFormat="WebP" toFormat="JPG" mimeType="image/jpeg" extension="jpg" />
        )}
        {currentRoute === '/webp-to-png' && (
          <ImageConverterTool route="/webp-to-png" title="Convert WebP to PNG Online" description="Convert WebP images to lossless PNG format." fromFormat="WebP" toFormat="PNG" mimeType="image/png" extension="png" />
        )}
        {currentRoute === '/image-to-pdf' && (
          <ImageToPdfTool title="Convert Images to PDF" description="Combine any images into a single professional PDF document." />
        )}
        {currentRoute === '/jpg-to-pdf' && (
          <ImageToPdfTool title="Convert JPG to PDF Online" description="Combine JPG images into a single PDF document." allowedExts="image/jpeg,image/jpg" />
        )}
        {currentRoute === '/png-to-pdf' && (
          <ImageToPdfTool title="Convert PNG to PDF Online" description="Combine PNG images into a single PDF document." allowedExts="image/png" />
        )}
        {currentRoute === '/pdf-to-jpg' && (
          <PdfToImageTool title="Convert PDF to JPG Online" description="Extract all pages of a PDF into high-quality JPG images." outputFormat="image/jpeg" extension="jpg" />
        )}
        {currentRoute === '/pdf-to-png' && (
          <PdfToImageTool title="Convert PDF to PNG Online" description="Extract all pages of a PDF into high-quality PNG images." outputFormat="image/png" extension="png" />
        )}
        {currentRoute === '/merge-pdf' && <MergePdfTool />}
        {currentRoute === '/split-pdf' && <SplitPdfTool />}
        {currentRoute === '/rotate-pdf' && <RotatePdfTool />}
        {currentRoute === '/compress-pdf' && <CompressPdfTool />}

        {currentRoute === '/about' && <AboutPage onNavigate={handleNavigate} />}
        {currentRoute === '/privacy' && <PrivacyPage />}
        {currentRoute === '/contact' && <ContactPage />}

        {(currentRoute === '/' || currentRoute.match(/\/compress-image-to-\d+kb/) || generalSeoMatch) && (!originalFile ? (
          /* Upload View */
          <div className="max-w-3xl mx-auto space-y-12">
            <div className="max-w-2xl mx-auto">
              <div className="text-center mb-8">
                <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight sm:text-4xl">
                  {currentRoute.match(/\/compress-image-to-(\d+)kb/)
                    ? `Compress Image to ${currentRoute.match(/\/compress-image-to-(\d+)kb/)![1]}KB Online`
                    : currentRoute === '/'
                    ? 'Resize and Compress Images Online'
                    : 'Resize and Optimize Photos Online'}
                </h1>
                <p className="mt-3 text-base text-slate-600">
                  {currentRoute.match(/\/compress-image-to-(\d+)kb/)
                    ? `Instantly shrink JPG, PNG, or WebP images to exactly or under ${currentRoute.match(/\/compress-image-to-(\d+)kb/)![1]} KB while preserving visual clarity for official portals.`
                    : 'Resize photos, compress images to a specific KB size, convert image formats, and prepare photos for forms, exams and applications. Your files are processed directly in your browser.'}
                </p>
              </div>

              <div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all duration-200 bg-white shadow-xs hover:shadow-md ${
                  dragOver
                    ? 'border-emerald-500 bg-emerald-50/50 scale-[1.01]'
                    : 'border-slate-300 hover:border-emerald-500 hover:bg-slate-50/50'
                }`}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={(e) => e.target.files?.[0] && handleFileSelected(e.target.files[0])}
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                />
                <div className="w-16 h-16 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-4 shadow-xs">
                  <Upload className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-1">Drag and drop your photo here</h3>
                <p className="text-sm text-slate-500 mb-6">Supports JPG, PNG, and WebP up to 25MB</p>
                
                <button
                  type="button"
                  className="inline-flex items-center justify-center px-6 py-3 rounded-xl bg-emerald-600 text-white font-semibold text-sm shadow-sm hover:bg-emerald-700 transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
                >
                  Choose Photo from Device
                </button>

                <div className="mt-8 pt-6 border-t border-slate-100 flex flex-wrap items-center justify-center gap-6 text-xs text-slate-500">
                  <span className="flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-emerald-600" /> 100% Client-Side
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5 text-amber-500" /> Lossless Source Engine
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Award className="w-3.5 h-3.5 text-indigo-500" /> Exam Standard Compliant
                  </span>
                </div>
              </div>
            </div>

            {/* Exam Presets Quick Reference */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <FileText className="w-4 h-4 text-emerald-600" /> Common Exam & Form Requirements
                </h3>
                <span className="text-xs text-slate-400">Click any preset to apply</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {EXAM_PRESETS.map((preset, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setTargetSizeInput(preset.sizeKB.toString());
                      if (preset.maxWidth) setMaxWidth(preset.maxWidth.toString());
                    }}
                    className="text-left p-3 rounded-xl border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/40 transition-all group"
                  >
                    <div className="font-semibold text-slate-900 text-sm group-hover:text-emerald-700 flex items-center justify-between">
                      <span>{preset.name}</span>
                      <span className="text-xs font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                        &le; {preset.sizeKB} KB
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">{preset.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Target Size SEO Content */}
            {currentRoute.match(/\/compress-image-to-(\d+)kb/) && (
              <TargetSizeSeoContent
                targetKB={parseInt(currentRoute.match(/\/compress-image-to-(\d+)kb/)![1], 10)}
                onNavigate={handleNavigate}
              />
            )}

            {/* General SEO Content */}
            {generalSeoMatch && (
              <GeneralSeoPage toolType={getGeneralToolType()} onNavigate={handleNavigate} />
            )}
          </div>
        ) : (
          /* Editor & Preview View */
          <div className="max-w-4xl mx-auto space-y-6">

            {/* Top File Bar */}
            <div className="flex items-center justify-between bg-white rounded-2xl p-4 border border-slate-200 shadow-xs">
              <div className="flex items-center space-x-3 overflow-hidden">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-sm shrink-0">
                  <ImageIcon className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-bold text-slate-900 truncate">{originalFile.name}</div>
                  <div className="text-xs text-slate-500">
                    Original size: <span className="font-semibold text-slate-700">{formatBytes(originalSize)}</span> • {originalDimensions.width} × {originalDimensions.height} px
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {(rotation !== 0 || flipH || flipV || cropBox) && (
                  <button
                    onClick={handleResetEdits}
                    className="text-xs font-semibold text-rose-600 hover:text-rose-700 bg-rose-50 px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer"
                  >
                    Reset edits
                  </button>
                )}
                <button
                  onClick={handleReset}
                  className="text-xs font-semibold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-xl transition-colors flex items-center gap-1.5 shrink-0 cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" /> Choose New
                </button>
              </div>
            </div>

            {/* 1. SABSE UPAR: Upload photo aur Result photo dono ek dusre ke bagal me */}
            <div className="grid grid-cols-2 gap-3 sm:gap-6">
              
              {/* Upload Photo (Original) Card */}
              <div className="bg-white rounded-2xl p-3.5 sm:p-5 border border-slate-200 shadow-xs flex flex-col justify-between">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-slate-500">Original Photo</span>
                  <span className="text-[10px] sm:text-xs font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-800">
                    {formatBytes(originalSize)}
                  </span>
                </div>

                {/* Direct Tap on Photo opens Crop & Edit */}
                <div
                  onClick={handleOpenCropModal}
                  className="group relative aspect-square sm:aspect-[4/3] w-full rounded-xl bg-slate-900/5 border border-slate-200 hover:border-emerald-500 flex items-center justify-center overflow-hidden cursor-pointer transition-all shadow-inner"
                  title="Tap to Edit or Crop this photo"
                >
                  {originalUrl && (
                    <img
                      src={originalUrl}
                      alt="Original"
                      className="max-h-full max-w-full object-contain p-1.5 sm:p-2 group-hover:scale-[1.02] transition-transform duration-200"
                    />
                  )}
                  {/* Overlay on hover/touch */}
                  <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center p-2 text-center">
                    <span className="px-2.5 py-1.5 rounded-lg bg-white/95 text-slate-900 text-xs font-bold shadow-md flex items-center gap-1.5">
                      <Crop className="w-3.5 h-3.5 text-emerald-600" /> Tap to Edit / Crop
                    </span>
                  </div>
                </div>

                {/* Edit options right on the upload card */}
                <div className="mt-2.5 space-y-2">
                  <button
                    onClick={handleOpenCropModal}
                    className="w-full py-1.5 sm:py-2 px-2.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold border border-emerald-200 flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                  >
                    <Crop className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Edit / Crop Photo</span>
                  </button>

                  {/* Inline quick rotate & flip controls */}
                  <div className="flex items-center justify-between gap-1">
                    <div className="flex rounded-lg border border-slate-200 overflow-hidden bg-slate-50 flex-1">
                      <button
                        onClick={() => setRotation((r) => (r - 90 + 360) % 360)}
                        title="Rotate Left 90°"
                        className="flex-1 py-1 flex items-center justify-center hover:bg-slate-200 text-slate-600 border-r border-slate-200 transition-colors text-[10px]"
                      >
                        -90°
                      </button>
                      <button
                        onClick={() => setRotation((r) => (r + 90) % 360)}
                        title="Rotate Right 90°"
                        className="flex-1 py-1 flex items-center justify-center hover:bg-slate-200 text-slate-600 transition-colors text-[10px]"
                      >
                        +90°
                      </button>
                    </div>

                    <div className="flex rounded-lg border border-slate-200 overflow-hidden bg-slate-50 flex-1">
                      <button
                        onClick={() => setFlipH((f) => !f)}
                        title="Flip Horizontal"
                        className={`flex-1 py-1 text-[10px] font-semibold flex items-center justify-center transition-colors border-r border-slate-200 ${flipH ? 'bg-emerald-100 text-emerald-800 font-bold' : 'hover:bg-slate-200 text-slate-600'}`}
                      >
                        Flip H
                      </button>
                      <button
                        onClick={() => setFlipV((f) => !f)}
                        title="Flip Vertical"
                        className={`flex-1 py-1 text-[10px] font-semibold flex items-center justify-center transition-colors ${flipV ? 'bg-emerald-100 text-emerald-800 font-bold' : 'hover:bg-slate-200 text-slate-600'}`}
                      >
                        Flip V
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[10px] sm:text-xs text-slate-500 pt-0.5">
                    <span>{originalDimensions.width} × {originalDimensions.height} px</span>
                    <span className="font-semibold text-slate-600 truncate max-w-[80px]">{originalFile.type.replace('image/', '') || 'jpg'}</span>
                  </div>
                </div>
              </div>

              {/* Result Photo Card */}
              <div className="bg-white rounded-2xl p-3.5 sm:p-5 border-2 border-emerald-500/70 shadow-md flex flex-col justify-between relative overflow-hidden">
                <div className="absolute top-0 right-0 bg-emerald-600 text-white text-[9px] sm:text-[10px] font-bold px-2.5 py-0.5 sm:py-1 rounded-bl-xl uppercase tracking-wider">
                  Compressed
                </div>

                <div className="flex items-center justify-between mb-2 pr-16 sm:pr-20">
                  <span className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-emerald-700">Result Photo</span>
                </div>

                {/* Compressed Preview */}
                <div className="relative aspect-square sm:aspect-[4/3] w-full rounded-xl bg-slate-900/5 border border-emerald-100 flex items-center justify-center overflow-hidden shadow-inner">
                  {isCompressing ? (
                    <div className="flex flex-col items-center justify-center text-emerald-600 space-y-1.5">
                      <RefreshCw className="w-7 h-7 animate-spin" />
                      <span className="text-[11px] font-semibold">Optimizing...</span>
                    </div>
                  ) : result ? (
                    <img
                      src={result.url}
                      alt="Compressed Result"
                      className="max-h-full max-w-full object-contain p-1.5 sm:p-2"
                    />
                  ) : null}
                </div>

                {/* Result Info */}
                <div className="mt-2.5 space-y-2">
                  <div className="flex items-center justify-between py-1.5 px-2.5 rounded-xl bg-emerald-50 border border-emerald-100">
                    <span className="text-xs sm:text-sm font-extrabold text-emerald-900">
                      {result ? formatBytes(result.sizeBytes) : '...'}
                    </span>
                    <span className="text-[10px] sm:text-xs font-bold px-1.5 py-0.5 rounded bg-emerald-200/60 text-emerald-800">
                      {sizeMode === 'target'
                        ? (Math.abs(diffKB) <= 2 ? '✓ Target Met' : `${diffKB >= 0 ? '+' : ''}${diffKB.toFixed(1)} KB`)
                        : `${sizeDiffPercent.toFixed(1)}% smaller`}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[10px] sm:text-xs text-slate-500 pt-0.5">
                    <span>{result ? `${result.width} × ${result.height} px` : '-'}</span>
                    <span className="font-semibold text-slate-700">{result ? `${Math.round(result.qualityUsed * 100)}% quality` : '-'}</span>
                  </div>

                  <div className="pt-1">
                    <button
                      onClick={handleDownload}
                      disabled={!result || isCompressing}
                      className="w-full py-1.5 sm:py-2 px-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download ({result ? formatBytes(result.sizeBytes) : '...'})</span>
                    </button>
                  </div>
                </div>
              </div>

            </div>

            {/* 2. MAIN KAAM PEHLE: TARGET FILE SIZE & DIRECT DOWNLOAD */}
            <div className="bg-white rounded-2xl p-4 sm:p-6 border border-slate-200 shadow-xs space-y-4">
              
              {/* Header: Title & Size Mode Toggle */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-1 border-b border-slate-100">
                <div>
                  <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                    <span>Target file size</span>
                    <span className="text-emerald-600 font-black text-lg">
                      {targetSizeInput ? `${targetSizeInput} KB` : '---'}
                    </span>
                  </h2>
                  <p className="text-xs text-slate-500">Choose quick size or type any custom KB</p>
                </div>

                {/* Compact Size Mode Toggle */}
                <div className="flex items-center bg-slate-100 p-1 rounded-xl self-start sm:self-auto">
                  <button
                    onClick={() => setSizeMode('under')}
                    className={`py-1.5 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      sizeMode === 'under'
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    ≤ Under target
                  </button>
                  <button
                    onClick={() => setSizeMode('target')}
                    className={`py-1.5 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      sizeMode === 'target'
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Exact target KB
                  </button>
                </div>
              </div>

              {/* Quick Sizes: 1-Tap Buttons */}
              <div>
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-2">Quick sizes</span>
                <div className="flex flex-wrap gap-2">
                  {[20, 50, 100, 200, 500].map((size) => (
                    <button
                      key={size}
                      onClick={() => setTargetSizeInput(size.toString())}
                      className={`flex-1 min-w-[58px] py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer text-center ${
                        targetSizeInput.trim() === size.toString()
                          ? 'bg-emerald-600 text-white shadow-xs ring-2 ring-emerald-600/30'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      {size} KB
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom Target Size Input */}
              <div>
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1.5">Custom target size</span>
                <div className="relative">
                  <input
                    type="number"
                    min="1"
                    step="0.1"
                    inputMode="decimal"
                    value={targetSizeInput}
                    onChange={(e) => setTargetSizeInput(e.target.value)}
                    placeholder="Enter target size (e.g. 50)"
                    className="w-full pl-4 pr-12 py-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-base font-semibold"
                  />
                  <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none text-xs font-bold text-slate-400">
                    KB
                  </div>
                </div>
                {targetValidationError && (
                  <p className="mt-1.5 text-xs font-medium text-rose-600 flex items-center gap-1">
                    {targetValidationError}
                  </p>
                )}
              </div>

              {/* Live Status Guarantee Pill */}
              {result && (
                <div className={`p-3 rounded-xl border flex items-center justify-between text-xs font-semibold ${
                  isTargetReached
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                    : 'bg-amber-50 border-amber-200 text-amber-900'
                }`}>
                  <div className="flex items-center gap-2 min-w-0">
                    {isTargetReached ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                    )}
                    <span className="truncate">
                      {sizeMode === 'under'
                        ? `Guaranteed under target: ${formatBytes(result.sizeBytes)} (≤ ${effectiveTargetKB} KB)`
                        : `Target: ${effectiveTargetKB} KB | Output: ${formatBytes(result.sizeBytes)}`}
                    </span>
                  </div>
                  <span className="font-extrabold text-emerald-800 shrink-0 ml-2">
                    {sizeMode === 'under'
                      ? `${sizeDiffPercent.toFixed(0)}% smaller`
                      : `${diffKB >= 0 ? '+' : ''}${diffKB.toFixed(1)} KB`}
                  </span>
                </div>
              )}

              {/* Big Primary Download Button Right Here! */}
              <button
                onClick={handleDownload}
                disabled={!result || isCompressing}
                className="w-full py-4 px-6 rounded-2xl bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white font-extrabold text-base shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2.5 cursor-pointer disabled:cursor-not-allowed"
              >
                <Download className="w-5 h-5" />
                <span>{outputFormat === 'application/pdf' ? 'Download Compressed PDF' : 'Download Result Photo'}</span>
                <span className="px-2.5 py-0.5 rounded-lg bg-emerald-800/40 text-emerald-100 text-xs font-bold">
                  {result ? formatBytes(result.sizeBytes) : '...'}
                </span>
              </button>

              {/* Secondary Quick Actions */}
              <div className="grid grid-cols-2 gap-2.5 pt-1">
                <button
                  onClick={handleCopy}
                  disabled={!result || isCompressing}
                  className="py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 disabled:bg-slate-100 text-slate-700 font-bold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                  <span>{copied ? 'Copied!' : 'Copy to Clipboard'}</span>
                </button>

                <button
                  onClick={handleOpenCropModal}
                  className="py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Crop className="w-4 h-4 text-emerald-600" />
                  <span>Crop / Edit Again</span>
                </button>
              </div>

            </div>

            {/* 3. MORE OPTIONS & FORMAT (Secondary Settings) */}
            <div className="bg-white rounded-2xl p-4 sm:p-6 border border-slate-200 shadow-xs space-y-5">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                More Options & Format (Optional)
              </h3>

              {/* Output Format */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">Output Format</label>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { id: 'image/jpeg', label: 'JPG' },
                    { id: 'image/webp', label: 'WebP' },
                    { id: 'image/png', label: 'PNG' },
                    { id: 'application/pdf', label: 'PDF' },
                  ].map((fmt) => (
                    <button
                      key={fmt.id}
                      onClick={() => setOutputFormat(fmt.id as any)}
                      className={`py-2 px-2 rounded-xl text-xs font-semibold border text-center transition-all cursor-pointer ${
                        outputFormat === fmt.id
                          ? 'border-emerald-600 bg-emerald-50 text-emerald-900 shadow-xs ring-1 ring-emerald-600'
                          : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      {fmt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Compression Priority */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2 flex items-center gap-1.5">
                  <Settings2 className="w-4 h-4 text-emerald-600" /> Compression Priority
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'quality', label: 'Quality priority', desc: 'Best clarity' },
                    { id: 'balanced', label: 'Balanced', desc: 'Standard' },
                    { id: 'smallest', label: 'Smallest file', desc: 'Max compression' },
                  ].map((mode) => (
                    <button
                      key={mode.id}
                      onClick={() => setCompressionMode(mode.id as any)}
                      className={`py-2 px-2 rounded-xl text-xs font-semibold border text-center transition-all cursor-pointer ${
                        compressionMode === mode.id
                          ? 'border-emerald-600 bg-emerald-50 text-emerald-900 shadow-xs ring-1 ring-emerald-600'
                          : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <div>{mode.label}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Max Width Limit */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">Max Width (Optional)</label>
                <select
                  value={maxWidth}
                  onChange={(e) => setMaxWidth(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm font-medium bg-white cursor-pointer"
                >
                  <option value="none">Original Dimensions ({originalDimensions.width}px)</option>
                  <option value="200">200 px (Banking Signature)</option>
                  <option value="350">350 px (UPSC Photo/Sig)</option>
                  <option value="400">400 px (Standard Passport)</option>
                  <option value="600">600 px (Medium Form)</option>
                  <option value="800">800 px (Large Form)</option>
                </select>
              </div>

            </div>

            {/* 4. EXAM FORMAT (Common Exam & Form Requirements) */}
            <div className="bg-white rounded-2xl p-4 sm:p-6 border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <FileCheck className="w-4 h-4 text-emerald-600" />
                  Common Exam & Form Requirements
                </h3>
                <span className="text-xs text-slate-400">Click preset to apply</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {EXAM_PRESETS.map((preset, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setTargetSizeInput(preset.sizeKB.toString());
                      if (preset.maxWidth) setMaxWidth(preset.maxWidth.toString());
                    }}
                    className="text-left p-3.5 rounded-xl border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/40 transition-all group cursor-pointer"
                  >
                    <div className="font-semibold text-slate-900 text-sm group-hover:text-emerald-700 flex items-center justify-between">
                      <span>{preset.name}</span>
                      <span className="text-xs font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                        ≤ {preset.sizeKB} KB
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">{preset.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Trust & Privacy Notice */}
            <div className="bg-emerald-900 text-emerald-50 rounded-2xl p-5 sm:p-6 shadow-sm flex items-start space-x-4">
              <div className="w-10 h-10 rounded-xl bg-emerald-800 text-emerald-300 flex items-center justify-center shrink-0 mt-0.5">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-bold text-white text-sm">Guaranteed Data Privacy</h4>
                <p className="text-xs text-emerald-200 mt-1 leading-relaxed">
                  All image compression, cropping, and resizing happen 100% inside your web browser using HTML5 Canvas. Your photos never leave your device and are never uploaded to any remote server. Completely secure for confidential exam forms and government applications.
                </p>
              </div>
            </div>

          </div>
        ))}
      </main>

      {/* Footer */}
      <Footer onNavigate={handleNavigate} />

      {/* Crop Modal */}
      <CropModal
        isOpen={isCropModalOpen}
        masterImage={imgElementRef.current}
        imageSrc={originalUrl}
        initialRotation={rotation}
        initialFlipH={flipH}
        initialFlipV={flipV}
        initialCrop={cropBox}
        onApply={(newCrop, newRot, newFlipH, newFlipV) => {
          setRotation(newRot);
          setFlipH(newFlipH);
          setFlipV(newFlipV);
          setCropBox(newCrop);
          setIsCropModalOpen(false);
        }}
        onClose={() => setIsCropModalOpen(false)}
      />
    </div>
  );
}

