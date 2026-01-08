import React, { useState } from "react";
import { PanelLeft, PanelRight, Settings, BookOpen } from "lucide-react";
import { useDispatch } from "react-redux";
import NavSelection from "./NavSelection";
import { openSettingsModal } from "~/redux/features/settingsSlice";
import MarketModal from "~/components/market";

interface ToolBarProps {
    showLeftSide: boolean;
    showRightSide: boolean;
    hasLeftSide?: boolean;
    hasRightSide?: boolean;
    onToggleLeftSide: () => void;
    onToggleRightSide: () => void;
}

const ToolBar: React.FC<ToolBarProps> = ({
    showLeftSide,
    showRightSide,
    hasLeftSide = true,
    hasRightSide = true,
    onToggleLeftSide,
    onToggleRightSide,
}) => {
    const dispatch = useDispatch();
    const [isMarketOpen, setIsMarketOpen] = useState(false);

    return (
        <header className={`h-9 w-full flex items-center justify-between bg-[rgb(25,25,25)] px-2 mt-1 select-none custom-drag-region transition-all duration-200`}>
            {/* Left section */}
            <div className="flex items-center gap-1">
                <NavSelection />
                
                {/* Market button */}
                <button
                    onClick={() => setIsMarketOpen(true)}
                    title="Dictation Market"
                    className="p-1.5 rounded transition-colors titlebar-no-drag text-[rgb(142,142,142)] hover:bg-[rgb(49,49,49)] hover:text-[rgb(200,200,200)]"
                >
                    <BookOpen size={16} />
                </button>
            </div>

            {/* Market Modal */}
            <MarketModal isOpen={isMarketOpen} onClose={() => setIsMarketOpen(false)} />

            {/* Center section */}
            <div className="flex-1 flex justify-center max-w-xl">
                <span className="text-sm text-[rgb(142,142,142)]">Dictation</span>
            </div>

            {/* Right section - Layout toggles */}
            <div className="flex items-center gap-2 w-[200px] justify-end">

                {/* Settings button */}
                <button
                    onClick={() => dispatch(openSettingsModal())}
                    title="Settings"
                    className="p-1.5 rounded transition-colors titlebar-no-drag text-[rgb(142,142,142)] hover:bg-[rgb(49,49,49)] hover:text-[rgb(200,200,200)]"
                >
                    <Settings size={16} />
                </button>
                <div className="flex items-center gap-0.5">
                    {hasLeftSide && (
                        <button
                            onClick={onToggleLeftSide!}
                            title="Toggle left sidebar"
                            className={`p-1.5 rounded transition-colors titlebar-no-drag ${showLeftSide
                                ? "bg-[rgb(70,70,70)] text-[rgb(240,240,240)]"
                                : "text-[rgb(142,142,142)] hover:bg-[rgb(49,49,49)] hover:text-[rgb(200,200,200)]"
                                }`}
                        >
                            <PanelLeft size={16} />
                        </button>
                    )}
                    {hasRightSide && (
                        <button
                            onClick={onToggleRightSide}
                            title="Toggle right sidebar"
                            className={`p-1.5 rounded transition-colors titlebar-no-drag ${showRightSide
                                ? "bg-[rgb(70,70,70)] text-[rgb(240,240,240)]"
                                : "text-[rgb(142,142,142)] hover:bg-[rgb(49,49,49)] hover:text-[rgb(200,200,200)]"
                                }`}
                        >
                            <PanelRight size={16} />
                        </button>
                    )}
                </div>
            </div>
        </header>
    );
};

export default ToolBar;
