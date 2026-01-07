import React, { useState } from "react";
import { useDispatch } from "react-redux";
import {
  X,
  Save,
  Plus,
  Trash2,
  Languages,
  ChevronDown,
  ChevronUp,
  List,
} from "lucide-react";
import { Button } from "~/components/UI/button";
import DropZone from "~/components/UI/DropZone";
import SubtitleListEditor from "~/components/Agent/SubtitleListEditor";
import { parseSRT } from "~/utils/youtube.service";
import type { SubtitleItem } from "~/utils/youtube.service";
import {
  updateDocument,
  addCaptionTrack,
  removeCaptionTrack,
  updateCaptionTrack,
  type DictationDocument,
  type CaptionLanguage,
  type CaptionTrack,
} from "~/redux/features/dictationArchiveSlice";

// Language options
const LANGUAGE_OPTIONS: { value: CaptionLanguage; label: string }[] = [
  { value: "en", label: "English" },
  { value: "vi", label: "Tiếng Việt" },
  { value: "ja", label: "日本語 (Japanese)" },
  { value: "ko", label: "한국어 (Korean)" },
  { value: "zh", label: "中文 (Chinese)" },
  { value: "fr", label: "Français (French)" },
  { value: "de", label: "Deutsch (German)" },
  { value: "es", label: "Español (Spanish)" },
  { value: "other", label: "Other" },
];

interface CaptionEditorProps {
  document: DictationDocument;
  onClose: () => void;
}

type EditorView = "main" | "subtitle-list";

