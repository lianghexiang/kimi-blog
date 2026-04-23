import { Routes, Route } from "react-router";
import Home from "./pages/Home";
import Blog from "./pages/Blog";
import BlogPost from "./pages/BlogPost";
import Journal from "./pages/Journal";
import Thoughts from "./pages/Thoughts";
import GalleryPage from "./pages/GalleryPage";
import Admin from "./pages/Admin";
import Login from "./pages/Login";
import NotFound from "./pages/NotFound";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/blog" element={<Blog />} />
      <Route path="/blog/:slug" element={<BlogPost />} />
      <Route path="/journal" element={<Journal />} />
      <Route path="/thoughts" element={<Thoughts />} />
      <Route path="/gallery" element={<GalleryPage />} />
      <Route path="/admin" element={<Admin />} />
      <Route path="/login" element={<Login />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
