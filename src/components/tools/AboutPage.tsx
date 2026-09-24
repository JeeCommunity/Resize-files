import React from 'react';
import { ShieldCheck, Zap, Award, CheckCircle2 } from 'lucide-react';

interface AboutPageProps {
  onNavigate: (route: string) => void;
}

export const AboutPage: React.FC<AboutPageProps> = ({ onNavigate }) => {
  return (
    <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6 space-y-10 text-slate-700">
      <div className="text-center space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold uppercase tracking-wider">
          About Us
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
          About Resize files
        </h1>
        <p className="text-slate-600 max-w-2xl mx-auto text-base sm:text-lg">
          The fast, secure, and browser-based utility suite designed to help students and professionals compress photos, signatures, and documents to exact KB limits for official exam and job application forms.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <h2 className="font-bold text-slate-900 text-lg">100% Client-Side Privacy</h2>
          <p className="text-xs text-slate-600 leading-relaxed">
            Your files never leave your device. All image compression, resizing, cropping, and PDF conversions happen directly in your browser using HTML5 Canvas and Web APIs.
          </p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-3">
          <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center font-bold">
            <Zap className="w-5 h-5" />
          </div>
          <h2 className="font-bold text-slate-900 text-lg">Exact KB Precision</h2>
          <p className="text-xs text-slate-600 leading-relaxed">
            Our intelligent binary-search compression engine ensures your passport photos and signatures hit strict portal limits (like 20KB, 50KB, 100KB) without quality loss.
          </p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold">
            <Award className="w-5 h-5" />
          </div>
          <h2 className="font-bold text-slate-900 text-lg">Exam & Form Ready</h2>
          <p className="text-xs text-slate-600 leading-relaxed">
            Tailored specifically for UPSC, SSC, Banking exams, NEET, JEE, and university admissions where strict file dimension and size constraints apply.
          </p>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 p-8 sm:p-10 space-y-6">
        <h2 className="text-2xl font-bold text-slate-900">What Tools Do We Offer?</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          {[
            'Exact KB Image Compression (20KB to 500KB)',
            'Image Resizing with Custom Width & Height',
            'Image Cropping, Rotation & Flipping',
            'Image Format Converter (JPG, PNG, WebP)',
            'Images to PDF & PDF to Images',
            'PDF Merge, Split, Rotate & Compress'
          ].map((item, idx) => (
            <div key={idx} className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span className="font-medium text-slate-800">{item}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="text-center pt-4">
        <button
          onClick={() => onNavigate('/')}
          className="px-8 py-3.5 rounded-xl bg-emerald-600 text-white font-bold text-sm shadow-sm hover:bg-emerald-700 transition-colors cursor-pointer"
        >
          Get Started - Compress an Image Now
        </button>
      </div>
    </div>
  );
};
