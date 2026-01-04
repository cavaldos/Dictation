import React, { useState, useRef, useEffect } from 'react';
import { Check, SkipForward, ChevronRight, Eye, EyeOff } from 'lucide-react';
import type { SubtitleItem } from '~/services/youtube.service';
import { compareTexts, compareWordsDetailed, type WordComparison } from '~/services/youtube.service';
import { useSettings } from '~/context/SettingsContext';

interface DictationInputProps {
  subtitles: SubtitleItem[];
  currentIndex: number;
  onCorrect: () => void;
  onSkip: () => void;
}

const DictationInput: React.FC<DictationInputProps> = ({
  subtitles,
  currentIndex,
  onCorrect,
  onSkip,
}) => {
  const { settings } = useSettings();
  const [userInput, setUserInput] = useState('');
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [accuracy, setAccuracy] = useState(0);
  const [wordComparison, setWordComparison] = useState<WordComparison[]>([]);
  const [blurTranslation, setBlurTranslation] = useState(true);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const currentSubtitle = subtitles[currentIndex];
  const progress = subtitles.length > 0 ? ((currentIndex + 1) / subtitles.length) * 100 : 0;
  const hasTranslation = currentSubtitle?.translatedText;

  useEffect(() => {
    // Reset state when moving to next subtitle
    setUserInput('');
    setShowResult(false);
    setIsCorrect(false);
    setAccuracy(0);
    setWordComparison([]);
    setBlurTranslation(true); // Reset blur when moving to next
    inputRef.current?.focus();
  }, [currentIndex]);

  const handleCheck = () => {
    if (!currentSubtitle || !userInput.trim()) return;

    const result = compareTexts(currentSubtitle.text, userInput, settings.accuracyThreshold);
    setIsCorrect(result.isCorrect);
    setAccuracy(result.accuracy);
    setShowResult(true);
    
    // Generate word comparison for wrong answers
    if (!result.isCorrect) {
      const comparison = compareWordsDetailed(currentSubtitle.text, userInput);
      setWordComparison(comparison);
    }

    if (result.isCorrect) {
      setTimeout(() => {
        onCorrect();
      }, 1000);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (showResult && isCorrect) {
        onCorrect();
      } else if (!showResult) {
        handleCheck();
      }
    }
  };

  const handleNext = () => {
    if (showResult && isCorrect) {
      onCorrect();
    } else {
      onSkip();
    }
  };

  if (!currentSubtitle) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center text-notion-text-muted">
          <p className="text-lg mb-2">No subtitles available</p>
          <p className="text-sm">Please enter a YouTube URL with subtitles</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      {/* Progress Bar */}
      <div className="mb-6">
        <div className="flex justify-between text-sm text-notion-text-muted mb-2">
          <span>Progress</span>
          <span>{currentIndex + 1} / {subtitles.length}</span>
        </div>
        <div className="h-2 bg-notion-secondary rounded-full overflow-hidden">
          <div 
            className="h-full bg-primary transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Dictation Card */}
      <div className="bg-notion-secondary rounded-xl p-6 shadow-lg">
        {/* Time indicator + Loop hint */}
        <div className="flex justify-between items-center mb-4">
          <div className="text-xs text-notion-text-muted">
            {formatTime(currentSubtitle.start)} - {formatTime(currentSubtitle.start + currentSubtitle.dur)}
          </div>
          <div className="text-xs text-primary">
            Video is looping this segment
          </div>
        </div>

        {/* Translation hint (if available) */}
        {hasTranslation && (
          <div className="mb-4 p-3 bg-notion-main rounded-lg">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-yellow-500/80">Translation hint:</span>
              <button
                onClick={() => setBlurTranslation(!blurTranslation)}
                className={`flex items-center gap-1 text-xs px-2 py-0.5 rounded transition-colors ${
                  blurTranslation 
                    ? 'text-notion-text-muted hover:text-notion-text' 
                    : 'bg-yellow-500/20 text-yellow-500'
                }`}
                title={blurTranslation ? 'Show translation' : 'Hide translation'}
              >
                {blurTranslation ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                {blurTranslation ? 'Show' : 'Hide'}
              </button>
            </div>
            <div 
              className={`text-sm text-yellow-500/80 transition-all duration-200 cursor-pointer ${
                blurTranslation ? 'blur-sm hover:blur-none' : ''
              }`}
              onClick={() => setBlurTranslation(!blurTranslation)}
            >
              {currentSubtitle.translatedText}
            </div>
          </div>
        )}

        {/* Input Area */}
        <div className="mb-4">
          <textarea
            ref={inputRef}
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type what you hear..."
            disabled={showResult && isCorrect}
            className={`w-full h-24 p-4 bg-notion-main rounded-lg border-2 text-notion-text placeholder:text-notion-text-muted resize-none focus:outline-none transition-colors ${
              showResult
                ? isCorrect
                  ? 'border-green-500'
                  : 'border-red-500'
                : 'border-notion-border focus:border-primary'
            }`}
          />
        </div>

        {/* Result Display */}
        {showResult && (
          <div className={`mb-4 p-4 rounded-lg ${isCorrect ? 'bg-green-500/10' : 'bg-red-500/10'}`}>
            <div className="flex items-center gap-2 mb-2">
              <span className={`text-sm font-medium ${isCorrect ? 'text-green-400' : 'text-red-400'}`}>
                {isCorrect ? 'Correct!' : 'Not quite right'}
              </span>
              <span className="text-sm text-notion-text-muted">
                ({accuracy}% accuracy)
              </span>
            </div>
            
            {/* Word-by-word comparison for wrong answers */}
            {!isCorrect && wordComparison.length > 0 && (
              <div className="mb-3 p-3 bg-notion-main rounded-lg">
                <div className="text-xs text-notion-text-muted mb-2">Your answer:</div>
                <div className="flex flex-wrap gap-1">
                  {wordComparison.map((item, index) => (
                    <span
                      key={index}
                      className={`inline-block px-1.5 py-0.5 rounded text-sm ${
                        item.isCorrect
                          ? 'bg-green-500/20 text-green-400'
                          : item.isMissing
                            ? 'bg-yellow-500/20 text-yellow-400 line-through'
                            : item.isExtra
                              ? 'bg-red-500/20 text-red-400 line-through'
                              : 'bg-red-500/20 text-red-400'
                      }`}
                      title={
                        item.isMissing
                          ? `Missing: "${item.expected}"`
                          : item.isExtra
                            ? 'Extra word'
                            : !item.isCorrect
                              ? `Expected: "${item.expected}"`
                              : ''
                      }
                    >
                      {item.isMissing ? item.expected : item.word}
                      {!item.isCorrect && !item.isMissing && !item.isExtra && item.expected && (
                        <span className="text-green-400 text-xs ml-1">({item.expected})</span>
                      )}
                    </span>
                  ))}
                </div>
                <div className="mt-2 text-xs text-notion-text-muted">
                  <span className="inline-block w-3 h-3 bg-green-500/20 rounded mr-1"></span> Correct
                  <span className="inline-block w-3 h-3 bg-red-500/20 rounded mx-1 ml-3"></span> Wrong
                  <span className="inline-block w-3 h-3 bg-yellow-500/20 rounded mx-1 ml-3"></span> Missing
                </div>
              </div>
            )}
            
            <div className="text-notion-text">
              <span className="text-notion-text-muted text-sm">Correct answer: </span>
              <span className="text-notion-text">{currentSubtitle.text}</span>
            </div>
            
            {/* Show translation after checking */}
            {hasTranslation && (
              <div className="mt-2 text-notion-text">
                <span className="text-yellow-500/60 text-sm">Translation: </span>
                <span className="text-yellow-500/80">{currentSubtitle.translatedText}</span>
              </div>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3">
          {!showResult ? (
            <>
              <button
                onClick={handleCheck}
                disabled={!userInput.trim()}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-primary rounded-lg text-white hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Check className="w-4 h-4" />
                Check
              </button>
              <button
                onClick={onSkip}
                className="flex items-center gap-2 px-4 py-2 bg-notion-hover rounded-lg text-notion-text-muted hover:bg-notion-border hover:text-notion-text transition-colors"
              >
                <SkipForward className="w-4 h-4" />
                Skip
              </button>
            </>
          ) : (
            <button
              onClick={handleNext}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-primary rounded-lg text-white hover:bg-primary/90 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
              Next
            </button>
          )}
        </div>
      </div>

      {/* Keyboard shortcuts hint */}
      <div className="mt-4 text-center text-xs text-notion-text-muted">
        Press <kbd className="px-1.5 py-0.5 bg-notion-secondary rounded">Enter</kbd> to check/continue
      </div>
    </div>
  );
};

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export default DictationInput;
