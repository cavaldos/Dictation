import React from 'react';
import { SettingItem, SettingSection, Toggle, Slider } from '../SettingItem';
import { useSettings } from '~/hooks/useReduxHooks';

const PracticeFeature: React.FC = () => {
  const { settings, updateSettings } = useSettings();

  return (
    <div>
      <SettingSection title="Accuracy">
        <SettingItem
          title="Accuracy threshold"
          description="Answers at or above this percentage are considered correct"
        >
          <Slider
            value={settings.accuracyThreshold}
            min={50}
            max={100}
            onChange={(v) => updateSettings({ accuracyThreshold: v })}
            formatValue={(v) => `${v}%`}
          />
        </SettingItem>
      </SettingSection>

      <SettingSection title="Loop behavior">
        <SettingItem
          title="Loop delay"
          description="Pause duration before video replays the current segment"
        >
          <Slider
            value={settings.loopDelayMs}
            min={0}
            max={3000}
            step={100}
            onChange={(v) => updateSettings({ loopDelayMs: v })}
            formatValue={(v) => `${v / 1000}s`}
          />
        </SettingItem>
        <SettingItem
          title="Auto-advance on correct"
          description="Automatically move to next subtitle after correct answer"
        >
          <Toggle checked={true} onChange={() => {}} />
        </SettingItem>
      </SettingSection>
    </div>
  );
};

export default PracticeFeature;
