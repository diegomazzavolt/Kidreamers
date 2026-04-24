/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Quote, AppLanguage } from '../types';

interface QuoteContextType {
  quotes: Quote[];
  addQuote: (text: string, translation: string, lang: AppLanguage, source: string, sourceId: string, backgroundImage?: string) => void;
  removeQuote: (id: string) => void;
  updateQuoteTranslation: (id: string, translation: string, lang: AppLanguage) => void;
}

const QuoteContext = createContext<QuoteContextType | undefined>(undefined);

export const QuoteProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [quotes, setQuotes] = useState<Quote[]>(() => {
    const saved = localStorage.getItem('app-quotes');
    if (!saved) return [];
    try {
      const parsed = JSON.parse(saved);
      // Migration for old quotes
      return parsed.map((q: any) => {
        if (q.translation && !q.translations) {
          return {
            ...q,
            translations: { PT: q.translation }, // Default to PT for old quotes
            sourceId: q.sourceId || '',
            backgroundImage: q.backgroundImage || undefined
          };
        }
        return q;
      });
    } catch (e) {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem('app-quotes', JSON.stringify(quotes));
  }, [quotes]);

  const addQuote = (text: string, translation: string, lang: AppLanguage, source: string, sourceId: string, backgroundImage?: string) => {
    const newQuote: Quote = {
      id: crypto.randomUUID(),
      text,
      translations: { [lang]: translation },
      source,
      sourceId,
      backgroundImage,
      createdAt: new Date().toISOString(),
    };
    setQuotes(prev => [newQuote, ...prev]);
  };

  const removeQuote = (id: string) => {
    setQuotes(prev => prev.filter(q => q.id !== id));
  };

  const updateQuoteTranslation = (id: string, translation: string, lang: AppLanguage) => {
    setQuotes(prev => prev.map(q => 
      q.id === id 
        ? { ...q, translations: { ...q.translations, [lang]: translation } }
        : q
    ));
  };

  return (
    <QuoteContext.Provider value={{ quotes, addQuote, removeQuote, updateQuoteTranslation }}>
      {children}
    </QuoteContext.Provider>
  );
};

export const useQuotes = () => {
  const context = useContext(QuoteContext);
  if (context === undefined) {
    throw new Error('useQuotes must be used within a QuoteProvider');
  }
  return context;
};
