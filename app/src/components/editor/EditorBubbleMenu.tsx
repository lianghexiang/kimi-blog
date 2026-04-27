import { memo, useCallback, useMemo } from "react";
import type { Editor } from "@tiptap/core";
import { BubbleMenu } from "@tiptap/react/menus";
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  Code2,
  Link as LinkIcon,
  Heading1,
  Heading2,
} from "lucide-react";

interface EditorBubbleMenuProps {
  editor: Editor | null;
}

const BubbleMenuButton = memo(function BubbleMenuButton({
  onClick,
  icon: Icon,
  title,
  active = false,
}: {
  onClick: () => void;
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  active?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex h-8 w-8 items-center justify-center rounded-lg border-2 ${
        active
          ? "border-black bg-yellow-400 text-black"
          : "border-transparent bg-transparent text-gray-700 hover:bg-gray-100"
      }`}
      title={title}
    >
      <Icon className="h-4 w-4" />
    </button>
  );
});

export default function EditorBubbleMenu({ editor }: EditorBubbleMenuProps) {
  if (!editor) return null;

  const setLink = useCallback(() => {
    const previousUrl = editor.getAttributes("link").href as string;
    const url = window.prompt("输入链接地址", previousUrl);
    if (url === null) return;
    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  }, [editor]);

  const items = useMemo(
    () => [
      { icon: Bold, title: "加粗", action: () => editor.chain().focus().toggleBold().run(), isActive: () => editor.isActive("bold") },
      { icon: Italic, title: "斜体", action: () => editor.chain().focus().toggleItalic().run(), isActive: () => editor.isActive("italic") },
      { icon: UnderlineIcon, title: "下划线", action: () => editor.chain().focus().toggleUnderline().run(), isActive: () => editor.isActive("underline") },
      { icon: Strikethrough, title: "删除线", action: () => editor.chain().focus().toggleStrike().run(), isActive: () => editor.isActive("strike") },
      { icon: Code2, title: "行内代码", action: () => editor.chain().focus().toggleCode().run(), isActive: () => editor.isActive("code") },
      { icon: LinkIcon, title: "链接", action: setLink, isActive: () => editor.isActive("link") },
      { icon: Heading1, title: "一级标题", action: () => editor.chain().focus().toggleHeading({ level: 1 }).run(), isActive: () => editor.isActive("heading", { level: 1 }) },
      { icon: Heading2, title: "二级标题", action: () => editor.chain().focus().toggleHeading({ level: 2 }).run(), isActive: () => editor.isActive("heading", { level: 2 }) },
    ],
    [editor, setLink]
  );

  return (
    <BubbleMenu
      editor={editor}
      className="flex items-center gap-1 rounded-xl border-2 border-black bg-white px-2 py-1.5"
      style={{ boxShadow: "4px 4px 0px 0px #000" }}
    >
      {items.map((item) => (
        <BubbleMenuButton
          key={item.title}
          onClick={item.action}
          icon={item.icon}
          title={item.title}
          active={item.isActive()}
        />
      ))}
    </BubbleMenu>
  );
}
