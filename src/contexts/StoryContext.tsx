/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { 
  collection, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  deleteDoc,
  setDoc,
  doc, 
  query, 
  orderBy,
  serverTimestamp 
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Story } from '../types';
import { stories as initialStories } from '../stories';

interface StoryContextType {
  stories: Story[];
  addStory: (story: Omit<Story, 'id'>) => Promise<void>;
  updateStory: (id: string, updates: Partial<Story>) => Promise<void>;
  deleteStory: (id: string) => Promise<void>;
  getStory: (id: string) => Story | undefined;
  isLoading: boolean;
}

const StoryContext = createContext<StoryContextType | undefined>(undefined);

export const StoryProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [stories, setStories] = useState<Story[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const q = collection(db, 'stories');
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedStories = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Story[];
      
      // Merge initial stories with Firestore stories
      const mergedStories = [...fetchedStories];
      const fetchedIds = new Set(fetchedStories.map(s => s.id));
      
      initialStories.forEach(s => {
        if (!fetchedIds.has(s.id)) {
          mergedStories.push(s);
        }
      });

      // Filter out deleted stories
      const finalStories = mergedStories.filter(s => !(s as any).isDeleted);

      // Sort by createdAt or updatedAt
      finalStories.sort((a, b) => {
        const dateA = (a as any).createdAt?.toDate?.() || (a as any).createdAt || new Date(0);
        const dateB = (b as any).createdAt?.toDate?.() || (b as any).createdAt || new Date(0);
        return dateB - dateA;
      });

      setStories(finalStories);
      setIsLoading(false);
    }, (error) => {
      console.error("Error fetching stories:", error);
      setStories(initialStories);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const addStory = async (newStory: Omit<Story, 'id'>) => {
    try {
      await addDoc(collection(db, 'stories'), {
        ...newStory,
        createdAt: serverTimestamp(),
      });
    } catch (error) {
      console.error("Error adding story:", error);
      throw error;
    }
  };

  const updateStory = async (id: string, updates: Partial<Story>) => {
    try {
      console.log('StoryContext: Updating story', id, updates);
      const storyRef = doc(db, 'stories', id);
      const existingStory = stories.find(s => s.id === id);
      
      let dataToSet: any = {
        ...updates,
        updatedAt: serverTimestamp(),
      };

      // If it's an initial story being saved to Firestore for the first time, 
      // we need to include ALL its data, not just the updates.
      const isInitialStory = initialStories.some(s => s.id === id);
      const isInFirestore = existingStory && (existingStory as any).createdAt !== undefined;

      if (isInitialStory && !isInFirestore) {
        const initialData = initialStories.find(s => s.id === id);
        dataToSet = {
          ...initialData,
          ...dataToSet,
          createdAt: serverTimestamp(),
        };
      } else if (existingStory && !(existingStory as any).createdAt) {
        dataToSet.createdAt = serverTimestamp();
      }

      await setDoc(storyRef, dataToSet, { merge: true });
      console.log('StoryContext: Update successful');
    } catch (error) {
      console.error("Error updating story:", error);
      throw error;
    }
  };

  const deleteStory = async (id: string) => {
    try {
      console.log('StoryContext: Deleting story', id);
      const storyRef = doc(db, 'stories', id);
      const existingStory = stories.find(s => s.id === id);

      let dataToSet: any = {
        isDeleted: true,
        updatedAt: serverTimestamp(),
      };

      const isInitialStory = initialStories.some(s => s.id === id);
      const isInFirestore = existingStory && (existingStory as any).createdAt !== undefined;

      if (isInitialStory && !isInFirestore) {
        const initialData = initialStories.find(s => s.id === id);
        dataToSet = {
          ...initialData,
          ...dataToSet,
          createdAt: serverTimestamp(),
        };
      } else if (existingStory && !(existingStory as any).createdAt) {
        dataToSet.createdAt = serverTimestamp();
      }

      // Instead of hard deleting, we mark as deleted to handle initial stories correctly
      await setDoc(storyRef, dataToSet, { merge: true });
      console.log('StoryContext: Delete successful');
    } catch (error) {
      console.error("Error deleting story:", error);
      throw error;
    }
  };

  const getStory = (id: string) => {
    return stories.find((s) => s.id === id);
  };

  return (
    <StoryContext.Provider value={{ stories, addStory, updateStory, deleteStory, getStory, isLoading }}>
      {children}
    </StoryContext.Provider>
  );
};

export const useStories = () => {
  const context = useContext(StoryContext);
  if (context === undefined) {
    throw new Error('useStories must be used within a StoryProvider');
  }
  return context;
};
