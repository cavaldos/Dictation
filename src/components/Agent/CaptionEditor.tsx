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
import { parseSRT } from "~/lib/youtube.service";
import type { SubtitleItem } from "~/lib/youtube.service";
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
      <div className="h-full flex flex-col">
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
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06]">
        <h2 className="text-base font-semibold text-gray-100">Edit Document</h2>
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={onClose}
          className="h-8 w-8 hover:bg-white/[0.06]"
        >
          <X className="w-4 h-4" />
        </Button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-4 space-y-5">
        {/* Success Message */}
        {successMessage && (
          <div className="text-sm text-green-400 bg-green-500/10 px-3 py-2 rounded-lg">
            {successMessage}
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="text-sm text-red-400 bg-red-500/10 px-3 py-2 rounded-lg">
            {error}
          </div>
        )}

        {/* Document Name */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Document Name
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="flex-1 px-3 py-2 bg-white/[0.03] rounded-lg text-gray-200 focus:outline-none focus:bg-white/[0.06] transition-colors"
            />
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSaveName}
              disabled={!name.trim() || name === document.name}
              className="hover:bg-white/[0.06]"
            >
              <Save className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>

        {/* Primary Language */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Primary Language (for dictation)
          </label>
          <div className="flex gap-2">
            <select
              value={primaryLanguage}
              onChange={(e) =>
                setPrimaryLanguage(e.target.value as CaptionLanguage)
              }
              className="flex-1 px-3 py-2 bg-white/[0.03] rounded-lg text-gray-200 focus:outline-none focus:bg-white/[0.06] transition-colors"
            >
              {document.captions.map((track) => (
                <option key={track.language} value={track.language}>
                  {track.languageLabel}
                </option>
              ))}
            </select>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSavePrimaryLanguage}
              disabled={primaryLanguage === document.primaryLanguage}
              className="hover:bg-white/[0.06]"
            >
              <Save className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>

        {/* Caption Tracks */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <label className="text-sm font-medium text-gray-300 flex items-center gap-2">
              <Languages className="w-4 h-4" />
              Caption Tracks ({document.captions.length})
            </label>
          </div>

          <div className="space-y-2">
            {document.captions.map((track) => (
              <div
                key={track.language}
                className={`rounded-xl overflow-hidden transition-all ${
                  expandedTrack === track.language 
                    ? 'bg-white/[0.04]' 
                    : 'bg-white/[0.02] hover:bg-white/[0.04]'
                }`}
              >
                {/* Track Header */}
                <div
                  className="flex items-center justify-between px-3 py-2.5 cursor-pointer"
                  onClick={() => toggleExpand(track.language)}
                >
                  <div className="flex items-center gap-2">
                    {expandedTrack === track.language ? (
                      <ChevronUp className="w-4 h-4 text-gray-500" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-gray-500" />
                    )}
                    <span className="font-medium text-gray-200">
                      {track.languageLabel}
                    </span>
                    {track.language === document.primaryLanguage && (
                      <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full">
                        Primary
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-gray-500 bg-white/[0.05] px-2 py-0.5 rounded-full">
                    {track.subtitles.length} segments
                  </span>
                </div>

                {/* Track Content */}
                {expandedTrack === track.language && (
                  <div className="px-3 pb-3 pt-1 space-y-3">
                    {/* Edit Subtitles Button */}
                    <Button
                      variant="ghost"
                      className="w-full justify-start bg-white/[0.03] hover:bg-white/[0.06]"
                      onClick={() => handleOpenSubtitleEditor()}
                    >
                      <List className="w-4 h-4 mr-2" />
                      Edit Subtitles List
                      <span className="ml-auto text-xs text-gray-500">
                        {track.subtitles.length} items
                      </span>
                    </Button>

                    <div className="relative py-2">
                      <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-white/[0.06]"></div>
                      </div>
                      <div className="relative flex justify-center text-xs">
                        <span className="px-2 bg-[rgb(30,30,30)] text-gray-500">
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
                      rows={5}
                      className="w-full px-3 py-2 bg-black/20 rounded-lg text-gray-300 font-mono text-sm focus:outline-none focus:bg-black/30 transition-colors resize-none"
                      placeholder="SRT content..."
                    />
                    <div className="flex justify-between mt-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveTrack(track.language)}
                        className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                        disabled={document.captions.length <= 1}
                      >
                        <Trash2 className="w-3.5 h-3.5 mr-1" />
                        Remove
                      </Button>
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => handleSaveTrack(track.language)}
                        className="bg-primary hover:bg-primary/90"
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
          <div className="border-2 border-dashed border-white/10 rounded-xl p-4 hover:border-white/20 transition-colors">
            <h3 className="text-sm font-medium text-gray-300 mb-3 flex items-center gap-2">
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
              className="w-full px-3 py-2 bg-white/[0.03] rounded-lg text-gray-200 focus:outline-none focus:bg-white/[0.06] transition-colors mb-3"
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
                  rows={5}
                  className="w-full px-3 py-2 bg-black/20 rounded-lg text-gray-300 font-mono text-sm focus:outline-none focus:bg-black/30 transition-colors resize-none"
                  placeholder="Paste SRT content here..."
                />
                <Button
                  variant="default"
                  className="w-full mt-3 bg-primary hover:bg-primary/90"
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
