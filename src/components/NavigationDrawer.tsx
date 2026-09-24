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

  if (!isOpen) return null;

  const ALL_TOOLS = [
    { route: '/', label: 'Image Resizer / Compressor', category: 'General' },
    { route: '/image-resizer', label: 'Image Resizer', category: 'Resizers' },
    { route: '/compress-image', label: 'Compress Image', category: 'Resizers' },
    { route: '/photo-resizer', label: 'Photo Resizer', category: 'Resizers' },
    { route: '/signature-resizer', label: 'Signature Resizer (20KB)', category: 'Resizers' },
    { route: '/passport-photo-resizer', label: 'Passport Photo Resizer', category: 'Resizers' },
    { route: '/jpg-to-png', label: 'JPG to PNG', category: 'Image Tools' },
    { route: '/background-remover', label: 'Background Remover', category: 'Image Tools' },
    { route: '/png-to-jpg', label: 'PNG to JPG', category: 'Image Tools' },
    { route: '/jpg-to-webp', label: 'JPG to WebP', category: 'Image Tools' },
    { route: '/png-to-webp', label: 'PNG to WebP', category: 'Image Tools' },
    { route: '/webp-to-jpg', label: 'WebP to JPG', category: 'Image Tools' },
    { route: '/webp-to-png', label: 'WebP to PNG', category: 'Image Tools' },
    { route: '/compress-image-to-20kb', label: 'Compress to 20KB', category: 'Target Size' },
    { route: '/compress-image-to-50kb', label: 'Compress to 50KB', category: 'Target Size' },
    { route: '/compress-image-to-100kb', label: 'Compress to 100KB', category: 'Target Size' },
    { route: '/compress-image-to-200kb', label: 'Compress to 200KB', category: 'Target Size' },
    { route: '/compress-image-to-500kb', label: 'Compress to 500KB', category: 'Target Size' },
    { route: '/image-to-pdf', label: 'Image to PDF', category: 'PDF Tools' },
    { route: '/jpg-to-pdf', label: 'JPG to PDF', category: 'PDF Tools' },
    { route: '/png-to-pdf', label: 'PNG to PDF', category: 'PDF Tools' },
    { route: '/pdf-to-jpg', label: 'PDF to JPG', category: 'PDF Tools' },
    { route: '/pdf-to-png', label: 'PDF to PNG', category: 'PDF Tools' },
    { route: '/merge-pdf', label: 'Merge PDF', category: 'PDF Tools' },
    { route: '/split-pdf', label: 'Split PDF', category: 'PDF Tools' },
    { route: '/rotate-pdf', label: 'Rotate PDF', category: 'PDF Tools' },
    { route: '/compress-pdf', label: 'Compress PDF', category: 'PDF Tools' },
  ];

  const filteredTools = searchQuery.trim() === '' 
    ? [] 
    : ALL_TOOLS.filter(t => t.label.toLowerCase().includes(searchQuery.toLowerCase()) || t.category.toLowerCase().includes(searchQuery.toLowerCase()));

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
              <span className="font-extrabold text-slate-900 block text-sm">Resize files</span>
              <span className="text-[10px] text-slate-500">Image & PDF Tools</span>
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
              <span>Search Tools</span>
              <button
                onClick={() => { onNavigate('/admin'); onClose(); }}
                className="text-emerald-600 hover:text-emerald-700 font-bold text-[11px] flex items-center gap-1 cursor-pointer bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-200"
              >
                <Shield className="w-3 h-3" /> Admin Login
              </button>
            </div>
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search tools (e.g. 50kb, pdf, jpg)..."
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
                Results ({filteredTools.length})
              </div>
              {filteredTools.length === 0 ? (
                <div className="p-6 text-center bg-slate-50 rounded-2xl border border-slate-200">
                  <p className="text-xs font-semibold text-slate-700">No tools found</p>
                  <p className="text-[11px] text-slate-400 mt-1">Try searching keywords like "20kb", "pdf", "jpg", or "resize"</p>
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
                  <span>Image Resizer / Compressor</span>
                </button>
              </div>

              {/* MORE TOOLS SECTION */}
              <div className="space-y-4">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-400 px-1">
                  More Tools
                </div>

                {/* IMAGE TOOLS CATEGORY */}
                <div className="space-y-1">
                  <div className="flex items-center space-x-2 px-3 py-1 text-xs font-bold text-slate-800">
                    <ImageIcon className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Image Tools</span>
                  </div>
                  <div className="pl-4 space-y-0.5 border-l-2 border-slate-100 ml-3">
                    {[
                      { route: '/background-remover', label: 'Background Remover' },
                      { route: '/jpg-to-png', label: 'JPG to PNG' },
                      { route: '/png-to-jpg', label: 'PNG to JPG' },
                      { route: '/jpg-to-webp', label: 'JPG to WebP' },
                      { route: '/png-to-webp', label: 'PNG to WebP' },
                      { route: '/webp-to-jpg', label: 'WebP to JPG' },
                      { route: '/webp-to-png', label: 'WebP to PNG' },
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
                    <div className="text-[11px] font-bold text-slate-500 uppercase px-3 py-1">Popular Resizers</div>
                    <div className="pl-4 space-y-0.5 border-l-2 border-emerald-100 ml-3">
                      {[
                        { route: '/image-resizer', label: 'Image Resizer' },
                        { route: '/compress-image', label: 'Compress Image' },
                        { route: '/photo-resizer', label: 'Photo Resizer' },
                        { route: '/signature-resizer', label: 'Signature Resizer' },
                        { route: '/passport-photo-resizer', label: 'Passport Photo Resizer' },
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
                    <div className="text-[11px] font-bold text-slate-500 uppercase px-3 py-1">Target Size Compressors</div>
                    <div className="pl-4 space-y-0.5 border-l-2 border-emerald-100 ml-3">
                      {[
                        { route: '/compress-image-to-20kb', label: 'Compress to 20KB' },
                        { route: '/compress-image-to-50kb', label: 'Compress to 50KB' },
                        { route: '/compress-image-to-100kb', label: 'Compress to 100KB' },
                        { route: '/compress-image-to-200kb', label: 'Compress to 200KB' },
                        { route: '/compress-image-to-500kb', label: 'Compress to 500KB' },
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
                    <span>PDF Tools</span>
                  </div>
                  <div className="pl-4 space-y-0.5 border-l-2 border-slate-100 ml-3">
                    {[
                      { route: '/image-to-pdf', label: 'Image to PDF' },
                      { route: '/jpg-to-pdf', label: 'JPG to PDF' },
                      { route: '/png-to-pdf', label: 'PNG to PDF' },
                      { route: '/pdf-to-jpg', label: 'PDF to JPG' },
                      { route: '/pdf-to-png', label: 'PDF to PNG' },
                      { route: '/merge-pdf', label: 'Merge PDF' },
                      { route: '/split-pdf', label: 'Split PDF' },
                      { route: '/rotate-pdf', label: 'Rotate PDF' },
                      { route: '/compress-pdf', label: 'Compress PDF' },
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
              <span>100% Client-Side Privacy</span>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
