import React, { useRef, useImperativeHandle, forwardRef, useEffect, useCallback, useState } from 'react';
import YouTube, { type YouTubePlayer, type YouTubeEvent } from 'react-youtube';
import { Play, Pause, Volume2, VolumeX, RotateCcw, FastForward, Rewind, Gauge } from 'lucide-react';
import { useSettings } from '~/context/SettingsContext';

interface VideoPlayerProps {
  videoId: string;
  onReady?: (player: YouTubePlayer) => void;
  onSeek?: (time: number) => void;
  // Loop segment props
  loopStart?: number;
  loopEnd?: number;
  isLooping?: boolean;
}

export interface VideoPlayerRef {
  seekTo: (seconds: number) => void;
  play: () => void;
  pause: () => void;
  getCurrentTime: () => number;
  getDuration: () => number;
}

const VideoPlayer = forwardRef<VideoPlayerRef, VideoPlayerProps>(
  ({ videoId, onReady, onSeek, loopStart, loopEnd, isLooping = false }, ref) => {
    const { settings } = useSettings();
    const playerRef = useRef<YouTubePlayer | null>(null);
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
        } else {
          playerRef.current.playVideo();
        }
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

    return (
      <div className="w-full bg-black rounded-xl overflow-hidden shadow-lg">
        {/* Error display */}
        {error && (
          <div className="p-4 bg-red-500/20 text-red-400 text-sm">
            Video Error: {error}
          </div>
        )}
        
        {/* Video Container */}
        <div className="relative aspect-video bg-black">
          <YouTube
            videoId={videoId}
            opts={opts}
            onReady={handleReady}
            onStateChange={handleStateChange}
            onError={handleError}
            className="absolute inset-0"
            iframeClassName="w-full h-full"
          />
          
          {/* Loop indicator overlay */}
          {isLooping && (
            <div className="absolute top-3 right-3 px-2 py-1 bg-primary/80 rounded text-xs text-white flex items-center gap-1">
              <RotateCcw className="w-3 h-3" />
              Looping
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="bg-notion-secondary p-3 space-y-2">
          {/* Progress bar */}
          <div className="relative">
            {/* Segment highlight */}
            {isLooping && loopStart !== undefined && loopEnd !== undefined && (
              <div 
                className="absolute h-1.5 bg-primary/30 rounded-full top-1/2 -translate-y-1/2 pointer-events-none"
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
              className="w-full h-1.5 bg-notion-hover rounded-full appearance-none cursor-pointer
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

          {/* Time display */}
          <div className="flex items-center justify-between text-xs text-notion-text-muted">
            <span>{formatTime(currentTime)}</span>
            {isLooping && loopStart !== undefined && loopEnd !== undefined && (
              <span className="text-primary">
                Segment: {formatTime(loopStart)} - {formatTime(loopEnd)}
              </span>
            )}
            <span>{formatTime(duration)}</span>
          </div>

          {/* Control buttons */}
          <div className="flex items-center justify-center gap-2">
            {/* Mute */}
            <button
              onClick={toggleMute}
              className="p-2 rounded-lg hover:bg-notion-hover transition-colors"
              title={isMuted ? 'Unmute' : 'Mute'}
            >
              {isMuted ? (
                <VolumeX className="w-5 h-5 text-notion-text-muted" />
              ) : (
                <Volume2 className="w-5 h-5 text-notion-text" />
              )}
            </button>

            {/* Seek backward 5s */}
            <button
              onClick={seekBackward}
              className="p-2 rounded-lg hover:bg-notion-hover transition-colors"
              title="Rewind 5s"
            >
              <Rewind className="w-5 h-5 text-notion-text" />
            </button>

            {/* Play/Pause */}
            <button
              onClick={togglePlay}
              className="p-3 bg-primary rounded-full hover:bg-primary/90 transition-colors"
              title={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? (
                <Pause className="w-5 h-5 text-white" />
              ) : (
                <Play className="w-5 h-5 text-white ml-0.5" />
              )}
            </button>

            {/* Seek forward 5s */}
            <button
              onClick={seekForward}
              className="p-2 rounded-lg hover:bg-notion-hover transition-colors"
              title="Forward 5s"
            >
              <FastForward className="w-5 h-5 text-notion-text" />
            </button>

            {/* Replay segment */}
            {isLooping && (
              <button
                onClick={replaySegment}
                className="p-2 rounded-lg hover:bg-notion-hover transition-colors"
                title="Replay segment"
              >
                <RotateCcw className="w-5 h-5 text-primary" />
              </button>
            )}

            {/* Playback Speed */}
            <div className="relative">
              <button
                onClick={() => setShowSpeedMenu(!showSpeedMenu)}
                className="p-2 rounded-lg hover:bg-notion-hover transition-colors flex items-center gap-1"
                title="Playback speed"
              >
                <Gauge className="w-5 h-5 text-notion-text" />
                <span className="text-xs text-notion-text-muted">{playbackSpeed}x</span>
              </button>
              
              {showSpeedMenu && (
                <div className="absolute bottom-full right-0 mb-2 bg-notion-secondary rounded-lg border border-notion-border shadow-lg overflow-hidden">
                  {[0.5, 0.75, 1, 1.25, 1.5, 2].map((speed) => (
                    <button
                      key={speed}
                      onClick={() => changePlaybackSpeed(speed)}
                      className={`w-full px-4 py-2 text-sm text-left hover:bg-notion-hover transition-colors ${
                        playbackSpeed === speed ? 'text-primary bg-primary/10' : 'text-notion-text'
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
    );
  }
);

VideoPlayer.displayName = 'VideoPlayer';

export default VideoPlayer;
