import React, { useRef, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import type { RootState } from '~/redux/store';
import {
    toggleLeftSide,
    toggleRightSide,
    setLeftSideWidth,
    setRightSideWidth,
} from '~/redux/features/sidebarSlice';

import ToolBar from './ToolBar';

interface MainLayoutProps {
    maincontent?: React.ReactNode;
    rightSide?: React.ReactNode | null;
    leftSide?: React.ReactNode | null;
}

const MainLayout: React.FC<MainLayoutProps> = ({ maincontent, rightSide, leftSide }) => {
    const dispatch = useDispatch();
    const { showLeftSide, showRightSide, leftSideWidth, rightSideWidth } = useSelector(
        (state: RootState) => state.sidebar
    );

    // Check if sidebars are enabled (not null)
    const hasLeftSide = leftSide !== null && leftSide !== undefined;
    const hasRightSide = rightSide !== null && rightSide !== undefined;

    const isResizingLeft = useRef(false);
    const isResizingRight = useRef(false);

    // Handle left sidebar resize
    const handleLeftMouseDown = useCallback((e: React.MouseEvent) => {
        e.preventDefault();
        isResizingLeft.current = true;
        document.body.style.cursor = 'col-resize';
        document.body.style.userSelect = 'none';

        // Disable transitions during resize
        const leftSide = document.getElementById('left-sidebar');
        if (leftSide) {
            leftSide.style.transition = 'none';
        }
    }, []);

    // Handle right sidebar resize
    const handleRightMouseDown = useCallback((e: React.MouseEvent) => {
        e.preventDefault();
        isResizingRight.current = true;
        document.body.style.cursor = 'col-resize';
        document.body.style.userSelect = 'none';

        // Disable transitions during resize
        const rightSide = document.getElementById('right-sidebar');
        if (rightSide) {
            rightSide.style.transition = 'none';
        }
    }, []);

    // Handle mouse move
    const handleMouseMove = useCallback((e: MouseEvent) => {
        if (isResizingLeft.current) {
            const newWidth = e.clientX;
            if (newWidth >= 200 && newWidth <= 500) {
                dispatch(setLeftSideWidth(newWidth));
            }
        } else if (isResizingRight.current) {
            const newWidth = window.innerWidth - e.clientX;
            if (newWidth >= 300 && newWidth <= 800) {
                dispatch(setRightSideWidth(newWidth));
            }
        }
    }, [dispatch]);

    // Handle mouse up
    const handleMouseUp = useCallback(() => {
        // Re-enable transitions
        const leftSide = document.getElementById('left-sidebar');
        const rightSide = document.getElementById('right-sidebar');
        if (leftSide) {
            leftSide.style.transition = '';
        }
        if (rightSide) {
            rightSide.style.transition = '';
        }

        isResizingLeft.current = false;
        isResizingRight.current = false;
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
    }, []);

    // Add event listeners
    React.useEffect(() => {
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);

        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };
    }, [handleMouseMove, handleMouseUp]);

    return (
        <div className="h-screen w-screen flex flex-col bg-[rgb(25,25,25)] overflow-hidden">
            <ToolBar
                showLeftSide={showLeftSide}
                showRightSide={showRightSide}
                hasLeftSide={hasLeftSide}
                hasRightSide={hasRightSide}
                onToggleLeftSide={() => dispatch(toggleLeftSide())}
                onToggleRightSide={() => dispatch(toggleRightSide())}
            />
            <div className="flex-1 flex overflow-hidden">
                {/* Left Sidebar */}
                {hasLeftSide && (
                    <div
                        id="left-sidebar"
                        style={{
                            width: showLeftSide ? `${leftSideWidth}px` : '0px',
                            opacity: showLeftSide ? 1 : 0
                        }}
                        className="flex-shrink-0 overflow-hidden transition-all duration-300 ease-in-out"
                    >
                        <aside className="w-full h-full flex flex-col bg-[rgb(25,25,25)] border-[rgb(56,56,56)] pl-2 pb-2">
                            <div className='w-full h-full border rounded-lg bg-[rgb(35,35,35)] p-2 overflow-y-auto'>
                                {leftSide}
                            </div>
                        </aside>
                    </div>
                )}
                {hasLeftSide && showLeftSide && (
                    <div
                        onMouseDown={handleLeftMouseDown}
                        className="w-[4px] flex-shrink-0 cursor-col-resize hover:bg-[rgb(100,100,100)] transition-colors bg-transparent group relative"
                    >
                        <div className="absolute inset-y-0 -left-1 -right-1" />
                    </div>
                )}

                {/* Main Content */}
                <main className="flex-1 h-full flex flex-col bg-[rgb(25,25,25)] min-w-0 pb-2">
                    <div className="flex-1 overflow-auto ">
                        {maincontent}
                    </div>
                </main>

                {/* Right Resizer */}
                {hasRightSide && showRightSide && (
                    <div
                        onMouseDown={handleRightMouseDown}
                        className="w-[4px] flex-shrink-0 cursor-col-resize hover:bg-[rgb(100,100,100)] transition-colors bg-transparent group relative"
                    >
                        <div className="absolute inset-y-0 -left-1 -right-1" />
                    </div>
                )}
                {hasRightSide && (
                    <div
                        id="right-sidebar"
                        style={{
                            width: showRightSide ? `${rightSideWidth}px` : '0px',
                            opacity: showRightSide ? 1 : 0
                        }}
                        className="flex-shrink-0 overflow-hidden transition-all duration-300 ease-in-out"
                    >
                        <aside className="w-full h-full flex flex-col bg-[rgb(25,25,25)] border-[rgb(56,56,56)] pr-2 pb-2">
                            <div className='w-full h-full border rounded-lg bg-[rgb(35,35,35)] overflow-y-auto scrollbar-hide'>
                                {rightSide}
                            </div>
                        </aside>
                    </div>
                )}
            </div>
        </div>
    );
};

export default MainLayout;
