import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { axiosPublic } from "../api/axios";
import { ArrowLeft, Edit, Save, X } from "lucide-react";
import styles from "../styles/Admin.module.css";
import examStyles from "../styles/ExamPage.module.css";
import TestCasesEditor from "../components/TestCasesEditor";
import JsonEditor from "../components/JsonEditor";
import Editor from "@monaco-editor/react";
import MarkdownRenderer from "../components/MarkdownRenderer";
import { useTheme } from "../context/ThemeProvider.jsx";

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

  const normalizeProblemDescriptionForApi = ({ input }) => {
    if (typeof input === "string") return { value: input.trim() };
    return { value: toPlainText(input) };
  };

  const handleEdit = async (problem) => {
    const legacySectionsToMarkdown = (value) => {
      if (value === null || value === undefined) return "";
      if (typeof value === "string") return value;
      if (!value || typeof value !== "object") return "";

      const sections = Array.isArray(value)
        ? value
        : Array.isArray(value.sections)
          ? value.sections
          : [];

      if (!sections.length) {
        try {
          return JSON.stringify(value, null, 2);
        } catch {
          return String(value);
        }
      }

      const parts = sections
        .map((s) => {
          const type = String(s?.type || "").toLowerCase();
          if (type === "heading") {
            const levelRaw = Number(s?.level || 2);
            const level = Number.isFinite(levelRaw) ? Math.min(6, Math.max(1, levelRaw)) : 2;
            const content = String(s?.content ?? "").trim();
            return content ? `${"#".repeat(level)} ${content}` : "";
          }
          if (type === "paragraph") {
            return String(s?.content ?? "").trimEnd();
          }
          if (type === "list") {
            const style = String(s?.style || "bullet").toLowerCase();
            const items = Array.isArray(s?.items) ? s.items : [];
            if (!items.length) return "";
            if (style === "number" || style === "ordered") {
              return items.map((it, idx) => `${idx + 1}. ${String(it ?? "").trim()}`).join("\n");
            }
            return items.map((it) => `- ${String(it ?? "").trim()}`).join("\n");
          }
          if (s?.content !== undefined) return String(s.content ?? "").trim();
          return "";
        })
        .map((s) => String(s || "").trimEnd())
        .filter((s) => s.trim().length);

      return parts.join("\n\n").trim();
    };

    setEditingProblem(problem.id);
    setFormData({
      ...problem,
      problem_description: legacySectionsToMarkdown(problem.problem_description),
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
          problem_description: legacySectionsToMarkdown(full.problem_description),
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

      const normalizedDescription = normalizeProblemDescriptionForApi({
        input: formData.problem_description,
        format: "markdown",
      });
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

        {editingProblem !== null ? (
          <aside className={styles.exerciseCheatSheetDock}>
            <RuntimeTestCasesCheatSheet title="Exam Runtime Test Cases" />
          </aside>
        ) : null}

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
                        languageSlug={languageSlug}
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

const RuntimeTestCasesCheatSheet = ({ title = "Runtime Test Cases" }) => {
  const runtimeMarkdown = `#### JSON format

\`\`\`json
[
  {
    "input": "3\\nAva 20 60 70 yes",
    "expected": "1\\n2",
    "is_hidden": false
  },
  {
    "input": "...",
    "expected": "...",
    "is_hidden": true
  }
]
\`\`\`

Use \`\\n\` for multi-line input/output.`;

  const supportedMarkdown = `#### Supported fields

- \`input\`: stdin fed to the program.
- \`expected\`: expected output/result.
- \`is_hidden\`: hide test case from learners in preview.

Tip: keep test cases as a valid JSON array.`;

  return (
    <>
      <div className={styles.previewTitle}>
        <span>{title}</span>
      </div>
      <p className={styles.previewHint}>Exam validation is mainly runtime test-case based.</p>
      <div className={styles.previewCard}>
        <MarkdownRenderer>{runtimeMarkdown}</MarkdownRenderer>
        <MarkdownRenderer>{supportedMarkdown}</MarkdownRenderer>
      </div>
    </>
  );
};

const ExamForm = ({ formData, setFormData, onSave, onCancel, saving, languageSlug }) => {
  const { theme } = useTheme();
  const editorTheme = theme === "light" ? "vs" : "vs-dark";

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const baseEditorOptions = {
    contextmenu: false,
    minimap: { enabled: false },
    fontSize: 13,
    automaticLayout: true,
    scrollBeyondLastLine: false,
    wordWrap: "on",
  };

  const codeLanguage = (() => {
    const raw =
      formData?.programming_language?.slug ||
      formData?.programming_languages?.slug ||
      languageSlug ||
      "";
    const slug = String(raw).toLowerCase();
    if (slug.includes("python")) return "python";
    if (slug.includes("javascript") || slug === "js") return "javascript";
    if (slug.includes("cpp") || slug.includes("c++")) return "cpp";
    return "plaintext";
  })();

  const codeEditorOptions = {
    ...baseEditorOptions,
    lineNumbers: "on",
    padding: { top: 10, bottom: 10 },
    fontFamily:
      'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
  };

  const previewMarkdown = String(formData.problem_description || "").trim();
  const previewError = "";

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
    const coerceBool = (value) => {
      if (value === true) return true;
      if (value === false) return false;
      if (value === 1) return true;
      if (value === 0) return false;
      if (typeof value === "string") {
        const s = value.trim().toLowerCase();
        if (s === "true" || s === "1" || s === "yes") return true;
        if (s === "false" || s === "0" || s === "no" || s === "") return false;
      }
      return Boolean(value);
    };

    const toPrettyText = (value) => {
      if (value === null || value === undefined) return "";
      if (typeof value === "string") return value;
      try {
        return JSON.stringify(value, null, 2);
      } catch {
        return String(value);
      }
    };

    const input = tc?.input ?? tc?.stdin ?? "";
    const expected = tc?.expected ?? tc?.expectedOutput ?? tc?.expected_output ?? "";
    const hidden = coerceBool(tc?.is_hidden ?? tc?.isHidden ?? tc?.hidden);

    return {
      input: hidden ? "Hidden test case" : toPrettyText(input),
      expected: hidden ? "Hidden" : toPrettyText(expected),
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
            className={styles.titleInput}
            value={formData.problem_title || ""}
            onChange={(e) => handleChange("problem_title", e.target.value)}
          />
        </div>

        <div className={styles.formGroupFull}>
          <label>Description</label>
          <div className={styles.jsonEditorWrap}>
            <Editor
              height="220px"
              language="markdown"
              theme={editorTheme}
              value={String(formData.problem_description || "")}
              onChange={(v) => handleChange("problem_description", v ?? "")}
              options={baseEditorOptions}
            />
          </div>
          <details className={styles.helpDetails}>
            <summary className={styles.helpSummary}>Description format notes (click to expand)</summary>
            <p className={styles.helpText}>
              This field supports Markdown (headings, lists, inline code with backticks, and fenced code blocks).
            </p>
          </details>
        </div>

        <div className={styles.formGroupFull}>
          <label>Starting Code</label>
          <div className={styles.jsonEditorWrap}>
            <Editor
              height="200px"
              language={codeLanguage}
              theme={editorTheme}
              value={String(formData.starting_code || "")}
              onChange={(v) => handleChange("starting_code", v ?? "")}
              options={codeEditorOptions}
            />
          </div>
        </div>

        <div className={styles.formGroupFull}>
          <label>Solution</label>
          <div className={styles.jsonEditorWrap}>
            <Editor
              height="240px"
              language={codeLanguage}
              theme={editorTheme}
              value={String(formData.solution || "")}
              onChange={(v) => handleChange("solution", v ?? "")}
              options={codeEditorOptions}
            />
          </div>
        </div>

        <div className={styles.formGroupFull}>
          <label>Test Cases</label>
          <TestCasesEditor
            value={formData.test_cases || "[]"}
            onChange={(v) => handleChange("test_cases", v ?? "[]")}
            allowFunctionMode={codeLanguage === "javascript"}
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
              (true/false). {codeLanguage === "javascript" ? <>Optional: <code>mode</code> and <code>functionName</code>. </> : null}
              Use <code>\\n</code> for new lines.
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
            {previewMarkdown ? (
              <MarkdownRenderer>{previewMarkdown}</MarkdownRenderer>
            ) : (
              <div style={{ fontSize: 13, color: "#94a3b8" }}>(No description)</div>
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

      <div className={styles.formActions} style={{ gridColumn: "1 / -1", marginTop: "16px" }}>
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
  );
};

export default ExamManager;
