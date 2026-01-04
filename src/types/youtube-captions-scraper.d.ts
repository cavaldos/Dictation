declare module 'youtube-captions-scraper' {
  interface CaptionOptions {
    videoID: string;
    lang?: string;
  }

  interface Caption {
    start: string | number;
    dur: string | number;
    text: string;
  }

  export function getSubtitles(options: CaptionOptions): Promise<Caption[]>;
}
