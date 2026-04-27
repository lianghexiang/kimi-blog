import { memo, useState, useCallback } from "react";
import MarkdownContent from "@/components/MarkdownContent";
import { PencilLine, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTiptapEditor } from "./hooks/useTiptapEditor";
import EditorContent from "./EditorContent";
import EditorToolbar from "./EditorToolbar";
import EditorBubbleMenu from "./EditorBubbleMenu";
import EditorFloatingMenu from "./EditorFloatingMenu";

interface TiptapEditorProps {
  value: string;
  onChange: (markdown: string) => void;
}

type EditorMode = "write" | "preview";

function TiptapEditor({ value, onChange }: TiptapEditorProps) {
  const [mode, setMode] = useState<EditorMode>("write");

  const handleChange = useCallback(
    (markdown: string) => {
      onChange(markdown);
    },
    [onChange]
  );

  const editor = useTiptapEditor({
    content: value,
    onChange: handleChange,
  });

  return (
    <div className="overflow-hidden rounded-xl border-2 border-black bg-white neo-shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b-2 border-gray-100 bg-[#FFF7D6] px-3 py-2">
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant={mode === "write" ? "default" : "outline"}
            size="sm"
            onClick={() => setMode("write")}
            className={`h-9 rounded-lg border-2 font-medium ${
              mode === "write"
                ? "border-black bg-yellow-400 text-black shadow-[2px_2px_0px_#000] translate-x-px translate-y-px"
                : "border-black bg-white text-gray-700 neo-shadow-sm hover:bg-gray-50"
            }`}
          >
            <PencilLine className="mr-1.5 h-4 w-4" />
            编辑
          </Button>
          <Button
            type="button"
            variant={mode === "preview" ? "default" : "outline"}
            size="sm"
            onClick={() => setMode("preview")}
            className={`h-9 rounded-lg border-2 font-medium ${
              mode === "preview"
                ? "border-black bg-yellow-400 text-black shadow-[2px_2px_0px_#000] translate-x-px translate-y-px"
                : "border-black bg-white text-gray-700 neo-shadow-sm hover:bg-gray-50"
            }`}
          >
            <Eye className="mr-1.5 h-4 w-4" />
            预览
          </Button>
        </div>
      </div>

      {mode === "write" ? (
        <>
          <EditorToolbar editor={editor} />
          <div className="relative p-3">
            <EditorBubbleMenu editor={editor} />
            <EditorFloatingMenu editor={editor} />
            <EditorContent editor={editor} />
          </div>
        </>
      ) : (
        <div className="min-h-[24rem] bg-[#FFFCF1] px-6 py-5">
          {value.trim() ? (
            <MarkdownContent
              content={value}
              className="prose prose-lg max-w-none prose-headings:font-bold prose-headings:text-gray-900 prose-p:text-gray-700 prose-p:leading-relaxed prose-a:text-blue-600 prose-a:no-underline hover:prose-a:underline prose-strong:text-gray-900 prose-blockquote:border-l-4 prose-blockquote:border-yellow-400 prose-blockquote:bg-yellow-50 prose-blockquote:py-2 prose-blockquote:px-4 prose-blockquote:rounded-r-lg"
            />
          ) : (
            <div className="flex min-h-[22rem] items-center justify-center text-sm text-gray-400">
              暂无内容可预览
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default memo(TiptapEditor);