const CaptionEditor: React.FC<CaptionEditorProps> = ({ document, onClose }) => {
  const dispatch = useDispatch();
  const [name, setName] = useState(document.name);
  const [primaryLanguage, setPrimaryLanguage] = useState(
    document.primaryLanguage
  );
  const [expandedTrack, setExpandedTrack] = useState<CaptionLanguage | null>(
    document.captions[0]?.language || null
  );
  const [editingContent, setEditingContent] = useState<
    Record<CaptionLanguage, string>
  >(
    document.captions.reduce((acc, track) => {
      acc[track.language] = track.rawContent || "";
      return acc;
    }, {} as Record<CaptionLanguage, string>)
  );
  const [newTrackLanguage, setNewTrackLanguage] =
    useState<CaptionLanguage | null>(null);
  const [newTrackContent, setNewTrackContent] = useState("");
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // View state for subtitle list editor
  const [currentView, setCurrentView] = useState<EditorView>("main");

  const usedLanguages = document.captions.map((c) => c.language);
  const availableLanguages = LANGUAGE_OPTIONS.filter(
    (opt) => !usedLanguages.includes(opt.value)
  );

  const handleSaveName = () => {
    if (name.trim() && name !== document.name) {
      dispatch(
        updateDocument({
          id: document.id,
          updates: { name: name.trim() },
        })
      );
      showSuccess("Name updated");
    }
  };

  const handleSavePrimaryLanguage = () => {
    if (primaryLanguage !== document.primaryLanguage) {
      dispatch(
        updateDocument({
          id: document.id,
          updates: { primaryLanguage },
        })
      );
      showSuccess("Primary language updated");
    }
  };

  const handleSaveTrack = (language: CaptionLanguage) => {
    const content = editingContent[language];
    if (!content?.trim()) {
      setError("Caption content cannot be empty");
      return;
    }

    try {
      const subtitles = parseSRT(content);
      if (subtitles.length === 0) {
        setError("Could not parse subtitles. Please check the format (SRT).");
        return;
      }

      dispatch(
        updateCaptionTrack({
          documentId: document.id,
          language,
          updates: {
            subtitles,
            rawContent: content,
          },
        })
      );
      setError("");
      showSuccess(`${getLanguageLabel(language)} captions updated`);
    } catch {
      setError("Failed to parse subtitles");
    }
  };

  const handleAddTrack = () => {
    if (!newTrackLanguage) {
      setError("Please select a language");
      return;
    }

    if (!newTrackContent.trim()) {
      setError("Please add caption content");
      return;
    }

    try {
      const subtitles = parseSRT(newTrackContent);
      if (subtitles.length === 0) {
        setError("Could not parse subtitles. Please check the format (SRT).");
        return;
      }

      const newTrack: CaptionTrack = {
        language: newTrackLanguage,
        languageLabel: getLanguageLabel(newTrackLanguage),
        subtitles,
        rawContent: newTrackContent,
      };

      dispatch(
        addCaptionTrack({
          documentId: document.id,
          track: newTrack,
        })
      );

      // Update local state
      setEditingContent({
        ...editingContent,
        [newTrackLanguage]: newTrackContent,
      });

      // Reset form
      setNewTrackLanguage(null);
      setNewTrackContent("");
      setError("");
      showSuccess(`${getLanguageLabel(newTrackLanguage)} track added`);
    } catch {
      setError("Failed to parse subtitles");
    }
  };

  const handleRemoveTrack = (language: CaptionLanguage) => {
    if (document.captions.length <= 1) {
      setError("Cannot remove the last caption track");
      return;
    }

    if (
      confirm(
        `Are you sure you want to remove ${getLanguageLabel(language)} captions?`
      )
    ) {
      dispatch(
        removeCaptionTrack({
          documentId: document.id,
          language,
        })
      );

      // Update local state
      const newContent = { ...editingContent };
      delete newContent[language];
      setEditingContent(newContent);

      // Update primary if needed
      if (primaryLanguage === language) {
        const remaining = document.captions.filter(
          (c) => c.language !== language
        );
        if (remaining.length > 0) {
          setPrimaryLanguage(remaining[0].language);
        }
      }

      showSuccess(`${getLanguageLabel(language)} track removed`);
    }
  };

  const handleOpenSubtitleEditor = () => {
    setCurrentView("subtitle-list");
  };

  const handleSaveSubtitles = (language: CaptionLanguage, subtitles: SubtitleItem[]) => {
    // Convert subtitles back to SRT format for rawContent
    const rawContent = subtitlesToSRT(subtitles);

    dispatch(
      updateCaptionTrack({
        documentId: document.id,
        language,
        updates: {
          subtitles,
          rawContent,
        },
      })
    );

    // Update local editing content
    setEditingContent({
      ...editingContent,
      [language]: rawContent,
    });

    showSuccess(`${getLanguageLabel(language)} subtitles updated`);
  };

  const handleBackFromSubtitleEditor = () => {
    setCurrentView("main");
  };

  const getLanguageLabel = (lang: CaptionLanguage) => {
    return LANGUAGE_OPTIONS.find((l) => l.value === lang)?.label || lang;
  };

  const showSuccess = (message: string) => {
    setSuccessMessage(message);
    setTimeout(() => setSuccessMessage(""), 2000);
  };

  const toggleExpand = (language: CaptionLanguage) => {
    setExpandedTrack(expandedTrack === language ? null : language);
  };

  // Convert subtitles array to SRT format
  const subtitlesToSRT = (subtitles: SubtitleItem[]): string => {
    return subtitles
      .map((sub, index) => {
        const startTime = formatSRTTime(sub.start);
        const endTime = formatSRTTime(sub.start + sub.dur);
        return `${index + 1}\n${startTime} --> ${endTime}\n${sub.text}`;
      })
      .join("\n\n");
  };

  const formatSRTTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 1000);
    return `${hours.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")},${ms.toString().padStart(3, "0")}`;
  };

  // Render subtitle list editor view
  if (currentView === "subtitle-list") {
    return (
      <div className="w-[480px] border-l border-notion-border bg-notion-bg-secondary h-full">
        <SubtitleListEditor
          tracks={document.captions}
          primaryLanguage={document.primaryLanguage}
          onSave={handleSaveSubtitles}
          onBack={handleBackFromSubtitleEditor}
        />
      </div>
    );
  }

  // Main editor view
  return (
    <div className="w-[480px] border-l border-notion-border bg-notion-bg-secondary h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-notion-border">
        <h2 className="text-lg font-semibold text-notion-text">Edit Document</h2>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="w-4 h-4" />
        </Button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-4 space-y-6">
        {/* Success Message */}
        {successMessage && (
          <div className="text-sm text-green-500 bg-green-500/10 px-3 py-2 rounded-md">
            {successMessage}
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="text-sm text-red-500 bg-red-500/10 px-3 py-2 rounded-md">
            {error}
          </div>
        )}

        {/* Document Name */}
        <div>
          <label className="block text-sm font-medium text-notion-text mb-1">
            Document Name
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="flex-1 px-3 py-2 bg-notion-bg border border-notion-border rounded-md text-notion-text focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
            <Button
              variant="outline"
              size="sm"
              onClick={handleSaveName}
              disabled={!name.trim() || name === document.name}
            >
              <Save className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>

        {/* Primary Language */}
        <div>
          <label className="block text-sm font-medium text-notion-text mb-1">
            Primary Language (for dictation)
          </label>
          <div className="flex gap-2">
            <select
              value={primaryLanguage}
              onChange={(e) =>
                setPrimaryLanguage(e.target.value as CaptionLanguage)
              }
              className="flex-1 px-3 py-2 bg-notion-bg border border-notion-border rounded-md text-notion-text focus:outline-none focus:ring-2 focus:ring-primary/50"
            >
              {document.captions.map((track) => (
                <option key={track.language} value={track.language}>
                  {track.languageLabel}
                </option>
              ))}
            </select>
            <Button
              variant="outline"
              size="sm"
              onClick={handleSavePrimaryLanguage}
              disabled={primaryLanguage === document.primaryLanguage}
            >
              <Save className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>

        {/* Caption Tracks */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium text-notion-text flex items-center gap-2">
              <Languages className="w-4 h-4" />
              Caption Tracks ({document.captions.length})
            </label>
          </div>

          <div className="space-y-2">
            {document.captions.map((track) => (
              <div
                key={track.language}
                className="border border-notion-border rounded-lg bg-notion-bg overflow-hidden"
              >
                {/* Track Header */}
                <div
                  className="flex items-center justify-between px-3 py-2 cursor-pointer hover:bg-notion-hover"
                  onClick={() => toggleExpand(track.language)}
                >
                  <div className="flex items-center gap-2">
                    {expandedTrack === track.language ? (
                      <ChevronUp className="w-4 h-4 text-notion-text-muted" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-notion-text-muted" />
                    )}
                    <span className="font-medium text-notion-text">
                      {track.languageLabel}
                    </span>
                    {track.language === document.primaryLanguage && (
                      <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded">
                        Primary
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-notion-text-muted">
                    {track.subtitles.length} segments
                  </span>
                </div>

                {/* Track Content */}
                {expandedTrack === track.language && (
                  <div className="px-3 pb-3 border-t border-notion-border pt-3 space-y-3">
                    {/* Edit Subtitles Button */}
                    <Button
                      variant="outline"
                      className="w-full justify-start"
                      onClick={() => handleOpenSubtitleEditor()}
                    >
                      <List className="w-4 h-4 mr-2" />
                      Edit Subtitles List
                      <span className="ml-auto text-xs text-notion-text-muted">
                        {track.subtitles.length} items
                      </span>
                    </Button>

                    <div className="relative">
                      <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-notion-border"></div>
                      </div>
                      <div className="relative flex justify-center text-xs">
                        <span className="px-2 bg-notion-bg text-notion-text-muted">
                          or upload/paste SRT
                        </span>
                      </div>
                    </div>

                    <DropZone
                      label={`Upload new ${track.languageLabel} subtitle`}
                      onFileLoad={(content) =>
                        setEditingContent({
                          ...editingContent,
                          [track.language]: content,
                        })
                      }
                      className="mb-2"
                    />
                    <textarea
                      value={editingContent[track.language] || ""}
                      onChange={(e) =>
                        setEditingContent({
                          ...editingContent,
                          [track.language]: e.target.value,
                        })
                      }
                      rows={6}
                      className="w-full px-3 py-2 bg-notion-bg-secondary border border-notion-border rounded-md text-notion-text font-mono text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                      placeholder="SRT content..."
                    />
                    <div className="flex justify-between mt-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveTrack(track.language)}
                        className="text-red-500 hover:text-red-600 hover:bg-red-500/10"
                        disabled={document.captions.length <= 1}
                      >
                        <Trash2 className="w-3.5 h-3.5 mr-1" />
                        Remove
                      </Button>
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => handleSaveTrack(track.language)}
                      >
                        <Save className="w-3.5 h-3.5 mr-1" />
                        Save SRT
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Add New Track */}
        {availableLanguages.length > 0 && (
          <div className="border border-dashed border-notion-border rounded-lg p-4">
            <h3 className="text-sm font-medium text-notion-text mb-3 flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Add New Caption Track
            </h3>

            <select
              value={newTrackLanguage || ""}
              onChange={(e) =>
                setNewTrackLanguage(
                  e.target.value ? (e.target.value as CaptionLanguage) : null
                )
              }
              className="w-full px-3 py-2 bg-notion-bg border border-notion-border rounded-md text-notion-text focus:outline-none focus:ring-2 focus:ring-primary/50 mb-3"
            >
              <option value="">Select language...</option>
              {availableLanguages.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>

            {newTrackLanguage && (
              <>
                <DropZone
                  label={`Upload ${getLanguageLabel(newTrackLanguage)} subtitle`}
                  onFileLoad={(content) => setNewTrackContent(content)}
                  className="mb-2"
                />
                <textarea
                  value={newTrackContent}
                  onChange={(e) => setNewTrackContent(e.target.value)}
                  rows={6}
                  className="w-full px-3 py-2 bg-notion-bg border border-notion-border rounded-md text-notion-text font-mono text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                  placeholder="Paste SRT content here..."
                />
                <Button
                  variant="default"
                  className="w-full mt-3"
                  onClick={handleAddTrack}
                  disabled={!newTrackContent.trim()}
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Add Track
                </Button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default CaptionEditor;
