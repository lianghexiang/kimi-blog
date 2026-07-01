import { useState, useRef, useCallback, useEffect } from "react";
import type { MusicTrack } from "@/types/music";

export type LoopMode = "all" | "one" | "none";

export interface UseMusicPlayerState {
  isPlaying: boolean;
  currentTrack: MusicTrack | null;
  currentIndex: number;
  progress: number;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  loopMode: LoopMode;
  isExpanded: boolean;
  playlist: MusicTrack[];
}

export function useMusicPlayer(initialPlaylist: MusicTrack[] = []) {
  const [state, setState] = useState<UseMusicPlayerState>({
    isPlaying: false,
    currentTrack: initialPlaylist[0] ?? null,
    currentIndex: 0,
    progress: 0,
    currentTime: 0,
    duration: 0,
    volume: 0.8,
    isMuted: false,
    loopMode: "all",
    isExpanded: false,
    playlist: initialPlaylist,
  });

  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Initialize audio element once
  useEffect(() => {
    const audio = new Audio();
    audio.volume = 0.8;
    audioRef.current = audio;

    const handleTimeUpdate = () => {
      if (!audio.duration) return;
      setState((prev) => ({
        ...prev,
        currentTime: audio.currentTime,
        progress: (audio.currentTime / audio.duration) * 100,
      }));
    };

    const handleLoadedMetadata = () => {
      setState((prev) => ({
        ...prev,
        duration: audio.duration,
      }));
    };

    const handleEnded = () => {
      setState((prev) => {
        if (prev.loopMode === "one") {
          audio.currentTime = 0;
          audio.play().catch(() => {});
          return { ...prev, isPlaying: true };
        }
        const nextIndex =
          prev.currentIndex + 1 >= prev.playlist.length
            ? prev.loopMode === "all"
              ? 0
              : -1
            : prev.currentIndex + 1;
        if (nextIndex === -1) {
          return { ...prev, isPlaying: false, progress: 0, currentTime: 0 };
        }
        const nextTrack = prev.playlist[nextIndex];
        audio.src = nextTrack.url;
        audio.play().catch(() => {});
        return {
          ...prev,
          currentIndex: nextIndex,
          currentTrack: nextTrack,
          isPlaying: true,
          progress: 0,
          currentTime: 0,
        };
      });
    };

    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("loadedmetadata", handleLoadedMetadata);
    audio.addEventListener("ended", handleEnded);

    return () => {
      audio.pause();
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
      audio.removeEventListener("ended", handleEnded);
      audioRef.current = null;
    };
  }, []);

  // Update playlist when prop changes
  useEffect(() => {
    setState((prev) => {
      const newTrack = initialPlaylist[0] ?? null;
      const audio = audioRef.current;
      if (audio && newTrack && prev.currentTrack?.id !== newTrack.id) {
        audio.src = newTrack.url;
      }
      return {
        ...prev,
        playlist: initialPlaylist,
        currentTrack: newTrack,
        currentIndex: 0,
        progress: 0,
        currentTime: 0,
        duration: 0,
      };
    });
  }, [initialPlaylist]);

  const play = useCallback(() => {
    const audio = audioRef.current;
    if (!audio || !state.currentTrack) return;
    if (!audio.src && state.currentTrack.url) {
      audio.src = state.currentTrack.url;
    }
    audio.play().catch(() => {});
    setState((prev) => ({ ...prev, isPlaying: true }));
  }, [state.currentTrack]);

  const pause = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.pause();
    setState((prev) => ({ ...prev, isPlaying: false }));
  }, []);

  const togglePlay = useCallback(() => {
    if (state.isPlaying) {
      pause();
    } else {
      play();
    }
  }, [state.isPlaying, play, pause]);

  const prev = useCallback(() => {
    const audio = audioRef.current;
    if (!audio || state.playlist.length === 0) return;
    const newIndex =
      state.currentIndex === 0
        ? state.playlist.length - 1
        : state.currentIndex - 1;
    const track = state.playlist[newIndex];
    audio.src = track.url;
    audio.play().catch(() => {});
    setState((prev) => ({
      ...prev,
      currentIndex: newIndex,
      currentTrack: track,
      isPlaying: true,
      progress: 0,
      currentTime: 0,
    }));
  }, [state.currentIndex, state.playlist]);

  const next = useCallback(() => {
    const audio = audioRef.current;
    if (!audio || state.playlist.length === 0) return;
    const newIndex =
      state.currentIndex + 1 >= state.playlist.length
        ? 0
        : state.currentIndex + 1;
    const track = state.playlist[newIndex];
    audio.src = track.url;
    audio.play().catch(() => {});
    setState((prev) => ({
      ...prev,
      currentIndex: newIndex,
      currentTrack: track,
      isPlaying: true,
      progress: 0,
      currentTime: 0,
    }));
  }, [state.currentIndex, state.playlist]);

  const seek = useCallback(
    (percent: number) => {
      const audio = audioRef.current;
      if (!audio || !audio.duration) return;
      const time = (percent / 100) * audio.duration;
      audio.currentTime = time;
      setState((prev) => ({
        ...prev,
        progress: percent,
        currentTime: time,
      }));
    },
    []
  );

  const setVolume = useCallback((vol: number) => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.volume = vol;
    setState((prev) => ({ ...prev, volume: vol, isMuted: vol === 0 }));
  }, []);

  const toggleMute = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (state.isMuted) {
      audio.volume = state.volume || 0.8;
      setState((prev) => ({ ...prev, isMuted: false }));
    } else {
      audio.volume = 0;
      setState((prev) => ({ ...prev, isMuted: true }));
    }
  }, [state.isMuted, state.volume]);

  const toggleLoopMode = useCallback(() => {
    setState((prev) => {
      const modes: LoopMode[] = ["all", "one", "none"];
      const idx = modes.indexOf(prev.loopMode);
      const nextMode = modes[(idx + 1) % modes.length];
      return { ...prev, loopMode: nextMode };
    });
  }, []);

  const toggleExpanded = useCallback(() => {
    setState((prev) => ({ ...prev, isExpanded: !prev.isExpanded }));
  }, []);

  const selectTrack = useCallback(
    (index: number) => {
      const audio = audioRef.current;
      if (!audio || index < 0 || index >= state.playlist.length) return;
      const track = state.playlist[index];
      audio.src = track.url;
      audio.play().catch(() => {});
      setState((prev) => ({
        ...prev,
        currentIndex: index,
        currentTrack: track,
        isPlaying: true,
        progress: 0,
        currentTime: 0,
      }));
    },
    [state.playlist]
  );

  return {
    ...state,
    play,
    pause,
    togglePlay,
    prev,
    next,
    seek,
    setVolume,
    toggleMute,
    toggleLoopMode,
    toggleExpanded,
    selectTrack,
  };
}
