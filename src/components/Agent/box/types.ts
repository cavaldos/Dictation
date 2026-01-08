export interface Message {
    id: string;
    type: 'user' | 'assistant';
    content: string;
    timestamp: Date;
    isStreaming?: boolean;
    model?: string;
    mode?: ChatMode;
    dictionaryData?: DictionaryResponse;
}

export interface AIModel {
    id: string;
    name: string;
    description: string;
}

export interface AIProvider {
    id: string;
    name: string;
    currentModel: string;
}

// Chat Modes
export type ChatMode = 'chat' | 'dictionary';

export interface ChatModeOption {
    id: ChatMode;
    name: string;
    icon: string;
    description: string;
    systemPrompt?: string;
}

// Dictionary Types
export interface DictionaryDefinition {
    meaning: string;
    example: string | null;
}

export interface PartOfSpeech {
    type: string;
    definitions: DictionaryDefinition[];
}

export interface DictionaryEntry {
    word: string;
    originalQuery?: string; // Original word if it was corrected
    phonetic: string;
    audio: string | null;
    partOfSpeech: PartOfSpeech[];
    synonyms: string[];
    antonyms: string[];
    notFound?: boolean;
    corrected?: boolean; // True if spelling was corrected
}

export interface DictionaryResponse {
    words: DictionaryEntry[];
}

// System Prompts
export const DICTIONARY_SYSTEM_PROMPT = `You are a professional English dictionary assistant. When given English word(s), provide comprehensive dictionary information in valid JSON format.

**IMPORTANT RULES:** 
1. Always respond with ONLY valid JSON, no markdown code blocks, no extra text
2. Support multiple words (comma or space separated)
3. **AUTO-CORRECT SPELLING**: If a word is misspelled, automatically correct it and provide the definition for the correct word. Set "corrected": true and include "originalQuery" with the misspelled version.
4. Only set "notFound": true if you absolutely cannot determine what word the user meant
5. Provide IPA phonetic notation
6. Include real example sentences
7. Provide at least 2-3 synonyms and antonyms when available

**SPELLING CORRECTION EXAMPLES:**
- "hapy" → correct to "happy"
- "beautful" → correct to "beautiful"  
- "recieve" → correct to "receive"
- "definately" → correct to "definitely"

**JSON Schema:**
{
  "words": [
    {
      "word": "string (the correct spelling)",
      "originalQuery": "string (the original input if misspelled, omit if correct)",
      "corrected": false,
      "phonetic": "string (IPA notation)",
      "audio": null,
      "partOfSpeech": [
        {
          "type": "string (noun/verb/adjective/adverb/preposition/conjunction/interjection/pronoun)",
          "definitions": [
            {
              "meaning": "string",
              "example": "string or null"
            }
          ]
        }
      ],
      "synonyms": ["string"],
      "antonyms": ["string"],
      "notFound": false
    }
  ]
}

Respond with ONLY the JSON object, nothing else.`;

export const CHAT_MODES: ChatModeOption[] = [
    {
        id: 'chat',
        name: 'Chat',
        icon: '💬',
        description: 'Normal conversation'
    },
    {
        id: 'dictionary',
        name: 'Dictionary',
        icon: '📖',
        description: 'Look up word definitions',
        systemPrompt: DICTIONARY_SYSTEM_PROMPT
    }
];
