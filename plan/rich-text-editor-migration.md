# 富文本编辑器升级计划：Tiptap 集成方案

> **目标**：将当前基于 `<textarea>` 的简易 Markdown 编辑器替换为真正的所见即所得（WYSIWYG）富文本编辑器，同时完整保留 Neo-Brutalism 视觉风格、现有图片上传流程及后端 Markdown 存储格式。

---

## 1. 现状分析

### 1.1 当前实现
- **组件位置**：`app/src/components/MilkdownEditor.tsx`
- **实际技术**：原生 `<textarea>` + `ReactMarkdown` 预览，并非真正的 Milkdown 编辑器
- **使用场景**：仅在 `pages/admin/PostsTab.tsx` 中用于文章 `content` 字段的创建与编辑
- **后端格式**：`content` 为纯 Markdown 字符串（`PostCreate` / `PostUpdate` schema）
- **已安装但未使用依赖**：`@milkdown/*` 全套（v7.20.0），`@milkdown/react` 等从未在业务代码中 import
- **已使用图标库**：`lucide-react`
- **UI 体系**：shadcn/ui + Tailwind CSS + 自定义 Neo-Brutalism 工具类

### 1.2 现有功能清单
| 功能 | 实现方式 | 保留策略 |
|------|----------|----------|
| 编辑/预览双模式 | Tab 切换 textarea / ReactMarkdown | 保留，Tiptap 编辑器区 + 右侧/下方预览面板 |
| 工具栏快捷插入 | Button 点击插入 Markdown 标记 | 替换为 Tiptap `editor.chain()` API |
| 图片上传 | 调用 `api.images.upload()` 后插入 `![alt](url)` | 保留，通过 Tiptap 自定义图片上传扩展实现 |
| 文档导入（.docx） | `mammoth` 提取 HTML → `turndown` 转 Markdown | 保留，通过 Tiptap 的 HTML/Markdown 导入实现 |
| Neo-Brutalism 样式 | `neo-border`、`neo-shadow`、`bg-[#FFF7D6]` 等 | 保留并在 Tiptap UI 中全面复刻 |

---

## 2. 技术选型分析

### 2.1 候选方案对比

| 维度 | **Tiptap** (推荐) | Milkdown (已安装) | Slate + Plate |
|------|-------------------|-------------------|---------------|
| **架构** | Headless (无默认 UI) | 插件化，部分预设 UI | 高度可定制 |
| **React 集成** | `@tiptap/react` 官方成熟 | `@milkdown/react` 可用 | 需自行封装 |
| **样式自由度** | ★★★★★ 完全由 Tailwind 控制 | ★★★☆☆ 主题体系较封闭 | ★★★★☆ |
| **Markdown 支持** | `@tiptap/extension-markdown` 官方支持 | Markdown 原生 | 需额外插件 |
| **社区/生态** | 最大，文档完善，插件丰富 | 较小，中文资料少 | 中等 |
| **Neo-Brutalism 适配** | 极佳，工具栏可完全自定义 | 困难，需覆盖大量预设样式 | 一般 |
| **包体积** | 中等（按需引入扩展） | 中等 | 较大 |
| **团队历史** | 无 | 曾全套安装但**最终弃用**（回退到 textarea） | 无 |

### 2.2 选型结论：**Tiptap**

**核心理由**：
1. **Headless 架构**与当前技术栈完美契合。Tiptap 不提供任何默认 UI，工具栏、气泡菜单、浮动菜单完全由 shadcn/ui Button + Tailwind 自定义，能 100% 还原 `neo-border`、`neo-shadow`、`bg-[#FFF7D6]` 等风格。
2. **React 集成成熟**。`useEditor` Hook + `<EditorContent>` 组件简洁可靠，与 React 19 StrictMode 兼容良好。
3. **Markdown 双向转换**。通过 `@tiptap/extension-markdown` 可无缝读写 Markdown，后端无需任何改动。
4. **图片上传扩展灵活**。可通过自定义 Node/Extension 将现有 `api.images.upload` 逻辑无缝接入。
5. **社区生态最大**。遇到边缘场景（如代码块高亮、表格、任务列表）时，官方或社区扩展基本覆盖。
6. **历史教训**。Milkdown 曾被团队全套引入却最终回退到 textarea，暗示其集成成本或灵活性存在问题，不应重复踩坑。

---

## 3. 目标功能清单

