import { useState, useCallback } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import { ZoomIn } from "lucide-react";
import ImageLightbox from "./ImageLightbox";

interface MarkdownContentProps {
  content: string;
  className?: string;
}

export default function MarkdownContent({
  content,
  className = "",
}: MarkdownContentProps) {
  const [lightbox, setLightbox] = useState<{
    src: string;
    alt: string;
  } | null>(null);

  const openLightbox = useCallback((src: string, alt: string) => {
    setLightbox({ src, alt });
  }, []);

  const closeLightbox = useCallback(() => {
    setLightbox(null);
  }, []);

  return (
    <>
      <div className={className}>
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          rehypePlugins={[rehypeRaw]}
          components={{
            img: ({ src, alt }) => (
              <span
                className="group relative block my-6 cursor-zoom-in"
                onClick={() => src && openLightbox(src, alt || "")}
              >
                <img
                  src={src}
                  alt={alt}
                  className="w-full rounded-2xl border-2 border-black neo-shadow-sm transition-all duration-300 group-hover:-translate-y-1 group-hover:shadow-lg"
                  loading="lazy"
                />
                <span className="absolute top-3 right-3 p-1.5 bg-black/40 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm">
                  <ZoomIn className="w-4 h-4" />
                </span>
              </span>
            ),
            table: ({ children }) => (
              <div className="overflow-x-auto my-6 rounded-xl border-2 border-black neo-shadow-sm">
                <table className="min-w-full border-collapse bg-white text-sm">
                  {children}
                </table>
              </div>
            ),
            thead: ({ children }) => (
              <thead className="bg-yellow-100 border-b-2 border-black">
                {children}
              </thead>
            ),
            th: ({ children }) => (
              <th className="px-4 py-3 text-left font-bold text-gray-900">
                {children}
              </th>
            ),
            td: ({ children }) => (
              <td className="px-4 py-3 border-b border-gray-200 text-gray-700">
                {children}
              </td>
            ),
            tr: ({ children }) => <tr className="hover:bg-gray-50">{children}</tr>,
            input: ({ type, checked }) =>
              type === "checkbox" ? (
                <input
                  type="checkbox"
                  checked={checked}
                  readOnly
                  className="mr-2 h-4 w-4 accent-yellow-500 border-2 border-black rounded"
                />
              ) : null,
          }}
        >
          {content}
        </ReactMarkdown>
      </div>

      <ImageLightbox
        src={lightbox?.src || ""}
        alt={lightbox?.alt}
        isOpen={!!lightbox}
        onClose={closeLightbox}
      />
    </>
  );
}
