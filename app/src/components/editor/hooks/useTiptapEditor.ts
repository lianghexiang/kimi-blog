import { useEffect } from "react";
import { useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import Underline from "@tiptap/extension-underline";
import Placeholder from "@tiptap/extension-placeholder";
import { Table } from "@tiptap/extension-table";
import TableRow from "@tiptap/extension-table-row";
import TableCell from "@tiptap/extension-table-cell";
import TableHeader from "@tiptap/extension-table-header";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";
import { Markdown } from "tiptap-markdown";
import { ImageUpload } from "../extensions/ImageUpload";
import { api } from "@/lib/api";

export interface UseTiptapEditorOptions {
  content: string;
  onChange: (markdown: string) => void;
}

interface MarkdownStorage {
  markdown?: {
    getMarkdown: () => string;
  };
}

export function useTiptapEditor({ content, onChange }: UseTiptapEditorOptions) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      Image.configure({
        allowBase64: false,
      }),
      Link.configure({
        openOnClick: false,
        autolink: true,
        defaultProtocol: "https",
      }),
      Underline,
      Placeholder.configure({
        placeholder: "在这里输入正文内容，支持 Markdown 格式。",
      }),
      Table.configure({
        resizable: true,
      }),
      TableRow,
      TableCell,
      TableHeader,
      TaskList,
      TaskItem.configure({
        nested: true,
      }),
      Markdown.configure({
        html: true,
        tightLists: true,
        transformPastedText: true,
        transformCopiedText: true,
      }),
      ImageUpload.configure({
        uploadFn: api.images.upload,
      }),
    ],
    content,
    onUpdate: ({ editor: ed }) => {
      const markdown = (ed.storage as MarkdownStorage).markdown?.getMarkdown() ?? "";
      onChange(markdown);
    },
    editorProps: {
      attributes: {
        class: "prose prose-lg max-w-none focus:outline-none min-h-[24rem]",
      },
    },
  });

  useEffect(() => {
    if (!editor) return;
    const current = (editor.storage as MarkdownStorage).markdown?.getMarkdown() ?? "";
    if (current !== content) {
      editor.commands.setContent(content, { emitUpdate: false });
    }
  }, [editor, content]);

  return editor;
}
