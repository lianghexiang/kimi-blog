import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import TagBadge from "./TagBadge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ChevronsUpDown, Check, Plus } from "lucide-react";

const CANDIDATE_COLORS = [
  "#F59E0B", "#3B82F6", "#EC4899", "#10B981",
  "#8B5CF6", "#EF4444", "#6366F1", "#14B8A6",
];

interface TagMultiSelectProps {
  selectedTagIds: number[];
  onChange: (ids: number[]) => void;
}

export default function TagMultiSelect({
  selectedTagIds,
  onChange,
}: TagMultiSelectProps) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const [newColor, setNewColor] = useState("#3B82F6");

  const { data: tags } = useQuery({
    queryKey: ["tags", "list"],
    queryFn: () => api.tags.list(),
  });

  const createTag = useMutation({
    mutationFn: api.tags.create,
    onSuccess: (newTag) => {
      queryClient.invalidateQueries({ queryKey: ["tags"] });
      onChange([...selectedTagIds, newTag.id]);
      setShowCreate(false);
      setNewName("");
      setNewColor("#3B82F6");
    },
    onError: (err: any) => alert(err.message || "创建标签失败"),
  });

  const selectedTags = tags?.filter((t) => selectedTagIds.includes(t.id)) ?? [];

  const toggleTag = (id: number) => {
    if (selectedTagIds.includes(id)) {
      onChange(selectedTagIds.filter((tid) => tid !== id));
    } else {
      onChange([...selectedTagIds, id]);
    }
  };

  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            className="flex w-full items-center justify-between rounded-xl border-2 border-gray-200 bg-white px-3 py-2 text-sm shadow-sm transition-colors hover:border-gray-300 focus:border-blue-500 focus:outline-none"
          >
            <div className="flex flex-wrap items-center gap-1.5 min-w-0">
              {selectedTags.length > 0 ? (
                selectedTags.map((tag) => (
                  <TagBadge
                    key={tag.id}
                    name={tag.name}
                    color={tag.color}
                    variant="default"
                    state="active"
                  />
                ))
              ) : (
                <span className="text-gray-400">选择标签</span>
              )}
            </div>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 text-gray-400" />
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-80 p-0" align="start">
          <div className="p-4">
            <p className="mb-3 text-sm font-bold text-gray-900">选择标签</p>
            <div className="flex flex-wrap gap-2">
              {tags?.map((tag) => {
                const isSelected = selectedTagIds.includes(tag.id);
                return (
                  <button
                    key={tag.id}
                    type="button"
                    onClick={() => toggleTag(tag.id)}
                    className="group relative"
                  >
                    <TagBadge
                      name={tag.name}
                      color={tag.color}
                      variant="default"
                      state={isSelected ? "active" : "inactive"}
                    />
                    {isSelected && (
                      <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-black text-white">
                        <Check className="h-2.5 w-2.5" />
                      </span>
                    )}
                  </button>
                );
              })}
              {(!tags || tags.length === 0) && (
                <p className="text-sm text-gray-400">暂无标签</p>
              )}
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                setOpen(false);
                setShowCreate(true);
              }}
              className="mt-3 flex w-full items-center justify-center gap-1 rounded-xl border-2 border-dashed border-gray-300 py-2 text-sm font-medium text-gray-600 hover:border-gray-400 hover:bg-gray-50"
            >
              <Plus className="h-4 w-4" />
              新建标签
            </Button>
          </div>
        </PopoverContent>
      </Popover>

      {/* 新建标签 Dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>新建标签</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="标签名称"
              className="w-full rounded-xl border-2 border-gray-200 px-4 py-2"
            />
            <div className="flex flex-wrap gap-2">
              {CANDIDATE_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setNewColor(c)}
                  className={`flex h-9 w-9 items-center justify-center rounded-full border-2 transition-transform hover:scale-110 ${
                    newColor === c ? "border-black" : "border-gray-300"
                  }`}
                  style={{ backgroundColor: c }}
                >
                  {newColor === c && (
                    <Check className="h-4 w-4 text-white drop-shadow" />
                  )}
                </button>
              ))}
            </div>
            <Button
              type="button"
              onClick={() => {
                if (!newName.trim()) return;
                createTag.mutate({ name: newName.trim(), color: newColor });
              }}
              disabled={createTag.isPending || !newName.trim()}
              className="w-full rounded-xl bg-blue-500 px-4 py-2 font-medium text-white hover:bg-blue-600 disabled:opacity-50"
            >
              {createTag.isPending ? "创建中..." : "创建"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
