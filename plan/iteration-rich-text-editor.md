# 我终于把博客那个假编辑器给换了

> 事情是这样的——我的后台文章编辑器，名字叫 `MilkdownEditor`，用了大半年，今天打开源码一看，它里面根本没有 Milkdown。

---

## 一、先说清楚：我们之前的编辑器有多离谱

如果你点进 `app/src/components/MilkdownEditor.tsx`，会发现一个哭笑不得的事实：

这个组件就叫 MilkdownEditor，package.json 里也确实装了全套 `@milkdown/*` 依赖，但打开代码——

```tsx
// 这就是我们的"富文本编辑器"
<textarea
  value={value}
  onChange={(e) => onChange(e.target.value)}
/>
```

对，就是个 `<textarea>`。上面一排按钮，点"加粗"就给你插个 `**`，点"标题"就插个 `# `。预览模式倒是花里胡哨，用 `ReactMarkdown` 渲染得挺好看，但编辑体验约等于在记笔记软件里写 Markdown。

说实话，如果只是我自己用，忍忍也就过去了。但问题是：

- **不会 Markdown 的人根本没法用**。我给朋友试了一下，他问"加粗按钮点了怎么没反应"——因为光标处确实多了两个星号，但 textarea 里看起来就是 `**加粗**`，对新手来说这跟没反应没有区别。
- **图片上传极其割裂**。点上传 → 选文件 → 等上传 → 回来发现编辑器里多了串 `![...](...)`。这流程断得稀碎。
- **想插个表格？做梦。** 纯手打 `|` 画表格，画完自己都看不下去。

更讽刺的是，我翻了下 git 历史，发现 somebody（可能就是我自己）**曾经真的尝试过集成 Milkdown**，装了一大堆依赖，最后不知道遇到什么坑，默默回退到了 textarea，但依赖一个都没卸。所以 `node_modules` 里养了一窝没工作的 Milkdown，白白占用体积。

这我不能忍。正好最近有空，决定彻底把它换掉。

---

## 二、选型：为什么选了 Tiptap，没继续用 Milkdown

其实我一开始是纠结的——毕竟 Milkdown 已经装了，要不要硬着头皮把它真正集成进去？

但调研了一圈之后，我投入了 Tiptap 的怀抱。原因很简单：**Tiptap 是 Headless 的。**

什么叫 Headless？就是它**根本不给你默认界面**。没有自带的工具栏，没有自带的按钮样式，没有自带的蓝色边框和灰色背景。它只给你一个编辑器内核，外面长什么样完全由你决定。

这听起来像是"更麻烦了"，但对我们这个项目来说简直是救命稻草。

因为我们的博客视觉风格是 **Neo-Brutalism（新粗野主义）**——粗黑边框、硬阴影、黄色高亮、霞鹜文楷字体。市面上现成的富文本编辑器，不管是 Milkdown 默认的 Nord 主题还是 CKEditor 那种商务蓝，跟我这个风格八竿子打不着。要用它们，我得写一大堆 `!important` 去覆盖预设样式，痛苦程度堪比手调 WordPress 主题。

而 Tiptap 呢？工具栏我自己拿 shadcn/ui 的 Button 拼，边框我自己加 `neo-border`，阴影我自己加 `neo-shadow-sm`，激活态我自己改成 `bg-yellow-400`。100% 控制权。

下面这张表是我当时做的对比，放出来给你们参考：

| | Tiptap | Milkdown | Slate |
|---|---|---|---|
| 能不能完全自定义样式 | ✅ 能，Headless | ⚠️ 能但很痛苦 | ✅ 能 |
| React 集成成熟度 | ✅ 非常成熟 | ⚠️ 还行 | ⚠️ 要自己封装 |
| Markdown 输入输出 | ✅ `tiptap-markdown` | ✅ 原生 | ❌ 需额外插件 |
| 社区大小 | ✅ 很大 | 较小 | 中等 |
| 我们项目历史 | 没用过 | ❌ 装过但弃用了 | 没用过 |

看到最后一行了吧？Milkdown 在我们项目里是有**前科**的——装过，试过，放弃了。我不想再踩一次别人踩过的坑。

所以结论很明确：**卸掉 Milkdown，上 Tiptap。**

---

## 三、动手：怎么一步步搭起来的

### 3.1 先把依赖整干净

第一步就是 uninstall 那堆僵尸依赖：

```bash
npm uninstall @milkdown/core @milkdown/react @milkdown/ctx ...（十几个）
```

然后装 Tiptap：

