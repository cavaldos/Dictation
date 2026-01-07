import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import MainLayout from '~/components/Layout/main.layout';
import ArchiveMain from '~/components/Archive/ArchiveMain';
import CaptionEditor from '~/components/Agent/CaptionEditor';
import {
  addDocument,
  removeDocument,
  selectDocument,
  setEditingDocument,
  type DictationDocument,
} from '~/redux/features/dictationArchiveSlice';
import { loadFromArchive } from '~/redux/features/dictationSlice';
import type { RootState } from '~/redux/store';

const ArchivePage: React.FC = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { documents, selectedDocumentId, editingDocumentId } = useSelector(
    (state: RootState) => state.dictationArchive
  );

  const editingDocument = editingDocumentId
    ? documents.find((d) => d.id === editingDocumentId)
    : null;

  const handleSelect = (doc: DictationDocument) => {
    dispatch(selectDocument(doc.id));
    
    // Get subtitles from primary language track
    const primaryTrack = doc.captions.find(c => c.language === doc.primaryLanguage) || doc.captions[0];
    
    // Load document into dictation state
    dispatch(loadFromArchive({
      videoId: doc.videoId,
      videoUrl: doc.videoUrl,
      documentName: doc.name,
      primaryLanguage: doc.primaryLanguage,
      subtitles: primaryTrack.subtitles,
    }));
    
    // Navigate to dictation page
    navigate('/');
  };

  const handleEdit = (doc: DictationDocument) => {
    dispatch(setEditingDocument(doc.id));
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this document?")) {
      dispatch(removeDocument(id));
    }
  };

  const handleAddDocument = (doc: Omit<DictationDocument, "id" | "createdAt" | "updatedAt">) => {
    dispatch(addDocument(doc));
  };

  const handleCloseEditor = () => {
    dispatch(setEditingDocument(null));
  };

  return (
    <MainLayout
      maincontent={
        <ArchiveMain
          documents={documents}
          selectedDocumentId={selectedDocumentId}
          editingDocumentId={editingDocumentId}
          onSelect={handleSelect}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onAddDocument={handleAddDocument}
        />
      }
      rightSide={
        editingDocument ? (
          <CaptionEditor document={editingDocument} onClose={handleCloseEditor} />
        ) : null
      }
      leftSide={null}
    />
  );
}
export default ArchivePage;