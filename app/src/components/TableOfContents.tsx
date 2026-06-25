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
            <nav aria-label="文章目录">
              <ul className="space-y-2 pr-3">
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
