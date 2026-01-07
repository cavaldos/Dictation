import React from "react";
import { Plus } from "lucide-react";
import { Button } from "~/components/UI/button";
import ArchiveForm from "./ArchiveForm";
import ArchiveList from "./ArchiveList";
import ArchiveStats from "./ArchiveStats";
import type { DictationDocument } from "~/redux/features/dictationArchiveSlice";

interface ArchiveMainProps {
  documents: DictationDocument[];
  selectedDocumentId: string | null;
  editingDocumentId: string | null;
  onSelect: (doc: DictationDocument) => void;
  onEdit: (doc: DictationDocument) => void;
  onDelete: (id: string) => void;
  onAddDocument: (doc: Omit<DictationDocument, "id" | "createdAt" | "updatedAt">) => void;
}

const ArchiveMain: React.FC<ArchiveMainProps> = ({
  documents,
  selectedDocumentId,
  editingDocumentId,
  onSelect,
  onEdit,
  onDelete,
  onAddDocument,
}) => {
  const [isFormOpen, setIsFormOpen] = React.useState(false);

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-notion-text">
            Dictation Archive
          </h1>
          <p className="text-sm text-notion-text-muted mt-1">
            Save and manage your dictation documents
          </p>
        </div>
        <Button
          onClick={() => setIsFormOpen(!isFormOpen)}
          variant="default"
        >
          <Plus className="w-4 h-4" />
          Add New
        </Button>
      </div>

      {/* Add New Form */}
      {isFormOpen && (
        <ArchiveForm
          onSubmit={onAddDocument}
          onCancel={() => setIsFormOpen(false)}
        />
      )}

      {/* Document List */}
      <ArchiveList
        documents={documents}
        selectedDocumentId={selectedDocumentId}
        editingDocumentId={editingDocumentId}
        onSelect={onSelect}
        onEdit={onEdit}
        onDelete={onDelete}
        isEmpty={documents.length === 0}
      />

      {/* Stats */}
      {documents.length > 0 && <ArchiveStats documents={documents} />}
    </div>
  );
};

export default ArchiveMain;