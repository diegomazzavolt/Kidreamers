/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Filter, X, ChevronDown, BookOpen, Baby, Newspaper } from 'lucide-react';
import { CEFRLevel, MainCategory, NewsSubCategory } from '../types';
import { useTheme } from '../contexts/ThemeContext';

interface SidebarFiltersProps {
  isOpen: boolean;
  onClose: () => void;
  sortBy: 'recent' | 'difficulty' | 'popular';
  setSortBy: (sort: 'recent' | 'difficulty' | 'popular') => void;
  selectedCategory: MainCategory;
  setSelectedCategory: (category: MainCategory) => void;
  selectedNewsSubCategory: NewsSubCategory;
  setSelectedNewsSubCategory: (sub: NewsSubCategory) => void;
}

export const SidebarFilters: React.FC<SidebarFiltersProps> = ({
  isOpen,
  onClose,
  sortBy,
  setSortBy,
  selectedCategory,
  setSelectedCategory,
  selectedNewsSubCategory,
  setSelectedNewsSubCategory
}) => {
  const { t } = useTheme();

  const mainCategories: { id: MainCategory; label: string; icon: any }[] = [
    { id: 'All', label: t('filter.all'), icon: Filter },
    { id: 'Contos', label: t('category.contos'), icon: BookOpen },
    { id: 'Infantil', label: t('category.infantil'), icon: Baby },
    { id: 'NEWS', label: t('category.news'), icon: Newspaper },
  ];

  const newsSubCategories: { id: NewsSubCategory; label: string }[] = [
    { id: 'All', label: t('filter.all') },
    { id: 'Politica Nacional', label: t('news.politica.nacional') },
    { id: 'Politica Global', label: t('news.politica.global') },
    { id: 'Economia Nacional', label: t('news.economia.nacional') },
    { id: 'Economia Global', label: t('news.economia.global') },
    { id: 'Noticias Quentes', label: t('news.quentes') },
    { id: 'Trend Topics X', label: t('news.trends') },
  ];

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed top-0 left-0 h-full w-80 bg-[var(--background)] 
        border-r border-[var(--border)]
        z-50 transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="p-6 space-y-8 h-full overflow-y-auto">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Filter size={20} /> {t('filter.genre')}
            </h2>
            <button onClick={onClose} className="p-2 hover:bg-[var(--card-bg)] rounded-full">
              <X size={20} />
            </button>
          </div>

          {/* Categories */}
          <section>
            <h3 className="text-sm font-bold mb-4 uppercase tracking-wider opacity-60">{t('filter.genre')}</h3>
            <div className="space-y-2">
              {mainCategories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`
                    w-full flex items-center gap-3 p-3 rounded-xl border text-sm transition-all
                    ${selectedCategory === cat.id 
                      ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-900/20 text-blue-600' 
                      : 'border-[var(--border)] hover:border-blue-400'}
                  `}
                >
                  <cat.icon size={18} className={selectedCategory === cat.id ? 'text-blue-500' : 'opacity-40'} />
                  <span className="font-bold">{cat.label}</span>
                  {selectedCategory === cat.id && <div className="ml-auto w-2 h-2 bg-blue-500 rounded-full" />}
                </button>
              ))}
            </div>
          </section>

          {/* News Sub-Categories */}
          {selectedCategory === 'NEWS' && (
            <section className="animate-in slide-in-from-top-4 duration-300">
              <h3 className="text-sm font-bold mb-4 uppercase tracking-wider opacity-60">Refine News</h3>
              <div className="space-y-2">
                {newsSubCategories.map((sub) => (
                  <button
                    key={sub.id}
                    onClick={() => setSelectedNewsSubCategory(sub.id)}
                    className={`
                      w-full flex justify-between items-center p-3 rounded-xl border text-xs transition-all
                      ${selectedNewsSubCategory === sub.id 
                        ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-900/20 text-blue-600' 
                        : 'border-[var(--border)] hover:border-blue-400'}
                    `}
                  >
                    <span>{sub.label}</span>
                    {selectedNewsSubCategory === sub.id && <div className="w-1.5 h-1.5 bg-blue-500 rounded-full" />}
                  </button>
                ))}
              </div>
            </section>
          )}

          {/* Sort By */}
          <section>
            <h3 className="text-sm font-bold mb-4 uppercase tracking-wider opacity-60">{t('filter.sort')}</h3>
            <div className="space-y-2">
              <button
                onClick={() => setSortBy('recent')}
                className={`
                  w-full flex justify-between items-center p-3 rounded-xl border text-sm transition-all
                  ${sortBy === 'recent' 
                    ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-900/20 text-blue-600' 
                    : 'border-[var(--border)]'}
                `}
              >
                <span>{t('filter.recent')}</span>
                {sortBy === 'recent' && <div className="w-2 h-2 bg-blue-500 rounded-full" />}
              </button>
              <button
                onClick={() => setSortBy('popular')}
                className={`
                  w-full flex justify-between items-center p-3 rounded-xl border text-sm transition-all
                  ${sortBy === 'popular' 
                    ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-900/20 text-blue-600' 
                    : 'border-[var(--border)]'}
                `}
              >
                <span>{t('filter.popular')}</span>
                {sortBy === 'popular' && <div className="w-2 h-2 bg-blue-500 rounded-full" />}
              </button>
              <button
                onClick={() => setSortBy('difficulty')}
                className={`
                  w-full flex justify-between items-center p-3 rounded-xl border text-sm transition-all
                  ${sortBy === 'difficulty' 
                    ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-900/20 text-blue-600' 
                    : 'border-[var(--border)]'}
                `}
              >
                <span>{t('filter.difficulty')}</span>
                {sortBy === 'difficulty' && <div className="w-2 h-2 bg-blue-500 rounded-full" />}
              </button>
            </div>
          </section>
        </div>
      </aside>
    </>
  );
};
