import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

interface VideoPlayerState {
    videoWidth: number; // Width in pixels
    minWidth: number;
    maxWidth: number;
}

const initialState: VideoPlayerState = {
    videoWidth: 640, // Default width
    minWidth: 320,
    maxWidth: 1200,
};

export const videoPlayerSlice = createSlice({
    name: 'videoPlayer',
    initialState,
    reducers: {
        setVideoWidth: (state, action: PayloadAction<number>) => {
            const width = Math.max(state.minWidth, Math.min(state.maxWidth, action.payload));
            state.videoWidth = width;
        },
        resetVideoSize: (state) => {
            state.videoWidth = initialState.videoWidth;
        },
    },
});

export const {
    setVideoWidth,
    resetVideoSize,
} = videoPlayerSlice.actions;

export default videoPlayerSlice.reducer;
