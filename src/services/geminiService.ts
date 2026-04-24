/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { GoogleGenAI, Type, Modality } from "@google/genai";
import { CEFRLevel, AppLanguage, VoiceGender } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export const translateWordWithAI = async (word: string, targetLang: AppLanguage): Promise<string> => {
  const langMap: Record<AppLanguage, string> = {
    'PT': 'Portuguese',
    'EN': 'English',
    'ES': 'Spanish',
    'FR': 'French',
    'DE': 'German',
    'RU': 'Russian'
  };

  const prompt = `Translate the following word/phrase to ${langMap[targetLang]}. Provide ONLY the translation, no extra text.
  Word: ${word}`;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
  });

  return response.text.trim();
};

export const generateSpeechWithAI = async (text: string, voiceGender: VoiceGender = 'female', customFilename?: string): Promise<string> => {
  const voiceName = voiceGender === 'male' ? 'Puck' : 'Kore';
  
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-preview-tts",
    contents: [{ parts: [{ text: `Read this naturally and clearly: ${text}` }] }],
    config: {
      responseModalities: [Modality.AUDIO],
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: { voiceName },
        },
      },
    } as any,
  });

  const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
  if (!base64Audio) {
    throw new Error("Failed to generate speech audio");
  }

  // ===== DOWNLOAD CORRETO DO ÁUDIO TTS (PCM16 → WAV) =====
  try {
    const binaryString = atob(base64Audio);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);

    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    const sampleRate = 24000; // padrão do Gemini TTS
    const numChannels = 1;
    const bitsPerSample = 16;

    const wavBuffer = new ArrayBuffer(44 + bytes.length);
    const view = new DataView(wavBuffer);

    const writeString = (view: DataView, offset: number, str: string) => {
      for (let i = 0; i < str.length; i++) {
        view.setUint8(offset + i, str.charCodeAt(i));
      }
    };

    writeString(view, 0, 'RIFF');
    view.setUint32(4, 36 + bytes.length, true);
    writeString(view, 8, 'WAVE');
    writeString(view, 12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, numChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * numChannels * bitsPerSample / 8, true);
    view.setUint16(32, numChannels * bitsPerSample / 8, true);
    view.setUint16(34, bitsPerSample, true);
    writeString(view, 36, 'data');
    view.setUint32(40, bytes.length, true);

    new Uint8Array(wavBuffer, 44).set(bytes);

    const blob = new Blob([wavBuffer], { type: 'audio/wav' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = customFilename ? `${customFilename}.wav` : `narration_${voiceGender}.wav`;
    a.click();
    URL.revokeObjectURL(url);
  } catch (e) {
    console.warn("Erro ao montar WAV:", e);
  }
  // =========================================================

  return base64Audio;
};
