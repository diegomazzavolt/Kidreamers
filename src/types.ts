/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type CEFRLevel = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';

export type MainCategory = 'Contos' | 'Infantil' | 'NEWS' | 'All';

export type NewsSubCategory = 
  | 'Politica Nacional' 
  | 'Politica Global' 
  | 'Economia Nacional' 
  | 'Economia Global' 
  | 'Noticias Quentes' 
  | 'Trend Topics X'
  | 'All';

export interface CommunityHighlight {
  text: string;
  count: number;
}

export interface Chapter {
  id: string;
  title: string;
  titles?: Partial<Record<AppLanguage, string>>;
  subtitle?: string;
  subtitles?: Partial<Record<AppLanguage, string>>;
  profileImage?: string;
  audioMale?: string;
  audioFemale?: string;
  audio?: Partial<Record<AppLanguage, Partial<Record<CEFRLevel, { male?: string; female?: string }>>>>;
  contents: Partial<Record<AppLanguage, Partial<Record<CEFRLevel, string>>>>;
}

export interface Story {
  id: string;
  title: string;
  titles?: Partial<Record<AppLanguage, string>>;
  subtitle?: string;
  subtitles?: Partial<Record<AppLanguage, string>>;
  profileImage?: string;
  quoteBackgroundImage?: string;
  audioMale?: string;
  audioFemale?: string;
  audio?: Partial<Record<AppLanguage, Partial<Record<CEFRLevel, { male?: string; female?: string }>>>>;
  author: string;
  description: string;
  originalLevel: CEFRLevel;
  contents: Partial<Record<AppLanguage, Partial<Record<CEFRLevel, string>>>>;
  chapters?: Chapter[];
  isUserContent?: boolean;
  category: MainCategory;
  newsSubCategory?: NewsSubCategory;
  language?: AppLanguage;
  communityHighlights?: CommunityHighlight[];
  isHidden?: boolean;
  isDeleted?: boolean;
}

export interface Flashcard {
  id: string;
  word: string;
  translation: string;
  context: string;
  // SM-2 Algorithm fields
  interval: number;
  repetition: number;
  easeFactor: number;
  nextReview: string; // ISO Date string
  createdAt: string;
}

export interface Quote {
  id: string;
  text: string;
  translations: Partial<Record<AppLanguage, string>>;
  source: string;
  sourceId: string;
  backgroundImage?: string;
  createdAt: string;
}

export type AppTheme = 'light' | 'dark' | 'eyeProtection';

export type AppLanguage = 'EN' | 'ES' | 'FR' | 'DE' | 'RU' | 'PT';

export type VoiceGender = 'male' | 'female';

export interface I18nDictionary {
  [key: string]: {
    [lang in AppLanguage]: string;
  };
}
