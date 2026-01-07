import React from 'react';
import { SettingItem, SettingSection, Toggle, Slider } from '../SettingItem';
import { useSettings } from '~/hooks/useReduxHooks';

const PlaybackFeature: React.FC = () => {
  const { settings, updateSettings } = useSettings();

  return (
    <div>
      <SettingSection title="Playback controls">
        <SettingItem
          title="Default playback speed"
          description="Initial speed when starting a new video"
        >
          <Slider
            value={settings.playbackSpeed}
            min={0.5}
            max={2}
            step={0.25}
            onChange={(v) => updateSettings({ playbackSpeed: v })}
            formatValue={(v) => `${v}x`}
          />
        </SettingItem>
        <SettingItem
          title="Remember playback speed"
          description="Save playback speed preference per video"
        >
          <Toggle checked={false} onChange={() => {}} />
        </SettingItem>
      </SettingSection>
    </div>
  );
};

export default PlaybackFeature;