### Phase 1 — MVP（必须完成）
- [ ] WYSIWYG 编辑区（基于 Tiptap ProseMirror 视图）
- [ ] 编辑 / 预览 双模式切换
- [ ] 工具栏：标题（H1/H2/H3）、加粗、斜体、删除线、引用块、无序列表、有序列表、代码块、行内代码、分割线、链接、图片
- [ ] 图片上传（继承现有 `api.images.upload`，支持点击上传 + 拖拽粘贴）
- [ ] 文档导入（继承现有 mammoth + turndown 逻辑）
- [ ] Markdown 输入输出（与后端格式兼容）
- [ ] Neo-Brutalism 视觉风格全面适配

### Phase 2 — 增强体验（建议完成）
- [ ] 气泡菜单（Bubble Menu）：选中文本时弹出快捷格式化浮层
- [ ] 浮动菜单（Floating Menu）：空行时弹出快捷插入浮层
- [ ] Slash 命令（`/heading` 等）
- [ ] 任务列表（Todo List）
- [ ] 表格（Table）基础操作
- [ ] 字数统计
- [ ] 本地草稿自动保存（`localStorage`）

### Phase 3 — 进阶（可选）
- [ ] 协同编辑（Y.js + Tiptap Collaboration，需后端 WebSocket 支持）
- [ ] 多媒体嵌入（视频、iframe）
- [ ] 数学公式（KaTeX）

---

## 4. 组件架构设计

```
components/editor/
├── TiptapEditor.tsx          # 主编辑器容器（模式切换、工具栏布局、图片上传逻辑）
├── EditorContent.tsx           # Tiptap <EditorContent> 包装（Neo-Brutalism 编辑区样式）
├── EditorToolbar.tsx           # 顶部固定工具栏（所有格式按钮）
├── EditorBubbleMenu.tsx        # 选中文本气泡菜单（Phase 2）
├── EditorFloatingMenu.tsx      # 空行浮动菜单（Phase 2）
├── EditorPreview.tsx           # 预览面板（复用 react-markdown + 现有 prose 样式）
├── extensions/
│   ├── ImageUpload.ts          # 自定义图片上传扩展（调用 api.images.upload）
│   ├── MarkdownStorage.ts      # Markdown 输入输出配置
│   └── ...                     # 其他自定义扩展
└── hooks/
    └── useTiptapEditor.ts      # 封装 useEditor 初始化、扩展注册、事件监听
```

**关键设计决策**：
- **单文件职责分离**：`TiptapEditor.tsx` 作为唯一对外暴露的组件，保持与现有 `MilkdownEditor` 相同的 Props 接口（`value: string`, `onChange: (markdown: string) => void`），降低调用方迁移成本。
- **编辑器与预览并存**：Tiptap 本身提供 WYSIWYG，但仍保留预览模式，让用户确认 Markdown 渲染效果，降低学习成本。
- **图片上传解耦**：将上传逻辑封装为 Tiptap 自定义 Extension，而非在 React 层手动操作，使编辑器内部也能通过拖拽/粘贴直接触发上传。

---

## 5. 详细开发步骤

### Step 1 — 环境准备与依赖安装
**预计耗时**：0.5 天

```bash
cd app
npm uninstall @milkdown/core @milkdown/ctx @milkdown/plugin-listener \
  @milkdown/plugin-slash @milkdown/plugin-tooltip @milkdown/plugin-upload \
  @milkdown/preset-commonmark @milkdown/preset-gfm @milkdown/prose \
  @milkdown/react @milkdown/theme-nord @milkdown/transformer

npm install @tiptap/react @tiptap/pm @tiptap/starter-kit \
  @tiptap/extension-image @tiptap/extension-link @tiptap/extension-placeholder \
  @tiptap/extension-underline @tiptap/extension-markdown \
  @tiptap/extension-bubble-menu @tiptap/extension-floating-menu \
  @tiptap/extension-table @tiptap/extension-table-row \
  @tiptap/extension-table-cell @tiptap/extension-table-header \
  @tiptap/extension-task-list @tiptap/extension-task-item
```

> 注：`@tiptap/pm` 是 ProseMirror 的兼容层，必须安装。Phase 2 扩展（bubble-menu 等）可随 Step 5 一并安装。

**清理工作**：
- 删除 `app/src/components/MilkdownEditor.tsx`
- 删除 `app/src/index.css` 中未使用的 `[data-milkdown-root]` 样式段（约 180 行）
- 保留 `mammoth` 和 `turndown`（文档导入仍需使用）

### Step 2 — 自定义扩展开发
**预计耗时**：1 天

#### 2.1 Markdown 存储扩展配置
- 配置 `Markdown` 扩展，确保输入输出与现有数据格式一致
- 关键配置：`html: true`（支持 HTML 标签，兼容旧数据）、`breaks: false`

