/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ArrowLeft, 
  User, 
  Settings, 
  Zap, 
  BookOpen, 
  Trash2, 
  Play, 
  CheckCircle2, 
  XCircle, 
  HelpCircle,
  LogOut,
  ChevronRight,
  Globe,
  Languages,
  UserCircle,
  Plus,
  Eye,
  EyeOff,
  Edit3,
  Layout,
  Sun,
  Moon
} from 'lucide-react';
import { QuoteItem } from './components/QuoteItem';
import { useAuth } from './contexts/AuthContext';
import { useTheme } from './contexts/ThemeContext';
import { useDeck } from './contexts/DeckContext';
import { useQuotes } from './contexts/QuoteContext';
import { useStories } from './contexts/StoryContext';
import { CEFRLevel, AppLanguage, AppTheme } from './types';
import confetti from 'canvas-confetti';

const levels: CEFRLevel[] = ['A1', 'A2', 'B1', 'B2', 'C1'];

const appLanguages: { code: AppLanguage; name: string; flag: string }[] = [
  { code: 'PT', name: 'Português', flag: '🇧🇷' },
  { code: 'EN', name: 'English', flag: '🇺🇸' },
  { code: 'ES', name: 'Español', flag: '🇪🇸' },
  { code: 'FR', name: 'Français', flag: '🇫🇷' },
  { code: 'DE', name: 'Deutsch', flag: '🇩🇪' },
  { code: 'RU', name: 'Русский', flag: '🇷🇺' },
];

