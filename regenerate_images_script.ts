
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, updateDoc, doc } from 'firebase/firestore';
import { GoogleGenAI } from "@google/genai";
import fs from 'fs';

const firebaseConfig = JSON.parse(fs.readFileSync('./firebase-applet-config.json', 'utf8'));
const app = initializeApp(firebaseConfig);
const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

async function generateImage(visualPrompt) {
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: {
      parts: [
        {
          text: `Generate a high-quality book cover image based on this detailed visual prompt: ${visualPrompt}. Aspect ratio: 16:9.`,
        },
      ],
    },
    config: {
      imageConfig: {
        aspectRatio: "16:9",
      },
    },
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
  console.log("Fetching stories...");
  const querySnapshot = await getDocs(collection(db, "stories"));
  const stories = [];
  querySnapshot.forEach((doc) => {
    stories.push({ id: doc.id, ...doc.data() });
  });

  console.log(`Found ${stories.length} stories. Starting regeneration...`);

  for (const story of stories) {
    try {
      console.log(`Processing: ${story.title}`);
      const content = story.contents?.C1 || story.contents?.B2 || story.description || "";
      const visualPrompt = await generatePrompt(story.title, content);
      const imageUrl = await generateImage(visualPrompt);
      
      await updateDoc(doc(db, "stories", story.id), {
        coverImage: imageUrl
      });
      console.log(`Updated: ${story.title}`);
    } catch (e) {
      console.error(`Failed to update ${story.title}:`, e);
    }
  }
  console.log("Done!");
  process.exit(0);
}

run();
