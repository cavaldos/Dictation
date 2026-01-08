import React, { useState, useCallback } from 'react';
import { Volume2, Plus, ChevronDown, ChevronRight, AlertCircle, BookOpen, SpellCheck } from 'lucide-react';
import type { DictionaryResponse, DictionaryEntry } from './types';

interface NoteGroup {
    id: string;
    lastModified: number;
    words: string[];
    isCollapsed: boolean;
}

interface DictionaryTableProps {
    data: DictionaryResponse;
    onSaveToNotes?: (word: string) => void;
}

const DictionaryTable: React.FC<DictionaryTableProps> = ({ data, onSaveToNotes }) => {
    const [expandedWords, setExpandedWords] = useState<Set<string>>(
        new Set(data.words.map(w => w.word))
    );
    const [speakingWord, setSpeakingWord] = useState<string | null>(null);

    const toggleWord = (word: string) => {
        setExpandedWords(prev => {
            const newSet = new Set(prev);
            if (newSet.has(word)) {
                newSet.delete(word);
            } else {
                newSet.add(word);
            }
            return newSet;
        });
    };

    const handleSaveToNotes = (word: string) => {
        // Get current groups from localStorage
        const saved = localStorage.getItem('dictation-note-groups');
        if (saved) {
            try {
                const groups: NoteGroup[] = JSON.parse(saved);
                if (groups.length > 0) {
                    // Add to first group (most recent)
                    const updatedGroups = groups.map((group, index) => {
                        if (index === 0 && !group.words.includes(word)) {
                            return {
                                ...group,
                                words: [...group.words, word],
                                lastModified: Date.now()
                            };
                        }
                        return group;
                    });
                    localStorage.setItem('dictation-note-groups', JSON.stringify(updatedGroups));
                    onSaveToNotes?.(word);
                }
            } catch {
                console.error('Failed to save word to notes');
            }
        }
    };

    const playAudio = (audioUrl: string) => {
        const audio = new Audio(audioUrl);
        audio.play().catch(console.error);
    };

    // Text-to-Speech function using Web Speech API
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

    const getPartOfSpeechColor = (type: string): string => {
        const colors: Record<string, string> = {
            noun: 'bg-blue-500/20 text-blue-300',
            verb: 'bg-green-500/20 text-green-300',
            adjective: 'bg-purple-500/20 text-purple-300',
            adverb: 'bg-orange-500/20 text-orange-300',
            preposition: 'bg-pink-500/20 text-pink-300',
            conjunction: 'bg-cyan-500/20 text-cyan-300',
            interjection: 'bg-yellow-500/20 text-yellow-300',
            pronoun: 'bg-indigo-500/20 text-indigo-300',
        };
        return colors[type.toLowerCase()] || 'bg-gray-500/20 text-gray-300';
    };

    if (!data.words || data.words.length === 0) {
        return (
            <div className="flex items-center justify-center p-6 text-gray-400">
                <AlertCircle size={16} className="mr-2" />
                No dictionary results
            </div>
        );
    }

    return (
        <div className="space-y-3">
            {data.words.map((entry: DictionaryEntry, index: number) => (
                <div
                    key={`${entry.word}-${index}`}
                    className={`rounded-lg border transition-colors ${
                        entry.notFound 
                            ? 'bg-red-500/5 border-red-500/20' 
                            : 'bg-[rgb(35,35,35)] border-[rgb(56,56,56)] hover:border-purple-500/30'
                    }`}
                >
                    {/* Word Header */}
                    <div 
                        className="flex items-center justify-between p-3 cursor-pointer"
                        onClick={() => toggleWord(entry.word)}
                    >
                        <div className="flex items-center gap-3">
                            <button className="p-1 hover:bg-white/10 rounded transition-colors">
                                {expandedWords.has(entry.word) ? (
                                    <ChevronDown size={16} className="text-gray-400" />
                                ) : (
                                    <ChevronRight size={16} className="text-gray-400" />
                                )}
                            </button>
                            
                            <div className="flex items-center gap-2">
                                <span className="text-lg font-semibold text-white">{entry.word}</span>
                                {entry.phonetic && (
                                    <span className="text-sm text-purple-400">{entry.phonetic}</span>
                                )}
                                {/* Speaker button - always show, use audio URL if available, otherwise TTS */}
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        if (entry.audio) {
                                            playAudio(entry.audio);
                                        } else {
                                            speakWord(entry.word);
                                        }
                                    }}
                                    className={`p-1.5 rounded transition-all duration-150 ${
                                        speakingWord === entry.word
                                            ? 'bg-green-500/20 text-green-400'
                                            : 'hover:bg-purple-500/20 text-purple-400 hover:text-purple-300'
                                    }`}
                                    title="Play pronunciation"
                                >
                                    <Volume2 
                                        size={16} 
                                        className={speakingWord === entry.word ? 'animate-pulse' : ''} 
                                    />
                                </button>
                            </div>

                            {entry.notFound && (
                                <span className="px-2 py-0.5 text-xs bg-red-500/20 text-red-400 rounded">
                                    Not Found
                                </span>
                            )}

                            {entry.corrected && entry.originalQuery && (
                                <div className="flex items-center gap-1 px-2 py-0.5 text-xs bg-yellow-500/20 text-yellow-400 rounded">
                                    <SpellCheck size={12} />
                                    <span>Corrected from "{entry.originalQuery}"</span>
                                </div>
                            )}
                        </div>

                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                handleSaveToNotes(entry.word);
                            }}
                            className="flex items-center gap-1 px-2 py-1 text-xs text-purple-400 hover:bg-purple-500/20 rounded transition-colors"
                            title="Save to Notes"
                        >
                            <Plus size={12} />
                            Note
                        </button>
                    </div>

                    {/* Word Details */}
                    {expandedWords.has(entry.word) && !entry.notFound && (
                        <div className="px-3 pb-3 pt-0 space-y-3">
                            {/* Part of Speech & Definitions */}
                            {entry.partOfSpeech?.map((pos, posIndex) => (
                                <div key={posIndex} className="space-y-2">
                                    <span className={`inline-block px-2 py-0.5 text-xs rounded ${getPartOfSpeechColor(pos.type)}`}>
                                        {pos.type}
                                    </span>
                                    <ol className="list-decimal list-inside space-y-1.5 ml-2">
                                        {pos.definitions?.map((def, defIndex) => (
                                            <li key={defIndex} className="text-sm">
                                                <span className="text-gray-200">{def.meaning}</span>
                                                {def.example && (
                                                    <p className="text-xs text-gray-500 italic ml-5 mt-0.5">
                                                        "{def.example}"
                                                    </p>
                                                )}
                                            </li>
                                        ))}
                                    </ol>
                                </div>
                            ))}

                            {/* Synonyms & Antonyms */}
                            {(entry.synonyms?.length > 0 || entry.antonyms?.length > 0) && (
                                <div className="pt-2 border-t border-[rgb(56,56,56)] space-y-2">
                                    {entry.synonyms?.length > 0 && (
                                        <div className="flex flex-wrap items-center gap-2">
                                            <span className="text-xs text-gray-500">Synonyms:</span>
                                            {entry.synonyms.map((syn, i) => (
                                                <span
                                                    key={i}
                                                    draggable
                                                    onDragStart={(e) => {
                                                        e.dataTransfer.setData('text/plain', syn);
                                                        e.dataTransfer.effectAllowed = 'copy';
                                                    }}
                                                    className="px-2 py-0.5 text-xs bg-green-500/10 text-green-400 rounded cursor-move hover:bg-green-500/20 transition-colors"
                                                >
                                                    {syn}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                    {entry.antonyms?.length > 0 && (
                                        <div className="flex flex-wrap items-center gap-2">
                                            <span className="text-xs text-gray-500">Antonyms:</span>
                                            {entry.antonyms.map((ant, i) => (
                                                <span
                                                    key={i}
                                                    draggable
                                                    onDragStart={(e) => {
                                                        e.dataTransfer.setData('text/plain', ant);
                                                        e.dataTransfer.effectAllowed = 'copy';
                                                    }}
                                                    className="px-2 py-0.5 text-xs bg-red-500/10 text-red-400 rounded cursor-move hover:bg-red-500/20 transition-colors"
                                                >
                                                    {ant}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            ))}

            {/* Save All to Notes */}
            {data.words.filter(w => !w.notFound).length > 1 && (
                <button
                    onClick={() => {
                        data.words
                            .filter(w => !w.notFound)
                            .forEach(w => handleSaveToNotes(w.word));
                    }}
                    className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm text-purple-400 hover:bg-purple-500/10 border border-purple-500/20 rounded-lg transition-colors"
                >
                    <BookOpen size={14} />
                    Save all {data.words.filter(w => !w.notFound).length} words to Notes
                </button>
            )}
        </div>
    );
};

export default DictionaryTable;
