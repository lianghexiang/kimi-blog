import { useState } from "react";
import { Link } from "react-router";
import { useAuth } from "@/hooks/useAuth";
import { trpc } from "@/providers/trpc";
import Navbar from "@/components/Navbar";
import {
  LayoutDashboard,
  FileText,
  Image as ImageIcon,
  Tag,
  Mail,
  Trash2,
  Plus,
  Edit3,
  Users,
  AlertCircle,
} from "lucide-react";

type Tab = "posts" | "images" | "tags" | "contacts";

export default function Admin() {
  const { user, isLoading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>("posts");
  const [postType, setPostType] = useState<"blog" | "journal" | "thought" | "all">("all");

  // Redirect non-admin users
  if (!authLoading && (!user || user.role !== "admin")) {
    return (
      <div className="min-h-screen bg-[#F9FAFB] flex items-center justify-center">
        <div className="text-center bg-white rounded-2xl p-8 neo-border neo-shadow max-w-md mx-4">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">访问受限</h2>
          <p className="text-gray-600 mb-6">只有管理员才能访问此页面。</p>
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors"
          >
            返回首页
          </Link>
        </div>
      </div>
    );
  }

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#F9FAFB] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F9FAFB]">
      <Navbar />
      <main className="pt-24 pb-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-3">
              <LayoutDashboard className="w-8 h-8 text-blue-500" />
              管理后台
            </h1>
            <p className="text-gray-600">
              欢迎回来，{user?.name || "管理员"}
            </p>
          </div>

          {/* Tabs */}
          <div className="flex flex-wrap gap-2 mb-8 border-b border-gray-200 pb-4">
            {[
              { id: "posts" as Tab, label: "文章管理", icon: <FileText className="w-4 h-4" /> },
              { id: "images" as Tab, label: "图片管理", icon: <ImageIcon className="w-4 h-4" /> },
              { id: "tags" as Tab, label: "标签管理", icon: <Tag className="w-4 h-4" /> },
              { id: "contacts" as Tab, label: "留言管理", icon: <Mail className="w-4 h-4" /> },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? "bg-blue-500 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          {activeTab === "posts" && (
            <PostsTab postType={postType} setPostType={setPostType} />
          )}
          {activeTab === "images" && <ImagesTab />}
          {activeTab === "tags" && <TagsTab />}
          {activeTab === "contacts" && <ContactsTab />}
        </div>
      </main>
    </div>
  );
}