```bash
npm install @tiptap/react @tiptap/pm @tiptap/starter-kit \
  @tiptap/extension-image @tiptap/extension-link \
  @tiptap/extension-underline @tiptap/extension-placeholder \
  @tiptap/extension-bubble-menu @tiptap/extension-floating-menu \
  @tiptap/extension-table ... tiptap-markdown
```

这里有两个坑我必须提一下：

**坑 1：Markdown 包名别搞错**

Tiptap 官方并没有 `@tiptap/extension-markdown` 这个包。Markdown 双向转换要装的是社区包 **`tiptap-markdown`**。我一开始搜了半天没找到官方版，差点以为 Tiptap 不支持 Markdown 了，吓出一身冷汗。

**坑 2：`@tiptap/pm` 必须装**

这是 ProseMirror 的兼容层，很多教程不会写，但你不装的话，后面写自定义 Plugin 的时候会报找不到 `prosemirror-state` 之类的错。

### 3.2 自定义图片上传扩展

旧编辑器的图片上传是写在 React 组件里的——点按钮、弹文件选择框、调 API、手动插入 Markdown 字符串。这种方式有几个问题：

- 只能点击上传，不能拖拽
- 不能从剪贴板直接粘贴图片
- 上传逻辑和编辑器本身是两个世界的东西

这次我把它写成了 Tiptap 的 **ProseMirror Plugin**：

```ts
// extensions/ImageUpload.ts
export const ImageUpload = Extension.create<ImageUploadOptions>({
  name: "imageUpload",

  addProseMirrorPlugins() {
    return [
      new Plugin({
        props: {
          handleDrop: (view, event) => {
            // 拦截拖拽事件，过滤图片文件
            // 调 api.images.upload
            // 上传成功后在光标处插入 image Node
          },
          handlePaste: (view, event) => {
            // 拦截粘贴事件，同样逻辑
          },
        },
      }),
    ];
  },
});
```

注意这里有个很容易掉进去的坑：**返回值必须是 `new Plugin()` 实例数组**，不能直接返回 `{ props: {...} }` 这样的纯对象。TypeScript 会报类型错误，而且就算忽略了类型，运行时也不会生效。

```ts
// ❌ 错的
return [{ props: { handleDrop: ... } }];

// ✅ 对的
return [new Plugin({ props: { handleDrop: ... } })];
```

现在你可以直接从桌面拖一张图进编辑器，或者截图后直接 `Ctrl+V`，它会自动上传并插入，体验跟 Notion 差不多。

### 3.3 外部内容同步：最容易被忽略的坑

Tiptap 的 `useEditor({ content })` 默认把 `content` 只当**初始值**。这意味着：

你在编辑器里敲字 → `onUpdate` 触发 → `onChange` 把新 Markdown 传给父组件 → 父组件 `formData.content` 更新。**这条链路是正常的。**

但如果反过来呢？比如用户点了一个".docx 导入"按钮，用 `mammoth` + `turndown` 把 Word 文档转成 Markdown，然后 `setFormData({ content: markdown })`——**编辑器里不会变。** 因为 Tiptap 不会监听 `content` prop 的变化。

这个问题我测了好一会儿才发现。修复方案是在 `useTiptapEditor` 里加一个 `useEffect`：

```ts
useEffect(() => {
  if (!editor) return;
  const current = editor.storage.markdown?.getMarkdown() ?? "";
  if (current !== content) {
    editor.commands.setContent(content, { emitUpdate: false });
  }
}, [editor, content]);
```

注意第二个参数不是 `false`，而是 `{ emitUpdate: false }`。如果传布尔值，TypeScript 会怒斥你 "Type 'false' has no properties in common with type 'SetContentOptions'"，非常无情。

为什么要 `emitUpdate: false`？因为 `setContent` 本身会触发 `onUpdate`，如果不关掉，就会形成死循环：

```
setContent → onUpdate → onChange → setFormData → setContent → onUpdate → ...
```

### 3.4 气泡菜单和浮动菜单

这两个东西让编辑器的体验上了一个台阶。

**气泡菜单（Bubble Menu）**：你选中一段文字，头顶会浮出来一个小工具条，可以快捷加粗、斜体、加链接。不用每次都把鼠标移到顶部工具栏。

**浮动菜单（Floating Menu）**：你在空行按回车，左侧会浮出来几个按钮，快速插入标题、列表、引用块。

但这里我又踩了一个版本坑：网上很多 Tiptap 教程写气泡菜单是从 `@tiptap/react` 导入的，而且会给 `tippyOptions` prop：

```tsx
// 这些教程已经过时了
import { BubbleMenu } from "@tiptap/react";
<BubbleMenu tippyOptions={{ duration: 100 }}>
```

