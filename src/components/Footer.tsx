import React from 'react';
import { CountryLanguages } from './CountrySelector';
import { getTranslation, SupportedLanguage } from '../i18n/translations';

interface FooterProps {
  onNavigate: (route: string) => void;
  selectedCountry: CountryLanguages;
  selectedLang: SupportedLanguage;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate, selectedCountry, selectedLang }) => {
  const lang = selectedLang;

  return (
    <footer className="mt-20 border-t border-slate-200 bg-slate-900 text-slate-300 py-12 px-4 sm:px-8">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
        <div className="space-y-4">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold text-sm">
              R
            </div>
            <span className="font-extrabold text-white text-base">{getTranslation(lang, 'appTitle')}</span>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            {getTranslation(lang, 'footerDesc')}
          </p>
          <p className="text-[11px] text-emerald-400 font-medium">
            {getTranslation(lang, 'privacyNote')}
          </p>
        </div>

        <div className="space-y-3">
          <h4 className="text-xs font-bold text-white uppercase tracking-wider">{getTranslation(lang, 'imageTools')}</h4>
          <ul className="space-y-2 text-xs">
            <li><button onClick={() => onNavigate('/')} className="hover:text-white transition-colors cursor-pointer">Compress Image</button></li>
            <li><button onClick={() => onNavigate('/image-resizer')} className="hover:text-white transition-colors cursor-pointer">Resize Image</button></li>
            <li><button onClick={() => onNavigate('/compress-image-to-20kb')} className="hover:text-white transition-colors cursor-pointer">Compress to 20KB</button></li>
            <li><button onClick={() => onNavigate('/compress-image-to-50kb')} className="hover:text-white transition-colors cursor-pointer">Compress to 50KB</button></li>
            <li><button onClick={() => onNavigate('/compress-image-to-100kb')} className="hover:text-white transition-colors cursor-pointer">Compress to 100KB</button></li>
            <li><button onClick={() => onNavigate('/jpg-to-png')} className="hover:text-white transition-colors cursor-pointer">JPG to PNG Converter</button></li>
          </ul>
        </div>

        <div className="space-y-3">
          <h4 className="text-xs font-bold text-white uppercase tracking-wider">{getTranslation(lang, 'pdfTools')}</h4>
          <ul className="space-y-2 text-xs">
            <li><button onClick={() => onNavigate('/image-to-pdf')} className="hover:text-white transition-colors cursor-pointer">Images to PDF</button></li>
            <li><button onClick={() => onNavigate('/pdf-to-jpg')} className="hover:text-white transition-colors cursor-pointer">PDF to Images</button></li>
            <li><button onClick={() => onNavigate('/merge-pdf')} className="hover:text-white transition-colors cursor-pointer">Merge PDF</button></li>
            <li><button onClick={() => onNavigate('/split-pdf')} className="hover:text-white transition-colors cursor-pointer">Split PDF</button></li>
            <li><button onClick={() => onNavigate('/compress-pdf')} className="hover:text-white transition-colors cursor-pointer">Compress PDF</button></li>
          </ul>
        </div>

        <div className="space-y-3">
          <h4 className="text-xs font-bold text-white uppercase tracking-wider">Company & Legal</h4>
          <ul className="space-y-2 text-xs">
            <li><button onClick={() => onNavigate('/about')} className="hover:text-white transition-colors cursor-pointer">About Us</button></li>
            <li><button onClick={() => onNavigate('/privacy')} className="hover:text-white transition-colors cursor-pointer">Privacy Policy</button></li>
            <li><button onClick={() => onNavigate('/terms')} className="hover:text-white transition-colors cursor-pointer">Terms of Service</button></li>
            <li><button onClick={() => onNavigate('/contact')} className="hover:text-white transition-colors cursor-pointer">Contact Us</button></li>
            <li><button onClick={() => onNavigate('/admin')} className="text-emerald-400 hover:text-emerald-300 font-bold transition-colors cursor-pointer flex items-center gap-1">🔒 Admin Dashboard</button></li>
          </ul>
        </div>
      </div>

      <div className="max-w-7xl mx-auto pt-8 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
        <div>&copy; {new Date().getFullYear()} {getTranslation(lang, 'appTitle')}. All rights reserved. 100% Client-Side Processing.</div>
        <div className="flex items-center space-x-6">
          <button onClick={() => onNavigate('/privacy')} className="hover:text-slate-400 cursor-pointer">Privacy</button>
          <button onClick={() => onNavigate('/terms')} className="hover:text-slate-400 cursor-pointer">Terms</button>
          <button onClick={() => onNavigate('/about')} className="hover:text-slate-400 cursor-pointer">About</button>
          <button onClick={() => onNavigate('/contact')} className="hover:text-slate-400 cursor-pointer">Contact</button>
        </div>
      </div>
    </footer>
  );
};
