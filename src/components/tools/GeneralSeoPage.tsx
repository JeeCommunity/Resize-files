import React from 'react';
import { ArrowRight, HelpCircle } from 'lucide-react';

interface GeneralSeoPageProps {
  toolType: 'image-resizer' | 'compress-image' | 'photo-resizer' | 'signature-resizer' | 'passport-photo-resizer';
  onNavigate: (route: string) => void;
}

export const GeneralSeoPage: React.FC<GeneralSeoPageProps> = ({ toolType, onNavigate }) => {
  const contentMap = {
    'image-resizer': {
      title: 'Image Resizer Online – Resize JPG, PNG & WebP Dimensions',
      desc: 'Quickly resize image dimensions in pixels or percentages. Change width and height while maintaining aspect ratios or setting custom dimensions directly in your browser.',
      badge: 'Image Resizer Tool'
    },
    'compress-image': {
      title: 'Compress Image Online – Reduce Image File Size',
      desc: 'Reduce photo and image file sizes in KB or MB without losing visual quality. Optimized for fast web uploads, email attachments, and application forms.',
      badge: 'Image Compressor'
    },
    'photo-resizer': {
      title: 'Photo Resizer for Online Forms & Exams',
      desc: 'Resize your photographs to exact dimensions and KB limits required by government portals, job applications, and university entrance forms.',
      badge: 'Photo Resizer'
    },
    'signature-resizer': {
      title: 'Signature Resizer Online – Resize Signature to 20KB',
      desc: 'Crop, resize, and compress your scanned signature to strict upload requirements (under 20KB) for UPSC, SSC, Banking, and NEET forms.',
      badge: 'Signature Resizer'
    },
    'passport-photo-resizer': {
      title: 'Passport Photo Resizer – Resize Passport Size Photos',
      desc: 'Easily resize passport photographs to standard dimensions and file sizes (50KB or 100KB) with automatic aspect ratio correction.',
      badge: 'Passport Photo Resizer'
    }
  };

  const current = contentMap[toolType] || contentMap['compress-image'];

  return (
    <div className="mt-16 bg-white rounded-3xl border border-slate-200 p-8 sm:p-12 space-y-10 text-slate-700 shadow-sm">
      <div className="space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold uppercase tracking-wider">
          {current.badge}
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          {current.title}
        </h2>
        <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
          {current.desc} All processing takes place securely inside your browser without uploading files to any external servers.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 border-t border-slate-100">
        <div className="space-y-2 bg-slate-50 p-6 rounded-2xl border border-slate-200">
          <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white font-bold flex items-center justify-center text-sm shadow-xs">1</div>
          <h3 className="font-bold text-slate-900 text-base">Select Image</h3>
          <p className="text-xs text-slate-600 leading-relaxed">Upload any JPG, PNG, or WebP photo from your computer or phone.</p>
        </div>
        <div className="space-y-2 bg-slate-50 p-6 rounded-2xl border border-slate-200">
          <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white font-bold flex items-center justify-center text-sm shadow-xs">2</div>
          <h3 className="font-bold text-slate-900 text-base">Configure Settings</h3>
          <p className="text-xs text-slate-600 leading-relaxed">Set your target KB size, dimensions, or crop boundaries.</p>
        </div>
        <div className="space-y-2 bg-slate-50 p-6 rounded-2xl border border-slate-200">
          <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white font-bold flex items-center justify-center text-sm shadow-xs">3</div>
          <h3 className="font-bold text-slate-900 text-base">Download Result</h3>
          <p className="text-xs text-slate-600 leading-relaxed">Preview the final optimized file and download instantly.</p>
        </div>
      </div>

      <div className="space-y-6 pt-6 border-t border-slate-100">
        <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
          <HelpCircle className="w-5 h-5 text-emerald-600" />
          Frequently Asked Questions
        </h3>
        <div className="space-y-4">
          <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200">
            <h4 className="font-bold text-slate-900 text-sm mb-1">Is this tool free to use?</h4>
            <p className="text-xs text-slate-600 leading-relaxed">Yes, all tools on Resize files are 100% free with no registration or watermarks required.</p>
          </div>
          <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200">
            <h4 className="font-bold text-slate-900 text-sm mb-1">Are my photos secure?</h4>
            <p className="text-xs text-slate-600 leading-relaxed">Absolutely. Because files are processed entirely within your browser memory, your photos remain 100% private.</p>
          </div>
        </div>
      </div>

      <div className="pt-6 border-t border-slate-100 space-y-4">
        <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Explore Related Tools</h3>
        <div className="flex flex-wrap gap-2">
          <button onClick={() => onNavigate('/compress-image-to-20kb')} className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 hover:bg-emerald-50 hover:text-emerald-700 text-xs font-semibold transition-colors cursor-pointer border border-slate-200">Compress to 20KB</button>
          <button onClick={() => onNavigate('/compress-image-to-50kb')} className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 hover:bg-emerald-50 hover:text-emerald-700 text-xs font-semibold transition-colors cursor-pointer border border-slate-200">Compress to 50KB</button>
          <button onClick={() => onNavigate('/compress-image-to-100kb')} className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 hover:bg-emerald-50 hover:text-emerald-700 text-xs font-semibold transition-colors cursor-pointer border border-slate-200">Compress to 100KB</button>
          <button onClick={() => onNavigate('/image-to-pdf')} className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 hover:bg-emerald-50 hover:text-emerald-700 text-xs font-semibold transition-colors cursor-pointer border border-slate-200">Image to PDF</button>
        </div>
      </div>
    </div>
  );
};
