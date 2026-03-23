import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { axiosPublic } from "../api/axios";
import { ArrowLeft, Edit, Save, X } from "lucide-react";
import styles from "../styles/Admin.module.css";
import JsonEditor from "../components/JsonEditor";
import MarkdownRenderer from "../components/MarkdownRenderer";
import Editor from "@monaco-editor/react";

const ExerciseManager = () => {
  const { course } = useParams();
  const navigate = useNavigate();
  const [exercises, setExercises] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingExercise, setEditingExercise] = useState(null);
  const [formData, setFormData] = useState({});

  const languageIdByCourse = {
    python: 1,
    cpp: 2,
    javascript: 3,
  };

  const selectedLanguageId = languageIdByCourse[course];

  useEffect(() => {
    fetchExercises();
  }, [course]);

  const fetchExercises = async () => {
    if (!selectedLanguageId) {
      setExercises([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const response = await axiosPublic.get(`/v1/exercises/programming-language/${selectedLanguageId}`, {
        withCredentials: true 
      });
      if (response.data.success) {
        setExercises(response.data.data);
      }
    } catch (error) {
      console.error("Error fetching exercises:", error);
    } finally {
      setLoading(false);
    }
  };

  const toPrettyJsonString = (value, fallback = "{}") => {
    if (value === null || value === undefined) return fallback;

    if (typeof value === "string") {
      const trimmed = value.trim();
      if (!trimmed) return fallback;
      try {
        return JSON.stringify(JSON.parse(trimmed), null, 2);
      } catch {
        // If it's already a plain string, keep it as-is.
        return value;
      }
    }

    try {
      return JSON.stringify(value, null, 2);
    } catch {
      return fallback;
    }
  };

  const handleEdit = (exercise) => {
    setEditingExercise(exercise.id);
    setFormData({
      ...exercise,
      dialogue: JSON.stringify(exercise.dialogue || [], null, 2),
      requirements: toPrettyJsonString(exercise.requirements, "{}"),
    });
  };

  const handleSave = async () => {
    try {
      let parsedRequirements = formData.requirements || {};

      if (typeof formData.requirements === 'string') {
        try {
          parsedRequirements = JSON.parse(formData.requirements);
        } catch {
          alert('Requirements must be valid JSON.');
          return;
        }
      }

      const processedData = {
        ...formData,
        requirements: parsedRequirements,
      };

      delete processedData.dialogue;

      const response = await axiosPublic.patch(`/v1/admin/exercises/${editingExercise}`, processedData, {
        withCredentials: true
      });

      if (response.data.success) {
        await fetchExercises();
        setEditingExercise(null);
        setFormData({});
      }
    } catch (error) {
      console.error("Error saving exercise:", error);
      const message = error?.response?.data?.message || error?.message || "Error saving exercise.";
      alert(message);
    }
  };


  const handleCancel = () => {
    setEditingExercise(null);
    setFormData({});
  };

  if (!selectedLanguageId) {
    return (
      <div className={styles.page}>
        <section className={styles.section}>
          <div className={styles.state}>
            <h1>Invalid course.</h1>
            <button className={styles.button} type="button" onClick={() => navigate('/admin')}>Back to Admin</button>
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
            <h1>Loading exercises...</h1>
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
            <h2 className={styles.title}>{course.charAt(0).toUpperCase() + course.slice(1)} Exercises</h2>
          </div>
        </div>

        <p className={styles.subtitle}>
          Manage {course} exercises. Total: {exercises.length} exercises
        </p>

        {editingExercise !== null && (
          <aside className={styles.exerciseCheatSheetDock}>
            <TestCasesCheatSheet />
          </aside>
        )}

        <div className={styles.panel}>
          {exercises.map((exercise) => (
            <div key={exercise.id} className={styles.exerciseRow}>
              {editingExercise === exercise.id ? (
                <div className={styles.exerciseEditor}>
                  <h3>Edit Exercise: {exercise.title}</h3>
                  <ExerciseForm 
                    formData={formData} 
                    setFormData={setFormData} 
                    onSave={handleSave} 
                    onCancel={handleCancel} 
                    course={course}
                  />
                </div>
              ) : (
                <>
                  <div className={styles.exerciseLeft}>
                    <div className={styles.exerciseTitle}>
                      {exercise.order_index}. {exercise.title}
                    </div>
                    <div className={styles.exerciseMeta}>
                      ID: {exercise.exercise_id} · 
                      Mode: {exercise.validation_mode} · 
                      XP: {exercise.experience} ·
                      Status: <span className={exercise.status === 'published' ? styles.published : styles.draft}>
                        {exercise.status}
                      </span>
                    </div>
                    {exercise.description && (
                      <div className={styles.exerciseDescription}>
                        {exercise.description.substring(0, 150)}...
                      </div>
                    )}
                  </div>
                  <div className={styles.exerciseActions}>
                    <button 
                      className={styles.button} 
                      type="button" 
                      onClick={() => handleEdit(exercise)}
                    >
                      <Edit size={16} />
                    </button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

const TestCasesCheatSheet = () => {
  const runtimeMarkdown = `#### Runtime test cases


\`\`\`json
{
  "test_cases": [
    {
      "input": "2\\n3",
      "expected": "5"
    }
  ]
}
\`\`\`

Supported fields: \`input\` (stdin), \`expected\` (must appear in output).`;

  const objectivesMarkdown = `#### Rule-based objectives

\`\`\`json
{
  "objectives": [
    {
      "id": "out",
      "type": "output_contains",
      "label": "Prints result",
      "value": "5"
    }
  ]
}
\`\`\``;

  const supportedTypesMarkdown = `#### Supported objective types

- \`output_contains\`: output includes \`value\`.
- \`output_equals\`: output must exactly match \`value\` (trimmed lines).
- \`output_regex\`: output matches regex in \`value\`.
- \`code_contains\`: submitted code includes \`value\`.
- \`code_regex\`: submitted code matches regex in \`value\`.
- \`min_print_count\`: Python code has at least \`value\` \`print()\` calls.

Tip: use \`\\n\` for multi-line input and output. Keep \`requirements\` as a valid JSON object.`;

  return (
    <>
      <div className={styles.previewTitle}>
        <span>Test Case Cheat Sheet</span>
      </div>
      <p className={styles.previewHint}>
        Exercise editor only. Quiz, exam, and weekly challenges are mainly runtime test cases.
      </p>

      <div className={styles.previewCard}>
        <div style={{ display: "grid", gap: 4 }}>
          <MarkdownRenderer>{runtimeMarkdown}</MarkdownRenderer>
          <MarkdownRenderer>{objectivesMarkdown}</MarkdownRenderer>
          <MarkdownRenderer>{supportedTypesMarkdown}</MarkdownRenderer>
        </div>
      </div>
    </>
  );
};

const ExerciseForm = ({ formData, setFormData, onSave, onCancel, course }) => {
  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const codeLanguage = (() => {
    const slug = String(course || "").toLowerCase();
    if (slug.includes("python")) return "python";
    if (slug.includes("javascript") || slug === "js") return "javascript";
    if (slug.includes("cpp") || slug.includes("c++")) return "cpp";
    return "plaintext";
  })();

  const baseEditorOptions = {
    contextmenu: false,
    minimap: { enabled: false },
    fontSize: 13,
    automaticLayout: true,
    scrollBeyondLastLine: false,
    wordWrap: "on",
  };

  const codeEditorOptions = {
    ...baseEditorOptions,
    lineNumbers: "on",
    padding: { top: 10, bottom: 10 },
    fontFamily:
      'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
  };

  const formatValidationMode = (mode) => {
    const value = String(mode || "").toLowerCase();
    if (value === "fundamentals") return "Fundamentals";
    if (value === "hybrid") return "Hybrid";
    if (value === "output") return "Output";
    return mode || "";
  };

  const formatStatus = (status) => {
    const value = String(status || "").toLowerCase();
    if (value === "draft") return "Draft";
    if (value === "published") return "Published";
    return status || "";
  };

  return (
    <div className={styles.formWithPreview}>
      <div className={styles.formGrid}>
      <div className={styles.formGroup}>
        <label>Exercise ID</label>
        <input
          type="number"
          value={formData.exercise_id || ''}
          disabled
        />
      </div>

      <div className={styles.formGroup}>
        <label>Title</label>
        <input
          type="text"
          value={formData.title || ''}
          disabled
        />
      </div>

      <div className={styles.formGroup}>
        <label>Validation Mode</label>
        <input
          type="text"
          value={formatValidationMode(formData.validation_mode || 'HYBRID')}
          disabled
          readOnly
        />
      </div>

      <div className={styles.formGroup}>
        <label>Experience Points</label>
        <input
          type="number"
          value={formData.experience || 100}
          disabled
        />
      </div>

      <div className={styles.formGroup}>
        <label>Status</label>
        <input
          type="text"
          value={formatStatus(formData.status || 'draft')}
          disabled
          readOnly
        />
      </div>

      <div className={styles.formGroup}>
        <label>Order Index</label>
        <input
          type="number"
          value={formData.order_index || 1}
          disabled
        />
      </div>

      <div className={styles.formGroupFull}>
        <label>Lesson Header</label>
        <input
          type="text"
          value={formData.lesson_header || ''}
          onChange={(e) => handleChange('lesson_header', e.target.value)}
        />
      </div>

      <div className={styles.formGroupFull}>
        <label>Description</label>
        <div className={styles.jsonEditorWrap}>
          <Editor
            height="220px"
            language="markdown"
            theme="vs-dark"
            value={String(formData.description || "")}
            onChange={(v) => handleChange("description", v ?? "")}
            options={baseEditorOptions}
          />
        </div>
      </div>

      <div className={styles.formGroupFull}>
        <label>Task</label>
        <div className={styles.jsonEditorWrap}>
          <Editor
            height="150px"
            language="markdown"
            theme="vs-dark"
            value={String(formData.task || "")}
            onChange={(v) => handleChange("task", v ?? "")}
            options={baseEditorOptions}
          />
        </div>
      </div>

      <div className={styles.formGroupFull}>
        <label>Lesson Example</label>
        <div className={styles.jsonEditorWrap}>
          <Editor
            height="180px"
            language="markdown"
            theme="vs-dark"
            value={String(formData.lesson_example || "")}
            onChange={(v) => handleChange("lesson_example", v ?? "")}
            options={baseEditorOptions}
          />
        </div>
      </div>

      <div className={styles.formGroupFull}>
        <label>Starting Code</label>
        <div className={styles.jsonEditorWrap}>
          <Editor
            height="200px"
            language={codeLanguage}
            theme="vs-dark"
            value={String(formData.starting_code || "")}
            onChange={(v) => handleChange("starting_code", v ?? "")}
            options={codeEditorOptions}
          />
        </div>
      </div>

      <div className={styles.formGroupFull}>
        <label>Expected Output</label>
        <input
          type="text"
          value={formData.expected_output || ''}
          onChange={(e) => handleChange('expected_output', e.target.value)}
        />
      </div>

      <div className={styles.formGroupFull}>
        <label>Grants</label>
        <input
          type="text"
          value={formData.grants || ''}
          onChange={(e) => handleChange('grants', e.target.value)}
        />
      </div>

      <div className={styles.formGroupFull}>
        <label>Dialogue (JSON)</label>
        <details className={styles.helpDetails} open>
          <summary className={styles.helpSummary}>Edit Dialogue JSON</summary>
          <div className={styles.jsonEditorWrap}>
            <JsonEditor
              height="220px"
              value={formData.dialogue || "[]"}
              onChange={(v) => handleChange("dialogue", v)}
            />
          </div>
        </details>
      </div>

      <div className={styles.formGroupFull}>
        <label>Requirements (JSON)</label>
        <details className={styles.helpDetails}>
          <summary className={styles.helpSummary}>Edit Requirements JSON</summary>
          <div className={styles.jsonEditorWrap}>
            <JsonEditor
              height="180px"
              value={formData.requirements || "{}"}
              onChange={(v) => handleChange("requirements", v)}
            />
          </div>
        </details>
      </div>

      </div>

      <aside className={styles.previewPanel}>
        <div className={styles.previewTitle}>
          <span>Preview</span>
          <span style={{ fontSize: 12, color: "#94a3b8", fontWeight: 600 }}>Live</span>
        </div>
        <p className={styles.previewHint}>This matches how the quest UI renders your content.</p>

        <div className={styles.previewCard}>
          <div style={{ marginBottom: 10 }}>
            <div style={{ fontWeight: 900, color: "#f1f5f9" }}>{formData.title || "(Untitled)"}</div>
            <div style={{ fontSize: 12, color: "#94a3b8" }}>
              Lesson Header: {formData.lesson_header || "-"}
            </div>
          </div>

          <div style={{ display: "grid", gap: 12 }}>
            <div>
              <div style={{ fontSize: 12, color: "#94a3b8", fontWeight: 800, marginBottom: 6 }}>Description</div>
              <MarkdownRenderer>{String(formData.description || "")}</MarkdownRenderer>
            </div>

            <div>
              <div style={{ fontSize: 12, color: "#94a3b8", fontWeight: 800, marginBottom: 6 }}>Task</div>
              <MarkdownRenderer>{String(formData.task || "")}</MarkdownRenderer>
            </div>

            <div>
              <div style={{ fontSize: 12, color: "#94a3b8", fontWeight: 800, marginBottom: 6 }}>Lesson Example</div>
              <MarkdownRenderer>{String(formData.lesson_example || "")}</MarkdownRenderer>
            </div>

            <div>
              <div style={{ fontSize: 12, color: "#94a3b8", fontWeight: 800, marginBottom: 6 }}>Starting Code</div>
              <pre
                style={{
                  margin: 0,
                  padding: "10px 10px",
                  borderRadius: 10,
                  background: "rgba(2,6,23,0.6)",
                  border: "1px solid rgba(148,163,184,0.12)",
                  color: "#e7eefc",
                  overflow: "auto",
                  fontSize: 12,
                  lineHeight: 1.6,
                }}
              >
                <code>{String(formData.starting_code || "") || "(empty)"}</code>
              </pre>
            </div>

            <div>
              <div style={{ fontSize: 12, color: "#94a3b8", fontWeight: 800, marginBottom: 6 }}>Expected Output</div>
              <div style={{ fontSize: 13, color: "#e7eefc" }}>{formData.expected_output || "(empty)"}</div>
            </div>

            <div>
              <div style={{ fontSize: 12, color: "#94a3b8", fontWeight: 800, marginBottom: 6 }}>Grants</div>
              <div style={{ fontSize: 13, color: "#e7eefc" }}>{formData.grants || "(empty)"}</div>
            </div>
          </div>
        </div>
      </aside>

      <div className={styles.formActions} style={{ gridColumn: "1 / -1", marginTop: "16px" }}>
        <button className={styles.button} type="button" onClick={onSave}>
          <Save size={16} style={{ marginRight: 4 }} />
          Save
        </button>
        <button 
          className={styles.button} 
          type="button" 
          onClick={onCancel}
          style={{ backgroundColor: '#6b7280' }}
        >
          <X size={16} style={{ marginRight: 4 }} />
          Cancel
        </button>
      </div>
    </div>
  );
};

export default ExerciseManager;
