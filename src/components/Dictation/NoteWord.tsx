import React, { useState, useRef, useEffect, useCallback } from 'react';

interface NoteGroup {
    id: string;
    lastModified: number;
    words: string[];
    isCollapsed: boolean;
}

// Speaker Icon Component
const SpeakerIcon: React.FC<{ isPlaying?: boolean }> = ({ isPlaying }) => (
    <svg 
        xmlns="http://www.w3.org/2000/svg" 
        viewBox="0 0 24 24" 
        fill="currentColor" 
        className={`w-3.5 h-3.5 ${isPlaying ? 'animate-pulse' : ''}`}
    >
        <path d="M13.5 4.06c0-1.336-1.616-2.005-2.56-1.06l-4.5 4.5H4.508c-1.141 0-2.318.664-2.66 1.905A9.76 9.76 0 001.5 12c0 .898.121 1.768.35 2.595.341 1.24 1.518 1.905 2.659 1.905h1.93l4.5 4.5c.945.945 2.561.276 2.561-1.06V4.06zM18.584 5.106a.75.75 0 011.06 0c3.808 3.807 3.808 9.98 0 13.788a.75.75 0 01-1.06-1.06 8.25 8.25 0 000-11.668.75.75 0 010-1.06z" />
        <path d="M15.932 7.757a.75.75 0 011.061 0 6 6 0 010 8.486.75.75 0 01-1.06-1.061 4.5 4.5 0 000-6.364.75.75 0 010-1.06z" />
    </svg>
);

