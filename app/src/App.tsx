import { Routes, Route } from "react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { api } from "@/lib/api";
import Home from "./pages/Home";
import Blog from "./pages/Blog";
import BlogPost from "./pages/BlogPost";
import Journal from "./pages/Journal";
import Thoughts from "./pages/Thoughts";
import GalleryPage from "./pages/GalleryPage";
import TagIndex from "./pages/TagIndex";
import Admin from "./pages/admin";
import Login from "./pages/Login";
import NotFound from "./pages/NotFound";
import MusicPlayer from "./components/MusicPlayer";
import type { MusicPlayerConfig } from "./types/music";

function useMusicPlaylist() {
  const { data: configs } = useQuery({
    queryKey: ["site-configs"],
    queryFn: api.siteConfigs.list,
    staleTime: 1000 * 60 * 5,
  });

  return useMemo(() => {
    if (!configs)
      return {
        enabled: false,
        tracks: [],
        autoplay: false,
        loopMode: "all" as const,
      };
    const raw = configs.find((c) => c.key === "music_playlist")?.value;
    if (!raw)
      return {
        tracks: [],
        autoplay: false,
        loopMode: "all" as const,
      };
    try {
      const parsed: MusicPlayerConfig = JSON.parse(raw);
      return {
        tracks: parsed.enabled ? parsed.tracks : [],
        autoplay: parsed.autoplay ?? false,
        loopMode: parsed.loopMode ?? "all",
      };
    } catch {
      return {
        tracks: [],
        autoplay: false,
        loopMode: "all" as const,
      };
    }
  }, [configs]);
}

export default function App() {
  const { tracks, autoplay, loopMode } = useMusicPlaylist();

  return (
    <>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/blog" element={<Blog />} />
        <Route path="/blog/:slug" element={<BlogPost />} />
        <Route path="/journal" element={<Journal />} />
        <Route path="/thoughts" element={<Thoughts />} />
        <Route path="/gallery" element={<GalleryPage />} />
        <Route path="/tags" element={<TagIndex />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="/login" element={<Login />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
      <MusicPlayer playlist={tracks} autoplay={autoplay} loopMode={loopMode} />
    </>
  );
}
