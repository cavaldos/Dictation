import React from 'react';
import { 
  Settings, 
  Palette, 
  Type, 
  Target, 
  Gauge,
  Keyboard,
  Info,
  Cpu
} from 'lucide-react';

export type SettingsTab = 
  | 'preferences' 
  | 'appearance' 
  | 'subtitle' 
  | 'practice' 
  | 'playback' 
  | 'shortcuts' 
  | 'ai'
  | 'about';

interface SidebarItem {
  id: SettingsTab;
  label: string;
  icon: React.ReactNode;
  section?: string;
}

const sidebarItems: SidebarItem[] = [
  { id: 'preferences', label: 'Preferences', icon: <Settings size={18} />, section: 'Account' },
  { id: 'appearance', label: 'Appearance', icon: <Palette size={18} />, section: 'Settings' },
  { id: 'subtitle', label: 'Subtitle', icon: <Type size={18} /> },
  { id: 'practice', label: 'Practice', icon: <Target size={18} /> },
  { id: 'playback', label: 'Playback', icon: <Gauge size={18} /> },
  { id: 'shortcuts', label: 'Shortcuts', icon: <Keyboard size={18} /> },
  { id: 'ai', label: 'AI Connection', icon: <Cpu size={18} />, section: 'Integration' },
  { id: 'about', label: 'About', icon: <Info size={18} /> },
];

interface SettingsSidebarProps {
  activeTab: SettingsTab;
  onTabChange: (tab: SettingsTab) => void;
}

const SettingsSidebar: React.FC<SettingsSidebarProps> = ({ activeTab, onTabChange }) => {
  let currentSection = '';

  return (
    <div className="w-[220px] flex-shrink-0 bg-[rgb(32,32,32)] border-r border-[rgb(60,60,60)] p-3 overflow-y-auto">
      <nav className="space-y-0.5">
        {sidebarItems.map((item) => {
          const showSection = item.section && item.section !== currentSection;
          if (item.section) currentSection = item.section;

          return (
            <React.Fragment key={item.id}>
              {showSection && (
                <div className="text-xs text-[rgb(120,120,120)] uppercase tracking-wider px-2 pt-4 pb-1 first:pt-0">
                  {item.section}
                </div>
              )}
              <button
                onClick={() => onTabChange(item.id)}
                className={`
                  w-full flex items-center gap-2.5 px-2 py-1.5 rounded-md text-sm
                  transition-colors duration-150 text-left
                  ${activeTab === item.id
                    ? 'bg-[rgb(55,55,55)] text-[rgb(230,230,230)]'
                    : 'text-[rgb(160,160,160)] hover:bg-[rgb(45,45,45)] hover:text-[rgb(200,200,200)]'
                  }
                `}
              >
                <span className="flex-shrink-0 opacity-80">{item.icon}</span>
                <span>{item.label}</span>
              </button>
            </React.Fragment>
          );
        })}
      </nav>
    </div>
  );
};

export default SettingsSidebar;
