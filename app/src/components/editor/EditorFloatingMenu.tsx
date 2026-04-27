import { memo, useMemo } from "react";
import type { Editor } from "@tiptap/core";
import { FloatingMenu } from "@tiptap/react/menus";
import {
  Heading1,
  Heading2,
  List,
  Quote,
  Code2,
  Minus,
} from "lucide-react";

interface EditorFloatingMenuProps {
  editor: Editor | null;
}

const FloatingMenuButton = memo(function FloatingMenuButton({
  onClick,
  icon: Icon,
  title,
}: {
  onClick: () => void;
  icon: React.ComponentType<{ className?: string }>;
  title: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex h-8 w-8 items-center justify-center rounded-lg border-2 border-transparent bg-transparent text-gray-700 hover:bg-gray-100"
      title={title}
    >
      <Icon className="h-4 w-4" />
    </button>
  );
});

export default function EditorFloatingMenu({ editor }: EditorFloatingMenuProps) {
  if (!editor) return null;

  const items = useMemo(
    () => [
      { icon: Heading1, title: "一级标题", action: () => editor.chain().focus().toggleHeading({ level: 1 }).run() },
      { icon: Heading2, title: "二级标题", action: () => editor.chain().focus().toggleHeading({ level: 2 }).run() },
      { icon: List, title: "无序列表", action: () => editor.chain().focus().toggleBulletList().run() },
      { icon: Quote, title: "引用", action: () => editor.chain().focus().toggleBlockquote().run() },
      { icon: Code2, title: "代码块", action: () => editor.chain().focus().toggleCodeBlock().run() },
      { icon: Minus, title: "分割线", action: () => editor.chain().focus().setHorizontalRule().run() },
    ],
    [editor]
  );

  return (
    <FloatingMenu
      editor={editor}
      className="flex items-center gap-1 rounded-xl border-2 border-black bg-white px-2 py-1.5"
      style={{ boxShadow: "4px 4px 0px 0px #000" }}
    >
      {items.map((item) => (
        <FloatingMenuButton
          key={item.title}
          onClick={item.action}
          icon={item.icon}
          title={item.title}
        />
      ))}
    </FloatingMenu>
  );
}
