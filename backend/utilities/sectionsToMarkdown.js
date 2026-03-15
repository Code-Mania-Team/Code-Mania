function normalizeSections(value) {
  if (value === null || value === undefined) return [];
  if (Array.isArray(value)) return value;

  if (typeof value === "object") {
    if (Array.isArray(value.sections)) return value.sections;
    return [];
  }

  return [];
}

function toText(value) {
  if (value === null || value === undefined) return "";
  if (typeof value === "string") return value;
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

function sectionToMarkdown(section) {
  if (!section || typeof section !== "object") return "";

  const type = String(section.type || "").toLowerCase();

  if (type === "heading") {
    const levelRaw = Number(section.level || 2);
    const level = Number.isFinite(levelRaw) ? Math.min(6, Math.max(1, levelRaw)) : 2;
    const content = toText(section.content).trim();
    if (!content) return "";
    return `${"#".repeat(level)} ${content}`;
  }

  if (type === "paragraph") {
    const content = toText(section.content).trimEnd();
    return content ? content : "";
  }

  if (type === "list") {
    const style = String(section.style || "bullet").toLowerCase();
    const items = Array.isArray(section.items) ? section.items : [];
    if (!items.length) return "";

    if (style === "number" || style === "ordered") {
      return items
        .map((it, idx) => `${idx + 1}. ${toText(it).trim()}`)
        .join("\n");
    }

    return items
      .map((it) => `- ${toText(it).trim()}`)
      .join("\n");
  }

  // Unknown section type: best-effort stringify.
  if (section.content !== undefined) {
    const content = toText(section.content).trim();
    return content;
  }

  return "";
}

export default function sectionsToMarkdown(value) {
  // If already a plain string, treat it as markdown.
  if (typeof value === "string") return value.trim();

  const sections = normalizeSections(value);
  if (!sections.length) return "";

  const parts = sections
    .map((s) => sectionToMarkdown(s))
    .map((s) => String(s || "").trimEnd())
    .filter((s) => s.trim().length > 0);

  return parts.join("\n\n").trim();
}
