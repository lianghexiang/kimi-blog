import { EditorContent as TiptapEditorContent } from "@tiptap/react";
import type { Editor } from "@tiptap/core";

interface EditorContentProps {
  editor: Editor | null;
}

export default function EditorContent({ editor }: EditorContentProps) {
  return (
    <div className="tiptap-editor">
      <TiptapEditorContent editor={editor} />
    </div>
  );
}
