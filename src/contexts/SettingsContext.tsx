/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { 
  collection, 
  onSnapshot, 
  doc, 
  setDoc,
  serverTimestamp 
} from 'firebase/firestore';
import { db } from '../lib/firebase';

interface SettingsContextType {
  logoUrl: string | null;
  logoGallery: string[];
  setLogo: (url: string) => Promise<void>;
  addToGallery: (url: string) => Promise<void>;
  removeFromGallery: (url: string) => Promise<void>;
  isLoading: boolean;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [logoGallery, setLogoGallery] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Listen to global settings
    const settingsRef = doc(db, 'settings', 'appearance');
    
    const unsubscribe = onSnapshot(settingsRef, (doc) => {
      if (doc.exists()) {
        const data = doc.data();
        setLogoUrl(data.logoUrl || null);
        setLogoGallery(data.logoGallery || []);
      }
      setIsLoading(false);
    }, (error) => {
      console.error("Error fetching settings:", error);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const setLogo = async (url: string) => {
    try {
      const settingsRef = doc(db, 'settings', 'appearance');
      await setDoc(settingsRef, {
        logoUrl: url,
        updatedAt: serverTimestamp()
      }, { merge: true });
    } catch (error) {
      console.error("Error setting logo:", error);
      throw error;
    }
  };

  const addToGallery = async (url: string) => {
    try {
      const settingsRef = doc(db, 'settings', 'appearance');
      const newGallery = Array.from(new Set([url, ...logoGallery]));
      await setDoc(settingsRef, {
        logoGallery: newGallery,
        updatedAt: serverTimestamp()
      }, { merge: true });
    } catch (error) {
      console.error("Error adding to gallery:", error);
      throw error;
    }
  };

  const removeFromGallery = async (url: string) => {
    try {
      const settingsRef = doc(db, 'settings', 'appearance');
      const newGallery = logoGallery.filter(item => item !== url);
      const updates: any = {
        logoGallery: newGallery,
        updatedAt: serverTimestamp()
      };
      if (logoUrl === url) {
        updates.logoUrl = null;
      }
      await setDoc(settingsRef, updates, { merge: true });
    } catch (error) {
      console.error("Error removing from gallery:", error);
      throw error;
    }
  };

  return (
    <SettingsContext.Provider value={{ 
      logoUrl, 
      logoGallery, 
      setLogo, 
      addToGallery, 
      removeFromGallery, 
      isLoading 
    }}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};
