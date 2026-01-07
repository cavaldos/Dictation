import React from "react";
import { FileText } from "lucide-react";
import ArchiveItem from "./ArchiveItem";
import type { DictationDocument } from "~/redux/features/dictationArchiveSlice";

interface ArchiveListProps {
  documents: DictationDocument[];
  editingDocumentId: string | null;
  onSelect: (doc: DictationDocument) => void;
  onEdit: (doc: DictationDocument) => void;
  onDelete: (id: string) => void;
  isEmpty: boolean;
}

const ArchiveList: React.FC<ArchiveListProps> = ({
  documents,
  editingDocumentId,
  onSelect,
  onEdit,
  onDelete,
  isEmpty,
}) => {
  if (isEmpty) {
    return (
      <div className="text-center py-16 text-notion-text-muted">
        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-white/[0.03] flex items-center justify-center">
          <FileText className="w-8 h-8 opacity-50" />
        </div>
        <p className="text-gray-300 font-medium">No documents saved yet.</p>
        <p className="text-sm mt-1 text-gray-500">
          Click "Add New" to create your first dictation document.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {documents.map((doc) => (
        <ArchiveItem
          key={doc.id}
          document={doc}
          isEditing={editingDocumentId === doc.id}
          onSelect={() => onSelect(doc)}
          onEdit={() => onEdit(doc)}
          onDelete={() => onDelete(doc.id)}
        />
      ))}
    </div>
  );
};

export default ArchiveList;