import React from 'react';
import { SettingSection } from '../SettingItem';

const ShortcutsFeature: React.FC = () => {
  const shortcuts = [
    { action: 'Play/Pause', keys: 'Space' },
    { action: 'Next subtitle', keys: '↓ or Enter' },
    { action: 'Previous subtitle', keys: '↑' },
    { action: 'Replay segment', keys: 'R' },
    { action: 'Skip 5s forward', keys: '→' },
    { action: 'Skip 5s backward', keys: '←' },
    { action: 'Show answer', keys: 'Tab' },
    { action: 'Toggle sidebar', keys: '⌘ + B' },
  ];

  return (
    <div>
      <SettingSection title="Keyboard shortcuts">
        <div className="space-y-2">
          {shortcuts.map((shortcut) => (
            <div
              key={shortcut.action}
              className="flex items-center justify-between py-2 px-1"
            >
              <span className="text-sm text-[rgb(200,200,200)]">{shortcut.action}</span>
              <kbd className="px-2 py-1 bg-[rgb(50,50,50)] border border-[rgb(70,70,70)] rounded text-xs text-[rgb(160,160,160)] font-mono">
                {shortcut.keys}
              </kbd>
            </div>
          ))}
        </div>
      </SettingSection>
    </div>
  );
};

export default ShortcutsFeature;
