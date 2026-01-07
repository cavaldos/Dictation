import React, { useState, useRef, useCallback, useEffect } from "react";
import { Link2, AlertCircle, Play, Keyboard } from "lucide-react";
import type { YouTubePlayer } from "react-youtube";

import VideoPlayer, { type VideoPlayerRef } from "~/components/Dictation/VideoPlayer";
import DictationInput from "~/components/Dictation/DictationInput";
import DropZone from "~/components/UI/DropZone";
import { extractVideoId, parseSRTRaw, mergeSubtitlesWithTranslation } from "~/utils/youtube.service";
import { useDictation, useSettings } from "~/hooks/useReduxHooks";
import { useKeyboardShortcuts } from "~/hooks/useKeyboardShortcuts";

const HomePage: React.FC = () => {
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [videoId, setVideoId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLooping, setIsLooping] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);

  // File states
  const [primarySrtContent, setPrimarySrtContent] = useState<string | null>(null);
  const [primaryFileName, setPrimaryFileName] = useState<string | null>(null);
  const [secondarySrtContent, setSecondarySrtContent] = useState<string | null>(null);
  const [secondaryFileName, setSecondaryFileName] = useState<string | null>(null);

  const { settings } = useSettings();

  const {
    subtitles,
    setSubtitles,
    currentIndex,
    setCurrentIndex,
    isStarted,
    setIsStarted,
    markCompleted,
    findSubtitleByTime,
    onSubtitleSelect
  } = useDictation();

  const videoRef = useRef<VideoPlayerRef>(null);
  const playerRef = useRef<YouTubePlayer | null>(null);

  // Keyboard shortcut handlers
  const handlePlayPause = useCallback(() => {
    if (videoRef.current) {
      const player = playerRef.current;
      if (player) {
        player.getPlayerState().then((state: number) => {
          if (state === 1) { // playing
            player.pauseVideo();
          } else {
            player.playVideo();
          }
        });
      }
    }
  }, []);

  const handleSeekBackward = useCallback(() => {
    if (playerRef.current) {
      const currentTime = playerRef.current.getCurrentTime() || 0;
      playerRef.current.seekTo(Math.max(0, currentTime - 5), true);
    }
  }, []);

  const handleSeekForward = useCallback(() => {
    if (playerRef.current) {
      const currentTime = playerRef.current.getCurrentTime() || 0;
      const duration = playerRef.current.getDuration() || 0;
      playerRef.current.seekTo(Math.min(duration, currentTime + 5), true);
    }
  }, []);

  const handleReplay = useCallback(() => {
    if (playerRef.current && subtitles[currentIndex]) {
      playerRef.current.seekTo(subtitles[currentIndex].start, true);
      playerRef.current.playVideo();
    }
  }, [subtitles, currentIndex]);

  // Enable keyboard shortcuts when practicing
  useKeyboardShortcuts({
    onPlayPause: handlePlayPause,
    onSeekBackward: handleSeekBackward,
    onSeekForward: handleSeekForward,
    onReplay: handleReplay,
    enabled: isStarted,
  });

  // Get current subtitle's loop boundaries
  const currentSubtitle = subtitles[currentIndex];
  const loopStart = currentSubtitle?.start;
  const loopEnd = currentSubtitle ? currentSubtitle.start + currentSubtitle.dur : undefined;

  // Start looping when currentIndex changes and isStarted is true
  useEffect(() => {
    if (isStarted && subtitles.length > 0) {
      setIsLooping(true);
    }
  }, [currentIndex, isStarted, subtitles.length]);

  // Register callback for when subtitle is selected from sidebar
  useEffect(() => {
    onSubtitleSelect.current = (_index: number, startTime: number) => {
      // Seek video to the start of selected subtitle
      if (playerRef.current) {
        playerRef.current.seekTo(startTime, true);
        if (isStarted) {
          playerRef.current.playVideo();
          setIsLooping(true);
        }
      }
    };

    return () => {
      onSubtitleSelect.current = null;
    };
  }, [onSubtitleSelect, isStarted]);

  // Handle primary SRT file load
  const handlePrimaryFileLoad = (content: string) => {
    setPrimarySrtContent(content);
    // Extract filename from the content or use a default
    setPrimaryFileName("primary.srt");
  };

  // Handle secondary SRT file load
  const handleSecondaryFileLoad = (content: string) => {
    setSecondarySrtContent(content);
    setSecondaryFileName("secondary.srt");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validate YouTube URL
    const id = extractVideoId(youtubeUrl);
    if (!id) {
      setError("Invalid YouTube URL. Please enter a valid link.");
      return;
    }

    // Validate primary SRT
    if (!primarySrtContent) {
      setError("Please upload primary subtitle (SRT) file.");
      return;
    }

    // Parse primary SRT
    const primarySubs = parseSRTRaw(primarySrtContent);
    if (primarySubs.length === 0) {
      setError("Could not parse primary subtitles. Please check the SRT format.");
      return;
    }

    // If secondary exists, merge them
    let finalSubs;
    if (secondarySrtContent) {
      const secondarySubs = parseSRTRaw(secondarySrtContent);
      finalSubs = mergeSubtitlesWithTranslation(primarySubs, secondarySubs, settings.minWordsPerSubtitle);
    } else {
      // Just merge short subtitles for primary only
      finalSubs = mergeSubtitlesWithTranslation(primarySubs, [], settings.minWordsPerSubtitle);
    }

    if (finalSubs.length === 0) {
      setError("Could not process subtitles.");
      return;
    }

    setVideoId(id);
    setSubtitles(finalSubs);
    setIsStarted(false);
    setIsLooping(false);
  };

  const handleVideoReady = useCallback((player: YouTubePlayer) => {
    playerRef.current = player;
  }, []);

  // Handle video seek - update current subtitle based on time
  const handleVideoSeek = useCallback((time: number) => {
    const subtitleIndex = findSubtitleByTime(time);
    if (subtitleIndex !== currentIndex) {
      setIsLooping(false);
      setCurrentIndex(subtitleIndex);
      // Re-enable looping after a short delay
      setTimeout(() => {
        if (isStarted) {
          setIsLooping(true);
        }
      }, 100);
    }
  }, [findSubtitleByTime, currentIndex, setCurrentIndex, isStarted]);

  const handleStart = () => {
    setIsStarted(true);
    setIsLooping(true);
  };

  const handleCorrect = () => {
    setIsLooping(false);
    markCompleted(currentIndex);

    if (currentIndex < subtitles.length - 1) {
      const nextIndex = currentIndex + 1;
      setCurrentIndex(nextIndex);

      setTimeout(() => {
        setIsLooping(true);
      }, 300);
    } else {
      setIsStarted(false);
      alert("Congratulations! You have completed all subtitles!");
    }
  };

  const handleSkip = () => {
    setIsLooping(false);

    if (currentIndex < subtitles.length - 1) {
      const nextIndex = currentIndex + 1;
      setCurrentIndex(nextIndex);

      setTimeout(() => {
        setIsLooping(true);
      }, 300);
    }
  };

  const resetAll = () => {
    setVideoId(null);
    setSubtitles([]);
    setYoutubeUrl("");
    setPrimarySrtContent(null);
    setPrimaryFileName(null);
    setSecondarySrtContent(null);
    setSecondaryFileName(null);
    setError(null);
    setIsLooping(false);
    setIsStarted(false);
  };

  // Initial input screen - URL + SRT files
  if (!videoId) {
    return (
      <div className="flex items-center justify-center h-full p-6">
        <div className="w-full max-w-2xl">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-notion-text mb-2">
              Dictation Practice
            </h1>
            <p className="text-notion-text-muted">
              Enter a YouTube URL and drag & drop subtitle files to start practicing
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* YouTube URL */}
            <div className="space-y-2">
              <label className="text-sm text-notion-text-muted flex items-center gap-2">
                <Link2 className="w-4 h-4" />
                YouTube URL
              </label>
              <input
                type="text"
                value={youtubeUrl}
                onChange={(e) => setYoutubeUrl(e.target.value)}
                placeholder="https://youtube.com/watch?v=..."
                className="w-full px-4 py-3 bg-notion-secondary border border-notion-border rounded-lg text-notion-text placeholder:text-notion-text-muted focus:outline-none focus:border-primary transition-colors"
              />
            </div>

            {/* Subtitle Drop Zones */}
            <div className="grid grid-cols-2 gap-4">
              {/* Primary Language */}
              <DropZone
                label="Primary Language (Required)"
                onFileLoad={(content) => {
                  handlePrimaryFileLoad(content);
                }}
                fileName={primaryFileName || undefined}
                onClear={() => {
                  setPrimarySrtContent(null);
                  setPrimaryFileName(null);
                }}
              />

              {/* Secondary Language */}
              <DropZone
                label="Secondary Language (Optional)"
                onFileLoad={(content) => {
                  handleSecondaryFileLoad(content);
                }}
                fileName={secondaryFileName || undefined}
                onClear={() => {
                  setSecondarySrtContent(null);
                  setSecondaryFileName(null);
                }}
              />
            </div>

            {/* Info text */}
            <p className="text-xs text-notion-text-muted text-center">
              Primary: The language you want to practice (e.g., English)<br />
              Secondary: Translation for reference (e.g., Vietnamese) - optional
            </p>

            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={!youtubeUrl.trim() || !primarySrtContent}
              className="w-full py-3 bg-primary rounded-lg text-white font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              Load Video & Subtitles
            </button>
          </form>

          <p className="text-center text-xs text-notion-text-muted mt-6">
            You can get SRT subtitles from sites like downsub.com
          </p>
        </div>
      </div>
    );
  }

  // Ready to start screen
  if (!isStarted) {
    return (
      <div className="flex items-center justify-center h-full p-6">
        <div className="w-full max-w-2xl space-y-6">
          {/* Video Player */}
          <VideoPlayer
            videoId={videoId}
            onReady={handleVideoReady}
            ref={videoRef}
          />

          <div className="text-center">
            <h2 className="text-2xl font-bold text-notion-text mb-4">
              Ready to Practice!
            </h2>
            <p className="text-notion-text-muted mb-2">
              Found {subtitles.length} subtitles.
            </p>
            {secondarySrtContent && (
              <p className="text-sm text-green-500 mb-4">
                Bilingual mode enabled
              </p>
            )}
            <p className="text-notion-text-muted mb-6">
              Click start to begin dictation.
            </p>

            <div className="flex gap-4 justify-center">
              <button
                onClick={handleStart}
                className="px-8 py-3 bg-primary rounded-lg text-white font-medium hover:bg-primary/90 transition-colors flex items-center gap-2"
              >
                <Play className="w-5 h-5" />
                Start Dictation
              </button>

              <button
                onClick={resetAll}
                className="px-6 py-3 bg-notion-secondary rounded-lg text-notion-text hover:bg-notion-hover transition-colors"
              >
                Change Video
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Dictation practice screen
  return (
    <div className="h-full overflow-auto p-6">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Video Player with controls */}
        <VideoPlayer
          videoId={videoId}
          onReady={handleVideoReady}
          onSeek={handleVideoSeek}
          ref={videoRef}
          loopStart={loopStart}
          loopEnd={loopEnd}
          isLooping={isLooping}
        />

        {/* Dictation Input */}
        <DictationInput
          subtitles={subtitles}
          currentIndex={currentIndex}
          onCorrect={handleCorrect}
          onSkip={handleSkip}
        />

        {/* Keyboard shortcuts toggle */}
        <div className="relative">
          <button
            onClick={() => setShowShortcuts(!showShortcuts)}
            className="flex items-center gap-2 text-xs text-notion-text-muted hover:text-notion-text transition-colors mx-auto"
          >
            <Keyboard className="w-4 h-4" />
            {showShortcuts ? 'Hide' : 'Show'} keyboard shortcuts
          </button>

          {showShortcuts && (
            <div className="mt-3 p-4 bg-notion-secondary rounded-lg border border-notion-border">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="flex items-center gap-2">
                  <kbd className="px-2 py-1 bg-notion-main rounded text-xs font-mono">Space</kbd>
                  <span className="text-notion-text-muted">Play / Pause</span>
                </div>
                <div className="flex items-center gap-2">
                  <kbd className="px-2 py-1 bg-notion-main rounded text-xs font-mono">R</kbd>
                  <span className="text-notion-text-muted">Replay segment</span>
                </div>
                <div className="flex items-center gap-2">
                  <kbd className="px-2 py-1 bg-notion-main rounded text-xs font-mono">&larr;</kbd>
                  <span className="text-notion-text-muted">Seek back 5s</span>
                </div>
                <div className="flex items-center gap-2">
                  <kbd className="px-2 py-1 bg-notion-main rounded text-xs font-mono">&rarr;</kbd>
                  <span className="text-notion-text-muted">Seek forward 5s</span>
                </div>
                <div className="flex items-center gap-2">
                  <kbd className="px-2 py-1 bg-notion-main rounded text-xs font-mono">Enter</kbd>
                  <span className="text-notion-text-muted">Check / Next</span>
                </div>
                <div className="flex items-center gap-2">
                  <kbd className="px-2 py-1 bg-notion-main rounded text-xs font-mono">Ctrl+Space</kbd>
                  <span className="text-notion-text-muted">Play (in input)</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default HomePage;
