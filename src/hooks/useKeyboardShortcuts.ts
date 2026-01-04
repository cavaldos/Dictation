import { useEffect, useCallback } from 'react';

interface KeyboardShortcutsOptions {
  onPlayPause?: () => void;
  onSeekBackward?: () => void;
  onSeekForward?: () => void;
  onReplay?: () => void;
  onSkip?: () => void;
  enabled?: boolean;
}

/**
 * Global keyboard shortcuts hook for dictation practice
 * 
 * Shortcuts:
 * - Space: Play/Pause (when not focused on input)
 * - Left Arrow: Seek backward 5s
 * - Right Arrow: Seek forward 5s
 * - R: Replay current segment
 * - N or Tab: Skip to next (when not in input)
 */
export function useKeyboardShortcuts({
  onPlayPause,
  onSeekBackward,
  onSeekForward,
  onReplay,
  onSkip,
  enabled = true,
}: KeyboardShortcutsOptions) {
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!enabled) return;

      // Get the active element
      const activeElement = document.activeElement;
      const isInputFocused =
        activeElement?.tagName === 'INPUT' ||
        activeElement?.tagName === 'TEXTAREA' ||
        (activeElement as HTMLElement)?.isContentEditable;

      // Shortcuts that work even when input is focused
      switch (event.key) {
        case 'ArrowLeft':
          if (!isInputFocused) {
            event.preventDefault();
            onSeekBackward?.();
          }
          break;
        case 'ArrowRight':
          if (!isInputFocused) {
            event.preventDefault();
            onSeekForward?.();
          }
          break;
        case 'r':
        case 'R':
          if (!isInputFocused) {
            event.preventDefault();
            onReplay?.();
          }
          break;
      }

      // Shortcuts that only work when input is NOT focused
      if (!isInputFocused) {
        switch (event.key) {
          case ' ':
            event.preventDefault();
            onPlayPause?.();
            break;
          case 'n':
          case 'N':
            event.preventDefault();
            onSkip?.();
            break;
        }
      }

      // Ctrl/Cmd + key shortcuts (work even in input)
      if (event.ctrlKey || event.metaKey) {
        switch (event.key) {
          case ' ':
            event.preventDefault();
            onPlayPause?.();
            break;
          case 'ArrowLeft':
            event.preventDefault();
            onSeekBackward?.();
            break;
          case 'ArrowRight':
            event.preventDefault();
            onSeekForward?.();
            break;
        }
      }
    },
    [enabled, onPlayPause, onSeekBackward, onSeekForward, onReplay, onSkip]
  );

  useEffect(() => {
    if (enabled) {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [enabled, handleKeyDown]);
}

export default useKeyboardShortcuts;
