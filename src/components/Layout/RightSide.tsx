import React from "react";

const RightSide: React.FC = () => {
    return (
        <aside className="w-[400px] h-full flex flex-col bg-[rgb(32,32,32)] border-l border-[rgb(56,56,56)]">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-[rgb(56,56,56)]">
                <span className="text-sm font-medium text-[rgb(240,240,240)]">
                    Panel
                </span>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-4 py-4 bg-[rgb(25,25,25)]">
                {/* Add your content here */}
            </div>

            {/* Footer */}
            <div className="border-t border-[rgb(56,56,56)] p-3 bg-[rgb(32,32,32)]">
                {/* Add footer content here */}
            </div>
        </aside>
    );
};

export default RightSide;
