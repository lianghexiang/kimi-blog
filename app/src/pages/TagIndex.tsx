import { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import Navbar from "@/components/Navbar";
import Footer from "@/sections/Footer";
import TagBadge from "@/components/TagBadge";
import { Calendar, Clock, FileText } from "lucide-react";

export default function TagIndex() {
  const [searchParams] = useSearchParams();
  const [activeTag, setActiveTag] = useState<string | null>(
    searchParams.get("tag")
  );

  useEffect(() => {
    const tagFromUrl = searchParams.get("tag");
    if (tagFromUrl !== activeTag) {
      setActiveTag(tagFromUrl);
    }
  }, [searchParams]);

  const { data: tags } = useQuery({
    queryKey: ["tags", "list"],
    queryFn: () => api.tags.list(),
  });

  const { data: stats } = useQuery({
    queryKey: ["tags", "stats"],
    queryFn: () => api.tags.stats(),
  });

  const { data: posts, isLoading: postsLoading } = useQuery({
    queryKey: ["posts", "by-tag", activeTag],
    queryFn: () =>
      activeTag
        ? api.posts.list({ status: "published", tag: activeTag })
        : Promise.resolve([]),
    enabled: !!activeTag,
  });

  const maxCount = Math.max(...(tags?.map((t) => stats?.[t.id] ?? 0) ?? [0]));

  return (
    <div className="min-h-screen bg-[#F9FAFB]">
      <Navbar />
      <main className="pt-24 pb-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Hero */}
          <div className="relative bg-[#FEF9C3] rounded-3xl neo-border neo-shadow p-8 sm:p-12 mb-12 overflow-hidden">
            <div className="relative z-10 text-center">
              <h1
                className="text-4xl sm:text-5xl font-bold text-gray-900 mb-3"
                style={{ fontFamily: "Caveat, cursive", transform: "rotate(-2deg)" }}
              >
                标签索引
              </h1>
              <p className="text-gray-600 text-lg">
                按主题探索所有内容
              </p>
            </div>
            {/* 装饰标签 */}
            <div
              className="absolute -right-4 -bottom-4 w-24 h-24 rounded-full opacity-20 border-4 border-black"
              style={{ backgroundColor: "#F59E0B" }}
            />
          </div>

          {/* 标签云 */}
          <div className="flex flex-wrap justify-center gap-3 mb-12">
            {tags?.map((tag) => {
              const count = stats?.[tag.id] ?? 0;
              const scale = maxCount > 0 ? 0.85 + (count / maxCount) * 0.35 : 1;
              return (
                <TagBadge
                  key={tag.id}
                  name={tag.name}
                  color={tag.color}
                  count={count}
                  variant="cloud"
                  state={activeTag === tag.name ? "active" : count === 0 ? "disabled" : "inactive"}
                  onClick={() =>
                    setActiveTag(activeTag === tag.name ? null : tag.name)
                  }
                  className="transition-transform"
                  style={{ fontSize: `${scale}rem`, padding: `${scale * 0.375}rem ${scale * 1}rem` }}
                />
              );
            })}
            {(!tags || tags.length === 0) && (
              <p className="text-gray-400 py-8">暂无标签</p>
            )}
          </div>

          {/* 文章列表 */}
          {activeTag && (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="flex items-center gap-2 mb-6">
                <FileText className="w-5 h-5 text-gray-400" />
                <h2 className="text-xl font-bold text-gray-900">
                  「{activeTag}」标签下的 {posts?.length ?? 0} 篇文章
                </h2>
              </div>

              {postsLoading ? (
                <div className="text-center py-12">
                  <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" />
                </div>
              ) : posts && posts.length > 0 ? (
                <div className="space-y-4">
                  {posts.map((post) => (
                    <Link
                      key={post.id}
                      to={`/blog/${post.slug}`}
                      className="block bg-white rounded-2xl p-5 sm:p-6 neo-border neo-shadow-sm hover:-translate-y-0.5 hover:shadow-md transition-all group"
                    >
                      <div className="flex items-start gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500 text-white border border-black">
                              {post.type === "blog"
                                ? "博文"
                                : post.type === "journal"
                                  ? "日志"
                                  : "便签"}
                            </span>
                          </div>
                          <h3 className="text-lg font-bold text-gray-900 group-hover:text-blue-600 transition-colors mb-2 truncate">
                            {post.title}
                          </h3>
                          <p className="text-gray-600 text-sm line-clamp-2 leading-relaxed">
                            {post.content.replace(/[#*_`]/g, "").slice(0, 150)}...
                          </p>
                          <div className="flex items-center gap-4 mt-3 text-xs text-gray-400 font-mono-type">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3.5 h-3.5" />
                              {new Date(post.createdAt).toLocaleDateString("zh-CN")}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5" />
                              {Math.ceil(post.content.length / 300)} 分钟阅读
                            </span>
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="bg-yellow-50 rounded-2xl p-8 neo-border text-center">
                  <p className="text-gray-600">
                    这个标签下还没有内容哦～
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
