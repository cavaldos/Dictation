import { useSelector, useDispatch } from 'react-redux';
import { useCallback, useRef } from 'react';
import type { AppDispatch } from '~/redux/store';
import {
  updateSettings,
  resetSettings,
  selectSettings,
  type AppSettings,
} from '~/redux/features/settingsSlice';
import {
  setSubtitles,
  setCurrentIndex,
  markCompleted,
  setIsStarted,
  goToSubtitle,
  resetDictation,
  selectSubtitles,
  selectCurrentIndex,
  selectCompletedIndices,
  selectIsStarted,
  selectVideoId,
  selectVideoUrl,
  selectDocumentName,
  findSubtitleByTime,
} from '~/redux/features/dictationSlice';
import type { SubtitleItem } from '~/utils/youtube.service';

// Settings Hook
export const useSettings = () => {
  const dispatch = useDispatch<AppDispatch>();
  const settings = useSelector(selectSettings);

  const handleUpdateSettings = useCallback(
    (newSettings: Partial<AppSettings>) => {
      dispatch(updateSettings(newSettings));
    },
    [dispatch]
  );

  const handleResetSettings = useCallback(() => {
    dispatch(resetSettings());
  }, [dispatch]);

  return {
    settings,
    updateSettings: handleUpdateSettings,
    resetSettings: handleResetSettings,
  };
};

// Dictation Hook
export const useDictation = () => {
  const dispatch = useDispatch<AppDispatch>();
  const subtitles = useSelector(selectSubtitles);
  const currentIndex = useSelector(selectCurrentIndex);
  const completedIndices = useSelector(selectCompletedIndices);
  const isStarted = useSelector(selectIsStarted);
  const videoId = useSelector(selectVideoId);
  const videoUrl = useSelector(selectVideoUrl);
  const documentName = useSelector(selectDocumentName);

  // Ref for subtitle select callback (to sync with video player)
  const onSubtitleSelectRef = useRef<((index: number, startTime: number) => void) | null>(null);

  const handleSetSubtitles = useCallback(
    (newSubtitles: SubtitleItem[]) => {
      dispatch(setSubtitles(newSubtitles));
    },
    [dispatch]
  );

  const handleSetCurrentIndex = useCallback(
    (index: number) => {
      dispatch(setCurrentIndex(index));
    },
    [dispatch]
  );

  const handleMarkCompleted = useCallback(
    (index: number) => {
      dispatch(markCompleted(index));
    },
    [dispatch]
  );

  const handleSetIsStarted = useCallback(
    (started: boolean) => {
      dispatch(setIsStarted(started));
    },
    [dispatch]
  );

  const handleGoToSubtitle = useCallback(
    (index: number) => {
      if (index >= 0 && index < subtitles.length) {
        dispatch(goToSubtitle(index));
        // Notify listener (video player) about subtitle change
        const subtitle = subtitles[index];
        if (subtitle && onSubtitleSelectRef.current) {
          onSubtitleSelectRef.current(index, subtitle.start);
        }
      }
    },
    [dispatch, subtitles]
  );

  const handleFindSubtitleByTime = useCallback(
    (time: number): number => {
      return findSubtitleByTime(subtitles, time);
    },
    [subtitles]
  );

  const handleResetDictation = useCallback(() => {
    dispatch(resetDictation());
  }, [dispatch]);

  return {
    subtitles,
    setSubtitles: handleSetSubtitles,
    currentIndex,
    setCurrentIndex: handleSetCurrentIndex,
    completedIndices,
    markCompleted: handleMarkCompleted,
    isStarted,
    setIsStarted: handleSetIsStarted,
    goToSubtitle: handleGoToSubtitle,
    findSubtitleByTime: handleFindSubtitleByTime,
    onSubtitleSelect: onSubtitleSelectRef,
    // New fields from archive
    videoId,
    videoUrl,
    documentName,
    resetDictation: handleResetDictation,
  };
};
