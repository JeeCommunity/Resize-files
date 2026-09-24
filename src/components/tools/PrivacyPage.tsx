import React from 'react';
import { ShieldCheck, Lock, EyeOff, Server, HardDrive } from 'lucide-react';

export const PrivacyPage: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6 space-y-10 text-slate-700">
      <div className="text-center space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold uppercase tracking-wider">
          Privacy Policy
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
          Privacy & Data Security
        </h1>
        <p className="text-slate-600 max-w-2xl mx-auto text-base">
          Last updated: September 2026. At Resize files, your privacy is our highest priority. Read how our 100% browser-based architecture protects your files.
        </p>
      </div>

      <div className="space-y-8 bg-white rounded-3xl border border-slate-200 p-8 sm:p-12">
        <div className="space-y-3">
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-600" />
            1. Files Are Processed in Your Browser
          </h2>
          <p className="text-sm text-slate-600 leading-relaxed">
            All image compression, resizing, PDF merging, and format conversions are executed locally inside your web browser using HTML5 Canvas and JavaScript Web APIs. Your uploaded photographs, signatures, marksheets, and PDF files are <strong>never intentionally uploaded or transmitted to any external server</strong>.
          </p>
        </div>

        <div className="space-y-3">
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <HardDrive className="w-5 h-5 text-emerald-600" />
            2. Temporary Memory & Object URLs
          </h2>
          <p className="text-sm text-slate-600 leading-relaxed">
            During processing, temporary browser memory (Object URLs) is utilized to display previews and enable downloads. Once you close or refresh the browser tab, all temporary file references are instantly cleared from memory.
          </p>
        </div>

        <div className="space-y-3">
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <EyeOff className="w-5 h-5 text-emerald-600" />
            3. No Data Stored or Shared
          </h2>
          <p className="text-sm text-slate-600 leading-relaxed">
            We do not store, archive, sell, or inspect any user-submitted documents or images. You maintain 100% ownership and control over your files at all times.
          </p>
        </div>

        <div className="space-y-3">
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Lock className="w-5 h-5 text-emerald-600" />
            4. Secure HTTPS Connection
          </h2>
          <p className="text-sm text-slate-600 leading-relaxed">
            Our web application is delivered over encrypted HTTPS connections, ensuring secure communication between your browser and our static hosting infrastructure.
          </p>
        </div>
      </div>
    </div>
  );
};
