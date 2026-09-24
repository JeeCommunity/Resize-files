import React, { useState, useRef, useEffect } from 'react';
import { X, Check, RotateCcw, Move, Sparkles } from 'lucide-react';

export interface CropBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface CropModalProps {
  isOpen: boolean;
  masterImage: HTMLImageElement | null;
  imageSrc?: string | null;
  initialRotation: number;
  initialFlipH: boolean;
  initialFlipV: boolean;
  initialCrop: CropBox | null;
  onApply: (crop: CropBox | null, rotation: number, flipH: boolean, flipV: boolean) => void;
  onClose: () => void;
}

export const CropModal: React.FC<CropModalProps> = ({
  isOpen,
  masterImage,
  imageSrc,
  initialRotation,
  initialFlipH,
  initialFlipV,
  initialCrop,
  onApply,
  onClose,
}) => {
  const [rotation, setRotation] = useState<number>(initialRotation);
  const [flipH, setFlipH] = useState<boolean>(initialFlipH);
  const [flipV, setFlipV] = useState<boolean>(initialFlipV);
  const [aspect, setAspect] = useState<string>('free');

  const [currentImgSrc, setCurrentImgSrc] = useState<string>('');
  const [imgWidth, setImgWidth] = useState<number>(0);
  const [imgHeight, setImgHeight] = useState<number>(0);
  const [crop, setCrop] = useState<CropBox>({ x: 0, y: 0, width: 100, height: 100 });

  const containerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragType, setDragType] = useState<string | null>(null);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0, startCrop: { ...crop } });

  // Sync state when modal opens
  useEffect(() => {
    if (isOpen) {
      setRotation(initialRotation);
      setFlipH(initialFlipH);
      setFlipV(initialFlipV);
    }
  }, [isOpen, initialRotation, initialFlipH, initialFlipV]);

  // Update current transformed image whenever rotation or flip changes
  useEffect(() => {
    if (!isOpen) return;

    const sourceImg = masterImage || (imageSrc ? (() => {
      const img = new Image();
      img.src = imageSrc;
      return img;
    })() : null);

    if (!sourceImg) return;

    const renderTransformed = () => {
      const origW = sourceImg.naturalWidth || sourceImg.width || 800;
      const origH = sourceImg.naturalHeight || sourceImg.height || 600;
      if (origW === 0 || origH === 0) return;

      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      let w = origW;
      let h = origH;
      if (rotation === 90 || rotation === 270) {
        w = origH;
        h = origW;
      }

      canvas.width = w;
      canvas.height = h;

      ctx.save();
      ctx.translate(w / 2, h / 2);
      ctx.rotate((rotation * Math.PI) / 180);
      ctx.scale(flipH ? -1 : 1, flipV ? -1 : 1);
      ctx.drawImage(sourceImg, -origW / 2, -origH / 2);
      ctx.restore();

      const dataUrl = canvas.toDataURL('image/png');
      setCurrentImgSrc(dataUrl);
      setImgWidth(w);
      setImgHeight(h);

      // Initialize crop box covering 85% centered
      if (!initialCrop || rotation !== initialRotation || flipH !== initialFlipH || flipV !== initialFlipV) {
        const cw = Math.round(w * 0.85);
        const ch = Math.round(h * 0.85);
        setCrop({
          x: Math.round((w - cw) / 2),
          y: Math.round((h - ch) / 2),
          width: cw,
          height: ch,
        });
      } else {
        setCrop(initialCrop);
      }
    };

    if (sourceImg.complete && (sourceImg.naturalWidth || sourceImg.width)) {
      renderTransformed();
    } else {
      sourceImg.onload = renderTransformed;
    }
  }, [isOpen, masterImage, imageSrc, rotation, flipH, flipV, initialCrop, initialRotation, initialFlipH, initialFlipV]);

  if (!isOpen) return null;

  const handleAspectChange = (newAspect: string) => {
    setAspect(newAspect);
    if (newAspect === 'free' || imgWidth === 0 || imgHeight === 0) return;

    let ratio = 1;
    if (newAspect === '1:1') ratio = 1;
    else if (newAspect === '3.5:4.5') ratio = 3.5 / 4.5;
    else if (newAspect === '3:4') ratio = 3 / 4;
    else if (newAspect === '4:3') ratio = 4 / 3;
    else if (newAspect === '16:9') ratio = 16 / 9;
    else if (newAspect === '9:16') ratio = 9 / 16;

    let newW = crop.width;
    let newH = newW / ratio;

    if (newH > imgHeight * 0.9) {
      newH = imgHeight * 0.85;
      newW = newH * ratio;
    }
    if (newW > imgWidth * 0.9) {
      newW = imgWidth * 0.85;
      newH = newW / ratio;
    }

    setCrop({
      x: Math.max(0, Math.round((imgWidth - newW) / 2)),
      y: Math.max(0, Math.round((imgHeight - newH) / 2)),
      width: Math.round(newW),
      height: Math.round(newH),
    });
  };

  const handleReset = () => {
    setRotation(0);
    setFlipH(false);
    setFlipV(false);
    setAspect('free');
    if (imgWidth > 0 && imgHeight > 0) {
      const cw = Math.round(imgWidth * 0.85);
      const ch = Math.round(imgHeight * 0.85);
      setCrop({
        x: Math.round((imgWidth - cw) / 2),
        y: Math.round((imgHeight - ch) / 2),
        width: cw,
        height: ch,
      });
    }
  };

  const onPointerDown = (type: string, e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    } catch (_) {}

    setIsDragging(true);
    setDragType(type);
    setDragStart({
      x: e.clientX,
      y: e.clientY,
      startCrop: { ...crop },
    });
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!isDragging || !imgRef.current) return;
    e.preventDefault();
    e.stopPropagation();

    const r = imgRef.current.getBoundingClientRect();
    if (r.width === 0 || r.height === 0 || imgWidth === 0 || imgHeight === 0) return;

    const scaleX = imgWidth / r.width;
    const scaleY = imgHeight / r.height;

    const dx = (e.clientX - dragStart.x) * scaleX;
    const dy = (e.clientY - dragStart.y) * scaleY;

    let { x, y, width, height } = dragStart.startCrop;
    const minSize = 25;

    if (dragType === 'move') {
      x = Math.max(0, Math.min(imgWidth - width, x + dx));
      y = Math.max(0, Math.min(imgHeight - height, y + dy));
    } else {
      if (dragType?.includes('e')) {
        width = Math.max(minSize, Math.min(imgWidth - x, dragStart.startCrop.width + dx));
      }
      if (dragType?.includes('w')) {
        const maxX = dragStart.startCrop.x + dragStart.startCrop.width - minSize;
        const newX = Math.max(0, Math.min(maxX, dragStart.startCrop.x + dx));
        width = dragStart.startCrop.width - (newX - dragStart.startCrop.x);
        x = newX;
      }
      if (dragType?.includes('s')) {
        height = Math.max(minSize, Math.min(imgHeight - y, dragStart.startCrop.height + dy));
      }
      if (dragType?.includes('n')) {
        const maxY = dragStart.startCrop.y + dragStart.startCrop.height - minSize;
        const newY = Math.max(0, Math.min(maxY, dragStart.startCrop.y + dy));
        height = dragStart.startCrop.height - (newY - dragStart.startCrop.y);
        y = newY;
      }

      if (aspect !== 'free') {
        let ratio = 1;
        if (aspect === '1:1') ratio = 1;
        else if (aspect === '3.5:4.5') ratio = 3.5 / 4.5;
        else if (aspect === '3:4') ratio = 3 / 4;
        else if (aspect === '4:3') ratio = 4 / 3;
        else if (aspect === '16:9') ratio = 16 / 9;
        else if (aspect === '9:16') ratio = 9 / 16;

        if (dragType?.includes('e') || dragType?.includes('w')) {
          height = width / ratio;
          if (y + height > imgHeight) {
            height = imgHeight - y;
            width = height * ratio;
          }
        } else {
          width = height * ratio;
          if (x + width > imgWidth) {
            width = imgWidth - x;
            height = width / ratio;
          }
        }
      }
    }

    x = Math.max(0, Math.min(imgWidth - minSize, x));
    y = Math.max(0, Math.min(imgHeight - minSize, y));
    width = Math.max(minSize, Math.min(imgWidth - x, width));
    height = Math.max(minSize, Math.min(imgHeight - y, height));

    setCrop({
      x: Math.round(x),
      y: Math.round(y),
      width: Math.round(width),
      height: Math.round(height),
    });
  };

  const onPointerUp = (e: React.PointerEvent) => {
    try {
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    } catch (_) {}
    setIsDragging(false);
    setDragType(null);
  };

  // Compute percentage styles relative to the displayed image wrapper
  const cropBoxStyle: React.CSSProperties = imgWidth > 0 && imgHeight > 0 ? {
    left: `${(crop.x / imgWidth) * 100}%`,
    top: `${(crop.y / imgHeight) * 100}%`,
    width: `${(crop.width / imgWidth) * 100}%`,
    height: `${(crop.height / imgHeight) * 100}%`,
    touchAction: 'none',
    boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.65)',
  } : {
    left: '10%',
    top: '10%',
    width: '80%',
    height: '80%',
    touchAction: 'none',
    boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.65)',
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4">
      <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[94vh] flex flex-col shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="px-4 sm:px-5 py-3 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
              <span>Image Editor & Crop</span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 hidden xs:inline-block">
                Touch Friendly
              </span>
            </h2>
            <p className="text-xs text-slate-500">Slide box with finger or drag corners to resize</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Edit Toolbar (Rotate, Flip, Aspect Ratios) */}
        <div className="px-3 sm:px-5 py-2.5 bg-slate-50 border-b border-slate-100 flex items-center justify-between flex-wrap gap-2">
          {/* Rotate & Flip Tools */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            <div className="flex rounded-xl border border-slate-200 overflow-hidden bg-white shadow-2xs">
              <button
                onClick={() => setRotation((r) => (r - 90 + 360) % 360)}
                title="Rotate Left 90°"
                className="px-2 sm:px-2.5 py-1.5 hover:bg-slate-100 text-slate-700 border-r border-slate-200 flex items-center gap-1 text-xs font-bold cursor-pointer"
              >
                <span>↺ -90°</span>
              </button>
              <button
                onClick={() => setRotation((r) => (r + 90) % 360)}
                title="Rotate Right 90°"
                className="px-2 sm:px-2.5 py-1.5 hover:bg-slate-100 text-slate-700 flex items-center gap-1 text-xs font-bold cursor-pointer"
              >
                <span>↻ +90°</span>
              </button>
            </div>

            <div className="flex rounded-xl border border-slate-200 overflow-hidden bg-white shadow-2xs">
              <button
                onClick={() => setFlipH((f) => !f)}
                title="Flip Horizontal"
                className={`px-2 sm:px-2.5 py-1.5 text-xs font-bold flex items-center gap-1 transition-colors border-r border-slate-200 cursor-pointer ${
                  flipH ? 'bg-emerald-100 text-emerald-800' : 'hover:bg-slate-100 text-slate-700'
                }`}
              >
                <span>⇄ Flip H</span>
              </button>
              <button
                onClick={() => setFlipV((f) => !f)}
                title="Flip Vertical"
                className={`px-2 sm:px-2.5 py-1.5 text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer ${
                  flipV ? 'bg-emerald-100 text-emerald-800' : 'hover:bg-slate-100 text-slate-700'
                }`}
              >
                <span>⇅ Flip V</span>
              </button>
            </div>
          </div>

          {/* Aspect Ratio Buttons */}
          <div className="flex items-center gap-1 overflow-x-auto py-0.5 max-w-full">
            {[
              { id: 'free', label: 'Free' },
              { id: '1:1', label: '1:1' },
              { id: '3.5:4.5', label: 'Passport (3.5:4.5)' },
              { id: '3:4', label: '3:4' },
              { id: '4:3', label: '4:3' },
              { id: '16:9', label: '16:9' },
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => handleAspectChange(item.id)}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                  aspect === item.id
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                }`}
              >
                {item.label}
              </button>
            ))}

            <button
              onClick={handleReset}
              className="px-2 py-1 rounded-lg text-xs font-bold text-slate-600 hover:text-slate-900 bg-white border border-slate-200 flex items-center gap-1 cursor-pointer whitespace-nowrap ml-1"
            >
              <RotateCcw className="w-3 h-3" /> Reset
            </button>
          </div>
        </div>

        {/* Helpful Gesture Hint for Mobile */}
        <div className="bg-emerald-900/90 text-emerald-100 text-[11px] font-semibold py-1.5 px-4 text-center flex items-center justify-center gap-1.5 select-none">
          <Move className="w-3.5 h-3.5 text-emerald-300 animate-pulse" />
          <span>Slide inside box to move • Drag white circular handles to resize</span>
        </div>

        {/* Crop & Edit Canvas Area */}
        <div
          ref={containerRef}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          className="relative flex-1 bg-slate-950 flex items-center justify-center overflow-hidden p-3 sm:p-5 select-none min-h-[300px] max-h-[50vh] touch-none"
          style={{ touchAction: 'none' }}
        >
          {/* Wrapper that tightly wraps the image */}
          <div
            className="relative inline-block overflow-hidden touch-none select-none max-h-full max-w-full shadow-2xl rounded-sm"
            style={{ touchAction: 'none' }}
          >
            {currentImgSrc && (
              <img
                ref={imgRef}
                src={currentImgSrc}
                alt="Crop & Edit Source"
                className="max-h-[44vh] max-w-full object-contain block pointer-events-none select-none"
                draggable={false}
              />
            )}

            {/* HIGH-VISIBILITY CROP OVERLAY BOX */}
            <div
              className="absolute border-2 sm:border-3 border-emerald-400 cursor-move touch-none select-none z-20"
              style={cropBoxStyle}
              onPointerDown={(e) => onPointerDown('move', e)}
            >
              {/* Rule of thirds grid lines */}
              <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 pointer-events-none opacity-50">
                <div className="border-r border-b border-white/80"></div>
                <div className="border-r border-b border-white/80"></div>
                <div className="border-b border-white/80"></div>
                <div className="border-r border-b border-white/80"></div>
                <div className="border-r border-b border-white/80"></div>
                <div className="border-b border-white/80"></div>
                <div className="border-r border-b border-white/80"></div>
                <div className="border-r border-b border-white/80"></div>
                <div></div>
              </div>

              {/* Center Finger Drag Indicator */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="bg-slate-900/80 backdrop-blur-xs text-white text-[10px] font-bold px-2 py-0.5 rounded-full border border-white/20 shadow-md flex items-center gap-1 opacity-80 hover:opacity-100">
                  <Move className="w-3 h-3 text-emerald-400" />
                  <span>Slide to Move</span>
                </div>
              </div>

              {/* 8 Prominent White Circular Touch Handles */}
              {['nw', 'ne', 'sw', 'se', 'n', 's', 'w', 'e'].map((pos) => {
                let cursorClass = 'cursor-nwse-resize';
                if (pos === 'ne' || pos === 'sw') cursorClass = 'cursor-nesw-resize';
                if (pos === 'n' || pos === 's') cursorClass = 'cursor-ns-resize';
                if (pos === 'w' || pos === 'e') cursorClass = 'cursor-ew-resize';

                let posStyle: React.CSSProperties = { touchAction: 'none' };
                const isCorner = pos.length === 2;
                const sizeClass = isCorner ? 'w-6 h-6 sm:w-5 sm:h-5' : 'w-5 h-5 sm:w-4 sm:h-4';

                if (pos.includes('n')) posStyle.top = isCorner ? '-12px' : '-10px';
                if (pos.includes('s')) posStyle.bottom = isCorner ? '-12px' : '-10px';
                if (pos.includes('w')) posStyle.left = isCorner ? '-12px' : '-10px';
                if (pos.includes('e')) posStyle.right = isCorner ? '-12px' : '-10px';
                if (pos === 'n' || pos === 's') {
                  posStyle.left = '50%';
                  posStyle.transform = 'translateX(-50%)';
                }
                if (pos === 'w' || pos === 'e') {
                  posStyle.top = '50%';
                  posStyle.transform = 'translateY(-50%)';
                }

                return (
                  <div
                    key={pos}
                    className={`absolute ${sizeClass} bg-white border-2 border-emerald-600 rounded-full ${cursorClass} z-30 shadow-xl flex items-center justify-center touch-none after:absolute after:-inset-4 after:content-[''] cursor-pointer`}
                    style={posStyle}
                    onPointerDown={(e) => onPointerDown(pos, e)}
                  >
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-600 pointer-events-none"></div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-4 sm:px-5 py-3 bg-white border-t border-slate-100 flex items-center justify-between gap-2">
          <div className="text-xs font-semibold text-slate-500 truncate">
            {Math.round(imgWidth)} &times; {Math.round(imgHeight)} px • Crop: <span className="font-extrabold text-slate-800">{Math.round(crop.width)} &times; {Math.round(crop.height)} px</span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={onClose}
              className="px-3.5 py-2 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={() => onApply(crop, rotation, flipH, flipV)}
              className="px-4 sm:px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Check className="w-4 h-4" /> Apply Changes
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
