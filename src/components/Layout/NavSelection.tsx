import React, { useState, useRef, useEffect } from "react";
import { ChevronDown } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";

const pathNavigate = [
    { name: "Dictation", path: "/" },
    { name: "Archive", path: "/archive" },
    { name: "Agent", path: "/agent" },
    { name: "Carbin", path: "/carbin" },
];

// Check if running in Electron
const isElectron = typeof window !== 'undefined' && typeof window.electronAPI !== 'undefined';

const NavSelection: React.FC = () => {
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const navigate = useNavigate();
    const location = useLocation();

    // Get current page name based on path
    const currentPage = pathNavigate.find(item => item.path === location.pathname)?.name || "Dictation";

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

    const handleNavigate = (path: string) => {
        navigate(path);
        setIsDropdownOpen(false);
    };

    return (
        <div className={`flex items-center gap-1 ${isElectron ? 'ml-18' : ''}`}>
            {/* Navigation dropdown */}
            <div className="relative" ref={dropdownRef}>
                <button
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    className="flex items-center gap-1 px-2 py-1 rounded text-sm text-[rgb(240,240,240)] bg-[rgb(49,49,49)] hover:bg-[rgb(70,70,70)] transition-all duration-200 titlebar-no-drag"
                >
                    <span>{currentPage}</span>
                    <ChevronDown size={14} className={`transition-transform duration-300 ${isDropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* Dropdown menu */}
                {isDropdownOpen && (
                    <div className="absolute top-full mt-1 p-1 left-0 bg-[rgb(35,35,35)] border border-[rgb(60,60,60)] rounded shadow-lg min-w-[120px] z-50 titlebar-no-drag">
                        {pathNavigate.map((item) => (
                            <button
                                key={item.name}
                                onClick={() => handleNavigate(item.path)}
                                className={`w-full px-3 py-2 text-left text-sm rounded-md transition-colors
                                    ${location.pathname === item.path 
                                        ? 'bg-[rgb(70,70,70)] text-[rgb(240,240,240)]' 
                                        : 'text-[rgb(200,200,200)] hover:bg-[rgb(49,49,49)]'
                                    }`}
                            >
                                {item.name}
                            </button>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default NavSelection;
