/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { Search, Moon, Sun, Eye, User, BookOpen, Menu, X, Plus, Minus, ChevronDown, Globe } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { useSettings } from '../contexts/SettingsContext';
import { AppTheme, AppLanguage, CEFRLevel } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate, useLocation } from 'react-router-dom';

interface HeaderProps {
  searchQuery?: string;
  setSearchQuery?: (query: string) => void;
  // Reader specific controls passed as props
  readerControls?: {
    readerLanguage: AppLanguage;
    setReaderLanguage: (lang: AppLanguage) => void;
    currentLevel: CEFRLevel;
    setCurrentLevel: (level: CEFRLevel) => void;
    availableLangs: AppLanguage[];
    availableLevels: CEFRLevel[];
    fontSize: number;
    setFontSize: (size: number) => void;
  };
}

export const Header: React.FC<HeaderProps> = ({ 
  searchQuery = '', 
  setSearchQuery = () => {}, 
  readerControls 
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { theme, setTheme, t, fontSize, setFontSize } = useTheme();
  const { user, setLoginModalOpen } = useAuth();
  const { logoUrl } = useSettings();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showLevelSelector, setShowLevelSelector] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const toggleTheme = () => {
    const themes: AppTheme[] = ['light', 'dark', 'eyeProtection'];
    const currentIndex = themes.indexOf(theme);
    const nextIndex = (currentIndex + 1) % themes.length;
    setTheme(themes[nextIndex]);
  };

  const getThemeIcon = () => {
    if (theme === 'light') return <Sun size={20} />;
    if (theme === 'dark') return <Moon size={20} />;
    return <Eye size={20} />;
  };

  const handleUserClick = () => {
    if (!user) {
      setLoginModalOpen(true);
    } else {
      const defaultTab = user.role === 'admin' ? 'posts' : 'deck';
      navigate(`/profile?tab=${defaultTab}`);
    }
    setIsSidebarOpen(false);
  };

  return (
    <>
      <header className="relative z-[60] w-full bg-[var(--background)] backdrop-blur-md border-b border-[var(--border)]">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
          {/* Logo */}
          <div 
            onClick={() => navigate('/')}
            className="flex items-center gap-2 shrink-0 cursor-pointer h-10"
          >
            {logoUrl ? (
              <img src={logoUrl} alt="Logo" className="max-h-full w-auto object-contain" />
            ) : (
              <>
                <BookOpen size={28} className="text-blue-600" />
                <span className="font-black text-xl tracking-tighter font-sans text-[var(--foreground)]">
                  {t('app.title')}
                </span>
              </>
            )}
          </div>

          {/* Hamburger Menu Button */}
          <button 
            onClick={() => setIsSidebarOpen(true)}
            className="w-10 h-10 flex items-center justify-center rounded-full bg-[var(--card-bg)] hover:bg-[var(--border)] transition-colors text-current opacity-60"
            title="Menu"
          >
            <Menu size={24} />
          </button>
        </div>
      </header>

      {/* Sidebar Overlay */}
      <AnimatePresence>
        {isSidebarOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSidebarOpen(false)}
              className="fixed inset-0 bg-black/10 backdrop-blur-[2px] z-[100]"
            />
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 h-full w-[300px] bg-[var(--background)] shadow-2xl z-[101] flex flex-col border-l border-[var(--border)]"
            >
              {/* Sidebar Content */}
              <div className="flex-1 overflow-y-auto p-4 space-y-6">
                
                {/* Top Actions Row: Search, Theme, Profile */}
                <div className="flex items-center justify-between relative h-12">
                  {/* Expanding Search Container */}
                  <div className={`absolute left-0 z-20 flex items-center transition-all duration-300 ${isSearchFocused ? 'w-full' : 'w-10'}`}>
                    <div className="relative w-full flex items-center">
                      <button 
                        onClick={() => searchInputRef.current?.focus()}
                        className="w-10 h-10 flex items-center justify-center rounded-full bg-[var(--card-bg)] hover:bg-[var(--border)] transition-colors text-current opacity-60 z-30"
                      >
                        <Search size={20} />
                      </button>
                      <input 
                        ref={searchInputRef}
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onFocus={() => setIsSearchFocused(true)}
                        onBlur={() => setIsSearchFocused(false)}
                        placeholder={t('search.placeholder')}
                        className={`absolute left-0 w-full h-10 pl-11 pr-4 bg-[var(--card-bg)] rounded-full text-sm outline-none border border-transparent focus:border-blue-500 transition-all ${isSearchFocused ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
                      />
                    </div>
                  </div>

                  {/* Theme and Profile (Hidden when search is focused/expanded if we want overlay effect) */}
                  <div className="flex items-center gap-2 ml-auto">
                    <button 
                      onClick={toggleTheme}
                      className="w-10 h-10 flex items-center justify-center rounded-full bg-[var(--card-bg)] hover:bg-[var(--border)] transition-colors text-current opacity-60"
                    >
                      {getThemeIcon()}
                    </button>

                    <button 
                      onClick={handleUserClick}
                      className="w-10 h-10 flex items-center justify-center rounded-full bg-[var(--card-bg)] border border-[var(--border)] hover:border-blue-500 transition-all overflow-hidden"
                    >
                      {user ? (
                        user.photoURL ? (
                          <img src={user.photoURL} alt="User" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-tr from-blue-500 to-indigo-600 flex items-center justify-center text-white">
                            <User size={18} />
                          </div>
                        )
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                          <User size={18} />
                        </div>
                      )}
                    </button>
                  </div>
                </div>

                {/* Reader Controls Section */}
                {readerControls && (
                  <div className="pt-6 border-t border-[var(--border)] flex items-center gap-2">
                    {/* Level & Language Selector (Combined Popup Style) */}
                    <div className="relative flex-1">
                      <button 
                        onClick={() => setShowLevelSelector(!showLevelSelector)}
                        className="w-full h-12 flex items-center justify-between px-3 bg-[var(--card-bg)] rounded-xl border border-[var(--border)] hover:bg-[var(--background)] transition-all shadow-sm"
                      >
                        <span className={`text-[10px] font-black uppercase tracking-widest ${!readerControls.availableLangs.includes(readerControls.readerLanguage) || !readerControls.availableLevels.includes(readerControls.currentLevel) ? 'opacity-30' : 'opacity-100'}`}>
                          {readerControls.readerLanguage} • {readerControls.currentLevel}
                        </span>
                        <ChevronDown size={14} className={`transition-transform duration-200 opacity-40 ${showLevelSelector ? 'rotate-180' : ''}`} />
                      </button>

                      <AnimatePresence>
                        {showLevelSelector && (
                          <>
                            <div className="fixed inset-0 z-10" onClick={() => setShowLevelSelector(false)} />
                            <motion.div
                              initial={{ opacity: 0, y: -10, scale: 0.95 }}
                              animate={{ opacity: 1, y: 0, scale: 1 }}
                              exit={{ opacity: 0, y: -10, scale: 0.95 }}
                              className="absolute top-full mt-2 left-0 w-[240px] bg-[var(--background)] border border-[var(--border)] rounded-2xl shadow-xl z-20 overflow-hidden px-3 py-4 space-y-4"
                            >
                              <div>
                                <div className="grid grid-cols-3 gap-1">
                                  {(['EN', 'ES', 'FR', 'DE', 'RU', 'PT'] as AppLanguage[]).map(lang => (
                                    <button
                                      key={lang}
                                      onClick={() => readerControls.setReaderLanguage(lang)}
                                      disabled={!readerControls.availableLangs.includes(lang)}
                                      className={`py-2 text-xs font-bold rounded-lg transition-all ${readerControls.readerLanguage === lang ? 'bg-blue-600 text-white' : 'hover:bg-[var(--card-bg)]'} ${!readerControls.availableLangs.includes(lang) ? 'opacity-20 cursor-not-allowed' : 'opacity-100'}`}
                                    >
                                      {lang}
                                    </button>
                                  ))}
                                </div>
                              </div>
                              <div className="border-t border-[var(--border)] pt-4">
                                <div className="grid grid-cols-3 gap-1">
                                  {(['A1', 'A2', 'B1', 'B2', 'C1', 'C2'] as CEFRLevel[]).map(level => (
                                    <button
                                      key={level}
                                      disabled={!readerControls.availableLevels.includes(level)}
                                      onClick={() => {
                                        readerControls.setCurrentLevel(level);
                                        setShowLevelSelector(false);
                                      }}
                                      className={`py-2 text-[10px] font-black rounded-lg transition-all ${readerControls.currentLevel === level ? 'bg-blue-600 text-white' : 'hover:bg-[var(--card-bg)]'} ${!readerControls.availableLevels.includes(level) ? 'opacity-20 cursor-not-allowed' : 'opacity-100'}`}
                                    >
                                      {level}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            </motion.div>
                          </>
                        )}
                      </AnimatePresence>
                    </div>

                    {/* Font Size (+ and -) */}
                    <div className="flex-1 flex items-center gap-0.5 bg-[var(--card-bg)] rounded-xl border border-[var(--border)] p-1 h-12">
                      <button 
                        onClick={() => readerControls.setFontSize(Math.max(12, readerControls.fontSize - 2))}
                        className="flex-1 h-full flex items-center justify-center rounded-lg hover:bg-[var(--background)] transition-colors"
                      >
                        <Minus size={18} />
                      </button>
                      <button 
                        onClick={() => readerControls.setFontSize(Math.min(48, readerControls.fontSize + 2))}
                        className="flex-1 h-full flex items-center justify-center rounded-lg hover:bg-[var(--background)] transition-colors"
                      >
                        <Plus size={18} />
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Sidebar Footer */}
              <div className="p-4 border-t border-[var(--border)]">
                <div className="flex items-center gap-2 text-[10px] font-bold opacity-20 uppercase tracking-widest justify-center">
                  <Globe size={12} />
                  <span>Kidreamers</span>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

