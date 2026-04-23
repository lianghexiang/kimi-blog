import { useState } from "react";
import { trpc } from "@/providers/trpc";
import Navbar from "@/components/Navbar";
import Footer from "@/sections/Footer";
import { Camera, Image, MapPin } from "lucide-react";

const fallbackImages = [
  { id: 1, title: "春日樱花", description: "「2024年春，家附近的公园樱花盛开。", url: "/photo-spring.jpg", album: "摄影" },
  { id: 2, title: "蓝色静物", description: "「极简主义色彩练习，橙子与克莱因蓝的对撞。」", url: "/photo-orange.jpg", album: "摄影" },
  { id: 3, title: "日落海边", description: "「金色的黄昏，海浪与飞鸟。」", url: "/photo-sea.jpg", album: "旅行" },
  { id: 4, title: "秋日小径", description: "「铺满落叶的林间小道，秋天独有的温柔。」", url: "/photo-autumn.jpg", album: "旅行" },
  { id: 5, title: "熟睡的小猫", description: "「画了一只打盹的橘猫，希望能给你带来片刻的宁静。」", url: "/photo-cat.png", album: "插画" },
];

export default function GalleryPage() {
  const [selectedAlbum, setSelectedAlbum] = useState<string | null>(null);
  const { data: dbImages } = trpc.image.list.useQuery();

  const images = dbImages && dbImages.length > 0
    ? dbImages.map((img) => ({
        id: img.id,
        title: img.title,
        description: img.description || "",
        url: img.url,
        album: img.album || "未分类",
      }))
    : fallbackImages;

  const albums = Array.from(new Set(images.map((img) => img.album || "未分类")));

  const filteredImages = selectedAlbum
    ? images.filter((img) => (img.album || "未分类") === selectedAlbum)
    : images;

  return (
    <div className="min-h-screen bg-[#F9FAFB]">
      <Navbar />
      <main className="pt-24 pb-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="text-center mb-12">
            <span className="inline-flex items-center gap-2 px-4 py-1.5 bg-yellow-100 text-yellow-800 rounded-full text-xs font-mono-type tracking-wider mb-4">
              <Camera className="w-3.5 h-3.5" />
              GALLERY
            </span>
            <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">
              画廊
            </h1>
            <p className="text-gray-600 max-w-lg mx-auto">
              视觉记忆的收藏馆，每一张照片背后都有一个故事
            </p>
          </div>

          {/* Album Filter */}
          <div className="flex flex-wrap justify-center gap-2 mb-10">
            <button
              onClick={() => setSelectedAlbum(null)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                !selectedAlbum
                  ? "bg-yellow-400 text-black neo-border"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              <Image className="w-4 h-4" />
              全部
            </button>
            {albums.map((album) => (
              <button
                key={album}
                onClick={() => setSelectedAlbum(album)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  selectedAlbum === album
                    ? "bg-yellow-400 text-black neo-border"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                <MapPin className="w-4 h-4" />
                {album}
              </button>
            ))}
          </div>

          {/* Image Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredImages.map((image) => (
              <div
                key={image.id}
                className="group relative bg-white rounded-2xl overflow-hidden neo-border neo-shadow-sm hover:-translate-y-1 hover:shadow-lg transition-all"
              >
                <div className="aspect-[4/3] overflow-hidden">
                  <img
                    src={image.url}
                    alt={image.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                  />
                </div>
                <div className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-bold text-gray-900">{image.title}</h3>
                    {image.album && (
                      <span className="px-2 py-0.5 bg-gray-100 text-gray-500 rounded-full text-xs">
                        {image.album}
                      </span>
                    )}
                  </div>
                  {image.description && (
                    <p className="text-gray-500 text-sm line-clamp-2">
                      {image.description}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>

          {filteredImages.length === 0 && (
            <div className="text-center py-16">
              <p className="text-gray-400 text-lg">该分类暂无图片</p>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
