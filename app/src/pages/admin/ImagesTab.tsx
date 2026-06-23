import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import {
  Plus,
  Trash2,
  Upload,
  FolderPlus,
  X,
  Image as ImageIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const MAX_FILE_SIZE = 5 * 1024 * 1024;

export default function ImagesTab() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [showAlbumDialog, setShowAlbumDialog] = useState(false);
  const [newAlbumName, setNewAlbumName] = useState("");

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [url, setUrl] = useState("");
  const [album, setAlbum] = useState("");

  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<Record<string, string>>({});
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadCount, setUploadCount] = useState({ current: 0, total: 0 });

  const { data: images } = useQuery({
    queryKey: ["images", "list"],
    queryFn: () => api.images.list(),
  });

  const { data: albums } = useQuery({
    queryKey: ["albums", "list"],
    queryFn: () => api.albums.list(),
  });

  const createImage = useMutation({
    mutationFn: api.images.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["images", "list"] });
      resetForm();
    },
  });

  const createAlbum = useMutation({
    mutationFn: api.albums.create,
    onSuccess: (newAlbum) => {
      queryClient.invalidateQueries({ queryKey: ["albums", "list"] });
      setAlbum(newAlbum.name);
      setShowAlbumDialog(false);
      setNewAlbumName("");
    },
    onError: (err: any) => {
      alert(err.message || "创建相册失败");
    },
  });

  const deleteImage = useMutation({
    mutationFn: api.images.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["images", "list"] });
      queryClient.invalidateQueries({ queryKey: ["images", "albums"] });
    },
  });

  const resetForm = () => {
    setShowForm(false);
    setTitle("");
    setDescription("");
    setUrl("");
    setAlbum("");
    setSelectedFiles([]);
    setUploadProgress(0);
    setUploadCount({ current: 0, total: 0 });
  };

  const validateAndAddFiles = (files: FileList | null) => {
    if (!files) return;
    const newFiles: File[] = [];
    for (const file of Array.from(files)) {
      if (!ALLOWED_TYPES.includes(file.type)) {
        alert(`不支持的格式，已跳过: ${file.name}`);
        continue;
      }
      if (file.size > MAX_FILE_SIZE) {
        alert(`超过 5MB，已跳过: ${file.name}`);
        continue;
      }
      newFiles.push(file);
    }
    if (newFiles.length > 0) {
      setSelectedFiles((prev) => [...prev, ...newFiles]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    validateAndAddFiles(e.target.files);
    e.target.value = "";
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    validateAndAddFiles(e.dataTransfer.files);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  // 生成/释放图片预览 URL
  useEffect(() => {
    const urls: Record<string, string> = {};
    selectedFiles.forEach((file) => {
      const key = `${file.name}-${file.size}-${file.lastModified}`;
      if (!previewUrls[key]) {
        urls[key] = URL.createObjectURL(file);
      }
    });

    if (Object.keys(urls).length > 0) {
      setPreviewUrls((prev) => ({ ...prev, ...urls }));
    }

    return () => {
      Object.values(urls).forEach((url) => URL.revokeObjectURL(url));
    };
  }, [selectedFiles]);

  const removeFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // URL 方式
    if (selectedFiles.length === 0 && url.trim()) {
      if (!title.trim()) {
        alert("请输入图片标题");
        return;
      }
      createImage.mutate({
        title: title.trim(),
        description: description.trim() || undefined,
        url: url.trim(),
        album: album || undefined,
      });
      return;
    }

    // 文件上传
    if (selectedFiles.length === 0) {
      alert("请选择本地文件或填写图片 URL");
      return;
    }

    setUploading(true);
    setUploadProgress(0);
    const total = selectedFiles.length;
    setUploadCount({ current: 0, total });

    for (let i = 0; i < total; i++) {
      const file = selectedFiles[i];
      const formData = new FormData();

      const fileTitle =
        total === 1 && title.trim()
          ? title.trim()
          : title.trim()
            ? `${title.trim()} ${i + 1}`
            : file.name.replace(/\.[^/.]+$/, "");

      formData.append("title", fileTitle);
      formData.append("description", description.trim() || "");
      formData.append("album", album || "");
      formData.append("file", file);

      try {
        await api.images.upload(formData);
      } catch (err: any) {
        alert(`上传失败: ${file.name} — ${err.message}`);
      }

      setUploadCount({ current: i + 1, total });
      setUploadProgress(Math.round(((i + 1) / total) * 100));
    }

    setUploading(false);
    queryClient.invalidateQueries({ queryKey: ["images", "list"] });
    queryClient.invalidateQueries({ queryKey: ["images", "albums"] });
    resetForm();
  };

  const canSubmit =
    !uploading &&
    !createImage.isPending &&
    (selectedFiles.length > 0 || url.trim()) &&
    (selectedFiles.length > 0 || title.trim());

  return (
    <div>
      <Button
        onClick={() => setShowForm(!showForm)}
        className="flex items-center gap-2 px-4 py-2 bg-yellow-400 text-black text-sm font-medium rounded-xl neo-border hover:bg-yellow-500 transition-colors mb-6"
      >
        <Plus className="w-4 h-4" />
        {showForm ? "取消" : "添加图片"}
      </Button>

      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-2xl p-6 neo-border neo-shadow-sm mb-8 space-y-4"
        >
          <h3 className="text-lg font-bold">添加图片</h3>

          {/* 标题和相册 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={selectedFiles.length > 1 ? "标题前缀（可选）" : "图片标题"}
              className="px-4 py-2 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500"
            />
            <div className="flex gap-2">
              <Select
                value={album}
                onValueChange={(value) => setAlbum(value)}
              >
                <SelectTrigger className="flex-1 px-4 py-2 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500">
                  <SelectValue placeholder="选择相册分类" />
                </SelectTrigger>
                <SelectContent>
                  {albums?.map((a) => (
                    <SelectItem key={a.id} value={a.name}>
                      {a.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Dialog open={showAlbumDialog} onOpenChange={setShowAlbumDialog}>
                <DialogTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="flex items-center gap-1 border-2 border-gray-200 rounded-xl"
                  >
                    <FolderPlus className="w-4 h-4" />
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>新建相册分类</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <Input
                      type="text"
                      value={newAlbumName}
                      onChange={(e) => setNewAlbumName(e.target.value)}
                      placeholder="相册名称"
                      className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl"
                    />
                    <Button
                      type="button"
                      onClick={() => {
                        if (!newAlbumName.trim()) return;
                        createAlbum.mutate({ name: newAlbumName.trim() });
                      }}
                      disabled={createAlbum.isPending}
                      className="w-full px-4 py-2 bg-blue-500 text-white font-medium rounded-xl hover:bg-blue-600 transition-colors"
                    >
                      {createAlbum.isPending ? "创建中..." : "创建"}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          {/* 拖拽上传区域 */}
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            className={`border-2 border-dashed rounded-xl p-6 text-center transition-colors cursor-pointer ${
              isDragging
                ? "border-blue-500 bg-blue-50"
                : "border-gray-300 hover:border-gray-400"
            }`}
          >
            <input
              type="file"
              id="file-upload"
              multiple
              accept="image/jpeg,image/png,image/webp,image/gif"
              onChange={handleFileSelect}
              className="hidden"
            />
            <label htmlFor="file-upload" className="cursor-pointer block">
              <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400" />
              <p className="text-sm text-gray-600 font-medium">
                点击选择文件或拖拽到此处上传
              </p>
              <p className="text-xs text-gray-400 mt-1">
                支持 JPG、PNG、WEBP、GIF，单个文件不超过 5MB
              </p>
              <p className="text-xs text-gray-400">可同时选择多个文件</p>
            </label>
          </div>

          {/* 已选文件列表 */}
          {selectedFiles.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-700">
                已选择 {selectedFiles.length} 个文件
              </p>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {selectedFiles.map((file, idx) => {
                  const key = `${file.name}-${file.size}-${file.lastModified}`;
                  const previewUrl = previewUrls[key];
                  return (
                    <div
                      key={`${file.name}-${idx}`}
                      className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        {previewUrl ? (
                          <img
                            src={previewUrl}
                            alt={file.name}
                            className="w-12 h-12 object-cover rounded-lg border border-gray-200 shrink-0"
                          />
                        ) : (
                          <div className="w-12 h-12 flex items-center justify-center bg-gray-100 rounded-lg border border-gray-200 shrink-0">
                            <ImageIcon className="w-5 h-5 text-gray-400" />
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="text-sm text-gray-700 truncate">
                            {file.name}
                          </p>
                          <p className="text-xs text-gray-400">
                            ({(file.size / 1024).toFixed(1)} KB)
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeFile(idx)}
                        className="p-1 text-gray-400 hover:text-red-500 transition-colors shrink-0"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 上传进度 */}
          {uploading && (
            <div className="space-y-2">
              <Progress value={uploadProgress} className="h-2 w-full" />
              <p className="text-sm text-gray-600">
                上传中 {uploadCount.current} / {uploadCount.total}（{uploadProgress}%）
              </p>
            </div>
          )}

          {/* URL 输入（备用） */}
          <div className="space-y-2">
            <label className="text-sm font-medium">
              图片 URL（或直接上传本地文件）
            </label>
            <Input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="图片 URL"
              className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500"
            />
          </div>

          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="图片描述"
            rows={3}
            className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 resize-y"
          />

          <div className="flex justify-end">
            <Button
              type="submit"
              disabled={!canSubmit}
              className="px-6 py-2 bg-blue-500 text-white font-medium rounded-xl hover:bg-blue-600 transition-colors disabled:opacity-50"
            >
              {uploading || createImage.isPending
                ? "添加中..."
                : `添加${selectedFiles.length > 0 ? ` (${selectedFiles.length})` : ""}`}
            </Button>
          </div>
        </form>
      )}

      {/* 图片列表 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {images?.map((img) => (
          <div
            key={img.id}
            className="bg-white rounded-xl neo-border overflow-hidden"
          >
            <div className="aspect-video bg-gray-100">
              <img
                src={img.url}
                alt={img.title}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="p-3 flex items-center justify-between">
              <div className="min-w-0">
                <h4 className="font-semibold text-sm truncate">{img.title}</h4>
                {img.album && (
                  <span className="text-xs text-gray-400">{img.album}</span>
                )}
              </div>
              <button
                type="button"
                onClick={() => {
                  if (confirm("确定删除这张图片？")) {
                    deleteImage.mutate(img.id);
                  }
                }}
                className="p-1.5 text-gray-500 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
        {images?.length === 0 && (
          <p className="text-center text-gray-400 col-span-full py-8">
            暂无图片
          </p>
        )}
      </div>
    </div>
  );
}
