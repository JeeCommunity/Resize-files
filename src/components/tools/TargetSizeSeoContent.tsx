import React from 'react';
import { ArrowRight, ShieldCheck, Zap, Award, HelpCircle } from 'lucide-react';

interface TargetSizeSeoContentProps {
  targetKB: number;
  onNavigate: (route: string) => void;
}

export const TargetSizeSeoContent: React.FC<TargetSizeSeoContentProps> = ({
  targetKB,
  onNavigate,
}) => {
  const otherSizes = [20, 50, 100, 200, 500].filter(s => s !== targetKB);

  return (
    <div className="mt-16 bg-white rounded-3xl border border-slate-200 p-8 sm:p-12 space-y-10 text-slate-700 shadow-sm">
      {/* Intro */}
      <div className="space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold uppercase tracking-wider">
          Target Size: {targetKB} KB Optimizer
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Compress Image to {targetKB}KB Online Securely
        </h2>
        <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
          Need to reduce your photo, signature, or scanned certificate size to exactly or under {targetKB} KB? Our advanced browser-based compression engine instantly shrinks JPG, PNG, and WebP images while keeping them crystal clear and fully compliant with official application portal requirements.
        </p>
      </div>

      {/* How to use */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 border-t border-slate-100">
        <div className="space-y-2 bg-slate-50 p-6 rounded-2xl border border-slate-200">
          <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white font-bold flex items-center justify-center text-sm shadow-xs">
            1
          </div>
          <h3 className="font-bold text-slate-900 text-base">Upload Your Image</h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            Drag and drop your JPG, PNG, or WebP photo or click to browse from your device storage.
          </p>
        </div>

        <div className="space-y-2 bg-slate-50 p-6 rounded-2xl border border-slate-200">
          <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white font-bold flex items-center justify-center text-sm shadow-xs">
            2
          </div>
          <h3 className="font-bold text-slate-900 text-base">Automatic {targetKB}KB Target</h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            The tool automatically locks onto the {targetKB} KB target size with under-target precision.
          </p>
        </div>

        <div className="space-y-2 bg-slate-50 p-6 rounded-2xl border border-slate-200">
          <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white font-bold flex items-center justify-center text-sm shadow-xs">
            3
          </div>
          <h3 className="font-bold text-slate-900 text-base">Preview & Download</h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            Inspect the compressed preview and file size, then download your optimized image instantly.
          </p>
        </div>
      </div>

      {/* FAQ */}
      <div className="space-y-6 pt-6 border-t border-slate-100">
        <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
          <HelpCircle className="w-5 h-5 text-emerald-600" />
          Frequently Asked Questions ({targetKB}KB Compressor)
        </h3>

        <div className="space-y-4">
          <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200">
            <h4 className="font-bold text-slate-900 text-sm mb-1">Will my image quality drop when compressing to {targetKB}KB?</h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              Our intelligent binary search algorithm balances pixel dimensions and compression quality to retain maximum sharpness while strictly meeting the {targetKB} KB file size limit.
            </p>
          </div>

          <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200">
            <h4 className="font-bold text-slate-900 text-sm mb-1">Are my photos uploaded to any server?</h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              No! All compression and resizing happens 100% locally in your web browser using HTML5 Canvas. Your files never leave your device, ensuring complete privacy.
            </p>
          </div>

          <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200">
            <h4 className="font-bold text-slate-900 text-sm mb-1">Can I adjust the target size manually?</h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              Yes, while {targetKB}KB is preset for this page, you can freely enter any custom KB target or switch between quick sizes anytime.
            </p>
          </div>
        </div>
      </div>

      {/* Internal Navigation Links */}
      <div className="pt-6 border-t border-slate-100 space-y-4">
        <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Explore Other Target Sizes & Tools</h3>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => onNavigate('/')}
            className="px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 transition-colors cursor-pointer"
          >
            Main Image Compressor
          </button>
          {otherSizes.map(size => (
            <button
              key={size}
              onClick={() => onNavigate(`/compress-image-to-${size}kb`)}
              className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 hover:bg-emerald-50 hover:text-emerald-700 text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1.5 border border-slate-200"
            >
              <span>Compress to {size}KB</span>
              <ArrowRight className="w-3 h-3 opacity-50" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
