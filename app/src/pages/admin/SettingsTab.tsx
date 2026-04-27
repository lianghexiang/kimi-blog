import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Save, Loader2, Settings } from "lucide-react";

const CONFIG_KEYS = [
  { key: "hero_badge_text", label: "标签文字", placeholder: "欢迎来到我的小世界" },
  { key: "hero_title_prefix", label: "主标题前缀", placeholder: "Hey!" },
  { key: "hero_title_suffix", label: "主标题后缀", placeholder: "你好呀" },
  { key: "hero_subtitle", label: "副标题", placeholder: "副标题内容..." },
  { key: "hero_button_text", label: "按钮文字", placeholder: "开始逛逛" },
  { key: "hero_avatar_url", label: "头像图片 URL", placeholder: "/avatar-girl.png" },
  { key: "hero_bg_image_url", label: "背景图片 URL", placeholder: "留空则使用默认背景色" },
];

export default function SettingsTab() {
  const queryClient = useQueryClient();
  const { data: configs, isLoading } = useQuery({
    queryKey: ["site-configs"],
    queryFn: api.siteConfigs.list,
  });

  const [values, setValues] = useState<Record<string, string>>({});

  useEffect(() => {
    if (configs) {
      const map: Record<string, string> = {};
      for (const c of configs) {
        map[c.key] = c.value ?? "";
      }
      for (const item of CONFIG_KEYS) {
        if (!(item.key in map)) {
          map[item.key] = "";
        }
      }
      setValues(map);
    }
  }, [configs]);

  const mutation = useMutation({
    mutationFn: api.siteConfigs.update,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["site-configs"] });
    },
  });

  const handleSave = () => {
    const payload: Record<string, string | null> = {};
    for (const item of CONFIG_KEYS) {
      const v = values[item.key]?.trim();
      payload[item.key] = v || null;
    }
    mutation.mutate(payload);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <Settings className="w-5 h-5 text-blue-500" />
          站点配置
        </h2>
        <button
          onClick={handleSave}
          disabled={mutation.isPending}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-xl neo-border hover:bg-blue-600 transition-colors disabled:opacity-50"
        >
          {mutation.isPending ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          保存配置
        </button>
      </div>

      {mutation.isSuccess && (
        <div className="bg-green-50 text-green-700 px-4 py-2 rounded-lg text-sm">
          配置已保存
        </div>
      )}

      <div className="bg-white rounded-2xl p-6 neo-border neo-shadow space-y-4">
        {CONFIG_KEYS.map((item) => (
          <div key={item.key}>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {item.label}
            </label>
            {item.key === "hero_subtitle" ? (
              <textarea
                value={values[item.key] ?? ""}
                onChange={(e) =>
                  setValues((prev) => ({ ...prev, [item.key]: e.target.value }))
                }
                placeholder={item.placeholder}
                rows={3}
                className="w-full px-3 py-2 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none transition-colors resize-none"
              />
            ) : (
              <input
                type="text"
                value={values[item.key] ?? ""}
                onChange={(e) =>
                  setValues((prev) => ({ ...prev, [item.key]: e.target.value }))
                }
                placeholder={item.placeholder}
                className="w-full px-3 py-2 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none transition-colors"
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
