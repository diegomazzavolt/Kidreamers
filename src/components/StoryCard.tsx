/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion } from 'motion/react';
import { Story } from '../types';
import { useTheme } from '../contexts/ThemeContext';

interface StoryCardProps {
  story: Story;
  onClick: (id: string) => void;
}

export const StoryCard: React.FC<StoryCardProps> = ({ story, onClick }) => {
  const { language } = useTheme();
  const localizedTitle = story.titles?.[language] || story.title;

  return (
    <motion.div
      whileHover={{ scale: 1.02, y: -4 }}
      whileTap={{ scale: 0.98 }}
      onClick={() => onClick(story.id)}
      className="relative group cursor-pointer overflow-hidden rounded-3xl shadow-sm aspect-[4/5] flex flex-col bg-[var(--card-bg)]"
    >
      {/* Background Image */}
      {story.profileImage ? (
        <img 
          src={story.profileImage} 
          alt={story.title}
          referrerPolicy="no-referrer"
          className="absolute inset-0 w-full h-full object-cover grayscale-[0.2] group-hover:grayscale-0 transition-all duration-500"
        />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-800 dark:to-gray-900" />
      )}
      
      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-60 group-hover:opacity-80 transition-opacity duration-500" />

      {/* Content */}
      <div className="relative z-10 p-6 h-full flex flex-col justify-end text-white">
        <div className="space-y-2">
          <div className="flex flex-wrap gap-2 mb-1">
            <span className="px-2 py-0.5 bg-blue-600 rounded text-[9px] font-black tracking-widest uppercase">
              {story.category}
            </span>
            {story.newsSubCategory && (
              <span className="px-2 py-0.5 bg-white/20 backdrop-blur-md rounded text-[9px] font-bold tracking-widest uppercase border border-white/10">
                {story.newsSubCategory}
              </span>
            )}
          </div>
          
          <h3 className={`font-bold leading-tight tracking-tight font-sans group-hover:translate-x-1 transition-transform duration-300 ${story.category === 'NEWS' ? 'text-xl md:text-2xl' : 'text-2xl'}`}>
            {localizedTitle}
          </h3>
          
          <p className="text-sm opacity-80 font-serif italic line-clamp-1">
            by {story.author}
          </p>
        </div>
      </div>
    </motion.div>
  );
};
