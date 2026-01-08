import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
let genAI: GoogleGenerativeAI | null = null;
let currentModel = 'gemini-2.0-flash-exp';
let customApiKey = '';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

// Load .env from project root
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../../.env') });

function getApiKey(): string {
  // Priority: custom key > env key
  return customApiKey || process.env.GOOGLE_API_KEY || '';
}

export function setApiKey(key: string) {
  customApiKey = key;
  genAI = null; // Reset to reinitialize with new key
  console.log('Gemini API key updated');
}

function initializeGenAI() {
  if (!genAI) {
    const apiKey = getApiKey();
    if (!apiKey) {
      throw new Error('GOOGLE_API_KEY is not set. Please configure it in Settings or .env file.');
    }
    genAI = new GoogleGenerativeAI(apiKey);
  }
  return genAI;
}

export async function testConnection() {
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new Error('No API key configured');
  }
  
  // Test by listing models
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`
  );
  
  if (!response.ok) {
    throw new Error(`Invalid API key: ${response.statusText}`);
  }
  
  return true;
}

// Validate a specific key without saving
export async function validateKey(key: string) {
  if (!key) {
    throw new Error('No API key provided');
  }
  
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models?key=${key}`
  );
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error?.message || `Invalid API key: ${response.statusText}`);
  }
  
  return true;
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
    const apiKey = getApiKey();
    if (!apiKey) {
      throw new Error('GOOGLE_API_KEY is not set. Please configure it in Settings or .env file.');
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
  onChunk: (chunk: string) => void,
  systemPrompt?: string
) {
  try {
    const ai = initializeGenAI();
    const model = ai.getGenerativeModel({ 
      model: currentModel,
      systemInstruction: systemPrompt || undefined
    });

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
