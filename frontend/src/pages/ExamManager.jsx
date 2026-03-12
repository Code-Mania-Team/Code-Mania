import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { axiosPublic } from "../api/axios";
import { ArrowLeft, Edit, Save, X } from "lucide-react";
import styles from "../styles/Admin.module.css";

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

  const handleEdit = (problem) => {
    setEditingProblem(problem.id);
    setFormData({
      ...problem,
      test_cases: toPrettyJsonString(problem.test_cases, "[]"),
    });
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

      const payload = {
        problem_title: formData.problem_title,
        problem_description: formData.problem_description,
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
            problems.map((problem) => (
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
                        Language: {problem.programming_languages?.name || course} ·
                        Updated: {problem.updated_at ? new Date(problem.updated_at).toLocaleDateString() : "-"}
                      </div>
                      {problem.problem_description && (
                        <div className={styles.exerciseDescription}>
                          {problem.problem_description.substring(0, 150)}
                          {problem.problem_description.length > 150 ? "..." : ""}
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
            ))
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

  return (
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
        <label>Description</label>
        <textarea
          value={formData.problem_description || ""}
          onChange={(e) => handleChange("problem_description", e.target.value)}
          rows={5}
        />
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
        <label>Test Cases (JSON)</label>
        <textarea
          value={formData.test_cases || "[]"}
          onChange={(e) => handleChange("test_cases", e.target.value)}
          rows={8}
          style={{ fontFamily: "monospace" }}
        />
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
  );
};

export default ExamManager;
