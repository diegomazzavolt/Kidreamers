/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { Home, Compass } from 'lucide-react';
import { useTheme } from './contexts/ThemeContext';

export const NotFound: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTheme();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white dark:bg-gray-950 transition-colors duration-300 p-6 text-center">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md"
      >
        <div className="relative mb-8">
          <motion.div
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ repeat: Infinity, duration: 4 }}
            className="text-9xl font-black opacity-10 select-none"
          >
            404
          </motion.div>
          <div className="absolute inset-0 flex items-center justify-center">
            <Compass size={80} className="text-blue-600 animate-pulse" />
          </div>
        </div>

        <h1 className="text-3xl font-bold mb-4 tracking-tight">Página Perdida na Floresta</h1>
        <p className="text-lg opacity-60 mb-10 leading-relaxed">
          Parece que você seguiu uma trilha que ainda não foi escrita. Que tal voltar para a biblioteca e começar uma nova aventura?
        </p>

        <button
          onClick={() => navigate('/')}
          className="inline-flex items-center gap-3 px-8 py-4 bg-gray-900 dark:bg-white dark:text-black text-white rounded-2xl font-bold hover:scale-105 transition-transform shadow-xl shadow-gray-500/20"
        >
          <Home size={20} /> Voltar para o Início
        </button>
      </motion.div>
    </div>
  );
};
