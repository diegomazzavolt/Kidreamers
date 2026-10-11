/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { Header } from './components/Header';
import { StoryCard } from './components/StoryCard';
import { useStories } from './contexts/StoryContext';
import { useTheme } from './contexts/ThemeContext';
import { MainCategory, NewsSubCategory } from './types';
import { Search, Newspaper } from 'lucide-react';

import { useNavigate } from 'react-router-dom';

export const Home: React.FC = () => {
  const navigate = useNavigate();
  const { stories, isLoading: isStoriesLoading } = useStories();
  const { t, language } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy] = useState<'recent' | 'difficulty' | 'popular'>('recent');
  const [selectedCategory] = useState<MainCategory>('All');
  const [selectedNewsSubCategory] = useState<NewsSubCategory>('All');

  const filteredStories = useMemo(() => {
    let result = [...stories];
    
    // Filter out hidden stories
    result = result.filter(s => s.isHidden !== true);
    
    // Simple Search Filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(s => {
        const localizedTitle = s.titles?.[language] || s.title;
        const localizedSubtitle = s.subtitles?.[language] || s.subtitle || '';
        return localizedTitle.toLowerCase().includes(query) || 
               localizedSubtitle.toLowerCase().includes(query) ||
               s.author.toLowerCase().includes(query) ||
               s.description.toLowerCase().includes(query)
      });
    }

    return result;
  }, [stories, searchQuery, language]);

  const handleStoryClick = (id: string) => {
    navigate(`/read/${id}`);
  };

  return (
    <div className={`min-h-screen flex flex-col bg-[var(--background)] transition-colors duration-300 ${selectedCategory === 'NEWS' ? 'news-mode' : ''}`}>
      <Header 
        searchQuery={searchQuery} 
        setSearchQuery={setSearchQuery} 
      />

      <div className="flex-1 flex max-w-7xl mx-auto w-full">
        <main className="flex-1 p-4 sm:p-8">
          {selectedCategory === 'NEWS' && (
            <div className="mb-8 p-6 bg-blue-600 text-white rounded-[2rem] shadow-xl shadow-blue-500/20 flex items-center gap-4 animate-in fade-in slide-in-from-left-4 duration-500">
              <div className="p-3 bg-white/20 rounded-2xl">
                <Newspaper size={32} />
              </div>
              <div>
                <h1 className="text-2xl font-black tracking-tight uppercase italic">Global News Portal</h1>
                <p className="text-sm opacity-80 font-medium">Real-time updates in {language} • {selectedNewsSubCategory === 'All' ? 'All Topics' : selectedNewsSubCategory}</p>
              </div>
            </div>
          )}

          {isStoriesLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                <div key={i} className="aspect-[4/5] bg-[var(--card-bg)] rounded-3xl animate-pulse" />
              ))}
            </div>
          ) : filteredStories.length > 0 ? (
            <div 
              className={`grid gap-6 ${selectedCategory === 'NEWS' ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4'}`}
            >
              {filteredStories.map((story) => (
                <div key={story.id}>
                  <StoryCard story={story} onClick={handleStoryClick} />
                </div>
              ))}
            </div>
          ) : (
            <div className="h-96 flex flex-col items-center justify-center text-center p-8 bg-[var(--card-bg)] opacity-80 rounded-[40px] border-2 border-dashed border-[var(--border)]">
              <div className="w-20 h-20 bg-[var(--background)] rounded-full flex items-center justify-center mb-6">
                <Search size={32} className="opacity-20" />
              </div>
              <p className="text-xl font-bold mb-2">{t('home.noStories')}</p>
              <p className="text-sm opacity-50 max-w-xs">{t('home.noStoriesDesc')}</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};
