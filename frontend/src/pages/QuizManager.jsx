import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Editor from "@monaco-editor/react";
import { axiosPublic } from "../api/axios";
import { ArrowLeft, Edit, Save, X } from "lucide-react";
import styles from "../styles/Admin.module.css";
import TestCasesEditor from "../components/TestCasesEditor";
import MarkdownRenderer from "../components/MarkdownRenderer";

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
    const initialPromptFormat =
      typeof quiz.code_prompt === "object" && quiz.code_prompt !== null
        ? "json"
        : String(quiz.code_prompt ?? "").trim().startsWith("{") ||
          String(quiz.code_prompt ?? "").trim().startsWith("[")
          ? "json"
          : "markdown";
    setFormData({
      ...quiz,
      code_prompt: toPrettyJsonString(quiz.code_prompt, quiz.code_prompt || ""),
      code_prompt_format: initialPromptFormat,
      test_cases: toPrettyJsonString(quiz.test_cases, "[]"),
    });

    try {
      const res = await axiosPublic.get(`/v1/admin/quizzes/${quiz.id}`, {
        withCredentials: true,
      });
      if (res.data?.success && res.data?.data) {
        const full = res.data.data;
        const fullPromptFormat =
          typeof full.code_prompt === "object" && full.code_prompt !== null
            ? "json"
            : String(full.code_prompt ?? "").trim().startsWith("{") ||
              String(full.code_prompt ?? "").trim().startsWith("[")
              ? "json"
              : "markdown";
        const normalizedCodePrompt = toPrettyJsonString(full.code_prompt, full.code_prompt || "");
        const normalizedDescription = String(full.quiz_description || "").trim();

        setFormData({
          ...full,
          // Keep code_prompt in state for backward compatibility, but the UI
          // edits the prompt via quiz_description.
          code_prompt: normalizedCodePrompt,
          code_prompt_format: fullPromptFormat,
          quiz_description:
            normalizedDescription ||
            (typeof full.code_prompt === "string" ? String(full.code_prompt) : normalizedCodePrompt),
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

      // For code quizzes: treat quiz_description as the learner-visible prompt.
      // Keep code_prompt stored in the DB but hide it in the admin UI.
      let normalizedPrompt = String(formData.quiz_description ?? "");
      if (!normalizedPrompt.trim()) {
        normalizedPrompt = typeof formData.code_prompt === "string" ? formData.code_prompt : "";
      }

      const payload = {
        quiz_title: formData.quiz_title,
        quiz_description: formData.quiz_description,
        quiz_type: formData.quiz_type,
        exp_total: formData.exp_total,
      };

      if (isCode) {
        payload.code_prompt = normalizedPrompt;
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
                    <div className={styles.editorHeaderRow}>
                      <div>
                        <h3 className={styles.editorHeaderTitle}>
                          Edit Quiz: {formData.quiz_title || q.quiz_title}
                        </h3>
                        <div className={styles.editorHeaderMeta}>
                          <span className={`${styles.badge} ${styles.badgeBlue}`}>#{q.id}</span>
                          <span className={`${styles.badge} ${String(formData.quiz_type || q.quiz_type || "mcq").toLowerCase() === "code" ? styles.badgeGreen : styles.badgeAmber}`}>
                            {String(formData.quiz_type || q.quiz_type || "mcq").toLowerCase()}
                          </span>
                          <span className={styles.badge}>XP {Number(formData.exp_total ?? q.exp_total ?? 0)}</span>
                          {q.route ? <span className={styles.badge}>{q.route}</span> : null}
                        </div>
                      </div>
                    </div>

                    <QuizForm
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

const QuizForm = ({ formData, setFormData, onSave, onCancel, saving }) => {
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

  const isCode = String(formData.quiz_type || "mcq").toLowerCase() === "code";

  const safeParseJson = (value) => {
    if (value === null || value === undefined) return null;
    if (typeof value !== "string") return value;
    const raw = value.trim();
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  };

  const testCaseStats = useMemo(() => {
    const parsed = safeParseJson(formData.test_cases);
    const arr = Array.isArray(parsed) ? parsed : [];
    const hidden = arr.filter((tc) => Boolean(tc?.is_hidden ?? tc?.isHidden ?? tc?.hidden)).length;
    return {
      total: arr.length,
      hidden,
      visible: Math.max(0, arr.length - hidden),
    };
  }, [formData.test_cases]);

  return (
    <div className={styles.formWithPreview}>
      <div>
        <div className={styles.formSection}>
          <div className={styles.sectionHead}>
            <p className={styles.sectionTitle}>Basics</p>
            <p className={styles.sectionDesc}>Identity, type, and XP payout</p>
          </div>
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

            <div className={styles.formGroup}>
              <label>Route</label>
              <input type="text" value={formData.route || ""} disabled />
            </div>
          </div>
        </div>

      <div className={styles.formSection}>
        <div className={styles.sectionHead}>
          <p className={styles.sectionTitle}>Copy</p>
          <p className={styles.sectionDesc}>What the learner sees</p>
        </div>
        <div className={styles.formGrid}>
            <div className={styles.formGroupFull}>
              <label>Quiz Title</label>
              <input
                className={styles.titleInput}
                type="text"
                value={formData.quiz_title || ""}
                onChange={(e) => handleChange("quiz_title", e.target.value)}
                placeholder="e.g. Python Stage 2 Quiz"
              />
            </div>

          <div className={styles.formGroupFull}>
            <label>Description</label>
            <div className={styles.jsonEditorWrap}>
              <Editor
                height="200px"
                language="markdown"
                theme="vs-dark"
                value={formData.quiz_description || ""}
                onChange={(v) => handleChange("quiz_description", v ?? "")}
                options={baseEditorOptions}
              />
            </div>
          </div>
        </div>
      </div>

      {isCode ? (
        <>
          <div className={styles.formSection}>
            <div className={styles.sectionHead}>
              <p className={styles.sectionTitle}>Starter Code</p>
              <p className={styles.sectionDesc}>Prefills the editor for learners</p>
            </div>
              <div className={styles.formGrid}>
                <div className={styles.formGroupFull}>
                  <label>Starting Code</label>
                  <div className={styles.jsonEditorWrap}>
                    <Editor
                      height="260px"
                      language="plaintext"
                      theme="vs-dark"
                      value={formData.starting_code || ""}
                      onChange={(v) => handleChange("starting_code", v ?? "")}
                      options={baseEditorOptions}
                    />
                  </div>
                </div>
              </div>
          </div>

          <div className={styles.formSection}>
            <div className={styles.sectionHead}>
              <p className={styles.sectionTitle}>Tests</p>
              <p className={styles.sectionDesc}>Controls validation + scoring</p>
            </div>
              <div className={styles.formGrid}>
                <div className={styles.formGroupFull}>
                  <label>Test Cases</label>
                  <TestCasesEditor
                    value={formData.test_cases || "[]"}
                    onChange={(v) => handleChange("test_cases", v ?? "[]")}
                  />
                  <details className={styles.helpDetails}>
                    <summary className={styles.helpSummary}>Raw JSON (advanced)</summary>
                    <div className={styles.jsonEditorWrap}>
                      <Editor
                        height="240px"
                        language="json"
                        theme="vs-dark"
                        value={formData.test_cases || "[]"}
                        onChange={(v) => handleChange("test_cases", v ?? "")}
                        options={baseEditorOptions}
                      />
                    </div>
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
              </div>
          </div>
        </>
      ) : null}

      </div>

      <aside className={styles.previewPanel}>
        <div className={styles.previewTitle}>
          Live Preview
          <span style={{ fontSize: 12, color: "#94a3b8", fontWeight: 600 }}>as learners see it</span>
        </div>
        <p className={styles.previewHint}>
          This is a render preview. Validation is controlled by your test cases.
        </p>

        <div className={styles.previewMetaRow}>
          <span className={`${styles.badge} ${styles.badgeBlue}`}>Type: {String(formData.quiz_type || "mcq")}</span>
          <span className={styles.badge}>XP: {Number(formData.exp_total ?? 0)}</span>
          {isCode ? (
            <span className={`${styles.badge} ${styles.badgeGreen}`}>
              Tests: {testCaseStats.total} ({testCaseStats.visible} visible / {testCaseStats.hidden} hidden)
            </span>
          ) : null}
        </div>

        <div className={styles.previewCard}>
          <h3 style={{ margin: "0 0 10px", fontSize: 16 }}>{formData.quiz_title || "(Untitled quiz)"}</h3>
          {formData.quiz_description ? (
            <div style={{ opacity: 0.95 }}>
              <MarkdownRenderer>{formData.quiz_description}</MarkdownRenderer>
            </div>
          ) : (
            <div style={{ color: "#94a3b8", fontSize: 13 }}>No description yet.</div>
          )}
        </div>

      </aside>

      <div className={`${styles.formActions} ${styles.formActionsSticky}`} style={{ gridColumn: "1 / -1", marginTop: "16px" }}>
        <button className={`${styles.button} ${styles.buttonPrimary}`} type="button" onClick={onSave} disabled={saving}>
          <Save size={16} style={{ marginRight: 6 }} />
          {saving ? "Saving..." : "Save"}
        </button>
        <button
          className={`${styles.button} ${styles.buttonMuted}`}
          type="button"
          onClick={onCancel}
          disabled={saving}
        >
          <X size={16} style={{ marginRight: 6 }} />
          Cancel
        </button>
      </div>
    </div>
  );
};

export default QuizManager;
