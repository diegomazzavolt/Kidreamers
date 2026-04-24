
import { stories } from './src/stories.js';
import { GoogleGenAI } from "@google/genai";
import fs from 'fs';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

async function generateImage(visualPrompt) {
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: {
      parts: [{ text: `Generate a high-quality book cover image based on this detailed visual prompt: ${visualPrompt}. Aspect ratio: 16:9.` }],
    },
    config: { imageConfig: { aspectRatio: "16:9" } },
  });
  const imagePart = response.candidates?.[0]?.content?.parts?.find(p => p.inlineData);
  return `data:image/png;base64,${imagePart.inlineData.data}`;
}

async function generatePrompt(title, content) {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Create a highly descriptive visual prompt for a story cover in English (max 50 words) for the story titled "${title}". Focus on: Main characters, specific colors/lighting, detailed setting, and the main action. STYLE: Polished Pixar-style 3D animation. STORY: ${content.substring(0, 1000)}`,
  });
  return response.text.trim();
}

async function run() {
  const updatedStories = [];
  for (const story of stories) {
    console.log(`Processing: ${story.title}`);
    const content = story.contents?.EN?.C1 || story.contents?.PT?.C1 || story.description || "";
    const visualPrompt = await generatePrompt(story.title, content);
    const imageUrl = await generateImage(visualPrompt);
    updatedStories.push({ ...story, coverImage: imageUrl });
  }

  const fileContent = `/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Story } from './types';

export const stories: Story[] = ${JSON.stringify(updatedStories, null, 2)};
`;

  fs.writeFileSync('./src/stories.ts', fileContent);
  console.log("Updated src/stories.ts");
  process.exit(0);
}

run();
