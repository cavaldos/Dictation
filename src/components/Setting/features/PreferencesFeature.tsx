import React from 'react';
import { SettingItem, SettingSection, Toggle, Select } from '../SettingItem';

const PreferencesFeature: React.FC = () => {
  return (
    <div>
      <SettingSection title="General">
        <SettingItem
          title="Start minimized"
          description="App starts minimized to system tray"
        >
          <Toggle checked={false} onChange={() => {}} />
        </SettingItem>
        <SettingItem
          title="Show in dock"
          description="Show app icon in the dock"
        >
          <Toggle checked={true} onChange={() => {}} />
        </SettingItem>
      </SettingSection>

      <SettingSection title="Language">
        <SettingItem
          title="Language"
          description="Change the language used in the user interface"
        >
          <Select
            value="en"
            options={[
              { value: 'en', label: 'English' },
              { value: 'vi', label: 'Tiếng Việt' },
            ]}
            onChange={() => {}}
          />
        </SettingItem>
      </SettingSection>
    </div>
  );
};

export default PreferencesFeature;
