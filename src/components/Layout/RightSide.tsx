import React, { useRef } from "react";
import { useDictation } from "~/context/DictationContext";

const RightSide: React.FC = () => {
    const { subtitles } = useDictation();
    const listRef = useRef<HTMLDivElement>(null);

    // Check if we have bilingual subtitles
    const hasBilingual = subtitles.some(sub => sub.translatedText);

    return (
        <aside className="w-full h-full flex flex-col bg-[rgb(32,32,32)] border-l border-[rgb(56,56,56)]">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-[rgb(56,56,56)]">
                <span className="text-sm font-medium text-[rgb(240,240,240)]">
                    Subtitles
                </span>
            </div>

            {/* Content - Subtitle List */}
            <div ref={listRef} className="flex-1 overflow-y-auto bg-[rgb(25,25,25)]">

                <div className="flex items-center justify-center h-full text-notion-text-muted text-sm">
                    No subtitles loaded
                </div>
            </div>

            {/* Footer */}
            <div className="border-t border-[rgb(56,56,56)] p-3 bg-[rgb(32,32,32)]">
                <div className="text-xs text-notion-text-muted text-center">
                    {hasBilingual
                        ? 'Bilingual mode • Click to jump • Hover to reveal blurred text'
                        : 'Click any subtitle to jump to it'
                    }
                </div>

            </div>
        </aside>
    );
};

export default RightSide;
