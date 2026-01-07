import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import MainLayout from '~/components/Layout/main.layout';
import ArchiveMain from '~/components/Archive/ArchiveMain';
import CaptionEditor from '~/components/Archive/CaptionEditor';
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
  const { documents, editingDocumentId } = useSelector(
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
          editingDocumentId={editingDocumentId}
          onSelect={handleSelect}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onAddDocument={handleAddDocument}
        />
      }
      rightSide={
        editingDocument ? (
          <CaptionEditor 
            key={editingDocument.id} 
            document={editingDocument} 
            onClose={handleCloseEditor} 
          />
        ) : (
          <div className="flex items-center justify-center h-full text-gray-500 text-sm p-6 text-center">
            <div>
              <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-white/[0.03] flex items-center justify-center">
                <svg className="w-6 h-6 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </div>
              <p className="text-gray-400">Select a document to edit</p>
            </div>
          </div>
        )
      }
      leftSide={null}
    />
  );
}
export default ArchivePage;