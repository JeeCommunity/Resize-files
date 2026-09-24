import React from 'react';
import { ChevronRight, Home } from 'lucide-react';

interface BreadcrumbItem {
  label: string;
  path: string;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  onNavigate: (route: string) => void;
}

export const Breadcrumbs: React.FC<BreadcrumbsProps> = ({ items, onNavigate }) => {
  if (!items || items.length <= 1) return null;

  return (
    <nav aria-label="Breadcrumb" className="max-w-6xl mx-auto px-3 sm:px-6 pt-4 pb-2">
      <ol className="flex items-center space-x-2 text-xs text-slate-500 overflow-x-auto whitespace-nowrap py-1">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          return (
            <li key={item.path + index} className="flex items-center space-x-2">
              {index > 0 && <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />}
              {isLast ? (
                <span className="font-semibold text-slate-800 truncate" aria-current="page">
                  {item.label}
                </span>
              ) : (
                <button
                  onClick={() => onNavigate(item.path)}
                  className="hover:text-emerald-600 transition-colors cursor-pointer flex items-center gap-1 font-medium"
                >
                  {index === 0 && <Home className="w-3.5 h-3.5" />}
                  <span>{item.label}</span>
                </button>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
};
