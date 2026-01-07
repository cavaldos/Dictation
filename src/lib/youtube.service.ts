export interface SubtitleItem {
  start: number;
  dur: number;
  text: string;
  translatedText?: string; // Secondary language text
}

/**
 * Extract video ID from YouTube URL
 */
export function extractVideoId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
    /^([a-zA-Z0-9_-]{11})$/
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) {
      return match[1];
    }
  }
  return null;
}

const MIN_WORDS_PER_SUBTITLE = 8;

/**
 * Count words in a string
 */
function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(word => word.length > 0).length;
}

/**
 * Merge short subtitles together to ensure minimum word count
 * - If a subtitle has >= minWords: keep it as is
 * - If a subtitle has < minWords: merge with next subtitle(s) until reaching minWords
 */
function mergeShortSubtitles(subtitles: SubtitleItem[], minWords: number = MIN_WORDS_PER_SUBTITLE): SubtitleItem[] {
  if (subtitles.length === 0) return [];

  const merged: SubtitleItem[] = [];
  let current: SubtitleItem | null = null;

  for (const subtitle of subtitles) {
    if (!current) {
      current = { ...subtitle };
      continue;
    }

    const currentWordCount = countWords(current.text);
    
    if (currentWordCount >= minWords) {
      // Current subtitle is long enough, save it and start new one
      merged.push(current);
      current = { ...subtitle };
    } else {
      // Current subtitle is too short, merge with this one
      current.text = current.text + ' ' + subtitle.text;
      current.dur = (subtitle.start + subtitle.dur) - current.start;
    }
  }

  // Don't forget the last one
  if (current) {
    merged.push(current);
  }

  return merged;
}

/**
 * Parse SRT format text to subtitle items
 * SRT format:
 * 1
 * 00:00:01,000 --> 00:00:04,000
 * Hello world
 * 
 * 2
 * 00:00:05,000 --> 00:00:08,000
 * This is a test
 */
export function parseSRT(srtText: string, minWordsPerSubtitle: number = MIN_WORDS_PER_SUBTITLE): SubtitleItem[] {
  const subtitles = parseSRTRaw(srtText);
  // Merge short subtitles
  return mergeShortSubtitles(subtitles, minWordsPerSubtitle);
}

/**
 * Parse SRT without merging - keeps original structure for translation mapping
 */
export function parseSRTRaw(srtText: string): SubtitleItem[] {
  const subtitles: SubtitleItem[] = [];
  
  // Split by double newline or numbered entries
  const blocks = srtText.trim().split(/\n\s*\n/);
  
  for (const block of blocks) {
    const lines = block.trim().split('\n');
    if (lines.length < 2) continue;
    
    // Find the timestamp line (contains -->)
    let timestampLineIndex = -1;
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].includes('-->')) {
        timestampLineIndex = i;
        break;
      }
    }
    
    if (timestampLineIndex === -1) continue;
    
    const timestampLine = lines[timestampLineIndex];
    const textLines = lines.slice(timestampLineIndex + 1);
    
    // Parse timestamp: 00:00:01,000 --> 00:00:04,000
    const match = timestampLine.match(/(\d{2}:\d{2}:\d{2}[,\.]\d{3})\s*-->\s*(\d{2}:\d{2}:\d{2}[,\.]\d{3})/);
    if (!match) continue;
    
    const startTime = parseTimestamp(match[1]);
    const endTime = parseTimestamp(match[2]);
    const text = textLines.join(' ').trim();
    
    if (text) {
      subtitles.push({
        start: startTime,
        dur: endTime - startTime,
        text: text,
      });
    }
  }
  
  return subtitles;
}

/**
 * Merge two subtitle arrays (primary + translated) based on timing
 * Maps translated subtitles to primary based on start time proximity
 */
export function mergeSubtitlesWithTranslation(
  primary: SubtitleItem[], 
  translated: SubtitleItem[],
  minWordsPerSubtitle: number = MIN_WORDS_PER_SUBTITLE
): SubtitleItem[] {
  // First, create a map of translated subtitles by approximate start time
  const translatedMap = new Map<number, string>();
  
  for (const sub of translated) {
    // Round to nearest 0.5 second for matching
    const key = Math.round(sub.start * 2) / 2;
    translatedMap.set(key, sub.text);
  }
  
  // Map translations to primary subtitles
  const withTranslation = primary.map(sub => {
    const key = Math.round(sub.start * 2) / 2;
    // Try to find matching translation within ±1 second
    let translatedText = translatedMap.get(key);
    if (!translatedText) {
      translatedText = translatedMap.get(key - 0.5) || translatedMap.get(key + 0.5);
    }
    return {
      ...sub,
      translatedText: translatedText || undefined,
    };
  });
  
  // Merge short subtitles while preserving translations
  return mergeShortSubtitlesWithTranslation(withTranslation, minWordsPerSubtitle);
}

/**
 * Merge short subtitles while preserving translations
 */
