/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react';
import { Flashcard } from '../types';

/**
 * SM-2 Algorithm Implementation
 * Quality (q): 0-5
 * 5: perfect response
 * 4: correct response after a hesitation
 * 3: correct response recalled with serious difficulty
 * 2: incorrect response; where the correct one seemed easy to recall
 * 1: incorrect response; the correct one remembered
 * 0: complete blackout.
 */
const calculateSM2 = (
  card: Flashcard,
  quality: number
): { interval: number; repetition: number; easeFactor: number; nextReview: string } => {
  let { interval, repetition, easeFactor } = card;

  if (quality >= 3) {
    // Correct response
    if (repetition === 0) {
      interval = 1;
    } else if (repetition === 1) {
      interval = 6;
    } else {
      interval = Math.round(interval * easeFactor);
    }
    repetition += 1;
  } else {
    // Incorrect response
    repetition = 0;
    interval = 1;
  }

  // Update ease factor
  easeFactor = easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
  if (easeFactor < 1.3) easeFactor = 1.3;

  const nextReviewDate = new Date();
  nextReviewDate.setDate(nextReviewDate.getDate() + interval);

  return {
    interval,
    repetition,
    easeFactor,
    nextReview: nextReviewDate.toISOString(),
  };
};

interface DeckContextType {
  cards: Flashcard[];
  dueCards: Flashcard[];
  addCard: (word: string, translation: string, context: string) => void;
  updateCardProgress: (cardId: string, quality: number) => void;
  removeCard: (cardId: string) => void;
}

const DeckContext = createContext<DeckContextType | undefined>(undefined);

export const DeckProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [cards, setCards] = useState<Flashcard[]>(() => {
    const saved = localStorage.getItem('app-deck');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('app-deck', JSON.stringify(cards));
  }, [cards]);

  const addCard = (word: string, translation: string, context: string) => {
    const newCard: Flashcard = {
      id: crypto.randomUUID(),
      word,
      translation,
      context,
      interval: 0,
      repetition: 0,
      easeFactor: 2.5,
      nextReview: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    };
    setCards((prev) => [...prev, newCard]);
  };

  const updateCardProgress = (cardId: string, quality: number) => {
    setCards((prev) =>
      prev.map((card) => {
        if (card.id === cardId) {
          const updates = calculateSM2(card, quality);
          return { ...card, ...updates };
        }
        return card;
      })
    );
  };

  const removeCard = (cardId: string) => {
    setCards((prev) => prev.filter((c) => c.id !== cardId));
  };

  const dueCards = useMemo(() => {
    const now = new Date();
    return cards.filter((card) => new Date(card.nextReview) <= now);
  }, [cards]);

  return (
    <DeckContext.Provider
      value={{ cards, dueCards, addCard, updateCardProgress, removeCard }}
    >
      {children}
    </DeckContext.Provider>
  );
};

export const useDeck = () => {
  const context = useContext(DeckContext);
  if (context === undefined) {
    throw new Error('useDeck must be used within a DeckProvider');
  }
  return context;
};
