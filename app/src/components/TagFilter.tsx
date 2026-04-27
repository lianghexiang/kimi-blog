import { useMemo } from "react";
import { Layers } from "lucide-react";
import TagBadge from "./TagBadge";
import type { Tag } from "@/types/api";

interface TagFilterProps {
  tags: Tag[] | undefined;
  stats: Record<string, number> | undefined;
  selectedTag: string | null;
  onSelect: (tagName: string | null) => void;
  showAdminLink?: boolean;
}

export default function TagFilter({
  tags,
  stats,
  selectedTag,
  onSelect,
}: TagFilterProps) {
  const tagList = useMemo(() => {
    if (!tags) return [];
    return tags.map((tag) => ({
      ...tag,
      count: stats?.[tag.id] ?? 0,
    }));
  }, [tags, stats]);

  if (!tags || tags.length === 0) return null;

  return (
    <div className="flex flex-wrap justify-center gap-2.5 mb-10">
      {/* 全部按钮 */}
      <button
        type="button"
        onClick={() => onSelect(null)}
        className={`inline-flex items-center gap-1.5 h-7 px-3.5 rounded-full border-2 border-black text-xs font-bold tracking-wide transition-all duration-150 ease-out select-none ${
          !selectedTag
            ? "bg-gray-800 text-white shadow-[3px_3px_0px_#000000]"
            : "bg-gray-100 text-gray-600 shadow-[2px_2px_0px_#000000] hover:shadow-[3px_3px_0px_#000000] hover:-translate-x-px hover:-translate-y-px"
        }`}
      >
        <Layers className="w-3.5 h-3.5" />
        <span>全部</span>
      </button>

      {/* 标签按钮 */}
      {tagList.map((tag) => (
        <TagBadge
          key={tag.id}
          name={tag.name}
          color={tag.color}
          count={tag.count}
          variant="filter"
          state={selectedTag === tag.name ? "active" : tag.count === 0 ? "disabled" : "inactive"}
          onClick={() => {
            if (tag.count === 0) return;
            onSelect(selectedTag === tag.name ? null : tag.name);
          }}
        />
      ))}
    </div>
  );
}
