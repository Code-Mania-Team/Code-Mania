import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Editor from "@monaco-editor/react";
import { axiosPublic } from "../api/axios";
import { ArrowLeft, Edit, Save, X } from "lucide-react";
import styles from "../styles/Admin.module.css";
import TestCasesEditor from "../components/TestCasesEditor";
import MarkdownRenderer from "../components/MarkdownRenderer";
import examStyles from "../styles/ExamPage.module.css";

const LANG_SLUG_BY_COURSE = {
  python: "python",
  cpp: "cpp",
  javascript: "javascript",
};

const QuizManager = () => {
  const { course } = useParams();
  const navigate = useNavigate();
  const languageSlug = LANG_SLUG_BY_COURSE[course];

  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editingQuiz, setEditingQuiz] = useState(null);
  const [formData, setFormData] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchQuizzes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [course]);

  const fetchQuizzes = async () => {
    if (!languageSlug) {
      setQuizzes([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");
    try {
      const res = await axiosPublic.get(`/v1/admin/quizzes?language=${languageSlug}`, {
        withCredentials: true,
      });
      if (res.data?.success) {
        setQuizzes(res.data?.data || []);
        setError("");
      } else {
        setQuizzes([]);
        setError(res.data?.message || "Failed to fetch quizzes");
      }
    } catch (err) {
      console.error("Error fetching quizzes:", err);
      setQuizzes([]);
      setError(err?.response?.data?.message || err?.message || "Failed to fetch quizzes");
    } finally {
      setLoading(false);
    }
  };

  const toPrettyJsonString = (value, fallback = "") => {
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

  const handleEdit = async (quiz) => {
    setEditingQuiz(quiz.id);

    setFormData({
      ...quiz,
      test_cases: toPrettyJsonString(quiz.test_cases, "[]"),
    });

    try {
      const res = await axiosPublic.get(`/v1/admin/quizzes/${quiz.id}`, {
        withCredentials: true,
      });
      if (res.data?.success && res.data?.data) {
        const full = res.data.data;
        setFormData({
          ...full,
          test_cases: toPrettyJsonString(full.test_cases, "[]"),
        });
      }
    } catch (err) {
      console.error("Error fetching full quiz:", err);
    }
  };

  const handleCancel = () => {
    setEditingQuiz(null);
    setFormData({});
  };

  const handleSave = async () => {
    if (!editingQuiz) return;
    setSaving(true);

    try {
      const isCode = String(formData.quiz_type || "mcq").toLowerCase() === "code";

      let parsedTestCases = formData.test_cases;
      if (typeof parsedTestCases === "string") {
        const raw = parsedTestCases.trim();
        if (!raw) {
          parsedTestCases = [];
        } else {
          try {
            parsedTestCases = JSON.parse(raw);
          } catch {
            alert("Test cases must be valid JSON.");
            setSaving(false);
            return;
          }
        }
      }

      const payload = {
        quiz_title: formData.quiz_title,
        quiz_description: formData.quiz_description,
        quiz_type: formData.quiz_type,
        exp_total: formData.exp_total,
      };

      if (isCode) {
        // We no longer use code_prompt; keep it cleared to avoid legacy text showing.
        payload.code_prompt = null;
        payload.starting_code = formData.starting_code;
        payload.test_cases = parsedTestCases;
      }

      const res = await axiosPublic.patch(`/v1/admin/quizzes/${editingQuiz}`, payload, {
        withCredentials: true,
      });

      if (res.data?.success) {
        await fetchQuizzes();
        handleCancel();
      } else {
        alert(res.data?.message || "Failed to save quiz");
      }
    } catch (err) {
      console.error("Error saving quiz:", err);
      alert(err?.response?.data?.message || err?.message || "Failed to save quiz");
    } finally {
      setSaving(false);
    }
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
            <h1>Loading quizzes...</h1>
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
              {course.charAt(0).toUpperCase() + course.slice(1)} Quizzes
            </h2>
          </div>
        </div>

        <p className={styles.subtitle}>
          Manage {course} quizzes. Total: {quizzes.length} quiz{quizzes.length !== 1 ? "zes" : ""}
        </p>

        <div className={styles.panel}>
          {error ? (
            <div style={{ padding: 16 }}>
              <div className={styles.errorText}>{error}</div>
              <button className={styles.button} type="button" onClick={fetchQuizzes} style={{ marginTop: 10 }}>
                Retry
              </button>
            </div>
          ) : null}
          {quizzes.length === 0 ? (
            <p style={{ padding: 16, opacity: 0.7 }}>No quizzes found for this language.</p>
          ) : (
            quizzes.map((q) => (
              <div key={q.id} className={styles.exerciseRow}>
                {editingQuiz === q.id ? (
                  <div className={styles.exerciseEditor}>
                    <h3>Edit Quiz: {formData.quiz_title || q.quiz_title}</h3>
                    <QuizForm
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
                        #{q.id} — {q.quiz_title || q.route}
                      </div>
                      <div className={styles.exerciseMeta}>
                        Type: {q.quiz_type || "mcq"} · Route: {q.route} · XP: {q.exp_total ?? "-"} · Updated:{" "}
                        {q.updated_at ? new Date(q.updated_at).toLocaleDateString() : "-"}
                      </div>
                      {q.quiz_description ? (
                        <div className={styles.exerciseDescription}>
                          {String(q.quiz_description).slice(0, 180)}
                          {String(q.quiz_description).length > 180 ? "..." : ""}
                        </div>
                      ) : null}
                    </div>
                    <div className={styles.exerciseActions}>
                      <button className={styles.button} type="button" onClick={() => handleEdit(q)}>
                        <Edit size={16} />
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
};

const QuizForm = ({ formData, setFormData, onSave, onCancel, saving, languageSlug }) => {
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
    const slug = String(languageSlug || "").toLowerCase();
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

  const isCode = String(formData.quiz_type || "mcq").toLowerCase() === "code";

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

  const parseTestCases = () => {
    const raw = String(formData.test_cases ?? "[]").trim();
    if (!raw) return { cases: [], error: "" };
    try {
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return { cases: [], error: "Test cases JSON must be an array." };
      return { cases: parsed, error: "" };
    } catch {
      return { cases: [], error: "Invalid JSON in Test Cases." };
    }
  };

  const normalizeTestCase = (tc) => {
    const input = tc?.input ?? tc?.stdin ?? "";
    const expected = tc?.expected ?? tc?.expectedOutput ?? tc?.expected_output ?? "";
    const hidden = coerceBool(tc?.is_hidden ?? tc?.isHidden ?? tc?.hidden);
    return {
      hidden,
      input: hidden ? "Hidden test case" : toPrettyText(input),
      expected: hidden ? "Hidden" : toPrettyText(expected),
    };
  };

  const { cases: previewTestCases, error: previewTestCasesError } = parseTestCases();

  return (
    <div className={styles.formWithPreview}>
      <div className={styles.formGrid}>
      <div className={styles.formGroup}>
        <label>Quiz ID</label>
        <input type="number" value={formData.id || ""} disabled />
      </div>

      <div className={styles.formGroup}>
        <label>Type</label>
        <select
          value={formData.quiz_type || "mcq"}
          onChange={(e) => handleChange("quiz_type", e.target.value)}
        >
          <option value="mcq">mcq</option>
          <option value="code">code</option>
        </select>
      </div>

      <div className={styles.formGroup}>
        <label>XP Total</label>
        <input
          type="number"
          value={formData.exp_total ?? 0}
          onChange={(e) => handleChange("exp_total", e.target.value)}
        />
      </div>

      <div className={styles.formGroupFull}>
        <label>Quiz Title</label>
        <input
          type="text"
          className={styles.titleInput}
          value={formData.quiz_title || ""}
          onChange={(e) => handleChange("quiz_title", e.target.value)}
        />
      </div>

      <div className={styles.formGroupFull}>
        <label>Description</label>
        <div className={styles.jsonEditorWrap}>
          <Editor
            height="140px"
            language="markdown"
            theme="vs-dark"
            value={String(formData.quiz_description || "")}
            onChange={(v) => handleChange("quiz_description", v ?? "")}
            options={baseEditorOptions}
          />
        </div>
      </div>

      {isCode ? (
        <>
          <div className={styles.formGroupFull}>
            <label>Starting Code</label>
            <Editor
              height="240px"
              language={codeLanguage}
              theme="vs-dark"
              value={formData.starting_code || ""}
              onChange={(v) => handleChange("starting_code", v ?? "")}
              options={codeEditorOptions}
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
               <Editor
                 height="240px"
                 language="json"
                 theme="vs-dark"
                 value={formData.test_cases || "[]"}
                 onChange={(v) => handleChange("test_cases", v ?? "")}
                 options={baseEditorOptions}
               />
             </details>

             <details className={styles.helpDetails}>
               <summary className={styles.helpSummary}>Test cases JSON format</summary>
               <p className={styles.helpText}>
                 Must be a JSON array. Fields: <code>input</code>, <code>expected</code>, <code>is_hidden</code>.
               </p>
               <pre className={styles.helpCode}>
{`[
  { "input": "2 3", "expected": "5", "is_hidden": false },
  { "input": "-1 1", "expected": "0", "is_hidden": true }
]`}
               </pre>
             </details>
           </div>
         </>
       ) : null}

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
        <p className={styles.previewHint}>Matches exam preview styling.</p>

        <div className={styles.previewCard}>
          <div style={{ marginBottom: 10 }}>
            <div style={{ fontWeight: 900, color: "#f1f5f9" }}>
              {formData.quiz_title || "(Untitled Quiz)"}
            </div>
            <div style={{ fontSize: 12, color: "#94a3b8" }}>
              Type: {String(formData.quiz_type || "mcq")} · XP: {formData.exp_total ?? "-"}
            </div>
          </div>

          <div className={examStyles.lcDescription}>
            <div style={{ fontSize: 12, color: "#94a3b8", fontWeight: 800, marginBottom: 6 }}>Description</div>
            <MarkdownRenderer>{String(formData.quiz_description || "")}</MarkdownRenderer>
          </div>

          {isCode ? (
            <>
              <div style={{ marginTop: 12 }}>
                <div style={{ fontSize: 12, color: "#94a3b8", fontWeight: 800, marginBottom: 6 }}>Starting Code</div>
                <pre
                  style={{
                    margin: 0,
                    padding: "10px 10px",
                    borderRadius: 10,
                    background: "rgba(15,23,42,0.7)",
                    border: "1px solid rgba(255,255,255,0.08)",
                    color: "#e7eefc",
                    overflow: "auto",
                    fontSize: 12,
                    lineHeight: 1.6,
                    whiteSpace: "pre-wrap",
                  }}
                >
                  <code>{String(formData.starting_code || "") || "(empty)"}</code>
                </pre>
              </div>

              <div style={{ marginTop: 12 }}>
                <div style={{ fontSize: 12, color: "#94a3b8", marginBottom: 6, fontWeight: 700 }}>
                  Test Cases ({previewTestCases.length})
                </div>

                {previewTestCasesError ? (
                  <div className={styles.previewError}>{previewTestCasesError}</div>
                ) : previewTestCases.length === 0 ? (
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
                    {previewTestCases.length > 8 ? (
                      <div style={{ fontSize: 12, color: "#94a3b8" }}>Showing first 8 test cases.</div>
                    ) : null}
                  </div>
                )}
              </div>
            </>
          ) : null}
        </div>
      </aside>
    </div>
  );
};

export default QuizManager;
