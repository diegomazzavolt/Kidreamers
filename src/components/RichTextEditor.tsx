/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Underline from '@tiptap/extension-underline';
import Link from '@tiptap/extension-link';
import Typography from '@tiptap/extension-typography';
import TextAlign from '@tiptap/extension-text-align';
import ImageResize from 'tiptap-extension-resize-image';
import Dropcursor from '@tiptap/extension-dropcursor';
import Gapcursor from '@tiptap/extension-gapcursor';
import { Bold, Italic, Underline as UnderlineIcon, List, Heading1, Heading2, Quote, Redo, Undo, AlignLeft, AlignCenter, AlignRight, Link as LinkIcon, Check, X as CloseIcon, Image as ImageIcon, Globe, Plus, Download, Mic, Music, Loader2, ChevronDown, Dna, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { generateSpeechWithAI } from '../services/geminiService';
import { Mark, mergeAttributes } from '@tiptap/core';

// Custom DNA Mark extension
const DnaMark = Mark.create({
  name: 'dnaMark',
  priority: 1000,
  addAttributes() {
    return {
      dnaId: {
        default: null,
        parseHTML: element => element.getAttribute('data-dna-id'),
        renderHTML: attributes => {
          if (!attributes.dnaId) return {};
          return { 'data-dna-id': attributes.dnaId, class: 'dna-mapped-text' };
        },
      },
    };
  },
  parseHTML() {
    return [{ tag: 'span[data-dna-id]' }];
  },
  renderHTML({ HTMLAttributes }) {
    return ['span', mergeAttributes(HTMLAttributes), 0];
  },
});

interface RichTextEditorProps {
  content: string;
  onChange: (content: string) => void;
  forceLight?: boolean;
  uploadedImages?: string[];
  profileImage?: string | null;
  quoteBackgroundImage?: string | null;
  audioMale?: string;
  audioFemale?: string;
  language?: string;
  level?: string;
  onLanguageChange?: (lang: string) => void;
  onLevelChange?: (level: string) => void;
  onSetAudio?: (gender: 'male' | 'female', url: string) => void;
  onSetProfileImage?: (url: string) => void;
  onSetQuoteBackgroundImage?: (url: string) => void;
  onImageUpload?: (url: string) => void;
  dnaMappingId?: string | null;
  dnaMarkCount?: number;
  onToggleDnaMapping?: (active: boolean) => void;
}

export const RichTextEditor: React.FC<RichTextEditorProps> = ({ 
  content, 
  onChange, 
  forceLight, 
  uploadedImages = [], 
  profileImage,
  quoteBackgroundImage,
  audioMale,
  audioFemale,
  language = 'PT',
  level = 'A1',
  onLanguageChange,
  onLevelChange,
  onSetAudio,
  onSetProfileImage,
  onSetQuoteBackgroundImage,
  onImageUpload,
  dnaMappingId,
  dnaMarkCount = 0,
  onToggleDnaMapping,
}) => {
  const [linkUrl, setLinkUrl] = React.useState('');
  const [showLinkInput, setShowLinkInput] = React.useState(false);
  const [imageUrl, setImageUrl] = React.useState('');
  const [audioUrl, setAudioUrl] = React.useState('');
  const [mode, setMode] = React.useState<'visual' | 'html' | 'images' | 'narration'>('visual');
  const [isGeneratingAudio, setIsGeneratingAudio] = React.useState<'male' | 'female' | null>(null);
  const [showLevelSelector, setShowLevelSelector] = React.useState(false);
  const isMouseDown = React.useRef(false);
  const imageInputRef = React.useRef<HTMLInputElement>(null);

  const languages = ['EN', 'ES', 'FR', 'DE', 'RU', 'PT'];
  const levels = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
        bulletList: {
          keepMarks: true,
          keepAttributes: false,
        },
        orderedList: {
          keepMarks: true,
          keepAttributes: false,
        },
      }),
      Underline,
      Typography,
      ImageResize.configure({
        HTMLAttributes: {
          class: 'max-w-full h-auto my-8 mx-auto block cursor-move',
        },
      } as any),
      Dropcursor.configure({
        color: '#2563eb',
        width: 2,
      }),
      Gapcursor,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-blue-600 underline cursor-pointer',
        },
      }),
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      Placeholder.configure({
        placeholder: 'Write your story here...',
      }),
      DnaMark,
    ],
    content,
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      onChange(html);
    },
  });

  // Use editor events for more reliable DNA marking
  React.useEffect(() => {
    if (!editor) return;

    const handleMouseDown = () => {
      isMouseDown.current = true;
    };

    const handleMouseUp = () => {
      isMouseDown.current = false;
      
      // If DNA mapping is active, apply it at the end of selection
      if (dnaMappingId) {
        const { from, to } = editor.state.selection;
        if (from !== to) {
          editor.chain().setMark('dnaMark', { dnaId: dnaMappingId }).run();
        }
      }
    };

    const container = editor.options.element;
    if (container instanceof HTMLElement) {
      container.addEventListener('mousedown', handleMouseDown);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      if (container instanceof HTMLElement) {
        container.removeEventListener('mousedown', handleMouseDown);
        window.removeEventListener('mouseup', handleMouseUp);
      }
    };
  }, [editor, dnaMappingId]);

  const toggleDnaMode = () => {
    onToggleDnaMapping?.(!dnaMappingId);
  };

  const setLink = React.useCallback(() => {
    if (linkUrl) {
      editor?.chain().focus().setLink({ href: linkUrl }).run();
    } else {
      editor?.chain().focus().unsetLink().run();
    }
    setLinkUrl('');
    setShowLinkInput(false);
  }, [editor, linkUrl]);

  const addImageByUrl = React.useCallback(() => {
    if (imageUrl && editor) {
      (editor.chain().focus() as any).setImage({ src: imageUrl }).run();
      if (onImageUpload) onImageUpload(imageUrl);
    }
    setImageUrl('');
    setMode('visual');
  }, [editor, imageUrl, onImageUpload]);

  const processFile = (file: File) => {
    if (editor) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        (editor.chain().focus() as any).setImage({ src: result }).run();
        if (onImageUpload) onImageUpload(result);
        setMode('visual');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
    // Reset input
    if (imageInputRef.current) {
      imageInputRef.current.value = '';
    }
  };

  React.useEffect(() => {
    if (editor && !isMouseDown.current && content !== editor.getHTML()) {
      editor.commands.setContent(content, false as any);
    }
  }, [content, editor]);

  if (!editor) return null;

  const MenuButton = ({ onClick, isActive, children, title }: any) => (
    <button
      type="button"
      onClick={(e) => { 
        e.preventDefault(); 
        e.stopPropagation();
        onClick(); 
      }}
      className={`p-2 rounded-lg transition-colors ${isActive ? 'bg-blue-600 text-white' : forceLight ? 'hover:bg-gray-100 text-gray-700' : 'hover:bg-gray-100 dark:hover:bg-gray-800'}`}
      title={title}
    >
      {children}
    </button>
  );

  return (
    <div className={`border rounded-2xl overflow-hidden ${forceLight ? 'border-gray-200 bg-white text-black' : 'border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900'}`}>
      {/* Tabs */}
      <div className={`flex items-stretch border-b ${forceLight ? 'border-gray-200 bg-white' : 'border-gray-200 dark:border-gray-800 bg-gray-900'}`}>
        <button 
          type="button"
          onClick={() => setMode('visual')}
          className={`px-6 py-3 text-[10px] font-black uppercase tracking-widest transition-all border-r ${forceLight ? 'border-gray-200' : 'border-gray-800'} ${mode === 'visual' ? 'bg-gray-900 text-white' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800'}`}
        >
          Visual
        </button>
        <button 
          type="button"
          onClick={() => setMode('html')}
          className={`px-6 py-3 text-[10px] font-black uppercase tracking-widest transition-all border-r ${forceLight ? 'border-gray-200' : 'border-gray-800'} ${mode === 'html' ? 'bg-gray-900 text-white' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800'}`}
        >
          HTML
        </button>
        <button 
          type="button"
          onClick={() => setMode('images')}
          className={`px-6 py-3 text-[10px] font-black uppercase tracking-widest transition-all border-r ${forceLight ? 'border-gray-200' : 'border-gray-800'} ${mode === 'images' ? 'bg-gray-900 text-white' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800'}`}
        >
          Imagens
        </button>
        <button 
          type="button"
          onClick={() => setMode('narration')}
          className={`px-6 py-3 text-[10px] font-black uppercase tracking-widest transition-all border-r ${forceLight ? 'border-gray-200' : 'border-gray-800'} ${mode === 'narration' ? 'bg-gray-900 text-white' : 'text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800'}`}
        >
          Narração
        </button>

        {/* Level & Language Selector */}
        <div className="flex items-center px-4 gap-4">
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowLevelSelector(!showLevelSelector)}
              className="flex items-center gap-1.5 px-2 h-7 bg-blue-600 text-white text-[10px] font-black rounded-lg transition-all hover:bg-blue-700 active:scale-95 shadow-sm"
            >
              {level}
              <ChevronDown size={10} className={`transition-transform duration-200 ${showLevelSelector ? 'rotate-180' : ''}`} />
            </button>

            <AnimatePresence>
              {showLevelSelector && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowLevelSelector(false)} />
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute top-full mt-2 left-0 w-24 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-2xl z-50 overflow-hidden p-1"
                  >
                    <div className="grid grid-cols-2 gap-1">
                      {levels.map(l => (
                        <button
                          key={l}
                          type="button"
                          onClick={() => {
                            onLevelChange?.(l);
                            setShowLevelSelector(false);
                          }}
                          className={`
                            h-7 flex items-center justify-center text-[10px] font-black rounded-lg transition-all
                            ${level === l 
                              ? 'bg-blue-600 text-white' 
                              : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'}
                          `}
                        >
                          {l}
                        </button>
                      ))}
                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>

          <div className="w-px h-4 bg-gray-200 dark:bg-gray-800" />
          
          <div className="flex items-center gap-1">
            {languages.map(lang => (
              <button
                key={lang}
                type="button"
                onClick={() => onLanguageChange?.(lang)}
                className={`w-7 h-7 flex items-center justify-center text-[10px] font-black rounded-lg transition-all ${language === lang ? 'bg-blue-600 text-white' : 'text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'}`}
              >
                {lang}
              </button>
            ))}
          </div>
        </div>

        <div className="ml-auto flex items-stretch">
          <button 
            type="button"
            onClick={async () => {
              if (isGeneratingAudio) return;
              setIsGeneratingAudio('male');
              try {
                const plainText = content.replace(/<[^>]*>/g, '');
                const filename = `${language}-${level}-M`;
                await generateSpeechWithAI(plainText, 'male', filename);
              } catch (e) {
                console.error("Error generating male audio:", e);
              } finally {
                setIsGeneratingAudio(null);
              }
            }}
            disabled={isGeneratingAudio !== null}
            className={`w-12 flex items-center justify-center transition-all border-l ${forceLight ? 'border-gray-200' : 'border-gray-800'} bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50`}
            title="Gerar e Baixar Voz Masculina"
          >
            {isGeneratingAudio === 'male' ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
          </button>
          <button 
            type="button"
            onClick={async () => {
              if (isGeneratingAudio) return;
              setIsGeneratingAudio('female');
              try {
                const plainText = content.replace(/<[^>]*>/g, '');
                const filename = `${language}-${level}-F`;
                await generateSpeechWithAI(plainText, 'female', filename);
              } catch (e) {
                console.error("Error generating female audio:", e);
              } finally {
                setIsGeneratingAudio(null);
              }
            }}
            disabled={isGeneratingAudio !== null}
            className={`w-12 flex items-center justify-center transition-all border-l ${forceLight ? 'border-gray-200' : 'border-gray-800'} bg-pink-600 text-white hover:bg-pink-700 disabled:opacity-50`}
            title="Gerar e Baixar Voz Feminina"
          >
            {isGeneratingAudio === 'female' ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
          </button>
        </div>
      </div>

      {/* Toolbar */}
      {mode === 'visual' && (
        <div className={`flex flex-wrap items-center gap-1 p-2 border-b ${forceLight ? 'border-gray-200 bg-gray-50' : 'border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950'}`}>
          <MenuButton 
            onClick={() => editor.chain().focus().toggleBold().run()} 
            isActive={editor.isActive('bold')}
            title="Bold"
          >
            <Bold size={18} />
          </MenuButton>
          <MenuButton 
            onClick={() => editor.chain().focus().toggleItalic().run()} 
            isActive={editor.isActive('italic')}
            title="Italic"
          >
            <Italic size={18} />
          </MenuButton>
          <MenuButton 
            onClick={() => editor.chain().focus().toggleUnderline().run()} 
            isActive={editor.isActive('underline')}
            title="Underline"
          >
            <UnderlineIcon size={18} />
          </MenuButton>
          <div className={`w-px h-6 mx-1 ${forceLight ? 'bg-gray-200' : 'bg-gray-200 dark:bg-gray-800'}`} />
          <div className="relative">
            <MenuButton 
              onClick={() => {
                if (editor.isActive('link')) {
                  editor.chain().focus().unsetLink().run();
                } else {
                  setShowLinkInput(true);
                }
              }} 
              isActive={editor.isActive('link')}
              title="Link"
            >
              <LinkIcon size={18} />
            </MenuButton>

            {showLinkInput && (
              <div className={`absolute top-full left-0 mt-2 p-2 rounded-xl shadow-xl border z-50 flex items-center gap-2 min-w-[240px] ${forceLight ? 'bg-white border-gray-200' : 'bg-gray-900 border-gray-800'}`}>
                <input
                  type="text"
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  placeholder="https://..."
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') setLink();
                    if (e.key === 'Escape') setShowLinkInput(false);
                  }}
                  className={`flex-1 px-3 py-1.5 text-xs rounded-lg outline-none border focus:ring-2 focus:ring-blue-500 transition-all ${forceLight ? 'bg-gray-50 border-gray-200 text-black' : 'bg-gray-800 border-gray-700 text-white'}`}
                />
                <button 
                  type="button"
                  onClick={setLink}
                  className="p-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Check size={14} />
                </button>
                <button 
                  type="button"
                  onClick={() => setShowLinkInput(false)}
                  className={`p-1.5 rounded-lg transition-colors ${forceLight ? 'hover:bg-gray-100 text-gray-500' : 'hover:bg-gray-800 text-gray-400'}`}
                >
                  <CloseIcon size={14} />
                </button>
              </div>
            )}
          </div>
          <div className={`w-px h-6 mx-1 ${forceLight ? 'bg-gray-200' : 'bg-gray-200 dark:bg-gray-800'}`} />
          <MenuButton 
            onClick={() => editor.chain().focus().setTextAlign('left').run()} 
            isActive={editor.isActive({ textAlign: 'left' })}
            title="Align Left"
          >
            <AlignLeft size={18} />
          </MenuButton>
          <MenuButton 
            onClick={() => editor.chain().focus().setTextAlign('center').run()} 
            isActive={editor.isActive({ textAlign: 'center' })}
            title="Align Center"
          >
            <AlignCenter size={18} />
          </MenuButton>
          <MenuButton 
            onClick={() => editor.chain().focus().setTextAlign('right').run()} 
            isActive={editor.isActive({ textAlign: 'right' })}
            title="Align Right"
          >
            <AlignRight size={18} />
          </MenuButton>
          <div className={`w-px h-6 mx-1 ${forceLight ? 'bg-gray-200' : 'bg-gray-200 dark:bg-gray-800'}`} />
          <MenuButton 
            onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} 
            isActive={editor.isActive('heading', { level: 1 })}
            title="Heading 1"
          >
            <Heading1 size={18} />
          </MenuButton>
          <MenuButton 
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} 
            isActive={editor.isActive('heading', { level: 2 })}
            title="Heading 2"
          >
            <Heading2 size={18} />
          </MenuButton>
          <div className={`w-px h-6 mx-1 ${forceLight ? 'bg-gray-200' : 'bg-gray-200 dark:bg-gray-800'}`} />
          <MenuButton 
            onClick={() => editor.chain().focus().toggleBulletList().run()} 
            isActive={editor.isActive('bulletList')}
            title="Bullet List"
          >
            <List size={18} />
          </MenuButton>
          <MenuButton 
            onClick={() => editor.chain().focus().toggleBlockquote().run()} 
            isActive={editor.isActive('blockquote')}
            title="Quote"
          >
            <Quote size={18} />
          </MenuButton>

          <div className={`w-px h-6 mx-1 ${forceLight ? 'bg-gray-200' : 'bg-gray-200 dark:bg-gray-800'}`} />

          <button
            type="button"
            onClick={toggleDnaMode}
            title={dnaMappingId ? "Mapeamento Manual ativo... selecione frases em outras línguas/níveis" : "Mapeamento Manual (DNA)"}
            className={`
              p-2 rounded-lg transition-all flex items-center gap-2 group relative
              ${dnaMappingId 
                ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/20' 
                : forceLight ? 'hover:bg-gray-100 text-purple-600' : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-purple-600'}
            `}
          >
            <div className="relative">
              <Dna size={18} className={dnaMappingId ? 'animate-pulse' : ''} />
              {dnaMappingId && dnaMarkCount > 0 && (
                <motion.span 
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  key={dnaMarkCount}
                  className="absolute -top-3 -right-3 bg-red-500 text-white text-[10px] w-4 h-4 flex items-center justify-center rounded-full font-bold border-2 border-purple-600"
                >
                  {dnaMarkCount}
                </motion.span>
              )}
            </div>
            {dnaMappingId && <span className="text-[10px] font-black uppercase tracking-widest">DNA ON</span>}
          </button>

          <button
            type="button"
            onClick={() => editor.chain().focus().unsetMark('dnaMark').run()}
            title="Remover Mapeamento DNA da seleção"
            className={`
              p-2 rounded-lg transition-all flex items-center gap-2
              ${forceLight 
                ? 'hover:bg-red-50 text-red-500' 
                : 'hover:bg-red-900/20 text-red-400'}
            `}
          >
            <Trash2 size={18} />
          </button>
          
          <div className="flex-1" />
          <MenuButton onClick={() => editor.chain().focus().undo().run()} title="Undo">
            <Undo size={18} />
          </MenuButton>
          <MenuButton onClick={() => editor.chain().focus().redo().run()} title="Redo">
            <Redo size={18} />
          </MenuButton>
        </div>
      )}

      {/* Editor Area */}
      <div className={`relative resize-y ${mode === 'visual' ? 'overflow-auto' : 'overflow-hidden'} h-[500px] min-h-[300px] ${forceLight ? 'bg-white' : 'bg-gray-900'}`}>
        {mode === 'visual' ? (
          <div 
            className={`p-6 prose max-w-none font-serif cursor-text min-h-full ${forceLight ? 'prose-slate text-black' : 'dark:prose-invert'}`}
            onClick={() => editor.chain().focus().run()}
          >
            <EditorContent editor={editor} />
          </div>
        ) : mode === 'html' ? (
          <textarea
            value={content}
            onChange={(e) => onChange(e.target.value)}
            className={`w-full h-full p-6 font-mono text-sm outline-none resize-none ${forceLight ? 'bg-gray-50 text-black' : 'bg-gray-950 text-gray-300'}`}
            placeholder="Enter HTML here..."
          />
        ) : mode === 'images' ? (
          <div className="p-8 h-full flex flex-col gap-8 overflow-auto">
            <div className="w-full max-w-4xl mx-auto">
              <div className="flex gap-2">
                <div className={`flex-1 flex items-center gap-2 px-4 py-3 rounded-2xl border transition-all ${forceLight ? 'bg-gray-50 border-gray-200 focus-within:border-blue-500' : 'bg-gray-950 border-gray-800 focus-within:border-blue-500'}`}>
                  <Globe size={18} className="opacity-30" />
                  <input
                    type="text"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    placeholder="Cole a URL da imagem aqui..."
                    className="flex-1 bg-transparent outline-none text-sm"
                    onKeyDown={(e) => e.key === 'Enter' && addImageByUrl()}
                  />
                </div>
                <button
                  type="button"
                  onClick={addImageByUrl}
                  className="px-6 bg-blue-600 text-white font-bold rounded-2xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/20 active:scale-95"
                >
                  Adicionar
                </button>
              </div>
            </div>

            <div className="w-full max-w-4xl mx-auto">
              <div className="flex items-center gap-4 mb-8">
                <div className="h-px flex-1 bg-gray-200 dark:bg-gray-800" />
                <span className="text-xs font-black uppercase tracking-widest opacity-30">GALERIA DA POSTAGEM</span>
                <div className="h-px flex-1 bg-gray-200 dark:bg-gray-800" />
              </div>
              
              {uploadedImages.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-4">
                  {[...uploadedImages].sort((a, b) => {
                    if (a === profileImage) return -1;
                    if (b === profileImage) return 1;
                    if (a === quoteBackgroundImage) return -1;
                    if (b === quoteBackgroundImage) return 1;
                    return 0;
                  }).map((src, idx) => {
                    const isProfile = src === profileImage;
                    const isQuoteBg = src === quoteBackgroundImage;
                    return (
                      <div key={idx} className="relative group">
                        <button
                          type="button"
                          onClick={() => {
                            (editor.chain().focus() as any).setImage({ src }).run();
                            setMode('visual');
                          }}
                          className={`
                            relative w-full aspect-square rounded-2xl border-2 overflow-hidden transition-all hover:scale-105 active:scale-95
                            ${forceLight ? 'border-gray-100 hover:border-blue-500' : 'border-gray-800 hover:border-blue-500'}
                            ${isProfile || isQuoteBg ? 'ring-4 ring-blue-500 ring-offset-2' : ''}
                          `}
                        >
                          <img src={src} alt={`Gallery ${idx}`} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                          <div className="absolute inset-0 bg-blue-600/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <Plus className="text-white" size={24} />
                          </div>
                          {isProfile && (
                            <div className="absolute top-1 left-1 bg-blue-600 text-white text-[8px] font-black px-1.5 py-0.5 rounded-full uppercase tracking-tighter shadow-lg">
                              Perfil
                            </div>
                          )}
                          {isQuoteBg && (
                            <div className="absolute top-1 right-1 bg-blue-600 text-white text-[8px] font-black px-1.5 py-0.5 rounded-full uppercase tracking-tighter shadow-lg">
                              Fundo
                            </div>
                          )}
                        </button>
                        
                        <div className="absolute -bottom-2 -right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                          {!isProfile && onSetProfileImage && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                onSetProfileImage(src);
                              }}
                              className="bg-white text-blue-600 p-1.5 rounded-full shadow-lg border border-gray-100 hover:scale-110 active:scale-95"
                              title="Definir como perfil"
                            >
                              <Globe size={14} />
                            </button>
                          )}
                          {!isQuoteBg && onSetQuoteBackgroundImage && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                onSetQuoteBackgroundImage(src);
                              }}
                              className="bg-white text-blue-600 p-1.5 rounded-full shadow-lg border border-gray-100 hover:scale-110 active:scale-95"
                              title="Definir como fundo de citação"
                            >
                              <ImageIcon size={14} />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center text-center opacity-30 gap-4 py-12">
                  <ImageIcon size={64} />
                  <p className="font-bold">Sua galeria está vazia</p>
                  <p className="text-sm">Cole uma URL acima para começar.</p>
                </div>
              )}
            </div>
          </div>
        ) : mode === 'narration' ? (
          <div className="p-8 h-full flex flex-col gap-8 overflow-auto">
            <div className="w-full max-w-5xl mx-auto space-y-8">


              <div className="grid grid-cols-1 md:grid-cols-2 gap-8" key={`${language}-${level}`}>
                {/* Male Column */}
                <div className="space-y-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-600">
                      <Mic size={20} />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg leading-none mb-1">Masculino</h3>
                      <p className="text-[10px] font-medium opacity-40 uppercase tracking-widest">Narração Homem</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className={`flex flex-col gap-2 p-4 rounded-3xl border transition-all ${forceLight ? 'bg-gray-50 border-gray-100' : 'bg-gray-950 border-gray-800'} ${audioMale ? 'border-blue-500/50 bg-blue-500/5' : ''}`}>
                      <label className="text-[10px] font-black uppercase tracking-widest opacity-40 ml-1">URL do Áudio</label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          key={`male-${language}-${level}`}
                          defaultValue={audioMale || ''}
                          onBlur={(e) => {
                            if (onSetAudio) onSetAudio('male', e.target.value);
                          }}
                          placeholder="https://exemplo.com/audio-m.mp3"
                          className="flex-1 bg-transparent border-b border-[var(--border)] py-1 text-sm outline-none focus:border-blue-500 transition-colors"
                        />
                      </div>
                    </div>

                    {audioMale?.trim() && (
                      <div className="p-4 rounded-2xl border border-blue-500/10 bg-blue-500/5">
                        <audio controls src={audioMale.trim()} className="w-full h-8" />
                        <button 
                          type="button"
                          onClick={() => onSetAudio?.('male', '')}
                          className="mt-3 text-[10px] font-black uppercase text-red-500 hover:text-red-600 transition-colors"
                        >
                          Remover Link
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Female Column */}
                <div className="space-y-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-pink-500/10 flex items-center justify-center text-pink-600">
                      <Mic size={20} />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg leading-none mb-1">Feminino</h3>
                      <p className="text-[10px] font-medium opacity-40 uppercase tracking-widest">Narração Mulher</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className={`flex flex-col gap-2 p-4 rounded-3xl border transition-all ${forceLight ? 'bg-gray-50 border-gray-100' : 'bg-gray-950 border-gray-800'} ${audioFemale ? 'border-pink-500/50 bg-pink-500/5' : ''}`}>
                      <label className="text-[10px] font-black uppercase tracking-widest opacity-40 ml-1">URL do Áudio</label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          key={`female-${language}-${level}`}
                          defaultValue={audioFemale || ''}
                          onBlur={(e) => {
                            if (onSetAudio) onSetAudio('female', e.target.value);
                          }}
                          placeholder="https://exemplo.com/audio-f.mp3"
                          className="flex-1 bg-transparent border-b border-[var(--border)] py-1 text-sm outline-none focus:border-pink-500 transition-colors"
                        />
                      </div>
                    </div>

                    {audioFemale?.trim() && (
                      <div className="p-4 rounded-2xl border border-pink-500/10 bg-pink-500/5">
                        <audio controls src={audioFemale.trim()} className="w-full h-8" />
                        <button 
                          type="button"
                          onClick={() => onSetAudio?.('female', '')}
                          className="mt-3 text-[10px] font-black uppercase text-red-500 hover:text-red-600 transition-colors"
                        >
                          Remover Link
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {!audioMale?.trim() && !audioFemale?.trim() && (
                <div className="p-12 text-center border-2 border-dashed border-[var(--border)] rounded-[40px] opacity-20">
                  <Music size={48} className="mx-auto mb-4" />
                  <p className="font-bold">Nenhum áudio configurado para {language} em {level}</p>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="p-8 h-full flex flex-col items-center">
            {/* This block is removed as it was the old gallery mode */}
          </div>
        )}
      </div>

      <input
        type="file"
        ref={imageInputRef}
        onChange={handleImageUpload}
        accept="image/*"
        className="hidden"
      />

      <style>{`
        .ProseMirror:focus {
          outline: none;
        }
        .ProseMirror p.is-editor-empty:first-child::before {
          content: attr(data-placeholder);
          float: left;
          color: #adb5bd;
          pointer-events: none;
          height: 0;
        }
        /* Custom scrollbar for the editor area */
        .resize-y::-webkit-resizer {
          border-width: 8px;
          border-style: solid;
          border-color: transparent blue blue transparent;
        }

        /* Image Resizer Styles */
        .ProseMirror .node-imageResize {
          display: inline-block;
          line-height: 0;
          transition: all 0.2s ease-in-out;
          position: relative;
        }
        .ProseMirror .node-imageResize.ProseMirror-selectednode {
          outline: 3px solid #2563eb;
        }
        .ProseMirror .node-imageResize img {
          display: block;
        }
        /* Resizer handles */
        .ProseMirror .node-imageResize .resizer {
          position: absolute;
          bottom: 0;
          right: 0;
          width: 12px;
          height: 12px;
          background: #2563eb;
          cursor: nwse-resize;
          z-index: 10;
          border-radius: 2px;
          border: 2px solid white;
        }
      `}</style>
    </div>
  );
};
