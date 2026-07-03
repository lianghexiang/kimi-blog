export interface MusicTrack {
  id: string;
  title: string;
  artist: string;
  url: string;
  cover?: string;
}

export interface MusicPlayerConfig {
  enabled: boolean;
  autoplay?: boolean;
  loopMode?: "all" | "one" | "none";
  tracks: MusicTrack[];
}
