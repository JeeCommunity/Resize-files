import React from 'react';
import { ShieldCheck, FileText, ArrowRight } from 'lucide-react';

interface TermsPageProps {
  onNavigate?: (route: string) => void;
}

export const TermsPage: React.FC<TermsPageProps> = () => {
  return (
    <div className="max-w-4xl mx-auto bg-white rounded-3xl border border-slate-200 p-8 sm:p-12 space-y-8 text-slate-700 shadow-sm">
      <div className="space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold uppercase tracking-wider">
          Legal Agreement
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Terms of Service</h1>
        <p className="text-xs text-slate-500">Last updated: September 2026</p>
      </div>

      <div className="space-y-6 text-sm leading-relaxed text-slate-600">
        <div className="space-y-2">
          <h2 className="text-lg font-bold text-slate-900">1. Acceptance of Terms</h2>
          <p>
            By accessing and using Resize Files (resizefiles.pages.dev), you accept and agree to be bound by the terms and provisions of this agreement. If you do not agree to abide by these terms, please do not use our web application.
          </p>
        </div>

        <div className="space-y-2">
          <h2 className="text-lg font-bold text-slate-900">2. Use of Service & Client-Side Processing</h2>
          <p>
            Resize Files provides online image resizing, compression, format conversion, and PDF utilities. All file processing operations take place locally within your web browser using HTML5 Canvas and client-side JavaScript libraries. Your files are never uploaded to any remote servers.
          </p>
        </div>

        <div className="space-y-2">
          <h2 className="text-lg font-bold text-slate-900">3. User Responsibilities</h2>
          <p>
            You agree to use Resize Files only for lawful purposes. You retain full copyright and ownership of any images or documents you process. You are solely responsible for verifying that compressed files meet the specific requirements of any third-party application or examination portal.
          </p>
        </div>

        <div className="space-y-2">
          <h2 className="text-lg font-bold text-slate-900">4. Limitation of Liability</h2>
          <p>
            The service is provided on an "as is" and "as available" basis without warranties of any kind, either express or implied. Resize Files shall not be liable for any indirect, incidental, or consequential damages arising out of the use or inability to use our tools.
          </p>
        </div>

        <div className="space-y-2">
          <h2 className="text-lg font-bold text-slate-900">5. Changes to Terms</h2>
          <p>
            We reserve the right to modify these terms at any time. Continued use of the website following any changes constitutes your acceptance of the revised terms.
          </p>
        </div>
      </div>
    </div>
  );
};
