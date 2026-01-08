import Groq from 'groq-sdk';
import dotenv from 'dotenv';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

let groqClient: Groq | null = null;
let currentGroqModel = 'llama-3.3-70b-versatile';
let customApiKey = '';

// Load .env from project root
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../../.env') });

function getApiKey(): string {
  // Priority: custom key > env key
  return customApiKey || process.env.GROQ_API_KEY || '';
}

export function setApiKey(key: string) {
  customApiKey = key;
  groqClient = null; // Reset to reinitialize with new key
  console.log('Groq API key updated');
}

function initializeGroq() {
  if (!groqClient) {
    const apiKey = getApiKey();
    if (!apiKey) {
      throw new Error('GROQ_API_KEY is not set. Please configure it in Settings or .env file.');
    }
    groqClient = new Groq({ apiKey });
  }
  return groqClient;
}

export async function testConnection() {
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new Error('No API key configured');
  }
  
  // Test by listing models
  const client = new Groq({ apiKey });
  await client.models.list();
  
  return true;
}

// Validate a specific key without saving
export async function validateKey(key: string) {
  if (!key) {
    throw new Error('No API key provided');
  }
  
  try {
    const client = new Groq({ apiKey: key });
    await client.models.list();
    return true;
  } catch (error) {
    throw new Error((error as Error).message || 'Invalid API key');
  }
}

export function setGroqModel(modelId: string) {
  currentGroqModel = modelId;
  console.log('Groq model changed to:', modelId);
}

export function getGroqModel() {
  return currentGroqModel;
}

export async function listGroqModels() {
  try {
    const client = initializeGroq();
    const response = await client.models.list();
    
    const chatModels = response.data
      .filter(model => model.id && !model.id.includes('whisper') && !model.id.includes('tool-use'))
      .map(model => ({
        id: model.id,
        name: formatModelName(model.id),
        description: model.owned_by || 'Groq Model',
      }));
    
    return chatModels;
  } catch (error) {
    console.error('Error listing Groq models:', error);
    throw error;
  }
}

function formatModelName(modelId: string) {
  return modelId
    .replace(/-/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase())
    .replace(/(\d+)b/gi, '$1B')
    .replace(/Llama/g, 'Llama')
    .replace(/Mixtral/g, 'Mixtral')
    .replace(/Gemma/g, 'Gemma');
}

export async function chatWithGroqStream(
  history: Array<{role: string, content: string}>, 
  message: string, 
  onChunk: (chunk: string) => void,
  systemPrompt?: string
) {
  try {
    const client = initializeGroq();
    
    const messages: Array<{role: 'system' | 'user' | 'assistant', content: string}> = [];
    
    // Add system prompt if provided
    if (systemPrompt) {
      messages.push({ role: 'system', content: systemPrompt });
    }
    
    // Add history
    messages.push(...history.map(msg => ({
      role: msg.role as 'user' | 'assistant',
      content: msg.content
    })));
    
    // Add current message
    messages.push({ role: 'user', content: message });

    const stream = await client.chat.completions.create({
      model: currentGroqModel,
      messages: messages,
      temperature: 0.7,
      max_tokens: 2048,
      stream: true,
    });

    let fullResponse = '';
    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content || '';
      if (content) {
        fullResponse += content;
        if (onChunk) {
          onChunk(content);
        }
      }
    }

    return fullResponse;
  } catch (error) {
    console.error('Groq API stream error:', error);
    throw error;
  }
}
