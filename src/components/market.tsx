import React, { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Play, Clock, Loader2, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { loadFromArchive } from '~/redux/features/dictationSlice';
import { parseSRT, type SubtitleItem } from '~/lib/youtube.service';
import type { CaptionLanguage } from '~/redux/features/dictationArchiveSlice';

interface DemoCaption {
  language: CaptionLanguage;
  languageLabel: string;
  subtitles: string; // Path to SRT file
}

interface DemoItem {
  id: string;
  name: string;
  videoUrl: string;
  videoId: string;
  primaryLanguage: CaptionLanguage;
  captions: DemoCaption[];
  description?: string;
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
}

interface DemoData {
  demos: DemoItem[];
}

interface MarketModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const difficultyColors = {
  beginner: 'bg-green-500/20 text-green-400 border-green-500/30',
  intermediate: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  advanced: 'bg-red-500/20 text-red-400 border-red-500/30',
};

const difficultyLabels = {
  beginner: 'Beginner',
  intermediate: 'Intermediate',
  advanced: 'Advanced',
};

const MarketModal: React.FC<MarketModalProps> = ({ isOpen, onClose }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [demos, setDemos] = useState<DemoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loadingDemo, setLoadingDemo] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    
    const fetchDemos = async () => {
      try {
        setLoading(true);
        const response = await fetch('/demo-dictations.json');
        if (!response.ok) {
          throw new Error('Failed to load demo data');
        }
        const data: DemoData = await response.json();
        setDemos(data.demos);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load demos');
      } finally {
        setLoading(false);
      }
    };

    fetchDemos();
  }, [isOpen]);

  // Handle ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  const handleSelectDemo = async (demo: DemoItem) => {
    setLoadingDemo(demo.id);

    try {
      // Find primary caption track
      const primaryCaption = demo.captions.find(
        (c) => c.language === demo.primaryLanguage
      ) || demo.captions[0];

      // Fetch and parse SRT file
      const srtResponse = await fetch(primaryCaption.subtitles);
      if (!srtResponse.ok) {
        throw new Error('Failed to load subtitle file');
      }
      const srtText = await srtResponse.text();
      const subtitles: SubtitleItem[] = parseSRT(srtText);

      // Load into dictation state
      dispatch(
        loadFromArchive({
          videoId: demo.videoId,
          videoUrl: demo.videoUrl,
          documentName: demo.name,
          primaryLanguage: demo.primaryLanguage,
          subtitles,
        })
      );

      // Close modal and navigate to dictation page
      onClose();
      navigate('/');
    } catch (err) {
      console.error('Failed to load demo:', err);
      setError(err instanceof Error ? err.message : 'Failed to load demo');
    } finally {
      setLoadingDemo(null);
    }
  };

  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
        </div>
      );
    }

    if (error) {
      return (
        <div className="p-6 text-center">
          <div className="text-red-400 mb-2">Error loading demos</div>
          <div className="text-gray-500 text-sm">{error}</div>
        </div>
      );
    }

    if (demos.length === 0) {
      return (
        <div className="p-6 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-white/[0.03] flex items-center justify-center">
            <BookOpen className="w-8 h-8 opacity-50 text-gray-400" />
          </div>
          <p className="text-gray-300 font-medium">No demos available</p>
          <p className="text-sm mt-1 text-gray-500">
            Check back later for new dictation exercises.
          </p>
        </div>
      );
    }

    return (
      <div className="p-4 space-y-3">
        {demos.map((demo) => (
          <div
            key={demo.id}
            onClick={() => handleSelectDemo(demo)}
            className={`
              group p-4 rounded-xl border border-white/[0.06] bg-white/[0.02]
              hover:bg-white/[0.04] hover:border-white/[0.1]
              transition-all duration-200 cursor-pointer
              ${loadingDemo === demo.id ? 'opacity-70 pointer-events-none' : ''}
            `}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                {/* Title */}
                <h3 className="font-medium text-notion-text group-hover:text-white transition-colors">
                  {demo.name}
                </h3>

                {/* Description */}
                {demo.description && (
                  <p className="text-sm text-gray-400 mt-1 line-clamp-2">
                    {demo.description}
                  </p>
                )}

                {/* Meta info */}
                <div className="flex items-center gap-3 mt-3">
                  {/* Difficulty badge */}
                  {demo.difficulty && (
                    <span
                      className={`
                        text-xs px-2 py-0.5 rounded-full border
                        ${difficultyColors[demo.difficulty]}
                      `}
                    >
                      {difficultyLabels[demo.difficulty]}
                    </span>
                  )}

                  {/* Language */}
                  <span className="text-xs text-gray-500">
                    {demo.captions[0]?.languageLabel || demo.primaryLanguage.toUpperCase()}
                  </span>

                  {/* Captions count */}
                  <span className="text-xs text-gray-500 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {demo.captions.length} track{demo.captions.length > 1 ? 's' : ''}
                  </span>
                </div>
              </div>

              {/* Play button */}
              <div className="flex-shrink-0">
                {loadingDemo === demo.id ? (
                  <div className="w-10 h-10 rounded-full bg-white/[0.05] flex items-center justify-center">
                    <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
                  </div>
                ) : (
                  <div className="w-10 h-10 rounded-full bg-white/[0.05] group-hover:bg-blue-500/20 flex items-center justify-center transition-colors">
                    <Play className="w-5 h-5 text-gray-400 group-hover:text-blue-400 transition-colors" />
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

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
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
          >
            <div
              className="w-full max-w-2xl max-h-[80vh] bg-[rgb(32,32,32)] rounded-2xl shadow-2xl overflow-hidden flex flex-col pointer-events-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06]">
                <div>
                  <h2 className="text-lg font-semibold text-gray-100">
                    Dictation Market
                  </h2>
                  <p className="text-sm text-gray-400 mt-0.5">
                    Choose a pre-made dictation exercise
                  </p>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 rounded-lg text-gray-400 hover:text-gray-200 hover:bg-white/[0.06] transition-colors"
                  title="Close (Esc)"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto">
                {renderContent()}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default MarketModal;
