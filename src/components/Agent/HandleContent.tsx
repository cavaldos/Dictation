import React, { useState, useEffect, useRef } from 'react';
import { BookOpen, Trash2, GripVertical, FileText, ChevronDown, ChevronRight, Plus, X } from 'lucide-react';

interface NoteGroup {
    id: string;
    lastModified: number;
    words: string[];
    isCollapsed: boolean;
}

const HandleContent: React.FC = () => {
    const [noteGroups, setNoteGroups] = useState<NoteGroup[]>([]);
    const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
    const [activeGroupId, setActiveGroupId] = useState<string | null>(null);
    const [inputValue, setInputValue] = useState('');
    const initializedRef = useRef(false);
    const inputRef = useRef<HTMLInputElement>(null);

    // Sync with NoteWord component - read from dictation-note-groups
    useEffect(() => {
        const loadGroups = () => {
            const saved = localStorage.getItem('dictation-note-groups');
            if (saved) {
                try {
                    const groups = JSON.parse(saved) as NoteGroup[];
                    
                    setNoteGroups(prevGroups => {
                        // Auto-expand all groups only on first load
                        if (!initializedRef.current) {
                            setExpandedGroups(new Set(groups.map(g => g.id)));
                            initializedRef.current = true;
                        } else {
                            // Add new groups to expanded set (for newly created groups)
                            const prevIds = new Set(prevGroups.map(g => g.id));
                            const newGroupIds = groups.filter(g => !prevIds.has(g.id)).map(g => g.id);
                            if (newGroupIds.length > 0) {
                                setExpandedGroups(prev => {
                                    const newSet = new Set(prev);
                                    newGroupIds.forEach(id => newSet.add(id));
                                    return newSet;
                                });
                            }
                        }
                        return groups;
                    });
                } catch {
                    setNoteGroups([]);
                }
            } else {
                setNoteGroups([]);
            }
        };

        // Load initially
        loadGroups();

        // Poll for changes every 500ms
        const interval = setInterval(loadGroups, 500);

        return () => clearInterval(interval);
    }, []);

    const saveGroups = (groups: NoteGroup[]) => {
        localStorage.setItem('dictation-note-groups', JSON.stringify(groups));
        setNoteGroups(groups);
    };

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

    const toggleExpand = (groupId: string) => {
        setExpandedGroups(prev => {
            const newSet = new Set(prev);
            if (newSet.has(groupId)) {
                newSet.delete(groupId);
            } else {
                newSet.add(groupId);
            }
            return newSet;
        });
    };

    const handleAddWord = (groupId: string, word: string) => {
        const trimmed = word.trim();
        if (!trimmed) return;
        
        const updatedGroups = noteGroups.map(group => {
            if (group.id === groupId && !group.words.includes(trimmed)) {
                return {
                    ...group,
                    words: [...group.words, trimmed],
                    lastModified: Date.now()
                };
            }
            return group;
        });
        saveGroups(updatedGroups);
        setInputValue('');
    };

    const handleDeleteWord = (groupId: string, wordIndex: number) => {
        const updatedGroups = noteGroups.map(group => {
            if (group.id === groupId) {
                return {
                    ...group,
                    words: group.words.filter((_, i) => i !== wordIndex),
                    lastModified: Date.now()
                };
            }
            return group;
        });
        saveGroups(updatedGroups);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, groupId: string) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleAddWord(groupId, inputValue);
        } else if (e.key === 'Backspace' && inputValue === '') {
            const group = noteGroups.find(g => g.id === groupId);
            if (group && group.words.length > 0) {
                handleDeleteWord(groupId, group.words.length - 1);
            }
        } else if (e.key === 'Escape') {
            setActiveGroupId(null);
            setInputValue('');
        }
    };

    const handleAddNewGroup = () => {
        const newGroup: NoteGroup = {
            id: crypto.randomUUID(),
            lastModified: Date.now(),
            words: [],
            isCollapsed: false
        };
        const updatedGroups = [...noteGroups, newGroup];
        saveGroups(updatedGroups);
        setExpandedGroups(prev => new Set([...prev, newGroup.id]));
        setActiveGroupId(newGroup.id);
        setTimeout(() => inputRef.current?.focus(), 100);
    };

    const handleDeleteGroup = (groupId: string) => {
        if (noteGroups.length <= 1) {
            alert('Phải giữ ít nhất 1 group!');
            return;
        }
        
        if (window.confirm('Xóa group này?')) {
            const updatedGroups = noteGroups.filter(g => g.id !== groupId);
            saveGroups(updatedGroups);
        }
    };

    const handleClearAll = () => {
        if (window.confirm('Xóa tất cả groups? Sẽ giữ lại 1 group trống.')) {
            const emptyGroup: NoteGroup = {
                id: crypto.randomUUID(),
                lastModified: Date.now(),
                words: [],
                isCollapsed: false
            };
            saveGroups([emptyGroup]);
            setExpandedGroups(new Set([emptyGroup.id]));
        }
    };

    const totalWords = noteGroups.reduce((sum, g) => sum + g.words.length, 0);

    return (
        <div className="w-full h-full flex flex-col bg-[rgb(32,32,32)]">
            {/* Header */}
            <div className="flex-shrink-0 border-b border-[rgb(56,56,56)] p-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <FileText className="w-5 h-5 text-blue-400" />
                        <h2 className="text-lg font-semibold text-[rgb(240,240,240)]">Note Groups</h2>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={handleAddNewGroup}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-blue-400 hover:bg-blue-500/10 rounded-md transition-colors border border-blue-500/30"
                        >
                            <Plus className="w-3.5 h-3.5" />
                            New Group
                        </button>
                        {noteGroups.length > 0 && (
                            <button
                                onClick={handleClearAll}
                                className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-red-400 hover:bg-red-500/10 rounded-md transition-colors"
                            >
                                <Trash2 className="w-3.5 h-3.5" />
                                Clear All
                            </button>
                        )}
                    </div>
                </div>
                <p className="text-xs text-[rgb(142,142,142)] mt-2">
                    Kéo group hoặc từng word vào ChatBot • {noteGroups.length} group{noteGroups.length !== 1 ? 's' : ''} • {totalWords} words
                </p>
            </div>

            {/* Note Groups List */}
            <div className="flex-1 overflow-y-auto p-4 bg-[rgb(25,25,25)]">
                {noteGroups.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center">
                        <BookOpen className="w-16 h-16 text-[rgb(56,56,56)] mb-4" />
                        <p className="text-[rgb(142,142,142)] text-sm">
                            Chưa có note groups
                        </p>
                        <p className="text-[rgb(100,100,100)] text-xs mt-2">
                            Click "New Group" để tạo group mới
                        </p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {noteGroups.map((group) => (
                            <div
                                key={group.id}
                                className="group/card relative bg-[rgb(35,35,35)] hover:bg-[rgb(40,40,40)] border border-[rgb(56,56,56)] hover:border-blue-500/50 rounded-lg transition-all duration-200"
                            >
                                {/* Group Header - Draggable */}
                                <div 
                                    draggable
                                    onDragStart={(e) => {
                                        const wordsText = group.words.join(', ');
                                        e.dataTransfer.setData('text/plain', wordsText);
                                        e.dataTransfer.effectAllowed = 'copy';
                                    }}
                                    className="flex items-center justify-between gap-3 p-3 border-b border-[rgb(56,56,56)] cursor-move"
                                >
                                    <div className="flex items-center gap-2 flex-1 min-w-0">
                                        <GripVertical className="w-4 h-4 text-[rgb(100,100,100)] group-hover/card:text-blue-400 transition-colors flex-shrink-0" />
                                        
                                        <button
                                            onClick={() => toggleExpand(group.id)}
                                            className="p-0.5 hover:bg-white/10 rounded transition-colors"
                                        >
                                            {expandedGroups.has(group.id) ? (
                                                <ChevronDown className="w-4 h-4 text-gray-400" />
                                            ) : (
                                                <ChevronRight className="w-4 h-4 text-gray-400" />
                                            )}
                                        </button>

                                        <div className="flex-1 min-w-0">
                                            <h3 className="text-sm font-medium text-[rgb(240,240,240)] truncate">
                                                {formatGroupName(group.lastModified)}
                                            </h3>
                                            <p className="text-xs text-[rgb(142,142,142)]">
                                                {group.words.length} word{group.words.length !== 1 ? 's' : ''}
                                            </p>
                                        </div>
                                    </div>
                                    
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleDeleteGroup(group.id);
                                        }}
                                        className="p-1.5 hover:bg-red-500/20 rounded transition-colors opacity-0 group-hover/card:opacity-100"
                                        title="Delete group"
                                    >
                                        <Trash2 className="w-4 h-4 text-red-400" />
                                    </button>
                                </div>

                                {/* Words - Expandable with edit capability */}
                                {expandedGroups.has(group.id) && (
                                    <div 
                                        className="p-3 cursor-text"
                                        onClick={() => {
                                            setActiveGroupId(group.id);
                                            setTimeout(() => inputRef.current?.focus(), 50);
                                        }}
                                    >
                                        <div className="flex flex-wrap gap-2 min-h-[40px]">
                                            {group.words.map((word, index) => (
                                                <span
                                                    key={index}
                                                    draggable
                                                    onDragStart={(e) => {
                                                        e.dataTransfer.setData('text/plain', word);
                                                        e.dataTransfer.effectAllowed = 'copy';
                                                    }}
                                                    className="group/word px-2.5 py-1 text-xs font-medium bg-blue-500/20 text-blue-300 rounded-md cursor-move hover:bg-blue-500/30 transition-colors inline-flex items-center gap-1.5"
                                                >
                                                    {word}
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleDeleteWord(group.id, index);
                                                        }}
                                                        className="opacity-0 group-hover/word:opacity-100 hover:text-white rounded-full w-4 h-4 flex items-center justify-center transition-all duration-150 hover:bg-black/20"
                                                        title="Remove word"
                                                    >
                                                        <X className="w-3 h-3" />
                                                    </button>
                                                </span>
                                            ))}
                                            
                                            {/* Input field for adding words */}
                                            {activeGroupId === group.id && (
                                                <input
                                                    ref={inputRef}
                                                    type="text"
                                                    value={inputValue}
                                                    onChange={(e) => setInputValue(e.target.value)}
                                                    onKeyDown={(e) => handleKeyDown(e, group.id)}
                                                    onBlur={() => {
                                                        if (inputValue.trim()) {
                                                            handleAddWord(group.id, inputValue);
                                                        }
                                                        // Don't close immediately to allow clicking on other groups
                                                        setTimeout(() => {
                                                            if (document.activeElement !== inputRef.current) {
                                                                setActiveGroupId(null);
                                                            }
                                                        }, 100);
                                                    }}
                                                    placeholder="Type and press Enter..."
                                                    className="flex-1 min-w-[120px] bg-transparent outline-none text-sm text-gray-300 placeholder:text-gray-500"
                                                    autoFocus
                                                />
                                            )}
                                            
                                            {/* Add word hint when not active */}
                                            {activeGroupId !== group.id && (
                                                <span 
                                                    className="px-2.5 py-1 text-xs text-gray-500 border border-dashed border-gray-600 rounded-md cursor-text hover:border-blue-500/50 hover:text-blue-400 transition-colors"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setActiveGroupId(group.id);
                                                        setTimeout(() => inputRef.current?.focus(), 50);
                                                    }}
                                                >
                                                    + Add word
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default HandleContent;
