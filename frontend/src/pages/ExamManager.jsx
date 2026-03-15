import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { axiosPublic } from "../api/axios";
import { ArrowLeft, Edit, Save, X } from "lucide-react";
import styles from "../styles/Admin.module.css";
import examStyles from "../styles/ExamPage.module.css";
import TestCasesEditor from "../components/TestCasesEditor";
import JsonEditor from "../components/JsonEditor";

const LANG_SLUG_BY_COURSE = {
  python: "python",
  cpp: "cpp",
  javascript: "javascript",
};

const ExamManager = () => {
  const { course } = useParams();
  const navigate = useNavigate();
  const [problems, setProblems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingProblem, setEditingProblem] = useState(null);
  const [formData, setFormData] = useState({});
  const [saving, setSaving] = useState(false);

  const languageSlug = LANG_SLUG_BY_COURSE[course];

  useEffect(() => {
    fetchProblems();
  }, [course]);

  const fetchProblems = async () => {
    if (!languageSlug) {
      setProblems([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const response = await axiosPublic.get(`/v1/exam/problems?language=${languageSlug}`, {
        withCredentials: true,
      });
      if (response.data.success) {
        setProblems(response.data.data || []);
      }
    } catch (error) {
      console.error("Error fetching exam problems:", error);
    } finally {
      setLoading(false);
    }
  };

  const toPrettyJsonString = (value, fallback = "[]") => {
    if (value === null || value === undefined) return fallback;

    if (typeof value === "string") {
      const trimmed = value.trim();
      if (!trimmed) return fallback;
      try {
        return JSON.stringify(JSON.parse(trimmed), null, 2);
      } catch {
        return value;
      }
    }

    try {
      return JSON.stringify(value, null, 2);
    } catch {
      return fallback;
    }
  };

  const toPlainText = (value) => {
    if (value === null || value === undefined) return "";
    if (typeof value === "string") return value;
    if (typeof value === "number" || typeof value === "boolean") return String(value);

    if (typeof value === "object" && !Array.isArray(value) && Array.isArray(value.sections)) {
      return toPlainText(value.sections);
    }

    if (Array.isArray(value)) {
      return value
        .map((item) => {
          if (item && typeof item === "object") {
            if (typeof item.content === "string") return item.content;
            if (Array.isArray(item.items)) return item.items.join(" ");
          }
          return toPlainText(item);
        })
        .filter(Boolean)
        .join(" ");
    }

    if (typeof value === "object") {
      if (typeof value.text === "string") return value.text;
      if (typeof value.description === "string") return value.description;
      try {
        return JSON.stringify(value);
      } catch {
        return "";
      }
    }

    return "";
  };

  const normalizeProblemDescriptionForApi = (input) => {
    const normalizeParsed = (parsed) => {
      if (parsed === null || parsed === undefined) return { sections: [] };
      if (Array.isArray(parsed)) return { sections: parsed };
      if (typeof parsed === "object" && Array.isArray(parsed.sections)) return parsed;
      if (typeof parsed === "string") return { sections: [{ type: "paragraph", content: parsed }] };
      return { sections: [{ type: "paragraph", content: toPlainText(parsed) }] };
    };

    if (typeof input === "string") {
      const trimmed = input.trim();
      if (!trimmed) return { value: { sections: [] } };

      const looksJson = trimmed.startsWith("{") || trimmed.startsWith("[");
      if (looksJson) {
        try {
          const parsed = JSON.parse(trimmed);
          return { value: normalizeParsed(parsed) };
        } catch {
          return { error: "Problem description must be valid JSON." };
        }
      }

      return { value: { sections: [{ type: "paragraph", content: trimmed }] } };
    }

    return { value: normalizeParsed(input) };
  };

  const handleEdit = async (problem) => {
    setEditingProblem(problem.id);
    setFormData({
      ...problem,
      problem_description: toPrettyJsonString(problem.problem_description, ""),
      test_cases: toPrettyJsonString(problem.test_cases, "[]"),
    });

    try {
      const response = await axiosPublic.get(`/v1/admin/exam/problems/${problem.id}`, {
        withCredentials: true,
      });

      if (response.data?.success && response.data?.data) {
        const full = response.data.data;
        setFormData({
          ...full,
          problem_description: toPrettyJsonString(full.problem_description, ""),
          test_cases: toPrettyJsonString(full.test_cases, "[]"),
        });
      }
    } catch (error) {
      console.error("Error fetching full exam problem:", error);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      let parsedTestCases = formData.test_cases || [];

      if (typeof formData.test_cases === "string") {
        try {
          parsedTestCases = JSON.parse(formData.test_cases);
        } catch {
          alert("Test cases must be valid JSON.");
          setSaving(false);
          return;
        }
      }

      const normalizedDescription = normalizeProblemDescriptionForApi(formData.problem_description);
      if (normalizedDescription.error) {
        alert(normalizedDescription.error);
        setSaving(false);
        return;
      }

      const payload = {
        problem_title: formData.problem_title,
        problem_description: normalizedDescription.value,
        starting_code: formData.starting_code,
        solution: formData.solution,
        exp: formData.exp,
        test_cases: parsedTestCases,
      };

      const response = await axiosPublic.patch(
        `/v1/admin/exam/problems/${editingProblem}`,
        payload,
        { withCredentials: true }
      );

      if (response.data.success) {
        await fetchProblems();
        setEditingProblem(null);
        setFormData({});
      }
    } catch (error) {
      console.error("Error saving exam problem:", error);
      const message =
        error?.response?.data?.message || error?.message || "Error saving exam problem.";
      alert(message);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setEditingProblem(null);
    setFormData({});
  };

  if (!languageSlug) {
    return (
      <div className={styles.page}>
        <section className={styles.section}>
          <div className={styles.state}>
            <h1>Invalid course.</h1>
            <button className={styles.button} type="button" onClick={() => navigate("/admin")}>
              Back to Admin
            </button>
          </div>
        </section>
      </div>
    );
  }

  if (loading) {
    return (
      <div className={styles.page}>
        <section className={styles.section}>
          <div className={styles.state}>
            <h1>Loading exam problems...</h1>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <section className={styles.section}>
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <button
              className={styles.button}
              type="button"
              onClick={() => navigate("/admin")}
              style={{ marginRight: 16 }}
            >
              <ArrowLeft size={16} style={{ marginRight: 4 }} />
              Back to Admin
            </button>
            <h2 className={styles.title}>
              {course.charAt(0).toUpperCase() + course.slice(1)} Exam Problems
            </h2>
          </div>
        </div>

        <p className={styles.subtitle}>
          Manage {course} exam problems. Total: {problems.length} problem{problems.length !== 1 ? "s" : ""}
        </p>

        <div className={styles.panel}>
          {problems.length === 0 ? (
            <p style={{ padding: 16, opacity: 0.7 }}>No exam problems found for this language.</p>
          ) : (
            problems.map((problem) => {
              const descriptionText = toPlainText(problem.problem_description);

              return (
                <div key={problem.id} className={styles.exerciseRow}>
                  {editingProblem === problem.id ? (
                    <div className={styles.exerciseEditor}>
                      <h3>Edit Exam Problem: {problem.problem_title}</h3>
                      <ExamForm
                        formData={formData}
                        setFormData={setFormData}
                        onSave={handleSave}
                        onCancel={handleCancel}
                        saving={saving}
                      />
                    </div>
                  ) : (
                    <>
                      <div className={styles.exerciseLeft}>
                        <div className={styles.exerciseTitle}>
                          #{problem.id} — {problem.problem_title}
                        </div>
                        <div className={styles.exerciseMeta}>
                          XP: {problem.exp} ·
                          Language: {problem.programming_language?.name || problem.programming_languages?.name || course} ·
                          Updated: {problem.updated_at ? new Date(problem.updated_at).toLocaleDateString() : "-"}
                        </div>
                        {descriptionText && (
                          <div className={styles.exerciseDescription}>
                            {descriptionText.slice(0, 150)}
                            {descriptionText.length > 150 ? "..." : ""}
                          </div>
                        )}
                      </div>
                      <div className={styles.exerciseActions}>
                        <button
                          className={styles.button}
                          type="button"
                          onClick={() => handleEdit(problem)}
                        >
                          <Edit size={16} />
                        </button>
                      </div>
                    </>
                  )}
                </div>
              );
            })
          )}
        </div>
      </section>
    </div>
  );
};

const ExamForm = ({ formData, setFormData, onSave, onCancel, saving }) => {
  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const renderInlineCode = (text, keyPrefix = "t") => {
    const raw = String(text ?? "");
    if (!raw.includes("`")) return raw;

    const parts = raw.split("`");
    return parts.map((part, idx) => {
      const isCode = idx % 2 === 1;
      if (!isCode) return part;
      return (
        <code key={`${keyPrefix}-${idx}`} className={examStyles.lcInlineCode}>
          {part}
        </code>
      );
    });
  };

  const isBacktickWrapped = (value) => {
    const s = String(value ?? "").trim();
    return s.length >= 2 && s.startsWith("`") && s.endsWith("`") && s.slice(1, -1).trim().length > 0;
  };

  const stripBackticks = (value) => String(value ?? "").trim().replace(/^`/, "").replace(/`$/, "");

  const looksLikeExampleBlock = (value) => {
    const s = String(value ?? "");
    if (!s.includes("\n")) return false;
    return /(\bInput:|\bOutput:|\bExplanation:)/.test(s);
  };

  const getDescriptionPreview = (input) => {
    const trimmed = String(input ?? "").trim();
    if (!trimmed) return { sections: [], error: "" };

    const looksJson = trimmed.startsWith("{") || trimmed.startsWith("[");

    if (!looksJson) {
      return {
        sections: [{ type: "paragraph", content: trimmed }],
        error: "",
      };
    }

    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) return { sections: parsed, error: "" };
      if (parsed && typeof parsed === "object" && Array.isArray(parsed.sections)) {
        return { sections: parsed.sections, error: "" };
      }
      return {
        sections: [{ type: "paragraph", content: trimmed }],
        error: "Description JSON is valid but not in the expected shape (use { sections: [...] } or [...] ).",
      };
    } catch {
      return {
        sections: [{ type: "paragraph", content: trimmed }],
        error: "Invalid JSON in Description (previewing raw text).",
      };
    }
  };

  const { sections: previewSections, error: previewError } = getDescriptionPreview(
    formData.problem_description
  );

  const getTestCasesPreview = (input) => {
    const raw = String(input ?? "").trim();
    if (!raw) return { cases: [], error: "" };

    try {
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) {
        return { cases: [], error: "Test cases JSON must be an array." };
      }

      return { cases: parsed, error: "" };
    } catch {
      return { cases: [], error: "Invalid JSON in Test Cases." };
    }
  };

  const normalizeTestCase = (tc) => {
    const input = tc?.input ?? tc?.stdin ?? "";
    const expected = tc?.expected ?? tc?.expectedOutput ?? tc?.expected_output ?? "";
    const hidden = Boolean(tc?.is_hidden ?? tc?.isHidden);

    return {
      input: input === null || input === undefined ? "" : String(input),
      expected: expected === null || expected === undefined ? "" : String(expected),
      hidden,
    };
  };

  const { cases: previewTestCases, error: previewTestCasesError } = getTestCasesPreview(
    formData.test_cases
  );

  return (
    <div className={styles.formWithPreview}>
      <div className={styles.formGrid}>
        <div className={styles.formGroup}>
          <label>Problem ID</label>
          <input type="number" value={formData.id || ""} disabled />
        </div>

        <div className={styles.formGroup}>
          <label>XP</label>
          <input
            type="number"
            value={formData.exp || 0}
            onChange={(e) => handleChange("exp", Number(e.target.value))}
          />
        </div>

        <div className={styles.formGroupFull}>
          <label>Title</label>
          <input
            type="text"
            value={formData.problem_title || ""}
            onChange={(e) => handleChange("problem_title", e.target.value)}
          />
        </div>

        <div className={styles.formGroupFull}>
          <label>Description (JSON)</label>
          <div className={styles.jsonEditorWrap}>
            <JsonEditor
              height="220px"
              value={formData.problem_description || ""}
              onChange={(v) => handleChange("problem_description", v)}
            />
          </div>
          <details className={styles.helpDetails}>
            <summary className={styles.helpSummary}>Description JSON tags (click to expand)</summary>
            <p className={styles.helpText}>
              Use an object with <code>sections</code>. Each section supports <code>type</code>:
              <code>heading</code>, <code>paragraph</code>, <code>list</code>. Lists support
              <code>style</code>: <code>number</code> or <code>bullet</code>. Use backticks for inline code like
              <code>`n`</code>.
            </p>
            <pre className={styles.helpCode}>
{`{
  "sections": [
    { "type": "heading", "level": 2, "content": "Problem" },
    { "type": "paragraph", "content": "Use \`n\` warriors..." },
    {
      "type": "list",
      "style": "bullet",
      "items": [
        "\`1 <= n <= 100000\`",
        "\`age >= 18\`"
      ]
    }
  ]
}`}
            </pre>
            <p className={styles.helpText}>
              Tip: if a paragraph contains multi-line text with <code>Input:</code> and <code>Output:</code>, it will
              render like a LeetCode example block.
            </p>
          </details>
        </div>

        <div className={styles.formGroupFull}>
          <label>Starting Code</label>
          <textarea
            value={formData.starting_code || ""}
            onChange={(e) => handleChange("starting_code", e.target.value)}
            rows={6}
            style={{ fontFamily: "monospace" }}
          />
        </div>

        <div className={styles.formGroupFull}>
          <label>Solution</label>
          <textarea
            value={formData.solution || ""}
            onChange={(e) => handleChange("solution", e.target.value)}
            rows={6}
            style={{ fontFamily: "monospace" }}
          />
        </div>

        <div className={styles.formGroupFull}>
          <label>Test Cases</label>
          <TestCasesEditor
            value={formData.test_cases || "[]"}
            onChange={(v) => handleChange("test_cases", v ?? "[]")}
          />
          <details className={styles.helpDetails}>
            <summary className={styles.helpSummary}>Raw JSON (advanced)</summary>
            <div className={styles.jsonEditorWrap}>
              <JsonEditor
                height="240px"
                value={formData.test_cases || "[]"}
                onChange={(v) => handleChange("test_cases", v)}
              />
            </div>
          </details>

          <details className={styles.helpDetails}>
            <summary className={styles.helpSummary}>Test cases JSON format (click to expand)</summary>
            <p className={styles.helpText}>
              Must be a JSON array. Supported fields: <code>input</code>, <code>expected</code>, <code>is_hidden</code>
              (true/false). Use <code>\\n</code> for new lines.
            </p>
            <pre className={styles.helpCode}>
{`[
  {
    "input": "3\\nAva 20 60 70 yes\\n...\\n",
    "expected": "1\\n2\\n",
    "is_hidden": false
  },
  {
    "input": "...",
    "expected": "...",
    "is_hidden": true
  }
]`}
            </pre>
          </details>
        </div>

        <div className={styles.formActions}>
          <button className={styles.button} type="button" onClick={onSave} disabled={saving}>
            <Save size={16} style={{ marginRight: 4 }} />
            {saving ? "Saving..." : "Save"}
          </button>
          <button
            className={styles.button}
            type="button"
            onClick={onCancel}
            style={{ backgroundColor: "#6b7280" }}
            disabled={saving}
          >
            <X size={16} style={{ marginRight: 4 }} />
            Cancel
          </button>
        </div>
      </div>

      <aside className={styles.previewPanel}>
        <div className={styles.previewTitle}>
          <span>Preview</span>
          <span style={{ fontSize: 12, color: "#94a3b8", fontWeight: 600 }}>Live</span>
        </div>
        <p className={styles.previewHint}>This matches how the exam page renders the description.</p>

        {previewError && <div className={styles.previewError}>{previewError}</div>}
        {previewTestCasesError && <div className={styles.previewError}>{previewTestCasesError}</div>}

        <div className={styles.previewCard}>
          <div style={{ marginBottom: 10 }}>
            <div style={{ fontWeight: 800, color: "#f1f5f9" }}>
              {formData.problem_title || "(Untitled problem)"}
            </div>
            <div style={{ fontSize: 12, color: "#94a3b8" }}>XP: {Number(formData.exp || 0)}</div>
          </div>

          <div>
            {previewSections.length === 0 ? (
              <div style={{ fontSize: 13, color: "#94a3b8" }}>(No description)</div>
            ) : (
              previewSections.map((section, index) => {
                if (section?.type === "heading") {
                  const level = Math.min(4, Math.max(2, Number(section.level || 2)));
                  const Tag = `h${level}`;
                  const headingClass =
                    level === 2 ? examStyles.lcH2 : level === 3 ? examStyles.lcH3 : examStyles.lcH4;
                  return (
                    <Tag
                      key={index}
                      className={headingClass}
                      style={{ marginTop: index === 0 ? 0 : undefined }}
                    >
                      {renderInlineCode(section.content, `h-${index}`)}
                    </Tag>
                  );
                }

                if (section?.type === "paragraph") {
                  if (looksLikeExampleBlock(section.content)) {
                    return (
                      <pre key={index} className={examStyles.lcPre}>
                        <code>{String(section.content ?? "")}</code>
                      </pre>
                    );
                  }

                  return (
                    <p key={index} className={examStyles.lcParagraph}>
                      {renderInlineCode(section.content, `p-${index}`)}
                    </p>
                  );
                }

                if (section?.type === "list" && Array.isArray(section.items)) {
                  const ListTag = section.style === "number" ? "ol" : "ul";

                  const allCodeOnly = section.items.length > 0 && section.items.every(isBacktickWrapped);
                  if (allCodeOnly) {
                    return (
                      <div key={index} className={examStyles.lcListWrap}>
                        <div className={examStyles.lcChipRow}>
                          {section.items.map((item, i) => (
                            <span key={i} className={examStyles.lcChip}>
                              {stripBackticks(item)}
                            </span>
                          ))}
                        </div>
                      </div>
                    );
                  }

                  return (
                    <div key={index} className={examStyles.lcListWrap}>
                      <ListTag className={examStyles.lcList}>
                        {section.items.map((item, i) => (
                          <li key={i} className={examStyles.lcListItem}>
                            {renderInlineCode(item, `li-${index}-${i}`)}
                          </li>
                        ))}
                      </ListTag>
                    </div>
                  );
                }

                if (section?.content) {
                  return (
                    <p key={index} style={{ margin: "0 0 0.65rem 0", color: "#cbd5e1" }}>
                      {String(section.content)}
                    </p>
                  );
                }

                return null;
              })
            )}
          </div>

          {formData.starting_code && (
            <div style={{ marginTop: 12 }}>
              <div style={{ fontSize: 12, color: "#94a3b8", marginBottom: 6, fontWeight: 700 }}>
                Starting Code
              </div>
              <pre
                style={{
                  margin: 0,
                  padding: "10px 10px",
                  borderRadius: 8,
                  background: "rgba(15,23,42,0.7)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  color: "#e7eefc",
                  overflow: "auto",
                  fontSize: 12,
                  lineHeight: 1.6,
                }}
              >
                <code>{formData.starting_code}</code>
              </pre>
            </div>
          )}

          <div style={{ marginTop: 12 }}>
            <div style={{ fontSize: 12, color: "#94a3b8", marginBottom: 6, fontWeight: 700 }}>
              Test Cases ({previewTestCases.length})
            </div>

            {previewTestCases.length === 0 ? (
              <div style={{ fontSize: 13, color: "#94a3b8" }}>(No test cases)</div>
            ) : (
              <div className={examStyles.lcTestCasesScroll} style={{ display: "grid", gap: 10 }}>
                {previewTestCases.slice(0, 8).map((tc, idx) => {
                  const normalized = normalizeTestCase(tc);

                  return (
                    <div
                      key={idx}
                      style={{
                        borderRadius: 10,
                        background: "rgba(255,255,255,0.03)",
                        border: "1px solid rgba(255,255,255,0.06)",
                        padding: 10,
                      }}
                    >
                      <div style={{ fontSize: 12, color: "#e7eefc", fontWeight: 800, marginBottom: 8 }}>
                        Test {idx + 1} {normalized.hidden ? "(Hidden)" : ""}
                      </div>

                      <div style={{ fontSize: 12, color: "#94a3b8", fontWeight: 700 }}>Input</div>
                      <pre
                        style={{
                          margin: "6px 0 10px 0",
                          padding: "8px 8px",
                          borderRadius: 8,
                          background: "rgba(15,23,42,0.7)",
                          border: "1px solid rgba(255,255,255,0.08)",
                          color: "#e7eefc",
                          overflow: "auto",
                          fontSize: 12,
                          lineHeight: 1.6,
                          whiteSpace: "pre-wrap",
                        }}
                      >
                        <code>{normalized.input || "(empty)"}</code>
                      </pre>

                      <div style={{ fontSize: 12, color: "#94a3b8", fontWeight: 700 }}>Expected Output</div>
                      <pre
                        style={{
                          margin: "6px 0 0 0",
                          padding: "8px 8px",
                          borderRadius: 8,
                          background: "rgba(15,23,42,0.7)",
                          border: "1px solid rgba(255,255,255,0.08)",
                          color: "#e7eefc",
                          overflow: "auto",
                          fontSize: 12,
                          lineHeight: 1.6,
                          whiteSpace: "pre-wrap",
                        }}
                      >
                        <code>{normalized.expected || "(empty)"}</code>
                      </pre>
                    </div>
                  );
                })}
                {previewTestCases.length > 8 && (
                  <div style={{ fontSize: 12, color: "#94a3b8" }}>
                    Showing first 8 test cases.
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </aside>
    </div>
  );
};

export default ExamManager;
