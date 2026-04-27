import { Extension } from "@tiptap/core";
import { Plugin } from "@tiptap/pm/state";

export interface ImageUploadOptions {
  uploadFn: (formData: FormData) => Promise<{ url: string }>;
}

export const ImageUpload = Extension.create<ImageUploadOptions>({
  name: "imageUpload",

  addOptions() {
    return {
      uploadFn: async () => ({ url: "" }),
    };
  },

  addProseMirrorPlugins() {
    const { uploadFn } = this.options;

    return [
      new Plugin({
        props: {
          handleDrop: (view, event) => {
            const dataTransfer = event.dataTransfer;
            if (!dataTransfer) return false;

            const files = Array.from(dataTransfer.files).filter((file) =>
              file.type.startsWith("image/")
            );
            if (files.length === 0) return false;

            event.preventDefault();

            const { schema } = view.state;
            const coordinates = view.posAtCoords({
              left: event.clientX,
              top: event.clientY,
            });
            if (!coordinates) return false;

            files.forEach(async (file) => {
              const formData = new FormData();
              formData.append("file", file);
              formData.append("title", file.name.replace(/\.[^/.]+$/, ""));

              try {
                const image = await uploadFn(formData);
                const node = schema.nodes.image.create({ src: image.url, alt: file.name });
                const transaction = view.state.tr.insert(coordinates.pos, node);
                view.dispatch(transaction);
              } catch (error) {
                console.error("Image upload failed:", error);
                window.alert(
                  error instanceof Error ? error.message : "图片上传失败，请稍后重试"
                );
              }
            });

            return true;
          },
          handlePaste: (view, event) => {
            const dataTransfer = event.clipboardData;
            if (!dataTransfer) return false;

            const files = Array.from(dataTransfer.files).filter((file) =>
              file.type.startsWith("image/")
            );
            if (files.length === 0) return false;

            event.preventDefault();

            const { schema } = view.state;
            const pos = view.state.selection.from;

            files.forEach(async (file) => {
              const formData = new FormData();
              formData.append("file", file);
              formData.append("title", file.name.replace(/\.[^/.]+$/, ""));

              try {
                const image = await uploadFn(formData);
                const node = schema.nodes.image.create({ src: image.url, alt: file.name });
                const transaction = view.state.tr.insert(pos, node);
                view.dispatch(transaction);
              } catch (error) {
                console.error("Image upload failed:", error);
                window.alert(
                  error instanceof Error ? error.message : "图片上传失败，请稍后重试"
                );
              }
            });

            return true;
          },
        },
      }),
    ];
  },
});
