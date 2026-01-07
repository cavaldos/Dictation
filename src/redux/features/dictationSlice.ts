import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { SubtitleItem } from '~/lib/youtube.service';

interface DictationState {
  subtitles: SubtitleItem[];
  currentIndex: number;
  completedIndices: number[]; // Using array instead of Set for serialization
  isStarted: boolean;
  // Video info from archive
  videoId: string | null;
  videoUrl: string | null;
  documentName: string | null;
  primaryLanguage: string | null;
}

const initialState: DictationState = {
  subtitles: [],
  currentIndex: 0,
  completedIndices: [],
  isStarted: false,
  videoId: null,
  videoUrl: null,
  documentName: null,
  primaryLanguage: null,
};

const dictationSlice = createSlice({
  name: 'dictation',
  initialState,
  reducers: {
    setSubtitles: (state, action: PayloadAction<SubtitleItem[]>) => {
      state.subtitles = action.payload;
      state.completedIndices = [];
      state.currentIndex = 0;
    },
    setCurrentIndex: (state, action: PayloadAction<number>) => {
      state.currentIndex = action.payload;
    },
    markCompleted: (state, action: PayloadAction<number>) => {
      if (!state.completedIndices.includes(action.payload)) {
        state.completedIndices.push(action.payload);
      }
    },
    setIsStarted: (state, action: PayloadAction<boolean>) => {
      state.isStarted = action.payload;
    },
    goToSubtitle: (state, action: PayloadAction<number>) => {
      const index = action.payload;
      if (index >= 0 && index < state.subtitles.length) {
        state.currentIndex = index;
      }
    },
    resetDictation: (state) => {
      state.subtitles = [];
      state.currentIndex = 0;
      state.completedIndices = [];
      state.isStarted = false;
      state.videoId = null;
      state.videoUrl = null;
      state.documentName = null;
      state.primaryLanguage = null;
    },
    // Load document from archive
    loadFromArchive: (state, action: PayloadAction<{
      videoId: string;
      videoUrl: string;
      documentName: string;
      primaryLanguage: string;
      subtitles: SubtitleItem[];
    }>) => {
      state.videoId = action.payload.videoId;
      state.videoUrl = action.payload.videoUrl;
      state.documentName = action.payload.documentName;
      state.primaryLanguage = action.payload.primaryLanguage;
      state.subtitles = action.payload.subtitles;
      state.currentIndex = 0;
      state.completedIndices = [];
      state.isStarted = false;
    },
  },
});

export const {
  setSubtitles,
  setCurrentIndex,
  markCompleted,
  setIsStarted,
  goToSubtitle,
  resetDictation,
  loadFromArchive,
} = dictationSlice.actions;

// Selectors
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const selectSubtitles = (state: any) => state.dictation.subtitles as SubtitleItem[];
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const selectCurrentIndex = (state: any) => state.dictation.currentIndex as number;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const selectCompletedIndices = (state: any) => new Set(state.dictation.completedIndices as number[]);
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const selectIsStarted = (state: any) => state.dictation.isStarted as boolean;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const selectVideoId = (state: any) => state.dictation.videoId as string | null;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const selectVideoUrl = (state: any) => state.dictation.videoUrl as string | null;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const selectDocumentName = (state: any) => state.dictation.documentName as string | null;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const selectPrimaryLanguage = (state: any) => state.dictation.primaryLanguage as string | null;

// Helper selector to find subtitle by time
export const findSubtitleByTime = (subtitles: SubtitleItem[], time: number): number => {
  if (subtitles.length === 0) return 0;

  // Find the subtitle that contains this time
  for (let i = 0; i < subtitles.length; i++) {
    const sub = subtitles[i];
    const endTime = sub.start + sub.dur;

    if (time >= sub.start && time < endTime) {
      return i;
    }
  }

  // If time is before first subtitle
  if (time < subtitles[0].start) {
    return 0;
  }

  // If time is after last subtitle, return last index
  return subtitles.length - 1;
};

export default dictationSlice.reducer;
