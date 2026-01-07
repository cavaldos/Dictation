import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

export interface AppSettings {
  minWordsPerSubtitle: number;
  loopDelayMs: number;
  accuracyThreshold: number;
  playbackSpeed: number;
}

const DEFAULT_SETTINGS: AppSettings = {
  minWordsPerSubtitle: 10,
  loopDelayMs: 1000,
  accuracyThreshold: 90,
  playbackSpeed: 1.0,
};

interface SettingsState {
  settings: AppSettings;
  isModalOpen: boolean;
}

const initialState: SettingsState = {
  settings: DEFAULT_SETTINGS,
  isModalOpen: false,
};

const settingsSlice = createSlice({
  name: 'settings',
  initialState,
  reducers: {
    updateSettings: (state, action: PayloadAction<Partial<AppSettings>>) => {
      state.settings = { ...state.settings, ...action.payload };
    },
    resetSettings: (state) => {
      state.settings = DEFAULT_SETTINGS;
    },
    openSettingsModal: (state) => {
      state.isModalOpen = true;
    },
    closeSettingsModal: (state) => {
      state.isModalOpen = false;
    },
    toggleSettingsModal: (state) => {
      state.isModalOpen = !state.isModalOpen;
    },
  },
});

export const { 
  updateSettings, 
  resetSettings, 
  openSettingsModal, 
  closeSettingsModal, 
  toggleSettingsModal 
} = settingsSlice.actions;

// Selectors - RootState will be imported from store after store is updated
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const selectSettings = (state: any) => state.settings.settings as AppSettings;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const selectSettingsModalOpen = (state: any) => state.settings.isModalOpen as boolean;

export { DEFAULT_SETTINGS };
export default settingsSlice.reducer;
