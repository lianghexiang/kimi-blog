import { useState } from "react";
import { Link } from "react-router";
import { trpc } from "@/providers/trpc";
import Navbar from "@/components/Navbar";
import Footer from "@/sections/Footer";
import { Calendar, Clock, Tag, Search } from "lucide-react";

export default function Blog() {
  const [search, setSearch] = useState("");
  const { data: posts, isLoading } = trpc.post.list.useQuery({
    type: "blog",
    status: "published",
  });
  const { data: allTags } = trpc.tag.list.useQuery();
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  const filteredPosts = posts?.filter((post) => {
    const matchesSearch =
      !search ||
      post.title.toLowerCase().includes(search.toLowerCase()) ||
      post.content.toLowerCase().includes(search.toLowerCase());
    return matchesSearch;
  });

  return (
    <div className="min-h-screen bg-[#F9FAFB]">
      <Navbar />
      <main className="pt-24 pb-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="text-center mb-12">
            <span className="inline-block px-4 py-1.5 bg-blue-100 text-blue-700 rounded-full text-xs font-mono-type tracking-wider mb-4">
              BLOG
            </span>
            <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">
              博文
            </h1>
            <p className="text-gray-600 max-w-lg mx-auto">
              深度思考与创作，关于生活、阅读与成长的文字记录
            </p>
          </div>

          {/* Search */}
          <div className="relative max-w-md mx-auto mb-10">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="搜索文章..."
              className="w-full pl-10 pr-4 py-3 bg-white border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 transition-colors"
            />
          </div>

          {/* Tags */}
          {allTags && allTags.length > 0 && (
            <div className="flex flex-wrap justify-center gap-2 mb-10">
              <button
                onClick={() => setSelectedTag(null)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  !selectedTag
                    ? "bg-blue-500 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                全部
              </button>
              {allTags.map((tag) => (
                <button
                  key={tag.id}
                  onClick={() => setSelectedTag(tag.name)}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                    selectedTag === tag.name
                      ? "text-white"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                  style={
                    selectedTag === tag.name
                      ? { backgroundColor: tag.color }
                      : {}
                  }
                >
                  {tag.name}
                </button>
              ))}
            </div>
          )}

          {/* Posts */}
          {isLoading ? (
            <div className="text-center py-12">
              <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" />
            </div>
          ) : filteredPosts && filteredPosts.length > 0 ? (
            <div className="space-y-6">
              {filteredPosts.map((post) => (
                <Link
                  key={post.id}
                  to={`/blog/${post.slug}`}
                  className="block bg-white rounded-2xl p-6 sm:p-8 neo-border neo-shadow-sm hover:-translate-y-1 hover:shadow-lg transition-all group"
                >
                  <div className="flex flex-col sm:flex-row gap-6">
                    {post.coverImage && (
                      <div className="sm:w-48 flex-shrink-0">
                        <img
                          src={post.coverImage}
                          alt={post.title}
                          className="w-full h-32 sm:h-36 object-cover rounded-xl"
                        />
                      </div>
                    )}
                    <div className="flex-1 space-y-3">
                      <h2 className="text-xl sm:text-2xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                        {post.title}
                      </h2>
                      <p className="text-gray-600 text-sm line-clamp-2 leading-relaxed">
                        {post.content.replace(/[#*_`]/g, "").slice(0, 150)}...
                      </p>
                      <div className="flex items-center gap-4 text-xs text-gray-400 font-mono-type">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" />
                          {new Date(post.createdAt).toLocaleDateString("zh-CN")}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          {Math.ceil(post.content.length / 300)} 分钟阅读
                        </span>
                        <span className="flex items-center gap-1">
                          <Tag className="w-3.5 h-3.5" />
                          博文
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <p className="text-gray-400 text-lg">暂无文章</p>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
