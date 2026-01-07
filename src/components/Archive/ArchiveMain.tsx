import React from "react";
import { Plus } from "lucide-react";
import { Button } from "~/components/UI/button";
import Modal from "~/components/UI/Modal";
import ArchiveForm from "./ArchiveForm";
import ArchiveList from "./ArchiveList";
import ArchiveStats from "./ArchiveStats";
import type { DictationDocument } from "~/redux/features/dictationArchiveSlice";

interface ArchiveMainProps {
  documents: DictationDocument[];
  editingDocumentId: string | null;
  onSelect: (doc: DictationDocument) => void;
  onEdit: (doc: DictationDocument) => void;
  onDelete: (id: string) => void;
  onAddDocument: (doc: Omit<DictationDocument, "id" | "createdAt" | "updatedAt">) => void;
}

const ArchiveMain: React.FC<ArchiveMainProps> = ({
  documents,
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
        </div>
        <Button
          onClick={() => setIsFormOpen(!isFormOpen)}
          variant="default"
        >
          <Plus className="w-4 h-4" />
          Add New
        </Button>
      </div>

      {/* Add New Form Modal */}
      <Modal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        title="Add New Document"
        maxWidth="max-w-2xl"
      >
        <ArchiveForm
          onSubmit={(doc) => {
            onAddDocument(doc);
            setIsFormOpen(false);
          }}
          onCancel={() => setIsFormOpen(false)}
        />
      </Modal>

      {/* Document List */}
      <ArchiveList
        documents={documents}
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