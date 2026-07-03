import { useCallback } from "react";
import {
  Music,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  Repeat,
  Repeat1,
  ListMusic,
  ChevronDown,
} from "lucide-react";
import { useMusicPlayer } from "@/hooks/useMusicPlayer";
import type { MusicTrack } from "@/types/music";
import "./MusicPlayer.css";

interface MusicPlayerProps {
  playlist: MusicTrack[];
  autoplay?: boolean;
  loopMode?: "all" | "one" | "none";
}

function formatTime(seconds: number): string {
  if (!isFinite(seconds) || seconds < 0) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function WaveBars() {
  return (
    <div className="flex items-end gap-[3px] h-5">
      <div className="music-wave-bar" />
      <div className="music-wave-bar" />
      <div className="music-wave-bar" />
      <div className="music-wave-bar" />
    </div>
  );
}

export default function MusicPlayer({
  playlist,
}: MusicPlayerProps) {
  const player = useMusicPlayer(playlist);

  const handleSeek = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      player.seek(Number(e.target.value));
    },
    [player]
  );

  const handleVolume = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      player.setVolume(Number(e.target.value) / 100);
    },
    [player]
  );

  // If no tracks, show static decorative button (no click handler)
  if (playlist.length === 0) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <div className="w-14 h-14 bg-yellow-400 neo-border neo-shadow rounded-2xl flex items-center justify-center cursor-help">
          <Music className="w-6 h-6 text-black" />
        </div>
      </div>
    );
  }

  const loopIcon =
    player.loopMode === "one" ? (
      <Repeat1 className="w-4 h-4" />
    ) : (
      <Repeat className="w-4 h-4" />
    );

  const loopLabel =
    player.loopMode === "all" ? "列表循环" : player.loopMode === "one" ? "单曲循环" : "不循环";

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {/* Expanded Panel */}
      <div
        className={`music-panel absolute bottom-16 right-0 w-80 bg-white neo-border neo-shadow rounded-2xl overflow-hidden transition-all duration-200 origin-bottom-right ${
          player.isExpanded
            ? "opacity-100 scale-100 translate-y-0 pointer-events-auto"
            : "opacity-0 scale-95 translate-y-2 pointer-events-none"
        }`}
      >
        {/* Header */}
        <div className="bg-yellow-50 border-b-2 border-black px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ListMusic className="w-5 h-5 text-black" />
            <span className="font-display font-bold text-sm">音乐播放器</span>
          </div>
          <button
            onClick={player.toggleExpanded}
            className="neo-border rounded-lg p-1 hover:bg-yellow-100 transition-colors"
          >
            <ChevronDown className="w-4 h-4" />
          </button>
        </div>

        {/* Current Track Info */}
        <div className="px-4 py-4 flex items-center gap-3">
          {player.currentTrack?.cover ? (
            <img
              src={player.currentTrack.cover}
              alt={player.currentTrack.title}
              className="w-14 h-14 rounded-xl neo-border object-cover"
            />
          ) : (
            <div className="w-14 h-14 rounded-xl neo-border music-cover-placeholder">
              <Music className="w-6 h-6 text-black/60" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="font-bold text-sm truncate">
              {player.currentTrack?.title || "未选择歌曲"}
            </div>
            <div className="text-xs text-gray-500 truncate">
              {player.currentTrack?.artist || "-"}
            </div>
          </div>
          {player.isPlaying && <WaveBars />}
        </div>

        {/* Progress Bar */}
        <div className="px-4 pb-3">
          <input
            type="range"
            min={0}
            max={100}
            step={0.1}
            value={player.progress}
            onChange={handleSeek}
            className="music-slider"
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>{formatTime(player.currentTime)}</span>
            <span>{formatTime(player.duration)}</span>
          </div>
        </div>

        {/* Control Buttons */}
        <div className="px-4 pb-3 flex items-center justify-center gap-3">
          <button
            onClick={player.prev}
            className="neo-border neo-shadow-sm rounded-xl p-2 hover:bg-gray-50 music-btn-press transition-colors"
          >
            <SkipBack className="w-5 h-5" />
          </button>
          <button
            onClick={player.togglePlay}
            className="bg-yellow-400 neo-border neo-shadow-sm rounded-xl p-3 hover:bg-yellow-300 music-btn-press transition-colors"
          >
            {player.isPlaying ? (
              <Pause className="w-6 h-6" />
            ) : (
              <Play className="w-6 h-6" />
            )}
          </button>
          <button
            onClick={player.next}
            className="neo-border neo-shadow-sm rounded-xl p-2 hover:bg-gray-50 music-btn-press transition-colors"
          >
            <SkipForward className="w-5 h-5" />
          </button>
        </div>

        {/* Volume + Loop */}
        <div className="px-4 pb-3 flex items-center gap-3">
          <button
            onClick={player.toggleMute}
            className="neo-border rounded-lg p-1.5 hover:bg-gray-50 transition-colors"
          >
            {player.isMuted || player.volume === 0 ? (
              <VolumeX className="w-4 h-4" />
            ) : (
              <Volume2 className="w-4 h-4" />
            )}
          </button>
          <input
            type="range"
            min={0}
            max={100}
            step={1}
            value={player.isMuted ? 0 : Math.round(player.volume * 100)}
            onChange={handleVolume}
            className="music-slider music-slider-sm flex-1"
          />
          <button
            onClick={player.toggleLoopMode}
            className="neo-border rounded-lg p-1.5 hover:bg-gray-50 transition-colors"
            title={loopLabel}
          >
            {loopIcon}
          </button>
        </div>

        {/* Playlist */}
        <div className="border-t-2 border-black max-h-48 overflow-y-auto music-playlist-scroll">
          {playlist.map((track, index) => (
            <button
              key={track.id}
              onClick={() => player.selectTrack(index)}
              className={`w-full text-left px-4 py-2.5 flex items-center gap-3 hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-b-0 ${
                index === player.currentIndex ? "music-track-active" : ""
              }`}
            >
              {track.cover ? (
                <img
                  src={track.cover}
                  alt={track.title}
                  className="w-8 h-8 rounded-lg neo-border object-cover"
                />
              ) : (
                <div className="w-8 h-8 rounded-lg neo-border music-cover-placeholder flex items-center justify-center">
                  <Music className="w-4 h-4 text-black/60" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium truncate">{track.title}</div>
                <div className="text-xs text-gray-500 truncate">{track.artist}</div>
              </div>
              {index === player.currentIndex && player.isPlaying && (
                <WaveBars />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Mini Button */}
      <button
        onClick={player.toggleExpanded}
        className={`w-14 h-14 bg-yellow-400 neo-border neo-shadow rounded-2xl flex items-center justify-center transition-all hover:bg-yellow-300 music-btn-press ${
          player.isPlaying ? "music-pulse" : ""
        }`}
      >
        {player.isPlaying ? (
          <WaveBars />
        ) : (
          <Music className="w-6 h-6 text-black" />
        )}
      </button>
    </div>
  );
}
