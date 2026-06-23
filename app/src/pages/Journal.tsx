import { useState, useEffect, useRef, useMemo } from "react";
import { Link } from "react-router";
import { useInfiniteQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import Navbar from "@/components/Navbar";
import Footer from "@/sections/Footer";
import { Calendar, BookOpen, Search, Loader2 } from "lucide-react";

const PAGE_SIZE = 10;

export default function Journal() {
  const [search, setSearch] = useState("");
  const sentinelRef = useRef<HTMLDivElement>(null);

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
  } = useInfiniteQuery({
    queryKey: ["posts", "journal", "infinite"],
    queryFn: ({ pageParam }) =>
      api.posts.list({
        type: "journal",
        status: "published",
        limit: PAGE_SIZE,
        offset: pageParam,
      }),
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
      if (lastPage.length < PAGE_SIZE) return undefined;
      return allPages.length * PAGE_SIZE;
    },
  });

  const allEntries = useMemo(() => {
    return data?.pages.flat() ?? [];
  }, [data]);

  const filteredEntries = useMemo(() => {
    if (!search) return allEntries;
    const s = search.toLowerCase();
    return allEntries.filter(
      (entry) =>
        entry.title.toLowerCase().includes(s) ||
        entry.content.toLowerCase().includes(s)
    );
  }, [allEntries, search]);

  // Group entries by month
  const grouped = useMemo(() => {
    return filteredEntries.reduce(
      (acc, entry) => {
        const date = new Date(entry.createdAt);
        const key = `${date.getFullYear()}年${date.getMonth() + 1}月`;
        if (!acc[key]) acc[key] = [];
        acc[key].push(entry);
        return acc;
      },
      {} as Record<string, typeof filteredEntries>
    );
  }, [filteredEntries]);

  // Infinite scroll with IntersectionObserver
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el || !hasNextPage || isFetchingNextPage) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          fetchNextPage();
        }
      },
      { rootMargin: "200px" }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const sortedMonths = useMemo(() => {
    return Object.keys(grouped).sort((a, b) => {
      const parse = (s: string) => {
        const m = s.match(/(\d+)年(\d+)月/);
        return m ? parseInt(m[1]) * 12 + parseInt(m[2]) : 0;
      };
      return parse(b) - parse(a);
    });
  }, [grouped]);

  return (
    <div className="min-h-screen bg-[#F9FAFB]">
      <Navbar />
      <main className="pt-24 pb-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="text-center mb-12">
            <span className="inline-block px-4 py-1.5 bg-green-100 text-green-700 rounded-full text-xs font-mono-type tracking-wider mb-4">
              JOURNAL
            </span>
            <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">
              日志
            </h1>
            <p className="text-gray-600 max-w-lg mx-auto">
              时间线形式的日常记录，琐碎但真实的生活片段
            </p>
          </div>

          {/* Search */}
          <div className="relative max-w-md mx-auto mb-12">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="搜索日志..."
              className="w-full pl-10 pr-4 py-3 bg-white border-2 border-gray-200 rounded-xl focus:outline-none focus:border-green-500 transition-colors"
            />
          </div>

          {/* Timeline */}
          {isLoading ? (
            <div className="text-center py-12">
              <div className="w-8 h-8 border-2 border-green-500 border-t-transparent rounded-full animate-spin mx-auto" />
            </div>
          ) : sortedMonths.length > 0 ? (
            <div className="relative">
              {/* Timeline line */}
              <div className="absolute left-4 sm:left-8 top-0 bottom-0 w-0.5 bg-gray-200" />

              {sortedMonths.map((month) => (
                <div key={month} className="mb-12">
                  {/* Month marker */}
                  <div className="flex items-center gap-4 mb-8">
                    <div className="relative z-10 w-8 h-8 sm:w-16 sm:h-16 bg-green-500 rounded-full flex items-center justify-center text-white neo-border">
                      <Calendar className="w-4 h-4 sm:w-6 sm:h-6" />
                    </div>
                    <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
                      {month}
                    </h2>
                  </div>

                  {/* Entries */}
                  <div className="ml-12 sm:ml-24 space-y-5">
                    {grouped[month]?.map((entry) => (
                      <Link
                        key={entry.id}
                        to={`/blog/${entry.slug}`}
                        className="block bg-white rounded-2xl p-5 sm:p-6 neo-border neo-shadow-sm hover:-translate-y-0.5 hover:shadow-md transition-all group"
                      >
                        <div className="flex items-start gap-4">
                          <div className="flex-shrink-0 w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                            <BookOpen className="w-5 h-5 text-green-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="text-lg font-bold text-gray-900 group-hover:text-green-600 transition-colors mb-2">
                              {entry.title}
                            </h3>
                            <p className="text-gray-600 text-sm line-clamp-2 leading-relaxed">
                              {entry.content.replace(/[#*_`]/g, "").slice(0, 120)}
                              {entry.content.length > 120 ? "..." : ""}
                            </p>
                            <span className="inline-block mt-2 text-xs text-gray-400 font-mono-type">
                              {new Date(entry.createdAt).toLocaleDateString(
                                "zh-CN",
                                {
                                  month: "short",
                                  day: "numeric",
                                  weekday: "short",
                                }
                              )}
                            </span>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              ))}

              {/* Sentinel for infinite scroll */}
              <div ref={sentinelRef} className="h-8" />

              {isFetchingNextPage && (
                <div className="flex items-center justify-center py-6">
                  <Loader2 className="w-6 h-6 animate-spin text-green-500" />
                </div>
              )}

              {!hasNextPage && allEntries.length > 0 && (
                <div className="text-center py-8">
                  <p className="text-gray-400 text-sm">— 已经到底啦 —</p>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-16">
              <p className="text-gray-400 text-lg">
                {search ? "没有找到匹配的日志" : "暂无日志"}
              </p>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
