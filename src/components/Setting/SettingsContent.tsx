import React from 'react';
import type { SettingsTab } from './SettingsSidebar';
import {
  PreferencesFeature,
  AppearanceFeature,
  SubtitleFeature,
  PracticeFeature,
  PlaybackFeature,
  ShortcutsFeature,
  AboutFeature,
} from './features';

interface SettingsContentProps {
  activeTab: SettingsTab;
}

const SettingsContent: React.FC<SettingsContentProps> = ({ activeTab }) => {
  const renderContent = () => {
    switch (activeTab) {
      case 'preferences':
        return <PreferencesFeature />;
      case 'appearance':
        return <AppearanceFeature />;
      case 'subtitle':
        return <SubtitleFeature />;
      case 'practice':
        return <PracticeFeature />;
      case 'playback':
        return <PlaybackFeature />;
      case 'shortcuts':
        return <ShortcutsFeature />;
      case 'about':
        return <AboutFeature />;
      default:
        return null;
    }
  };

  const getTitle = () => {
    const titles: Record<SettingsTab, string> = {
      preferences: 'Preferences',
      appearance: 'Appearance',
      subtitle: 'Subtitle',
      practice: 'Practice',
      playback: 'Playback',
      shortcuts: 'Shortcuts',
      about: 'About',
    };
    return titles[activeTab];
  };

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="max-w-xl">
        <h2 className="text-xl font-semibold text-[rgb(230,230,230)] mb-6">{getTitle()}</h2>
        {renderContent()}
      </div>
    </div>
  );
};

export default SettingsContent;
