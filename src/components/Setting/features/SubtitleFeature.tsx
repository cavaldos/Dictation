import React from 'react';
import { SettingItem, SettingSection, Toggle, Slider } from '../SettingItem';
import { useSettings } from '~/hooks/useReduxHooks';

const SubtitleFeature: React.FC = () => {
  const { settings, updateSettings } = useSettings();

  return (
    <div>
      <SettingSection title="Subtitle options">
        <SettingItem
          title="Minimum words per subtitle"
          description="Short subtitles will be merged until reaching this word count"
        >
          <Slider
            value={settings.minWordsPerSubtitle}
            min={1}
            max={30}
            onChange={(v) => updateSettings({ minWordsPerSubtitle: v })}
            formatValue={(v) => `${v} words`}
          />
        </SettingItem>
        <SettingItem
          title="Auto-merge short subtitles"
          description="Automatically combine subtitles below minimum word count"
        >
          <Toggle checked={true} onChange={() => {}} />
        </SettingItem>
      </SettingSection>
    </div>
  );
};

export default SubtitleFeature;
