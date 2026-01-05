import React, { useRef, useEffect, useState } from "react";
import { Check, Circle, PlayCircle, Eye, EyeOff } from "lucide-react";
import { useDictation } from "~/context/DictationContext";

const RightSide: React.FC = () => {
    const { subtitles, currentIndex, completedIndices, goToSubtitle, isStarted } = useDictation();
    const listRef = useRef<HTMLDivElement>(null);
    const currentItemRef = useRef<HTMLButtonElement>(null);
    
    // Blur states for each language
    const [blurPrimary, setBlurPrimary] = useState(false);
    const [blurSecondary, setBlurSecondary] = useState(false);

    // Check if we have bilingual subtitles
    const hasBilingual = subtitles.some(sub => sub.translatedText);

    // Auto-scroll to current subtitle
    useEffect(() => {
        if (isStarted && currentItemRef.current && listRef.current) {
            const listContainer = listRef.current;
            const currentItem = currentItemRef.current;
            
            // Calculate scroll position to center the current item
            const listRect = listContainer.getBoundingClientRect();
            const itemRect = currentItem.getBoundingClientRect();
            
            const scrollOffset = itemRect.top - listRect.top - (listRect.height / 2) + (itemRect.height / 2);
            
            listContainer.scrollTo({
                top: listContainer.scrollTop + scrollOffset,
                behavior: 'smooth'
            });
        }
    }, [currentIndex, isStarted]);

    const formatTime = (seconds: number): string => {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const completedCount = completedIndices.size;
    const totalCount = subtitles.length;
    const progressPercent = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

    return (
        <aside className="w-[400px] h-full flex flex-col bg-[rgb(32,32,32)] border-l border-[rgb(56,56,56)]">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-[rgb(56,56,56)]">
                <span className="text-sm font-medium text-[rgb(240,240,240)]">
                    Subtitles
                </span>
                {totalCount > 0 && (
                    <span className="text-xs text-notion-text-muted">
                        {completedCount} / {totalCount} completed
                    </span>
                )}
            </div>

            {/* Blur Controls */}
            {totalCount > 0 && (
                <div className="px-4 py-2 border-b border-[rgb(56,56,56)] flex items-center gap-4">
                    {/* Primary language blur toggle */}
                    <button
                        onClick={() => setBlurPrimary(!blurPrimary)}
                        className={`flex items-center gap-1.5 text-xs px-2 py-1 rounded transition-colors ${
                            blurPrimary 
                                ? 'bg-primary/20 text-primary' 
                                : 'text-notion-text-muted hover:text-notion-text'
                        }`}
                        title={blurPrimary ? 'Show primary text' : 'Blur primary text'}
                    >
                        {blurPrimary ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                        Primary
                    </button>

                    {/* Secondary language blur toggle (only show if bilingual) */}
                    {hasBilingual && (
                        <button
                            onClick={() => setBlurSecondary(!blurSecondary)}
                            className={`flex items-center gap-1.5 text-xs px-2 py-1 rounded transition-colors ${
                                blurSecondary 
                                    ? 'bg-yellow-500/20 text-yellow-500' 
                                    : 'text-notion-text-muted hover:text-notion-text'
                            }`}
                            title={blurSecondary ? 'Show secondary text' : 'Blur secondary text'}
                        >
                            {blurSecondary ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                            Secondary
                        </button>
                    )}
                </div>
            )}

            {/* Progress bar */}
            {totalCount > 0 && (
                <div className="px-4 py-2 border-b border-[rgb(56,56,56)]">
                    <div className="h-1.5 bg-notion-main rounded-full overflow-hidden">
                        <div 
                            className="h-full bg-green-500 transition-all duration-300"
                            style={{ width: `${progressPercent}%` }}
                        />
                    </div>
                </div>
            )}

            {/* Content - Subtitle List */}
            <div ref={listRef} className="flex-1 overflow-y-auto bg-[rgb(25,25,25)]">
                {subtitles.length === 0 ? (
                    <div className="flex items-center justify-center h-full text-notion-text-muted text-sm">
                        No subtitles loaded
                    </div>
                ) : (
                    <div className="py-2">
                        {subtitles.map((subtitle, index) => {
                            const isCompleted = completedIndices.has(index);
                            const isCurrent = index === currentIndex && isStarted;
                            
                            return (
                                <button
                                    key={index}
                                    ref={isCurrent ? currentItemRef : null}
                                    onClick={() => goToSubtitle(index)}
                                    className={`w-full px-4 py-3 text-left transition-colors hover:bg-notion-hover ${
                                        isCurrent ? 'bg-primary/20 border-l-2 border-primary' : ''
                                    } ${isCompleted ? 'opacity-60' : ''}`}
                                >
                                    <div className="flex items-start gap-3">
                                        {/* Status icon */}
                                        <div className="flex-shrink-0 mt-0.5">
                                            {isCompleted ? (
                                                <Check className="w-4 h-4 text-green-500" />
                                            ) : isCurrent ? (
                                                <PlayCircle className="w-4 h-4 text-primary" />
                                            ) : (
                                                <Circle className="w-4 h-4 text-notion-text-muted" />
                                            )}
                                        </div>
                                        
                                        {/* Content */}
                                        <div className="flex-1 min-w-0">
                                            {/* Time */}
                                            <div className="text-xs text-notion-text-muted mb-1">
                                                {formatTime(subtitle.start)} - {formatTime(subtitle.start + subtitle.dur)}
                                            </div>
                                            
                                            {/* Primary Text */}
                                            <div 
                                                className={`text-sm transition-all duration-200 ${
                                                    isCompleted 
                                                        ? 'text-notion-text-muted line-through' 
                                                        : isCurrent 
                                                            ? 'text-notion-text font-medium' 
                                                            : 'text-notion-text'
                                                } ${blurPrimary ? 'blur-sm hover:blur-none' : ''}`}
                                            >
                                                {subtitle.text}
                                            </div>
                                            
                                            {/* Secondary/Translated Text */}
                                            {subtitle.translatedText && (
                                                <div 
                                                    className={`text-xs mt-1 text-yellow-500/80 transition-all duration-200 ${
                                                        blurSecondary ? 'blur-sm hover:blur-none' : ''
                                                    }`}
                                                >
                                                    {subtitle.translatedText}
                                                </div>
                                            )}
                                        </div>

                                        {/* Index number */}
                                        <div className="flex-shrink-0 text-xs text-notion-text-muted">
                                            #{index + 1}
                                        </div>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                )}
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
