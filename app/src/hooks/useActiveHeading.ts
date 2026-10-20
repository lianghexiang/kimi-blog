import { useEffect, useState, useRef, useCallback } from "react";

export function useActiveHeading(ids: string[]) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const isClickScrollingRef = useRef(false);
  const clickScrollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(
    null
  );
  // 记录每个标题当前是否在观察区内；点击滚动期间也持续更新，结束后据此恢复高亮
  const visibleRef = useRef(new Map<string, boolean>());
  const idsRef = useRef(ids);

  // 点击目录时临时不切换高亮，避免 smooth scroll 过程中高亮闪烁
  const beginClickScroll = useCallback((id: string) => {
    isClickScrollingRef.current = true;
    setActiveId(id);
    if (clickScrollTimerRef.current) {
      clearTimeout(clickScrollTimerRef.current);
    }
    clickScrollTimerRef.current = setTimeout(() => {
      isClickScrollingRef.current = false;
      // 滚动结束后按最新可见状态恢复高亮，否则会一直停留在点击的章节
      const firstVisible = idsRef.current.find(hid =>
        visibleRef.current.get(hid)
      );
      if (firstVisible) {
        setActiveId(firstVisible);
      }
    }, 1000);
  }, []);

  useEffect(() => {
    idsRef.current = ids;
    if (ids.length === 0) {
      setActiveId(null);
      return;
    }

    visibleRef.current = new Map();

    const observer = new IntersectionObserver(
      entries => {
        // 滚动期间始终记录可见性；点击滚动时仅跳过高亮切换
        entries.forEach(entry => {
          visibleRef.current.set(entry.target.id, entry.isIntersecting);
        });

        if (isClickScrollingRef.current) return;

        // 找到文档顺序中第一个可见的标题
        const firstVisible = ids.find(id => visibleRef.current.get(id));
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
        visibleRef.current.set(id, false);
      }
    });

    return () => {
      observer.disconnect();
      if (clickScrollTimerRef.current) {
        clearTimeout(clickScrollTimerRef.current);
      }
      isClickScrollingRef.current = false;
    };
  }, [ids]);

  return { activeId, beginClickScroll };
}
