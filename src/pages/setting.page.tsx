import React from 'react';
import { Settings, RotateCcw, Clock, Target, Gauge, Type } from 'lucide-react';
import { useSettings } from '~/context/SettingsContext';

const SettingPage: React.FC = () => {
  const { settings, updateSettings, resetSettings } = useSettings();

  return (
    <div className="h-full overflow-auto p-6">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <Settings className="w-8 h-8 text-primary" />
          <h1 className="text-2xl font-bold text-notion-text">Settings</h1>
        </div>

        {/* Settings Sections */}
        <div className="space-y-6">
          {/* Subtitle Settings */}
          <section className="bg-notion-secondary rounded-xl p-6">
            <h2 className="text-lg font-semibold text-notion-text mb-4 flex items-center gap-2">
              <Type className="w-5 h-5" />
              Subtitle Settings
            </h2>
            
            <div className="space-y-4">
              {/* Min Words per Subtitle */}
              <div>
                <label className="flex items-center justify-between mb-2">
                  <span className="text-sm text-notion-text">Minimum words per subtitle</span>
                  <span className="text-sm font-mono text-primary">{settings.minWordsPerSubtitle}</span>
                </label>
                <input
                  type="range"
                  min={1}
                  max={30}
                  value={settings.minWordsPerSubtitle}
                  onChange={(e) => updateSettings({ minWordsPerSubtitle: parseInt(e.target.value) })}
                  className="w-full h-2 bg-notion-hover rounded-full appearance-none cursor-pointer
                    [&::-webkit-slider-thumb]:appearance-none
                    [&::-webkit-slider-thumb]:w-4
                    [&::-webkit-slider-thumb]:h-4
                    [&::-webkit-slider-thumb]:rounded-full
                    [&::-webkit-slider-thumb]:bg-primary
                    [&::-webkit-slider-thumb]:cursor-pointer"
                />
                <p className="text-xs text-notion-text-muted mt-1">
                  Short subtitles will be merged together until reaching this word count.
                </p>
              </div>
            </div>
          </section>

          {/* Practice Settings */}
          <section className="bg-notion-secondary rounded-xl p-6">
            <h2 className="text-lg font-semibold text-notion-text mb-4 flex items-center gap-2">
              <Target className="w-5 h-5" />
              Practice Settings
            </h2>
            
            <div className="space-y-4">
              {/* Accuracy Threshold */}
              <div>
                <label className="flex items-center justify-between mb-2">
                  <span className="text-sm text-notion-text">Accuracy threshold</span>
                  <span className="text-sm font-mono text-primary">{settings.accuracyThreshold}%</span>
                </label>
                <input
                  type="range"
                  min={50}
                  max={100}
                  value={settings.accuracyThreshold}
                  onChange={(e) => updateSettings({ accuracyThreshold: parseInt(e.target.value) })}
                  className="w-full h-2 bg-notion-hover rounded-full appearance-none cursor-pointer
                    [&::-webkit-slider-thumb]:appearance-none
                    [&::-webkit-slider-thumb]:w-4
                    [&::-webkit-slider-thumb]:h-4
                    [&::-webkit-slider-thumb]:rounded-full
                    [&::-webkit-slider-thumb]:bg-primary
                    [&::-webkit-slider-thumb]:cursor-pointer"
                />
                <p className="text-xs text-notion-text-muted mt-1">
                  Answers with accuracy at or above this threshold are considered correct.
                </p>
              </div>

              {/* Loop Delay */}
              <div>
                <label className="flex items-center justify-between mb-2">
                  <span className="text-sm text-notion-text flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    Loop delay
                  </span>
                  <span className="text-sm font-mono text-primary">{settings.loopDelayMs / 1000}s</span>
                </label>
                <input
                  type="range"
                  min={0}
                  max={3000}
                  step={100}
                  value={settings.loopDelayMs}
                  onChange={(e) => updateSettings({ loopDelayMs: parseInt(e.target.value) })}
                  className="w-full h-2 bg-notion-hover rounded-full appearance-none cursor-pointer
                    [&::-webkit-slider-thumb]:appearance-none
                    [&::-webkit-slider-thumb]:w-4
                    [&::-webkit-slider-thumb]:h-4
                    [&::-webkit-slider-thumb]:rounded-full
                    [&::-webkit-slider-thumb]:bg-primary
                    [&::-webkit-slider-thumb]:cursor-pointer"
                />
                <p className="text-xs text-notion-text-muted mt-1">
                  Pause duration before video replays the current segment.
                </p>
              </div>
            </div>
          </section>

          {/* Playback Settings */}
          <section className="bg-notion-secondary rounded-xl p-6">
            <h2 className="text-lg font-semibold text-notion-text mb-4 flex items-center gap-2">
              <Gauge className="w-5 h-5" />
              Playback Settings
            </h2>
            
            <div className="space-y-4">
              {/* Playback Speed */}
              <div>
                <label className="flex items-center justify-between mb-2">
                  <span className="text-sm text-notion-text">Default playback speed</span>
                  <span className="text-sm font-mono text-primary">{settings.playbackSpeed}x</span>
                </label>
                <input
                  type="range"
                  min={0.5}
                  max={2}
                  step={0.25}
                  value={settings.playbackSpeed}
                  onChange={(e) => updateSettings({ playbackSpeed: parseFloat(e.target.value) })}
                  className="w-full h-2 bg-notion-hover rounded-full appearance-none cursor-pointer
                    [&::-webkit-slider-thumb]:appearance-none
                    [&::-webkit-slider-thumb]:w-4
                    [&::-webkit-slider-thumb]:h-4
                    [&::-webkit-slider-thumb]:rounded-full
                    [&::-webkit-slider-thumb]:bg-primary
                    [&::-webkit-slider-thumb]:cursor-pointer"
                />
                <div className="flex justify-between text-xs text-notion-text-muted mt-1">
                  <span>0.5x</span>
                  <span>1x</span>
                  <span>1.5x</span>
                  <span>2x</span>
                </div>
              </div>
            </div>
          </section>

          {/* Reset Button */}
          <div className="flex justify-end">
            <button
              onClick={resetSettings}
              className="flex items-center gap-2 px-4 py-2 bg-notion-hover rounded-lg text-notion-text-muted hover:bg-notion-border hover:text-notion-text transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
              Reset to defaults
            </button>
          </div>

          {/* Current Values Reference */}
          <section className="bg-notion-main rounded-xl p-4 border border-notion-border">
            <h3 className="text-sm font-medium text-notion-text-muted mb-2">Current Values</h3>
            <div className="grid grid-cols-2 gap-2 text-xs font-mono">
              <div>
                <span className="text-notion-text-muted">Min words: </span>
                <span className="text-notion-text">{settings.minWordsPerSubtitle}</span>
              </div>
              <div>
                <span className="text-notion-text-muted">Accuracy: </span>
                <span className="text-notion-text">{settings.accuracyThreshold}%</span>
              </div>
              <div>
                <span className="text-notion-text-muted">Loop delay: </span>
                <span className="text-notion-text">{settings.loopDelayMs}ms</span>
              </div>
              <div>
                <span className="text-notion-text-muted">Speed: </span>
                <span className="text-notion-text">{settings.playbackSpeed}x</span>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default SettingPage;
