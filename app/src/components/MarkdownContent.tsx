import { useState, useCallback, useRef, useLayoutEffect, type ReactNode } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import rehypeSlug from "rehype-slug";
import { ZoomIn, Link2 } from "lucide-react";
import { cn } from "@/lib/utils";
import ImageLightbox from "./ImageLightbox";

interface MarkdownContentProps {
  content: string;
  className?: string;
  onHeadingsExtracted?: (headings: { id: string; level: number; text: string }[]) => void;
}

export default function MarkdownContent({
  content,
  className = "",
  onHeadingsExtracted,
}: MarkdownContentProps) {
  const containerRef = useRef<HTMLDivElement>(null);
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

  // 渲染后从 DOM 提取 heading 信息，确保 ID 与实际 DOM 完全一致
  useLayoutEffect(() => {
    if (!onHeadingsExtracted) return;
    const container = containerRef.current;
    if (!container) return;
    const headingElements = container.querySelectorAll<HTMLHeadingElement>("h2, h3");
    const headings: { id: string; level: number; text: string }[] = [];
    headingElements.forEach((el: HTMLHeadingElement) => {
      if (el.id) {
        headings.push({
          id: el.id,
          level: parseInt(el.tagName[1], 10),
          text: el.textContent || "",
        });
      }
    });
    onHeadingsExtracted(headings);
  }, [content, onHeadingsExtracted]);

  return (
    <>
      <div ref={containerRef} className={className}>
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          rehypePlugins={[rehypeRaw, rehypeSlug]}
          components={{
            h1: ({ id, children }) => (
              <Heading id={id} level={1}>
                {children}
              </Heading>
            ),
            h2: ({ id, children }) => (
              <Heading id={id} level={2}>
                {children}
              </Heading>
            ),
            h3: ({ id, children }) => (
              <Heading id={id} level={3}>
                {children}
              </Heading>
            ),
            h4: ({ id, children }) => (
              <Heading id={id} level={4}>
                {children}
              </Heading>
            ),
            h5: ({ id, children }) => (
              <Heading id={id} level={5}>
                {children}
              </Heading>
            ),
            h6: ({ id, children }) => (
              <Heading id={id} level={6}>
                {children}
              </Heading>
            ),
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
            tr: ({ children }) => (
              <tr className="hover:bg-gray-50">{children}</tr>
            ),
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

interface HeadingProps {
  id?: string;
  level: number;
  children?: ReactNode;
}

function Heading({ id, level, children }: HeadingProps) {
  const Tag = `h${level}` as "h1" | "h2" | "h3" | "h4" | "h5" | "h6";

  const sizeClasses: Record<number, string> = {
    1: "text-3xl mt-12 mb-6",
    2: "text-2xl mt-10 mb-5",
    3: "text-xl mt-8 mb-4",
    4: "text-lg mt-6 mb-3",
    5: "text-base mt-5 mb-2",
    6: "text-sm mt-4 mb-2",
  };

  return (
    <Tag
      id={id}
      className={cn(
        "group relative font-bold text-gray-800 tracking-wide !scroll-mt-40",
        sizeClasses[level]
      )}
    >
      {id && (
        <a
          href={`#${id}`}
          onClick={e => {
            e.preventDefault();
            const element = document.getElementById(id);
            if (element) {
              element.scrollIntoView({ behavior: "smooth", block: "start" });
              history.pushState(null, "", `#${id}`);
            }
          }}
          className="absolute -left-6 top-1/2 -translate-y-1/2 flex items-center justify-center w-7 h-7 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-yellow-100"
          aria-label={`锚点：${id}`}
        >
          <Link2 className="w-4 h-4 text-gray-400 hover:text-blue-500" />
        </a>
      )}
      {children}
    </Tag>
  );
}
