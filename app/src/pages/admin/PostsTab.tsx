import type { PostUpdateInput } from "@/types/api";
import { useState, useRef, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Plus, Edit3, Trash2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import TagMultiSelect from "@/components/TagMultiSelect";
import TiptapEditor from "@/components/editor/TiptapEditor";

// Lazy import mammoth and turndown for document import
async function importMammoth() {
  const mammoth = await import("mammoth");
  return mammoth;
}

async function importTurndown() {
  const TurndownService = (await import("turndown")).default;
  return new TurndownService();
}

export default function PostsTab() {
  const queryClient = useQueryClient();
  const [postType, setPostType] = useState<
    "blog" | "journal" | "thought" | "all"
  >("all");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    type: "blog" as "blog" | "journal" | "thought",
    slug: "",
    status: "published" as "published" | "draft",
    tagIds: [] as number[],
  });
  const [isDraggingDoc, setIsDraggingDoc] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: posts } = useQuery({
    queryKey: [
      "posts",
      "list",
      postType === "all" ? undefined : { type: postType },
    ],
    queryFn: () =>
      api.posts.list(postType === "all" ? undefined : { type: postType }),
  });

  const createPost = useMutation({
    mutationFn: api.posts.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["posts", "list"] });
      setShowForm(false);
      resetForm();
    },
  });

  const updatePost = useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: number;
      data: PostUpdateInput;
    }) => api.posts.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["posts", "list"] });
      setShowForm(false);
      setEditingId(null);
      resetForm();
    },
  });

  const deletePost = useMutation({
    mutationFn: api.posts.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["posts", "list"] });
    },
  });

  const resetForm = () => {
    setFormData({
      title: "",
      content: "",
      type: "blog",
      slug: "",
      status: "published",
      tagIds: [],
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.content || !formData.slug) return;

    const payload = {
      title: formData.title,
      content: formData.content,
      type: formData.type,
      slug: formData.slug,
      status: formData.status,
      tagIds: formData.tagIds.length > 0 ? formData.tagIds : undefined,
    };

    if (editingId) {
      updatePost.mutate({ id: editingId, data: payload });
    } else {
      createPost.mutate(payload);
    }
  };

  const startEdit = (post: NonNullable<typeof posts>[0]) => {
    setFormData({
      title: post.title,
      content: post.content,
      type: post.type as "blog" | "journal" | "thought",
      slug: post.slug,
      status: post.status as "published" | "draft",
      tagIds: post.tags?.map((t) => t.id) ?? [],
    });
    setEditingId(post.id);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDocImport = useCallback(
    async (files: FileList | null) => {
      if (!files || files.length === 0) return;
      const file = files[0];
      const ext = file.name.split(".").pop()?.toLowerCase();

      // Auto-fill title from filename if empty
      if (!formData.title) {
        const baseName = file.name.replace(/\.[^/.]+$/, "");
        setFormData((prev) => ({ ...prev, title: baseName }));
      }

      if (ext === "md" || ext === "markdown") {
        const text = await file.text();
        setFormData((prev) => ({ ...prev, content: text }));
      } else if (ext === "docx") {
        try {
          const arrayBuffer = await file.arrayBuffer();
          const mammoth = await importMammoth();
          const result = await mammoth.convertToHtml({ arrayBuffer });
          const turndownService = await importTurndown();
          const markdown = turndownService.turndown(result.value);
          setFormData((prev) => ({ ...prev, content: markdown }));
        } catch {
          alert("Word 文件解析失败");
        }
      } else {
        alert("仅支持 Markdown (.md) 和 Word (.docx) 文件");
      }
    },
    [formData.title]
  );

  const handleDocDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingDoc(false);
    handleDocImport(e.dataTransfer.files);
  };

  return (
    <div>
      {/* Post Type Filter */}
      <div className="flex flex-wrap items-center gap-2 mb-6">
        {(["all", "blog", "journal", "thought"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setPostType(t)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
              postType === t
                ? "bg-blue-500 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {t === "all"
              ? "全部"
              : t === "blog"
              ? "博文"
              : t === "journal"
              ? "日志"
              : "便签"}
          </button>
        ))}
        <Button
          onClick={() => {
            resetForm();
            setEditingId(null);
            setShowForm(!showForm);
          }}
          className="ml-auto flex items-center gap-2 px-4 py-2 bg-yellow-400 text-black text-sm font-medium rounded-xl neo-border hover:bg-yellow-500 transition-colors"
        >
          <Plus className="w-4 h-4" />
          {showForm ? "取消" : "新建文章"}
        </Button>
      </div>

      {/* Form */}
      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-2xl p-6 neo-border neo-shadow-sm mb-8 space-y-4"
        >
          <h3 className="text-lg font-bold">
            {editingId ? "编辑文章" : "新建文章"}
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              type="text"
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
              placeholder="标题"
              className="px-4 py-2 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500"
            />
            <div>
              <Input
                type="text"
                value={formData.slug}
                onChange={(e) =>
                  setFormData({ ...formData, slug: e.target.value })
                }
                placeholder="URL 标识 (slug)"
                className="px-4 py-2 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500"
              />
              <p className="mt-1.5 text-xs text-gray-400">
                用于生成文章链接，如: my-first-post。仅支持小写字母、数字和连字符
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <select
              value={formData.type}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  type: e.target.value as "blog" | "journal" | "thought",
                })
              }
              className="px-4 py-2 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 bg-white"
            >
              <option value="blog">博文</option>
              <option value="journal">日志</option>
              <option value="thought">便签</option>
            </select>
            <select
              value={formData.status}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  status: e.target.value as "published" | "draft",
                })
              }
              className="px-4 py-2 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 bg-white"
            >
              <option value="published">已发布</option>
              <option value="draft">草稿</option>
            </select>
          </div>

          {/* 标签选择 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              标签分类
            </label>
            <TagMultiSelect
              selectedTagIds={formData.tagIds}
              onChange={(ids) => setFormData({ ...formData, tagIds: ids })}
            />
          </div>

          {/* 文档导入 */}
          <div
            onDrop={handleDocDrop}
            onDragOver={(e) => {
              e.preventDefault();
              setIsDraggingDoc(true);
            }}
            onDragLeave={() => setIsDraggingDoc(false)}
            className={`border-2 border-dashed rounded-xl p-4 text-center transition-colors cursor-pointer ${
              isDraggingDoc
                ? "border-blue-500 bg-blue-50"
                : "border-gray-300 hover:border-gray-400"
            }`}
          >
            <input
              type="file"
              ref={fileInputRef}
              accept=".md,.markdown,.docx"
              onChange={(e) => handleDocImport(e.target.files)}
              className="hidden"
            />
            <label
              htmlFor="doc-import"
              className="cursor-pointer block"
              onClick={() => fileInputRef.current?.click()}
            >
              <div className="flex items-center justify-center gap-2 text-sm text-gray-600 font-medium">
                <Upload className="w-4 h-4" />
                <span>导入文档</span>
              </div>
              <p className="text-xs text-gray-400 mt-1">
                支持 Markdown (.md) 和 Word (.docx)，点击或拖拽上传
              </p>
            </label>
          </div>

          {/* 富文本编辑器 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              正文内容
            </label>
            <TiptapEditor
              value={formData.content}
              onChange={(markdown) =>
                setFormData((prev) => ({ ...prev, content: markdown }))
              }
            />
          </div>

          <div className="flex justify-end">
            <Button
              type="submit"
              disabled={createPost.isPending || updatePost.isPending}
              className="px-6 py-2 bg-blue-500 text-white font-medium rounded-xl hover:bg-blue-600 transition-colors disabled:opacity-50"
            >
              {createPost.isPending || updatePost.isPending
                ? "保存中..."
                : editingId
                ? "更新"
                : "创建"}
            </Button>
          </div>
        </form>
      )}

      {/* Posts List */}
      <div className="space-y-3">
        {posts?.map((post) => (
          <div
            key={post.id}
            className="flex items-center gap-4 bg-white rounded-xl p-4 neo-border"
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span
                  className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                    post.type === "blog"
                      ? "bg-blue-100 text-blue-700"
                      : post.type === "journal"
                      ? "bg-green-100 text-green-700"
                      : "bg-pink-100 text-pink-700"
                  }`}
                >
                  {post.type === "blog"
                    ? "博文"
                    : post.type === "journal"
                    ? "日志"
                    : "便签"}
                </span>
                <span
                  className={`px-2 py-0.5 rounded-full text-xs ${
                    post.status === "published"
                      ? "bg-green-100 text-green-700"
                      : "bg-gray-100 text-gray-600"
                  }`}
                >
                  {post.status === "published" ? "已发布" : "草稿"}
                </span>
                {post.tags && post.tags.length > 0 && (
                  <div className="flex gap-1 ml-1">
                    {post.tags.slice(0, 3).map((tag) => (
                      <span
                        key={tag.id}
                        className="inline-flex items-center h-5 px-2 rounded-full border border-black text-[10px] font-bold"
                        style={{
                          backgroundColor: `${tag.color}26`,
                          color: tag.color,
                        }}
                      >
                        {tag.name}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <h4 className="font-semibold text-gray-900 truncate">
                {post.title}
              </h4>
              <span className="text-xs text-gray-400 font-mono-type">
                {new Date(post.createdAt).toLocaleDateString("zh-CN")} · /
                {post.slug}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => startEdit(post)}
                className="p-2 text-gray-500 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
              >
                <Edit3 className="w-4 h-4" />
              </button>
              <button
                onClick={() => {
                  if (confirm("确定删除这篇文章？")) {
                    deletePost.mutate(post.id);
                  }
                }}
                className="p-2 text-gray-500 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
        {posts?.length === 0 && (
          <p className="text-center text-gray-400 py-8">暂无文章</p>
        )}
      </div>
    </div>
  );
}
