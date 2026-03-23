import MarkdownIt from "markdown-it";
import DOMPurify from "dompurify";

const escapeHtml = (value) => {
  const s = String(value ?? "");
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");
};

const getAutoInlineCallRegex = (lang) => {
  const l = String(lang || "").toLowerCase();
  if (l === "python") {
    // Highlight common beginner builtins when written as text.
    return /\b(?:print|input|range|int|str|float|len)\(\)/g;
  }
  if (l === "javascript") {
    return /\b(?:console\.log|alert|prompt)\(\)/g;
  }
  if (l === "cpp" || l === "c" || l === "clike") {
    return /\b(?:cout|cin)\b/g;
  }
  return null;
};

const isFenceLine = (value) => {
  const s = String(value ?? "");
  return /^\s*```\s*([a-zA-Z0-9_+-]+)?\s*$/.test(s);
};

const md = new MarkdownIt({
  html: false,
  linkify: true,
  breaks: false,
  typographer: true,
});

const autoInlineCallBackticks = (markdown, lang) => {
  const src = String(markdown ?? "");
  const rx = getAutoInlineCallRegex(lang);
  if (!rx) return src;

  const lines = src.split(/\r?\n/);
  let inFence = false;
  const out = [];

  for (const line of lines) {
    if (isFenceLine(line)) {
      inFence = !inFence;
      out.push(line);
      continue;
    }

    if (inFence) {
      out.push(line);
      continue;
    }

    // Avoid touching existing inline code: split by backticks.
    const parts = String(line ?? "").split("`");
    for (let i = 0; i < parts.length; i += 1) {
      if (i % 2 === 0) {
        parts[i] = parts[i].replace(rx, (m) => `\`${m}\``);
      }
    }
    out.push(parts.join("`"));
  }

  return out.join("\n");
};

const sanitizeQuestHtml = (html) => {
  return DOMPurify.sanitize(String(html ?? ""), {
    ALLOWED_TAGS: [
      "p",
      "br",
      "hr",
      "h1",
      "h2",
      "h3",
      "h4",
      "h5",
      "h6",
      "strong",
      "em",
      "del",
      "blockquote",
      "ul",
      "ol",
      "li",
      "code",
      "pre",
      "table",
      "thead",
      "tbody",
      "tr",
      "th",
      "td",
      "a",
    ],
    ALLOWED_ATTR: ["class", "href", "target", "rel"],
  });
};

const tokenizeInlineSnippet = (snippet, lang) => {
  const s = String(snippet || "");
  const l = String(lang || "").toLowerCase();

  // Minimal, readable tokenization for common beginner snippets.
  if (l === "python") {
    const m = s.match(/^([a-zA-Z_][a-zA-Z0-9_]*)\(\)$/);
    if (m) {
      return (
        `<span class="token function">${escapeHtml(m[1])}</span>` +
        `<span class="token punctuation">(</span>` +
        `<span class="token punctuation">)</span>`
      );
    }
  }

  if (l === "javascript") {
    const m = s.match(/^(console\.log|alert|prompt)\(\)$/);
    if (m) {
      const name = m[1];
      if (name.includes(".")) {
        const [obj, prop] = name.split(".");
        return (
          `<span class="token variable">${escapeHtml(obj)}</span>` +
          `<span class="token punctuation">.</span>` +
          `<span class="token function">${escapeHtml(prop)}</span>` +
          `<span class="token punctuation">(</span>` +
          `<span class="token punctuation">)</span>`
        );
      }
      return (
        `<span class="token function">${escapeHtml(name)}</span>` +
        `<span class="token punctuation">(</span>` +
        `<span class="token punctuation">)</span>`
      );
    }
  }

  if (l === "cpp" || l === "c" || l === "clike") {
    if (s === "cout" || s === "cin") {
      return `<span class="token keyword">${escapeHtml(s)}</span>`;
    }
  }

  return null;
};

