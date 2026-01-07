import React, { useRef, useImperativeHandle, forwardRef, useEffect, useCallback, useState } from 'react';
import YouTube, { type YouTubePlayer, type YouTubeEvent } from 'react-youtube';
import { Play, Pause, Volume2, VolumeX, RotateCcw, FastForward, Rewind, GripVertical } from 'lucide-react';
import { useSettings } from '~/hooks/useReduxHooks';
import { useSelector, useDispatch } from 'react-redux';
import type { RootState } from '~/redux/store';
import { setVideoWidth } from '~/redux/features/videoPlayerSlice';

interface VideoPlayerProps {
  videoId: string;
  onReady?: (player: YouTubePlayer) => void;
  onSeek?: (time: number) => void;
  // Loop segment props
  loopStart?: number;
  loopEnd?: number;
  isLooping?: boolean;
  // Resize props
  resizable?: boolean;
}

export interface VideoPlayerRef {
  seekTo: (seconds: number) => void;
  play: () => void;
  pause: () => void;
  getCurrentTime: () => number;
  getDuration: () => number;
}

const VideoPlayer = forwardRef<VideoPlayerRef, VideoPlayerProps>(
  ({ videoId, onReady, onSeek, loopStart, loopEnd, isLooping = false, resizable = true }, ref) => {
    const { settings } = useSettings();
    const dispatch = useDispatch();
    const { videoWidth, minWidth, maxWidth } = useSelector((state: RootState) => state.videoPlayer);

    const playerRef = useRef<YouTubePlayer | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const isResizing = useRef(false);
    const resizeSide = useRef<'left' | 'right' | null>(null);
    const startX = useRef(0);
    const startWidth = useRef(0);
    const [isMuted, setIsMuted] = useState(false);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isPausedForLoop, setIsPausedForLoop] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [sliderValue, setSliderValue] = useState(0);
    const [isDragging, setIsDragging] = useState(false);
    const [playbackSpeed, setPlaybackSpeed] = useState(settings.playbackSpeed);
    const [showSpeedMenu, setShowSpeedMenu] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showControls, setShowControls] = useState(false);
    const [showClickFeedback, setShowClickFeedback] = useState(false);
    const [clickFeedbackType, setClickFeedbackType] = useState<'play' | 'pause'>('play');
    const hideControlsTimeout = useRef<number | null>(null);
    const clickFeedbackTimeout = useRef<number | null>(null);

    const loopIntervalRef = useRef<number | null>(null);
    const delayTimeoutRef = useRef<number | null>(null);
    const timeUpdateRef = useRef<number | null>(null);

    useImperativeHandle(ref, () => ({
      seekTo: (seconds: number) => {
        playerRef.current?.seekTo(seconds, true);
        setCurrentTime(seconds);
        setSliderValue(seconds);
      },
      play: () => {
        playerRef.current?.playVideo();
      },
      pause: () => {
        playerRef.current?.pauseVideo();
      },
      getCurrentTime: () => {
        return playerRef.current?.getCurrentTime() || 0;
      },
      getDuration: () => {
        return playerRef.current?.getDuration() || 0;
      },
    }));

    // Update current time periodically
    useEffect(() => {
      timeUpdateRef.current = window.setInterval(() => {
        if (playerRef.current && !isDragging) {
          const time = playerRef.current.getCurrentTime() || 0;
          setCurrentTime(time);
          setSliderValue(time);
        }
      }, 200);

      return () => {
        if (timeUpdateRef.current) {
          clearInterval(timeUpdateRef.current);
        }
      };
    }, [isDragging]);

    // Loop logic with delay
    const checkAndLoop = useCallback(() => {
      if (!playerRef.current || !isLooping || loopStart === undefined || loopEnd === undefined || isPausedForLoop) {
        return;
      }

      const time = playerRef.current.getCurrentTime();
      if (time >= loopEnd) {
        playerRef.current.pauseVideo();
        setIsPausedForLoop(true);
        setIsPlaying(false);

        delayTimeoutRef.current = window.setTimeout(() => {
          if (playerRef.current && isLooping) {
            playerRef.current.seekTo(loopStart, true);
            playerRef.current.playVideo();
            setIsPausedForLoop(false);
            setIsPlaying(true);
          }
        }, settings.loopDelayMs);
      }
    }, [isLooping, loopStart, loopEnd, isPausedForLoop, settings.loopDelayMs]);

    // Set up loop interval
    useEffect(() => {
      if (isLooping && loopStart !== undefined && loopEnd !== undefined) {
        loopIntervalRef.current = window.setInterval(checkAndLoop, 100);

        if (playerRef.current) {
          playerRef.current.seekTo(loopStart, true);
          playerRef.current.playVideo();
          setIsPausedForLoop(false);
          setIsPlaying(true);
        }
      }

      return () => {
        if (loopIntervalRef.current) {
          clearInterval(loopIntervalRef.current);
          loopIntervalRef.current = null;
        }
        if (delayTimeoutRef.current) {
          clearTimeout(delayTimeoutRef.current);
          delayTimeoutRef.current = null;
        }
      };
    }, [isLooping, loopStart, loopEnd, checkAndLoop]);

    const handleReady = (event: YouTubeEvent) => {
      console.log('YouTube Player Ready', { videoId });
      playerRef.current = event.target;
      const dur = event.target.getDuration();
      console.log('Video duration:', dur);
      setDuration(dur);
      setError(null);
      // Set initial playback speed
      event.target.setPlaybackRate(playbackSpeed);
      onReady?.(event.target);
    };

    const handleStateChange = (event: YouTubeEvent) => {
      console.log('YouTube State Change:', event.data);
      // 1 = playing, 2 = paused
      setIsPlaying(event.data === 1);
    };

    const handleError = (event: YouTubeEvent) => {
      console.error('YouTube Player Error:', event.data);
      const errorMessages: Record<number, string> = {
        2: 'Invalid video ID',
        5: 'HTML5 player error',
        100: 'Video not found or private',
        101: 'Video cannot be embedded',
        150: 'Video cannot be embedded',
      };
      setError(errorMessages[event.data] || `Error code: ${event.data}`);
    };

    const togglePlay = () => {
      if (playerRef.current) {
        if (isPlaying) {
          playerRef.current.pauseVideo();
          setClickFeedbackType('pause');
        } else {
          playerRef.current.playVideo();
          setClickFeedbackType('play');
        }
        // Show click feedback animation
        setShowClickFeedback(true);
        if (clickFeedbackTimeout.current) {
          clearTimeout(clickFeedbackTimeout.current);
        }
        clickFeedbackTimeout.current = window.setTimeout(() => {
          setShowClickFeedback(false);
        }, 500);
      }
    };

    const toggleMute = () => {
      if (playerRef.current) {
        if (isMuted) {
          playerRef.current.unMute();
        } else {
          playerRef.current.mute();
        }
        setIsMuted(!isMuted);
      }
    };

    const changePlaybackSpeed = (speed: number) => {
      setPlaybackSpeed(speed);
      playerRef.current?.setPlaybackRate(speed);
      setShowSpeedMenu(false);
    };

    const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = parseFloat(e.target.value);
      setSliderValue(value);
    };

    const handleSliderMouseDown = () => {
      setIsDragging(true);
    };

    const handleSliderMouseUp = (e: React.MouseEvent<HTMLInputElement>) => {
      const value = parseFloat((e.target as HTMLInputElement).value);
      playerRef.current?.seekTo(value, true);
      setCurrentTime(value);
      setIsDragging(false);
      // Notify parent about seek
      onSeek?.(value);
    };

    const seekBackward = () => {
      if (playerRef.current) {
        const newTime = Math.max(0, currentTime - 5);
        playerRef.current.seekTo(newTime, true);
        setCurrentTime(newTime);
        setSliderValue(newTime);
      }
    };

    const seekForward = () => {
      if (playerRef.current) {
        const newTime = Math.min(duration, currentTime + 5);
        playerRef.current.seekTo(newTime, true);
        setCurrentTime(newTime);
        setSliderValue(newTime);
      }
    };

    const replaySegment = () => {
      if (playerRef.current && loopStart !== undefined) {
        playerRef.current.seekTo(loopStart, true);
        playerRef.current.playVideo();
        setIsPlaying(true);
      }
    };

    const formatTime = (seconds: number): string => {
      const mins = Math.floor(seconds / 60);
      const secs = Math.floor(seconds % 60);
      return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const opts = {
      height: '100%',
      width: '100%',
      playerVars: {
        autoplay: 0,
        controls: 0,
        disablekb: 1,
        fs: 0,
        modestbranding: 1,
        rel: 0,
        enablejsapi: 1,
        origin: window.location.origin,
      },
    };

    // Calculate segment indicator position
    const segmentStartPercent = loopStart !== undefined && duration > 0 ? (loopStart / duration) * 100 : 0;
    const segmentEndPercent = loopEnd !== undefined && duration > 0 ? (loopEnd / duration) * 100 : 0;

    // Handle mouse enter/leave for controls visibility
    const handleMouseEnter = () => {
      if (hideControlsTimeout.current) {
        clearTimeout(hideControlsTimeout.current);
      }
      setShowControls(true);
    };

    const handleMouseLeave = () => {
      if (!showSpeedMenu) {
        hideControlsTimeout.current = window.setTimeout(() => {
          setShowControls(false);
        }, 300);
      }
    };

    // Cleanup timeout on unmount
    useEffect(() => {
      return () => {
        if (hideControlsTimeout.current) {
          clearTimeout(hideControlsTimeout.current);
        }
        if (clickFeedbackTimeout.current) {
          clearTimeout(clickFeedbackTimeout.current);
        }
      };
    }, []);

    // Resize handlers
    const handleResizeStart = useCallback((e: React.MouseEvent, side: 'left' | 'right') => {
      if (!resizable) return;
      e.preventDefault();
      isResizing.current = true;
      resizeSide.current = side;
      startX.current = e.clientX;
      startWidth.current = videoWidth;
      document.body.style.cursor = 'ew-resize';
      document.body.style.userSelect = 'none';
    }, [resizable, videoWidth]);

    const handleResizeMove = useCallback((e: MouseEvent) => {
      if (!isResizing.current || !resizeSide.current) return;
      
      const deltaX = e.clientX - startX.current;
      let newWidth: number;
      
      if (resizeSide.current === 'right') {
        // Kéo từ bên phải: deltaX dương = tăng width
        newWidth = startWidth.current + deltaX * 2;
      } else {
        // Kéo từ bên trái: deltaX âm = tăng width
        newWidth = startWidth.current - deltaX * 2;
      }
      
      newWidth = Math.max(minWidth, Math.min(maxWidth, newWidth));
      dispatch(setVideoWidth(newWidth));
    }, [dispatch, minWidth, maxWidth]);

    const handleResizeEnd = useCallback(() => {
      isResizing.current = false;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    }, []);

    // Add resize event listeners
    useEffect(() => {
      document.addEventListener('mousemove', handleResizeMove);
      document.addEventListener('mouseup', handleResizeEnd);
      return () => {
        document.removeEventListener('mousemove', handleResizeMove);
        document.removeEventListener('mouseup', handleResizeEnd);
      };
    }, [handleResizeMove, handleResizeEnd]);

    return (
      <div
        ref={containerRef}
        className="relative mx-auto"
        style={{ width: resizable ? `${videoWidth}px` : '100%', maxWidth: '100%' }}
      >
        {/* Left Resize Handle */}
        {resizable && (
          <div
            onMouseDown={(e) => handleResizeStart(e, 'left')}
            className="absolute left-0 top-0 bottom-0 w-2 cursor-ew-resize z-20 group flex items-center justify-center hover:bg-primary/20 transition-colors"
            style={{ transform: 'translateX(-50%)' }}
          >
            <div className="w-1 h-8 bg-white/30 rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        )}

        {/* Right Resize Handle */}
        {resizable && (
          <div
            onMouseDown={(e) => handleResizeStart(e, 'right')}
            className="absolute right-0 top-0 bottom-0 w-2 cursor-ew-resize z-20 group flex items-center justify-center hover:bg-primary/20 transition-colors"
            style={{ transform: 'translateX(50%)' }}
          >
            <div className="w-1 h-8 bg-white/30 rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        )}

        <div className="w-full bg-black rounded-lg overflow-hidden shadow-lg">
          {/* Error display */}
          {error && (
            <div className="p-4 bg-red-500/20 text-red-400 text-sm">
              Video Error: {error}
            </div>
          )}

          {/* Video Container with Overlay Controls */}
          <div
            className="relative aspect-video bg-black group"
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
          >
            <YouTube
              videoId={videoId}
              opts={opts}
              onReady={handleReady}
              onStateChange={handleStateChange}
              onError={handleError}
              className="absolute inset-0"
              iframeClassName="w-full h-full"
            />

            {/* Loop indicator overlay - Always visible when looping */}
            {isLooping && (
              <div className="absolute top-3 right-3 px-2 py-1 bg-primary/80 rounded text-xs text-white flex items-center gap-1 z-10">
                <RotateCcw className="w-3 h-3" />
                Looping
              </div>
            )}

            {/* Overlay Controls - Show on hover */}
            <div
              className={`absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent transition-opacity duration-300 ${showControls ? 'opacity-100' : 'opacity-0'
                }`}
              style={{ pointerEvents: showControls ? 'auto' : 'none' }}
            >
              {/* Click area for play/pause (above controls) */}
              <div
                onClick={togglePlay}
                className="absolute inset-0 bottom-16 cursor-pointer"
              />
              {/* Bottom Controls Container */}
              <div className="absolute bottom-0 left-0 right-0 p-3 space-y-2">
                {/* Progress bar */}
                <div className="relative">
                  {/* Segment highlight */}
                  {isLooping && loopStart !== undefined && loopEnd !== undefined && (
                    <div
                      className="absolute h-1 bg-primary/40 rounded-full top-1/2 -translate-y-1/2 pointer-events-none"
                      style={{
                        left: `${segmentStartPercent}%`,
                        width: `${segmentEndPercent - segmentStartPercent}%`
                      }}
                    />
                  )}
                  <input
                    type="range"
                    min={0}
                    max={duration || 100}
                    step={0.1}
                    value={sliderValue}
                    onChange={handleSliderChange}
                    onMouseDown={handleSliderMouseDown}
                    onMouseUp={handleSliderMouseUp}
                    className="w-full h-1 bg-white/30 rounded-full appearance-none cursor-pointer
                      [&::-webkit-slider-thumb]:appearance-none
                      [&::-webkit-slider-thumb]:w-3
                      [&::-webkit-slider-thumb]:h-3
                      [&::-webkit-slider-thumb]:rounded-full
                      [&::-webkit-slider-thumb]:bg-primary
                      [&::-webkit-slider-thumb]:cursor-pointer
                      [&::-webkit-slider-thumb]:transition-transform
                      [&::-webkit-slider-thumb]:hover:scale-125"
                  />
                </div>

                {/* Controls Row */}
                <div className="flex items-center justify-between gap-2">
                  {/* Left: Time & Segment info */}
                  <div className="flex items-center gap-2 text-xs text-white/80 min-w-0">
                    <span className="tabular-nums">{formatTime(currentTime)}</span>
                    <span className="text-white/50">/</span>
                    <span className="tabular-nums text-white/50">{formatTime(duration)}</span>
                    {isLooping && loopStart !== undefined && loopEnd !== undefined && (
                      <span className="text-primary text-xs hidden sm:inline">
                        • Segment: {formatTime(loopStart)} - {formatTime(loopEnd)}
                      </span>
                    )}
                  </div>

                  {/* Center: Main Controls */}
                  <div className="flex items-center gap-1">
                    {/* Mute */}
                    <button
                      onClick={toggleMute}
                      className="p-1.5 rounded-md hover:bg-white/20 transition-colors"
                      title={isMuted ? 'Unmute' : 'Mute'}
                    >
                      {isMuted ? (
                        <VolumeX className="w-4 h-4 text-white/70" />
                      ) : (
                        <Volume2 className="w-4 h-4 text-white" />
                      )}
                    </button>

                    {/* Seek backward 5s */}
                    <button
                      onClick={seekBackward}
                      className="p-1.5 rounded-md hover:bg-white/20 transition-colors"
                      title="Rewind 5s"
                    >
                      <Rewind className="w-4 h-4 text-white" />
                    </button>

                    {/* Play/Pause */}
                    <button
                      onClick={togglePlay}
                      className="p-2 bg-primary rounded-full hover:bg-primary/90 transition-colors mx-1"
                      title={isPlaying ? 'Pause' : 'Play'}
                    >
                      {isPlaying ? (
                        <Pause className="w-4 h-4 text-white" />
                      ) : (
                        <Play className="w-4 h-4 text-white ml-0.5" />
                      )}
                    </button>

                    {/* Seek forward 5s */}
                    <button
                      onClick={seekForward}
                      className="p-1.5 rounded-md hover:bg-white/20 transition-colors"
                      title="Forward 5s"
                    >
                      <FastForward className="w-4 h-4 text-white" />
                    </button>

                    {/* Replay segment */}
                    {isLooping && (
                      <button
                        onClick={replaySegment}
                        className="p-1.5 rounded-md hover:bg-white/20 transition-colors"
                        title="Replay segment"
                      >
                        <RotateCcw className="w-4 h-4 text-primary" />
                      </button>
                    )}
                  </div>

                  {/* Right: Speed Control */}
                  <div className="relative flex items-center justify-end min-w-[50px]">
                    <button
                      onClick={() => setShowSpeedMenu(!showSpeedMenu)}
                      className="px-2 py-1 rounded-md hover:bg-white/20 transition-colors text-xs text-white font-medium"
                      title="Playback speed"
                    >
                      {playbackSpeed}x
                    </button>

                    {showSpeedMenu && (
                      <div className="absolute bottom-full right-0 mb-2 bg-black/90 backdrop-blur-sm rounded-lg border border-white/10 shadow-lg overflow-hidden">
                        {[0.5, 0.75, 1, 1.25, 1.5, 2].map((speed) => (
                          <button
                            key={speed}
                            onClick={() => changePlaybackSpeed(speed)}
                            className={`w-full px-4 py-1.5 text-xs text-left hover:bg-white/10 transition-colors ${playbackSpeed === speed ? 'text-primary bg-primary/10' : 'text-white'
                              }`}
                          >
                            {speed}x
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Click to play/pause overlay - Clickable area */}
            <div
              onClick={togglePlay}
              className="absolute inset-0 cursor-pointer z-5"
              style={{ pointerEvents: showControls ? 'none' : 'auto' }}
            />

            {/* Click feedback animation (like YouTube) */}
            <div
              className={`absolute inset-0 flex items-center justify-center pointer-events-none transition-opacity duration-300 ${showClickFeedback ? 'opacity-100' : 'opacity-0'
                }`}
            >
              <div className={`p-4 bg-black/60 rounded-full transform transition-transform duration-300 ${showClickFeedback ? 'scale-100' : 'scale-50'
                }`}>
                {clickFeedbackType === 'play' ? (
                  <Play className="w-10 h-10 text-white ml-1" />
                ) : (
                  <Pause className="w-10 h-10 text-white" />
                )}
              </div>
            </div>

            {/* Big play button when paused and not hovering */}
            <div
              className={`absolute inset-0 flex items-center justify-center pointer-events-none transition-opacity duration-300 ${!isPlaying && !showControls && !showClickFeedback ? 'opacity-100' : 'opacity-0'
                }`}
            >
              <div className="p-5 bg-black/50 rounded-full">
                <Play className="w-12 h-12 text-white ml-1" />
              </div>
            </div>
          </div>

          {/* Resize indicator - shows current width when resizing */}
          {resizable && (
            <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-xs text-notion-text-muted opacity-0 hover:opacity-100 transition-opacity">
              <GripVertical className="w-4 h-4 inline-block rotate-90" /> {videoWidth}px
            </div>
          )}
        </div>
      </div>
    );
  }
);

VideoPlayer.displayName = 'VideoPlayer';

export default VideoPlayer;
