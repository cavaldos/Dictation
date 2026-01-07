import React from "react";
import { Play, Trash2, Pencil, FileText, Video, Calendar, Languages } from "lucide-react";
import { Button } from "~/components/UI/button";
import type { DictationDocument } from "~/redux/features/dictationArchiveSlice";

interface ArchiveItemProps {
  document: DictationDocument;
  isSelected: boolean;
  isEditing: boolean;
  onSelect: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

const ArchiveItem: React.FC<ArchiveItemProps> = ({
  document,
  isSelected,
  isEditing,
  onSelect,
  onEdit,
  onDelete,
}) => {
  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString("vi-VN", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getTotalSegments = () => {
    return document.captions?.reduce((acc, track) => acc + (track.subtitles?.length || 0), 0) || 0;
  };

  return (
    <div
      className={`
        bg-notion-bg-secondary border rounded-lg p-4 transition-all
        ${
          isSelected
            ? "border-primary ring-2 ring-primary/20"
            : isEditing
            ? "border-blue-500 ring-2 ring-blue-500/20"
            : "border-notion-border hover:border-notion-border-hover"
        }
      `}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-notion-text truncate">
            {document.name}
          </h3>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-sm text-notion-text-muted">
            <span className="flex items-center gap-1">
              <Video className="w-3.5 h-3.5" />
              {document.videoId}
            </span>
            <span className="flex items-center gap-1">
              <Languages className="w-3.5 h-3.5" />
              {document.captions?.map((c) => c.languageLabel).join(", ") || "N/A"}
            </span>
            <span className="flex items-center gap-1">
              <FileText className="w-3.5 h-3.5" />
              {getTotalSegments()} segments
            </span>
            <span className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              {formatDate(document.createdAt)}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="default" size="sm" onClick={onSelect}>
            <Play className="w-3.5 h-3.5" />
            Load
          </Button>
          <Button variant="outline" size="sm" onClick={onEdit}>
            <Pencil className="w-3.5 h-3.5" />
            Edit
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={onDelete}
            className="text-red-500 hover:text-red-600 hover:bg-red-500/10"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ArchiveItem;
