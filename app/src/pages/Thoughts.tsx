import { useState, useMemo } from "react";
import { Link, useNavigate } from "react-router";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import Navbar from "@/components/Navbar";
import Footer from "@/sections/Footer";
import TagFilter from "@/components/TagFilter";
import { Sparkles, Clock, Search } from "lucide-react";

export default function Thoughts() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  const { data: thoughts, isLoading } = useQuery({
    queryKey: ["posts", "list", { type: "thought", status: "published", tag: selectedTag }],
    queryFn: () => api.posts.list({ type: "thought", status: "published", tag: selectedTag ?? undefined }),
  });

  // 获取当前分类全部文章（不带标签筛选），用于计算该分类下的标签统计
  const { data: allCategoryPosts } = useQuery({
    queryKey: ["posts", "list", { type: "thought", status: "published" }],
    queryFn: () => api.posts.list({ type: "thought", status: "published" }),
  });

  const { data: allTags } = useQuery({
    queryKey: ["tags", "list"],
    queryFn: () => api.tags.list(),
  });

  // 从当前分类文章中计算标签出现次数
  const categoryTagStats = useMemo(() => {
    if (!allCategoryPosts) return {};
    const stats: Record<number, number> = {};
    allCategoryPosts.forEach((post) => {
      post.tags?.forEach((tag) => {
        stats[tag.id] = (stats[tag.id] ?? 0) + 1;
      });
    });
    return stats;
  }, [allCategoryPosts]);

  // 只保留当前分类下有文章的标签
  const visibleTags = useMemo(() => {
    if (!allTags) return [];
    return allTags.filter((tag) => (categoryTagStats[tag.id] ?? 0) > 0);
  }, [allTags, categoryTagStats]);

  const filtered = thoughts?.filter((t) => {
    if (!search) return true;
    return (
      t.title.toLowerCase().includes(search.toLowerCase()) ||
      t.content.toLowerCase().includes(search.toLowerCase())
    );
  });

  return (
    <div className="min-h-screen bg-[#F9FAFB]">
      <Navbar />
      <main className="pt-24 pb-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="text-center mb-12">
            <span className="inline-block px-4 py-1.5 bg-pink-100 text-pink-700 rounded-full text-xs font-mono-type tracking-wider mb-4">
              THOUGHTS
            </span>
            <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">
              便签
            </h1>
            <p className="text-gray-600 max-w-lg mx-auto">
              碎片化的短想法，像风中的蒲公英，飘忽不定但真实
            </p>
          </div>

          {/* Search */}
          <div className="relative max-w-md mx-auto mb-8">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="搜索便签..."
              className="w-full pl-10 pr-4 py-3 bg-white border-2 border-gray-200 rounded-xl focus:outline-none focus:border-pink-500 transition-colors"
            />
          </div>

          {/* Tags Filter */}
          <TagFilter
            tags={visibleTags}
            stats={categoryTagStats}
            selectedTag={selectedTag}
            onSelect={setSelectedTag}
          />

          {/* Thoughts Grid */}
          {isLoading ? (
            <div className="text-center py-12">
              <div className="w-8 h-8 border-2 border-pink-500 border-t-transparent rounded-full animate-spin mx-auto" />
            </div>
          ) : filtered && filtered.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {filtered.map((thought, idx) => (
                <Link
                  key={thought.id}
                  to={`/blog/${thought.slug}`}
                  className={`block rounded-2xl p-6 neo-border neo-shadow-sm note-card-hover transition-colors group ${
                    idx % 3 === 0
                      ? "bg-yellow-50"
                      : idx % 3 === 1
                        ? "bg-pink-50"
                        : "bg-blue-50"
                  }`}
                  style={{
                    transform: `rotate(${idx % 2 === 0 ? -1 : 1}deg)`,
                  }}
                >
                  <div className="flex items-center gap-2 mb-3">
                    <Sparkles className="w-4 h-4 text-pink-500" />
                    <span className="text-xs font-mono-type text-gray-400">
                      #{idx + 1}
                    </span>
                  </div>
                  {/* 标签 */}
                  {thought.tags && thought.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-3">
                      {thought.tags.slice(0, 2).map((tag) => (
                        <span
                          key={tag.id}
                          className="inline-flex items-center h-5 px-2 rounded-full border-2 border-black text-[10px] font-bold tracking-wide shadow-[2px_2px_0px_#000000] cursor-pointer"
                          style={{
                            backgroundColor: `${tag.color}26`,
                            color: tag.color,
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                            e.preventDefault();
                            navigate(`/tags?tag=${encodeURIComponent(tag.name)}`);
                          }}
                        >
                          {tag.name}
                        </span>
                      ))}
                    </div>
                  )}
                  <h3 className="text-base font-bold text-gray-900 mb-3 group-hover:text-pink-600 transition-colors line-clamp-1">
                    {thought.title}
                  </h3>
                  <p className="text-gray-600 text-sm leading-relaxed line-clamp-4">
                    {thought.content}
                  </p>
                  <div className="flex items-center gap-1 mt-4 text-xs text-gray-400 font-mono-type">
                    <Clock className="w-3 h-3" />
                    {new Date(thought.createdAt).toLocaleDateString("zh-CN")}
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <p className="text-gray-400 text-lg">暂无便签</p>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
