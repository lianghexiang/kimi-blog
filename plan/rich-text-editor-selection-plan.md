# 后台富文本编辑器选型与开发计划

## 1. 结论

当前项目最优的开源富文本编辑器方案，建议选择 **Milkdown**，并基于它重建后台文章编辑器。

这不是因为它“最流行”，而是因为它和当前 KimiBlog 的实际约束最贴合：

- 当前文章内容字段本质上是 **Markdown 字符串**
- 后台已经支持导入 `.md` / `.docx` 并转成 Markdown
- 前台文章页当前通过 `ReactMarkdown` 渲染正文
- 页面视觉是强定制的 neo-brutalism 风格，需要 **可完全自定义 UI**
- 后台编辑器需要自定义图片上传、工具栏 icon、中文界面，而不是一个套皮感很重的现成编辑器外观

在这个前提下，Milkdown 是最顺手的路线：它本身就是 **WYSIWYG Markdown editor**，而且是 **headless**，更适合现在的存储格式和页面风格。

## 2. 为什么选它

### 2.1 与项目数据链路最匹配

你现在的正文链路是：

`Markdown 导入 -> 后台编辑 -> 数据库存 Markdown -> 前台 ReactMarkdown 渲染`

Milkdown 的定位就是 Markdown 富文本编辑器，天然适配这条链路。  
这意味着我们不需要把后端正文格式切到 HTML 或 ProseMirror JSON，也不需要重写前台文章渲染逻辑。

### 2.2 更容易适配当前页面风格

Milkdown 官方强调它是 headless，并且“comes without any CSS”，这对当前后台非常重要。  
我们可以继续使用现有的：

- `Tailwind CSS`
- `shadcn/ui`
- `lucide-react`
- 现有圆角、描边、阴影、按钮交互

也就是说，编辑器功能由 Milkdown 提供，视觉壳层仍然完全归我们控制。

### 2.3 已有依赖基础，迁移成本最低

当前 `app/package.json` 已经安装了多组 `@milkdown/*` 依赖。  
这意味着比起整体切换到新生态，继续走 Milkdown 的真实成本更低，风险也更可控。

### 2.4 icon 支持没有问题

Milkdown 是 headless，不会限制工具栏图标方案。  
工具栏完全可以继续使用项目已经在用的 `lucide-react`，并按当前后台视觉做出一致的 icon button、hover、active、disabled 状态。

## 3. 为什么不是另外两类方案

### 3.1 不优先选 Tiptap

Tiptap 很强，React 生态和扩展能力都很成熟；如果未来我们准备把正文存储切到 HTML 或 Tiptap JSON，它会是非常强的候选。

但当前项目不适合把它当第一选择，核心原因有两个：

- Tiptap 的 Markdown 官方文档明确标注为 **Beta / early release**
- 当前项目是 **Markdown-first**，不是 HTML-first

如果现在切到 Tiptap，最自然的做法往往会把数据层往 HTML / JSON 推，这会让后端存储、前台渲染、导入导出策略一起变复杂。

### 3.2 不优先选 Lexical

Lexical 的性能和底层能力很好，但官方定位更偏“轻量、可组合、底层框架”。  
它官方也明确说自己 **不直接关心 UI、toolbars、rich-text features 和 markdown**，这些需要开发者通过插件和额外实现自己拼起来。

这对内容平台当然可做，但对当前项目来说，属于自由度很高、落地成本也更高的路线。  
它不如 Milkdown 那样直接对准“Markdown 富文本编辑”这个问题本身。

## 4. 最终建议

### 建议方案

采用 **Milkdown + 自定义工具栏 + 自定义图片上传 + Markdown 持久化**。

### 目标状态

后台文章编辑器最终应具备：

- 所见即所得编辑
- Markdown 双向同步
- 图标工具栏
- 标题、粗体、斜体、引用、列表、分割线、代码块、链接、图片
- 图片上传后自动插入 Markdown 图片语法
- 支持从已有 Markdown 内容回填编辑
- 支持编辑态 / 预览态切换
- 风格与当前后台 tab、按钮、表单一致

## 5. 详细开发计划

### Phase 0: 现状梳理与技术校准

目标：确认当前失败原因，避免在旧实现上继续补丁式修复。

任务：

1. 审核现有 [MilkdownEditor.tsx](/f:/Code/KimiBlog/app/src/components/MilkdownEditor.tsx) 的实现方式，确认是 API 接法问题、版本组合问题，还是生命周期管理问题。
2. 对齐当前安装的 `@milkdown/*` 版本，避免 `core/react/utils/plugin` 组合存在不兼容用法。
3. 评估是否直接改为 `@milkdown/kit` 聚合包，减少碎片包之间的接线复杂度。
4. 保留当前临时编辑器作为回退基线，避免改造期后台不可用。

产出：

- 一份最终依赖清单
- 一份“保留旧依赖 / 切 kit”决策

### Phase 1: 基础编辑器骨架

目标：让 Milkdown 稳定挂载、稳定回填、稳定输出 Markdown。

任务：

1. 新建正式编辑器组件，例如 `app/src/components/editor/PostRichEditor.tsx`
2. 用 Milkdown 的 React 集成重建编辑器实例
3. 实现以下基础能力：
   - 初始值回填
   - 内容变化时输出 Markdown
   - 外部表单值变化时同步回编辑器
   - 加载态与错误态
4. 将 `PostsTab` 中当前编辑器替换为新组件，但暂时不做复杂工具栏

验收标准：

- 新建文章时能正常输入
- 编辑已有文章时能正确回填旧内容
- 切换草稿/发布、标签、slug 等表单项不影响编辑器状态
- 不再出现“编辑器加载失败”或空白渲染

### Phase 2: 工具栏与 icon 体系

