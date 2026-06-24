import { useState } from "react";
import { useNavigate } from "react-router";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/api";

function FloatingShapes() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <div className="absolute top-[10%] left-[10%] w-20 h-20 bg-yellow-300 rounded-2xl neo-border opacity-60 animate-float" />
      <div
        className="absolute top-[25%] right-[15%] w-14 h-14 bg-blue-300 rounded-full neo-border opacity-50 animate-float"
        style={{ animationDelay: "1s" }}
      />
      <div
        className="absolute bottom-[20%] left-[20%] w-16 h-16 bg-pink-300 rotate-45 neo-border opacity-50 animate-float"
        style={{ animationDelay: "2s" }}
      />
      <div
        className="absolute bottom-[15%] right-[10%] w-24 h-12 bg-green-300 rounded-full neo-border opacity-50 animate-float"
        style={{ animationDelay: "0.5s" }}
      />
      <div
        className="absolute top-[60%] left-[5%] w-8 h-8 bg-purple-300 rounded-lg neo-border opacity-40 animate-float"
        style={{ animationDelay: "1.5s" }}
      />
    </div>
  );
}

function LoginIllustration() {
  return (
    <div className="relative w-full max-w-xs mx-auto">
      <svg
        viewBox="0 0 400 320"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-auto drop-shadow-xl"
      >
        {/* 笔记本 */}
        <rect x="60" y="60" width="280" height="220" rx="16" fill="white" stroke="#1a1a1a" strokeWidth="4" />
        <line x1="100" y1="120" x2="300" y2="120" stroke="#E5E7EB" strokeWidth="4" strokeLinecap="round" />
        <line x1="100" y1="160" x2="300" y2="160" stroke="#E5E7EB" strokeWidth="4" strokeLinecap="round" />
        <line x1="100" y1="200" x2="260" y2="200" stroke="#E5E7EB" strokeWidth="4" strokeLinecap="round" />
        <line x1="100" y1="240" x2="220" y2="240" stroke="#E5E7EB" strokeWidth="4" strokeLinecap="round" />

        {/* 熊猫 */}
        <circle cx="320" cy="100" r="36" fill="white" stroke="#1a1a1a" strokeWidth="3" />
        <circle cx="300" cy="78" r="14" fill="#1a1a1a" />
        <circle cx="340" cy="78" r="14" fill="#1a1a1a" />
        <ellipse cx="312" cy="95" rx="9" ry="12" fill="#1a1a1a" transform="rotate(-10 312 95)" />
        <ellipse cx="328" cy="95" rx="9" ry="12" fill="#1a1a1a" transform="rotate(10 328 95)" />
        <circle cx="314" cy="92" r="3" fill="white" />
        <circle cx="326" cy="92" r="3" fill="white" />
        <ellipse cx="320" cy="112" rx="5" ry="3" fill="#1a1a1a" />
        <path d="M320 116 Q314 122 310 118" stroke="#1a1a1a" strokeWidth="2" strokeLinecap="round" />
        <path d="M320 116 Q326 122 330 118" stroke="#1a1a1a" strokeWidth="2" strokeLinecap="round" />

        {/* 铅笔 */}
        <rect x="115" y="215" width="100" height="16" rx="4" transform="rotate(-12 115 215)" fill="#FBBF24" stroke="#1a1a1a" strokeWidth="3" />
        <polygon points="100,225 115,218 115,232" fill="#FDE68A" stroke="#1a1a1a" strokeWidth="2" transform="rotate(-12 100 225)" />

        {/* 咖啡杯 */}
        <rect x="285" y="210" width="46" height="56" rx="6" fill="white" stroke="#1a1a1a" strokeWidth="3" />
        <path d="M331 228 C345 228 345 250 331 250" fill="none" stroke="#1a1a1a" strokeWidth="3" strokeLinecap="round" />
        <path d="M295 200 Q300 185 308 200" fill="none" stroke="#9CA3AF" strokeWidth="3" strokeLinecap="round" opacity="0.6" />
        <path d="M312 195 Q317 180 325 195" fill="none" stroke="#9CA3AF" strokeWidth="3" strokeLinecap="round" opacity="0.6" />

        {/* 星星装饰 */}
        <path d="M90 90 L94 102 L106 102 L96 110 L100 122 L90 114 L80 122 L84 110 L74 102 L86 102 Z" fill="#FBBF24" stroke="#1a1a1a" strokeWidth="2" />
        <circle cx="260" cy="85" r="6" fill="#3B82F6" stroke="#1a1a1a" strokeWidth="2" />
      </svg>
    </div>
  );
}

export default function Login() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await api.auth.login({ username, password });
      await queryClient.refetchQueries({ queryKey: ["auth", "me"], exact: true });
      navigate("/admin");
    } catch (err: any) {
      setError(err.message || "登录失败，请重试");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center bg-gradient-to-br from-blue-50 via-yellow-50 to-pink-50 overflow-hidden">
      <FloatingShapes />

      <div className="relative z-10 w-full max-w-5xl px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
          {/* 左侧插画 */}
          <div className="hidden lg:flex flex-col items-center text-center space-y-6">
            <LoginIllustration />
            <div className="space-y-2">
              <h1 className="text-3xl font-bold text-gray-900">潮汐拾光</h1>
              <p className="text-gray-600">记录生活碎片，安放每一刻温柔</p>
            </div>
          </div>

          {/* 右侧登录表单 */}
          <Card className="w-full max-w-md mx-auto neo-border neo-shadow-lg hover:neo-shadow transition-shadow duration-300">
            <CardHeader className="text-center space-y-2">
              <div className="lg:hidden w-20 h-20 mx-auto mb-2">
                <LoginIllustration />
              </div>
              <CardTitle className="text-2xl">管理员登录</CardTitle>
              <p className="text-sm text-gray-500">欢迎回到后台，开始记录今天的故事</p>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-gray-700">
                    用户名
                  </label>
                  <Input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                    placeholder="请输入管理员账号"
                    className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-0 neo-shadow-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-gray-700">
                    密码
                  </label>
                  <Input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder="请输入密码"
                    className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-0 neo-shadow-sm"
                  />
                </div>
                {error && (
                  <p className="text-sm text-red-500 bg-red-50 px-3 py-2 rounded-lg border border-red-100">
                    {error}
                  </p>
                )}
                <Button
                  type="submit"
                  className="w-full bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-xl neo-border neo-shadow-sm hover:-translate-y-0.5 transition-all duration-200"
                  size="lg"
                  disabled={loading}
                >
                  {loading ? "登录中..." : "登录后台"}
                </Button>
              </form>
              <p className="mt-5 text-center text-xs text-gray-400">
                仅管理员可登录后台，前台页面对访客公开。
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