#### 2.2 图片上传扩展 (`ImageUpload.ts`)
- 监听编辑器内的 `drop` 和 `paste` 事件
- 检测到图片文件时，调用现有 `api.images.upload(formData)`
- 上传成功后插入 `<img>` Node，URL 回写为绝对路径
- UI 反馈：上传中在光标处显示 "正在上传..." 占位文本

#### 2.3 文档导入桥接
- 保留现有 `mammoth` + `turndown` 逻辑
- 在 `TiptapEditor` 组件层提供 `onImportDocx` 回调，读取 File 后转换为 Markdown 字符串，通过 `editor.commands.setContent()` 写入

### Step 3 — 核心编辑器组件开发
**预计耗时**：1.5 天

#### 3.1 `useTiptapEditor.ts`
```typescript
// 伪代码示意
export function useTiptapEditor({
  content,
  onChange,
}: {
  content: string;
  onChange: (markdown: string) => void;
}) {
  return useEditor({
    extensions: [
      StarterKit,
      Image,
      Link,
      Underline,
      Markdown.configure({ html: true }),
      Placeholder.configure({ placeholder: "在这里输入正文内容..." }),
      ImageUpload.configure({ uploadFn: api.images.upload }),
    ],
    content, // Markdown 输入
    onUpdate: ({ editor }) => {
      const markdown = editor.storage.markdown.getMarkdown();
      onChange(markdown);
    },
    editorProps: {
      attributes: {
        class: "prose prose-lg max-w-none focus:outline-none min-h-[24rem] px-4 py-4",
      },
    },
  });
}
```

#### 3.2 `EditorContent.tsx`
- 包装 Tiptap 的 `<EditorContent>`
- 外层容器应用 `rounded-xl neo-border bg-white overflow-hidden`
- 编辑区内部 Typography 使用现有 `prose` 变量和 `font-wenkai`

#### 3.3 `EditorToolbar.tsx`
- 完全复刻现有工具栏布局：左侧「编辑/预览」切换按钮组，右侧格式化按钮组
- 按钮全部使用 shadcn/ui `<Button variant="outline" size="icon">`
- 激活状态（active）样式：`bg-yellow-400 text-black neo-border`（与当前 Navbar active 状态一致）
- 非激活样式：`bg-white hover:bg-gray-50 neo-border neo-shadow-sm`
- 工具栏背景：`bg-[#FFF7D6]`（与现有完全一致）
- 每个按钮绑定 `editor.chain().focus().toggleBold().run()` 等命令
- 禁用状态：当命令不可执行时（如光标在代码块内不能加粗），按钮 `disabled` + `opacity-40`

#### 3.4 `TiptapEditor.tsx`（主组件）
- Props 保持与现有 `MilkdownEditorProps` 完全一致，实现替换时调用方零改动
- 内部状态：`mode: "write" | "preview"`
- `mode === "write"`：渲染 `EditorToolbar` + `EditorContent`
- `mode === "preview"`：渲染 `EditorPreview`（复用现有 ReactMarkdown + prose 样式）

### Step 4 — 样式深度适配（Neo-Brutalism）
**预计耗时**：1 天

#### 4.1 编辑区样式
在 `index.css` 中新增 `.tiptap-editor` 命名空间（或保留 Milkdown 样式段改为 Tiptap 适配）：

```css
/* 编辑器整体容器 */
.tiptap-editor .ProseMirror {
  font-family: var(--font-wenkai);
  color: #1a1a1a;
  line-height: 1.75;
  outline: none;
  min-height: 24rem;
}

/* 标题 */
.tiptap-editor h1 {
  font-size: 1.75rem;
  font-weight: 700;
  border-bottom: 2px solid #000;
  padding-bottom: 0.3em;
  margin-top: 1.5em;
  margin-bottom: 0.5em;
}
.tiptap-editor h2 {
  font-size: 1.5rem;
  font-weight: 700;
  margin-top: 1.2em;
  margin-bottom: 0.5em;
}
.tiptap-editor h3 {
  font-size: 1.25rem;
  font-weight: 700;
}

/* 引用块 */
.tiptap-editor blockquote {
  border-left: 4px solid #FBBF24;
  background: #FEF9C3;
  padding: 0.75em 1em;
  border-radius: 0 8px 8px 0;
  font-style: italic;
}

/* 代码 */
.tiptap-editor code {
  background: #f3f4f6;
  padding: 0.15em 0.4em;
  border-radius: 4px;
  font-size: 0.9em;
}
.tiptap-editor pre {
  background: #1f2937;
  color: #f9fafb;
  padding: 1em;
  border-radius: 12px;
  border: 2px solid #000;
  overflow-x: auto;
}

/* 图片 */
.tiptap-editor img {
  max-width: 100%;
  border-radius: 12px;
  border: 2px solid #000;
  box-shadow: 4px 4px 0px 0px #000;
  margin: 1em 0;
}

/* 选中高亮 */
.tiptap-editor .ProseMirror ::selection {
  background: #FEF9C3;
}

/* Placeholder */
.tiptap-editor .ProseMirror p.is-editor-empty:first-child::before {
  color: #9ca3af;
  content: attr(data-placeholder);
  float: left;
  height: 0;
  pointer-events: none;
}
```

