import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
let genAI: GoogleGenerativeAI | null = null;
let currentModel = 'gemini-2.0-flash-exp';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

// Load .env from project root
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../../.env') });


function initializeGenAI() {
  if (!genAI) {
    const apiKey = process.env.GOOGLE_API_KEY;
    if (!apiKey) {
      throw new Error('GOOGLE_API_KEY is not set in environment variables');
    }
    genAI = new GoogleGenerativeAI(apiKey);
  }
  return genAI;
}

export function setModel(modelId: string) {
  currentModel = modelId;
  console.log('Gemini model changed to:', modelId);
}

export function getModel() {
  return currentModel;
}

export async function listGeminiModels() {
  try {
    const apiKey = process.env.GOOGLE_API_KEY;
    if (!apiKey) {
      throw new Error('GOOGLE_API_KEY is not set in environment variables');
    }

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`
    );
    
    if (!response.ok) {
      throw new Error(`Failed to fetch models: ${response.statusText}`);
    }

    const data = await response.json();
    
    const chatModels = data.models
      .filter((model: any) => 
        model.supportedGenerationMethods?.includes('generateContent') &&
        model.name?.includes('gemini')
      )
      .map((model: any) => ({
        id: model.name.replace('models/', ''),
        name: formatModelName(model.displayName || model.name),
        description: model.description?.slice(0, 50) || 'Google AI Model',
      }));
    
    return chatModels;
  } catch (error) {
    console.error('Error listing Gemini models:', error);
    throw error;
  }
}

function formatModelName(name: string) {
  return name
    .replace('models/', '')
    .replace(/-/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase());
}

export async function chatWithGeminiStream(
  history: Array<{role: string, content: string}>, 
  message: string, 
  onChunk: (chunk: string) => void
) {
  try {
    const ai = initializeGenAI();
    const model = ai.getGenerativeModel({ model: currentModel });

    const formattedHistory = history.map(msg => ({
      role: msg.role === 'assistant' ? 'model' : msg.role,
      parts: [{ text: msg.content }]
    }));

    const chat = model.startChat({
      history: formattedHistory,
      generationConfig: {
        maxOutputTokens: 2048,
        temperature: 0.7,
      },
    });

    const result = await chat.sendMessageStream(message);
    
    let fullResponse = '';
    for await (const chunk of result.stream) {
      const chunkText = chunk.text();
      fullResponse += chunkText;
      if (onChunk) {
        onChunk(chunkText);
      }
    }
    
    return fullResponse;
  } catch (error) {
    console.error('Gemini API stream error:', error);
    throw error;
  }
}