目标：把编辑体验做成真正可用的后台编辑器。

任务：

1. 新建自定义工具栏组件，例如 `EditorToolbar.tsx`
2. 全部使用 `lucide-react` icon
3. 工具栏首批功能：
   - 一级/二级标题
   - 加粗、斜体、删除线
   - 引用
   - 无序列表 / 有序列表 / 任务列表
   - 行内代码 / 代码块
   - 链接
   - 分割线
   - 撤销 / 重做
4. 按当前后台视觉统一按钮样式：
   - `rounded-lg` 或 `rounded-xl`
   - `neo-border`
   - hover/active 状态
   - 激活态高亮

验收标准：

- 所有工具栏操作可视可点
- 选区命令可用
- 图标风格与后台 tab/button 风格一致

### Phase 3: 图片上传与资源插入

目标：接通当前后端上传接口，让内容编辑闭环。

任务：

1. 复用现有 `api.images.upload(formData)` 接口
2. 支持以下插图方式：
   - 工具栏上传
   - 拖拽上传
   - 粘贴图片上传
3. 上传成功后自动插入 Markdown 图片语法
4. 增加上传中状态、失败提示、重复点击保护
5. 约束仅允许图片文件，给出中文错误提示

验收标准：

- 后台上传成功后正文立即出现图片
- 保存后前台文章页可正确显示
- 上传失败时不会破坏当前编辑内容

### Phase 4: Markdown 能力补齐

目标：让编辑器和当前内容体系完全兼容。

任务：

1. 支持 GFM 常用语法：
   - 表格
   - 任务列表
   - 删除线
2. 校验 `.md` / `.docx` 导入后的内容在编辑器内是否能正确展示
3. 确保以下场景不丢内容：
   - 标题层级
   - 列表嵌套
   - 链接
   - 引用
   - 图片
   - 代码块
4. 必要时增加“源码模式”或“Markdown 查看模式”，便于修正特殊语法

验收标准：

- 现有历史文章导入编辑器后结构不乱
- 保存后再打开，Markdown 内容前后一致

### Phase 5: 样式打磨与后台适配

目标：让编辑器看起来像这个项目原生的一部分。

任务：

1. 调整编辑器容器、工具栏、内容区域的层级与边框
2. 让输入态、focus 态、选区态与当前后台页面一致
3. 优化中文排版：
   - 标题字重
   - 段落行高
   - 引用块视觉
   - 代码块字体与滚动
4. 做移动端和窄屏兼容：
   - 工具栏换行
   - 小屏按钮密度
   - 内容区最小高度

验收标准：

- 风格与后台页面统一
- 手机和窄屏下可正常操作

### Phase 6: 测试与回归

目标：确保替换后不是“能演示”，而是“能长期用”。

测试范围：

1. 新建文章
2. 编辑旧文章
3. 保存草稿
4. 发布文章
5. Markdown 导入
6. Word 导入
7. 图片上传
8. 前台文章展示回归
9. 非管理员访问后台时无异常

建议补充：

- 为编辑器内容序列化增加单测
- 为图片上传插入逻辑增加最小回归测试
- 为 `PostsTab` 关键交互增加组件级测试

## 6. 需要改动的文件范围

预计主要涉及：

- `app/src/pages/admin/PostsTab.tsx`
- `app/src/components/MilkdownEditor.tsx` 或重命名为新的正式编辑器组件
- `app/src/components/editor/*`
- `app/src/index.css`
- `app/src/lib/api.ts`（如需补更清晰的上传封装）
- `app/package.json`（如需清理或调整 Milkdown 依赖）

## 7. 风险与规避

### 风险 1：Milkdown 版本组合复杂

规避：

- 优先统一依赖版本
- 尽量减少低层包手工拼接
- 评估改用 `@milkdown/kit`

### 风险 2：Markdown 特殊语法往返不一致

规避：

- 先定义支持语法白名单
- 对现有文章样本做回归测试
- 必要时保留源码模式作为兜底

### 风险 3：图片上传交互打断编辑体验

规避：

- 上传异步状态独立管理
- 失败不清空正文
- 插入位置明确，避免总是追加到文末

### 风险 4：样式与后台现有 UI 不统一

规避：

- 工具栏按钮直接复用当前按钮视觉语言
- 不引入第三方默认主题皮肤

## 8. 实施顺序建议

推荐按下面顺序推进：

1. 先修稳定挂载和 Markdown 同步
2. 再做工具栏命令
3. 再接图片上传
4. 最后做样式打磨和测试回归

这样可以确保后台尽快恢复可用，而不是在“完整大而全”完成前一直不可交付。

## 9. 备选决策

如果后续你决定把文章内容从 Markdown 存储切换为 HTML 或结构化 JSON，那么应重新评估 `Tiptap`。  
在那种未来路线下，Tiptap 很可能会成为更优选择。

但在 **当前项目架构不改动** 的前提下，**Milkdown 仍然是最优解**。

## 10. 参考来源

- Milkdown 官方文档：https://milkdown.dev/docs/api/react
- Milkdown 官方站点：https://milkdown.dev/
- Tiptap 官方概览：https://tiptap.dev/docs/editor/getting-started/overview
- Tiptap Markdown 文档：https://tiptap.dev/docs/editor/markdown
- Tiptap React 集成文档：https://tiptap.dev/docs/editor/getting-started/install/react
- Lexical 官方站点：https://lexical.dev/

关键参考点：

- Milkdown 官方将自己定义为 “plugin driven framework to build WYSIWYG Markdown editor”，并强调 headless、无内置 CSS
- Tiptap 官方文档中 Markdown 能力标注为 Beta / early release
- Lexical 官方将自己描述为 lean/minimal framework，并明确不直接关心 UI、toolbar、rich-text features 和 markdown
