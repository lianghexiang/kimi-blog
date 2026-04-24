import type { PostUpdateInput } from "@/types/api";
import { useState } from "react";
import { Link } from "react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { api } from "@/lib/api";
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
  Shield,
} from "lucide-react";

type Tab = "posts" | "images" | "tags" | "contacts" | "users" | "roles";

export default function Admin() {
  const { user, isLoading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>("posts");
  const [postType, setPostType] = useState<"blog" | "journal" | "thought" | "all">("all");

  const isAdmin = user?.roles?.some((r) => r.name === "admin");
  // Redirect non-admin users
  if (!authLoading && (!user || !isAdmin)) {
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
              { id: "users" as Tab, label: "用户管理", icon: <Users className="w-4 h-4" /> },
              { id: "roles" as Tab, label: "角色权限", icon: <Shield className="w-4 h-4" /> },
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
          {activeTab === "users" && <UsersTab />}
          {activeTab === "roles" && <RolesTab />}
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
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    type: "blog" as "blog" | "journal" | "thought",
    slug: "",
    status: "published" as "published" | "draft",
  });

  const { data: posts } = useQuery({
    queryKey: ["posts", "list", postType === "all" ? undefined : { type: postType }],
    queryFn: () => api.posts.list(postType === "all" ? undefined : { type: postType }),
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
    mutationFn: ({ id, data }: { id: number; data: PostUpdateInput }) => api.posts.update(id, data),
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
    setFormData({ title: "", content: "", type: "blog", slug: "", status: "published" });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.content || !formData.slug) return;

    if (editingId) {
      updatePost.mutate({ id: editingId, data: formData });
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

/* ─── Images Tab ─── */
function ImagesTab() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    url: "",
    album: "",
  });

  const { data: images } = useQuery({
    queryKey: ["images", "list"],
    queryFn: () => api.images.list(),
  });

  const createImage = useMutation({
    mutationFn: api.images.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["images", "list"] });
      setShowForm(false);
      setFormData({ title: "", description: "", url: "", album: "" });
    },
  });

  const deleteImage = useMutation({
    mutationFn: api.images.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["images", "list"] });
    },
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
          <p className="text-center text-gray-400 col-span-full py-8">暂无图片</p>
        )}
      </div>
    </div>
  );
}

/* ─── Tags Tab ─── */
function TagsTab() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [color, setColor] = useState("#3B82F6");

  const { data: tags } = useQuery({
    queryKey: ["tags", "list"],
    queryFn: () => api.tags.list(),
  });

  const createTag = useMutation({
    mutationFn: api.tags.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tags", "list"] });
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
  const { data: contacts, isLoading } = useQuery({
    queryKey: ["contacts", "list"],
    queryFn: () => api.contacts.list(),
  });

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


/* ─── Users Tab ─── */
function UsersTab() {
  const queryClient = useQueryClient();
  const { data: users, isLoading } = useQuery({
    queryKey: ["users", "list"],
    queryFn: () => api.users.list(),
  });
  const createUser = useMutation({
    mutationFn: api.users.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users", "list"] });
    },
  });
  const deleteUser = useMutation({
    mutationFn: api.users.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users", "list"] });
    },
  });

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    username: "",
    password: "",
    name: "",
    email: "",
  });

  if (isLoading) {
    return (
      <div className="text-center py-8 text-gray-400">加载中...</div>
    );
  }

  return (
    <div>
      <button
        onClick={() => setShowForm(!showForm)}
        className="flex items-center gap-2 px-4 py-2 bg-yellow-400 text-black text-sm font-medium rounded-xl neo-border hover:bg-yellow-500 transition-colors mb-6"
      >
        <Plus className="w-4 h-4" />
        {showForm ? "取消" : "新建用户"}
      </button>

      {showForm && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            createUser.mutate(
              { ...form, isActive: true },
              {
                onSuccess: () => {
                  setForm({ username: "", password: "", name: "", email: "" });
                  setShowForm(false);
                },
              }
            );
          }}
          className="bg-white rounded-2xl p-6 neo-border neo-shadow-sm mb-8 space-y-4"
        >
          <h3 className="text-lg font-bold">新建用户</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <input
              type="text"
              placeholder="用户名"
              value={form.username}
              onChange={(e) => setForm({ ...form, username: e.target.value })}
              required
              className="px-4 py-2 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500"
            />
            <input
              type="password"
              placeholder="密码"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required
              className="px-4 py-2 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <input
              type="text"
              placeholder="昵称"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="px-4 py-2 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500"
            />
            <input
              type="email"
              placeholder="邮箱"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="px-4 py-2 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500"
            />
          </div>
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={createUser.isPending}
              className="px-6 py-2 bg-blue-500 text-white font-medium rounded-xl hover:bg-blue-600 transition-colors disabled:opacity-50"
            >
              {createUser.isPending ? "创建中..." : "创建"}
            </button>
          </div>
        </form>
      )}

      <div className="bg-white rounded-2xl neo-border overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200">
              {["用户名", "昵称", "邮箱", "状态", "操作"].map((h) => (
                <th
                  key={h}
                  className="text-left px-4 py-3 text-sm font-semibold text-gray-700"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {users?.map((u) => (
              <tr
                key={u.id}
                className="border-b border-gray-100 hover:bg-gray-50"
              >
                <td className="px-4 py-3 text-sm font-medium">{u.username}</td>
                <td className="px-4 py-3 text-sm text-gray-600">
                  {u.name || "-"}
                </td>
                <td className="px-4 py-3 text-sm text-gray-600">
                  {u.email || "-"}
                </td>
                <td className="px-4 py-3 text-sm">
                  {u.isActive ? (
                    <span className="text-green-600">正常</span>
                  ) : (
                    <span className="text-red-500">禁用</span>
                  )}
                </td>
                <td className="px-4 py-3 text-sm">
                  <button
                    onClick={() => {
                      if (confirm("确定删除该用户？")) {
                        deleteUser.mutate(u.id);
                      }
                    }}
                    className="p-1.5 text-gray-500 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {users?.length === 0 && (
          <p className="text-center text-gray-400 py-8">暂无用户</p>
        )}
      </div>
    </div>
  );
}

/* ─── Roles Tab ─── */
function RolesTab() {
  const { data: roles, isLoading } = useQuery({
    queryKey: ["roles", "list"],
    queryFn: () => api.roles.list(),
  });

  if (isLoading) {
    return (
      <div className="text-center py-8 text-gray-400">加载中...</div>
    );
  }

  return (
    <div className="space-y-4">
      {roles?.map((role) => (
        <div key={role.id} className="bg-white rounded-xl p-4 neo-border">
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-bold text-gray-900">{role.name}</h4>
            <span className="text-xs text-gray-400">
              {role.description || ""}
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {role.permissions.map((p) => (
              <span
                key={p.id}
                className="px-2 py-1 bg-blue-50 text-blue-600 text-xs rounded-lg"
              >
                {p.name}
              </span>
            ))}
          </div>
        </div>
      ))}
      {roles?.length === 0 && (
        <p className="text-center text-gray-400 py-8">暂无角色</p>
      )}
    </div>
  );
}