const findNextEmphasisMarker = (s, fromIndex) => {
  const idxBold = s.indexOf("**", fromIndex);
  const idxIt = s.indexOf("*", fromIndex);

  let idx = -1;
  let type = null;

  if (idxBold !== -1 && (idxIt === -1 || idxBold <= idxIt)) {
    idx = idxBold;
    type = "bold";
  } else if (idxIt !== -1) {
    // Skip '*' that is part of '**'
    if (s[idxIt + 1] === "*") {
      return findNextEmphasisMarker(s, idxIt + 2);
    }
    idx = idxIt;
    type = "italic";
  }

  return { idx, type };
};

const renderTextWithEmphasisAndAutoCodeSpans = (text, lang) => {
  const raw = String(text ?? "");
  if (!raw.includes("*")) return renderTextWithAutoCodeSpans(raw, lang);

  let out = "";
  let i = 0;

  while (i < raw.length) {
    const { idx, type } = findNextEmphasisMarker(raw, i);
    if (idx === -1) {
      out += renderTextWithAutoCodeSpans(raw.slice(i), lang);
      break;
    }

    if (idx > i) out += renderTextWithAutoCodeSpans(raw.slice(i, idx), lang);

    if (type === "bold") {
      const close = raw.indexOf("**", idx + 2);
      if (close === -1) {
        out += renderTextWithAutoCodeSpans(raw.slice(idx), lang);
        break;
      }
      const inner = raw.slice(idx + 2, close);
      if (inner.trim().length) {
        out += `<strong>${renderTextWithEmphasisAndAutoCodeSpans(inner, lang)}</strong>`;
      } else {
        out += renderTextWithAutoCodeSpans(raw.slice(idx, close + 2), lang);
      }
      i = close + 2;
      continue;
    }

    // italic
    const close = raw.indexOf("*", idx + 1);
    if (close === -1) {
      out += renderTextWithAutoCodeSpans(raw.slice(idx), lang);
      break;
    }
    const inner = raw.slice(idx + 1, close);
    if (inner.trim().length) {
      out += `<em>${renderTextWithEmphasisAndAutoCodeSpans(inner, lang)}</em>`;
    } else {
      out += renderTextWithAutoCodeSpans(raw.slice(idx, close + 1), lang);
    }
    i = close + 1;
  }

  return out;
};

const renderTextWithAutoCodeSpans = (text, lang) => {
  const raw = String(text ?? "");
  const re = getAutoInlineCallRegex(lang);
  if (!re) return escapeHtml(raw);

  let out = "";
  let last = 0;
  re.lastIndex = 0;
  let m;
  while ((m = re.exec(raw))) {
    const start = m.index;
    const end = start + m[0].length;
    if (start > last) out += escapeHtml(raw.slice(last, start));
    const tokenized = tokenizeInlineSnippet(m[0], lang);
    out += `<code class="cm-inline language-${escapeHtml(lang)}">${tokenized || escapeHtml(m[0])}</code>`;
    last = end;
  }
  if (last < raw.length) out += escapeHtml(raw.slice(last));
  return out;
};

const renderInlineMarkdown = (line, lang) => {
  const raw = String(line ?? "");

  // Simple backtick pairing: `code`
  const parts = raw.split("`");
  if (parts.length === 1) return renderTextWithEmphasisAndAutoCodeSpans(raw, lang);

  let out = "";
  for (let i = 0; i < parts.length; i += 1) {
    const chunk = parts[i];
    const isCode = i % 2 === 1;
    if (!chunk) continue;

    if (isCode) {
      const tokenized = tokenizeInlineSnippet(chunk, lang);
      out += `<code class="cm-inline language-${escapeHtml(lang)}">${tokenized || escapeHtml(chunk)}</code>`;
    } else {
      out += renderTextWithEmphasisAndAutoCodeSpans(chunk, lang);
    }
  }
  return out;
};

