/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { 
  onAuthStateChanged, 
  signInWithPopup, 
  signOut, 
  User as FirebaseUser 
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, googleProvider, db } from '../lib/firebase';
import { CEFRLevel } from '../types';

interface User {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  preferredLevel?: CEFRLevel;
  preferredFontSize?: number;
  role?: 'admin' | 'user';
}

interface AuthContextType {
  user: User | null;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  updatePreferredLevel: (level: CEFRLevel) => void;
  updatePreferredFontSize: (size: number) => void;
  isLoginModalOpen: boolean;
  setLoginModalOpen: (open: boolean) => void;
  isAuthReady: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const ADMIN_EMAIL = "diegomazzavolt@gmail.com";

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoginModalOpen, setLoginModalOpen] = useState(false);
  const [isAuthReady, setIsAuthReady] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const userRef = doc(db, 'users', firebaseUser.uid);
        const userDoc = await getDoc(userRef);
        
        let userData: User = {
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName,
          photoURL: firebaseUser.photoURL,
        };

        if (userDoc.exists()) {
          userData = { ...userData, ...userDoc.data() };
        } else {
          // New user
          const role = firebaseUser.email === ADMIN_EMAIL ? 'admin' : 'user';
          userData.role = role;
          
          await setDoc(userRef, {
            ...userData,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
        }
        
        // Load preferred level from localStorage if not in Firestore
        if (!userData.preferredLevel) {
          const savedLevel = localStorage.getItem(`preferred-level-${firebaseUser.uid}`);
          if (savedLevel) {
            userData.preferredLevel = savedLevel as CEFRLevel;
          }
        }

        // Load preferred font size from localStorage if not in Firestore
        if (!userData.preferredFontSize) {
          const savedSize = localStorage.getItem(`preferred-font-size-${firebaseUser.uid}`);
          if (savedSize) {
            userData.preferredFontSize = parseInt(savedSize, 10);
          }
        }

        setUser(userData);
      } else {
        setUser(null);
      }
      setIsAuthReady(true);
    });

    return () => unsubscribe();
  }, []);

  const loginWithGoogle = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
      setLoginModalOpen(false);
    } catch (error) {
      console.error("Error logging in with Google:", error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };

  const updatePreferredLevel = async (level: CEFRLevel) => {
    if (user) {
      setUser({ ...user, preferredLevel: level });
      localStorage.setItem(`preferred-level-${user.uid}`, level);
      
      // Also update Firestore
      try {
        const userRef = doc(db, 'users', user.uid);
        await setDoc(userRef, { preferredLevel: level, updatedAt: serverTimestamp() }, { merge: true });
      } catch (error) {
        console.error("Error updating preferred level in Firestore:", error);
      }
    }
  };

  const updatePreferredFontSize = async (size: number) => {
    if (user) {
      setUser({ ...user, preferredFontSize: size });
      localStorage.setItem(`preferred-font-size-${user.uid}`, size.toString());
      
      try {
        const userRef = doc(db, 'users', user.uid);
        await setDoc(userRef, { preferredFontSize: size, updatedAt: serverTimestamp() }, { merge: true });
      } catch (error) {
        console.error("Error updating preferred font size in Firestore:", error);
      }
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      loginWithGoogle, 
      logout, 
      updatePreferredLevel, 
      updatePreferredFontSize,
      isLoginModalOpen, 
      setLoginModalOpen,
      isAuthReady
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
