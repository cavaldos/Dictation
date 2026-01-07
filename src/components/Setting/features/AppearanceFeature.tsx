import React from 'react';
import { Monitor } from 'lucide-react';
import { SettingItem, SettingSection, Toggle, Select } from '../SettingItem';

const AppearanceFeature: React.FC = () => {
  const [theme, setTheme] = React.useState<'system' | 'light' | 'dark'>('system');

  return (
    <div>
      <SettingSection title="Theme">
        <SettingItem
          icon={<Monitor size={18} />}
          title="Appearance"
          description="Customize how Dictation looks on your device"
        >
          <Select
            value={theme}
            options={[
              { value: 'system', label: 'System' },
              { value: 'light', label: 'Light' },
              { value: 'dark', label: 'Dark' },
            ]}
            onChange={(v) => setTheme(v as 'system' | 'light' | 'dark')}
          />
        </SettingItem>
      </SettingSection>

      <SettingSection title="Display">
        <SettingItem
          title="Compact mode"
          description="Use smaller spacing and font sizes"
        >
          <Toggle checked={false} onChange={() => {}} />
        </SettingItem>
        <SettingItem
          title="Show timestamps"
          description="Display timestamps in subtitle list"
        >
          <Toggle checked={true} onChange={() => {}} />
        </SettingItem>
      </SettingSection>
    </div>
  );
};

export default AppearanceFeature;