const renderMarkdownLinesToHtml = (lines, lang) => {
  const src = Array.isArray(lines) ? lines : String(lines ?? "").split(/\r?\n/);
  const out = [];

  let i = 0;
  const isBlank = (l) => String(l ?? "").trim().length === 0;

  while (i < src.length) {
    let line = String(src[i] ?? "");
    if (isBlank(line)) {
      i += 1;
      continue;
    }

    // Headings
    const h = line.match(/^\s*(#{1,6})\s+(.+?)\s*$/);
    if (h) {
      const levelRaw = h[1].length;
      const level = Math.min(4, Math.max(1, levelRaw));
      const content = h[2];
      out.push(
        `<div class="cm-heading cm-h${level}">${renderInlineMarkdown(content, lang)}</div>`
      );
      i += 1;
      continue;
    }

    // Unordered list
    const ul = line.match(/^\s*[-*]\s+(.+?)\s*$/);
    if (ul) {
      const items = [];
      while (i < src.length) {
        const l = String(src[i] ?? "");
        const m = l.match(/^\s*[-*]\s+(.+?)\s*$/);
        if (!m) break;
        items.push(m[1]);
        i += 1;
      }
      out.push(`<ul class="cm-list cm-ul">`);
      for (const it of items) {
        out.push(`<li class="cm-li">${renderInlineMarkdown(it, lang)}</li>`);
      }
      out.push(`</ul>`);
      continue;
    }

    // Ordered list
    const ol = line.match(/^\s*(\d+)\.\s+(.+?)\s*$/);
    if (ol) {
      const items = [];
      while (i < src.length) {
        const l = String(src[i] ?? "");
        const m = l.match(/^\s*(\d+)\.\s+(.+?)\s*$/);
        if (!m) break;
        items.push(m[2]);
        i += 1;
      }
      out.push(`<ol class="cm-list cm-ol">`);
      for (const it of items) {
        out.push(`<li class="cm-li">${renderInlineMarkdown(it, lang)}</li>`);
      }
      out.push(`</ol>`);
      continue;
    }

    // Paragraph: gather until blank line
    const para = [];
    while (i < src.length && !isBlank(src[i])) {
      const l = String(src[i] ?? "");
      // stop paragraph if next line is a heading/list
      if (/^\s*#{1,6}\s+/.test(l) || /^\s*[-*]\s+/.test(l) || /^\s*\d+\.\s+/.test(l)) {
        if (para.length === 0) {
          para.push(l);
          i += 1;
        }
        break;
      }
      para.push(l);
      i += 1;
    }

    const htmlLines = para.map((ln) => renderInlineMarkdown(ln, lang)).join("<br>");
    out.push(`<div class="cm-prose">${htmlLines}</div>`);
  }

  return out.join("");
};

const detectIndentCodeLines = (text) => {
  const lines = String(text ?? "").split(/\r?\n/);
  const blocks = [];

  let buf = [];
  let inCode = false;

  const flush = () => {
    if (!buf.length) return;
    blocks.push({ type: inCode ? "code" : "text", text: buf.join("\n") });
    buf = [];
  };

  for (const line of lines) {
    const looksLikeCode = /^\s{2,}\S/.test(line);
    if (looksLikeCode !== inCode) {
      flush();
      inCode = looksLikeCode;
    }
    buf.push(line);
  }
  flush();
  return blocks;
};

const parseBlocks = (text) => {
  const src = String(text ?? "");
  const lines = src.split(/\r?\n/);
  const blocks = [];

  const isFenceLine = (value) => {
    const s = String(value ?? "");
    return /^\s*```\s*([a-zA-Z0-9_+-]+)?\s*$/.test(s);
  };

  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    const fence = isFenceLine(line)
      ? String(line).match(/^\s*```\s*([a-zA-Z0-9_+-]+)?\s*$/)
      : null;
    if (!fence) {
      // Accumulate until next fence.
      const chunk = [];
      while (i < lines.length && !isFenceLine(lines[i])) {
        chunk.push(lines[i]);
        i += 1;
      }
      const asText = chunk.join("\n");
      const indentSplit = detectIndentCodeLines(asText);
      indentSplit.forEach((b) => blocks.push(b));
      continue;
    }

    // Fenced code
    const lang = (fence[1] || "").toLowerCase();
    i += 1;
    const code = [];
    while (i < lines.length && !/^\s*```\s*$/.test(lines[i])) {
      code.push(lines[i]);
      i += 1;
    }
    // Skip closing fence if present
    if (i < lines.length && /^\s*```\s*$/.test(lines[i])) i += 1;
    blocks.push({ type: "code", text: code.join("\n"), lang });
  }

  // Trim leading/trailing empty text blocks
  return blocks
    .map((b) => ({ ...b, text: String(b.text ?? "") }))
    .filter((b) => b.type === "code" || b.text.trim().length);
};

export const inferPrismLanguage = (quest) => {
  const slugRaw =
    quest?.programming_languages?.slug ||
    quest?.programming_languages?.name ||
    quest?.programmingLanguageSlug ||
    "";

  const slug = String(slugRaw).toLowerCase();
  if (slug.includes("python")) return "python";
  if (slug.includes("javascript") || slug === "js") return "javascript";
  if (slug.includes("c++") || slug.includes("cpp") || slug === "c") return "cpp";
  return "javascript";
};

export const renderQuestRichHtml = ({ lessonHeader, description, task, prismLanguage }) => {
  const head = String(lessonHeader ?? "").trim();
  const lang = String(prismLanguage || "javascript");
  const desc = autoInlineCallBackticks(String(description ?? "").trim(), lang);
  const taskText = autoInlineCallBackticks(String(task ?? "").trim(), lang);

  const chunks = [];
  chunks.push(`
<style>
  .cm-quest { font-family: Georgia, serif; color: #f5f0d6; line-height: 1.45; }
  .cm-quest .cm-lesson-header { font-weight: 700; color: #ffd37a; font-size: 18px; margin: 0 0 10px 0; }
  .cm-quest .cm-heading { color: #f7f0d3; margin: 10px 0 6px; line-height: 1.2; font-weight: 800; }
  .cm-quest .cm-h1 { font-size: 20px; }
  .cm-quest .cm-h2 { font-size: 18px; }
  .cm-quest .cm-h3 { font-size: 16px; }
  .cm-quest .cm-h4 { font-size: 15px; }
  .cm-quest .cm-prose { font-size: 16px; white-space: normal; }
  .cm-quest .cm-prose + .cm-prose { margin-top: 8px; }
  .cm-quest .cm-list { margin: 8px 0 10px; padding-left: 20px; }
  .cm-quest .cm-li { margin: 4px 0; font-size: 16px; }

  /* Classic markdown tags (markdown-it output) */
  .cm-quest h1, .cm-quest h2, .cm-quest h3, .cm-quest h4 { color: #f7f0d3; margin: 10px 0 6px; line-height: 1.2; font-weight: 800; }
  .cm-quest h1 { font-size: 20px; }
  .cm-quest h2 { font-size: 18px; }
  .cm-quest h3 { font-size: 16px; }
  .cm-quest h4 { font-size: 15px; }
  .cm-quest p { font-size: 16px; margin: 0 0 8px 0; white-space: normal; }
  .cm-quest ul, .cm-quest ol { margin: 8px 0 10px; padding-left: 20px; }
  .cm-quest li { margin: 4px 0; font-size: 16px; }
  .cm-quest blockquote { margin: 8px 0 10px; padding: 0.2rem 0.9rem; border-left: 3px solid rgba(255, 211, 122, 0.25); opacity: 0.95; }
  .cm-quest hr { border: none; border-top: 1px solid rgba(255, 211, 122, 0.18); margin: 12px 0; }
  .cm-quest table { width: 100%; border-collapse: collapse; margin: 10px 0; font-size: 15px; }
  .cm-quest th, .cm-quest td { border: 1px solid rgba(255,255,255,0.12); padding: 6px 8px; vertical-align: top; }
  .cm-quest th { background: rgba(255,255,255,0.06); color: #f7f0d3; }
  .cm-quest strong { font-weight: 800; }
  .cm-quest em { font-style: italic; }
  .cm-quest .cm-code { margin: 10px 0; padding: 12px 12px; border-radius: 10px; background: #0b1220; border: 1px solid rgba(255, 211, 122, 0.18); overflow-x: auto; -webkit-overflow-scrolling: touch; touch-action: pan-x; }
  .cm-quest .cm-code code { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace; font-size: 16px; }
  .cm-quest code.cm-inline { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace; font-size: 0.95em; background: rgba(10,16,28,0.65); border: 1px solid rgba(255,211,122,0.22); padding: 1px 6px; border-radius: 8px; color: #e2e8f0; }
  .cm-quest :not(pre) > code { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace; font-size: 0.95em; background: rgba(10,16,28,0.65); border: 1px solid rgba(255,211,122,0.22); padding: 1px 6px; border-radius: 8px; color: #e2e8f0; }
  .cm-quest pre { margin: 10px 0; padding: 12px 12px; border-radius: 10px; background: #0b1220; border: 1px solid rgba(255, 211, 122, 0.18); overflow-x: auto; -webkit-overflow-scrolling: touch; touch-action: pan-x; }
  .cm-quest pre code { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace; font-size: 16px; padding: 0; border: none; background: transparent; }

  /* Prism-like token colors (custom, lightweight) */
  .cm-quest .token.comment, .cm-quest .token.prolog, .cm-quest .token.doctype, .cm-quest .token.cdata { color: #94a3b8; }
  .cm-quest .token.punctuation { color: #cbd5e1; }
  .cm-quest .token.property, .cm-quest .token.tag, .cm-quest .token.boolean, .cm-quest .token.number, .cm-quest .token.constant, .cm-quest .token.symbol, .cm-quest .token.deleted { color: #f59e0b; }
  .cm-quest .token.selector, .cm-quest .token.attr-name, .cm-quest .token.string, .cm-quest .token.char, .cm-quest .token.builtin, .cm-quest .token.inserted { color: #a7f3d0; }
  .cm-quest .token.operator, .cm-quest .token.entity, .cm-quest .token.url, .cm-quest .token.variable { color: #93c5fd; }
  .cm-quest .token.atrule, .cm-quest .token.attr-value, .cm-quest .token.function, .cm-quest .token.class-name { color: #fbbf24; }
  .cm-quest .token.keyword { color: #38bdf8; }
  .cm-quest .token.regex, .cm-quest .token.important { color: #fb7185; }
  .cm-quest .token.important, .cm-quest .token.bold { font-weight: 700; }
  .cm-quest .token.italic { font-style: italic; }

  .cm-quest .cm-task { margin-top: 14px; padding: 12px 14px; border-radius: 12px; background: #0d2b00; border: 1px solid rgba(168, 255, 96, 0.25); }
  .cm-quest .cm-task-title { font-weight: 700; color: #d8ffb0; margin-bottom: 6px; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace; }
  .cm-quest .cm-task-body { color: #a8ff60; font-size: 16px; white-space: normal; }
</style>
`);

  chunks.push(`<div class="cm-quest">`);

  if (head) chunks.push(`<div class="cm-lesson-header">${escapeHtml(head)}</div>`);

  if (desc) {
    const rendered = md.render(desc);
    chunks.push(sanitizeQuestHtml(rendered));
  }

  if (taskText) {
    chunks.push(`<div class="cm-task">`);
    chunks.push(`<div class="cm-task-title">Task</div>`);
    const renderedTask = md.render(taskText);
    chunks.push(`<div class="cm-task-body">${sanitizeQuestHtml(renderedTask)}</div>`);
    chunks.push(`</div>`);
  }

  chunks.push(`</div>`);
  return chunks.join("");
};
