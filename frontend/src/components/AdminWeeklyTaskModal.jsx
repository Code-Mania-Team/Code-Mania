import React, { useState } from 'react';
import { X, Save, Plus, Trash2, Image as ImageIcon } from 'lucide-react';
import useWeeklyTasksAdmin from "../hooks/useWeeklyTasksAdmin";
import '../styles/AdminWeeklyTaskModal.css';

const AdminWeeklyTaskModal = ({ isOpen, onClose, onTaskAdded }) => {
  const { isAdmin, createTask, uploadCoverImage, loading, error: adminError } = useWeeklyTasksAdmin();
  const [error, setError] = useState('');
  const [coverImage, setCoverImage] = useState(null);
  const [coverUploading, setCoverUploading] = useState(false);
  const [coverError, setCoverError] = useState('');

  // Form states
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [rewardXp, setRewardXp] = useState(100);
  const [difficulty, setDifficulty] = useState('medium');
  const [language, setLanguage] = useState('javascript');
  const [starterCode, setStarterCode] = useState('');
  const [solutionCode, setSolutionCode] = useState('');
  const [minXpRequired, setMinXpRequired] = useState(5000);
  
  // Test cases state
  const [testCases, setTestCases] = useState([{ input: '', output: '' }]);

  if (!isOpen) return null;

  if (!isAdmin) return null;

  const handleAddTestCase = () => {
    setTestCases([...testCases, { input: '', output: '' }]);
  };

  const handleRemoveTestCase = (index) => {
    const newTestCases = [...testCases];
    newTestCases.splice(index, 1);
    setTestCases(newTestCases);
  };

  const handleTestCaseChange = (index, field, value) => {
    const newTestCases = [...testCases];
    newTestCases[index][field] = value;
    setTestCases(newTestCases);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title || !description) {
      setError('Title and Description are required.');
      return;
    }

    // Filter out empty test cases
    const validTestCases = testCases.filter(tc => tc.input.trim() !== '' || tc.output.trim() !== '');

    const payload = {
      title,
      description,
      reward_xp: parseInt(rewardXp) || 100,
      difficulty,
      language,
      starter_code: starterCode,
      solution_code: solutionCode,
      test_cases: validTestCases,
      min_xp_required: parseInt(minXpRequired) || 5000,
      cover_image: coverImage,
    };

    try {
      setError('');

      const res = await createTask(payload);
      if (res.data?.success) {
        if (typeof onTaskAdded === 'function') {
          onTaskAdded();
        }
        resetForm();
        onClose();
      }
    } catch (err) {
      console.error(err);
      setError(err?.response?.data?.message || err.message || 'Failed to create task.');
    }
  };

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setRewardXp(100);
    setDifficulty('medium');
    setLanguage('javascript');
    setStarterCode('');
    setSolutionCode('');
    setMinXpRequired(5000);
    setTestCases([{ input: '', output: '' }]);
    setCoverImage(null);
    setCoverUploading(false);
    setCoverError('');
    setError('');
  };

  const handleCoverFile = async (file) => {
    if (!file) return;
    setCoverUploading(true);
    setCoverError('');
    try {
      const res = await uploadCoverImage(file);
      const url = res?.data?.url;
      if (!url) {
        throw new Error(res?.message || 'Upload succeeded but no URL returned');
      }
      setCoverImage(url);
    } catch (err) {
      setCoverError(err?.response?.data?.message || err?.message || 'Failed to upload image');
      setCoverImage(null);
    } finally {
      setCoverUploading(false);
    }
  };

  return (
    <div className="admin-modal-overlay">
      <div className="admin-modal-content">
        <div className="admin-modal-header">
          <h2>Create Weekly Task (Code Quiz)</h2>
          <button className="admin-modal-close" onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="admin-modal-body">
          {(error || adminError || coverError) && (
            <div className="admin-error-message">{error || adminError || coverError}</div>
          )}

          <div className="form-row">
            <div className="form-group">
              <label>Title <span className="required">*</span></label>
              <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Reverse Array" required />
            </div>
            <div className="form-group">
              <label>Difficulty</label>
              <select value={difficulty} onChange={e => setDifficulty(e.target.value)}>
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label>Description (Markdown supported) <span className="required">*</span></label>
            <textarea 
              value={description} 
              onChange={e => setDescription(e.target.value)} 
              rows={3} 
              placeholder="Write the problem statement here..." 
              required 
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Language</label>
              <select value={language} onChange={e => setLanguage(e.target.value)}>
                <option value="javascript">JavaScript</option>
                <option value="python">Python</option>
                <option value="cpp">C++</option>
              </select>
            </div>
            <div className="form-group">
              <label>Reward XP</label>
              <input type="number" min="0" value={rewardXp} onChange={e => setRewardXp(e.target.value)} />
            </div>
            <div className="form-group">
              <label>Min XP Required to Unlock</label>
              <input type="number" min="0" value={minXpRequired} onChange={e => setMinXpRequired(e.target.value)} />
            </div>
          </div>

          <div className="form-group">
            <label>Cover Image (Optional)</label>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
              <label
                className="btn-add-test"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', cursor: coverUploading || loading ? 'not-allowed' : 'pointer' }}
              >
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/gif"
                  style={{ display: 'none' }}
                  disabled={coverUploading || loading}
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    e.target.value = '';
                    handleCoverFile(f);
                  }}
                />
                <ImageIcon size={16} />
                {coverUploading ? 'Uploading...' : (coverImage ? 'Replace Image' : 'Add Image')}
              </label>

              {coverImage ? (
                <button
                  type="button"
                  className="btn-cancel"
                  onClick={() => setCoverImage(null)}
                  disabled={coverUploading || loading}
                >
                  Remove
                </button>
              ) : null}
            </div>

            {coverImage ? (
              <div style={{ marginTop: '10px' }}>
                <img
                  src={coverImage}
                  alt="Weekly task cover"
                  style={{ width: '180px', height: '100px', objectFit: 'cover', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.12)' }}
                />
              </div>
            ) : null}
          </div>

          <div className="form-group">
            <label>Starter Code (Optional)</label>
            <textarea 
              className="code-editor"
              value={starterCode} 
              onChange={e => setStarterCode(e.target.value)} 
              rows={4} 
              placeholder="def reverse_array(arr):&#10;    # Write your code here&#10;    pass" 
            />
          </div>

          <div className="form-group">
            <label>Solution Code (Optional but recommended)</label>
            <textarea 
              className="code-editor"
              value={solutionCode} 
              onChange={e => setSolutionCode(e.target.value)} 
              rows={4} 
              placeholder="def reverse_array(arr):&#10;    return arr[::-1]" 
            />
          </div>

          <div className="form-section">
            <div className="form-section-header">
              <h3>Test Cases</h3>
              <button type="button" className="btn-add-test" onClick={handleAddTestCase}>
                <Plus size={16} /> Add Test Case
              </button>
            </div>
            
            {testCases.map((tc, index) => (
              <div key={index} className="test-case-row">
                <span className="test-case-num">#{index + 1}</span>
                <div className="test-case-fields">
                  <div className="form-group">
                    <label>Input</label>
                    <input 
                      type="text" 
                      value={tc.input} 
                      onChange={e => handleTestCaseChange(index, 'input', e.target.value)} 
                      placeholder="e.g. [1, 2, 3]" 
                    />
                  </div>
                  <div className="form-group">
                    <label>Expected Output</label>
                    <input 
                      type="text" 
                      value={tc.output} 
                      onChange={e => handleTestCaseChange(index, 'output', e.target.value)} 
                      placeholder="e.g. [3, 2, 1]" 
                    />
                  </div>
                </div>
                <button type="button" className="btn-remove-test" onClick={() => handleRemoveTestCase(index)} disabled={testCases.length === 1}>
                  <Trash2 size={18} />
                </button>
              </div>
            ))}
            <div className="test-case-hint">Note: If you use arrays or strings, format them as they would appear in JSON (e.g. <code>[1,2,3]</code> or <code>"hello"</code>).</div>
          </div>

          <div className="admin-modal-footer">
            <button type="button" className="btn-cancel" onClick={onClose} disabled={loading}>
              Cancel
            </button>
            <button type="submit" className="btn-submit" disabled={loading}>
              {loading ? 'Creating...' : (
                <>
                  <Save size={18} /> Save Weekly Task
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminWeeklyTaskModal;
