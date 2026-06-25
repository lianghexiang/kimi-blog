# 修复博文目录导航高亮问题

## 问题描述

博文页面左侧目录导航组件中，点击目录项可以正常跳转，但当前浏览章节的目录项无法高亮显示（`activeId` 未正确同步）。

## 根本原因分析

经过对 `useActiveHeading.ts`、`TableOfContents.tsx`、`MarkdownContent.tsx`、`BlogPost.tsx` 的代码审查，发现以下三个问题：

### 1. 点击目录后 `activeId` 不会立即更新

`useActiveHeading.ts` 中的 `beginClickScroll` 函数签名不接受参数：

```ts
const beginClickScroll = useCallback(() => { ... }, []);
```

当用户点击目录项时，`TableOfContents.tsx` 调用 `onItemClick?.(id)` 传入被点击项的 `id`，但 `beginClickScroll` 接收不到该 `id`，因此无法立即设置 `activeId`。同时，`beginClickScroll` 将 `isClickScrollingRef` 置为 `true` 并持续 1 秒，这期间 IntersectionObserver 回调会直接 `return`，导致点击后的 1 秒内 `activeId` 完全不会更新，目录高亮状态停留在旧值或空值。

### 2. IntersectionObserver 的 `rootMargin` 配置过于严格

当前配置为 `rootMargin: "0px 0px -70% 0px"`，这意味着只有进入视口顶部 30% 区域的标题才会被认为是 intersecting。对于长文章，当用户滚动到页面中间某段时，当前段落的标题可能位于视口中部，不在顶部 30% 区域内，导致没有任何标题被判定为可见，`activeId` 无法更新。

此外，heading 元素带有 `!scroll-mt-40`（约 160px 的滚动偏移），但 rootMargin 没有考虑顶部固定导航栏和滚动偏移的影响。

### 3. 没有处理"所有标题均不可见"的回退情况

当用户快速滚动或滚动到页面底部时，可能没有任何标题进入观察区域。此时 `firstVisible` 为 `undefined`，`activeId` 不会被更新，可能保持为 `null` 或一个已经不正确的旧值。

## 修复方案

### 修改 `app/src/hooks/useActiveHeading.ts`

1. **让 `beginClickScroll` 接收 `id` 参数并立即设置 `activeId`**：
   - 修改函数签名为 `beginClickScroll(id: string)`
   - 在函数内部立即调用 `setActiveId(id)`
   - 保持 1 秒防抖逻辑，期间禁用 observer 避免闪烁

2. **优化 IntersectionObserver 配置**：
   - 将 `rootMargin` 从 `"0px 0px -70% 0px"` 调整为 `"-120px 0px -50% 0px"`
   - 顶部 `-120px` 考虑 Navbar 高度（约 96px）和 `scroll-mt-40`（约 160px），使观察区域从合理位置开始
   - 底部 `-50%` 将观察区域扩展到视口上半部分，提高标题被捕获的概率

3. **增加回退逻辑**：
   - 当没有标题可见时，如果当前 `activeId` 已存在且仍存在于 `ids` 列表中，保持当前值不变（避免闪烁清空）
   - 如果 `activeId` 为 `null` 且存在可见标题，设置第一个可见标题

4. **增加初始状态处理**：
   - 在 `useEffect` 初始化时，检查当前视口内是否有可见标题，如果有立即设置 `activeId`，避免页面加载后高亮为空

### 验证方式

1. 打开一篇包含多个 h2/h3 标题的博文
2. 缓慢滚动页面，观察目录中当前章节是否高亮（黄色背景）
3. 点击目录中的任意章节，确认：
   - 页面平滑滚动到对应位置
   - 被点击的目录项**立即**高亮显示
   - 滚动过程中高亮不会闪烁跳变
4. 快速滚动到页面底部，确认最后一个章节仍能被正确高亮
5. 刷新页面（带 hash 如 `#某章节`），确认页面滚动后对应目录项高亮

## 影响文件

- `app/src/hooks/useActiveHeading.ts`（主要修复）
- `app/src/components/TableOfContents.tsx`（无需修改，逻辑已正确）
- `app/src/pages/BlogPost.tsx`（无需修改，onItemClick 绑定方式兼容新签名）
