import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Plus, Pencil, Trash2, Check, X, Tag, TrendingUp, Hash } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatDate } from "@/lib/utils";

const CANDIDATE_COLORS = [
  "#F59E0B", "#3B82F6", "#EC4899", "#10B981",
  "#8B5CF6", "#EF4444", "#6366F1", "#14B8A6",
];

interface TagStats {
  total: number;
  mostUsed: { name: string; count: number } | null;
  thisMonth: number;
}

export default function TagsTab() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [newName, setNewName] = useState("");
  const [newColor, setNewColor] = useState("#3B82F6");

  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState("");
  const [editColor, setEditColor] = useState("");

  const { data: tags } = useQuery({
    queryKey: ["tags", "list"],
    queryFn: () => api.tags.list(),
  });

  const { data: stats } = useQuery({
    queryKey: ["tags", "stats"],
    queryFn: () => api.tags.stats(),
  });

  const tagStats: TagStats = useMemo(() => {
    if (!tags) return { total: 0, mostUsed: null, thisMonth: 0 };

    const total = tags.length;

    let mostUsed: { name: string; count: number } | null = null;
    if (stats) {
      let maxCount = 0;
      for (const tag of tags) {
        const count = stats[tag.id] ?? 0;
        if (count > maxCount) {
          maxCount = count;
          mostUsed = { name: tag.name, count };
        }
      }
    }

    const now = new Date();
    const thisMonth = tags.filter((t) => {
      if (!t.createdAt) return false;
      const d = new Date(t.createdAt);
      if (isNaN(d.getTime())) return false;
      return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
    }).length;

    return { total, mostUsed, thisMonth };
  }, [tags, stats]);

  const createTag = useMutation({
    mutationFn: api.tags.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tags"] });
      setShowForm(false);
      setNewName("");
      setNewColor("#3B82F6");
    },
    onError: (err: any) => alert(err.message || "创建失败"),
  });

  const updateTag = useMutation({
    mutationFn: ({ id, data }: { id: number; data: { name: string; color: string } }) =>
      api.tags.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tags"] });
      setEditingId(null);
    },
    onError: (err: any) => alert(err.message || "更新失败"),
  });

  const deleteTag = useMutation({
    mutationFn: api.tags.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tags"] });
    },
    onError: (err: any) => alert(err.message || "删除失败"),
  });

  const startEdit = (tag: { id: number; name: string; color: string }) => {
    setEditingId(tag.id);
    setEditName(tag.name);
    setEditColor(tag.color);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditName("");
    setEditColor("");
  };

  const saveEdit = (id: number) => {
    if (!editName.trim()) return;
    updateTag.mutate({ id, data: { name: editName.trim(), color: editColor } });
  };

  const statCards = [
    {
      label: "总标签数",
      value: tagStats.total,
      icon: <Hash className="w-5 h-5" />,
      stripColor: "bg-yellow-400",
    },
    {
      label: "使用最多",
      value: tagStats.mostUsed ? `${tagStats.mostUsed.name} (${tagStats.mostUsed.count})` : "—",
      icon: <Tag className="w-5 h-5" />,
      stripColor: "bg-blue-400",
    },
    {
      label: "本月新增",
      value: tagStats.thisMonth,
      icon: <TrendingUp className="w-5 h-5" />,
      stripColor: "bg-pink-400",
    },
  ];

  return (
    <div>
      {/* 统计卡片 */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        {statCards.map((card) => (
          <div
            key={card.label}
            className="relative bg-white rounded-2xl p-5 neo-border neo-shadow overflow-hidden"
          >
            {/* 贴纸条 */}
            <div
              className={`absolute -top-1 -left-2 w-20 h-6 ${card.stripColor} border-2 border-black flex items-center justify-center text-[10px] font-bold text-black`}
              style={{ transform: "rotate(-2deg)" }}
            >
              {card.label}
            </div>
            <div className="pt-4 flex items-center gap-3">
              <div className="p-2 bg-gray-100 rounded-xl border-2 border-black">
                {card.icon}
              </div>
              <div className="text-2xl font-bold text-gray-900">{card.value}</div>
            </div>
          </div>
        ))}
      </div>

      {/* 新建按钮 */}
      <Button
        onClick={() => setShowForm(!showForm)}
        className="flex items-center gap-2 px-4 py-2 bg-yellow-400 text-black text-sm font-medium rounded-xl neo-border hover:bg-yellow-500 transition-colors mb-6"
      >
        <Plus className="w-4 h-4" />
        {showForm ? "取消" : "新建标签"}
      </Button>

      {/* 新建表单 */}
      {showForm && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!newName.trim()) return;
            createTag.mutate({ name: newName.trim(), color: newColor });
          }}
          className="bg-white rounded-2xl p-6 neo-border neo-shadow-sm mb-8 space-y-4"
        >
          <h3 className="text-lg font-bold">新建标签</h3>
          <Input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="输入标签名称..."
            className="w-full px-4 py-2 border-2 border-black rounded-xl focus:outline-none focus:border-blue-500"
          />
          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">选择颜色</p>
            <div className="flex flex-wrap gap-2">
              {CANDIDATE_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setNewColor(c)}
                  className={`w-9 h-9 rounded-full border-2 transition-transform hover:scale-110 flex items-center justify-center ${
                    newColor === c ? "border-black" : "border-gray-300"
                  }`}
                  style={{ backgroundColor: c }}
                >
                  {newColor === c && <Check className="w-4 h-4 text-white drop-shadow" />}
                </button>
              ))}
              {/* 自定义颜色 */}
              <label className="relative w-9 h-9 rounded-full border-2 border-gray-300 cursor-pointer hover:border-black transition-colors flex items-center justify-center bg-gray-50">
                <Plus className="w-4 h-4 text-gray-500" />
                <input
                  type="color"
                  value={newColor}
                  onChange={(e) => setNewColor(e.target.value)}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
              </label>
            </div>
          </div>
          <div className="flex justify-end">
            <Button
              type="submit"
              disabled={createTag.isPending || !newName.trim()}
              className="px-6 py-2 bg-blue-500 text-white font-medium rounded-xl border-2 border-black hover:bg-yellow-400 hover:text-black transition-colors disabled:opacity-50"
            >
              {createTag.isPending ? "创建中..." : "创建标签"}
            </Button>
          </div>
        </form>
      )}

      {/* 标签表格 */}
      <div className="space-y-2">
        {tags?.map((tag) => {
          const count = stats?.[tag.id] ?? 0;
          const isEditing = editingId === tag.id;

          return (
            <div
              key={tag.id}
              className="bg-white rounded-xl p-3 neo-border hover:bg-gray-50 transition-all hover:-translate-y-px"
            >
              {isEditing ? (
                <div className="flex items-center gap-3">
                  <div
                    className="w-6 h-6 rounded-full border-2 border-black shrink-0"
                    style={{ backgroundColor: editColor }}
                  />
                  <Input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="flex-1 px-3 py-1.5 border-2 border-black rounded-lg text-sm"
                  />
                  <div className="flex flex-wrap gap-1.5 max-w-[200px]">
                    {CANDIDATE_COLORS.map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setEditColor(c)}
                        className={`w-5 h-5 rounded-full border ${
                          editColor === c ? "border-black" : "border-gray-300"
                        }`}
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={() => saveEdit(tag.id)}
                    className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={cancelEdit}
                    className="p-1.5 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  {/* 颜色 */}
                  <div
                    className="w-6 h-6 rounded-full border-2 border-black shrink-0"
                    style={{ backgroundColor: tag.color }}
                  />
                  {/* 名称 */}
                  <span className="flex-1 font-bold text-sm">{tag.name}</span>
                  {/* 文章数 */}
                  <div className="flex items-center gap-1.5 text-sm text-gray-500">
                    <span className="font-bold text-gray-900">{count}</span>
                    <span className="w-1.5 h-1.5 rounded-full bg-gray-300" />
                    <span className="text-xs">篇</span>
                  </div>
                  {/* 创建时间 */}
                  <span className="hidden sm:inline text-xs text-gray-400 w-24 text-right">
                    {formatDate(tag.createdAt)}
                  </span>
                  {/* 操作 */}
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => startEdit(tag)}
                      className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="编辑"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const msg = count > 0
                          ? `删除后 ${count} 篇文章将移除此标签，确定删除「${tag.name}」？`
                          : `确定删除标签「${tag.name}」？`;
                        if (confirm(msg)) {
                          deleteTag.mutate(tag.id);
                        }
                      }}
                      className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="删除"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
        {(!tags || tags.length === 0) && (
          <p className="text-center text-gray-400 py-8">暂无标签</p>
        )}
      </div>
    </div>
  );
}