export const Profile: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout, updatePreferredLevel } = useAuth();
  const { 
    t, 
    theme,
    setTheme,
    language, 
    setLanguage, 
    translationLanguage, 
    setTranslationLanguage, 
    voiceGender, 
    setVoiceGender,
    eyeProtectionIntensity,
    setEyeProtectionIntensity
  } = useTheme();
  const { cards, dueCards, removeCard, updateCardProgress } = useDeck();
  const { quotes, removeQuote } = useQuotes();
  const { stories, deleteStory, updateStory } = useStories();
  
  const [activeTab, setActiveTab] = useState<'preferences' | 'deck' | 'quotes' | 'posts'>(() => {
    const params = new URLSearchParams(location.search);
    const tab = params.get('tab');
    if (tab === 'posts' || tab === 'deck' || tab === 'quotes' || tab === 'preferences') {
      return tab as any;
    }
    return 'deck'; // Temporary default, will be refined in useEffect
  });

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (!params.has('tab') && user) {
      if (user.role === 'admin') {
        setActiveTab('posts');
      } else {
        setActiveTab('deck');
      }
    }
  }, [user, location.search]);
  const [isReviewing, setIsReviewing] = useState(false);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);

  const currentCard = dueCards[currentCardIndex];

  const handleReviewResponse = (quality: number) => {
    updateCardProgress(currentCard.id, quality);
    setIsFlipped(false);
    setTimeout(() => {
      if (currentCardIndex < dueCards.length - 1) {
        setCurrentCardIndex(prev => prev + 1);
      } else {
        setIsReviewing(false);
        setShowCelebration(true);
        confetti({
          particleCount: 150,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#2563eb', '#4f46e5', '#10b981', '#f59e0b']
        });
      }
    }, 300);
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

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

  if (isReviewing && currentCard) {
    return (
      <div className="min-h-screen flex flex-col bg-[var(--background)] transition-colors duration-300">
        <header className="p-4 flex items-center justify-between border-b border-[var(--border)] bg-[var(--background)]">
          <button onClick={() => setIsReviewing(false)} className="p-2 hover:bg-[var(--card-bg)] rounded-full">
            <ArrowLeft size={20} />
          </button>
          <div className="text-sm font-bold uppercase tracking-widest opacity-50">
            {t('deck.reviewing')}: {currentCardIndex + 1} / {dueCards.length}
          </div>
          <div className="w-10" />
        </header>

        <main className="flex-1 flex flex-col items-center justify-center p-6">
          <div className="w-full max-w-md perspective-1000">
            <motion.div
              animate={{ rotateY: isFlipped ? 180 : 0 }}
              transition={{ duration: 0.6, type: 'spring', stiffness: 260, damping: 20 }}
              className="relative w-full aspect-[4/3] preserve-3d cursor-pointer"
              onClick={() => setIsFlipped(!isFlipped)}
            >
              <div className="absolute inset-0 backface-hidden bg-[var(--card-bg)] border-2 border-[var(--border)] rounded-3xl shadow-xl flex flex-col items-center justify-center p-8 text-center">
                <span className="text-xs font-bold uppercase tracking-widest opacity-30 mb-4">{t('deck.word')}</span>
                <h2 className="text-4xl font-bold tracking-tight">{currentCard.word}</h2>
                <p className="mt-8 text-sm opacity-40 italic">{t('deck.flip')}</p>
              </div>

              <div 
                className="absolute inset-0 backface-hidden bg-[var(--card-bg)] border-2 border-blue-500 rounded-3xl shadow-xl flex flex-col items-center justify-center p-8 text-center"
                style={{ transform: 'rotateY(180deg)' }}
              >
                <span className="text-xs font-bold uppercase tracking-widest text-blue-500 mb-2">{t('deck.translation')}</span>
                <h2 className="text-3xl font-bold text-blue-600 dark:text-blue-400 mb-6">{currentCard.translation}</h2>
                <div className="h-px w-full bg-[var(--border)] mb-6" />
                <span className="text-xs font-bold uppercase tracking-widest opacity-30 mb-2">{t('deck.context')}</span>
                <p className="text-sm opacity-70 italic leading-relaxed">{currentCard.context}</p>
              </div>
            </motion.div>
          </div>

          <AnimatePresence>
            {isFlipped && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-12 grid grid-cols-3 gap-4 w-full max-w-md"
              >
                <button 
                  onClick={(e) => { e.stopPropagation(); handleReviewResponse(1); }}
                  className="flex flex-col items-center gap-2 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl text-red-600 hover:bg-red-100 transition-colors"
                >
                  <XCircle size={24} />
                  <span className="text-xs font-bold uppercase">{t('deck.again')}</span>
                </button>
                <button 
                  onClick={(e) => { e.stopPropagation(); handleReviewResponse(3); }}
                  className="flex flex-col items-center gap-2 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-2xl text-blue-600 hover:bg-blue-100 transition-colors"
                >
                  <HelpCircle size={24} />
                  <span className="text-xs font-bold uppercase">{t('deck.good')}</span>
                </button>
                <button 
                  onClick={(e) => { e.stopPropagation(); handleReviewResponse(5); }}
                  className="flex flex-col items-center gap-2 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-2xl text-green-600 hover:bg-green-100 transition-colors"
                >
                  <CheckCircle2 size={24} />
                  <span className="text-xs font-bold uppercase">{t('deck.easy')}</span>
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </main>
        <style>{`
          .perspective-1000 { perspective: 1000px; }
          .preserve-3d { transform-style: preserve-3d; }
          .backface-hidden { backface-visibility: hidden; }
        `}</style>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[var(--background)] transition-colors duration-300">
      <header className="sticky top-0 z-20 bg-[var(--background)] backdrop-blur-md border-b border-[var(--border)]">
        <div className="max-w-5xl mx-auto px-4 h-20 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate('/')} className="p-2 hover:bg-[var(--card-bg)] rounded-full transition-colors">
              <ArrowLeft size={24} />
            </button>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">{t('nav.profile') || 'Profile'}</h1>
              <p className="text-sm opacity-50">{user?.email}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {theme === 'eyeProtection' && (
              <motion.div 
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 'auto' }}
                className="flex items-center px-2"
              >
                <input 
                  type="range" 
                  min="5" 
                  max="50" 
                  step="1"
                  value={eyeProtectionIntensity}
                  onChange={(e) => setEyeProtectionIntensity(parseInt(e.target.value, 10))}
                  className="w-24 h-1.5 bg-[var(--card-bg)] rounded-lg appearance-none cursor-pointer accent-orange-500"
                />
              </motion.div>
            )}
            <button 
              onClick={toggleTheme}
              className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-[var(--card-bg)] transition-colors text-current opacity-60"
              title="Toggle Theme"
            >
              {getThemeIcon()}
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-5xl mx-auto w-full p-6">
        <div className="flex flex-col md:flex-row gap-8">
          {/* Sidebar Navigation */}
          <aside className="w-full md:w-64 shrink-0">
            <nav className="space-y-2">
              {user?.role === 'admin' && (
                <button
                  onClick={() => setActiveTab('posts')}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl font-bold transition-all border ${activeTab === 'posts' ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-900/20 text-blue-600' : 'border-transparent hover:bg-[var(--card-bg)] opacity-60 hover:opacity-100'}`}
                >
                  <Layout size={20} className={activeTab === 'posts' ? 'text-blue-500' : ''} />
                  Postagens
                </button>
              )}
              <button
                onClick={() => setActiveTab('deck')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl font-bold transition-all border ${activeTab === 'deck' ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-900/20 text-blue-600' : 'border-transparent hover:bg-[var(--card-bg)] opacity-60 hover:opacity-100'}`}
              >
                <Zap size={20} className={activeTab === 'deck' ? 'text-blue-500' : ''} />
                {t('profile.myDeck')}
                {dueCards.length > 0 && (
                  <span className={`ml-auto px-2 py-0.5 rounded-full text-[10px] ${activeTab === 'deck' ? 'bg-blue-600 text-white' : 'bg-blue-100 text-blue-600'}`}>
                    {dueCards.length}
                  </span>
                )}
              </button>
              <button
                onClick={() => setActiveTab('quotes')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl font-bold transition-all border ${activeTab === 'quotes' ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-900/20 text-blue-600' : 'border-transparent hover:bg-[var(--card-bg)] opacity-60 hover:opacity-100'}`}
              >
                <BookOpen size={20} className={activeTab === 'quotes' ? 'text-blue-500' : ''} />
                {t('profile.myQuotes')}
                {quotes.length > 0 && (
                  <span className={`ml-auto px-2 py-0.5 rounded-full text-[10px] ${activeTab === 'quotes' ? 'bg-blue-600 text-white' : 'bg-blue-100 text-blue-600'}`}>
                    {quotes.length}
                  </span>
                )}
              </button>
              <button
                onClick={() => setActiveTab('preferences')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl font-bold transition-all border ${activeTab === 'preferences' ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-900/20 text-blue-600' : 'border-transparent hover:bg-[var(--card-bg)] opacity-60 hover:opacity-100'}`}
              >
                <Settings size={20} className={activeTab === 'preferences' ? 'text-blue-500' : ''} />
                {t('profile.preferences')}
              </button>

              <div className="pt-4 mt-4 border-t border-[var(--border)]">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl font-bold transition-all text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 opacity-80 hover:opacity-100"
                >
                  <LogOut size={20} />
                  {t('header.signOut')}
                </button>
              </div>
            </nav>
          </aside>

          {/* Content Area */}
          <div className="flex-1">
            <AnimatePresence mode="wait">
              {activeTab === 'preferences' ? (
                <motion.div
                  key="preferences"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-10"
                >
                  {/* English Level */}
                  <section>
                    <div className="flex items-center gap-2 mb-6">
                      <Zap size={20} className="text-blue-500" />
                      <h2 className="text-xl font-bold">{t('profile.englishLevel')}</h2>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                      {levels.map(level => (
                        <button
                          key={level}
                          onClick={() => updatePreferredLevel(level)}
                          className={`
                            p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-1
                            ${user?.preferredLevel === level 
                              ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-900/20 text-blue-600' 
                              : 'border-[var(--border)] hover:border-blue-400 opacity-60'}
                          `}
                        >
                          <span className="text-lg font-black">{level}</span>
                          <span className="text-[10px] uppercase tracking-widest font-bold opacity-50">
                            {level === 'A1' ? 'Beginner' : level === 'A2' ? 'Elementary' : level === 'B1' ? 'Intermediate' : level === 'B2' ? 'Upper Int.' : 'Advanced'}
                          </span>
                        </button>
                      ))}
                    </div>
                  </section>

                  {/* App Language */}
                  <section>
                    <div className="flex items-center gap-2 mb-6">
                      <Globe size={20} className="text-emerald-500" />
                      <h2 className="text-xl font-bold">{t('profile.appLanguage')}</h2>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                      {appLanguages.map(lang => (
                        <button
                          key={lang.code}
                          onClick={() => setLanguage(lang.code)}
                          className={`
                            p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-1
                            ${language === lang.code 
                              ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-900/20 text-emerald-600' 
                              : 'border-[var(--border)] hover:border-emerald-400 opacity-60'}
                          `}
                        >
                          <span className="text-2xl">{lang.flag}</span>
                          <span className="text-xs font-bold">{lang.name}</span>
                        </button>
                      ))}
                    </div>
                  </section>

                  {/* Translation Language */}
                  <section>
                    <div className="flex items-center gap-2 mb-6">
                      <Languages size={20} className="text-purple-500" />
                      <h2 className="text-xl font-bold">{t('profile.translationLanguage')}</h2>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                      {appLanguages.map(lang => (
                        <button
                          key={lang.code}
                          onClick={() => setTranslationLanguage(lang.code)}
                          className={`
                            p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-1
                            ${translationLanguage === lang.code 
                              ? 'border-purple-500 bg-purple-50/50 dark:bg-purple-900/20 text-purple-600' 
                              : 'border-[var(--border)] hover:border-purple-400 opacity-60'}
                          `}
                        >
                          <span className="text-2xl">{lang.flag}</span>
                          <span className="text-xs font-bold">{lang.name}</span>
                        </button>
                      ))}
                    </div>
                  </section>

                  {/* Voice Gender */}
                  <section>
                    <div className="flex items-center gap-2 mb-6">
                      <UserCircle size={20} className="text-orange-500" />
                      <h2 className="text-xl font-bold">{t('profile.voiceGender')}</h2>
                    </div>
                    <div className="grid grid-cols-2 gap-3 max-w-md">
                      <button
                        onClick={() => setVoiceGender('female')}
                        className={`
                          p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-1
                          ${voiceGender === 'female' 
                            ? 'border-orange-500 bg-orange-50/50 dark:bg-orange-900/20 text-orange-600' 
                            : 'border-[var(--border)] hover:border-orange-400 opacity-60'}
                        `}
                      >
                        <span className="text-xs font-bold uppercase tracking-widest">{t('voice.female')}</span>
                      </button>
                      <button
                        onClick={() => setVoiceGender('male')}
                        className={`
                          p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-1
                          ${voiceGender === 'male' 
                            ? 'border-orange-500 bg-orange-50/50 dark:bg-orange-900/20 text-orange-600' 
                            : 'border-[var(--border)] hover:border-orange-400 opacity-60'}
                        `}
                      >
                        <span className="text-xs font-bold uppercase tracking-widest">{t('voice.male')}</span>
                      </button>
                    </div>
                  </section>
                </motion.div>
              ) : activeTab === 'posts' && user?.role === 'admin' ? (
                <motion.div
                  key="posts"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-8"
                >
                  <section>
                    <div className="flex items-center justify-between mb-8">
                      <h2 className="text-2xl font-bold flex items-center gap-3">
                        <Layout size={24} className="text-blue-500" /> Gerenciar Postagens
                      </h2>
                      <button
                        onClick={() => navigate('/submit')}
                        className="flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-2xl font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-500/20"
                      >
                        <Plus size={20} />
                        Postar
                      </button>
                    </div>

                    {stories.length === 0 ? (
                      <div className="p-16 text-center border-2 border-dashed border-[var(--border)] rounded-[40px] bg-[var(--card-bg)] opacity-80">
                        <Layout size={48} className="mx-auto opacity-20 mb-4" />
                        <p className="text-xl font-bold mb-2">Nenhuma postagem encontrada</p>
                        <p className="text-sm opacity-50 max-w-xs mx-auto">Comece publicando sua primeira história no site.</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {stories.map(story => (
                          <div 
                            key={story.id} 
                            className={`group p-4 bg-[var(--card-bg)] border border-[var(--border)] rounded-2xl hover:shadow-md transition-all flex items-center gap-4 ${story.isHidden ? 'opacity-50 grayscale' : ''}`}
                          >
                            <div className="w-16 h-16 rounded-xl overflow-hidden shrink-0 bg-gray-200">
                              {story.profileImage && (
                                <img src={story.profileImage} alt={story.title} className="w-full h-full object-cover" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <h3 className="font-bold text-lg truncate">{story.titles?.[language] || story.title}</h3>
                                {story.isHidden && (
                                  <span className="px-2 py-0.5 bg-gray-200 text-[10px] font-black uppercase tracking-tighter rounded-md text-gray-500">Rascunho</span>
                                )}
                              </div>
                              <p className="text-xs opacity-50 truncate">Por {story.author} • {story.category}</p>
                            </div>
                            <div className="flex items-center gap-1">
                              <button 
                                onClick={() => updateStory(story.id, { isHidden: !story.isHidden })}
                                title={story.isHidden ? "Mostrar" : "Ocultar"}
                                className={`p-2 rounded-xl transition-all ${story.isHidden ? 'text-emerald-500 hover:bg-emerald-50' : 'text-gray-400 hover:bg-gray-100'}`}
                              >
                                {story.isHidden ? <Eye size={18} /> : <EyeOff size={18} />}
                              </button>
                              <button 
                                onClick={() => navigate(`/submit?edit=${story.id}`)}
                                title="Editar"
                                className="p-2 text-blue-500 hover:bg-blue-50 rounded-xl transition-all"
                              >
                                <Edit3 size={18} />
                              </button>
                              <button 
                                onClick={() => deleteStory(story.id)}
                                title="Excluir"
                                className="p-2 text-red-500 hover:bg-red-50 rounded-xl transition-all"
                              >
                                <Trash2 size={18} />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </section>
                </motion.div>
              ) : activeTab === 'quotes' ? (
                <motion.div
                  key="quotes"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-8"
                >
                  <section>
                    {quotes.length === 0 ? (
                      <div className="p-16 text-center border-2 border-dashed border-[var(--border)] rounded-[40px] bg-[var(--card-bg)] opacity-80">
                        <BookOpen size={48} className="mx-auto opacity-20 mb-4" />
                        <p className="text-xl font-bold mb-2">{t('deck.empty')}</p>
                        <p className="text-sm opacity-50 max-w-xs mx-auto">{t('deck.emptyDesc')}</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {quotes.map(quote => (
                          <QuoteItem key={quote.id} quote={quote} />
                        ))}
                      </div>
                    )}
                  </section>
                </motion.div>
              ) : (
                <motion.div
                  key="deck"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-8"
                >
                  {/* Stats Dashboard */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="p-8 bg-blue-600 rounded-[32px] text-white shadow-xl shadow-blue-500/20">
                      <p className="text-xs font-bold uppercase tracking-widest opacity-70 mb-1">{t('deck.total')}</p>
                      <p className="text-5xl font-bold">{cards.length}</p>
                    </div>
                    <div className="p-8 bg-[var(--card-bg)] border border-[var(--border)] rounded-[32px] shadow-sm flex justify-between items-center">
                      <div>
                        <p className="text-xs font-bold uppercase tracking-widest opacity-40 mb-1">{t('deck.due')}</p>
                        <p className="text-5xl font-bold">{dueCards.length}</p>
                      </div>
                      {dueCards.length > 0 && (
                        <button 
                          onClick={() => setIsReviewing(true)}
                          className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-2xl font-bold hover:scale-105 transition-transform shadow-lg shadow-blue-500/20"
                        >
                          <Play size={18} fill="currentColor" /> {t('deck.start')}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Card List */}
                  <section>
                    <div className="flex items-center justify-between mb-6">
                      <h2 className="text-xl font-bold flex items-center gap-2">
                        <BookOpen size={20} className="text-blue-500" /> {t('deck.allWords')}
                      </h2>
                    </div>
                    
                    {cards.length === 0 ? (
                      <div className="p-16 text-center border-2 border-dashed border-[var(--border)] rounded-[40px] bg-[var(--card-bg)] opacity-80">
                        <BookOpen size={48} className="mx-auto opacity-20 mb-4" />
                        <p className="text-xl font-bold mb-2">{t('deck.empty')}</p>
                        <p className="text-sm opacity-50 max-w-xs mx-auto">{t('deck.emptyDesc')}</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {cards.map(card => (
                          <div key={card.id} className="group p-5 bg-[var(--card-bg)] border border-[var(--border)] rounded-2xl flex justify-between items-center hover:shadow-md transition-all">
                            <div>
                              <p className="font-bold text-lg">{card.word}</p>
                              <p className="text-sm opacity-50">{card.translation}</p>
                            </div>
                            <button 
                              onClick={() => removeCard(card.id)}
                              className="p-2 text-red-500 opacity-0 group-hover:opacity-100 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all"
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </section>

                  {/* Celebration */}
                  {showCelebration && dueCards.length === 0 && cards.length > 0 && (
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="p-12 bg-green-50 dark:bg-green-900/10 border border-green-100 dark:border-green-800 rounded-[40px] text-center"
                    >
                      <CheckCircle2 size={64} className="mx-auto text-green-500 mb-6" />
                      <h3 className="text-3xl font-bold text-green-700 dark:text-green-400 mb-3">{t('deck.congrats')}</h3>
                      <p className="text-green-600/70 mb-8 text-lg">{t('deck.congratsDesc')}</p>
                      <button 
                        onClick={() => setActiveTab('preferences')}
                        className="px-8 py-3 bg-green-600 text-white rounded-2xl font-bold hover:bg-green-700 transition-all shadow-lg shadow-green-500/20"
                      >
                        Back to Preferences
                      </button>
                    </motion.div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </main>
    </div>
  );
};
