import { useState, useCallback } from "react";
import ReactMarkdown from "react-markdown";
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
      <ReactMarkdown
        components={{
          root: ({ children }) => (
            <div className={className}>{children}</div>
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
        }}
      >
        {content}
      </ReactMarkdown>

      <ImageLightbox
        src={lightbox?.src || ""}
        alt={lightbox?.alt}
        isOpen={!!lightbox}
        onClose={closeLightbox}
      />
    </>
  );
}
