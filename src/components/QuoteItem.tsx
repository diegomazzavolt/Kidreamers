/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Trash2, Copy, Share2, Check, Loader2, Download } from 'lucide-react';
import { Quote } from '../types';
import { useTheme } from '../contexts/ThemeContext';
import { useQuotes } from '../contexts/QuoteContext';
import { translateWordWithAI } from '../services/geminiService';
import { Link } from 'react-router-dom';
import * as htmlToImage from 'html-to-image';

interface QuoteItemProps {
  quote: Quote;
}

export const QuoteItem: React.FC<QuoteItemProps> = ({ quote }) => {
  const [copied, setCopied] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const { removeQuote } = useQuotes();
  const shareRef = useRef<HTMLDivElement>(null);

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    const textToCopy = `${quote.text}\n— ${quote.source}`;
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const generateQuoteImage = async () => {
    if (!shareRef.current) return null;

    return await htmlToImage.toPng(shareRef.current, {
      quality: 1,
      pixelRatio: 2,
      cacheBust: true,
      style: {
        visibility: 'visible',
        left: '0',
        top: '0',
      },
    });
  };

  const handleDownload = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isDownloading) return;
    setIsDownloading(true);

    try {
      const dataUrl = await generateQuoteImage();
      if (!dataUrl) return;

      const link = document.createElement('a');
      link.download = 'citacao_kidreamers.png';
      link.href = dataUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('Erro ao baixar imagem da citação:', err);
    } finally {
      setIsDownloading(false);
    }
  };

  const handleShare = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isSharing) return;
    setIsSharing(true);

    try {
      const dataUrl = await generateQuoteImage();
      if (!dataUrl) return;

      // Convert dataUrl to File object for navigator.share
      const response = await fetch(dataUrl);
      const blob = await response.blob();
      const file = new File([blob], 'citacao_kidreamers.png', { type: 'image/png' });

      // Try sharing file first
      const canShare = navigator.share && navigator.canShare && navigator.canShare({ files: [file] });
      
      if (canShare) {
        try {
          await navigator.share({
            files: [file],
            title: 'Citação Kidreamers',
          });
          return; // Success
        } catch (shareErr) {
          console.log('Share canceled or failed:', shareErr);
          // Only proceed to download if the error wasn't "AbortError" (user canceled)
          if ((shareErr as any).name === 'AbortError') return;
        }
      }

      // Fallback: Automatic download for Desktop or when sharing fails/unsupported
      const link = document.createElement('a');
      link.download = 'citacao_kidreamers.png';
      link.href = dataUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('Erro ao gerar imagem da citação:', err);
      // Fallback to text sharing only if it's NOT a permission/cancel issue
      if (navigator.share) {
        navigator.share({
          title: 'Citação',
          text: `${quote.text}\n— ${quote.source}`,
          url: window.location.origin + (quote.sourceId ? `/read/${quote.sourceId}` : '')
        }).catch(() => {});
      }
    } finally {
      setIsSharing(false);
    }
  };

  return (
    <>
      {/* Hidden 9:16 element for image generation */}
      <div className="fixed left-[-9999px] top-[-9999px] opacity-0 pointer-events-none" aria-hidden="true" style={{ pointerEvents: 'none' }}>
        <div 
          ref={shareRef}
          className="relative w-[1080px] h-[1920px] bg-[#0a0a0a] flex flex-col items-center justify-center p-24 text-center overflow-hidden"
        >
          {/* Background Image with Deep Overlay */}
          {quote.backgroundImage ? (
            <div className="absolute inset-0 z-0">
              <img 
                src={quote.backgroundImage} 
                alt="" 
                crossOrigin="anonymous"
                className="w-full h-full object-cover" 
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/80" />
            </div>
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-[#1a1a1a] to-[#0a0a0a]" />
          )}
          
          {/* Subtle Texture Overlay */}
          <div className="absolute inset-0 opacity-[0.03] pointer-events-none mix-blend-overlay z-[1]" 
               style={{ backgroundImage: 'url("https://www.transparenttextures.com/patterns/carbon-fibre.png")' }} />

          <div className="relative z-10 flex flex-col items-center gap-16 max-w-[920px]">
            {/* Quote Mark */}
            <div className="text-blue-500/30 text-9xl font-serif mb-[-40px]">“</div>
            
            <p 
              className="font-serif italic leading-[1.3] text-[84px] text-white"
              style={{
                textShadow: '0 10px 40px rgba(0,0,0,0.5)',
                WebkitTextStroke: '1px rgba(255,255,255,0.1)'
              }}
            >
              {quote.text}
            </p>

            <div className="w-24 h-1 bg-blue-500/50 rounded-full my-4" />

            <div 
              className="text-4xl font-black uppercase tracking-[0.25em] text-blue-400"
              style={{
                textShadow: '0 4px 12px rgba(0,0,0,0.5)'
              }}
            >
              {quote.source}
            </div>
          </div>
          
          {/* Discreet Branding Watermark */}
          <div className="absolute bottom-24 left-0 right-0 flex flex-col items-center gap-4 z-10">
            <div className="w-12 h-[1px] bg-white/20" />
            <div 
              className="text-3xl font-black uppercase tracking-[0.6em] text-white/30"
              style={{ letterSpacing: '0.8em' }}
            >
              KIDREAMERS
            </div>
          </div>
        </div>
      </div>

      <div 
        className="relative bg-[var(--card-bg)] border border-[var(--border)] rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow duration-300 overflow-hidden"
      >
      {/* Background Image with Black Overlay */}
      {quote.backgroundImage && (
        <div className="absolute inset-0 z-0">
          <img 
            src={quote.backgroundImage} 
            alt="" 
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" 
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-black/50" />
        </div>
      )}

      <div className="relative z-10">
        <div className="flex items-center justify-between mb-4">
          <Link 
            to={`/read/${quote.sourceId}`}
            className="text-xs font-black uppercase tracking-[0.2em] text-blue-500 hover:text-blue-400 transition-colors"
          >
            {quote.source}
          </Link>

          <div className="flex items-center gap-1">
            <button 
              onClick={() => removeQuote(quote.id)}
              className={`p-2 rounded-xl transition-all ${quote.backgroundImage ? 'text-white hover:bg-black/20' : 'text-red-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20'}`}
              style={quote.backgroundImage ? { WebkitTextStroke: '0.5px #000000' } : {}}
              title="Excluir"
            >
              <Trash2 size={16} />
            </button>
            <button 
              onClick={handleCopy}
              className={`p-2 rounded-xl transition-all ${quote.backgroundImage ? 'text-white hover:bg-black/20' : 'text-gray-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20'}`}
              style={quote.backgroundImage ? { WebkitTextStroke: '0.5px #000000' } : {}}
              title="Copiar"
            >
              {copied ? <Check size={16} className="text-green-400" /> : <Copy size={16} />}
            </button>
            <button 
              onClick={handleDownload}
              disabled={isDownloading || isSharing}
              className={`p-2 rounded-xl transition-all ${quote.backgroundImage ? 'text-white hover:bg-black/20' : 'text-gray-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20'} disabled:opacity-50`}
              style={quote.backgroundImage ? { WebkitTextStroke: '0.5px #000000' } : {}}
              title="Baixar Imagem"
            >
              {isDownloading ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
            </button>
            <button 
              onClick={handleShare}
              disabled={isSharing || isDownloading}
              className={`p-2 rounded-xl transition-all ${quote.backgroundImage ? 'text-white hover:bg-black/20' : 'text-gray-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20'} disabled:opacity-50`}
              style={quote.backgroundImage ? { WebkitTextStroke: '0.5px #000000' } : {}}
              title="Compartilhar"
            >
              {isSharing ? <Loader2 size={16} className="animate-spin" /> : <Share2 size={16} />}
            </button>
          </div>
        </div>

        <div className="relative">
          <p 
            className={`font-serif italic leading-relaxed text-lg ${quote.backgroundImage ? 'text-white' : 'text-[var(--foreground)]'}`}
            style={quote.backgroundImage ? {
              WebkitTextStroke: '1.5px #000000',
              paintOrder: 'stroke fill'
            } : {}}
          >
            "{quote.text}"
          </p>
        </div>
      </div>
    </div>
  </>
);
};
