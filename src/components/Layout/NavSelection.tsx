import React, { useState, useRef, useEffect } from "react";
import { ChevronDown } from "lucide-react";

type Mode = "agent" | "edit";

import { useNavigate,useLocation } from "react-router-dom";


const NavSelection: React.FC = () => {
    const [selectedMode, setSelectedMode] = useState<Mode>("agent");
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const navigate = useNavigate();
    const location = useLocation();
    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsDropdownOpen(false);
            }
        };

        if (isDropdownOpen) {
            document.addEventListener("mousedown", handleClickOutside);
        }

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [isDropdownOpen]);
    const handleModeSelect = (mode: Mode) => {
        setSelectedMode(mode);
        setIsDropdownOpen(false);
    };
    const pathNavigate = [
        { name: "Dictation", path: "/" },
        { name: "Carbin", path: "/carbin" },
        { name: "Agent", path: "/agent" },
    ]

    return (
        <div className="flex items-center gap-1 w-[200px]">
            {/* Mode selector dropdown */}
            <div className="relative" ref={dropdownRef}>
                <button
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    className="mode-selector-btn flex items-center gap-1 px-2 py-1 rounded text-sm text-[rgb(240,240,240)] bg-[rgb(49,49,49)] hover:bg-[rgb(70,70,70)] transition-all duration-200 titlebar-no-drag"
                >
                    <span className="capitalize">{selectedMode}</span>
                    <ChevronDown size={14} className={`transition-transform duration-300 ${isDropdownOpen ? 'rotate-180' : ''}`} />
                </button>
                {/* Dropdown menu */}
                {isDropdownOpen && (
                    <div className="absolute top-full mt-1 p-1 left-0 bg-[rgb(35,35,35)] border border-[rgb(60,60,60)] rounded shadow-lg min-w-[100px] z-50 titlebar-no-drag">
                        {
                            pathNavigate.map((item) => (
                                <button
                                    key={item.name}
                                    onClick={() => {
                                        handleModeSelect(item.name.toLowerCase() as Mode);
                                        navigate(item.path);
                                    }}
                                    className={`w-full px-3 py-2  text-sm text-[rgb(240,240,240)] hover:bg-[rgb(70,70,70)] cursor-pointer transition-colors rounded-md
                                        ${location.pathname === item.path ? 'bg-[rgb(70,70,70)]' : 'text-[rgb(200,200,200)] hover:bg-[rgb(49,49,49)]'}
                                        `}
                                >
                                    {item.name}
                                </button>
                            ))
                        }
                    </div>
                )}

                <ChevronDown size={14} className={`absolute right-2 top-1/2 transform -translate-y-1/2 pointer-events-none transition-transform duration-300 ${isDropdownOpen ? 'rotate-180' : ''}`} />
                
            </div>
        </div>
    );
}
export default NavSelection;
