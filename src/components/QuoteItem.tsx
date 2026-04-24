/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Trash2, Copy, Share2, Check, Loader2 } from 'lucide-react';
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
  const { removeQuote } = useQuotes();
  const shareRef = useRef<HTMLDivElement>(null);

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    const textToCopy = `${quote.text}\n— ${quote.source}`;
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isSharing) return;
    setIsSharing(true);

    try {
      if (!shareRef.current) return;

      // Generate the image from the hidden 9:16 element
      const dataUrl = await htmlToImage.toPng(shareRef.current, {
        quality: 1,
        pixelRatio: 2,
        cacheBust: true,
      });

      // Convert dataUrl to File object for navigator.share
      const response = await fetch(dataUrl);
      const blob = await response.blob();
      const file = new File([blob], 'citacao_kidreamers.png', { type: 'image/png' });

      if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: 'Citação Kidreamers',
        });
      } else {
        // Fallback: Automatic download
        const link = document.createElement('a');
        link.download = 'citacao_kidreamers.png';
        link.href = dataUrl;
        link.click();
      }
    } catch (err) {
      console.error('Erro ao gerar imagem da citação:', err);
      // Fallback to text sharing if image generation fails
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
      <div className="fixed left-[-9999px] top-[-9999px]">
        <div 
          ref={shareRef}
          className="relative w-[1080px] h-[1920px] bg-white flex flex-col items-center justify-center p-20 text-center overflow-hidden"
        >
          {/* Background Image with Black Overlay */}
          {quote.backgroundImage && (
            <div className="absolute inset-0 z-0">
              <img 
                src={quote.backgroundImage} 
                alt="" 
                className="w-full h-full object-cover" 
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-black/50" />
            </div>
          )}
          
          <div className="relative z-10 flex flex-col items-center gap-12 max-w-[900px]">
            <p 
              className="font-serif italic leading-relaxed text-7xl text-white"
              style={{
                WebkitTextStroke: '3px #000000',
                paintOrder: 'stroke fill'
              }}
            >
              "{quote.text}"
            </p>
            <div 
              className="text-3xl font-black uppercase tracking-[0.3em] text-white"
              style={{
                WebkitTextStroke: '1.5px #000000',
                textShadow: '2px 2px 0 #000000'
              }}
            >
              {quote.source}
            </div>
          </div>
          
          {/* Branding */}
          <div className="absolute bottom-20 left-0 right-0 flex justify-center z-10">
            <div 
              className="text-5xl font-black uppercase tracking-[0.5em] text-white opacity-50"
              style={{ 
                WebkitTextStroke: '2px #000000',
                fontFamily: 'Impact, Haettenschweiler, "Arial Narrow Bold", sans-serif'
              }}
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
              onClick={handleShare}
              disabled={isSharing}
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
