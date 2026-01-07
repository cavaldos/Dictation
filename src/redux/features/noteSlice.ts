import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

export interface NoteGroup {
  id: string;
  name: string;
  color: string;
  words: string[];
  createdAt: number;
  updatedAt: number;
}

interface NoteState {
  groups: NoteGroup[];
  activeGroupId: string | null;
}

// Default colors for note groups
export const NOTE_COLORS = [
  { name: 'blue', bg: 'bg-blue-600/20', border: 'border-blue-500/50', text: 'text-blue-300', hover: 'hover:bg-blue-600/30' },
  { name: 'green', bg: 'bg-green-600/20', border: 'border-green-500/50', text: 'text-green-300', hover: 'hover:bg-green-600/30' },
  { name: 'purple', bg: 'bg-purple-600/20', border: 'border-purple-500/50', text: 'text-purple-300', hover: 'hover:bg-purple-600/30' },
  { name: 'orange', bg: 'bg-orange-600/20', border: 'border-orange-500/50', text: 'text-orange-300', hover: 'hover:bg-orange-600/30' },
  { name: 'pink', bg: 'bg-pink-600/20', border: 'border-pink-500/50', text: 'text-pink-300', hover: 'hover:bg-pink-600/30' },
  { name: 'yellow', bg: 'bg-yellow-600/20', border: 'border-yellow-500/50', text: 'text-yellow-300', hover: 'hover:bg-yellow-600/30' },
  { name: 'red', bg: 'bg-red-600/20', border: 'border-red-500/50', text: 'text-red-300', hover: 'hover:bg-red-600/30' },
  { name: 'cyan', bg: 'bg-cyan-600/20', border: 'border-cyan-500/50', text: 'text-cyan-300', hover: 'hover:bg-cyan-600/30' },
];

const initialState: NoteState = {
  groups: [
    {
      id: 'default',
      name: 'Vocabulary',
      color: 'blue',
      words: ['example', 'dictation', 'practice'],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    },
  ],
  activeGroupId: 'default',
};

export const noteSlice = createSlice({
  name: 'notes',
  initialState,
  reducers: {
    // Add a new note group
    addNoteGroup: (state, action: PayloadAction<{ name: string; color: string }>) => {
      const newGroup: NoteGroup = {
        id: crypto.randomUUID(),
        name: action.payload.name,
        color: action.payload.color,
        words: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      state.groups.push(newGroup);
      state.activeGroupId = newGroup.id;
    },

    // Remove a note group
    removeNoteGroup: (state, action: PayloadAction<string>) => {
      state.groups = state.groups.filter(group => group.id !== action.payload);
      if (state.activeGroupId === action.payload) {
        state.activeGroupId = state.groups[0]?.id || null;
      }
    },

    // Update note group (name, color)
    updateNoteGroup: (state, action: PayloadAction<{ id: string; name?: string; color?: string }>) => {
      const group = state.groups.find(g => g.id === action.payload.id);
      if (group) {
        if (action.payload.name !== undefined) group.name = action.payload.name;
        if (action.payload.color !== undefined) group.color = action.payload.color;
        group.updatedAt = Date.now();
      }
    },

    // Set active group
    setActiveGroup: (state, action: PayloadAction<string | null>) => {
      state.activeGroupId = action.payload;
    },

    // Add word to a group
    addWordToGroup: (state, action: PayloadAction<{ groupId: string; word: string }>) => {
      const group = state.groups.find(g => g.id === action.payload.groupId);
      if (group && !group.words.includes(action.payload.word)) {
        group.words.push(action.payload.word);
        group.updatedAt = Date.now();
      }
    },

    // Remove word from a group
    removeWordFromGroup: (state, action: PayloadAction<{ groupId: string; wordIndex: number }>) => {
      const group = state.groups.find(g => g.id === action.payload.groupId);
      if (group) {
        group.words.splice(action.payload.wordIndex, 1);
        group.updatedAt = Date.now();
      }
    },

    // Update word in a group
    updateWordInGroup: (state, action: PayloadAction<{ groupId: string; wordIndex: number; newWord: string }>) => {
      const group = state.groups.find(g => g.id === action.payload.groupId);
      if (group && action.payload.wordIndex < group.words.length) {
        group.words[action.payload.wordIndex] = action.payload.newWord;
        group.updatedAt = Date.now();
      }
    },

    // Clear all words in a group
    clearGroupWords: (state, action: PayloadAction<string>) => {
      const group = state.groups.find(g => g.id === action.payload);
      if (group) {
        group.words = [];
        group.updatedAt = Date.now();
      }
    },
  },
});

export const {
  addNoteGroup,
  removeNoteGroup,
  updateNoteGroup,
  setActiveGroup,
  addWordToGroup,
  removeWordFromGroup,
  updateWordInGroup,
  clearGroupWords,
} = noteSlice.actions;

export default noteSlice.reducer;
