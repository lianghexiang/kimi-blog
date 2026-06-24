import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Trash2, GripVertical, ImageIcon, Link as LinkIcon } from "lucide-react";

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

export default function AboutCarouselTab() {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [url, setUrl] = useState("");
  const [caption, setCaption] = useState("");
  const [error, setError] = useState("");

  const { data: items = [] } = useQuery({
    queryKey: ["about-carousel"],
    queryFn: () => api.aboutCarousel.list(),
  });

  const uploadMutation = useMutation({
    mutationFn: (formData: FormData) => api.aboutCarousel.upload(formData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["about-carousel"] });
      setCaption("");
    },
    onError: (err: Error) => setError(err.message),
  });

  const createMutation = useMutation({
    mutationFn: (data: { imageUrl: string; caption?: string }) => api.aboutCarousel.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["about-carousel"] });
      setUrl("");
      setCaption("");
    },
    onError: (err: Error) => setError(err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.aboutCarousel.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["about-carousel"] }),
  });

  const reorderMutation = useMutation({
    mutationFn: (orderedItems: { id: number; sortOrder: number }[]) =>
      api.aboutCarousel.reorder(orderedItems),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["about-carousel"] }),
  });

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError("");
    if (!ALLOWED_TYPES.includes(file.type)) {
      setError("只支持 JPG、PNG、WEBP、GIF 格式");
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      setError("文件大小不能超过 5MB");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);
    if (caption.trim()) formData.append("caption", caption.trim());
    uploadMutation.mutate(formData);

    e.target.value = "";
  };

  const handleUrlSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;
    setError("");
    createMutation.mutate({ imageUrl: url.trim(), caption: caption.trim() || undefined });
  };

  const handleDragStart = (idx: number) => {
    setDragIndex(idx);
  };

  const handleDragOver = (e: React.DragEvent, idx: number) => {
    e.preventDefault();
    if (dragIndex === null || dragIndex === idx) return;

    const newItems = [...items];
    const dragged = newItems[dragIndex];
    newItems.splice(dragIndex, 1);
    newItems.splice(idx, 0, dragged);

    reorderMutation.mutate(
      newItems.map((item, index) => ({ id: item.id, sortOrder: index }))
    );
    setDragIndex(idx);
  };

  const handleDragEnd = () => {
    setDragIndex(null);
  };

  const sortedItems = [...items].sort((a, b) => a.sortOrder - b.sortOrder);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h2 className="text-xl font-bold">关于页轮播图</h2>
        <p className="text-sm text-gray-500">拖拽图片可调整展示顺序</p>
      </div>

      {error && (
        <p className="text-sm text-red-500 bg-red-50 px-3 py-2 rounded-lg border border-red-100">
          {error}
        </p>
      )}

      {/* Add new item */}
      <div className="bg-white rounded-2xl p-6 neo-border neo-shadow-sm space-y-4">
        <h3 className="font-medium">添加图片</h3>

        <form onSubmit={handleUrlSubmit} className="flex flex-wrap items-end gap-3">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-xs text-gray-500 mb-1">图片 URL</label>
            <div className="relative">
              <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://example.com/image.jpg"
                className="pl-9"
              />
            </div>
          </div>
          <div className="flex-1 min-w-[200px]">
            <label className="block text-xs text-gray-500 mb-1">说明（可选）</label>
            <Input
              type="text"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="图片说明"
            />
          </div>
          <Button
            type="submit"
            disabled={!url.trim() || createMutation.isPending}
            className="bg-blue-500 hover:bg-blue-600 text-white"
          >
            <Plus className="w-4 h-4 mr-1" />
            添加 URL
          </Button>
        </form>

        <div className="flex items-center gap-3">
          <input
            type="file"
            ref={fileInputRef}
            accept="image/jpeg,image/png,image/webp,image/gif"
            onChange={handleFileSelect}
            className="hidden"
          />
          <Button
            type="button"
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploadMutation.isPending}
            className="border-2 border-gray-200"
          >
            <ImageIcon className="w-4 h-4 mr-1" />
            上传本地图片
          </Button>
        </div>
      </div>

      {/* List */}
      <div className="bg-white rounded-2xl p-6 neo-border neo-shadow-sm">
        {sortedItems.length === 0 ? (
          <p className="text-center text-gray-400 py-8">暂无轮播图，将显示默认占位图</p>
        ) : (
          <div className="space-y-2">
            {sortedItems.map((item, idx) => (
              <div
                key={item.id}
                draggable
                onDragStart={() => handleDragStart(idx)}
                onDragOver={(e) => handleDragOver(e, idx)}
                onDragEnd={handleDragEnd}
                className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-colors cursor-move ${
                  dragIndex === idx ? "border-blue-500 bg-blue-50" : "border-gray-100 bg-gray-50"
                }`}
              >
                <GripVertical className="w-4 h-4 text-gray-400" />
                <img
                  src={item.imageUrl}
                  alt=""
                  className="w-16 h-16 object-cover rounded-lg border border-gray-200 shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-700 truncate">{item.imageUrl}</p>
                  {item.caption && (
                    <p className="text-xs text-gray-400 truncate">{item.caption}</p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => deleteMutation.mutate(item.id)}
                  disabled={deleteMutation.isPending}
                  className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