#### 4.2 工具栏按钮激活态
激活态按钮增加 `translate` 微动效（与现有 hover 一致）：
```css
.editor-toolbar-btn[data-active="true"] {
  @apply bg-yellow-400 text-black neo-border;
  box-shadow: 2px 2px 0px 0px #000000;
  transform: translate(1px, 1px);
}
```

### Step 5 — 气泡菜单与浮动菜单（Phase 2）
**预计耗时**：1 天

#### 5.1 `EditorBubbleMenu.tsx`
- 选中任意文本时，在选区上方弹出迷你工具条
- 包含：加粗、斜体、删除线、行内代码、链接、标题转换
- 容器样式：`bg-white neo-border neo-shadow-sm rounded-xl px-2 py-1.5 flex gap-1`

#### 5.2 `EditorFloatingMenu.tsx`
- 空行回车时，在光标左侧弹出快捷插入菜单
- 包含：标题、无序列表、引用块、分割线、代码块
- 容器样式与 Bubble Menu 一致

### Step 6 — 调用方迁移与回归测试
**预计耗时**：0.5 天

#### 6.1 替换调用
在 `PostsTab.tsx` 中：
```typescript
// 修改前
import MilkdownEditor from "@/components/MilkdownEditor";
// ...
<MilkdownEditor value={...} onChange={...} />

// 修改后
import TiptapEditor from "@/components/editor/TiptapEditor";
// ...
<TiptapEditor value={...} onChange={...} />
```

#### 6.2 回归测试清单
| 测试项 | 期望结果 |
|--------|----------|
| 新建文章输入内容 | 内容正常回写到 formData.content |
| 编辑已有文章 | Tiptap 正确加载原有 Markdown，格式正确解析 |
| 加粗/斜体/标题 | 工具栏按钮可正常触发，Markdown 输出正确 |
| 图片上传 | 选择图片后正常上传并插入，预览可见 |
| 文档导入（.docx） | mammoth + turndown 转换后正确写入编辑器 |
| 预览模式 | 与编辑前一致的 ReactMarkdown 渲染效果 |
| 后端兼容性 | 创建/更新文章接口请求体 `content` 字段格式不变 |
| 移动端适配 | 工具栏横向滚动或换行，编辑区可正常输入 |

### Step 7 — 废弃文件清理
**预计耗时**：0.5 天

- [ ] 删除 `app/src/components/MilkdownEditor.tsx`
- [ ] 删除 `app/src/index.css` 中 `[data-milkdown-root]` 样式段
- [ ] 检查 `package.json` 确认 `@milkdown/*` 已移除，运行 `npm prune` 清理
- [ ] 运行 `npm run check` 确保 TypeScript 无错误
- [ ] 运行 `npm run lint` 确保 ESLint 通过
- [ ] 运行 `npm run build` 确保生产构建成功

---

## 6. 样式规范速查表

所有新增编辑器 UI 必须遵循以下 Neo-Brutalism 规范：

| 元素 | 类名/样式 |
|------|-----------|
| 主容器 | `rounded-xl neo-border bg-white overflow-hidden` |
| 工具栏背景 | `bg-[#FFF7D6]` |
| 工具栏分隔 | `border-b-2 border-gray-100` |
| 普通按钮 | `bg-white hover:bg-gray-50 neo-border neo-shadow-sm rounded-lg` |
| 激活按钮 | `bg-yellow-400 text-black neo-border shadow-[2px_2px_0px_#000] translate-x-px translate-y-px` |
| 主要操作按钮 | `bg-yellow-400 text-black neo-border neo-shadow-sm hover:-translate-y-px hover:shadow-[3px_3px_0px_#000]` |
| 编辑区内边距 | `px-4 py-4` |
| 编辑区最小高度 | `min-h-[24rem]` |
| 引用块左边框 | `border-l-4 border-yellow-400 bg-yellow-50` |
| 代码块背景 | `bg-gray-900 text-white rounded-xl neo-border` |
| 图片边框 | `rounded-xl neo-border neo-shadow-sm` |
| 字体 | `font-family: var(--font-wenkai)` |
| 选中高亮 | `bg-yellow-100` |