const NoteWord: React.FC = () => {
    const [groups, setGroups] = useState<NoteGroup[]>(() => {
        const saved = localStorage.getItem('dictation-note-groups');
        if (saved) {
            return JSON.parse(saved);
        }
        // Migrate old data if exists
        const oldWords = localStorage.getItem('dictation-note-words');
        if (oldWords) {
            const words = JSON.parse(oldWords);
            if (words.length > 0) {
                return [{
                    id: crypto.randomUUID(),
                    lastModified: Date.now(),
                    words: words,
                    isCollapsed: false
                }];
            }
        }
        // Create default empty group
        return [{
            id: crypto.randomUUID(),
            lastModified: Date.now(),
            words: [],
            isCollapsed: false
        }];
    });
    const [inputValue, setInputValue] = useState('');
    const [activeGroupId, setActiveGroupId] = useState<string>(() => groups[0]?.id || '');
    const [dragOverGroupId, setDragOverGroupId] = useState<string | null>(null);
    const [speakingWord, setSpeakingWord] = useState<string | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        localStorage.setItem('dictation-note-groups', JSON.stringify(groups));
    }, [groups]);

    // Text-to-Speech function
    const speakWord = useCallback((word: string) => {
        // Cancel any ongoing speech
        window.speechSynthesis.cancel();
        
        const utterance = new SpeechSynthesisUtterance(word);
        utterance.lang = 'en-US';
        utterance.rate = 0.9; // Slightly slower for clarity
        utterance.pitch = 1;
        
        // Get available voices and prefer a native English voice
        const voices = window.speechSynthesis.getVoices();
        const englishVoice = voices.find(voice => 
            voice.lang.startsWith('en') && voice.localService
        ) || voices.find(voice => voice.lang.startsWith('en'));
        
        if (englishVoice) {
            utterance.voice = englishVoice;
        }
        
        utterance.onstart = () => setSpeakingWord(word);
        utterance.onend = () => setSpeakingWord(null);
        utterance.onerror = () => setSpeakingWord(null);
        
        window.speechSynthesis.speak(utterance);
    }, []);

    const formatGroupName = (timestamp: number): string => {
        const date = new Date(timestamp);
        return date.toLocaleString('vi-VN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const handleAddWord = (value: string, groupId: string) => {
        const trimmed = value.trim();
        if (trimmed !== '') {
            setGroups(prev => prev.map(group => {
                if (group.id === groupId) {
                    if (!group.words.includes(trimmed)) {
                        return {
                            ...group,
                            words: [...group.words, trimmed],
                            lastModified: Date.now()
                        };
                    }
                }
                return group;
            }));
        }
        setInputValue('');
    };

    const handleDeleteWord = (groupId: string, wordIndex: number) => {
        setGroups(prev => prev.map(group => {
            if (group.id === groupId) {
                return {
                    ...group,
                    words: group.words.filter((_, i) => i !== wordIndex),
                    lastModified: Date.now()
                };
            }
            return group;
        }));
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, groupId: string) => {
        const group = groups.find(g => g.id === groupId);
        if (!group) return;

        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleAddWord(inputValue, groupId);
        } else if (e.key === 'Backspace' && inputValue === '' && group.words.length > 0) {
            setGroups(prev => prev.map(g => {
                if (g.id === groupId) {
                    return {
                        ...g,
                        words: g.words.slice(0, -1),
                        lastModified: Date.now()
                    };
                }
                return g;
            }));
        }
    };

    const handleAddNewGroup = () => {
        const newGroup: NoteGroup = {
            id: crypto.randomUUID(),
            lastModified: Date.now(),
            words: [],
            isCollapsed: false
        };
        setGroups(prev => [...prev, newGroup]);
        setActiveGroupId(newGroup.id);
    };

    const handleDeleteGroup = (groupId: string) => {
        if (groups.length === 1) return; // Keep at least one group
        setGroups(prev => prev.filter(g => g.id !== groupId));
        if (activeGroupId === groupId) {
            setActiveGroupId(groups[0].id);
        }
    };

    const toggleGroupCollapse = (groupId: string) => {
        setGroups(prev => prev.map(group => {
            if (group.id === groupId) {
                return { ...group, isCollapsed: !group.isCollapsed };
            }
            return group;
        }));
    };

    const handleDragStart = (e: React.DragEvent, groupId: string, wordIndex: number, word: string) => {
        e.dataTransfer.setData('text/plain', word);
        e.dataTransfer.setData('sourceGroupId', groupId);
        e.dataTransfer.setData('wordIndex', wordIndex.toString());
        e.dataTransfer.effectAllowed = 'move';
    };

    const handleDragOver = (e: React.DragEvent, groupId: string) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        setDragOverGroupId(groupId);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        setDragOverGroupId(null);
    };

    const handleDrop = (e: React.DragEvent, targetGroupId: string) => {
        e.preventDefault();
        setDragOverGroupId(null);

        const word = e.dataTransfer.getData('text/plain');
        const sourceGroupId = e.dataTransfer.getData('sourceGroupId');
        const wordIndex = parseInt(e.dataTransfer.getData('wordIndex'));

        if (!sourceGroupId || sourceGroupId === targetGroupId) {
            return; // Same group or external drag
        }

        // Move word from source to target group
        setGroups(prev => prev.map(group => {
            if (group.id === sourceGroupId) {
                // Remove from source
                return {
                    ...group,
                    words: group.words.filter((_, i) => i !== wordIndex),
                    lastModified: Date.now()
                };
            } else if (group.id === targetGroupId) {
                // Add to target (avoid duplicates)
                if (!group.words.includes(word)) {
                    return {
                        ...group,
                        words: [...group.words, word],
                        lastModified: Date.now()
                    };
                }
            }
            return group;
        }));
    };

    return (
        <div className="flex flex-col h-full p-3">
            <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-gray-200 tracking-wide">Notes</h3>
                <button
                    onClick={handleAddNewGroup}
                    className="text-xs px-2 py-1 bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 rounded-lg transition-colors"
                    title="Add new group"
                >
                    + New Group
                </button>
            </div>
            
            <div className="flex-1 overflow-y-auto space-y-3">
                {groups.map((group) => (
                    <div key={group.id} className="bg-white/[0.03] rounded-xl p-3">
                        <div className="flex items-center justify-between mb-2">
                            <button
                                onClick={() => toggleGroupCollapse(group.id)}
                                className="flex items-center gap-2 text-xs text-gray-400 hover:text-gray-300 transition-colors"
                            >
                                <span className="transition-transform duration-200" style={{ transform: group.isCollapsed ? 'rotate(-90deg)' : 'rotate(0deg)' }}>
                                    ▼
                                </span>
                                <span className="font-medium">{formatGroupName(group.lastModified)}</span>
                                <span className="text-gray-500">({group.words.length})</span>
                            </button>
                            {groups.length > 1 && (
                                <button
                                    onClick={() => handleDeleteGroup(group.id)}
                                    className="text-xs text-red-400 hover:text-red-300 transition-colors px-2 py-0.5 rounded hover:bg-red-500/10"
                                    title="Delete group"
                                >
                                    Delete
                                </button>
                            )}
                        </div>

                        {!group.isCollapsed && (
                            <div 
                                className={`cursor-text transition-colors rounded-lg ${dragOverGroupId === group.id ? 'bg-blue-500/10 ring-2 ring-blue-500/30' : ''}`}
                                onClick={() => {
                                    setActiveGroupId(group.id);
                                    inputRef.current?.focus();
                                }}
                                onDragOver={(e) => handleDragOver(e, group.id)}
                                onDragLeave={handleDragLeave}
                                onDrop={(e) => handleDrop(e, group.id)}
                            >
                                <div className="flex flex-wrap items-start gap-2 min-h-[60px] p-2">
                                    {group.words.map((word, index) => (
                                        <div
                                            key={index}
                                            draggable
                                            onDragStart={(e) => handleDragStart(e, group.id, index, word)}
                                            className="bg-blue-500/20 text-blue-300 rounded-lg px-2 py-1 text-xs inline-flex items-center gap-1 group transition-all duration-200 hover:bg-blue-500/30 cursor-move"
                                        >
                                            {/* Speaker button */}
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    speakWord(word);
                                                }}
                                                className={`flex items-center justify-center w-5 h-5 rounded transition-all duration-150 ${
                                                    speakingWord === word 
                                                        ? 'text-green-400 bg-green-500/20' 
                                                        : 'text-blue-400 hover:text-blue-200 hover:bg-blue-500/30'
                                                }`}
                                                title="Pronounce"
                                            >
                                                <SpeakerIcon isPlaying={speakingWord === word} />
                                            </button>
                                            <span className="font-medium">{word}</span>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleDeleteWord(group.id, index);
                                                }}
                                                className="opacity-0 group-hover:opacity-100 hover:text-white rounded-full w-4 h-4 flex items-center justify-center text-sm leading-none transition-all duration-150 hover:bg-black/20"
                                                title="Remove"
                                            >
                                                ×
                                            </button>
                                        </div>
                                    ))}
                                    {activeGroupId === group.id && (
                                        <input
                                            ref={inputRef}
                                            type="text"
                                            value={inputValue}
                                            onChange={(e) => setInputValue(e.target.value)}
                                            onKeyDown={(e) => handleKeyDown(e, group.id)}
                                            placeholder={group.words.length === 0 ? "Type and press Enter..." : ""}
                                            className="flex-1 min-w-[100px] bg-transparent outline-none text-sm text-gray-300 placeholder:text-gray-500"
                                        />
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default NoteWord;
