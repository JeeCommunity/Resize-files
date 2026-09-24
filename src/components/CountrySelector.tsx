import React, { useState, useRef, useEffect } from 'react';
import { Globe, ChevronDown, Check, ArrowRight, ArrowLeft } from 'lucide-react';
import { SupportedLanguage } from '../i18n/translations';

export interface CountryLanguages {
  code: string;
  name: string;
  flag: string;
  languages: { code: SupportedLanguage; name: string; nativeName: string }[];
  defaultLang: SupportedLanguage;
}

export const COUNTRIES_DATA: CountryLanguages[] = [
  {
    code: 'IN',
    name: 'India',
    flag: '🇮🇳',
    defaultLang: 'en',
    languages: [
      { code: 'en', name: 'English', nativeName: 'English (Default)' },
      { code: 'hi', name: 'Hindi', nativeName: 'हिंदी' },
      { code: 'bn', name: 'Bengali', nativeName: 'বাংলা' },
      { code: 'ta', name: 'Tamil', nativeName: 'தமிழ்' },
      { code: 'te', name: 'Telugu', nativeName: 'తెలుగు' },
      { code: 'mr', name: 'Marathi', nativeName: 'मराठी' },
      { code: 'gu', name: 'Gujarati', nativeName: 'ગુજરાતી' },
      { code: 'pa', name: 'Punjabi', nativeName: 'ਪੰਜਾਬੀ' },
    ]
  },
  {
    code: 'US',
    name: 'United States',
    flag: '🇺🇸',
    defaultLang: 'en',
    languages: [
      { code: 'en', name: 'English (US)', nativeName: 'English' },
      { code: 'es', name: 'Spanish', nativeName: 'Español' },
    ]
  },
  {
    code: 'GB',
    name: 'United Kingdom',
    flag: '🇬🇧',
    defaultLang: 'en',
    languages: [
      { code: 'en', name: 'English (UK)', nativeName: 'English' },
    ]
  },
  {
    code: 'CA',
    name: 'Canada',
    flag: '🇨🇦',
    defaultLang: 'en',
    languages: [
      { code: 'en', name: 'English', nativeName: 'English' },
      { code: 'fr', name: 'French', nativeName: 'Français' },
    ]
  },
  {
    code: 'DE',
    name: 'Germany',
    flag: '🇩🇪',
    defaultLang: 'de',
    languages: [
      { code: 'de', name: 'German', nativeName: 'Deutsch' },
      { code: 'en', name: 'English', nativeName: 'English' },
    ]
  },
  {
    code: 'FR',
    name: 'France',
    flag: '🇫🇷',
    defaultLang: 'fr',
    languages: [
      { code: 'fr', name: 'French', nativeName: 'Français' },
      { code: 'en', name: 'English', nativeName: 'English' },
    ]
  },
  {
    code: 'ES',
    name: 'Spain',
    flag: '🇪🇸',
    defaultLang: 'es',
    languages: [
      { code: 'es', name: 'Spanish', nativeName: 'Español' },
      { code: 'en', name: 'English', nativeName: 'English' },
    ]
  },
  {
    code: 'JP',
    name: 'Japan',
    flag: '🇯🇵',
    defaultLang: 'ja',
    languages: [
      { code: 'ja', name: 'Japanese', nativeName: '日本語' },
      { code: 'en', name: 'English', nativeName: 'English' },
    ]
  },
  {
    code: 'BR',
    name: 'Brazil',
    flag: '🇧🇷',
    defaultLang: 'pt',
    languages: [
      { code: 'pt', name: 'Portuguese', nativeName: 'Português' },
      { code: 'en', name: 'English', nativeName: 'English' },
    ]
  },
  {
    code: 'AU',
    name: 'Australia',
    flag: '🇦🇺',
    defaultLang: 'en',
    languages: [
      { code: 'en', name: 'English', nativeName: 'English' },
    ]
  }
];

interface CountrySelectorProps {
  selectedCountry: CountryLanguages;
  selectedLang: SupportedLanguage;
  onSelectCountryAndLang: (country: CountryLanguages, lang: SupportedLanguage) => void;
}

