import React, { createContext, useContext, useState } from 'react';

interface ChatContextType {
    // Placeholder for future features
    isActive: boolean;
    setIsActive: (value: boolean) => void;
}

const ChatContext = createContext<ChatContextType | null>(null);

export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [isActive, setIsActive] = useState(false);

    return (
        <ChatContext.Provider value={{
            isActive,
            setIsActive,
        }}>
            {children}
        </ChatContext.Provider>
    );
};

export const useChatContext = () => {
    const context = useContext(ChatContext);
    if (!context) {
        throw new Error('useChatContext must be used within ChatProvider');
    }
    return context;
};
