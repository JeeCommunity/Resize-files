import React, { useState } from 'react';
import { 
  X, 
  Sliders, 
  FileText, 
  Image as ImageIcon, 
  ArrowRight, 
  Home, 
  Shield,
  Search
} from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';

interface NavigationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  currentRoute: string;
  onNavigate: (route: string) => void;
}

export const NavigationDrawer: React.FC<NavigationDrawerProps> = ({
  isOpen,
  onClose,
  currentRoute,
  onNavigate,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const { t } = useLanguage();

  if (!isOpen) return null;

  const ALL_TOOLS = [
    { route: '/', label: t('imageResizerCompressor'), category: t('catGeneral') },
    { route: '/image-resizer', label: t('imageResizer'), category: t('catResizers') },
    { route: '/compress-image', label: t('compressImage'), category: t('catResizers') },
    { route: '/photo-resizer', label: t('photoResizer'), category: t('catResizers') },
    { route: '/signature-resizer', label: t('signatureResizer'), category: t('catResizers') },
    { route: '/passport-photo-resizer', label: t('passportPhotoResizer'), category: t('catResizers') },
    { route: '/jpg-to-png', label: t('jpgToPng'), category: t('catImageTools') },
    { route: '/background-remover', label: t('backgroundRemover'), category: t('catImageTools') },
    { route: '/png-to-jpg', label: t('pngToJpg'), category: t('catImageTools') },
    { route: '/jpg-to-webp', label: t('jpgToWebp'), category: t('catImageTools') },
    { route: '/png-to-webp', label: t('pngToWebp'), category: t('catImageTools') },
    { route: '/webp-to-jpg', label: t('webpToJpg'), category: t('catImageTools') },
    { route: '/webp-to-png', label: t('webpToPng'), category: t('catImageTools') },
    { route: '/compress-image-to-20kb', label: t('compressTo20kb'), category: t('catTargetSize') },
    { route: '/compress-image-to-50kb', label: t('compressTo50kb'), category: t('catTargetSize') },
    { route: '/compress-image-to-100kb', label: t('compressTo100kb'), category: t('catTargetSize') },
    { route: '/compress-image-to-200kb', label: t('compressTo200kb'), category: t('catTargetSize') },
    { route: '/compress-image-to-500kb', label: t('compressTo500kb'), category: t('catTargetSize') },
    { route: '/image-to-pdf', label: t('imageToPdf'), category: t('catPdfTools') },
    { route: '/jpg-to-pdf', label: t('jpgToPdf'), category: t('catPdfTools') },
    { route: '/png-to-pdf', label: t('pngToPdf'), category: t('catPdfTools') },
    { route: '/pdf-to-jpg', label: t('pdfToJpg'), category: t('catPdfTools') },
    { route: '/pdf-to-png', label: t('pdfToPng'), category: t('catPdfTools') },
    { route: '/pdf-to-image', label: t('pdfToImage'), category: t('catPdfTools') },
    { route: '/merge-pdf', label: t('mergePdf'), category: t('catPdfTools') },
    { route: '/split-pdf', label: t('splitPdf'), category: t('catPdfTools') },
    { route: '/rotate-pdf', label: t('rotatePdf'), category: t('catPdfTools') },
    { route: '/compress-pdf', label: t('compressPdf'), category: t('catPdfTools') },
  ];

  const filteredTools = searchQuery.trim() === '' 
    ? [] 
    : ALL_TOOLS.filter(item => item.label.toLowerCase().includes(searchQuery.toLowerCase()) || item.category.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="absolute inset-y-0 left-0 max-w-xs w-full bg-white shadow-2xl flex flex-col z-10 transform transition-transform duration-300 ease-in-out">
        {/* Header */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold shadow-sm">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <span className="font-extrabold text-slate-900 block text-sm">{t('appTitle')}</span>
              <span className="text-[10px] text-slate-500">{t('imageTools')} & {t('pdfTools')}</span>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Links */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6 text-sm">
          
          {/* SEARCH TOOL INPUT */}
          <div className="space-y-1.5">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-400 px-1 flex items-center justify-between">
              <span>{t('searchTools')}</span>
              <button
                onClick={() => { onNavigate('/admin'); onClose(); }}
                className="text-emerald-600 hover:text-emerald-700 font-bold text-[11px] flex items-center gap-1 cursor-pointer bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-200"
              >
                <Shield className="w-3 h-3" /> {t('adminLogin')}
              </button>
            </div>
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t('searchPlaceholder')}
                className="w-full pl-9 pr-8 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-xs font-medium"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold cursor-pointer p-1"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* IF SEARCH RESULTS */}
          {searchQuery.trim() !== '' ? (
            <div className="space-y-2">
              <div className="text-xs font-bold text-slate-400 uppercase px-1">
                {t('results')} ({filteredTools.length})
              </div>
              {filteredTools.length === 0 ? (
                <div className="p-6 text-center bg-slate-50 rounded-2xl border border-slate-200">
                  <p className="text-xs font-semibold text-slate-700">{t('noToolsFound')}</p>
                  <p className="text-[11px] text-slate-400 mt-1">{t('trySearchingKeywords')}</p>
                </div>
              ) : (
                <div className="space-y-1">
                  {filteredTools.map((tool) => (
                    <button
                      key={tool.route}
                      onClick={() => { onNavigate(tool.route); onClose(); setSearchQuery(''); }}
                      className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-colors flex items-center justify-between cursor-pointer ${
                        currentRoute === tool.route
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'bg-slate-50 hover:bg-slate-100 text-slate-700'
                      }`}
                    >
                      <div>
                        <div>{tool.label}</div>
                        <span className="text-[10px] text-emerald-600 font-medium">{tool.category}</span>
                      </div>
                      <ArrowRight className="w-3.5 h-3.5 opacity-40" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <>
              {/* Main / Home */}
              <div>
                <button
                  onClick={() => { onNavigate('/'); onClose(); }}
                  className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl font-semibold transition-colors cursor-pointer ${
                    currentRoute === '/' 
                      ? 'bg-emerald-50 text-emerald-700' 
                      : 'text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <Home className="w-4 h-4 text-emerald-600" />
                  <span>{t('imageResizerCompressor')}</span>
                </button>
              </div>

              {/* MORE TOOLS SECTION */}
              <div className="space-y-4">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-400 px-1">
                  {t('moreTools')}
                </div>

                {/* IMAGE TOOLS CATEGORY */}
                <div className="space-y-1">
                  <div className="flex items-center space-x-2 px-3 py-1 text-xs font-bold text-slate-800">
                    <ImageIcon className="w-3.5 h-3.5 text-emerald-600" />
                    <span>{t('imageTools')}</span>
                  </div>
                  <div className="pl-4 space-y-0.5 border-l-2 border-slate-100 ml-3">
                    {[
                      { route: '/background-remover', label: t('backgroundRemover') },
                      { route: '/jpg-to-png', label: t('jpgToPng') },
                      { route: '/png-to-jpg', label: t('pngToJpg') },
                      { route: '/jpg-to-webp', label: t('jpgToWebp') },
                      { route: '/png-to-webp', label: t('pngToWebp') },
                      { route: '/webp-to-jpg', label: t('webpToJpg') },
                      { route: '/webp-to-png', label: t('webpToPng') },
                    ].map((item) => (
                      <button
                        key={item.route}
                        onClick={() => { onNavigate(item.route); onClose(); }}
                        className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium transition-colors flex items-center justify-between cursor-pointer ${
                          currentRoute === item.route
                            ? 'bg-emerald-50 text-emerald-700 font-semibold'
                            : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                        }`}
                      >
                        <span>{item.label}</span>
                        <ArrowRight className="w-3 h-3 opacity-40" />
                      </button>
                    ))}
                  </div>

                  <div className="pt-2">
                    <div className="text-[11px] font-bold text-slate-500 uppercase px-3 py-1">{t('popularResizers')}</div>
                    <div className="pl-4 space-y-0.5 border-l-2 border-emerald-100 ml-3">
                      {[
                        { route: '/image-resizer', label: t('imageResizer') },
                        { route: '/compress-image', label: t('compressImage') },
                        { route: '/photo-resizer', label: t('photoResizer') },
                        { route: '/signature-resizer', label: t('signatureResizer') },
                        { route: '/passport-photo-resizer', label: t('passportPhotoResizer') },
                      ].map((item) => (
                        <button
                          key={item.route}
                          onClick={() => { onNavigate(item.route); onClose(); }}
                          className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium transition-colors flex items-center justify-between cursor-pointer ${
                            currentRoute === item.route
                              ? 'bg-emerald-50 text-emerald-700 font-semibold'
                              : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                          }`}
                        >
                          <span>{item.label}</span>
                          <ArrowRight className="w-3 h-3 opacity-40" />
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="pt-2">
                    <div className="text-[11px] font-bold text-slate-500 uppercase px-3 py-1">{t('targetSizeCompressors')}</div>
                    <div className="pl-4 space-y-0.5 border-l-2 border-emerald-100 ml-3">
                      {[
                        { route: '/compress-image-to-20kb', label: t('compressTo20kb') },
                        { route: '/compress-image-to-50kb', label: t('compressTo50kb') },
                        { route: '/compress-image-to-100kb', label: t('compressTo100kb') },
                        { route: '/compress-image-to-200kb', label: t('compressTo200kb') },
                        { route: '/compress-image-to-500kb', label: t('compressTo500kb') },
                      ].map((item) => (
                        <button
                          key={item.route}
                          onClick={() => { onNavigate(item.route); onClose(); }}
                          className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium transition-colors flex items-center justify-between cursor-pointer ${
                            currentRoute === item.route
                              ? 'bg-emerald-50 text-emerald-700 font-semibold'
                              : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                          }`}
                        >
                          <span>{item.label}</span>
                          <ArrowRight className="w-3 h-3 opacity-40" />
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* PDF TOOLS CATEGORY */}
                <div className="space-y-1 pt-2">
                  <div className="flex items-center space-x-2 px-3 py-1 text-xs font-bold text-slate-800">
                    <FileText className="w-3.5 h-3.5 text-indigo-600" />
                    <span>{t('pdfTools')}</span>
                  </div>
                  <div className="pl-4 space-y-0.5 border-l-2 border-slate-100 ml-3">
                    {[
                      { route: '/image-to-pdf', label: t('imageToPdf') },
                      { route: '/jpg-to-pdf', label: t('jpgToPdf') },
                      { route: '/png-to-pdf', label: t('pngToPdf') },
                      { route: '/pdf-to-jpg', label: t('pdfToJpg') },
                      { route: '/pdf-to-png', label: t('pdfToPng') },
                      { route: '/pdf-to-image', label: t('pdfToImage') },
                      { route: '/merge-pdf', label: t('mergePdf') },
                      { route: '/split-pdf', label: t('splitPdf') },
                      { route: '/rotate-pdf', label: t('rotatePdf') },
                      { route: '/compress-pdf', label: t('compressPdf') },
                    ].map((item) => (
                      <button
                        key={item.route}
                        onClick={() => { onNavigate(item.route); onClose(); }}
                        className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium transition-colors flex items-center justify-between cursor-pointer ${
                          currentRoute === item.route
                            ? 'bg-indigo-50 text-indigo-700 font-semibold'
                            : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                        }`}
                      >
                        <span>{item.label}</span>
                        <ArrowRight className="w-3 h-3 opacity-40" />
                      </button>
                    ))}
                  </div>
                </div>

              </div>
            </>
          )}

          {/* Quick Footer Links */}
          <div className="pt-4 border-t border-slate-100 space-y-2 text-xs text-slate-500">
            <div className="flex items-center space-x-2 px-3 py-1">
              <Shield className="w-3.5 h-3.5 text-emerald-600" />
              <span>{t('clientSidePrivacy')}</span>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