export const CountrySelector: React.FC<CountrySelectorProps> = ({
  selectedCountry,
  selectedLang,
  onSelectCountryAndLang
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState<'country' | 'language'>('country');
  const [activeCountry, setActiveCountry] = useState<CountryLanguages>(selectedCountry);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setStep('country');
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleCountryClick = (c: CountryLanguages) => {
    setActiveCountry(c);
    // Move to language selection step for this country
    setStep('language');
  };

  const handleLanguageSelect = (langCode: SupportedLanguage) => {
    onSelectCountryAndLang(activeCountry, langCode);
    setIsOpen(false);
    setStep('country');

    // Save to localStorage
    try {
      localStorage.setItem('resizefiles_lang', langCode);
      localStorage.setItem('resizefiles_country', JSON.stringify(activeCountry));
    } catch (e) {
      // ignore
    }
  };

  const currentLangName = activeCountry.languages.find(l => l.code === selectedLang)?.nativeName || selectedLang;

  return (
    <div className="relative flex items-center" ref={dropdownRef}>
      <div id="google_translate_element" className="hidden"></div>

      <button
        onClick={() => {
          setIsOpen(!isOpen);
          setStep('country');
        }}
        className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-all cursor-pointer border border-slate-200 shadow-xs"
        title="Select Country & Language"
      >
        <span className="text-base">{selectedCountry.flag}</span>
        <span className="hidden sm:inline font-bold">{selectedCountry.name}</span>
        <span className="text-[11px] text-slate-500 hidden md:inline">({currentLangName})</span>
        <ChevronDown className={`w-3.5 h-3.5 text-slate-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-2xl shadow-xl border border-slate-200 p-3 z-50 animate-in fade-in zoom-in-95 duration-150">
          {step === 'country' ? (
            <div>
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100 px-1">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Step 1: Select Country</span>
                <span className="text-[11px] text-emerald-600 font-semibold">10 Countries</span>
              </div>
              <div className="max-h-72 overflow-y-auto space-y-1">
                {COUNTRIES_DATA.map((c) => (
                  <button
                    key={c.code}
                    onClick={() => handleCountryClick(c)}
                    className={`w-full flex items-center justify-between px-3 py-2 text-left text-xs rounded-xl hover:bg-emerald-50 transition-colors cursor-pointer ${
                      selectedCountry.code === c.code ? 'bg-emerald-50/80 font-bold text-emerald-900' : 'text-slate-700'
                    }`}
                  >
                    <div className="flex items-center space-x-2.5">
                      <span className="text-lg">{c.flag}</span>
                      <div>
                        <div className="font-semibold text-slate-900">{c.name}</div>
                        <div className="text-[10px] text-slate-500">{c.languages.length} languages available</div>
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-400" />
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div>
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100 px-1">
                <button
                  onClick={() => setStep('country')}
                  className="flex items-center gap-1 text-xs text-emerald-600 font-bold hover:underline cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" /> Back
                </button>
                <span className="text-xs font-bold text-slate-700 flex items-center gap-1">
                  <span>{activeCountry.flag}</span> {activeCountry.name} Languages
                </span>
              </div>
              <div className="max-h-72 overflow-y-auto space-y-1">
                {activeCountry.languages.map((lang) => (
                  <button
                    key={lang.code}
                    onClick={() => handleLanguageSelect(lang.code)}
                    className={`w-full flex items-center justify-between px-3 py-2.5 text-left text-xs rounded-xl hover:bg-emerald-50 transition-colors cursor-pointer ${
                      selectedLang === lang.code && selectedCountry.code === activeCountry.code
                        ? 'bg-emerald-100/80 font-bold text-emerald-900'
                        : 'text-slate-700'
                    }`}
                  >
                    <div>
                      <div className="font-semibold text-sm text-slate-900">{lang.nativeName}</div>
                      <div className="text-[10px] text-slate-500">{lang.name}</div>
                    </div>
                    {selectedLang === lang.code && selectedCountry.code === activeCountry.code && (
                      <Check className="w-4 h-4 text-emerald-600" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
