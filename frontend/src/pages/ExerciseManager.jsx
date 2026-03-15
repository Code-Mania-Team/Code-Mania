import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { axiosPublic } from "../api/axios";
import { ArrowLeft, Edit, Save, X } from "lucide-react";
import styles from "../styles/Admin.module.css";
import JsonEditor from "../components/JsonEditor";

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

const ExerciseForm = ({ formData, setFormData, onSave, onCancel }) => {
  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
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
        <textarea
          value={formData.description || ''}
          onChange={(e) => handleChange('description', e.target.value)}
          rows={3}
        />
      </div>

      <div className={styles.formGroupFull}>
        <label>Task</label>
        <textarea
          value={formData.task || ''}
          onChange={(e) => handleChange('task', e.target.value)}
          rows={2}
        />
      </div>

      <div className={styles.formGroupFull}>
        <label>Lesson Example</label>
        <textarea
          value={formData.lesson_example || ''}
          onChange={(e) => handleChange('lesson_example', e.target.value)}
          rows={3}
        />
      </div>

      <div className={styles.formGroupFull}>
        <label>Starting Code</label>
        <textarea
          value={formData.starting_code || ''}
          onChange={(e) => handleChange('starting_code', e.target.value)}
          rows={3}
        />
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
        <div className={styles.jsonEditorWrap}>
          <JsonEditor
            height="220px"
            value={formData.dialogue || "[]"}
            onChange={(v) => handleChange("dialogue", v)}
          />
        </div>
      </div>

      <div className={styles.formGroupFull}>
        <label>Requirements (JSON)</label>
        <div className={styles.jsonEditorWrap}>
          <JsonEditor
            height="180px"
            value={formData.requirements || "{}"}
            onChange={(v) => handleChange("requirements", v)}
          />
        </div>
      </div>

      <div className={styles.formActions}>
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
