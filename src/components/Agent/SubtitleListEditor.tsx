import React, { useState, useRef, useEffect } from "react";
import {
  Save,
  X,
  Plus,
  Trash2,
  Clock,
  GripVertical,
  ChevronLeft,
  Languages,
  Columns,
  LayoutList,
} from "lucide-react";
import { Button } from "~/components/UI/button";
import type { SubtitleItem } from "~/utils/youtube.service";
import type { CaptionTrack, CaptionLanguage } from "~/redux/features/dictationArchiveSlice";

type ViewMode = "single" | "dual";

interface SubtitleListEditorProps {
  tracks: CaptionTrack[];
  primaryLanguage: CaptionLanguage;
  onSave: (language: CaptionLanguage, subtitles: SubtitleItem[]) => void;
  onBack: () => void;
}

const SubtitleListEditor: React.FC<SubtitleListEditorProps> = ({
  tracks,
  primaryLanguage,
  onSave,
  onBack,
}) => {
  // View mode: single or dual language
  const [viewMode, setViewMode] = useState<ViewMode>(tracks.length > 1 ? "dual" : "single");

  // Selected languages for viewing
  const [primaryLang, setPrimaryLang] = useState<CaptionLanguage>(primaryLanguage);
  const [secondaryLang, setSecondaryLang] = useState<CaptionLanguage | null>(
    tracks.length > 1 ? tracks.find(t => t.language !== primaryLanguage)?.language || null : null
  );

  // Editable subtitles state - separate for each language
  const [editableSubtitles, setEditableSubtitles] = useState<Record<CaptionLanguage, SubtitleItem[]>>(
    tracks.reduce((acc, track) => {
      acc[track.language] = [...track.subtitles];
      return acc;
    }, {} as Record<CaptionLanguage, SubtitleItem[]>)
  );

  // Track changes for each language
  const [changedLanguages, setChangedLanguages] = useState<Set<CaptionLanguage>>(new Set());

  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editingLanguage, setEditingLanguage] = useState<CaptionLanguage | null>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Get current track data
  const primaryTrack = tracks.find(t => t.language === primaryLang);
  const secondaryTrack = secondaryLang ? tracks.find(t => t.language === secondaryLang) : null;

  const primarySubtitles = editableSubtitles[primaryLang] || [];
  const secondarySubtitles = secondaryLang ? editableSubtitles[secondaryLang] || [] : [];

  // Check for changes
  useEffect(() => {
    const changed = new Set<CaptionLanguage>();
    tracks.forEach(track => {
      const original = JSON.stringify(track.subtitles.map(s => ({ start: s.start, dur: s.dur, text: s.text })));
      const current = JSON.stringify((editableSubtitles[track.language] || []).map(s => ({ start: s.start, dur: s.dur, text: s.text })));
      if (original !== current) {
        changed.add(track.language);
      }
    });
    setChangedLanguages(changed);
  }, [editableSubtitles, tracks]);

  const hasChanges = changedLanguages.size > 0;

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 1000);
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}.${ms.toString().padStart(3, "0")}`;
  };

  const parseTime = (timeStr: string): number => {
    const match = timeStr.match(/^(\d+):(\d{2})\.(\d{3})$/);
    if (!match) return 0;
    const mins = parseInt(match[1], 10);
    const secs = parseInt(match[2], 10);
    const ms = parseInt(match[3], 10);
    return mins * 60 + secs + ms / 1000;
  };

  const handleTextChange = (language: CaptionLanguage, index: number, text: string) => {
    setEditableSubtitles(prev => ({
      ...prev,
      [language]: prev[language].map((s, i) => i === index ? { ...s, text } : s)
    }));
  };

  const handleStartChange = (language: CaptionLanguage, index: number, timeStr: string) => {
    const start = parseTime(timeStr);
    if (start >= 0) {
      setEditableSubtitles(prev => ({
        ...prev,
        [language]: prev[language].map((s, i) => i === index ? { ...s, start } : s)
      }));
    }
  };

  const handleDurChange = (language: CaptionLanguage, index: number, timeStr: string) => {
    const dur = parseTime(timeStr);
    if (dur > 0) {
      setEditableSubtitles(prev => ({
        ...prev,
        [language]: prev[language].map((s, i) => i === index ? { ...s, dur } : s)
      }));
    }
  };

  const handleDelete = (language: CaptionLanguage, index: number) => {
    const subs = editableSubtitles[language];
    if (subs.length <= 1) return;
    setEditableSubtitles(prev => ({
      ...prev,
      [language]: prev[language].filter((_, i) => i !== index)
    }));
    setEditingIndex(null);
    setEditingLanguage(null);
  };

  const handleAddAfter = (language: CaptionLanguage, index: number) => {
    const subs = editableSubtitles[language];
    const currentSub = subs[index];
    const nextSub = subs[index + 1];

    const newStart = currentSub.start + currentSub.dur;
    const newDur = nextSub ? Math.min(2, nextSub.start - newStart) : 2;

    const newSubtitle: SubtitleItem = {
      start: newStart,
      dur: Math.max(0.5, newDur),
      text: "",
    };

    setEditableSubtitles(prev => ({
      ...prev,
      [language]: [
        ...prev[language].slice(0, index + 1),
        newSubtitle,
        ...prev[language].slice(index + 1),
      ]
    }));
    setEditingIndex(index + 1);
    setEditingLanguage(language);
  };

  const handleSave = () => {
    // Save all changed languages
    changedLanguages.forEach(language => {
      const cleanedSubtitles = editableSubtitles[language]
        .filter(s => s.text.trim())
        .map(({ start, dur, text, translatedText }) => ({
          start,
          dur,
          text: text.trim(),
          ...(translatedText ? { translatedText } : {}),
        }));
      onSave(language, cleanedSubtitles);
    });
  };

  const handleBack = () => {
    if (hasChanges) {
      if (confirm("You have unsaved changes. Are you sure you want to go back?")) {
        onBack();
      }
    } else {
      onBack();
    }
  };

  const startEditing = (index: number, language: CaptionLanguage) => {
    setEditingIndex(index);
    setEditingLanguage(language);
  };

  const stopEditing = () => {
    setEditingIndex(null);
    setEditingLanguage(null);
  };

  // Render single language view
  const renderSingleView = () => {
    const subtitles = primarySubtitles;
    const language = primaryLang;

    return (
      <div className="divide-y divide-notion-border">
        {subtitles.map((subtitle, index) => (
          <div
            key={index}
            className={`group transition-colors ${editingIndex === index && editingLanguage === language
                ? "bg-primary/5"
                : "hover:bg-notion-hover"
              }`}
          >
            {editingIndex !== index || editingLanguage !== language ? (
              <div
                className="flex items-start gap-3 px-4 py-3 cursor-pointer"
                onClick={() => startEditing(index, language)}
              >
                <div className="flex items-center gap-2 text-notion-text-muted">
                  <GripVertical className="w-4 h-4 opacity-0 group-hover:opacity-50" />
                  <span className="text-xs font-mono w-6">{index + 1}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 text-xs text-notion-text-muted mb-1">
                    <Clock className="w-3 h-3" />
                    <span className="font-mono">
                      {formatTime(subtitle.start)} - {formatTime(subtitle.start + subtitle.dur)}
                    </span>
                  </div>
                  <p className="text-sm text-notion-text line-clamp-2">
                    {subtitle.text || <span className="text-notion-text-muted italic">Empty</span>}
                  </p>
                </div>
              </div>
            ) : (
              renderEditForm(subtitle, index, language)
            )}
          </div>
        ))}
      </div>
    );
  };

  // Render dual language view
  const renderDualView = () => {
    // Use primary subtitles as base for timing
    const baseSubs = primarySubtitles;

    return (
      <div className="divide-y divide-notion-border">
        {baseSubs.map((primarySub, index) => {
          const secondarySub = secondarySubtitles[index] || null;
          const isEditingPrimary = editingIndex === index && editingLanguage === primaryLang;
          const isEditingSecondary = editingIndex === index && editingLanguage === secondaryLang;

          return (
            <div key={index} className="group">
              {/* Time header */}
              <div className="flex items-center gap-2 px-4 py-2 bg-notion-bg-secondary text-xs text-notion-text-muted border-b border-notion-border">
                <span className="font-mono w-6">{index + 1}</span>
                <Clock className="w-3 h-3" />
                <span className="font-mono">
                  {formatTime(primarySub.start)} - {formatTime(primarySub.start + primarySub.dur)}
                </span>
              </div>

              <div className="flex">
                {/* Primary language column */}
                <div
                  className={`flex-1 border-r border-notion-border ${isEditingPrimary ? "bg-primary/5" : "hover:bg-notion-hover"
                    }`}
                >
                  {!isEditingPrimary ? (
                    <div
                      className="p-3 cursor-pointer min-h-[60px]"
                      onClick={() => startEditing(index, primaryLang)}
                    >
                      <div className="text-xs text-primary/60 mb-1">{primaryTrack?.languageLabel}</div>
                      <p className="text-sm text-notion-text">
                        {primarySub.text || <span className="text-notion-text-muted italic">Empty</span>}
                      </p>
                    </div>
                  ) : (
                    <div className="p-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs text-primary/60">{primaryTrack?.languageLabel}</span>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleAddAfter(primaryLang, index)}
                            className="text-xs h-6 px-2"
                          >
                            <Plus className="w-3 h-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(primaryLang, index)}
                            className="text-red-500 hover:text-red-600 h-6 px-2"
                            disabled={primarySubtitles.length <= 1}
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={stopEditing}
                            className="h-6 w-6"
                          >
                            <X className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                      <textarea
                        value={primarySub.text}
                        onChange={(e) => handleTextChange(primaryLang, index, e.target.value)}
                        rows={3}
                        className="w-full px-2 py-1.5 bg-notion-bg border border-notion-border rounded text-sm text-notion-text focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
                        autoFocus
                      />
                    </div>
                  )}
                </div>

                {/* Secondary language column */}
                {secondaryLang && (
                  <div
                    className={`flex-1 ${isEditingSecondary ? "bg-yellow-500/5" : "hover:bg-notion-hover"
                      }`}
                  >
                    {!isEditingSecondary ? (
                      <div
                        className="p-3 cursor-pointer min-h-[60px]"
                        onClick={() => secondarySub && startEditing(index, secondaryLang)}
                      >
                        <div className="text-xs text-yellow-500/60 mb-1">{secondaryTrack?.languageLabel}</div>
                        <p className="text-sm text-yellow-500/80">
                          {secondarySub?.text || <span className="text-notion-text-muted italic">No matching subtitle</span>}
                        </p>
                      </div>
                    ) : secondarySub ? (
                      <div className="p-3">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs text-yellow-500/60">{secondaryTrack?.languageLabel}</span>
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleAddAfter(secondaryLang, index)}
                              className="text-xs h-6 px-2"
                            >
                              <Plus className="w-3 h-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(secondaryLang, index)}
                              className="text-red-500 hover:text-red-600 h-6 px-2"
                              disabled={secondarySubtitles.length <= 1}
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={stopEditing}
                              className="h-6 w-6"
                            >
                              <X className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                        <textarea
                          value={secondarySub.text}
                          onChange={(e) => handleTextChange(secondaryLang, index, e.target.value)}
                          rows={3}
                          className="w-full px-2 py-1.5 bg-notion-bg border border-yellow-500/30 rounded text-sm text-yellow-500/80 focus:outline-none focus:ring-2 focus:ring-yellow-500/50 resize-none"
                          autoFocus
                        />
                      </div>
                    ) : null}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  // Render edit form for single view
  const renderEditForm = (subtitle: SubtitleItem, index: number, language: CaptionLanguage) => (
    <div className="px-4 py-3 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-notion-text-muted">
          Segment #{index + 1}
        </span>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              handleAddAfter(language, index);
            }}
            className="text-xs"
          >
            <Plus className="w-3 h-3 mr-1" />
            Add After
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              handleDelete(language, index);
            }}
            className="text-red-500 hover:text-red-600 hover:bg-red-500/10"
            disabled={editableSubtitles[language].length <= 1}
          >
            <Trash2 className="w-3 h-3" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={stopEditing}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Timing */}
      <div className="flex items-center gap-3">
        <div className="flex-1">
          <label className="block text-xs text-notion-text-muted mb-1">
            Start Time
          </label>
          <input
            type="text"
            value={formatTime(subtitle.start)}
            onChange={(e) => handleStartChange(language, index, e.target.value)}
            className="w-full px-2 py-1.5 bg-notion-bg border border-notion-border rounded text-sm font-mono text-notion-text focus:outline-none focus:ring-2 focus:ring-primary/50"
            placeholder="00:00.000"
          />
        </div>
        <div className="flex-1">
          <label className="block text-xs text-notion-text-muted mb-1">
            Duration
          </label>
          <input
            type="text"
            value={formatTime(subtitle.dur)}
            onChange={(e) => handleDurChange(language, index, e.target.value)}
            className="w-full px-2 py-1.5 bg-notion-bg border border-notion-border rounded text-sm font-mono text-notion-text focus:outline-none focus:ring-2 focus:ring-primary/50"
            placeholder="00:02.000"
          />
        </div>
        <div className="flex-1">
          <label className="block text-xs text-notion-text-muted mb-1">
            End Time
          </label>
          <div className="px-2 py-1.5 bg-notion-hover border border-notion-border rounded text-sm font-mono text-notion-text-muted">
            {formatTime(subtitle.start + subtitle.dur)}
          </div>
        </div>
      </div>

      {/* Text Content */}
      <div>
        <label className="block text-xs text-notion-text-muted mb-1">
          Subtitle Text
        </label>
        <textarea
          value={subtitle.text}
          onChange={(e) => handleTextChange(language, index, e.target.value)}
          rows={3}
          className="w-full px-3 py-2 bg-notion-bg border border-notion-border rounded text-sm text-notion-text focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
          placeholder="Enter subtitle text..."
          autoFocus
        />
      </div>
    </div>
  );

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-notion-border bg-notion-bg-secondary">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={handleBack}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <div>
            <h3 className="font-medium text-notion-text">Edit Subtitles</h3>
            <p className="text-xs text-notion-text-muted">
              {viewMode === "single"
                ? `${primaryTrack?.languageLabel} - ${primarySubtitles.length} segments`
                : `${primaryTrack?.languageLabel} + ${secondaryTrack?.languageLabel}`
              }
            </p>
          </div>
        </div>
        <Button
          variant="default"
          size="sm"
          onClick={handleSave}
          disabled={!hasChanges}
        >
          <Save className="w-3.5 h-3.5 mr-1" />
          Save {changedLanguages.size > 0 && `(${changedLanguages.size})`}
        </Button>
      </div>

      {/* View Mode & Language Selector */}
      <div className="px-4 py-2 border-b border-notion-border bg-notion-bg flex items-center gap-3">
        {/* View Mode Toggle */}
        <div className="flex items-center gap-1 bg-notion-bg-secondary rounded-lg p-1">
          <button
            onClick={() => setViewMode("single")}
            className={`flex items-center gap-1.5 px-2 py-1 rounded text-xs transition-colors ${viewMode === "single"
                ? "bg-primary text-white"
                : "text-notion-text-muted hover:text-notion-text"
              }`}
          >
            <LayoutList className="w-3.5 h-3.5" />
            Single
          </button>
          <button
            onClick={() => setViewMode("dual")}
            disabled={tracks.length < 2}
            className={`flex items-center gap-1.5 px-2 py-1 rounded text-xs transition-colors ${viewMode === "dual"
                ? "bg-primary text-white"
                : "text-notion-text-muted hover:text-notion-text disabled:opacity-50"
              }`}
          >
            <Columns className="w-3.5 h-3.5" />
            Dual
          </button>
        </div>

        {/* Language Selectors */}
        <div className="flex items-center gap-2 flex-1">
          <Languages className="w-4 h-4 text-notion-text-muted" />
          <select
            value={primaryLang}
            onChange={(e) => setPrimaryLang(e.target.value as CaptionLanguage)}
            className="px-2 py-1 bg-notion-bg-secondary border border-notion-border rounded text-xs text-notion-text focus:outline-none"
          >
            {tracks.map(track => (
              <option key={track.language} value={track.language}>
                {track.languageLabel}
              </option>
            ))}
          </select>

          {viewMode === "dual" && (
            <>
              <span className="text-notion-text-muted text-xs">+</span>
              <select
                value={secondaryLang || ""}
                onChange={(e) => setSecondaryLang(e.target.value as CaptionLanguage)}
                className="px-2 py-1 bg-yellow-500/10 border border-yellow-500/30 rounded text-xs text-yellow-500 focus:outline-none"
              >
                {tracks
                  .filter(t => t.language !== primaryLang)
                  .map(track => (
                    <option key={track.language} value={track.language}>
                      {track.languageLabel}
                    </option>
                  ))}
              </select>
            </>
          )}
        </div>

        {/* Changed indicator */}
        {changedLanguages.size > 0 && (
          <div className="text-xs text-yellow-500">
            {Array.from(changedLanguages).map(lang =>
              tracks.find(t => t.language === lang)?.languageLabel
            ).join(", ")} modified
          </div>
        )}
      </div>

      {/* Subtitle List */}
      <div ref={listRef} className="flex-1 overflow-auto">
        {viewMode === "single" ? renderSingleView() : renderDualView()}

        {/* Add New at Bottom */}
        <div className="p-4 border-t border-notion-border">
          <Button
            variant="outline"
            className="w-full"
            onClick={() => handleAddAfter(primaryLang, primarySubtitles.length - 1)}
          >
            <Plus className="w-4 h-4 mr-1" />
            Add New Segment
          </Button>
        </div>
      </div>

      {/* Footer with unsaved changes indicator */}
      {hasChanges && (
        <div className="px-4 py-2 bg-yellow-500/10 border-t border-yellow-500/20 text-center">
          <span className="text-xs text-yellow-500">You have unsaved changes</span>
        </div>
      )}
    </div>
  );
};

export default SubtitleListEditor;
