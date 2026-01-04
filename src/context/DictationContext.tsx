import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import type { SubtitleItem } from '~/services/youtube.service';

interface DictationContextType {
  subtitles: SubtitleItem[];
  setSubtitles: (subtitles: SubtitleItem[]) => void;
  currentIndex: number;
  setCurrentIndex: (index: number) => void;
  completedIndices: Set<number>;
  markCompleted: (index: number) => void;
  isStarted: boolean;
  setIsStarted: (started: boolean) => void;
  goToSubtitle: (index: number) => void;
  findSubtitleByTime: (time: number) => number;
  // Callback for when subtitle is selected (to sync with video)
  onSubtitleSelect: React.MutableRefObject<((index: number, startTime: number) => void) | null>;
}

const DictationContext = createContext<DictationContextType | null>(null);

export const useDictation = () => {
  const context = useContext(DictationContext);
  if (!context) {
    throw new Error('useDictation must be used within DictationProvider');
  }
  return context;
};

interface DictationProviderProps {
  children: React.ReactNode;
}

export const DictationProvider: React.FC<DictationProviderProps> = ({ children }) => {
  const [subtitles, setSubtitles] = useState<SubtitleItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [completedIndices, setCompletedIndices] = useState<Set<number>>(new Set());
  const [isStarted, setIsStarted] = useState(false);
  
  // Ref for subtitle select callback (to sync with video player)
  const onSubtitleSelectRef = useRef<((index: number, startTime: number) => void) | null>(null);

  const markCompleted = useCallback((index: number) => {
    setCompletedIndices(prev => new Set([...prev, index]));
  }, []);

  const goToSubtitle = useCallback((index: number) => {
    if (index >= 0 && index < subtitles.length) {
      setCurrentIndex(index);
      // Notify listener (video player) about subtitle change
      const subtitle = subtitles[index];
      if (subtitle && onSubtitleSelectRef.current) {
        onSubtitleSelectRef.current(index, subtitle.start);
      }
    }
  }, [subtitles]);

  // Find subtitle index by video time
  const findSubtitleByTime = useCallback((time: number): number => {
    if (subtitles.length === 0) return 0;
    
    // Find the subtitle that contains this time
    for (let i = 0; i < subtitles.length; i++) {
      const sub = subtitles[i];
      const endTime = sub.start + sub.dur;
      
      if (time >= sub.start && time < endTime) {
        return i;
      }
    }
    
    // If time is before first subtitle
    if (time < subtitles[0].start) {
      return 0;
    }
    
    // If time is after last subtitle, return last index
    return subtitles.length - 1;
  }, [subtitles]);

  // Reset completed when subtitles change
  const handleSetSubtitles = useCallback((newSubtitles: SubtitleItem[]) => {
    setSubtitles(newSubtitles);
    setCompletedIndices(new Set());
    setCurrentIndex(0);
  }, []);

  return (
    <DictationContext.Provider
      value={{
        subtitles,
        setSubtitles: handleSetSubtitles,
        currentIndex,
        setCurrentIndex,
        completedIndices,
        markCompleted,
        isStarted,
        setIsStarted,
        goToSubtitle,
        findSubtitleByTime,
        onSubtitleSelect: onSubtitleSelectRef,
      }}
    >
      {children}
    </DictationContext.Provider>
  );
};
