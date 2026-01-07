import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { SubtitleItem } from '~/utils/youtube.service';

// Supported languages for captions
export type CaptionLanguage = 'en' | 'vi' | 'ja' | 'ko' | 'zh' | 'fr' | 'de' | 'es' | 'other';

export interface CaptionTrack {
  language: CaptionLanguage;
  languageLabel: string; // e.g., "English", "Tiếng Việt"
  subtitles: SubtitleItem[];
  rawContent?: string; // Original SRT content for editing
}

export interface DictationDocument {
  id: string;
  name: string;
  videoUrl: string;
  videoId: string;
  captions: CaptionTrack[]; // Multiple caption tracks
  primaryLanguage: CaptionLanguage; // The main language for dictation
  createdAt: number;
  updatedAt: number;
}

interface DictationArchiveState {
  documents: DictationDocument[];
  selectedDocumentId: string | null;
  editingDocumentId: string | null; // For edit panel
}

const initialState: DictationArchiveState = {
  documents: [],
  selectedDocumentId: null,
  editingDocumentId: null,
};

export const dictationArchiveSlice = createSlice({
  name: 'dictationArchive',
  initialState,
  reducers: {
    addDocument: (state, action: PayloadAction<Omit<DictationDocument, 'id' | 'createdAt' | 'updatedAt'>>) => {
      const newDocument: DictationDocument = {
        ...action.payload,
        id: crypto.randomUUID(),
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      state.documents.unshift(newDocument); // Add to beginning of list
    },

    removeDocument: (state, action: PayloadAction<string>) => {
      state.documents = state.documents.filter(doc => doc.id !== action.payload);
      if (state.selectedDocumentId === action.payload) {
        state.selectedDocumentId = null;
      }
    },

    updateDocument: (state, action: PayloadAction<{ id: string; updates: Partial<Omit<DictationDocument, 'id' | 'createdAt'>> }>) => {
      const index = state.documents.findIndex(doc => doc.id === action.payload.id);
      if (index !== -1) {
        state.documents[index] = {
          ...state.documents[index],
          ...action.payload.updates,
          updatedAt: Date.now(),
        };
      }
    },

    selectDocument: (state, action: PayloadAction<string | null>) => {
      state.selectedDocumentId = action.payload;
    },

    setEditingDocument: (state, action: PayloadAction<string | null>) => {
      state.editingDocumentId = action.payload;
    },

    updateCaptionTrack: (state, action: PayloadAction<{
      documentId: string;
      language: CaptionLanguage;
      updates: Partial<CaptionTrack>
    }>) => {
      const doc = state.documents.find(d => d.id === action.payload.documentId);
      if (doc) {
        const trackIndex = doc.captions.findIndex(c => c.language === action.payload.language);
        if (trackIndex !== -1) {
          doc.captions[trackIndex] = {
            ...doc.captions[trackIndex],
            ...action.payload.updates,
          };
          doc.updatedAt = Date.now();
        }
      }
    },

    addCaptionTrack: (state, action: PayloadAction<{ documentId: string; track: CaptionTrack }>) => {
      const doc = state.documents.find(d => d.id === action.payload.documentId);
      if (doc) {
        // Remove existing track with same language if exists
        doc.captions = doc.captions.filter(c => c.language !== action.payload.track.language);
        doc.captions.push(action.payload.track);
        doc.updatedAt = Date.now();
      }
    },

    removeCaptionTrack: (state, action: PayloadAction<{ documentId: string; language: CaptionLanguage }>) => {
      const doc = state.documents.find(d => d.id === action.payload.documentId);
      if (doc && doc.captions.length > 1) {
        doc.captions = doc.captions.filter(c => c.language !== action.payload.language);
        // Update primary language if removed
        if (doc.primaryLanguage === action.payload.language) {
          doc.primaryLanguage = doc.captions[0].language;
        }
        doc.updatedAt = Date.now();
      }
    },

    clearAllDocuments: (state) => {
      state.documents = [];
      state.selectedDocumentId = null;
      state.editingDocumentId = null;
    },
  },
});

export const {
  addDocument,
  removeDocument,
  updateDocument,
  selectDocument,
  setEditingDocument,
  updateCaptionTrack,
  addCaptionTrack,
  removeCaptionTrack,
  clearAllDocuments,
} = dictationArchiveSlice.actions;

export default dictationArchiveSlice.reducer;
