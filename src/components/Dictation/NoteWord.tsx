import React, { useState, useRef, useEffect } from 'react';

const NoteWord: React.FC = () => {
    const [words, setWords] = useState<string[]>(() => {
        const saved = localStorage.getItem('dictation-note-words');
        return saved ? JSON.parse(saved) : [];
    });
    const [inputValue, setInputValue] = useState('');
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        localStorage.setItem('dictation-note-words', JSON.stringify(words));
    }, [words]);

    const handleAddWord = (value: string) => {
        const trimmed = value.trim();
        if (trimmed !== '' && !words.includes(trimmed)) {
            setWords(prev => [...prev, trimmed]);
        }
        setInputValue('');
    };

    const handleDeleteWord = (index: number) => {
        setWords(prev => prev.filter((_, i) => i !== index));
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleAddWord(inputValue);
        } else if (e.key === 'Backspace' && inputValue === '' && words.length > 0) {
            setWords(prev => prev.slice(0, -1));
        }
    };

    return (
        <div className="flex flex-col h-full p-3">
            <h3 className="text-sm font-semibold text-gray-200 tracking-wide mb-3">Notes</h3>
            <div 
                className="flex-1 bg-white/[0.03] rounded-xl p-3 cursor-text"
                onClick={() => inputRef.current?.focus()}
            >
                <div className="flex flex-wrap items-start gap-2 min-h-[100px]">
                    {words.map((word, index) => (
                        <div
                            key={index}
                            className="bg-blue-500/20 text-blue-300 rounded-lg px-3 py-1 text-xs inline-flex items-center gap-1.5 group transition-all duration-200 hover:bg-blue-500/30"
                        >
                            <span className="font-medium">{word}</span>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteWord(index);
                                }}
                                className="opacity-0 group-hover:opacity-100 hover:text-white rounded-full w-4 h-4 flex items-center justify-center text-sm leading-none transition-all duration-150 hover:bg-black/20"
                                title="Remove"
                            >
                                ×
                            </button>
                        </div>
                    ))}
                    <input
                        ref={inputRef}
                        type="text"
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder={words.length === 0 ? "Type and press Enter..." : ""}
                        className="flex-1 min-w-[100px] bg-transparent outline-none text-sm text-gray-300 placeholder:text-gray-500"
                    />
                </div>
            </div>
        </div>
    );
};

export default NoteWord;
