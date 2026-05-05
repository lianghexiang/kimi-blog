import { memo, useCallback, useMemo, useRef, useState } from "react";
import type { Editor } from "@tiptap/core";
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  Heading1,
  Heading2,
  Heading3,
  Quote,
  List,
  ListOrdered,
  Code2,
  Link as LinkIcon,
  Image as ImageIcon,
  Table as TableIcon,
  CheckSquare,
  Minus,
  Undo,
  Redo,
  Smile,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import EmojiPicker from "emoji-picker-react";

interface EditorToolbarProps {
  editor: Editor | null;
}

const ToolbarButton = memo(function ToolbarButton({
  onClick,
  icon: Icon,
  title,
  active = false,
  disabled = false,
}: {
  onClick: () => void;
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  active?: boolean;
  disabled?: boolean;
}) {
  return (
    <Button
      type="button"
      variant="outline"
      size="icon"
      className={`editor-toolbar-btn h-9 w-9 rounded-lg border-2 border-black bg-white hover:bg-gray-50 ${
        active ? "data-active" : ""
      } ${disabled ? "opacity-40 cursor-not-allowed" : ""}`}
      onClick={onClick}
      title={title}
      disabled={disabled}
      data-active={active}
    >
      <Icon className="h-4 w-4" />
    </Button>
  );
});

export default function EditorToolbar({ editor }: EditorToolbarProps) {
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const emojiBtnRef = useRef<HTMLButtonElement>(null);

  if (!editor) return null;

  const onEmojiClick = useCallback(
    (emojiData: { emoji: string }) => {
      editor.chain().focus().insertContent(emojiData.emoji).run();
      setShowEmojiPicker(false);
    },
    [editor]
  );

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

  const fileInputRef = useRef<HTMLInputElement>(null);

  const insertImage = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleImageFileChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file || !editor) return;

      const formData = new FormData();
      formData.append("file", file);
      formData.append("title", file.name.replace(/\.[^/.]+$/, ""));

      try {
        const image = await api.images.upload(formData);
        editor.chain().focus().setImage({ src: image.url }).run();
      } catch (error) {
        console.error("Image upload failed:", error);
        window.alert(
          error instanceof Error ? error.message : "图片上传失败，请稍后重试"
        );
      }

      e.target.value = "";
    },
    [editor]
  );

  const insertTable = useCallback(() => {
    editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
  }, [editor]);

  const items = useMemo(
    () => [
      { icon: Heading1, title: "一级标题", action: () => editor.chain().focus().toggleHeading({ level: 1 }).run(), isActive: () => editor.isActive("heading", { level: 1 }) },
      { icon: Heading2, title: "二级标题", action: () => editor.chain().focus().toggleHeading({ level: 2 }).run(), isActive: () => editor.isActive("heading", { level: 2 }) },
      { icon: Heading3, title: "三级标题", action: () => editor.chain().focus().toggleHeading({ level: 3 }).run(), isActive: () => editor.isActive("heading", { level: 3 }) },
      { icon: Bold, title: "加粗", action: () => editor.chain().focus().toggleBold().run(), isActive: () => editor.isActive("bold") },
      { icon: Italic, title: "斜体", action: () => editor.chain().focus().toggleItalic().run(), isActive: () => editor.isActive("italic") },
      { icon: UnderlineIcon, title: "下划线", action: () => editor.chain().focus().toggleUnderline().run(), isActive: () => editor.isActive("underline") },
      { icon: Strikethrough, title: "删除线", action: () => editor.chain().focus().toggleStrike().run(), isActive: () => editor.isActive("strike") },
      { icon: Code2, title: "行内代码", action: () => editor.chain().focus().toggleCode().run(), isActive: () => editor.isActive("code") },
      { icon: List, title: "无序列表", action: () => editor.chain().focus().toggleBulletList().run(), isActive: () => editor.isActive("bulletList") },
      { icon: ListOrdered, title: "有序列表", action: () => editor.chain().focus().toggleOrderedList().run(), isActive: () => editor.isActive("orderedList") },
      { icon: CheckSquare, title: "任务列表", action: () => editor.chain().focus().toggleTaskList().run(), isActive: () => editor.isActive("taskList") },
      { icon: Quote, title: "引用", action: () => editor.chain().focus().toggleBlockquote().run(), isActive: () => editor.isActive("blockquote") },
      { icon: LinkIcon, title: "插入链接", action: setLink, isActive: () => editor.isActive("link") },
      { icon: ImageIcon, title: "插入图片", action: insertImage, isActive: () => false },
      { icon: TableIcon, title: "插入表格", action: insertTable, isActive: () => false },
      { icon: Minus, title: "分割线", action: () => editor.chain().focus().setHorizontalRule().run(), isActive: () => false },
      { icon: Undo, title: "撤销", action: () => editor.chain().focus().undo().run(), isActive: () => false, disabled: () => !editor.can().chain().focus().undo().run() },
      { icon: Redo, title: "重做", action: () => editor.chain().focus().redo().run(), isActive: () => false, disabled: () => !editor.can().chain().focus().redo().run() },
    ],
    [editor, setLink, insertImage, insertTable]
  );

  return (
    <>
      <input
        type="file"
        ref={fileInputRef}
        accept="image/*"
        className="hidden"
        onChange={handleImageFileChange}
      />
      <div className="relative flex flex-wrap items-center gap-2 border-b-2 border-gray-100 bg-[#FFF7D6] px-3 py-2">
        {items.map((item, index) => (
          <span key={item.title} className="contents">
            {(index === 3 || index === 8 || index === 12 || index === 15) && (
              <div className="mx-1 h-5 w-px bg-gray-300" />
            )}
            <ToolbarButton
              onClick={item.action}
              icon={item.icon}
              title={item.title}
              active={item.isActive()}
              disabled={item.disabled ? item.disabled() : false}
            />
          </span>
        ))}
        <div className="mx-1 h-5 w-px bg-gray-300" />
        <Button
          ref={emojiBtnRef}
          type="button"
          variant="outline"
          size="icon"
          className="editor-toolbar-btn h-9 w-9 rounded-lg border-2 border-black bg-white hover:bg-gray-50"
          onClick={() => setShowEmojiPicker((v) => !v)}
          title="插入表情"
        >
          <Smile className="h-4 w-4" />
        </Button>
        {showEmojiPicker && (
          <div className="absolute left-0 top-[calc(100%+8px)] z-50 neo-border neo-shadow-sm rounded-xl overflow-hidden bg-white">
            <EmojiPicker
              onEmojiClick={onEmojiClick}
              width={320}
              height={380}
              previewConfig={{ showPreview: false }}
            />
          </div>
        )}
      </div>
    </>
  );
}
