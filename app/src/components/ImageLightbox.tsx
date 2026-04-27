import { useEffect, useCallback } from "react";
import { X } from "lucide-react";

interface ImageLightboxProps {
  src: string;
  alt?: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function ImageLightbox({
  src,
  alt = "",
  isOpen,
  onClose,
}: ImageLightboxProps) {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    },
    [onClose]
  );

  useEffect(() => {
    if (!isOpen) return;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, handleKeyDown]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <button
        onClick={onClose}
        className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors"
        title="关闭"
      >
        <X className="w-6 h-6" />
      </button>

      <img
        src={src}
        alt={alt}
        className="max-w-[90vw] max-h-[85vh] object-contain rounded-xl border-4 border-white shadow-2xl animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      />

      {alt && (
        <p className="absolute bottom-6 left-1/2 -translate-x-1/2 text-white/80 text-sm max-w-lg text-center px-4">
          {alt}
        </p>
      )}
    </div>
  );
}
