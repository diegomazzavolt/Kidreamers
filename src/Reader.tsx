/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, Plus, Minus, Settings, Volume2, Loader2, Globe, ChevronLeft, ChevronRight, BookOpen, ChevronDown, Edit3, Mic } from 'lucide-react';
import parse, { domToReact, HTMLReactParserOptions, Element, Text } from 'html-react-parser';
import { Header } from './components/Header';
import { CustomAudioPlayer } from './components/CustomAudioPlayer';
import { useStories } from './contexts/StoryContext';
import { useTheme } from './contexts/ThemeContext';
import { useDeck } from './contexts/DeckContext';
import { useQuotes } from './contexts/QuoteContext';
import { useAuth } from './contexts/AuthContext';
import { CEFRLevel, AppLanguage } from './types';
import { translateWordWithAI, generateSpeechWithAI } from './services/geminiService';

export const Reader: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t, language, translationLanguage, setTranslationLanguage, fontSize, setFontSize } = useTheme();
  const { addCard } = useDeck();
  const { addQuote } = useQuotes();
  const { getStory, stories } = useStories();
  
  const { user, updatePreferredFontSize } = useAuth();
  const story = useMemo(() => getStory(id || ''), [id, getStory]);
  const { voiceGender } = useTheme();
  
  const contentRef = useRef<HTMLDivElement>(null);
  const shadowRef = useRef<HTMLDivElement>(null);
  const touchStartPos = useRef<{ x: number, y: number } | null>(null);
  const isSelecting = useRef(false);
  const longPressTimer = useRef<any>(null);
  const selectionStartRange = useRef<{ node: Node, offset: number } | null>(null);

  const currentIndex = useMemo(() => {
    return stories.findIndex(s => s.id === id);
  }, [stories, id]);

  const prevStory = useMemo(() => {
    if (currentIndex < stories.length - 1) return stories[currentIndex + 1];
    return null;
  }, [stories, currentIndex]);

  const nextStory = useMemo(() => {
    if (currentIndex > 0) return stories[currentIndex - 1];
    return null;
  }, [stories, currentIndex]);

  const [currentLevel, setCurrentLevel] = useState<CEFRLevel>(user?.preferredLevel || 'A1');
  const [readerLanguage, setReaderLanguage] = useState<AppLanguage>(language);
  const [currentChapterIndex, setCurrentChapterIndex] = useState(0);
  const [showLevelSelector, setShowLevelSelector] = useState(false);
  const [isAdapting, setIsAdapting] = useState(false);
  const [showFlyIcon, setShowFlyIcon] = useState<{ x: number; y: number } | null>(null);
  const [translationLevel, setTranslationLevel] = useState<CEFRLevel>(currentLevel);

  // Helper to automatically align content by injecting structural IDs if missing
  const dnaAligner = useCallback((html: string) => {
    if (!html) return '';
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    
    // Select blocks that match across translations
    const blocks = doc.querySelectorAll('p, li, h1, h2, h3, h4, h5, h6, blockquote, dt, dd');
    blocks.forEach((block, index) => {
      // Only assign structural ID if it doesn't have a manual one
      if (!block.id) {
        block.id = `dna-blk-${index}`;
      }
    });

    return doc.body.innerHTML;
  }, []);

  // Use currentLevel as translationLevel by default
  useEffect(() => {
    setTranslationLevel(currentLevel);
  }, [currentLevel]);

  // Sync font size from user profile if available
  useEffect(() => {
    if (user?.preferredFontSize) {
      setFontSize(user.preferredFontSize);
    }
  }, [user?.preferredFontSize]);

  const currentContent = useMemo(() => {
    if (!story) return '';
    
    let rawHtml = '';
    // If story has chapters, use the current chapter's content
    if (story.chapters && story.chapters.length > 0) {
      const chapter = story.chapters[currentChapterIndex];
      if (chapter && chapter.contents) {
        const langContent = chapter.contents[readerLanguage];
        if (langContent) rawHtml = langContent[currentLevel] || '';
      }
    } else if (story.contents) {
      const langContent = story.contents[readerLanguage];
      if (langContent) rawHtml = langContent[currentLevel] || '';
    }

    return dnaAligner(rawHtml);
  }, [story, currentLevel, readerLanguage, currentChapterIndex, dnaAligner]);

  const currentChapter = useMemo(() => {
    if (story?.chapters && story.chapters.length > 0) {
      return story.chapters[currentChapterIndex];
    }
    return null;
  }, [story, currentChapterIndex]);

  const localizedTitle = useMemo(() => {
    if (!story) return '';
    if (currentChapter) {
      return currentChapter.titles?.[readerLanguage] || currentChapter.title;
    }
    return story.titles?.[readerLanguage] || story.title;
  }, [story, currentChapter, readerLanguage]);

  const localizedSubtitle = useMemo(() => {
    if (!story) return '';
    if (currentChapter) {
      return currentChapter.subtitles?.[readerLanguage] || currentChapter.subtitle;
    }
    return story.subtitles?.[readerLanguage] || story.subtitle;
  }, [story, currentChapter, readerLanguage]);

  const currentAudioUrl = useMemo(() => {
    const source = currentChapter || story;
    if (!source || !source.audio) return null;
    return source.audio[readerLanguage]?.[currentLevel]?.[voiceGender] || null;
  }, [story, currentChapter, readerLanguage, currentLevel, voiceGender]);

  // Sync reader language with app language on mount or if story doesn't have content for it
  useEffect(() => {
    if (story && !story.contents[readerLanguage]) {
      const availableLangs = Object.keys(story.contents) as AppLanguage[];
      if (availableLangs.length > 0) {
        setReaderLanguage(availableLangs[0]);
      }
    }
  }, [story]);

  // Ensure current level exists when language changes
  useEffect(() => {
    if (story && story.contents[readerLanguage]) {
      const langContent = story.contents[readerLanguage];
      if (langContent && !langContent[currentLevel]) {
        const availableLevels = Object.keys(langContent) as CEFRLevel[];
        if (availableLevels.length > 0) {
          setCurrentLevel(availableLevels[0]);
        }
      }
    }
  }, [readerLanguage, story]);

  const processedContent = useMemo(() => {
    let content = currentContent;
    
    // Ensure all <w> tags have the w-word class for styling
    // This is just for initial rendering if needed, but the parser handle it better
    
    if (story?.communityHighlights) {
      // Sort by length descending to avoid partial matches inside longer highlights
      const sortedHighlights = [...story.communityHighlights].sort((a, b) => b.text.length - a.text.length);
      
      sortedHighlights.forEach(highlight => {
        const escapedText = highlight.text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const regex = new RegExp(`(${escapedText})`, 'gi');
        // We use a custom tag that we'll handle in the parser
        content = content.replace(regex, `<highlight data-count="${highlight.count}">$1</highlight>`);
      });
    }
    return content;
  }, [currentContent, story?.communityHighlights]);
  
  const translationContent = useMemo(() => {
    if (!story) return '';
    
    let rawHtml = '';
    if (story.chapters && story.chapters.length > 0) {
      const chapter = story.chapters[currentChapterIndex];
      if (chapter && chapter.contents) {
        const langContent = chapter.contents[translationLanguage];
        if (langContent) rawHtml = langContent[translationLevel] || '';
      }
    } else if (story.contents) {
      const langContent = story.contents[translationLanguage];
      if (langContent) rawHtml = langContent[translationLevel] || '';
    }

    return dnaAligner(rawHtml);
  }, [story, translationLanguage, translationLevel, currentChapterIndex, dnaAligner]);

  // Translation State
  const [selectedWord, setSelectedWord] = useState<{ word: string; rect: DOMRect; translation: string; isSelection?: boolean } | null>(null);
  const [isTranslating, setIsTranslating] = useState(false);
  const [translationLang, setTranslationLang] = useState<AppLanguage>(translationLanguage);
  const [showLangSelector, setShowLangSelector] = useState(false);

  // Update translation language if preference changes
  useEffect(() => {
    setTranslationLang(translationLanguage);
  }, [translationLanguage]);

  useEffect(() => {
    if (story && !user?.preferredLevel) {
      const contents = story.contents || {};
      const initialLevel = story.originalLevel || (Object.keys(contents)[0] as CEFRLevel) || 'A1';
      setCurrentLevel(initialLevel);
    }
  }, [story, user]);

  useEffect(() => {
    if (!story) navigate('/');
  }, [story, navigate]);

  const getTranslation = useCallback((id: string | null) => {
    if (!id || !shadowRef.current) return null;
    const element = shadowRef.current.querySelector(`[id="${id}"]`);
    return element ? element.textContent?.trim() : null;
  }, []);

  const handleTranslate = useCallback(async (word: string, rect: DOMRect, targetLang?: AppLanguage, isSelection?: boolean, ids?: string[]) => {
    // If it's a selection with specific IDs, use those
    if (ids && ids.length > 0) {
      const translations = ids.map(id => getTranslation(id)).filter(Boolean);
      if (translations.length > 0) {
        const translation = translations.join(' ');
        setSelectedWord({ word, rect, translation, isSelection: true });
      }
      return;
    }

    // Single click case or selection without specific IDs - don't show balloon if no translation
  }, [getTranslation]);

  const handleWordClick = useCallback((e: React.MouseEvent | React.TouchEvent, id: string | null, word: string) => {
    if (!id) return;
    
    const target = e.currentTarget as HTMLElement;
    const rect = target.getBoundingClientRect();
    
    // Logic for Single Word/Paragraph click
    const translation = getTranslation(id);
    
    if (translation) {
      e.preventDefault();
      e.stopPropagation();
      setSelectedWord({ word, rect, translation });
    }
  }, [getTranslation]);

  const handleMouseEnter = useCallback((group: string | null) => {
    if (!group) return;
    const elements = document.querySelectorAll(`[data-group="${group}"]`);
    elements.forEach(el => el.classList.add('bg-highlight'));
  }, []);

  const handleMouseLeave = useCallback(() => {
    const highlights = document.querySelectorAll('.bg-highlight');
    highlights.forEach(el => el.classList.remove('bg-highlight'));
  }, []);

  const triggerTranslation = async () => {
    // Disabled for DNA system as per user request
  };

  const handleLevelChange = (level: CEFRLevel) => {
    if (level === currentLevel) return;
    setCurrentLevel(level);
  };

  useEffect(() => {
    let timeout: NodeJS.Timeout;
    
    const onSelectionChange = () => {
      // Don't trigger popover while the user is actively dragging
      if (isSelecting.current) return;

      clearTimeout(timeout);
      timeout = setTimeout(() => {
        // Double check again after timeout
        if (isSelecting.current) return;

        const selection = window.getSelection();
        const text = selection?.toString().trim();
        
        if (text && text.length > 0 && !selection?.isCollapsed) {
          const range = selection?.getRangeAt(0);
          const rect = range?.getBoundingClientRect();
          
          // Check if selection is within the reader content
          const readerContent = document.querySelector('.rich-text-content');
          if (readerContent && selection?.anchorNode && readerContent.contains(selection.anchorNode)) {
            if (rect && rect.width > 0) {
              // Extract all elements with [id] tags from selection
              const fragment = range.cloneContents();
              const idElements = fragment.querySelectorAll('[id]');
              const ids = Array.from(idElements).map(el => el.getAttribute('id')).filter((id): id is string => !!id);
              
              handleTranslate(text, rect, undefined, true, ids);
            }
          }
        }
      }, 300); // Debounce to allow selection to finish
    };

    document.addEventListener('selectionchange', onSelectionChange);
    return () => {
      document.removeEventListener('selectionchange', onSelectionChange);
      clearTimeout(timeout);
    };
  }, [handleTranslate]);

  useEffect(() => {
    const el = contentRef.current;
    if (!el) return;

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length > 1) return;
      const touch = e.touches[0];
      touchStartPos.current = { x: touch.clientX, y: touch.clientY };
      
      if (longPressTimer.current) clearTimeout(longPressTimer.current);
      
      longPressTimer.current = setTimeout(() => {
        const range = (document as any).caretRangeFromPoint?.(touch.clientX, touch.clientY);
        if (range) {
          isSelecting.current = true;
          selectionStartRange.current = { node: range.startContainer, offset: range.startOffset };
          
          if (window.navigator.vibrate) window.navigator.vibrate(40);
          
          const sel = window.getSelection();
          sel?.removeAllRanges();
          sel?.addRange(range);
        }
      }, 400); // Reduced to 400ms for better human responsiveness
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isSelecting.current) {
        if (touchStartPos.current) {
          const touch = e.touches[0];
          const dist = Math.hypot(touch.clientX - touchStartPos.current.x, touch.clientY - touchStartPos.current.y);
          if (dist > 10) {
            if (longPressTimer.current) {
              clearTimeout(longPressTimer.current);
              longPressTimer.current = null;
            }
          }
        }
        return;
      }

      // CRITICAL: Prevent default to block scroll and standard selection
      if (e.cancelable) e.preventDefault();
      
      // Temporarily disable user-select to prevent browser interference
      document.body.style.userSelect = 'none';
      document.body.style.webkitUserSelect = 'none';

      const touch = e.touches[0];
      
      requestAnimationFrame(() => {
        const range = (document as any).caretRangeFromPoint?.(touch.clientX, touch.clientY);
        const sel = window.getSelection();
        
        if (range && sel && selectionStartRange.current) {
          try {
            sel.setBaseAndExtent(
              selectionStartRange.current.node,
              selectionStartRange.current.offset,
              range.startContainer,
              range.startOffset
            );
          } catch (err) {
            const newRange = document.createRange();
            newRange.setStart(selectionStartRange.current.node, selectionStartRange.current.offset);
            newRange.setEnd(range.startContainer, range.startOffset);
            sel.removeAllRanges();
            sel.addRange(newRange);
          }
        }
      });
    };

    const handleTouchEnd = () => {
      if (longPressTimer.current) {
        clearTimeout(longPressTimer.current);
        longPressTimer.current = null;
      }
      isSelecting.current = false;
      touchStartPos.current = null;
      selectionStartRange.current = null;
      
      // Restore user-select
      document.body.style.userSelect = '';
      document.body.style.webkitUserSelect = '';
    };

    el.addEventListener('touchstart', handleTouchStart, { passive: false });
    el.addEventListener('touchmove', handleTouchMove, { passive: false });
    el.addEventListener('touchend', handleTouchEnd);
    el.addEventListener('touchcancel', handleTouchEnd);

    return () => {
      el.removeEventListener('touchstart', handleTouchStart);
      el.removeEventListener('touchmove', handleTouchMove);
      el.removeEventListener('touchend', handleTouchEnd);
      el.removeEventListener('touchcancel', handleTouchEnd);
    };
  }, []);

  const parseOptions: HTMLReactParserOptions = {
    replace: (domNode) => {
      // Handle any element with an 'id' attribute for the word-by-word system
      if (domNode instanceof Element && domNode.attribs.id) {
        const id = domNode.attribs.id;
        const group = domNode.attribs['data-group'];
        
        // Use child nodes if available, otherwise data direct
        const getTextContent = (node: Element): string => {
          return node.children.map(child => {
            if (child.type === 'text') return (child as Text).data;
            if (child.type === 'tag') return getTextContent(child as Element);
            return '';
          }).join('');
        };

        const wordText = getTextContent(domNode);
        
        return (
          <span
            id={id}
            data-group={group}
            className={id.startsWith('dna-blk-') ? 'dna-block' : 'w-word'}
            onClick={(e) => handleWordClick(e, id, wordText)}
            onMouseEnter={() => handleMouseEnter(group)}
            onMouseLeave={() => handleMouseLeave()}
          >
            {domToReact(domNode.children as any, parseOptions)}
          </span>
        );
      }

      // Handle our custom highlight tag
      if (domNode instanceof Element && domNode.name === 'highlight') {
        const count = parseInt(domNode.attribs['data-count'] || '0');
        return (
          <span className="relative inline border-b-2 border-blue-400/30 bg-blue-400/5 cursor-help transition-colors hover:bg-blue-400/10">
            {domToReact(domNode.children as any, parseOptions)}
          </span>
        );
      }

      // Return plain text for text nodes to avoid component overhead and selection conflicts
      if ((domNode as any).type === 'text') {
        return (domNode as any).data;
      }
    }
  };

  const handleSaveToDeck = () => {
    if (selectedWord) {
      const translation = selectedWord.translation || '...';
      addCard(selectedWord.word, translation, `Context from: ${story?.title}`);
      
      // Trigger flying animation
      setShowFlyIcon({ x: selectedWord.rect.left, y: selectedWord.rect.top });
      setTimeout(() => setShowFlyIcon(null), 1000);
      
      setSelectedWord(null);
    }
  };

  const handleSaveQuote = async () => {
    if (selectedWord) {
      addQuote(
        selectedWord.word, 
        selectedWord.translation || '', 
        translationLang, 
        story?.title || 'Unknown', 
        story?.id || '',
        story?.quoteBackgroundImage
      );
      setSelectedWord(null);
    }
  };

  if (!story) return null;

  return (
    <div className="min-h-screen flex flex-col bg-[var(--background)] transition-colors duration-300">
      <Header />
      {/* Flying Icon Animation */}
      <AnimatePresence>
        {showFlyIcon && (
          <motion.div
            initial={{ x: showFlyIcon.x, y: showFlyIcon.y, scale: 1, opacity: 1 }}
            animate={{ 
              x: window.innerWidth - 60, 
              y: 20, 
              scale: 0.5, 
              opacity: 0 
            }}
            transition={{ duration: 0.8, ease: "easeInOut" }}
            className="fixed z-[100] pointer-events-none text-blue-600"
          >
            <Plus size={32} strokeWidth={3} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Title Section */}
      <div className="max-w-3xl mx-auto w-full px-6 pt-4 pb-4">
        <div className="flex flex-col items-center mb-2">
          {user?.role === 'admin' && (
            <div className="w-full flex justify-end mb-4">
              <button
                onClick={() => navigate(`/submit?edit=${story.id}`)}
                className="p-3 bg-blue-600 text-white rounded-2xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/20 flex items-center gap-2 shrink-0"
                title="Editar Postagem"
              >
                <Edit3 size={20} />
                <span className="hidden sm:inline font-bold">Editar</span>
              </button>
            </div>
          )}
          <h1 className="text-5xl md:text-6xl font-bold tracking-tighter text-current mb-2 text-center">
            {localizedTitle}
          </h1>
          {localizedSubtitle && (
            <p className="text-2xl font-medium opacity-80 tracking-tight text-center">
              {localizedSubtitle}
            </p>
          )}
          <p className="text-xl font-serif italic opacity-60 mt-2 text-center">by {story.author}</p>
        </div>
      </div>

      {/* Reader Controls */}
      <div className="sticky top-0 md:relative landscape:relative z-20 bg-[var(--background)] border-b border-[var(--border)]">
        <div className="max-w-3xl mx-auto px-6 py-3 flex flex-col gap-4 md:gap-0 landscape:gap-0">
          {/* Top Row: Selector and Font Size */}
          <div className="flex items-center justify-between w-full gap-4">
            <div className="relative">
              <button 
                onClick={() => setShowLevelSelector(!showLevelSelector)}
                className="flex items-center gap-2 px-4 py-2.5 bg-[var(--card-bg)] rounded-xl border border-[var(--border)] hover:bg-[var(--background)] transition-all shadow-sm"
              >
                <span className="text-sm font-bold uppercase tracking-wider">
                  {readerLanguage} • {currentLevel}
                </span>
                <ChevronDown size={16} className={`transition-transform duration-200 ${showLevelSelector ? 'rotate-180' : ''}`} />
              </button>

              <AnimatePresence>
                {showLevelSelector && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setShowLevelSelector(false)} />
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className="absolute top-full mt-2 left-0 w-64 bg-[var(--background)] border border-[var(--border)] rounded-2xl shadow-xl z-20 overflow-hidden"
                    >
                      <div className="p-4 space-y-4">
                        {/* Reading Selection */}
                        <div className="space-y-3">
                          <p className="text-[10px] font-black uppercase tracking-widest opacity-40 mb-2 px-1">Lendo Agora (Main)</p>
                          <div className="grid grid-cols-3 gap-1">
                            {(['PT', 'EN', 'ES', 'FR', 'DE', 'RU'] as AppLanguage[]).map(lang => (
                              <button
                                key={lang}
                                disabled={!story.contents[lang]}
                                onClick={() => { setReaderLanguage(lang); }}
                                className={`py-2 text-xs font-bold rounded-lg transition-all ${readerLanguage === lang ? 'bg-blue-600 text-white' : 'hover:bg-[var(--card-bg)] opacity-60 disabled:opacity-10'}`}
                              >
                                {lang}
                              </button>
                            ))}
                          </div>
                          <div className="grid grid-cols-5 gap-1">
                            {(['A1', 'A2', 'B1', 'B2', 'C1'] as CEFRLevel[]).map(level => (
                              <button
                                key={level}
                                disabled={!story.contents[readerLanguage]?.[level]}
                                onClick={() => { handleLevelChange(level); }}
                                className={`py-2 text-[10px] font-black rounded-lg transition-all ${currentLevel === level ? 'bg-blue-600 text-white' : 'hover:bg-[var(--card-bg)] opacity-60 disabled:opacity-10'}`}
                              >
                                {level}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Translation Selection */}
                        <div className="pt-4 border-t border-[var(--border)] space-y-3">
                          <p className="text-[10px] font-black uppercase tracking-widest opacity-40 mb-2 px-1">Traduzir para (Shadow)</p>
                          <div className="grid grid-cols-3 gap-1">
                            {(['PT', 'EN', 'ES', 'FR', 'DE', 'RU'] as AppLanguage[]).map(lang => (
                              <button
                                key={lang}
                                disabled={!story.contents[lang]}
                                onClick={() => { setTranslationLanguage(lang); }}
                                className={`py-2 text-xs font-bold rounded-lg transition-all ${translationLanguage === lang ? 'bg-green-600 text-white' : 'hover:bg-[var(--card-bg)] opacity-60 disabled:opacity-10'}`}
                              >
                                {lang}
                              </button>
                            ))}
                          </div>
                          <div className="grid grid-cols-5 gap-1">
                            {(['A1', 'A2', 'B1', 'B2', 'C1'] as CEFRLevel[]).map(level => (
                              <button
                                key={level}
                                disabled={!story.contents[translationLanguage]?.[level]}
                                onClick={() => { setTranslationLevel(level); }}
                                className={`py-2 text-[10px] font-black rounded-lg transition-all ${translationLevel === level ? 'bg-green-600 text-white' : 'hover:bg-[var(--card-bg)] opacity-60 disabled:opacity-10'}`}
                              >
                                {level}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>

            {/* Desktop/Tablet/Landscape Audio Player (Centered) */}
            {currentAudioUrl && (
              <div className="hidden md:block landscape:block flex-1 max-w-md mx-auto px-4">
                <CustomAudioPlayer src={currentAudioUrl} className="shadow-none border-white/10" />
              </div>
            )}

            <div className="flex items-center gap-1 bg-[var(--card-bg)] rounded-xl border border-[var(--border)] p-1">
              <button 
                onClick={() => {
                  const newSize = Math.max(12, fontSize - 2);
                  setFontSize(newSize);
                  if (user) updatePreferredFontSize(newSize);
                }}
                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[var(--background)] transition-colors"
                title="Diminuir fonte"
              >
                <Minus size={16} />
              </button>
              <div className="w-px h-4 bg-[var(--border)] mx-1" />
              <button 
                onClick={() => {
                  const newSize = Math.min(48, fontSize + 2);
                  setFontSize(newSize);
                  if (user) updatePreferredFontSize(newSize);
                }}
                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[var(--background)] transition-colors"
                title="Aumentar fonte"
              >
                <Plus size={16} />
              </button>
            </div>
          </div>

          {/* Mobile Portrait Audio Player (Below) */}
          {currentAudioUrl && (
            <div className="md:hidden landscape:hidden w-full">
              <CustomAudioPlayer src={currentAudioUrl} className="shadow-none border-white/10" />
            </div>
          )}
        </div>
      </div>

      {/* Reader Content */}
      <main className="flex-1 relative max-w-3xl mx-auto w-full px-6 pt-4 pb-16">
        {/* Shadow Translation Container */}
        <div 
          ref={shadowRef} 
          className="hidden" 
          aria-hidden="true" 
          dangerouslySetInnerHTML={{ __html: translationContent }} 
        />
        
        {/* Navigation Arrows (Floating) */}
        <div className="fixed inset-y-0 left-0 right-0 pointer-events-none z-50">
          <div className="max-w-[1400px] mx-auto h-full flex items-center justify-between px-4 md:px-8">
            {prevStory ? (
              <button
                onClick={() => { navigate(`/read/${prevStory.id}`); }}
                className="pointer-events-auto p-2 text-white drop-shadow-[0_4px_12px_rgba(0,0,0,0.5)] hover:scale-125 transition-all opacity-60 hover:opacity-100"
                title={prevStory.title}
              >
                <ChevronLeft size={64} strokeWidth={2.5} />
              </button>
            ) : <div />}

            {nextStory ? (
              <button
                onClick={() => { navigate(`/read/${nextStory.id}`); }}
                className="pointer-events-auto p-2 text-white drop-shadow-[0_4px_12px_rgba(0,0,0,0.5)] hover:scale-125 transition-all opacity-60 hover:opacity-100"
                title={nextStory.title}
              >
                <ChevronRight size={64} strokeWidth={2.5} />
              </button>
            ) : <div />}
          </div>
        </div>

        <div 
          ref={contentRef}
          style={{ 
            fontSize: `${fontSize}px`,
            WebkitTouchCallout: 'none',
            userSelect: 'text',
            WebkitUserSelect: 'text'
          }}
          className={`
            relative leading-[1.8] font-serif transition-all duration-500
            rich-text-content prose max-w-none
          `}
        >
          {parse(processedContent, parseOptions)}
        </div>

        {/* Chapter Navigation */}
        {story.chapters && story.chapters.length > 1 && (
          <div className="mt-24 pt-12 border-t border-[var(--border)] flex flex-col items-center gap-8">
            <div className="flex items-center gap-6">
              <button
                disabled={currentChapterIndex === 0}
                onClick={() => {
                  setCurrentChapterIndex(prev => prev - 1);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="p-4 rounded-full border border-[var(--border)] hover:bg-[var(--card-bg)] transition-all disabled:opacity-20 disabled:cursor-not-allowed group"
              >
                <ChevronLeft size={32} className="group-hover:-translate-x-1 transition-transform" />
              </button>

              <div className="flex flex-col items-center">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40 mb-1">Capítulo</span>
                <span className="text-2xl font-bold">{currentChapterIndex + 1} / {story.chapters.length}</span>
              </div>

              <button
                disabled={currentChapterIndex === story.chapters.length - 1}
                onClick={() => {
                  setCurrentChapterIndex(prev => prev + 1);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="p-4 rounded-full border border-[var(--border)] hover:bg-[var(--card-bg)] transition-all disabled:opacity-20 disabled:cursor-not-allowed group"
              >
                <ChevronRight size={32} className="group-hover:translate-x-1 transition-transform" />
              </button>
            </div>

            <div className="flex flex-wrap justify-center gap-2 max-w-xl">
              {story.chapters.map((ch, idx) => (
                <button
                  key={ch.id}
                  onClick={() => {
                    setCurrentChapterIndex(idx);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className={`
                    px-4 py-2 rounded-xl text-xs font-bold transition-all
                    ${currentChapterIndex === idx 
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' 
                      : 'bg-[var(--card-bg)] border border-[var(--border)] opacity-60 hover:opacity-100'}
                  `}
                >
                  {idx + 1}. {ch.title}
                </button>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Translation Popover */}
      <AnimatePresence>
        {selectedWord && (
          <>
            <div 
              className="fixed inset-0 z-40" 
              onClick={() => { setSelectedWord(null); setShowLangSelector(false); }} 
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 10 }}
              style={{
                position: 'fixed',
                top: Math.max(10, selectedWord.rect.top - 180),
                left: Math.max(10, Math.min(window.innerWidth - 230, selectedWord.rect.left - 80)),
                zIndex: 50
              }}
              className="w-56 bg-[var(--background)] border border-[var(--border)] rounded-2xl shadow-2xl overflow-hidden"
            >
              <div className="p-4">
                <div className="flex justify-between items-center mb-3">
                  <p className="font-bold text-lg truncate flex-1 mr-2">{selectedWord.word}</p>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {selectedWord.isSelection && (
                      <button 
                        onClick={triggerTranslation}
                        disabled={true}
                        className="p-1.5 rounded-lg opacity-20 cursor-not-allowed text-blue-600"
                        title={t('reader.translate')}
                      >
                        <Globe size={18} />
                      </button>
                    )}

                    <button 
                      onClick={handleSaveToDeck}
                      disabled={isTranslating}
                      className="p-1.5 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors text-blue-600"
                      title={t('reader.addReview')}
                    >
                      <Plus size={18} />
                    </button>

                    {selectedWord.isSelection && (
                      <button 
                        onClick={handleSaveQuote}
                        className="p-1.5 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors text-blue-600"
                        title={t('reader.saveQuote')}
                      >
                        <BookOpen size={18} />
                      </button>
                    )}

                    {!selectedWord.isSelection && (
                      <button
                        onClick={() => {
                          const u = new SpeechSynthesisUtterance(selectedWord.word);
                          u.lang = 'en-US';
                          window.speechSynthesis.speak(u);
                        }}
                        className="p-1.5 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors text-blue-500"
                        title={t('reader.speak')}
                      >
                        <Volume2 size={18} />
                      </button>
                    )}
                  </div>
                </div>
                
                <div className="h-px bg-gray-100 dark:bg-gray-800 mb-3" />
                
                {selectedWord.isSelection ? (
                  <div className="space-y-2">
                    {selectedWord.translation && (
                      <div className="mt-1 pt-3 border-t border-[var(--border)]">
                        <p className="text-blue-600 dark:text-blue-400 font-medium text-sm leading-relaxed">{selectedWord.translation}</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <>
                    <div className="flex justify-between items-start mb-1">
                      <span className="text-xs font-bold uppercase tracking-widest opacity-40">
                        {translationLang}
                      </span>
                    </div>
                    
                    <p className="text-blue-600 dark:text-blue-400 font-medium leading-relaxed">{selectedWord.translation}</p>
                  </>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};
