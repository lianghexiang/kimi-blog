import { useEffect, useRef } from "react";
import { List } from "lucide-react";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { TocItem } from "@/lib/toc";

interface TableOfContentsProps {
  items: TocItem[];
  activeId?: string | null;
  className?: string;
  onItemClick?: (id: string) => void;
}

export default function TableOfContents({
  items,
  activeId,
  className,
  onItemClick,
}: TableOfContentsProps) {
  const navRef = useRef<HTMLElement | null>(null);

  // 高亮项变化时，让目录视口平滑滚动到该项（只滚动目录内部，不干扰页面滚动）
  useEffect(() => {
    if (!activeId || !navRef.current) return;
    const viewport = navRef.current.closest(
      '[data-slot="scroll-area-viewport"]'
    );
    const btn = navRef.current.querySelector<HTMLButtonElement>(
      `[data-toc-id="${activeId}"]`
    );
    if (!viewport || !btn) return;

    const vpRect = viewport.getBoundingClientRect();
    const btnRect = btn.getBoundingClientRect();
    // 上下各留 8px 边距，同时避免激活项的位移/阴影被视口裁剪
    const margin = 8;
    if (btnRect.top < vpRect.top + margin) {
      viewport.scrollTo({
        top: viewport.scrollTop - (vpRect.top + margin - btnRect.top),
        behavior: "smooth",
      });
    } else if (btnRect.bottom > vpRect.bottom - margin) {
      viewport.scrollTo({
        top: viewport.scrollTop + (btnRect.bottom - (vpRect.bottom - margin)),
        behavior: "smooth",
      });
    }
  }, [activeId]);

  if (items.length === 0) {
    return null;
  }

  const handleClick = (id: string) => {
    onItemClick?.(id);

    const element = document.getElementById(id);
    if (!element) return;

    element.scrollIntoView({ behavior: "smooth", block: "start" });
    history.pushState(null, "", `#${id}`);
  };

  return (
    <aside className={cn("hidden lg:block w-72 shrink-0", className)}>
      <div className="sticky top-24">
        <div className="bg-white rounded-[1.5rem] neo-border neo-shadow-sm p-5">
          <div className="flex items-center gap-2 mb-4 pb-3 border-b-2 border-black">
            <List className="w-5 h-5 text-gray-800" />
            <h2 className="text-base font-bold text-gray-800 tracking-wide">
              目录
            </h2>
          </div>

          <ScrollArea className="h-[calc(100vh-14rem)]">
            <nav ref={navRef} aria-label="文章目录">
              {/* py-2 为激活项的上移和阴影预留空间，避免被视口裁剪 */}
              <ul className="space-y-2 py-2 pr-3">
                {items.map(item => (
                  <li
                    key={item.id}
                    className={cn(
                      "rounded-2xl transition-all",
                      item.level === 3 && "ml-3"
                    )}
                  >
                    <button
                      onClick={() => handleClick(item.id)}
                      data-toc-id={item.id}
                      className={cn(
                        "w-full text-left px-3.5 py-2.5 text-sm rounded-2xl border-2 border-transparent transition-all leading-relaxed tracking-wider antialiased",
                        "font-sans font-medium text-gray-600",
                        "hover:bg-yellow-50 hover:border-black hover:neo-shadow-sm hover:-translate-y-0.5 hover:text-gray-900",
                        activeId === item.id &&
                          "bg-yellow-300 border-black neo-shadow-sm -translate-y-0.5 text-gray-900 font-semibold"
                      )}
                    >
                      {item.text}
                    </button>
                  </li>
                ))}
              </ul>
            </nav>
          </ScrollArea>
        </div>
      </div>
    </aside>
  );
}
