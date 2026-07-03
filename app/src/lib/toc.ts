import GithubSlugger from "github-slugger";

export interface TocItem {
  id: string;
  level: number;
  text: string;
}

const ATX_HEADING_RE = /^(#{1,6})\s+(.+?)(?:\s+#*)?\s*$/gm;

function stripMarkdownInlineMarkup(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/__(.+?)__/g, "$1")
    .replace(/`(.+?)`/g, "$1")
    .replace(/\[(.+?)\]\(.+?\)/g, "$1")
    .trim();
}

export function extractToc(
  content: string,
  options: { minLevel?: number; maxLevel?: number } = {}
): TocItem[] {
  const { minLevel = 2, maxLevel = 3 } = options;
  const slugger = new GithubSlugger();
  const items: TocItem[] = [];

  let match;
  while ((match = ATX_HEADING_RE.exec(content)) !== null) {
    const level = match[1].length;
    const rawText = match[2].trim();
    const text = stripMarkdownInlineMarkup(rawText);
    const id = slugger.slug(text);

    items.push({ id, level, text });
  }

  return items.filter(item => item.level >= minLevel && item.level <= maxLevel);
}

export function slugify(text: string): string {
  const slugger = new GithubSlugger();
  return slugger.slug(text);
}
