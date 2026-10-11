/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, Plus, Volume2, Loader2, Globe, ChevronLeft, ChevronRight, BookOpen, Edit3, Dna, X } from 'lucide-react';
import parse, { domToReact, HTMLReactParserOptions, Element, Text } from 'html-react-parser';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import { Header } from './components/Header';
import { CustomAudioPlayer } from './components/CustomAudioPlayer';
import { useStories } from './contexts/StoryContext';
import { useTheme } from './contexts/ThemeContext';
import { useDeck } from './contexts/DeckContext';
import { useQuotes } from './contexts/QuoteContext';
import { useAuth } from './contexts/AuthContext';
import { CEFRLevel, AppLanguage } from './types';
import { translateWordWithAI, generateSpeechWithAI } from './services/geminiService';

// Context for DNA highlight state to prevent full re-parses
const DnaContext = React.createContext<{
  hoveredDnaId: string | null;
  selectedDnaId: string | null;
  setHoveredDnaId: (id: string | null) => void;
  onDnaClick: (e: React.MouseEvent, dnaId: string) => void;
}>({
  hoveredDnaId: null,
  selectedDnaId: null,
  setHoveredDnaId: () => {},
  onDnaClick: () => {},
});

const DnaSpan: React.FC<{ 
  dnaId: string; 
  children: React.ReactNode; 
  nodeKey: string | number;
}> = ({ dnaId, children, nodeKey }) => {
  const { hoveredDnaId, selectedDnaId, setHoveredDnaId, onDnaClick } = React.useContext(DnaContext);
  const isHovered = hoveredDnaId === dnaId;
  const isSelected = selectedDnaId === dnaId;

  return (
    <span 
      data-dna-id={dnaId}
      className={`
        transition-colors duration-200 cursor-pointer rounded-sm inline
        ${isHovered ? 'bg-blue-500/20 shadow-[0_0_10px_rgba(59,130,246,0.1)]' : ''}
        ${isSelected ? 'bg-blue-500/30 ring-1 ring-blue-500/50' : ''}
      `}
      onMouseEnter={() => setHoveredDnaId(dnaId)}
      onMouseLeave={() => setHoveredDnaId(null)}
      onClick={(e) => onDnaClick(e, dnaId)}
    >
      {children}
    </span>
  );
};

