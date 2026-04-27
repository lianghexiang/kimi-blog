import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router";
import { useAuth } from "@/hooks/useAuth";
import Navbar from "@/components/Navbar";
import {
  LayoutDashboard,
  FileText,
  Image as ImageIcon,
  Tag,
  Mail,
  AlertCircle,
  Users,
  Shield,
  Key,
  Settings,
} from "lucide-react";
import PostsTab from "./PostsTab";
import ImagesTab from "./ImagesTab";
import TagsTab from "./TagsTab";
import ContactsTab from "./ContactsTab";
import UsersTab from "./UsersTab";
import RolesTab from "./RolesTab";
import PermissionsTab from "./PermissionsTab";
import SettingsTab from "./SettingsTab";

type Tab =
  | "posts"
  | "images"
  | "tags"
  | "contacts"
  | "users"
  | "roles"
  | "permissions"
  | "settings";

const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: "posts", label: "文章管理", icon: <FileText className="w-4 h-4" /> },
  { id: "images", label: "图片管理", icon: <ImageIcon className="w-4 h-4" /> },
  { id: "tags", label: "标签管理", icon: <Tag className="w-4 h-4" /> },
  { id: "users", label: "用户管理", icon: <Users className="w-4 h-4" /> },
  { id: "roles", label: "角色管理", icon: <Shield className="w-4 h-4" /> },
  { id: "permissions", label: "权限管理", icon: <Key className="w-4 h-4" /> },
  { id: "contacts", label: "留言管理", icon: <Mail className="w-4 h-4" /> },
  { id: "settings", label: "站点配置", icon: <Settings className="w-4 h-4" /> },
];

export default function Admin() {
  const navigate = useNavigate();
  const { user, isLoading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>("posts");

  const isAdmin = user?.roles?.some((r) => r.name === "admin");

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/login", { replace: true });
    }
  }, [authLoading, navigate, user]);

  if (!authLoading && !user) {
    return null;
  }

  if (!authLoading && user && !isAdmin) {
    return (
      <div className="min-h-screen bg-[#F9FAFB]">
        <Navbar />
        <main className="min-h-screen pt-24 pb-16 flex items-center justify-center">
          <div className="text-center bg-white rounded-2xl p-8 neo-border neo-shadow max-w-md mx-4">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-900 mb-2">无权访问后台</h2>
            <p className="text-gray-600 mb-2">
              当前账号已登录，但没有后台管理权限。
            </p>
            <p className="text-gray-500 text-sm mb-6">
              如果这是你的站点账号，请确认它已分配管理员角色。
            </p>
            <div className="flex items-center justify-center gap-3">
              <Link
                to="/"
                className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors"
              >
                返回首页
              </Link>
              <Link
                to="/login"
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors"
              >
                切换账号
              </Link>
            </div>
          </div>
        </main>
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
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-3">
              <LayoutDashboard className="w-8 h-8 text-blue-500" />
              管理后台
            </h1>
            <p className="text-gray-600">
              欢迎回来，{user?.name || "管理员"}
            </p>
          </div>

          <div className="flex flex-wrap gap-2 mb-8 border-b border-gray-200 pb-4">
            {TABS.map((tab) => (
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

          {activeTab === "posts" && <PostsTab />}
          {activeTab === "images" && <ImagesTab />}
          {activeTab === "tags" && <TagsTab />}
          {activeTab === "contacts" && <ContactsTab />}
          {activeTab === "users" && <UsersTab />}
          {activeTab === "roles" && <RolesTab />}
          {activeTab === "permissions" && <PermissionsTab />}
          {activeTab === "settings" && <SettingsTab />}
        </div>
      </main>
    </div>
  );
}
