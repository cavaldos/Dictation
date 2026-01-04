import React, { useState } from 'react';

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
    const [showRightSide, setShowRightSide] = useState(true); // Default to show

    return (
        <SettingsProvider>
            <DictationProvider>
            <div className="h-screen w-screen flex flex-col bg-[rgb(25,25,25)] overflow-hidden">
                {/* Top Toolbar */}
                <ToolBar
                    showLeftSide={showLeftSide}
                    showRightSide={showRightSide}
                    onToggleLeftSide={() => setShowLeftSide(!showLeftSide)}
                    onToggleRightSide={() => setShowRightSide(!showRightSide)}
                />
                {/* Main Content Area with Sidebars */}
                <div className="flex-1 flex overflow-hidden">
                    {/* Left Sidebar */}
                    <div
                        className={`transition-all duration-300 ease-in-out ${showLeftSide ? 'w-[240px] opacity-100' : 'w-0 opacity-0'
                            } overflow-hidden flex-shrink-0`}
                    >
                        <LeftSide isOpen={showLeftSide} />
                    </div>

                    {/* Main Content */}
                    <main className="flex-1 h-full overflow-auto bg-[rgb(25,25,25)]">
                        {children}
                    </main>

                    {/* Right Sidebar */}
                    <div
                        className={`transition-all duration-300 ease-in-out ${showRightSide ? 'w-[400px] opacity-100' : 'w-0 opacity-0'
                            } overflow-hidden flex-shrink-0`}
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
