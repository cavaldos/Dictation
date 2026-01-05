import React, { useState, useRef, useCallback } from 'react';

import LeftSide from './LeftSide';
import RightSide from './RightSide';
import ToolBar from './ToolBar';
import { DictationProvider } from '~/context/DictationContext';
import { SettingsProvider } from '~/context/SettingsContext';

interface MainLayoutProps {
    children?: React.ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
    const [showLeftSide, setShowLeftSide] = useState(true);
    const [showRightSide, setShowRightSide] = useState(true);
    const [leftSideWidth, setLeftSideWidth] = useState(240);
    const [rightSideWidth, setRightSideWidth] = useState(400);
    
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
                setLeftSideWidth(newWidth);
            }
        } else if (isResizingRight.current) {
            const newWidth = window.innerWidth - e.clientX;
            if (newWidth >= 300 && newWidth <= 800) {
                setRightSideWidth(newWidth);
            }
        }
    }, []);

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
        <SettingsProvider>
            <DictationProvider>
            <div className="h-screen w-screen flex flex-col bg-[rgb(25,25,25)] overflow-hidden">

                {/* Main Content Area with Sidebars */}
                <div className="flex-1 flex overflow-hidden">
                    {/* Left Sidebar */}
                    <div
                        id="left-sidebar"
                        style={{ 
                            width: showLeftSide ? `${leftSideWidth}px` : '0px',
                            opacity: showLeftSide ? 1 : 0
                        }}
                        className="flex-shrink-0 overflow-hidden transition-all duration-300 ease-in-out"
                    >
                        <LeftSide isOpen={showLeftSide} />
                    </div>
                    {/* Left Resizer */}
                    {showLeftSide && (
                        <div
                            onMouseDown={handleLeftMouseDown}
                            className="w-[4px] flex-shrink-0 cursor-col-resize hover:bg-[rgb(100,100,100)] transition-colors bg-transparent group relative"
                        >
                            <div className="absolute inset-y-0 -left-1 -right-1" />
                        </div>
                    )}

                    {/* Main Content */}
                    <main className="flex-1 h-full flex flex-col bg-[rgb(25,25,25)] min-w-0">
                        {/* Top Toolbar - Fixed within main content */}
                        <ToolBar
                            showLeftSide={showLeftSide}
                            showRightSide={showRightSide}
                            onToggleLeftSide={() => setShowLeftSide(!showLeftSide)}
                            onToggleRightSide={() => setShowRightSide(!showRightSide)}
                        />
                        {/* Scrollable content */}
                        <div className="flex-1 overflow-auto">
                            {children}
                        </div>
                    </main>

                    {/* Right Resizer */}
                    {showRightSide && (
                        <div
                            onMouseDown={handleRightMouseDown}
                            className="w-[4px] flex-shrink-0 cursor-col-resize hover:bg-[rgb(100,100,100)] transition-colors bg-transparent group relative"
                        >
                            <div className="absolute inset-y-0 -left-1 -right-1" />
                        </div>
                    )}
                    {/* Right Sidebar */}
                    <div
                        id="right-sidebar"
                        style={{ 
                            width: showRightSide ? `${rightSideWidth}px` : '0px',
                            opacity: showRightSide ? 1 : 0
                        }}
                        className="flex-shrink-0 overflow-hidden transition-all duration-300 ease-in-out"
                    >
                        <RightSide />
                    </div>
                </div>
            </div>
        </DictationProvider>
        </SettingsProvider>
    );
};

export default MainLayout;
