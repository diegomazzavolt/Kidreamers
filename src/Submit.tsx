/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, Upload, X, BookOpen, Layers, Globe, ChevronDown, Plus } from 'lucide-react';
import { useStories } from './contexts/StoryContext';
import { useAuth } from './contexts/AuthContext';
import { RichTextEditor } from './components/RichTextEditor';
import { motion, AnimatePresence } from 'motion/react';
import { CEFRLevel, AppLanguage } from './types';

interface ChapterState {
  id: string;
  titles: Record<AppLanguage, string>;
  subtitles: Record<AppLanguage, string>;
  contents: Record<AppLanguage, Record<CEFRLevel, string>>;
  audio: Record<AppLanguage, Record<CEFRLevel, { male?: string; female?: string }>>;
  activeLangTab: AppLanguage;
  activeLevelTab: CEFRLevel;
  showSelector: boolean;
}

export const Submit: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { addStory, getStory, updateStory } = useStories();
  const { user } = useAuth();

  const editId = new URLSearchParams(location.search).get('edit');
  
  const languages: AppLanguage[] = ['EN', 'ES', 'FR', 'DE', 'RU', 'PT'];
  const levels: CEFRLevel[] = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];

  const createEmptyContents = () => {
    const initial: any = {};
    languages.forEach(lang => {
      initial[lang] = {
        A1: '', A2: '', B1: '', B2: '', C1: '', C2: ''
      };
    });
    return initial;
  };

  const createEmptyLocalized = () => {
    const initial: any = {};
    languages.forEach(lang => {
      initial[lang] = '';
    });
    return initial;
  };

  const createEmptyAudio = () => {
    const initial: any = {};
    languages.forEach(lang => {
      initial[lang] = {
        A1: {}, A2: {}, B1: {}, B2: {}, C1: {}, C2: {}
      };
    });
    return initial;
  };

  const createNewChapter = (id?: string): ChapterState => ({
    id: id || Math.random().toString(36).substring(2, 11),
    titles: createEmptyLocalized(),
    subtitles: createEmptyLocalized(),
    contents: createEmptyContents(),
    audio: createEmptyAudio(),
    activeLangTab: 'EN',
    activeLevelTab: 'A1',
    showSelector: false
  });

  const [chapters, setChapters] = useState<ChapterState[]>([createNewChapter()]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [globalImageGallery, setGlobalImageGallery] = useState<string[]>([]);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [quoteBackgroundImage, setQuoteBackgroundImage] = useState<string | null>(null);
  const [dnaMappingId, setDnaMappingId] = useState<string | null>(null);
  const imageContainerRefs = useRef<(HTMLDivElement | null)[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64 = event.target?.result as string;
      const compressed = await compressImage(base64);
      setGlobalImageGallery(prev => {
        if (!prev.includes(compressed)) {
          return [compressed, ...prev];
        }
        return prev;
      });
    };
    reader.readAsDataURL(file);
  };

  // Function to extract image URLs from HTML content
  const extractImagesFromHTML = (html: string) => {
    const urls: string[] = [];
    const imgRegex = /<img[^>]+src="([^">]+)"/g;
    let match;
    while ((match = imgRegex.exec(html)) !== null) {
      if (match[1] && !urls.includes(match[1])) {
        urls.push(match[1]);
      }
    }
    return urls;
  };

  useEffect(() => {
    if (editId) {
      const story = getStory(editId);
      if (story) {
        // Collect all images from all chapters, languages, and levels
        const allImages = new Set<string>();
        
        story.chapters?.forEach(ch => {
          Object.values(ch.contents || {}).forEach(langContent => {
            Object.values(langContent || {}).forEach(content => {
              if (typeof content === 'string') {
                extractImagesFromHTML(content).forEach(url => allImages.add(url));
              }
            });
          });
        });

        if (story.profileImage) {
          allImages.add(story.profileImage);
          setProfileImage(story.profileImage);
        }

        if (story.quoteBackgroundImage) {
          allImages.add(story.quoteBackgroundImage);
          setQuoteBackgroundImage(story.quoteBackgroundImage);
        }

        setGlobalImageGallery(Array.from(allImages));

        if (story.chapters && story.chapters.length > 0) {
          setChapters(story.chapters.map(ch => ({
            id: ch.id,
            titles: { 
              ...createEmptyLocalized(), 
              ...ch.titles,
              ...(!ch.titles && ch.title ? { [story.language || 'EN']: ch.title } : {})
            },
            subtitles: { 
              ...createEmptyLocalized(), 
              ...ch.subtitles,
              ...(!ch.subtitles && ch.subtitle ? { [story.language || 'EN']: ch.subtitle } : {})
            },
            contents: {
              ...createEmptyContents(),
              ...ch.contents
            } as any,
            audio: {
              ...createEmptyAudio(),
              ...ch.audio
            } as any,
            activeLangTab: 'EN',
            activeLevelTab: 'A1',
            showSelector: false
          })));
        } else {
          // Fallback for old stories without chapters
          setChapters([{
            id: 'main',
            titles: { 
              ...createEmptyLocalized(), 
              ...story.titles,
              ...(!story.titles && story.title ? { [story.language || 'EN']: story.title } : {})
            },
            subtitles: { 
              ...createEmptyLocalized(), 
              ...story.subtitles,
              ...(!story.subtitles && story.subtitle ? { [story.language || 'EN']: story.subtitle } : {})
            },
            contents: {
              ...createEmptyContents(),
              ...story.contents
            } as any,
            audio: {
              ...createEmptyAudio(),
              ...story.audio
            } as any,
            activeLangTab: 'EN',
            activeLevelTab: 'A1',
            showSelector: false
          }]);
        }
      }
    }
  }, [editId, getStory]);

  // Security check: Only admin can publish
  if (user?.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 text-center bg-white text-black">
        <div className="max-w-md space-y-4">
          <h1 className="text-2xl font-bold">Acesso Restrito</h1>
          <p className="opacity-60 text-sm">Apenas administradores podem publicar novos conteúdos.</p>
          <button onClick={() => navigate('/')} className="px-6 py-2 bg-blue-600 text-white rounded-xl font-bold">Voltar para Home</button>
        </div>
      </div>
    );
  }

  const compressImage = (base64Str: string): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.src = base64Str;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 800;
        const MAX_HEIGHT = 600;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        
        // Compress to JPEG with 0.7 quality
        resolve(canvas.toDataURL('image/jpeg', 0.7));
      };
    });
  };

  const updateChapter = (index: number, updates: Partial<ChapterState>) => {
    setChapters(prev => prev.map((ch, i) => i === index ? { ...ch, ...updates } : ch));
  };

  const updateChapterContent = (chapterIndex: number, lang: AppLanguage, level: CEFRLevel, value: string) => {
    setChapters(prev => prev.map((ch, i) => {
      if (i !== chapterIndex) return ch;
      return {
        ...ch,
        contents: {
          ...ch.contents,
          [lang]: {
            ...ch.contents[lang],
            [level]: value
          }
        }
      };
    }));
  };

  const updateChapterAudio = (chapterIndex: number, lang: AppLanguage, level: CEFRLevel, gender: 'male' | 'female', value: string) => {
    setChapters(prev => prev.map((ch, i) => {
      if (i !== chapterIndex) return ch;
      const currentAudio = ch.audio[lang]?.[level] || {};
      return {
        ...ch,
        audio: {
          ...ch.audio,
          [lang]: {
            ...ch.audio[lang],
            [level]: {
              ...currentAudio,
              [gender]: value
            }
          }
        }
      };
    }));
  };

  const addChapter = () => {
    setChapters(prev => [...prev, createNewChapter()]);
  };

  const removeChapter = (index: number) => {
    if (chapters.length > 1) {
      setChapters(prev => prev.filter((_, i) => i !== index));
    }
  };

  const sanitizeHTML = (html: string | undefined | null) => {
    if (!html) return '';
    return html.replace(/<(\w+)[^>]*>\s*<\/\1>/g, '').trim();
  };

  const handleSubmit = async (e?: React.FormEvent, isDraft: boolean = false) => {
    if (e) e.preventDefault();
    
    // Validate all chapters
    for (let i = 0; i < chapters.length; i++) {
      const ch = chapters[i];
      const languagesWithContent = languages.filter(lang => {
        return levels.some(level => sanitizeHTML(ch.contents[lang][level]));
      });

      if (languagesWithContent.length === 0) {
        alert(`Capítulo ${i + 1}: Por favor, preencha o conteúdo para pelo menos um idioma.`);
        return;
      }

      const hasTitle = Object.values(ch.titles).some(t => t.trim().length > 0);
      if (!hasTitle) {
        alert(`Capítulo ${i + 1}: Por favor, preencha o título.`);
        return;
      }
    }

    setIsProcessing(true);

    try {
      const processedChapters = chapters.map(ch => {
        const sanitizedContents: any = {};
        languages.forEach(lang => {
          const langLevels = levels.reduce((acc, level) => {
            const content = sanitizeHTML(ch.contents[lang][level]);
            if (content) acc[level] = content;
            return acc;
          }, {} as any);
          if (Object.keys(langLevels).length > 0) {
            sanitizedContents[lang] = langLevels;
          }
        });

        return {
          id: ch.id,
          title: ch.titles[ch.activeLangTab] || Object.values(ch.titles).find(t => t) || '',
          titles: ch.titles,
          subtitle: ch.subtitles[ch.activeLangTab] || Object.values(ch.subtitles).find(t => t) || '',
          subtitles: ch.subtitles,
          contents: sanitizedContents,
          audio: ch.audio
        };
      });

      // Main story metadata comes from the first chapter
      const firstChapter = processedChapters[0];
      const firstLang = Object.keys(firstChapter.contents)[0] as AppLanguage;
      const firstLevel = Object.keys(firstChapter.contents[firstLang])[0] as CEFRLevel;
      const descriptionSnippet = firstChapter.contents[firstLang][firstLevel].replace(/<[^>]*>/g, '').substring(0, 120) + '...';

      const storyData = {
        title: firstChapter.title,
        titles: firstChapter.titles,
        subtitle: firstChapter.subtitle,
        subtitles: firstChapter.subtitles,
        description: descriptionSnippet,
        profileImage: profileImage || globalImageGallery[0] || null,
        quoteBackgroundImage: quoteBackgroundImage || null,
        contents: firstChapter.contents,
        audio: firstChapter.audio,
        chapters: processedChapters,
        language: firstLang,
        originalLevel: firstLevel,
        isHidden: isDraft,
      };

      if (editId) {
        await updateStory(editId, storyData);
      } else {
        await addStory({
          ...storyData,
          author: user?.displayName || user?.email?.split('@')[0] || 'Anonymous',
          category: 'Contos',
          isUserContent: true,
        });
      }

      navigate('/profile?tab=posts', { replace: true });
    } catch (error) {
      console.error('Processing failed:', error);
      alert(`Erro ao processar: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-white text-black font-sans light">
      <header className="sticky top-0 z-20 bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <button 
            onClick={() => navigate('/profile?tab=posts')} 
            className="p-2 hover:bg-gray-100 rounded-full text-black"
          >
            <ArrowLeft size={20} />
          </button>
          <h1 className="font-bold text-lg tracking-tight text-black">{editId ? 'Editar Postagem' : 'Editor de Publicação'}</h1>
          <div className="w-10" />
        </div>
      </header>

      <main className="flex-1 max-w-4xl mx-auto w-full p-6 py-12">
        <form onSubmit={(e) => handleSubmit(e)} className="space-y-16">
          {chapters.map((chapter, index) => (
            <div key={chapter.id} className="space-y-12 p-8 border border-gray-100 rounded-[40px] bg-gray-50/30 relative">
              {chapters.length > 1 && (
                <button 
                  type="button"
                  onClick={() => removeChapter(index)}
                  className="absolute top-6 right-6 p-2 text-red-500 hover:bg-red-50 rounded-full transition-all"
                >
                  <X size={20} />
                </button>
              )}
              
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-sm">
                    {index + 1}
                  </div>
                  <h2 className="text-xl font-bold">Capítulo {index + 1}</h2>
                </div>
              </div>

              {/* Title & Subtitle */}
              <div className="space-y-6">
                <div className="space-y-4">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 ml-1">Título do Capítulo ({chapter.activeLangTab})</label>
                  <input 
                    type="text" 
                    value={chapter.titles[chapter.activeLangTab] || ''}
                    onChange={(e) => updateChapter(index, { 
                      titles: { ...chapter.titles, [chapter.activeLangTab]: e.target.value } 
                    })}
                    placeholder="Ex: O Início da Jornada"
                    className="w-full px-6 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all font-bold text-lg"
                  />
                </div>
                <div className="space-y-4">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 ml-1">Subtítulo (Opcional - {chapter.activeLangTab})</label>
                  <input 
                    type="text" 
                    value={chapter.subtitles[chapter.activeLangTab] || ''}
                    onChange={(e) => updateChapter(index, { 
                      subtitles: { ...chapter.subtitles, [chapter.activeLangTab]: e.target.value } 
                    })}
                    placeholder="Ex: Uma breve introdução ao mundo..."
                    className="w-full px-6 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all text-base"
                  />
                </div>
              </div>

                <div className="bg-white border border-gray-200 rounded-[32px] overflow-hidden">
                  <RichTextEditor 
                    content={chapter.contents[chapter.activeLangTab]?.[chapter.activeLevelTab] || ''}
                    onChange={(val) => updateChapterContent(index, chapter.activeLangTab, chapter.activeLevelTab, val)}
                    forceLight={true}
                    uploadedImages={globalImageGallery}
                    profileImage={profileImage}
                    quoteBackgroundImage={quoteBackgroundImage}
                    audioMale={chapter.audio[chapter.activeLangTab]?.[chapter.activeLevelTab]?.male}
                    audioFemale={chapter.audio[chapter.activeLangTab]?.[chapter.activeLevelTab]?.female}
                    language={chapter.activeLangTab}
                    level={chapter.activeLevelTab}
                    onLanguageChange={(lang) => updateChapter(index, { activeLangTab: lang as AppLanguage })}
                    onLevelChange={(level) => updateChapter(index, { activeLevelTab: level as CEFRLevel })}
                    onSetAudio={(gender, url) => updateChapterAudio(index, chapter.activeLangTab, chapter.activeLevelTab, gender, url)}
                    onSetProfileImage={setProfileImage}
                    onSetQuoteBackgroundImage={setQuoteBackgroundImage}
                    dnaMappingId={dnaMappingId}
                    dnaMarkCount={dnaMappingId ? (() => {
                      const uniqueIds = new Set();
                      const parser = new DOMParser();
                      
                      const checkHtml = (html: string | undefined | null) => {
                        if (!html || typeof html !== 'string') return;
                        const doc = parser.parseFromString(html, 'text/html');
                        // Find all spans with our DNA ID
                        const elements = doc.querySelectorAll(`span[data-dna-id="${dnaMappingId}"]`);
                        
                        // We count one occurrence per chapter content block if it has the ID
                        if (elements.length > 0) {
                          return true;
                        }
                        return false;
                      };

                      let totalCount = 0;
                      // Check all chapters and their full content matrix
                      chapters.forEach(chapter => {
                        Object.values(chapter.contents || {}).forEach(langLevels => {
                          if (langLevels) {
                            Object.values(langLevels).forEach(html => {
                              if (checkHtml(html)) totalCount++;
                            });
                          }
                        });
                      });
                      return totalCount;
                    })() : 0}
                    onToggleDnaMapping={(active) => {
                      if (active) {
                        const newId = `dna-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
                        setDnaMappingId(newId);
                      } else {
                        setDnaMappingId(null);
                      }
                    }}
                    onImageUpload={(url) => {
                      setGlobalImageGallery(prev => {
                        if (!prev.includes(url)) {
                          return [url, ...prev];
                        }
                        return prev;
                      });
                      if (!profileImage) setProfileImage(url);
                    }}
                  />
                </div>
              </div>
          ))}

          <input 
            type="file" 
            ref={fileInputRef}
            onChange={handleImageUpload}
            accept="image/*"
            className="hidden"
          />

          {/* Action Buttons */}
          <div className="flex flex-col gap-4 pt-8">
            <button
              type="button"
              onClick={addChapter}
              className="w-full py-4 border-2 border-dashed border-blue-200 text-blue-600 rounded-2xl font-bold hover:bg-blue-50 transition-all flex items-center justify-center gap-2"
            >
              <Plus size={20} />
              Capítulo
            </button>

            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => handleSubmit(undefined, true)}
                disabled={isProcessing}
                className="py-4 bg-gray-100 text-gray-600 rounded-2xl font-bold hover:bg-gray-200 transition-all disabled:opacity-50"
              >
                Salvar Rascunho
              </button>
              <button
                type="submit"
                disabled={isProcessing}
                className="py-4 bg-blue-600 text-white rounded-2xl font-bold hover:bg-blue-700 transition-all shadow-xl shadow-blue-500/20 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isProcessing ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <CheckCircle2 size={20} />
                    Publicar Postagem
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </main>

      {/* Processing Modal */}
      <AnimatePresence>
        {isProcessing && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-white/90 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-sm bg-white border border-gray-200 rounded-[40px] shadow-2xl p-8 text-center"
            >
              <div className="mb-8 flex justify-center">
                <div className="w-20 h-20 border-4 border-blue-500/20 rounded-full animate-spin border-t-blue-500" />
              </div>
              <h2 className="text-2xl font-bold mb-2 tracking-tight text-black">{editId ? 'Salvando' : 'Publicando'}</h2>
              <p className="text-sm text-gray-500">{editId ? 'Atualizando sua história...' : 'Salvando sua história e níveis no banco de dados...'}</p>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
