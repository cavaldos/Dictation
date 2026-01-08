import React from 'react';
import {
    Plus,
    // Settings,
    // MoreHorizontal,
    // Maximize2,
    ArrowLeft,
    Trash2,
} from 'lucide-react';
import type { Message } from './types';

interface ChatHeaderProps {
    messages: Message[];
    onClearChat: () => void;
}

export const ChatHeader: React.FC<ChatHeaderProps> = ({ messages, onClearChat }) => {
    return (
        <div className="flex items-center justify-between px-4 py-2 bg-[rgb(32,32,32)] border-b border-[rgb(56,56,56)] rounded-lg">
            <div className="flex items-center gap-2">
                <button className="p-1 hover:bg-[rgb(49,49,49)] rounded transition-colors text-[rgb(240,240,240)]">
                    <ArrowLeft size={18} />
                </button>
                <h2 className="text-sm font-medium text-[rgb(142,142,142)] uppercase tracking-wide flex-1 truncate">
                    {messages.length > 0
                        ? messages[0].content.slice(0, 30) + (messages[0].content.length > 30 ? '...' : '')
                        : 'NEW CHAT'
                    }
                </h2>
            </div>

            <div className="flex items-center gap-1 text-[rgb(240,240,240)]">
                <button
                    onClick={onClearChat}
                    className="p-1.5 hover:bg-[rgb(49,49,49)] rounded transition-colors"
                    title="New chat"
                >
                    <Plus size={16} />
                </button>
                <div className="w-px h-4 bg-[rgb(56,56,56)] mx-1" />
                {/* <button className="p-1.5 hover:bg-[rgb(49,49,49)] rounded transition-colors">
                    <Settings size={16} />
                </button> */}
                {/* <button className="p-1.5 hover:bg-[rgb(49,49,49)] rounded transition-colors">
                    <MoreHorizontal size={16} />
                </button> */}
                {/* <button className="p-1.5 hover:bg-[rgb(49,49,49)] rounded transition-colors">
                    <Maximize2 size={16} />
                </button> */}
                {messages.length > 0 && (
                    <button
                        onClick={onClearChat}
                        className="p-1.5 hover:bg-[rgb(49,49,49)] rounded transition-colors hover:text-red-400"
                        title="Clear chat"
                    >
                        <Trash2 size={16} />
                    </button>
                )}
            </div>
        </div>
    );
};
