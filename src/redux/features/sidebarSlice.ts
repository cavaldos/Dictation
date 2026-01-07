import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

interface SidebarState {
    showLeftSide: boolean;
    showRightSide: boolean;
    leftSideWidth: number;
    rightSideWidth: number;
}

const initialState: SidebarState = {
    showLeftSide: true,
    showRightSide: true,
    leftSideWidth: 240,
    rightSideWidth: 400,
};

export const sidebarSlice = createSlice({
    name: 'sidebar',
    initialState,
    reducers: {
        toggleLeftSide: state => {
            state.showLeftSide = !state.showLeftSide;
        },
        toggleRightSide: state => {
            state.showRightSide = !state.showRightSide;
        },
        setShowLeftSide: (state, action: PayloadAction<boolean>) => {
            state.showLeftSide = action.payload;
        },
        setShowRightSide: (state, action: PayloadAction<boolean>) => {
            state.showRightSide = action.payload;
        },
        setLeftSideWidth: (state, action: PayloadAction<number>) => {
            state.leftSideWidth = action.payload;
        },
        setRightSideWidth: (state, action: PayloadAction<number>) => {
            state.rightSideWidth = action.payload;
        },
        resetSidebar: () => initialState,
    },
});

export const {
    toggleLeftSide,
    toggleRightSide,
    setShowLeftSide,
    setShowRightSide,
    setLeftSideWidth,
    setRightSideWidth,
    resetSidebar,
} = sidebarSlice.actions;

export default sidebarSlice.reducer;
