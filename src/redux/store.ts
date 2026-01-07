import countSlice from './features/countSlice';
import dictationArchiveSlice from './features/dictationArchiveSlice';
import dictationSlice from './features/dictationSlice';
import noteSlice from './features/noteSlice';
import settingsSlice from './features/settingsSlice';
import sidebarSlice from './features/sidebarSlice';
import videoPlayerSlice from './features/videoPlayerSlice';
import { configureStore, combineReducers } from '@reduxjs/toolkit';
import {
    persistStore,
    persistReducer,
    FLUSH,
    REHYDRATE,
    PAUSE,
    PERSIST,
    PURGE,
    REGISTER,
} from 'redux-persist';
import electronStorage from './electronStorage';

const persistConfig = {
    key: 'root',
    version: 1,
    storage: electronStorage,
    whitelist: ['dictationArchive', 'sidebar', 'videoPlayer', 'settings', 'notes'], // Persist slices
};
const rootReducer = combineReducers({
    count: countSlice,
    dictation: dictationSlice,
    dictationArchive: dictationArchiveSlice,
    notes: noteSlice,
    settings: settingsSlice,
    sidebar: sidebarSlice,
    videoPlayer: videoPlayerSlice,
});

const persistedReducer = persistReducer(persistConfig, rootReducer);

const store = configureStore({
    reducer: persistedReducer,
    middleware: getDefaultMiddleware =>
        getDefaultMiddleware({
            serializableCheck: {
                ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
            },
        }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export const persistor = persistStore(store);

export default store;
