import React from "react";
import { FileText } from "lucide-react";
import ArchiveItem from "./ArchiveItem";
import type { DictationDocument } from "~/redux/features/dictationArchiveSlice";

interface ArchiveListProps {
  documents: DictationDocument[];
  selectedDocumentId: string | null;
  editingDocumentId: string | null;
  onSelect: (doc: DictationDocument) => void;
  onEdit: (doc: DictationDocument) => void;
  onDelete: (id: string) => void;
  isEmpty: boolean;
}

const ArchiveList: React.FC<ArchiveListProps> = ({
  documents,
  selectedDocumentId,
  editingDocumentId,
  onSelect,
  onEdit,
  onDelete,
  isEmpty,
}) => {
  if (isEmpty) {
    return (
      <div className="text-center py-12 text-notion-text-muted">
        <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
        <p>No documents saved yet.</p>
        <p className="text-sm mt-1">
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
          isSelected={selectedDocumentId === doc.id}
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