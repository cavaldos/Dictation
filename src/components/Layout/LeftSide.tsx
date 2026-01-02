import React from "react";

interface LeftSideProps {
    isOpen?: boolean;
}

const LeftSide: React.FC<LeftSideProps> = ({ isOpen = true }) => {
    if (!isOpen) return null;

    return (
        <aside className="w-[240px] h-full flex flex-col bg-[rgb(32,32,32)] border-r border-[rgb(56,56,56)]">
            {/* Header */}
            <div className="flex items-center justify-between px-3 py-2 mt-8">
                <span className="text-sm font-medium text-[rgb(240,240,240)]">
                    Dictation
                </span>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-2 py-2">
                {/* Add your content here */}
            </div>

            {/* Footer */}
            <div className="border-t border-[rgb(56,56,56)] px-2 py-2">
                {/* Add footer content here */}
            </div>
        </aside>
    );
};

export default LeftSide;