实际上，**新版 Tiptap 已经不用 tippy.js 了**，改用了 Floating UI。所以 `tippyOptions` 这个 prop 根本不存在。而且 `BubbleMenu` 和 `FloatingMenu` 要从子路径导入：

```tsx
import { BubbleMenu } from "@tiptap/react/menus";

// 没有 tippyOptions 了，直接写就行
<BubbleMenu editor={editor}>
  <button>...</button>
</BubbleMenu>
```

如果你也遇到同样的报错，不用怀疑人生，就是文档没跟上版本。

### 3.5 样式适配：让编辑器看起来像是我们家做的

因为 Tiptap 是 Headless，所有样式都自己写。我在 `index.css` 里建了一个 `.tiptap-editor` 命名空间，把 Neo-Brutalism 风格全部灌进去：

- 编辑区字体用 `var(--font-wenkai)`（霞鹜文楷）
- H1 底部加 2px 黑线
- 引用块左边 4px 黄色边框 + 浅黄背景
- 代码块黑底白字 + 圆角 + 黑色硬阴影
- 图片圆角 + 黑色边框 + 阴影
- 表格黄色表头 + 黑边框

工具栏按钮的激活态还做了位移效果：

```css
.editor-toolbar-btn[data-active="true"] {
  background: #facc15;   /* yellow-400 */
  border: 2px solid #000;
  box-shadow: 2px 2px 0px #000;
  transform: translate(1px, 1px);
}
```

按下去的时候会往右下陷一点，跟网站其他按钮的交互风格完全一致。

---

## 四、最终效果长什么样

现在打开后台写文章，体验是这样的：

**编辑模式**：
- 所见即所得。选中文字点加粗，立刻变粗，不是插星号。
- 顶部工具栏有：H1/H2/H3、加粗、斜体、下划线、删除线、行内代码、三种列表、引用块、链接、图片、表格、分割线，还有撤销/重做。
- 选中文字 → 头顶弹出气泡菜单。
- 空行回车 → 左侧弹出浮动菜单。
- 从桌面拖图片进来 → 直接上传并插入。
- 截图粘贴 → 同样直接上传并插入。

**预览模式**：
- 完全复用之前的 `react-markdown` 渲染。
- 跟前端文章详情页看起来一模一样，不用担心"后台看着好好的，发出去变样"。

**后端**：
- 完全没动。`content` 字段还是纯 Markdown 字符串。
- 创建文章、更新文章的接口一个参数都没改。
- 前端博客展示页也不需要改，因为它们本来就是在读 Markdown。

---

## 五、几点可以复用的经验

如果你也在给自己的项目选富文本编辑器，这几条可能帮你省点时间：

**1. 如果你的设计系统很独特，直接选 Headless**

不要幻想拿一个带预设 UI 的编辑器然后把它"改造"成你的风格。覆盖样式的成本往往比从头搭建还高。Tiptap、Slate 这种 Headless 方案，前期多花两小时拼工具栏，后期省掉一个礼拜的 CSS 攻坚战。

**2. 小心 `setContent` 的死循环**

编辑器组件最常见的坑就是内外数据同步。记住口诀：外部往里写用 `setContent(content, { emitUpdate: false })`，内部往外写用 `onUpdate`。

**3. 兼容历史数据比规范更重要**

我启用了 `html: true`，这意味着用户可以在 Markdown 里混写 HTML。这在 Markdown 纯主义者眼里可能不够"优雅"，但考虑到旧文章里可能有内嵌的 HTML（比如 `<iframe>` 视频），关闭它会导致内容丢失或显示异常。先保证不破坏已有内容，再谈规范洁癖。

**4. 把行为封装成 Plugin，而不是散落的事件回调**

图片上传、自定义快捷键、特殊粘贴处理……这些逻辑写在 React 的 `onDrop`、`onPaste` 里也能跑，但写成 ProseMirror Plugin 有两个好处：一是和编辑器事件系统真正绑定，二是方便单独测试。

---

## 六、接下来还可以搞什么

这次只做了核心功能和气泡/浮动菜单，接下来还有不少可以玩的：

- **Slash 命令**：输入 `/` 弹出命令面板，像 Notion 那样
- **代码块语法高亮**：接 `lowlight` 或 `shiki`，让代码块有颜色
- **数学公式**：接 KaTeX，支持写 LaTeX 公式
- **协同编辑**：上 Y.js + WebSocket，多人实时编辑同一篇文章

不过这些都是后话了。至少现在，我终于可以跟别人说"我们博客有自己的富文本编辑器"，而不是"我们博客有个带预览的 textarea"了。

---

*以上就是这次编辑器迭代的完整记录。如果你也在折腾 Tiptap，欢迎在评论区交流踩坑心得。*