/* ─── Posts Tab ─── */
function PostsTab({
  postType,
  setPostType,
}: {
  postType: "blog" | "journal" | "thought" | "all";
  setPostType: (t: "blog" | "journal" | "thought" | "all") => void;
}) {
  const utils = trpc.useUtils();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    type: "blog" as "blog" | "journal" | "thought",
    slug: "",
    status: "published" as "published" | "draft",
  });

  const { data: posts } = trpc.post.list.useQuery(
    postType === "all" ? undefined : { type: postType }
  );
  const createPost = trpc.post.create.useMutation({
    onSuccess: () => {
      utils.post.list.invalidate();
      setShowForm(false);
      resetForm();
    },
  });
  const updatePost = trpc.post.update.useMutation({
    onSuccess: () => {
      utils.post.list.invalidate();
      setShowForm(false);
      setEditingId(null);
      resetForm();
    },
  });
  const deletePost = trpc.post.delete.useMutation({
    onSuccess: () => utils.post.list.invalidate(),
  });

  const resetForm = () => {
    setFormData({ title: "", content: "", type: "blog", slug: "", status: "published" });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.content || !formData.slug) return;

    if (editingId) {
      updatePost.mutate({ id: editingId, ...formData });
    } else {
      createPost.mutate(formData);
    }
  };

  const startEdit = (post: NonNullable<typeof posts>[0]) => {
    setFormData({
      title: post.title,
      content: post.content,
      type: post.type as "blog" | "journal" | "thought",
      slug: post.slug,
      status: post.status as "published" | "draft",
    });
    setEditingId(post.id);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
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
            {t === "all" ? "全部" : t === "blog" ? "博文" : t === "journal" ? "日志" : "随想"}
          </button>
        ))}
        <button
          onClick={() => {
            resetForm();
            setEditingId(null);
            setShowForm(!showForm);
          }}
          className="ml-auto flex items-center gap-2 px-4 py-2 bg-yellow-400 text-black text-sm font-medium rounded-xl neo-border hover:bg-yellow-500 transition-colors"
        >
          <Plus className="w-4 h-4" />
          {showForm ? "取消" : "新建文章"}
        </button>
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
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="标题"
              className="px-4 py-2 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500"
            />
            <input
              type="text"
              value={formData.slug}
              onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
              placeholder="URL 标识 (slug)"
              className="px-4 py-2 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <select
              value={formData.type}
              onChange={(e) =>
                setFormData({ ...formData, type: e.target.value as "blog" | "journal" | "thought" })
              }
              className="px-4 py-2 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500"
            >
              <option value="blog">博文</option>
              <option value="journal">日志</option>
              <option value="thought">随想</option>
            </select>
            <select
              value={formData.status}
              onChange={(e) =>
                setFormData({ ...formData, status: e.target.value as "published" | "draft" })
              }
              className="px-4 py-2 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500"
            >
              <option value="published">已发布</option>
              <option value="draft">草稿</option>
            </select>
          </div>
          <textarea
            value={formData.content}
            onChange={(e) => setFormData({ ...formData, content: e.target.value })}
            placeholder="正文内容 (支持 Markdown)"
            rows={8}
            className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 resize-y"
          />
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={createPost.isPending || updatePost.isPending}
              className="px-6 py-2 bg-blue-500 text-white font-medium rounded-xl hover:bg-blue-600 transition-colors disabled:opacity-50"
            >
              {createPost.isPending || updatePost.isPending
                ? "保存中..."
                : editingId
                ? "更新"
                : "创建"}
            </button>
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
                  {post.type === "blog" ? "博文" : post.type === "journal" ? "日志" : "随想"}
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
              </div>
              <h4 className="font-semibold text-gray-900 truncate">{post.title}</h4>
              <span className="text-xs text-gray-400 font-mono-type">
                {new Date(post.createdAt).toLocaleDateString("zh-CN")} · /{post.slug}
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
                    deletePost.mutate({ id: post.id });
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

