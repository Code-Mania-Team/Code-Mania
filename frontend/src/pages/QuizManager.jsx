import React, { useEffect, useState } from "react";
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
        setFormData({
          ...full,
          code_prompt: toPrettyJsonString(full.code_prompt, full.code_prompt || ""),
          code_prompt_format: fullPromptFormat,
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

      const promptFormat = String(formData.code_prompt_format || "markdown").toLowerCase();
      let normalizedPrompt = formData.code_prompt;
      if (promptFormat === "json") {
        if (typeof normalizedPrompt === "string") {
          const raw = normalizedPrompt.trim();
          if (!raw) {
            normalizedPrompt = { sections: [] };
          } else {
            try {
              normalizedPrompt = JSON.parse(raw);
            } catch {
              alert("Code prompt must be valid JSON when format is JSON.");
              setSaving(false);
              return;
            }
          }
        }
      } else {
        if (typeof normalizedPrompt !== "string") {
          try {
            normalizedPrompt = JSON.stringify(normalizedPrompt, null, 2);
          } catch {
            normalizedPrompt = String(normalizedPrompt ?? "");
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
                    <h3>Edit Quiz: {formData.quiz_title || q.quiz_title}</h3>
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

  const promptFormat = String(formData.code_prompt_format || "markdown").toLowerCase();

  const baseEditorOptions = {
    contextmenu: false,
    minimap: { enabled: false },
    fontSize: 13,
    automaticLayout: true,
    scrollBeyondLastLine: false,
    wordWrap: "on",
  };

  const isCode = String(formData.quiz_type || "mcq").toLowerCase() === "code";

  return (
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
          value={formData.quiz_title || ""}
          onChange={(e) => handleChange("quiz_title", e.target.value)}
        />
      </div>

      <div className={styles.formGroupFull}>
        <label>Description</label>
        <textarea
          value={formData.quiz_description || ""}
          onChange={(e) => handleChange("quiz_description", e.target.value)}
          rows={3}
        />
      </div>

      {isCode ? (
        <>
          <div className={styles.formGroup}>
            <label>Code Prompt Format</label>
            <select
              value={promptFormat}
              onChange={(e) => handleChange("code_prompt_format", e.target.value)}
            >
              <option value="markdown">markdown</option>
              <option value="json">json</option>
            </select>
          </div>

           <div className={styles.formGroupFull}>
            <label>Code Prompt ({promptFormat})</label>
           <Editor
              height="220px"
              language={promptFormat === "json" ? "json" : "markdown"}
              theme="vs-dark"
              value={formData.code_prompt || ""}
              onChange={(v) => handleChange("code_prompt", v ?? "")}
              options={baseEditorOptions}
            />

            {promptFormat === "markdown" ? (
              <details className={styles.helpDetails}>
                <summary className={styles.helpSummary}>Preview (Markdown)</summary>
                <MarkdownRenderer>{formData.code_prompt || ""}</MarkdownRenderer>
              </details>
            ) : null}
            <details className={styles.helpDetails}>
              <summary className={styles.helpSummary}>Prompt format notes</summary>
              <p className={styles.helpText}>
                Use <code>markdown</code> for normal prompts. Use <code>json</code> only for legacy prompts like{" "}
                <code>{"{"} "sections": [...] {"}"}</code>.
              </p>
            </details>
          </div>

          <div className={styles.formGroupFull}>
            <label>Starting Code</label>
            <Editor
              height="240px"
              language="plaintext"
              theme="vs-dark"
              value={formData.starting_code || ""}
              onChange={(v) => handleChange("starting_code", v ?? "")}
              options={baseEditorOptions}
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
  );
};

export default QuizManager;
