import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Save, Loader2, Settings } from "lucide-react";

interface ConfigField {
  key: string;
  label: string;
  placeholder: string;
  type: "text" | "textarea" | "color";
  colorKey?: string;
  colorLabel?: string;
}

const CONFIG_FIELDS: ConfigField[] = [
  {
    key: "hero_badge_text",
    label: "标签文字",
    placeholder: "欢迎来到我的小世界",
    type: "text",
    colorKey: "hero_badge_color",
    colorLabel: "颜色",
  },
  {
    key: "hero_title_prefix",
    label: "主标题前缀",
    placeholder: "Hey!",
    type: "text",
    colorKey: "hero_title_prefix_color",
    colorLabel: "颜色",
  },
  {
    key: "hero_title_suffix",
    label: "主标题后缀",
    placeholder: "你好呀",
    type: "text",
    colorKey: "hero_title_suffix_color",
    colorLabel: "颜色",
  },
  {
    key: "hero_subtitle",
    label: "副标题",
    placeholder: "副标题内容...",
    type: "textarea",
    colorKey: "hero_subtitle_color",
    colorLabel: "颜色",
  },
  { key: "hero_button_text", label: "按钮文字", placeholder: "开始逛逛", type: "text" },
  { key: "hero_avatar_url", label: "头像图片 URL", placeholder: "/avatar-girl.png", type: "text" },
  { key: "hero_bg_image_url", label: "背景图片 URL", placeholder: "留空则使用默认背景色", type: "text" },
  { key: "hero_font_family", label: "字体（留空使用默认）", placeholder: '如："ZCOOL KuaiLe", "Noto Sans SC"', type: "text" },
];

const PRESET_COLORS = [
  "#3B82F6", "#1D4ED8", "#2563EB", "#60A5FA", "#93C5FD",
  "#EF4444", "#DC2626", "#F87171", "#FCA5A5", "#FECACA",
  "#F59E0B", "#D97706", "#FBBF24", "#FCD34D", "#FDE68A",
  "#22C55E", "#16A34A", "#4ADE80", "#86EFAC", "#BBF7D0",
  "#EC4899", "#DB2777", "#F472B6", "#F9A8D4", "#FBCFE8",
  "#8B5CF6", "#7C3AED", "#A78BFA", "#C4B5FD", "#DDD6FE",
  "#111827", "#374151", "#4B5563", "#6B7280", "#9CA3AF",
  "#FFFFFF", "#F3F4F6", "#E5E7EB", "#D1D5DB", "#000000",
];

function ColorPicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (color: string) => void;
}) {
  const [showPicker, setShowPicker] = useState(false);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setShowPicker(!showPicker)}
        className="flex items-center gap-2 px-3 py-2 border-2 border-gray-200 rounded-xl hover:border-gray-300 transition-colors"
      >
        <span
          className="w-6 h-6 rounded-lg border border-gray-300"
          style={{ backgroundColor: value || "#3B82F6" }}
        />
        <span className="text-sm text-gray-600 font-mono">{value || "#3B82F6"}</span>
      </button>

      {showPicker && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setShowPicker(false)}
          />
          <div className="absolute z-20 mt-2 p-3 bg-white rounded-2xl neo-border neo-shadow-sm w-64">
            <div className="grid grid-cols-8 gap-1.5">
              {PRESET_COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => {
                    onChange(color);
                    setShowPicker(false);
                  }}
                  className="w-6 h-6 rounded-md border border-gray-200 hover:scale-110 transition-transform"
                  style={{ backgroundColor: color }}
                  title={color}
                />
              ))}
            </div>
            <div className="mt-3 pt-3 border-t border-gray-100">
              <label className="text-xs text-gray-500 mb-1 block">自定义颜色</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={value || "#3B82F6"}
                  onChange={(e) => onChange(e.target.value)}
                  className="w-8 h-8 rounded-lg border-2 border-gray-200 cursor-pointer"
                />
                <input
                  type="text"
                  value={value || ""}
                  onChange={(e) => onChange(e.target.value)}
                  placeholder="#3B82F6"
                  className="flex-1 px-2 py-1.5 text-sm border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none font-mono"
                />
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

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
      for (const item of CONFIG_FIELDS) {
        if (!(item.key in map)) {
          map[item.key] = "";
        }
        if (item.colorKey && !(item.colorKey in map)) {
          map[item.colorKey] = "";
        }
      }
      setValues(map);
    }
  }, [configs]);

  const allKeys = CONFIG_FIELDS.flatMap((f) =>
    f.colorKey ? [f.key, f.colorKey] : [f.key]
  );

  const mutation = useMutation({
    mutationFn: api.siteConfigs.update,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["site-configs"] });
    },
  });

  const handleSave = () => {
    const payload: Record<string, string | null> = {};
    for (const key of allKeys) {
      const v = values[key]?.trim();
      payload[key] = v || null;
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

      <div className="bg-white rounded-2xl p-6 neo-border neo-shadow space-y-5">
        {CONFIG_FIELDS.map((item) => (
          <div key={item.key}>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {item.label}
            </label>
            <div className="flex items-start gap-3">
              {item.type === "textarea" ? (
                <textarea
                  value={values[item.key] ?? ""}
                  onChange={(e) =>
                    setValues((prev) => ({ ...prev, [item.key]: e.target.value }))
                  }
                  placeholder={item.placeholder}
                  rows={3}
                  className="flex-1 px-3 py-2 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none transition-colors resize-none"
                />
              ) : (
                <input
                  type="text"
                  value={values[item.key] ?? ""}
                  onChange={(e) =>
                    setValues((prev) => ({ ...prev, [item.key]: e.target.value }))
                  }
                  placeholder={item.placeholder}
                  className="flex-1 px-3 py-2 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none transition-colors"
                />
              )}
              {item.colorKey && (
                <div className="shrink-0 pt-1">
                  <ColorPicker
                    value={values[item.colorKey] ?? ""}
                    onChange={(color) =>
                      setValues((prev) => ({ ...prev, [item.colorKey!]: color }))
                    }
                  />
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
