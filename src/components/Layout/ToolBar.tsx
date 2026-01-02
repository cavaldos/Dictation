import React from "react";
import { PanelLeft, PanelRight } from "lucide-react";

interface ToolBarProps {
    showLeftSide: boolean;
    showRightSide: boolean;
    onToggleLeftSide: () => void;
    onToggleRightSide: () => void;
}

const ToolBar: React.FC<ToolBarProps> = ({
    showLeftSide,
    showRightSide,
    onToggleLeftSide,
    onToggleRightSide,
}) => {
    return (
        <header className="h-11 w-full flex items-center justify-between bg-[rgb(25,25,25)] px-2 select-none titlebar-drag-region pl-20">
            {/* Left section */}
            <div className="flex items-center gap-1 w-[200px]">
                {/* Add left content here */}
            </div>

            {/* Center section */}
            <div className="flex-1 flex justify-center max-w-xl">
                <span className="text-sm text-[rgb(142,142,142)]">Dictation</span>
            </div>

            {/* Right section - Layout toggles */}
            <div className="flex items-center gap-2 w-[200px] justify-end">
                <div className="flex items-center gap-0.5">
                    <button
                        onClick={onToggleLeftSide}
                        title="Toggle left sidebar"
                        className={`p-1.5 rounded transition-colors titlebar-no-drag ${
                            showLeftSide
                                ? "bg-[rgb(70,70,70)] text-[rgb(240,240,240)]"
                                : "text-[rgb(142,142,142)] hover:bg-[rgb(49,49,49)] hover:text-[rgb(200,200,200)]"
                        }`}
                    >
                        <PanelLeft size={16} />
                    </button>
                    <button
                        onClick={onToggleRightSide}
                        title="Toggle right sidebar"
                        className={`p-1.5 rounded transition-colors titlebar-no-drag ${
                            showRightSide
                                ? "bg-[rgb(70,70,70)] text-[rgb(240,240,240)]"
                                : "text-[rgb(142,142,142)] hover:bg-[rgb(49,49,49)] hover:text-[rgb(200,200,200)]"
                        }`}
                    >
                        <PanelRight size={16} />
                    </button>
                </div>
            </div>
        </header>
    );
};

export default ToolBar;
