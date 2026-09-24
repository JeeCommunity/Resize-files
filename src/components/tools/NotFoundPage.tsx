import React from 'react';
import { Home, Sliders, FileText, ArrowRight, AlertTriangle } from 'lucide-react';

interface NotFoundPageProps {
  onNavigate: (route: string) => void;
}

export const NotFoundPage: React.FC<NotFoundPageProps> = ({ onNavigate }) => {
  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-16">
      <div className="max-w-md w-full bg-white rounded-3xl border border-slate-200 p-8 text-center shadow-sm space-y-6">
        <div className="w-16 h-16 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center mx-auto">
          <AlertTriangle className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-black text-slate-900">Page Not Found</h1>
          <p className="text-sm text-slate-600 leading-relaxed">
            The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.
          </p>
        </div>

        <div className="pt-4 border-t border-slate-100 space-y-2 text-left">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">Explore Popular Tools</span>
          <button
            onClick={() => onNavigate('/')}
            className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-emerald-50 hover:text-emerald-700 font-semibold text-xs text-slate-700 transition-colors cursor-pointer border border-slate-200"
          >
            <span className="flex items-center gap-2"><Home className="w-4 h-4 text-emerald-600" /> Homepage</span>
            <ArrowRight className="w-4 h-4" />
          </button>
          <button
            onClick={() => onNavigate('/image-resizer')}
            className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-emerald-50 hover:text-emerald-700 font-semibold text-xs text-slate-700 transition-colors cursor-pointer border border-slate-200"
          >
            <span className="flex items-center gap-2"><Sliders className="w-4 h-4 text-emerald-600" /> Image Resizer</span>
            <ArrowRight className="w-4 h-4" />
          </button>
          <button
            onClick={() => onNavigate('/compress-image')}
            className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-emerald-50 hover:text-emerald-700 font-semibold text-xs text-slate-700 transition-colors cursor-pointer border border-slate-200"
          >
            <span className="flex items-center gap-2"><Sliders className="w-4 h-4 text-emerald-600" /> Compress Image</span>
            <ArrowRight className="w-4 h-4" />
          </button>
          <button
            onClick={() => onNavigate('/image-to-pdf')}
            className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-emerald-50 hover:text-emerald-700 font-semibold text-xs text-slate-700 transition-colors cursor-pointer border border-slate-200"
          >
            <span className="flex items-center gap-2"><FileText className="w-4 h-4 text-emerald-600" /> PDF Tools</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
