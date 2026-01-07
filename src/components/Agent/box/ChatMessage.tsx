import React from 'react';
import { Volume2, RotateCcw, Undo2, ThumbsDown } from 'lucide-react';
import type { Message } from './types';
import { MarkdownContent } from './MarkdownContent';

interface ChatMessageProps {
    message: Message;
    currentModelName: string;
    isLoading: boolean;
    onRegenerate: (messageId: string) => void;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({
    message,
    currentModelName,
    isLoading,
    onRegenerate
}) => {
    if (message.type === 'user') {
        return (
            <div className="flex justify-end">
                <div className="bg-[rgb(49,49,49)] rounded-2xl px-4 py-2.5 max-w-[85%]">
                    <p className="text-sm text-[rgb(240,240,240)] whitespace-pre-wrap">{message.content}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-3">
            <div className="flex items-center gap-2 my-4">
                <div className="h-px flex-1 bg-gradient-to-r from-transparent via-[rgb(56,56,56)] to-transparent" />
            </div>

            <div className="space-y-3">
                <div className="text-sm text-[rgb(240,240,240)] leading-relaxed prose prose-invert max-w-none">
                    {message.isStreaming ? (
                        <div className="whitespace-pre-wrap">
                            {message.content}
                            <span className="inline-block w-2 h-4 bg-blue-400 animate-pulse ml-1" />
                        </div>
                    ) : (
                        <MarkdownContent content={message.content} />
                    )}
                </div>

                <div className="flex items-center gap-2 mt-3">
                    <button className="p-1.5 hover:bg-[rgb(49,49,49)] rounded transition-colors" title="Speak">
                        <Volume2 size={14} className="text-[rgb(142,142,142)]" />
                    </button>
                    <button
                        onClick={() => onRegenerate(message.id)}
                        disabled={isLoading}
                        className="p-1.5 hover:bg-[rgb(49,49,49)] rounded transition-colors disabled:opacity-50"
                        title="Regenerate"
                    >
                        <RotateCcw size={14} className="text-[rgb(142,142,142)]" />
                    </button>
                    <button className="p-1.5 hover:bg-[rgb(49,49,49)] rounded transition-colors" title="Undo">
                        <Undo2 size={14} className="text-[rgb(142,142,142)]" />
                    </button>
                    <button className="p-1.5 hover:bg-[rgb(49,49,49)] rounded transition-colors" title="Dislike">
                        <ThumbsDown size={14} className="text-[rgb(142,142,142)]" />
                    </button>
                    <div className="ml-auto text-xs text-[rgb(142,142,142)]">
                        {message.model || currentModelName}
                    </div>
                </div>
            </div>
        </div>
    );
};
