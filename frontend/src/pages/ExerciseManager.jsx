import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { axiosPublic } from "../api/axios";
import { ArrowLeft, Edit, Trash2, Save, X, Eye, EyeOff } from "lucide-react";
import styles from "../styles/Admin.module.css";

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

  const handleEdit = (exercise) => {
    setEditingExercise(exercise.id);
    setFormData({
      ...exercise,
      dialogue: JSON.stringify(exercise.dialogue || [], null, 2),
      requirements: JSON.stringify(exercise.requirements || {}, null, 2)
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

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this exercise?")) {
      try {
        await axiosPublic.delete(`/v1/admin/exercises/${id}`, {
          withCredentials: true
        });
        await fetchExercises();
      } catch (error) {
        console.error("Error deleting exercise:", error);
        alert("Error deleting exercise");
      }
    }
  };

  const handleCancel = () => {
    setEditingExercise(null);
    setFormData({});
  };

  const toggleStatus = async (exercise) => {
    const newStatus = exercise.status === 'published' ? 'draft' : 'published';
    try {
      await axiosPublic.patch(`/v1/admin/exercises/${exercise.id}`, {
        ...exercise,
        status: newStatus
      }, { withCredentials: true });
      await fetchExercises();
    } catch (error) {
      console.error("Error toggling status:", error);
    }
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
              Back
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
                      onClick={() => toggleStatus(exercise)}
                      title={exercise.status === 'published' ? 'Set to draft' : 'Publish'}
                    >
                      {exercise.status === 'published' ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                    <button 
                      className={styles.button} 
                      type="button" 
                      onClick={() => handleEdit(exercise)}
                    >
                      <Edit size={16} />
                    </button>
                    <button 
                      className={styles.button} 
                      type="button" 
                      onClick={() => handleDelete(exercise.id)}
                      style={{ backgroundColor: '#ef4444' }}
                    >
                      <Trash2 size={16} />
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

  return (
    <div className={styles.formGrid}>
      <div className={styles.formGroup}>
        <label>Exercise ID</label>
        <input
          type="number"
          value={formData.exercise_id || ''}
          onChange={(e) => handleChange('exercise_id', parseInt(e.target.value))}
        />
      </div>

      <div className={styles.formGroup}>
        <label>Title</label>
        <input
          type="text"
          value={formData.title || ''}
          onChange={(e) => handleChange('title', e.target.value)}
        />
      </div>

      <div className={styles.formGroup}>
        <label>Validation Mode</label>
        <select
          value={formData.validation_mode || 'HYBRID'}
          onChange={(e) => handleChange('validation_mode', e.target.value)}
        >
          <option value="FUNDAMENTALS">Fundamentals</option>
          <option value="HYBRID">Hybrid</option>
          <option value="OUTPUT">Output</option>
        </select>
      </div>

      <div className={styles.formGroup}>
        <label>Experience Points</label>
        <input
          type="number"
          value={formData.experience || 100}
          onChange={(e) => handleChange('experience', parseInt(e.target.value))}
        />
      </div>

      <div className={styles.formGroup}>
        <label>Status</label>
        <select
          value={formData.status || 'draft'}
          onChange={(e) => handleChange('status', e.target.value)}
        >
          <option value="draft">Draft</option>
          <option value="published">Published</option>
        </select>
      </div>

      <div className={styles.formGroup}>
        <label>Order Index</label>
        <input
          type="number"
          value={formData.order_index || 1}
          onChange={(e) => handleChange('order_index', parseInt(e.target.value))}
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
        <textarea
          value={formData.dialogue || '[]'}
          onChange={(e) => handleChange('dialogue', e.target.value)}
          rows={5}
          style={{ fontFamily: 'monospace' }}
        />
      </div>

      <div className={styles.formGroupFull}>
        <label>Requirements (JSON)</label>
        <textarea
          value={formData.requirements || '{}'}
          onChange={(e) => handleChange('requirements', e.target.value)}
          rows={3}
          style={{ fontFamily: 'monospace' }}
        />
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
