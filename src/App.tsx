/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom';
import { ThemeProvider, useTheme } from './contexts/ThemeContext';
import { DeckProvider } from './contexts/DeckContext';
import { QuoteProvider } from './contexts/QuoteContext';
import { StoryProvider } from './contexts/StoryContext';
import { SettingsProvider } from './contexts/SettingsContext';
import { Home } from './Home';
import { Reader } from './Reader';
import { Profile } from './Profile';
import { Submit } from './Submit';
import { NotFound } from './NotFound';

import { AuthProvider, useAuth } from './contexts/AuthContext';
import { LoginModal } from './components/LoginModal';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, setLoginModalOpen, isAuthReady } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthReady && !user) {
      setLoginModalOpen(true);
      navigate('/', { replace: true });
    }
  }, [user, navigate, setLoginModalOpen, isAuthReady]);

  if (!isAuthReady || !user) return null;
  return <>{children}</>;
};

const AppContent: React.FC = () => {
  const { isAuthReady } = useAuth();
  const { t } = useTheme();

  useEffect(() => {
    document.title = t('app.title');
  }, [t]);

  if (!isAuthReady) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-[var(--background)]">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/read/:id" element={<Reader />} />
        <Route 
          path="/profile" 
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/submit" 
          element={
            <ProtectedRoute>
              <Submit />
            </ProtectedRoute>
          } 
        />
        <Route path="*" element={<NotFound />} />
      </Routes>
      <LoginModal />
    </BrowserRouter>
  );
};

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <StoryProvider>
          <SettingsProvider>
            <DeckProvider>
              <QuoteProvider>
                <AppContent />
              </QuoteProvider>
            </DeckProvider>
          </SettingsProvider>
        </StoryProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
