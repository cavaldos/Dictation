import React from "react";
import type { DictationDocument } from "~/redux/features/dictationArchiveSlice";

interface ArchiveStatsProps {
  documents: DictationDocument[];
}

const ArchiveStats: React.FC<ArchiveStatsProps> = ({ documents }) => {
  const getTotalSegments = () => {
    return (documents || []).reduce((acc, doc) => 
      acc + (doc.captions || []).reduce((captionAcc, track) => captionAcc + (track.subtitles?.length || 0), 0), 
      0
    );
  };

  return (
    <div className="mt-6 pt-6 border-t border-notion-border">
      <p className="text-sm text-notion-text-muted">
        Total: {(documents || []).length} document
        {(documents || []).length > 1 ? "s" : ""} |{" "}
        {getTotalSegments()} total segments
      </p>
    </div>
  );
};

export default ArchiveStats;