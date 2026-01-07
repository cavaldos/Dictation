import React from 'react';
import { RotateCcw } from 'lucide-react';
import { SettingItem, SettingSection } from '../SettingItem';
import { useSettings } from '~/hooks/useReduxHooks';

const AboutFeature: React.FC = () => {
  const { resetSettings } = useSettings();

  return (
    <div>
      <SettingSection title="Application">
        <div className="bg-[rgb(40,40,40)] rounded-lg p-4 mb-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
              <span className="text-white text-xl font-bold">D</span>
            </div>
            <div>
              <h3 className="text-[rgb(230,230,230)] font-semibold">Dictation</h3>
              <p className="text-xs text-[rgb(120,120,120)]">Version 0.0.0</p>
            </div>
          </div>
          <p className="text-sm text-[rgb(160,160,160)]">
            A modern dictation practice app for language learners.
          </p>
        </div>
      </SettingSection>

      <SettingSection title="Data">
        <SettingItem
          icon={<RotateCcw size={18} />}
          title="Reset to defaults"
          description="Reset all settings to their default values"
        >
          <button
            onClick={resetSettings}
            className="px-3 py-1.5 text-sm bg-[rgb(50,50,50)] hover:bg-[rgb(60,60,60)] text-[rgb(200,200,200)] rounded-md transition-colors"
          >
            Reset
          </button>
        </SettingItem>
      </SettingSection>
    </div>
  );
};

export default AboutFeature;
