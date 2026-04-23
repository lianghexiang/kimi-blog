import { useState } from "react";
import { Link } from "react-router";
import { trpc } from "@/providers/trpc";
import { Mail, Instagram, Twitter, Send, Heart } from "lucide-react";

export default function Footer() {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const submitContact = trpc.contact.submit.useMutation({
    onSuccess: () => {
      setSubmitted(true);
      setEmail("");
      setName("");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !name) return;
    submitContact.mutate({
      name,
      email,
      message: `Newsletter subscription from ${name} (${email})`,
    });
  };

  return (
    <footer className="bg-gray-900 text-white py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Big Banner */}
        <div className="mb-12 overflow-hidden">
          <h2
            className="font-handwrite text-5xl sm:text-7xl text-yellow-400 text-center"
            style={{ transform: "rotate(-3deg)" }}
          >
            Stay Connected!
          </h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Newsletter */}
          <div className="space-y-6">
            <h3 className="text-xl font-semibold">订阅我的 newsletter</h3>
            <p className="text-gray-400 text-sm">
              不定期分享生活碎片、读书笔记和创作灵感。没有垃圾邮件，只有真诚的分享。
            </p>

            {submitted ? (
              <div className="bg-green-900/30 border border-green-700 rounded-xl p-4 text-green-400 text-sm">
                感谢订阅！我会定期给你发送精彩内容。
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-3">
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="你的名字..."
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-yellow-400 transition-colors"
                />
                <div className="flex gap-2">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="留下你的邮箱..."
                    className="flex-1 px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-yellow-400 transition-colors"
                  />
                  <button
                    type="submit"
                    disabled={submitContact.isPending}
                    className="px-5 py-3 bg-yellow-400 text-black font-semibold rounded-xl hover:bg-yellow-500 transition-colors disabled:opacity-50 flex items-center gap-2"
                  >
                    <Send className="w-4 h-4" />
                    发送
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Links & Info */}
          <div className="space-y-6">
            <h3 className="text-xl font-semibold">链接</h3>
            <div className="flex flex-wrap gap-3">
              {[
                { icon: <Twitter className="w-4 h-4" />, label: "Weibo" },
                { icon: <Instagram className="w-4 h-4" />, label: "Instagram" },
                { icon: <Mail className="w-4 h-4" />, label: "Email" },
              ].map((social) => (
                <button
                  key={social.label}
                  onClick={() => alert("Coming soon!")}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-800 rounded-full hover:bg-gray-700 transition-colors text-sm"
                >
                  {social.icon}
                  {social.label}
                </button>
              ))}
            </div>

            <div className="pt-4 border-t border-gray-800">
              <div className="flex flex-wrap gap-4 text-sm text-gray-400">
                <Link to="/" className="hover:text-yellow-400 transition-colors">
                  首页
                </Link>
                <Link to="/blog" className="hover:text-yellow-400 transition-colors">
                  博文
                </Link>
                <Link to="/journal" className="hover:text-yellow-400 transition-colors">
                  日志
                </Link>
                <Link to="/thoughts" className="hover:text-yellow-400 transition-colors">
                  随想
                </Link>
                <Link to="/gallery" className="hover:text-yellow-400 transition-colors">
                  画廊
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div className="mt-12 pt-6 border-t border-gray-800 text-center text-sm text-gray-500">
          <p className="flex items-center justify-center gap-1">
            Made with <Heart className="w-4 h-4 text-red-500 fill-red-500" /> by 小桃 · 潮汐拾光 · 2024
          </p>
        </div>
      </div>
    </footer>
  );
}