export const Reader: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t, language, translationLanguage, fontSize, setFontSize, voiceGender, setVoiceGender } = useTheme();
  const { addCard } = useDeck();
  const { addQuote } = useQuotes();
  const { getStory, stories } = useStories();
  const { user, updatePreferredFontSize } = useAuth();
  const story = useMemo(() => getStory(id || ''), [id, getStory]);
  
  const contentRef = useRef<HTMLDivElement>(null);
  const touchStartPos = useRef<{ x: number, y: number } | null>(null);
  const isInteracting = useRef(false);
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
  const [isAdapting, setIsAdapting] = useState(false);
  const [showFlyIcon, setShowFlyIcon] = useState<{ x: number; y: number } | null>(null);
  const [hoveredDnaId, setHoveredDnaId] = useState<string | null>(null);

  // Sync font size from user profile if available
  useEffect(() => {
    if (user?.preferredFontSize) {
      setFontSize(user.preferredFontSize);
    }
  }, [user?.preferredFontSize]);

  const currentContent = useMemo(() => {
    if (!story) return '';
    
    // If story has chapters, use the current chapter's content
    if (story.chapters && story.chapters.length > 0) {
      const chapter = story.chapters[currentChapterIndex];
      if (!chapter || !chapter.contents) return '';
      const langContent = chapter.contents[readerLanguage];
      if (!langContent) return '';
      return langContent[currentLevel] || '';
    }

    // Fallback for old stories
    if (!story.contents) return '';
    const langContent = story.contents[readerLanguage];
    if (!langContent) return '';
    return langContent[currentLevel] || '';
  }, [story, currentLevel, readerLanguage, currentChapterIndex]);

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
    const langAudio = source.audio[readerLanguage];
    if (!langAudio) return null;
    const levelAudio = langAudio[currentLevel];
    if (!levelAudio) return null;

    // Preference: current voiceGender
    if (levelAudio[voiceGender]?.trim()) return levelAudio[voiceGender].trim();
    // Fallback: the other gender if available
    const otherGender = voiceGender === 'male' ? 'female' : 'male';
    if (levelAudio[otherGender]?.trim()) return levelAudio[otherGender].trim();
    
    return null;
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
    
    // 1. Community Highlights
    if (story?.communityHighlights) {
      const sortedHighlights = [...story.communityHighlights].sort((a, b) => b.text.length - a.text.length);
      sortedHighlights.forEach(highlight => {
        const escapedText = highlight.text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const regex = new RegExp(`(${escapedText})`, 'gi');
        content = content.replace(regex, `<highlight data-count="${highlight.count}">$1</highlight>`);
      });
    }

    return content;
  }, [currentContent, story?.communityHighlights]);
  
  // Translation State
  const [selectedWord, setSelectedWord] = useState<{ 
    word: string; 
    rect: DOMRect; 
    translation: string; 
    isSelection?: boolean;
    dnaId?: string | null;
    dnaIds?: string[];
    absTop?: number;
    absLeft?: number;
  } | null>(null);
  const [isTranslating, setIsTranslating] = useState(false);
  const [popoverTranslationLang, setPopoverTranslationLang] = useState<AppLanguage | null>(null);
  const [translationLang, setTranslationLang] = useState<AppLanguage>(translationLanguage);

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

  const triggerTranslation = async () => {
    if (!selectedWord) return;
    setIsTranslating(true);
    try {
      const translation = await translateWordWithAI(selectedWord.word, translationLang);
      setSelectedWord(prev => prev ? { ...prev, translation } : null);
    } catch (error) {
      console.error("Translation error:", error);
    } finally {
      setIsTranslating(false);
    }
  };

  const handleLevelChange = (level: CEFRLevel) => {
    if (level === currentLevel) return;
    setCurrentLevel(level);
  };

  // Character limits for selection
  useEffect(() => {
    const handleSelectionChange = () => {
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0) {
        const text = selection.toString();
        const nonSpaceLength = text.replace(/\s/g, '').length;
        if (nonSpaceLength > 250) {
          // Forcefully limit selection to 250 characters (excluding spaces)
          selection.collapseToEnd();
        }
      }
    };

    document.addEventListener('selectionchange', handleSelectionChange);
    return () => document.removeEventListener('selectionchange', handleSelectionChange);
  }, []);

  // Function to extract text by DNA ID from content
  const getTranslationForDnaId = useCallback((dnaId: string, level: CEFRLevel, overrideLang?: AppLanguage) => {
    if (!story) return null;
    
    const languages: AppLanguage[] = ['EN', 'ES', 'FR', 'DE', 'RU', 'PT'];
    
    // If overrideLang is provided, only try that one
    // Otherwise, prioritize translationLanguage then other languages
    const searchLangs = overrideLang 
      ? [overrideLang] 
      : [translationLanguage, ...languages.filter(l => l !== readerLanguage && l !== translationLanguage)];
    
    for (const lang of searchLangs) {
      let content = '';
      if (story.chapters && story.chapters.length > 0) {
        const chapter = story.chapters[currentChapterIndex];
        content = chapter?.contents[lang]?.[level] || '';
      } else {
        content = story.contents[lang]?.[level] || '';
      }

      if (content) {
        const parser = new DOMParser();
        const doc = parser.parseFromString(content, 'text/html');
        const elements = doc.querySelectorAll(`span[data-dna-id="${dnaId}"]`);
        if (elements.length > 0) {
          const fullText = Array.from(elements).map(el => el.innerHTML || '').join('');
          const parentBlock = elements[0].closest('p, h1, h2, h3, h4, h5, h6, div, li');
          return { 
            text: fullText, 
            lang,
            blockIndex: Array.from(doc.querySelectorAll('p, h1, h2, h3, h4, h5, h6, div, li')).indexOf(parentBlock!)
          };
        }
      }
    }

    return null;
  }, [story, currentChapterIndex, readerLanguage]);

  useEffect(() => {
    // Selection listeners enabled via contentRef in another useEffect
  }, []);

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

    const handleTouchEnd = (e: TouchEvent) => {
      if (longPressTimer.current) {
        clearTimeout(longPressTimer.current);
        longPressTimer.current = null;
      }
      
      // Delay slightly to let the browser finalize the selection
      setTimeout(() => {
        const sel = window.getSelection();
        if (sel && !sel.isCollapsed) {
          const text = sel.toString().trim();
          if (text) {
            const range = sel.getRangeAt(0);
            const rects = range.getClientRects();
            // Use the main bounding rect for consistent positioning near the selection
            const rect = range.getBoundingClientRect();

            // Collect translations for all DNA-mapped segments within the selection
            const resList: ({ text: string, blockIndex: number } | null)[] = [];
            const seenIds = new Set<string>();

            const addId = (id: string | null | undefined) => {
              if (id && !seenIds.has(id)) {
                seenIds.add(id);
                const res = getTranslationForDnaId(id, currentLevel);
                resList.push(res as any);
              }
            };

            // 1. Check start boundary
            let startNode = range.startContainer;
            if (startNode.nodeType === 3) startNode = startNode.parentNode!;
            addId((startNode as HTMLElement).closest?.('span[data-dna-id]')?.getAttribute('data-dna-id'));

            // 2. Check inner spans
            const fragment = range.cloneContents();
            const tempDiv = document.createElement('div');
            tempDiv.appendChild(fragment);
            tempDiv.querySelectorAll('[data-dna-id]').forEach(el => {
              addId(el.getAttribute('data-dna-id'));
            });

            // 3. Check end boundary
            let endNode = range.endContainer;
            if (endNode.nodeType === 3) endNode = endNode.parentNode!;
            addId((endNode as HTMLElement).closest?.('span[data-dna-id]')?.getAttribute('data-dna-id'));

            let joinedTranslation = '';
            resList.forEach((res, i) => {
              if (!res) return;
              if (i > 0) {
                const prev = resList.slice(0, i).reverse().find(r => r !== null);
                if (prev && (prev as any).blockIndex !== (res as any).blockIndex) {
                  joinedTranslation += '<br/>';
                } else {
                  joinedTranslation += ' ';
                }
              }
              joinedTranslation += res.text;
            });

            const primaryLangId = seenIds.size > 0 ? Array.from(seenIds)[0] : null;

            setPopoverTranslationLang(translationLanguage);
            setSelectedWord({
              word: text,
              rect: rect as DOMRect,
              translation: joinedTranslation,
              isSelection: true,
              dnaId: seenIds.size === 1 ? primaryLangId : null,
              dnaIds: Array.from(seenIds),
              absTop: rect.top + window.scrollY,
              absLeft: rect.left + rect.width / 2
            });
          }
        }
      }, 100);

      isSelecting.current = false;
      touchStartPos.current = null;
      selectionStartRange.current = null;
      
      // Restore user-select
      document.body.style.userSelect = '';
      document.body.style.webkitUserSelect = '';
    };

    const handleMouseDown = () => {
      isInteracting.current = true;
    };

    const handleMouseUp = (e: MouseEvent) => {
      isInteracting.current = false;
      // Delay slightly to let the browser finalize the selection
      setTimeout(() => {
        const sel = window.getSelection();
        if (sel && !sel.isCollapsed) {
          const text = sel.toString().trim();
          if (text) {
            // Find if selection is within the contentRef
            const range = sel.getRangeAt(0);
            if (!el.contains(range.commonAncestorContainer)) return;

            const rects = range.getClientRects();
            // Use the main bounding rect for consistent positioning near the selection
            const rect = range.getBoundingClientRect();

            // Collect translations for all DNA-mapped segments within the selection
            const resList: ({ text: string, blockIndex: number } | null)[] = [];
            const seenIds = new Set<string>();

            const addId = (id: string | null | undefined) => {
              if (id && !seenIds.has(id)) {
                seenIds.add(id);
                const res = getTranslationForDnaId(id, currentLevel);
                resList.push(res as any);
              }
            };

            // 1. Check start boundary
            let startNode = range.startContainer;
            if (startNode.nodeType === 3) startNode = startNode.parentNode!;
            addId((startNode as HTMLElement).closest?.('span[data-dna-id]')?.getAttribute('data-dna-id'));

            // 2. Check inner spans
            const fragment = range.cloneContents();
            const tempDiv = document.createElement('div');
            tempDiv.appendChild(fragment);
            tempDiv.querySelectorAll('[data-dna-id]').forEach(el => {
              addId(el.getAttribute('data-dna-id'));
            });

            // 3. Check end boundary
            let endNode = range.endContainer;
            if (endNode.nodeType === 3) endNode = endNode.parentNode!;
            addId((endNode as HTMLElement).closest?.('span[data-dna-id]')?.getAttribute('data-dna-id'));

            let joinedTranslation = '';
            resList.forEach((res, i) => {
              if (!res) return;
              if (i > 0) {
                const prev = resList.slice(0, i).reverse().find(r => r !== null);
                if (prev && (prev as any).blockIndex !== (res as any).blockIndex) {
                  joinedTranslation += '<br/>';
                } else {
                  joinedTranslation += ' ';
                }
              }
              joinedTranslation += res.text;
            });

            const primaryLangId = seenIds.size > 0 ? Array.from(seenIds)[0] : null;

            setPopoverTranslationLang(translationLanguage);
            setSelectedWord({
              word: text,
              rect: rect as DOMRect,
              translation: joinedTranslation,
              isSelection: true,
              dnaId: seenIds.size === 1 ? primaryLangId : null,
              dnaIds: Array.from(seenIds),
              absTop: rect.top + window.scrollY,
              absLeft: rect.left + rect.width / 2
            });
          }
        }
      }, 50);
    };

    el.addEventListener('touchstart', handleTouchStart, { passive: false });
    el.addEventListener('touchmove', handleTouchMove, { passive: false });
    el.addEventListener('touchend', handleTouchEnd);
    el.addEventListener('touchcancel', handleTouchEnd);
    el.addEventListener('mousedown', handleMouseDown);
    el.addEventListener('mouseup', handleMouseUp);

    return () => {
      el.removeEventListener('touchstart', handleTouchStart);
      el.removeEventListener('touchmove', handleTouchMove);
      el.removeEventListener('touchend', handleTouchEnd);
      el.removeEventListener('touchcancel', handleTouchEnd);
      el.removeEventListener('mousedown', handleMouseDown);
      el.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  // 4. Stable Parser Options
  const handleDnaClick = useCallback((e: React.MouseEvent, dnaId: string) => {
    const sel = window.getSelection();
    if (sel && !sel.isCollapsed && sel.toString().trim().length > 0) {
      return;
    }

    e.preventDefault();
    e.stopPropagation();
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const parentContainer = (e.currentTarget as HTMLElement).closest('.prose, .markdown-body');
    let fullText = '';
    
    if (parentContainer) {
      const parts = parentContainer.querySelectorAll(`span[data-dna-id="${dnaId}"]`);
      fullText = Array.from(parts).map(p => (p as HTMLElement).innerText || p.textContent || '').join('');
    } else {
      fullText = (e.currentTarget as HTMLElement).innerText || (e.currentTarget as HTMLElement).textContent || '';
    }

    const result = getTranslationForDnaId(dnaId, currentLevel);
    
    setPopoverTranslationLang(translationLanguage);
    setSelectedWord({ 
      word: fullText, 
      rect, 
      translation: result?.text || '',
      isSelection: false,
      dnaId: dnaId,
      absTop: rect.top + window.scrollY,
      absLeft: rect.left + rect.width / 2
    });
  }, [getTranslationForDnaId, currentLevel]);

  const parseOptions: HTMLReactParserOptions = useMemo(() => ({
    withStartIndices: true,
    replace: (domNode) => {
      const nodeKey = (domNode as any).startIndex ?? Math.random();

      if (domNode.type === 'tag' && domNode.name === 'highlight') {
        return (
          <span key={`highlight-${nodeKey}`} className="relative inline border-b-2 border-blue-400/30 bg-blue-400/5 cursor-help transition-colors hover:bg-blue-400/10">
            {domToReact(domNode.children as any, parseOptions)}
          </span>
        );
      }

      if (domNode.type === 'tag' && domNode.attribs && domNode.attribs['data-dna-id']) {
        const dnaId = domNode.attribs['data-dna-id'];
        return (
          <DnaSpan 
            key={`${dnaId}-${nodeKey}`}
            dnaId={dnaId}
            nodeKey={nodeKey}
          >
            {domToReact(domNode.children as any, parseOptions)}
          </DnaSpan>
        );
      }

      if (domNode.type === 'tag' && (domNode.name === 'w' || domNode.name === 'word')) {
        return (
          <span key={`w-${nodeKey}`} className="inline">
            {domToReact(domNode.children as any, parseOptions)}
          </span>
        );
      }

      if ((domNode as any).type === 'text') {
        return (domNode as any).data;
      }
    }
  }), [handleDnaClick]); // Stable but needs handleDnaClick reference

  const renderedContent = useMemo(() => {
    return parse(processedContent, parseOptions);
  }, [processedContent, parseOptions]);

  const dnaContextValue = useMemo(() => ({
    hoveredDnaId,
    selectedDnaId: selectedWord && !selectedWord.isSelection ? selectedWord.dnaId || null : null,
    setHoveredDnaId,
    onDnaClick: handleDnaClick
  }), [hoveredDnaId, selectedWord, handleDnaClick]);

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

  const handleSaveQuote = () => {
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

  const availableLangs = story.contents ? (Object.keys(story.contents) as AppLanguage[]) : [];
  const availableLevels = story.contents[readerLanguage] ? (Object.keys(story.contents[readerLanguage]) as CEFRLevel[]) : [];

  return (
    <div className="min-h-screen relative flex flex-col bg-[var(--background)] transition-colors duration-300">
      <Header 
        readerControls={{
          readerLanguage,
          setReaderLanguage,
          currentLevel,
          setCurrentLevel: handleLevelChange,
          availableLangs,
          availableLevels,
          fontSize,
          setFontSize
        }}
      />
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
      <div className="max-w-3xl mx-auto w-full px-6 pt-[11px] pb-0">
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
        </div>
      </div>

      {/* Navigation & Audio Player Bar (Sticky) */}
      <div className="sticky top-0 z-40 bg-[var(--background)] shadow-sm py-2 transition-shadow">
        <div className="max-w-3xl mx-auto w-full px-4 flex items-center justify-between gap-2">
          {/* Previous Story Arrow */}
          <div className="w-10 flex justify-center">
            {prevStory && (
              <button
                onClick={() => { navigate(`/read/${prevStory.id}`); }}
                className="p-1 hover:bg-[var(--card-bg)] rounded-full transition-all text-current opacity-60 hover:opacity-100"
                title={prevStory.title}
              >
                <ChevronLeft size={32} />
              </button>
            )}
          </div>

          {/* Audio Player (Centered) */}
          <div className="flex-1 max-w-md mx-auto min-w-0">
            {currentAudioUrl ? (
              <CustomAudioPlayer src={currentAudioUrl} className="shadow-none scale-90 sm:scale-100 origin-center" />
            ) : (
              <div className="h-10 invisible" /> // Alignment placeholder
            )}
          </div>

          {/* Next Story Arrow */}
          <div className="w-10 flex justify-center">
            {nextStory && (
              <button
                onClick={() => { navigate(`/read/${nextStory.id}`); }}
                className="p-1 hover:bg-[var(--card-bg)] rounded-full transition-all text-current opacity-60 hover:opacity-100"
                title={nextStory.title}
              >
                <ChevronRight size={32} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Reader Content */}
      <main className="flex-1 relative max-w-3xl mx-auto w-full px-6 pt-4 pb-16">

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
            <DnaContext.Provider value={dnaContextValue}>
              {renderedContent}
            </DnaContext.Provider>
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
          </div>
        )}
      </main>

      {/* Translation Popover */}
      <AnimatePresence>
        {selectedWord && (
          <>
            <div 
              className="fixed inset-0 z-45" 
              onClick={() => { setSelectedWord(null); }} 
            />
              {(() => {
                return (
                  <motion.div
                    key="translation-popover"
                    initial={{ opacity: 0, scale: 0.95, y: "-95%", translateX: "-50%" }}
                    animate={{ opacity: 1, scale: 1, y: "-100%", translateX: "-50%" }}
                    exit={{ opacity: 0, scale: 0.95, y: "-95%", translateX: "-50%" }}
                    style={{
                      position: 'absolute',
                      top: Math.max(10, (selectedWord?.absTop || 0) - 12),
                      left: '50%',
                      zIndex: 50
                    }}
                    className="w-[calc(100%-2rem)] max-w-md bg-[var(--background)] border border-[var(--border)] rounded-2xl shadow-2xl overflow-hidden px-4 py-3"
                  >
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-0.5 overflow-x-auto no-scrollbar">
                  {(['EN', 'ES', 'FR', 'DE', 'RU', 'PT'] as AppLanguage[]).map(lang => {
                    const hasContent = !!story.contents[lang];
                    const isActive = (popoverTranslationLang || readerLanguage) === lang;
                    
                    return (
                      <button
                        key={lang}
                        disabled={!hasContent}
                        onClick={() => {
                          if (lang === popoverTranslationLang) return;
                          setPopoverTranslationLang(lang);
                          
                          if (selectedWord.dnaId) {
                             const res = getTranslationForDnaId(selectedWord.dnaId, currentLevel, lang);
                             if (res) {
                               setSelectedWord(prev => prev ? { ...prev, translation: res.text } : null);
                             }
                          } else if (selectedWord.dnaIds && selectedWord.dnaIds.length > 0) {
                             const resList = selectedWord.dnaIds
                               .map(id => getTranslationForDnaId(id, currentLevel, lang));
                             
                             let joinedTranslation = '';
                             resList.forEach((res, i) => {
                               if (!res) return;
                               if (i > 0) {
                                 const prev = resList.slice(0, i).reverse().find(r => r !== null);
                                 if (prev && (prev as any).blockIndex !== (res as any).blockIndex) {
                                   joinedTranslation += '<br/>';
                                 } else {
                                   joinedTranslation += ' ';
                                 }
                               }
                               joinedTranslation += res.text;
                             });

                             if (joinedTranslation) {
                               setSelectedWord(prev => prev ? { ...prev, translation: joinedTranslation } : null);
                             }
                          }
                        }}
                        className={`
                          px-2 py-1 rounded-lg text-xs font-bold transition-all
                          ${isActive 
                            ? "bg-blue-600 text-white shadow-md shadow-blue-500/20" 
                            : hasContent
                              ? "text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400"
                              : "opacity-20 cursor-not-allowed text-gray-400"}
                        `}
                      >
                        {lang}
                      </button>
                    );
                  })}
                </div>

                <div className="flex items-center gap-1.5 shrink-0 ml-2">
                  {selectedWord?.word && selectedWord.word.replace(/\s/g, '').length <= 100 && (
                    <button 
                      onClick={handleSaveToDeck}
                      disabled={isTranslating}
                      className="p-1.5 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors text-blue-600"
                      title={t('reader.addReview')}
                    >
                      <Plus size={18} />
                    </button>
                  )}

                  {selectedWord?.word && selectedWord.word.replace(/\s/g, '').length <= 250 && (
                    <button 
                      onClick={handleSaveQuote}
                      className="p-1.5 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors text-blue-600"
                      title={t('reader.saveQuote')}
                    >
                      <BookOpen size={18} />
                    </button>
                  )}
                  </div>
                </div>
                
                <div className="space-y-2 pr-1 max-h-[70vh] overflow-y-auto custom-scrollbar">
                  {isTranslating ? (
                    <div className="flex items-center gap-2 py-1">
                      <Loader2 size={14} className="animate-spin text-blue-500" />
                      <span className="text-sm opacity-50 italic">{t('reader.translating')}</span>
                    </div>
                  ) : selectedWord?.translation ? (
                    <div className="mt-1 text-blue-600 dark:text-blue-400 text-sm leading-relaxed max-w-none prose prose-sm dark:prose-invert prose-blue">
                      {parse(selectedWord.translation)}
                    </div>
                  ) : (
                     <p className="text-xs opacity-40 italic">Clique no globo para traduzir</p>
                  )}
                </div>
                  </motion.div>
                );
              })()}
            </>
          )}
        </AnimatePresence>
    </div>
  );
};
