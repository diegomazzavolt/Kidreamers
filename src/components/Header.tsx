/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { Search, Moon, Sun, Eye, User, BookOpen, Filter } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { AppTheme } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';

interface HeaderProps {
  searchQuery?: string;
  setSearchQuery?: (query: string) => void;
  onOpenFilters?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ searchQuery = '', setSearchQuery = () => {}, onOpenFilters = () => {} }) => {
  const navigate = useNavigate();
  const { theme, setTheme, t } = useTheme();
  const { user, setLoginModalOpen } = useAuth();
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isSearchExpanded && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isSearchExpanded]);

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
  };

  return (
    <header className="sticky top-0 z-30 w-full bg-[var(--background)] backdrop-blur-md border-b border-[var(--border)]">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
        {/* Logo */}
        <div 
          onClick={() => navigate('/')}
          className="flex items-center gap-2 shrink-0 cursor-pointer"
        >
          <BookOpen size={28} className="text-blue-600" />
          <span className="font-black text-xl tracking-tighter font-sans text-[var(--foreground)]">
            {t('app.title')}
          </span>
        </div>

        {/* Search & Actions */}
        <div className="flex items-center justify-end flex-1 gap-2 sm:gap-4">
          {/* Search Bar & Filter Unification */}
          <div className="flex items-center gap-2 flex-1 max-w-md justify-end">
            <div className={`relative flex items-center transition-all duration-300 ${isSearchExpanded ? 'flex-1' : 'w-10'}`}>
              <AnimatePresence>
                {isSearchExpanded ? (
                  <motion.input
                    initial={{ width: 0, opacity: 0 }}
                    animate={{ width: '100%', opacity: 1 }}
                    exit={{ width: 0, opacity: 0 }}
                    ref={searchInputRef}
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onBlur={() => !searchQuery && setIsSearchExpanded(false)}
                    placeholder={t('search.placeholder')}
                    className="w-full h-10 pl-10 pr-4 bg-[var(--card-bg)] rounded-full text-sm outline-none border border-transparent focus:border-blue-500 transition-all font-sans"
                  />
                ) : null}
              </AnimatePresence>
              <button 
                onClick={() => setIsSearchExpanded(true)}
                className={`absolute left-0 w-10 h-10 flex items-center justify-center rounded-full hover:bg-[var(--card-bg)] transition-colors ${isSearchExpanded ? 'text-gray-400' : 'text-current opacity-60'}`}
              >
                <Search size={20} />
              </button>
            </div>

            <button 
              onClick={onOpenFilters}
              className="w-10 h-10 flex items-center justify-center rounded-full bg-[var(--card-bg)] hover:opacity-80 transition-colors text-current opacity-60"
              title="Filters"
            >
              <Filter size={20} />
            </button>
          </div>

          {/* Theme Toggle */}
          <button 
            onClick={toggleTheme}
            className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-[var(--card-bg)] transition-colors text-current opacity-60"
            title="Toggle Theme"
          >
            {getThemeIcon()}
          </button>

          {/* User Menu */}
          <div className="relative">
            <button 
              onClick={handleUserClick}
              className="w-10 h-10 flex items-center justify-center rounded-full bg-[var(--card-bg)] border border-[var(--border)] hover:border-blue-500 transition-all overflow-hidden"
              title={user ? "User Menu" : "Sign In"}
            >
              {user ? (
                user.photoURL ? (
                  <img 
                    src={user.photoURL} 
                    alt={user.displayName || 'User'} 
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-tr from-blue-500 to-indigo-600 flex items-center justify-center text-white">
                    <User size={20} />
                  </div>
                )
              ) : (
                <User size={20} className="opacity-60" />
              )}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
