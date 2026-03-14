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

const renderInlineCode = (line, lang) => {
  const raw = String(line ?? "");

  // Simple backtick pairing: `code`
  const parts = raw.split("`");
  if (parts.length === 1) return renderTextWithAutoCodeSpans(raw, lang);

  let out = "";
  for (let i = 0; i < parts.length; i += 1) {
    const chunk = parts[i];
    const isCode = i % 2 === 1;
    if (!chunk) continue;

    if (isCode) {
      const tokenized = tokenizeInlineSnippet(chunk, lang);
      out += `<code class="cm-inline language-${escapeHtml(lang)}">${tokenized || escapeHtml(chunk)}</code>`;
    } else {
      out += renderTextWithAutoCodeSpans(chunk, lang);
    }
  }
  return out;
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

  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    const fence = line.match(/^\s*```\s*([a-zA-Z0-9_+-]+)?\s*$/);
    if (!fence) {
      // Accumulate until next fence.
      const chunk = [];
      while (i < lines.length && !/^\s*```/.test(lines[i])) {
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
  const desc = String(description ?? "").trim();
  const taskText = String(task ?? "").trim();
  const lang = String(prismLanguage || "javascript");

  const chunks = [];
  chunks.push(`
<style>
  .cm-quest { font-family: Georgia, serif; color: #f5f0d6; line-height: 1.45; }
  .cm-quest .cm-lesson-header { font-weight: 700; color: #ffd37a; font-size: 18px; margin: 0 0 10px 0; }
  .cm-quest .cm-prose { font-size: 16px; white-space: normal; }
  .cm-quest .cm-prose + .cm-prose { margin-top: 8px; }
  .cm-quest .cm-code { margin: 10px 0; padding: 12px 12px; border-radius: 10px; background: #0b1220; border: 1px solid rgba(255, 211, 122, 0.18); overflow-x: auto; }
  .cm-quest .cm-code code { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace; font-size: 14px; }
  .cm-quest code.cm-inline { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace; font-size: 0.95em; background: rgba(10,16,28,0.65); border: 1px solid rgba(255,211,122,0.22); padding: 1px 6px; border-radius: 8px; color: #e2e8f0; }

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
  .cm-quest .cm-task-body { color: #a8ff60; font-size: 16px; white-space: pre-wrap; }
</style>
`);

  chunks.push(`<div class="cm-quest">`);

  if (head) chunks.push(`<div class="cm-lesson-header">${escapeHtml(head)}</div>`);

  if (desc) {
    const blocks = parseBlocks(desc);
    for (const b of blocks) {
      if (b.type === "code") {
        const code = String(b.text || "").replace(/^\s{2}/gm, "");
        const blockLang = (b.lang || lang).toLowerCase();
        chunks.push(
          `<pre class="cm-code"><code class="language-${escapeHtml(blockLang)}">${escapeHtml(code)}</code></pre>`
        );
      } else {
        const lines = String(b.text || "").split(/\r?\n/);
        const htmlLines = lines.map((ln) => renderInlineCode(ln, lang)).join("<br>");
        chunks.push(`<div class="cm-prose">${htmlLines}</div>`);
      }
    }
  }

  if (taskText) {
    chunks.push(`<div class="cm-task">`);
    chunks.push(`<div class="cm-task-title">Task</div>`);
    const taskLines = taskText.split(/\r?\n/).map((ln) => renderInlineCode(ln, lang)).join("<br>");
    chunks.push(`<div class="cm-task-body">${taskLines}</div>`);
    chunks.push(`</div>`);
  }

  chunks.push(`</div>`);
  return chunks.join("");
};
