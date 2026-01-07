import React from "react";
import { Play, Trash2, FileText, Video, Calendar, Languages } from "lucide-react";
import { Button } from "~/components/UI/button";
import type { DictationDocument } from "~/redux/features/dictationArchiveSlice";

interface ArchiveItemProps {
  document: DictationDocument;
  isEditing: boolean;
  onSelect: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

const ArchiveItem: React.FC<ArchiveItemProps> = ({
  document,
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
      onClick={onEdit}
      className={`
        rounded-xl p-4 transition-all duration-200 cursor-pointer
        ${
          isEditing
            ? "bg-blue-500/10"
            : "bg-white/[0.03] hover:bg-white/[0.06]"
        }
      `}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-gray-100 truncate">
            {document.name}
          </h3>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-sm text-gray-500">
            <span className="flex items-center gap-1.5">
              <Video className="w-3.5 h-3.5" />
              {document.videoId}
            </span>
            <span className="flex items-center gap-1.5">
              <Languages className="w-3.5 h-3.5" />
              {document.captions?.map((c) => c.languageLabel).join(", ") || "N/A"}
            </span>
            <span className="flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5" />
              {getTotalSegments()} segments
            </span>
            <span className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" />
              {formatDate(document.createdAt)}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="default" 
            size="sm" 
            onClick={(e) => {
              e.stopPropagation();
              onSelect();
            }} 
            className="bg-primary hover:bg-primary/90"
          >
            <Play className="w-3.5 h-3.5" />
            Load
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="text-red-400 hover:text-red-300 hover:bg-red-500/10 h-8 w-8"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ArchiveItem;
