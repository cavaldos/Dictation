import Groq from 'groq-sdk';
import dotenv from 'dotenv';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

let groqClient: Groq | null = null;
let currentGroqModel = 'llama-3.3-70b-versatile';

// Load .env from project root
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../../.env') });

function initializeGroq() {
  if (!groqClient) {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      throw new Error('GROQ_API_KEY is not set in environment variables');
    }
    groqClient = new Groq({ apiKey });
  }
  return groqClient;
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
  onChunk: (chunk: string) => void
) {
  try {
    const client = initializeGroq();
    
    const messages = [
      ...history.map(msg => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content
      })),
      { role: 'user' as const, content: message }
    ] as const;

    const stream = await client.chat.completions.create({
      model: currentGroqModel,
      messages: messages as any,
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