function mergeShortSubtitlesWithTranslation(
  subtitles: SubtitleItem[], 
  minWords: number = MIN_WORDS_PER_SUBTITLE
): SubtitleItem[] {
  if (subtitles.length === 0) return [];

  const merged: SubtitleItem[] = [];
  let current: SubtitleItem | null = null;

  for (const subtitle of subtitles) {
    if (!current) {
      current = { ...subtitle };
      continue;
    }

    const currentWordCount = countWords(current.text);
    
    if (currentWordCount >= minWords) {
      merged.push(current);
      current = { ...subtitle };
    } else {
      // Merge text
      current.text = current.text + ' ' + subtitle.text;
      // Merge translated text if exists
      if (current.translatedText || subtitle.translatedText) {
        current.translatedText = [current.translatedText, subtitle.translatedText]
          .filter(Boolean)
          .join(' ');
      }
      current.dur = (subtitle.start + subtitle.dur) - current.start;
    }
  }

  if (current) {
    merged.push(current);
  }

  return merged;
}

/**
 * Parse timestamp string to seconds
 * Format: 00:00:01,000 or 00:00:01.000
 */
function parseTimestamp(timestamp: string): number {
  const normalized = timestamp.replace(',', '.');
  const match = normalized.match(/(\d{2}):(\d{2}):(\d{2})\.(\d{3})/);
  if (!match) return 0;
  
  const hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  const seconds = parseInt(match[3], 10);
  const milliseconds = parseInt(match[4], 10);
  
  return hours * 3600 + minutes * 60 + seconds + milliseconds / 1000;
}

/**
 * Normalize text for comparison (remove punctuation, lowercase)
 */
export function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Normalize a single word for comparison
 */
function normalizeWord(word: string): string {
  return word.toLowerCase().replace(/[^\w]/g, '');
}

export interface WordComparison {
  word: string;
  expected: string;
  isCorrect: boolean;
  isMissing: boolean;
  isExtra: boolean;
}

/**
 * Compare user input with original text word by word
 * Returns detailed comparison for each word
 */
export function compareWordsDetailed(original: string, userInput: string): WordComparison[] {
  const originalWords = original.trim().split(/\s+/);
  const userWords = userInput.trim().split(/\s+/).filter(w => w.length > 0);
  
  const result: WordComparison[] = [];
  
  // Use dynamic programming for word alignment (similar to diff)
  const m = originalWords.length;
  const n = userWords.length;
  
  // Simple approach: compare word by word with some flexibility
  let i = 0; // original index
  let j = 0; // user index
  
  while (i < m || j < n) {
    if (i >= m) {
      // Extra words from user
      result.push({
        word: userWords[j],
        expected: '',
        isCorrect: false,
        isMissing: false,
        isExtra: true,
      });
      j++;
    } else if (j >= n) {
      // Missing words from user
      result.push({
        word: '',
        expected: originalWords[i],
        isCorrect: false,
        isMissing: true,
        isExtra: false,
      });
      i++;
    } else {
      const normalizedOriginal = normalizeWord(originalWords[i]);
      const normalizedUser = normalizeWord(userWords[j]);
      
      if (normalizedOriginal === normalizedUser) {
        // Words match
        result.push({
          word: userWords[j],
          expected: originalWords[i],
          isCorrect: true,
          isMissing: false,
          isExtra: false,
        });
        i++;
        j++;
      } else {
        // Check if next user word matches current original (user has extra word)
        const nextUserMatches = j + 1 < n && normalizeWord(userWords[j + 1]) === normalizedOriginal;
        // Check if next original word matches current user (user missed a word)
        const nextOriginalMatches = i + 1 < m && normalizeWord(originalWords[i + 1]) === normalizedUser;
        
        if (nextUserMatches) {
          // User typed an extra word
          result.push({
            word: userWords[j],
            expected: '',
            isCorrect: false,
            isMissing: false,
            isExtra: true,
          });
          j++;
        } else if (nextOriginalMatches) {
          // User missed a word
          result.push({
            word: '',
            expected: originalWords[i],
            isCorrect: false,
            isMissing: true,
            isExtra: false,
          });
          i++;
        } else {
          // Words don't match
          result.push({
            word: userWords[j],
            expected: originalWords[i],
            isCorrect: false,
            isMissing: false,
            isExtra: false,
          });
          i++;
          j++;
        }
      }
    }
  }
  
  return result;
}

/**
 * Compare user input with original text
 */
export function compareTexts(original: string, userInput: string, accuracyThreshold: number = 90): {
  isCorrect: boolean;
  accuracy: number;
} {
  const normalizedOriginal = normalizeText(original);
  const normalizedInput = normalizeText(userInput);

  if (normalizedOriginal === normalizedInput) {
    return { isCorrect: true, accuracy: 100 };
  }

  // Calculate accuracy using Levenshtein distance
  const distance = levenshteinDistance(normalizedOriginal, normalizedInput);
  const maxLength = Math.max(normalizedOriginal.length, normalizedInput.length);
  const accuracy = Math.round(((maxLength - distance) / maxLength) * 100);

  return { isCorrect: accuracy >= accuracyThreshold, accuracy };
}

/**
 * Levenshtein distance for text comparison
 */
function levenshteinDistance(str1: string, str2: string): number {
  const m = str1.length;
  const n = str2.length;
  const dp: number[][] = Array(m + 1).fill(null).map(() => Array(n + 1).fill(0));

  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (str1[i - 1] === str2[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        dp[i][j] = Math.min(
          dp[i - 1][j] + 1,
          dp[i][j - 1] + 1,
          dp[i - 1][j - 1] + 1
        );
      }
    }
  }

  return dp[m][n];
}