---

## 7. 与现有系统集成点

### 7.1 后端接口（零改动）
- `POST /api/posts` 与 `PUT /api/posts/{id}` 的 `content` 字段仍接收纯字符串
- 预览页（`BlogPost.tsx`、`Blog.tsx` 等）仍使用 `react-markdown` 渲染，无需改动

### 7.2 图片上传（复用现有 API）
- 继续调用 `api.images.upload(formData)`
- 上传成功后 Tiptap 插入的 `<img src="...">` 在输出 Markdown 时自动转为 `![alt](url)`

### 7.3 文档导入（复用现有逻辑）
- 保留 `PostsTab.tsx` 中的 `importMammoth` 和 `importTurndown` 动态导入
- 转换后的 Markdown 字符串通过 `editor.commands.setContent(markdown)` 注入 Tiptap

---

## 8. 测试策略

- **单元测试**：在 `app/src/components/editor/` 下新增 `TiptapEditor.test.tsx`
  - 测试编辑器初始化时正确解析传入的 Markdown
  - 测试 `onChange` 回调在内容修改后输出正确的 Markdown
  - 测试图片上传 Extension 的 drop 事件处理
- **集成测试**：在 `PostsTab.tsx` 层面测试完整新建/编辑文章流程
- **视觉回归**：人工检查编辑器在编辑模式、预览模式、空状态、长内容状态下的视觉表现
- **兼容性测试**：验证旧数据（已有文章的 Markdown）在新编辑器中加载后格式正确

---

## 9. 风险与回滚方案

| 风险 | 影响 | 缓解措施 |
|------|------|----------|
| Tiptap Markdown 扩展与旧数据格式不兼容 | 旧文章加载后格式错乱 | 配置 `html: true`，并选取 5-10 篇历史文章做加载测试 |
| 包体积增加 | 首屏加载变慢 | 按需引入扩展，避免全部打包；图片上传等重型逻辑保持异步/动态加载 |
| 图片上传 Extension 引入 bug | 无法插入图片 | 保留原有的文件 input fallback 逻辑，Tiptap 上传失败时仍可通过原方式插入 |
| 移动端体验下降 | 工具栏遮挡或操作困难 | 工具栏使用 `flex-wrap` + 小屏下的横向滚动，确保触控目标 ≥ 44px |

**回滚方案**：
- 所有改动集中在 `app/src/components/editor/` 目录下，且 `TiptapEditor` 与 `MilkdownEditor` Props 接口一致。
- 若需紧急回滚，只需将 `PostsTab.tsx` 的 import 改回 `MilkdownEditor` 即可。
- 建议在一个独立 feature branch 上开发，合并前完整回归测试。

---

## 10. 附录：完整依赖清单

### 需卸载
```
@milkdown/core @milkdown/ctx @milkdown/plugin-listener
@milkdown/plugin-slash @milkdown/plugin-tooltip @milkdown/plugin-upload
@milkdown/preset-commonmark @milkdown/preset-gfm @milkdown/prose
@milkdown/react @milkdown/theme-nord @milkdown/transformer
```

### 需安装
```
# 核心
@tiptap/react @tiptap/pm @tiptap/starter-kit

# 格式扩展
@tiptap/extension-image @tiptap/extension-link
@tiptap/extension-underline @tiptap/extension-placeholder
@tiptap/extension-markdown

# Phase 2 交互增强
@tiptap/extension-bubble-menu @tiptap/extension-floating-menu
@tiptap/extension-table @tiptap/extension-table-row
@tiptap/extension-table-cell @tiptap/extension-table-header
@tiptap/extension-task-list @tiptap/extension-task-item
```

### 保留（已有）
```
mammoth turndown react-markdown lucide-react
```

---

## 11. 时间估算

| 阶段 | 内容 | 预估工时 |
|------|------|----------|
| Step 1 | 环境准备、依赖替换、旧样式清理 | 0.5 天 |
| Step 2 | 自定义扩展（Markdown、图片上传、文档导入桥接） | 1 天 |
| Step 3 | 核心组件（useTiptapEditor、EditorContent、Toolbar、TiptapEditor） | 1.5 天 |
| Step 4 | Neo-Brutalism 样式深度适配 | 1 天 |
| Step 5 | 气泡菜单、浮动菜单（Phase 2） | 1 天 |
| Step 6 | 调用方迁移、回归测试 | 0.5 天 |
| Step 7 | 废弃文件清理、构建验证 | 0.5 天 |
| **合计** | | **约 6 天** |

> 若仅实现 Phase 1（MVP），预计 **3.5-4 天** 可完成并上线。
