import React, { useState } from "react";
import { Plus, X } from "lucide-react";
import { Button } from "~/components/UI/button";
import DropZone from "~/components/UI/DropZone";
import { extractVideoId, parseSRT } from "~/lib/youtube.service";
import type { SubtitleItem } from "~/lib/youtube.service";
import type { DictationDocument, CaptionLanguage, CaptionTrack } from "~/redux/features/dictationArchiveSlice";

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

interface CaptionInput {
    id: string;
    language: CaptionLanguage;
    content: string;
    fileName: string;
}

interface ArchiveFormProps {
    onSubmit: (doc: Omit<DictationDocument, "id" | "createdAt" | "updatedAt">) => void;
    onCancel: () => void;
}

const ArchiveForm: React.FC<ArchiveFormProps> = ({ onSubmit, onCancel }) => {
    const [name, setName] = useState("");
    const [videoUrl, setVideoUrl] = useState("");
    const [captionInputs, setCaptionInputs] = useState<CaptionInput[]>([
        { id: crypto.randomUUID(), language: "en", content: "", fileName: "" },
    ]);
    const [primaryLanguage, setPrimaryLanguage] = useState<CaptionLanguage>("en");
    const [error, setError] = useState("");

    const addCaptionInput = () => {
        // Find first unused language
        const usedLanguages = captionInputs.map((c) => c.language);
        const availableLanguage = LANGUAGE_OPTIONS.find(
            (opt) => !usedLanguages.includes(opt.value)
        );

        setCaptionInputs([
            ...captionInputs,
            {
                id: crypto.randomUUID(),
                language: availableLanguage?.value || "other",
                content: "",
                fileName: "",
            },
        ]);
    };

    const removeCaptionInput = (id: string) => {
        if (captionInputs.length > 1) {
            const newInputs = captionInputs.filter((c) => c.id !== id);
            setCaptionInputs(newInputs);
            // Update primary language if removed
            const removedInput = captionInputs.find((c) => c.id === id);
            if (removedInput?.language === primaryLanguage && newInputs.length > 0) {
                setPrimaryLanguage(newInputs[0].language);
            }
        }
    };

    const updateCaptionInput = (
        id: string,
        updates: Partial<Omit<CaptionInput, "id">>
    ) => {
        setCaptionInputs(
            captionInputs.map((c) => (c.id === id ? { ...c, ...updates } : c))
        );
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        // Validate
        if (!name.trim()) {
            setError("Please enter a name for this document");
            return;
        }

        if (!videoUrl.trim()) {
            setError("Please enter a YouTube video URL");
            return;
        }

        const videoId = extractVideoId(videoUrl);
        if (!videoId) {
            setError(
                "Invalid YouTube URL. Please enter a valid YouTube video link."
            );
            return;
        }

        // Validate at least one caption has content
        const validCaptions = captionInputs.filter((c) => c.content.trim());
        if (validCaptions.length === 0) {
            setError("Please add at least one caption track");
            return;
        }

        // Parse all captions
        const captions: CaptionTrack[] = [];
        for (const input of validCaptions) {
            let subtitles: SubtitleItem[];
            try {
                subtitles = parseSRT(input.content);
                if (subtitles.length === 0) {
                    setError(
                        `Could not parse ${LANGUAGE_OPTIONS.find((l) => l.value === input.language)?.label
                        } subtitles. Please check the format (SRT).`
                    );
                    return;
                }
            } catch {
                setError(
                    `Failed to parse ${LANGUAGE_OPTIONS.find((l) => l.value === input.language)?.label
                    } subtitles.`
                );
                return;
            }

            captions.push({
                language: input.language,
                languageLabel:
                    LANGUAGE_OPTIONS.find((l) => l.value === input.language)?.label ||
                    "Unknown",
                subtitles,
                rawContent: input.content,
            });
        }

        // Ensure primary language exists in captions
        const finalPrimaryLanguage = captions.some(
            (c) => c.language === primaryLanguage
        )
            ? primaryLanguage
            : captions[0].language;

        // Submit document
        onSubmit({
            name: name.trim(),
            videoUrl: videoUrl.trim(),
            videoId,
            captions,
            primaryLanguage: finalPrimaryLanguage,
        });

        // Reset form
        resetForm();
    };

    const resetForm = () => {
        setName("");
        setVideoUrl("");
        setCaptionInputs([
            { id: crypto.randomUUID(), language: "en", content: "", fileName: "" },
        ]);
        setPrimaryLanguage("en");
        setError("");
        onCancel();
    };

    return (
        <div className="p-6">
            <form onSubmit={handleSubmit} className="space-y-5">
                {/* Name */}
                <div>
                    <label className="block text-sm font-medium text-notion-text mb-2">
                        Document Name
                    </label>
                    <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="e.g., English Listening Practice #1"
                        className="w-full px-3 py-2 bg-white/[0.03] rounded-lg text-notion-text placeholder:text-notion-text-muted focus:outline-none focus:bg-white/[0.06] transition-colors"
                    />
                </div>

                {/* Video URL */}
                <div>
                    <label className="block text-sm font-medium text-notion-text mb-2">
                        YouTube Video URL
                    </label>
                    <input
                        type="text"
                        value={videoUrl}
                        onChange={(e) => setVideoUrl(e.target.value)}
                        placeholder="https://www.youtube.com/watch?v=..."
                        className="w-full px-3 py-2 bg-white/[0.03] rounded-lg text-notion-text placeholder:text-notion-text-muted focus:outline-none focus:bg-white/[0.06] transition-colors"
                    />
                </div>

                {/* Caption Tracks */}
                <div>
                    <div className="flex items-center justify-between mb-3">
                        <label className="block text-sm font-medium text-notion-text">
                            Caption Tracks
                        </label>
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={addCaptionInput}
                            className="text-xs"
                        >
                            <Plus className="w-3.5 h-3.5" />
                            Add Language
                        </Button>
                    </div>

                    <div className="space-y-4">
                        {captionInputs.map((input, index) => (
                            <div
                                key={input.id}
                                className="rounded-xl p-4 bg-white/[0.03]"
                            >
                                <div className="flex items-center gap-3 mb-3">
                                    <select
                                        value={input.language}
                                        onChange={(e) =>
                                            updateCaptionInput(input.id, {
                                                language: e.target.value as CaptionLanguage,
                                            })
                                        }
                                        className="flex-1 px-3 py-2 bg-white/[0.05] rounded-lg text-notion-text focus:outline-none focus:bg-white/[0.08] transition-colors"
                                    >
                                        {LANGUAGE_OPTIONS.map((opt) => (
                                            <option key={opt.value} value={opt.value}>
                                                {opt.label}
                                            </option>
                                        ))}
                                    </select>

                                    <label className="flex items-center gap-2 text-sm text-notion-text-muted cursor-pointer">
                                        <input
                                            type="radio"
                                            name="primaryLanguage"
                                            checked={primaryLanguage === input.language}
                                            onChange={() =>
                                                setPrimaryLanguage(input.language)
                                            }
                                            className="accent-primary"
                                        />
                                        Primary
                                    </label>

                                    {captionInputs.length > 1 && (
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => removeCaptionInput(input.id)}
                                            className="text-red-400 hover:text-red-300 hover:bg-red-500/10 h-8 w-8"
                                        >
                                            <X className="w-4 h-4" />
                                        </Button>
                                    )}
                                </div>

                                <DropZone
                                    label={`Upload ${LANGUAGE_OPTIONS.find(
                                        (l) => l.value === input.language
                                    )?.label
                                        } Subtitle`}
                                    onFileLoad={(content) =>
                                        updateCaptionInput(input.id, {
                                            content,
                                            fileName: "subtitle.srt",
                                        })
                                    }
                                    fileName={input.fileName}
                                    onClear={() =>
                                        updateCaptionInput(input.id, {
                                            content: "",
                                            fileName: "",
                                        })
                                    }
                                />

                                {index === 0 && (
                                    <p className="text-xs text-notion-text-muted mt-3">
                                        Or paste subtitle content below:
                                    </p>
                                )}
                                <textarea
                                    value={input.content}
                                    onChange={(e) =>
                                        updateCaptionInput(input.id, {
                                            content: e.target.value,
                                            fileName: e.target.value ? "pasted-content" : "",
                                        })
                                    }
                                    placeholder={`1\n00:00:01,000 --> 00:00:04,000\nHello, this is an example subtitle.\n\n2\n00:00:05,000 --> 00:00:08,000\nThis is the second line.`}
                                    rows={4}
                                    className="w-full mt-2 px-3 py-2 bg-white/[0.05] rounded-lg text-notion-text placeholder:text-notion-text-muted focus:outline-none focus:bg-white/[0.08] transition-colors font-mono text-sm resize-none"
                                />
                            </div>
                        ))}
                    </div>
                </div>

                {/* Error */}
                {error && (
                    <div className="text-sm text-red-400 bg-red-500/10 px-4 py-3 rounded-lg">
                        {error}
                    </div>
                )}

                {/* Actions */}
                <div className="flex gap-3 pt-2">
                    <Button type="submit" variant="default" className="bg-primary hover:bg-primary/90">
                        Save Document
                    </Button>
                    <Button type="button" variant="ghost" onClick={resetForm} className="hover:bg-white/[0.05]">
                        Cancel
                    </Button>
                </div>
            </form>
        </div>
    );
};

export default ArchiveForm;