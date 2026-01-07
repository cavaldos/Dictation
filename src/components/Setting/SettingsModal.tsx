import React, { useState, useEffect, useCallback } from 'react';
import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSelector, useDispatch } from 'react-redux';
import SettingsSidebar, { type SettingsTab } from './SettingsSidebar';
import SettingsContent from './SettingsContent';
import { selectSettingsModalOpen, closeSettingsModal } from '~/redux/features/settingsSlice';

const SettingsModal: React.FC = () => {
  const dispatch = useDispatch();
  const isOpen = useSelector(selectSettingsModalOpen);
  const [activeTab, setActiveTab] = useState<SettingsTab>('preferences');

  const handleClose = useCallback(() => {
    dispatch(closeSettingsModal());
  }, [dispatch]);

  // Handle ESC key to close modal
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      handleClose();
    }
  }, [handleClose]);

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, handleKeyDown]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 bg-black/60 z-50"
            onClick={handleClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className="fixed inset-0 z-50 flex items-center justify-center p-8 pointer-events-none"
          >
            <div 
              className="w-full max-w-3xl h-[85vh] max-h-[700px] bg-[rgb(37,37,37)] rounded-xl shadow-2xl overflow-hidden flex flex-col pointer-events-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header with close button */}
              <div className="flex items-center justify-end p-2 border-b border-[rgb(55,55,55)]">
                <button
                  onClick={handleClose}
                  className="p-1.5 rounded-md text-[rgb(140,140,140)] hover:text-[rgb(200,200,200)] hover:bg-[rgb(50,50,50)] transition-colors"
                  title="Close (Esc)"
                >
                  <X size={18} />
                </button>
              </div>
              {/* Content area */}
              <div className="flex flex-1 min-h-0">
                <SettingsSidebar activeTab={activeTab} onTabChange={setActiveTab} />
                <SettingsContent activeTab={activeTab} />
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default SettingsModal;