/* ─── Images Tab ─── */
function ImagesTab() {
  const utils = trpc.useUtils();
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    url: "",
    album: "",
  });

  const { data: images } = trpc.image.list.useQuery();
  const createImage = trpc.image.create.useMutation({
    onSuccess: () => {
      utils.image.list.invalidate();
      setShowForm(false);
      setFormData({ title: "", description: "", url: "", album: "" });
    },
  });
  const deleteImage = trpc.image.delete.useMutation({
    onSuccess: () => utils.image.list.invalidate(),
  });

  return (
    <div>
      <button
        onClick={() => setShowForm(!showForm)}
        className="flex items-center gap-2 px-4 py-2 bg-yellow-400 text-black text-sm font-medium rounded-xl neo-border hover:bg-yellow-500 transition-colors mb-6"
      >
        <Plus className="w-4 h-4" />
        {showForm ? "取消" : "添加图片"}
      </button>

      {showForm && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!formData.title || !formData.url) return;
            createImage.mutate(formData);
          }}
          className="bg-white rounded-2xl p-6 neo-border neo-shadow-sm mb-8 space-y-4"
        >
          <h3 className="text-lg font-bold">添加图片</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="图片标题"
              className="px-4 py-2 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500"
            />
            <input
              type="text"
              value={formData.album}
              onChange={(e) => setFormData({ ...formData, album: e.target.value })}
              placeholder="相册分类"
              className="px-4 py-2 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500"
            />
          </div>
          <input
            type="text"
            value={formData.url}
            onChange={(e) => setFormData({ ...formData, url: e.target.value })}
            placeholder="图片 URL"
            className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500"
          />
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="图片描述"
            rows={3}
            className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 resize-y"
          />
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={createImage.isPending}
              className="px-6 py-2 bg-blue-500 text-white font-medium rounded-xl hover:bg-blue-600 transition-colors disabled:opacity-50"
            >
              {createImage.isPending ? "添加中..." : "添加"}
            </button>
          </div>
        </form>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {images?.map((img) => (
          <div key={img.id} className="bg-white rounded-xl neo-border overflow-hidden">
            <div className="aspect-video bg-gray-100">
              <img src={img.url} alt={img.title} className="w-full h-full object-cover" />
            </div>
            <div className="p-3 flex items-center justify-between">
              <div className="min-w-0">
                <h4 className="font-semibold text-sm truncate">{img.title}</h4>
                {img.album && (
                  <span className="text-xs text-gray-400">{img.album}</span>
                )}
              </div>
              <button
                onClick={() => {
                  if (confirm("确定删除这张图片？")) {
                    deleteImage.mutate({ id: img.id });
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
          <p className="text-center text-gray-400 col-span-full py-8">暂无图片</p>
        )}
      </div>
    </div>
  );
}

/* ─── Tags Tab ─── */
function TagsTab() {
  const utils = trpc.useUtils();
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [color, setColor] = useState("#3B82F6");

  const { data: tags } = trpc.tag.list.useQuery();
  const createTag = trpc.tag.create.useMutation({
    onSuccess: () => {
      utils.tag.list.invalidate();
      setShowForm(false);
      setName("");
      setColor("#3B82F6");
    },
  });

  return (
    <div>
      <button
        onClick={() => setShowForm(!showForm)}
        className="flex items-center gap-2 px-4 py-2 bg-yellow-400 text-black text-sm font-medium rounded-xl neo-border hover:bg-yellow-500 transition-colors mb-6"
      >
        <Plus className="w-4 h-4" />
        {showForm ? "取消" : "新建标签"}
      </button>

      {showForm && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!name) return;
            createTag.mutate({ name, color });
          }}
          className="bg-white rounded-2xl p-6 neo-border neo-shadow-sm mb-8 space-y-4"
        >
          <h3 className="text-lg font-bold">新建标签</h3>
          <div className="flex gap-4">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="标签名称"
              className="flex-1 px-4 py-2 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500"
            />
            <input
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              className="w-14 h-10 rounded-xl border-2 border-gray-200 cursor-pointer"
            />
          </div>
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={createTag.isPending}
              className="px-6 py-2 bg-blue-500 text-white font-medium rounded-xl hover:bg-blue-600 transition-colors disabled:opacity-50"
            >
              {createTag.isPending ? "创建中..." : "创建"}
            </button>
          </div>
        </form>
      )}

      <div className="flex flex-wrap gap-3">
        {tags?.map((tag) => (
          <div
            key={tag.id}
            className="flex items-center gap-3 bg-white rounded-xl px-4 py-3 neo-border"
          >
            <span
              className="w-4 h-4 rounded-full"
              style={{ backgroundColor: tag.color }}
            />
            <span className="font-medium">{tag.name}</span>
          </div>
        ))}
        {tags?.length === 0 && (
          <p className="text-center text-gray-400 py-8">暂无标签</p>
        )}
      </div>
    </div>
  );
}

/* ─── Contacts Tab ─── */
function ContactsTab() {
  const { data: contacts, isLoading } = trpc.contact.list.useQuery();

  return (
    <div>
      <div className="bg-white rounded-2xl neo-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left px-4 py-3 text-sm font-semibold text-gray-700">
                  <div className="flex items-center gap-1">
                    <Users className="w-4 h-4" />
                    姓名
                  </div>
                </th>
                <th className="text-left px-4 py-3 text-sm font-semibold text-gray-700">邮箱</th>
                <th className="text-left px-4 py-3 text-sm font-semibold text-gray-700">留言</th>
                <th className="text-left px-4 py-3 text-sm font-semibold text-gray-700">时间</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={4} className="text-center py-8">
                    <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" />
                  </td>
                </tr>
              ) : contacts && contacts.length > 0 ? (
                contacts.map((contact) => (
                  <tr key={contact.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-medium">{contact.name}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{contact.email}</td>
                    <td className="px-4 py-3 text-sm text-gray-600 max-w-xs truncate">
                      {contact.message}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-400 font-mono-type">
                      {new Date(contact.createdAt).toLocaleDateString("zh-CN")}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="text-center py-8 text-gray-400">
                    暂无留言
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
