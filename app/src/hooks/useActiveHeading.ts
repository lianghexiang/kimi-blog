import { useEffect, useState, useRef, useCallback } from "react";

export function useActiveHeading(ids: string[]) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const isClickScrollingRef = useRef(false);
  const clickScrollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(
    null
  );

  // 点击目录时临时禁用 observer，避免 smooth scroll 过程中高亮闪烁
  const beginClickScroll = useCallback((id: string) => {
    isClickScrollingRef.current = true;
    setActiveId(id);
    if (clickScrollTimerRef.current) {
      clearTimeout(clickScrollTimerRef.current);
    }
    clickScrollTimerRef.current = setTimeout(() => {
      isClickScrollingRef.current = false;
    }, 1000);
  }, []);

  useEffect(() => {
    if (ids.length === 0) {
      setActiveId(null);
      return;
    }

    const visible = new Map<string, boolean>();

    const observer = new IntersectionObserver(
      entries => {
        if (isClickScrollingRef.current) return;

        entries.forEach(entry => {
          visible.set(entry.target.id, entry.isIntersecting);
        });

        // 找到文档顺序中第一个可见的标题
        const firstVisible = ids.find(id => visible.get(id));
        if (firstVisible) {
          setActiveId(firstVisible);
        }
      },
      {
        rootMargin: "-120px 0px -50% 0px",
        threshold: 0,
      }
    );

    ids.forEach(id => {
      const el = document.getElementById(id);
      if (el) {
        observer.observe(el);
        visible.set(id, false);
      }
    });

    return () => {
      observer.disconnect();
      if (clickScrollTimerRef.current) {
        clearTimeout(clickScrollTimerRef.current);
      }
    };
  }, [ids]);

  return { activeId, beginClickScroll };
}
