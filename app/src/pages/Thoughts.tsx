import { useState } from "react";
import { Link } from "react-router";
import { trpc } from "@/providers/trpc";
import Navbar from "@/components/Navbar";
import Footer from "@/sections/Footer";
import { Sparkles, Clock, Search } from "lucide-react";

export default function Thoughts() {
  const [search, setSearch] = useState("");
  const { data: thoughts, isLoading } = trpc.post.list.useQuery({
    type: "thought",
    status: "published",
  });

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
              随想
            </h1>
            <p className="text-gray-600 max-w-lg mx-auto">
              碎片化的短想法，像风中的蒲公英，飘忽不定但真实
            </p>
          </div>

          {/* Search */}
          <div className="relative max-w-md mx-auto mb-10">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="搜索随想..."
              className="w-full pl-10 pr-4 py-3 bg-white border-2 border-gray-200 rounded-xl focus:outline-none focus:border-pink-500 transition-colors"
            />
          </div>

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
                  className={`block rounded-2xl p-6 neo-border neo-shadow-sm hover:-translate-y-1 hover:shadow-lg transition-all group ${
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
              <p className="text-gray-400 text-lg">暂无随想</p>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
