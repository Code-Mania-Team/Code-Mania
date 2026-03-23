import React, { useEffect, useState } from 'react';
import { X, Save, Plus, Trash2, Image as ImageIcon } from 'lucide-react';
import Editor from "@monaco-editor/react";
import useWeeklyTasksAdmin from "../hooks/useWeeklyTasksAdmin";
import MarkdownRenderer from "./MarkdownRenderer";
import JsonEditor from "./JsonEditor";
import { useTheme } from "../context/ThemeProvider.jsx";
import '../styles/AdminWeeklyTaskModal.css';

const AdminWeeklyTaskModal = ({ isOpen, onClose, onTaskAdded, initialTask = null }) => {
  const { isAdmin, createTask, updateTask, uploadCoverImage, getRewardAvatarOptions, loading, error: adminError } = useWeeklyTasksAdmin();
  const [error, setError] = useState('');
  const [coverImage, setCoverImage] = useState(null);
  const [coverUploading, setCoverUploading] = useState(false);
  const [coverError, setCoverError] = useState('');
  const [rewardAvatarKey, setRewardAvatarKey] = useState('');
  const [rewardAvatarImage, setRewardAvatarImage] = useState('');
  const [rewardAvatarName, setRewardAvatarName] = useState('');
  const [rewardAvatarOptions, setRewardAvatarOptions] = useState([]);
  const [rewardAvatarLoading, setRewardAvatarLoading] = useState(false);
  const [rewardAvatarError, setRewardAvatarError] = useState('');
  const [didInit, setDidInit] = useState(false);

  // Form states
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [rewardXp, setRewardXp] = useState(100);
  const [difficulty, setDifficulty] = useState('medium');
  const [language, setLanguage] = useState('javascript');
  const [starterCode, setStarterCode] = useState('');
  const [solutionCode, setSolutionCode] = useState('');
  const [minXpRequired, setMinXpRequired] = useState(5000);
  const [showDescriptionPreview, setShowDescriptionPreview] = useState(false);
  const [testCaseMode, setTestCaseMode] = useState('builder');
  const [testCasesJson, setTestCasesJson] = useState('');
  
  // Test cases state
  const [testCases, setTestCases] = useState([{ input: '', output: '' }]);

  const taskId = initialTask?.task_id ?? initialTask?.id ?? null;
  const isEdit = Boolean(taskId);
  const availableRewardCount = (rewardAvatarOptions || []).filter((opt) => !opt?.is_used).length;
  const { theme } = useTheme();
  const editorTheme = theme === 'light' ? 'vs' : 'vs-dark';

  const monacoLang = (() => {
    const l = String(language || '').toLowerCase();
    if (l === 'python') return 'python';
    if (l === 'cpp' || l === 'c++') return 'cpp';
    if (l === 'javascript' || l === 'js') return 'javascript';
    return 'plaintext';
  })();

  const codeEditorOptions = {
    minimap: { enabled: false },
    scrollBeyondLastLine: false,
    wordWrap: 'on',
    tabSize: 2,
    fontSize: 13,
    lineNumbers: 'on',
    renderLineHighlight: 'line',
    automaticLayout: true,
    formatOnPaste: true,
    formatOnType: true,
    bracketPairColorization: { enabled: true },
  };

  const normalizeTestCase = (tc) => {
    const input = String(tc?.input ?? '').trim();
    const expectedRaw = tc?.expected ?? tc?.output ?? '';
    const output = String(expectedRaw ?? '').trim();
    const functionName = String(tc?.functionName ?? tc?.function_name ?? tc?.fn ?? 'solution').trim() || 'solution';
    const is_hidden = Boolean(tc?.is_hidden ?? tc?.isHidden ?? tc?.hidden);
    return { mode: 'function', input, output, functionName, is_hidden };
  };

  const toAdvancedJson = (rows) => {
    const safe = (Array.isArray(rows) ? rows : []).map((tc) => {
      const normalized = normalizeTestCase(tc);
      const { output, ...rest } = normalized;
      return { ...rest, expected: output };
    });
    return JSON.stringify(safe, null, 2);
  };

  useEffect(() => {
    if (!isOpen) {
      setDidInit(false);
      return;
    }
    if (!initialTask || didInit) return;

    setTitle(initialTask?.title || '');
    setDescription(initialTask?.description || '');
    setRewardXp(Number(initialTask?.reward_xp ?? 100));
    setDifficulty(String(initialTask?.difficulty || 'medium'));
    setLanguage(String(initialTask?.language || 'javascript'));
    setStarterCode(initialTask?.starter_code || '');
    setSolutionCode(initialTask?.solution_code || '');
    setMinXpRequired(Number(initialTask?.min_xp_required ?? 5000));
    setCoverImage(initialTask?.cover_image || null);
    setRewardAvatarKey(String(initialTask?.reward_avatar_frame_key || ''));
    setRewardAvatarImage(
      String(
        initialTask?.reward_cosmetic?.type === 'avatar_frame'
          ? (initialTask?.reward_cosmetic?.asset_url || '')
          : ''
      )
    );
    setRewardAvatarName(
      String(
        initialTask?.reward_cosmetic?.type === 'avatar_frame'
          ? (initialTask?.reward_cosmetic?.name || '')
          : ''
      )
    );

    const rawTcs = Array.isArray(initialTask?.test_cases) ? initialTask.test_cases : [];
    const mapped = rawTcs
      .map((tc) => {
        const input = tc?.input ?? '';
        const output = tc?.output ?? tc?.expected ?? tc?.expected_output ?? tc?.expectedOutput ?? '';
        return { input: String(input ?? ''), output: String(output ?? '') };
      })
      .filter((tc) => tc.input.trim() !== '' || tc.output.trim() !== '');

    setTestCases(mapped.length ? mapped : [{ input: '', output: '', mode: 'function', functionName: 'solution', is_hidden: false }]);
    setTestCasesJson(toAdvancedJson(mapped.length ? mapped : []));
    setTestCaseMode('builder');

    setDidInit(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, initialTask, didInit]);

  useEffect(() => {
    if (!isOpen || !isAdmin) return;

    let alive = true;
    const loadOptions = async () => {
      setRewardAvatarLoading(true);
      setRewardAvatarError('');
      try {
        const rows = await getRewardAvatarOptions({ excludeTaskId: taskId || null });
        if (!alive) return;
        setRewardAvatarOptions(Array.isArray(rows) ? rows : []);
      } catch (err) {
        if (!alive) return;
        setRewardAvatarOptions([]);
        setRewardAvatarError(err?.response?.data?.message || err?.message || 'Failed to load reward avatar frames');
      } finally {
        if (alive) setRewardAvatarLoading(false);
      }
    };

    loadOptions();
    return () => {
      alive = false;
    };
  }, [isOpen, isAdmin, getRewardAvatarOptions, taskId]);

  useEffect(() => {
    if (!rewardAvatarKey) return;
    if (rewardAvatarImage && rewardAvatarName) return;

    const picked = (rewardAvatarOptions || []).find((r) => String(r?.key) === String(rewardAvatarKey));
    if (!picked) return;

    if (!rewardAvatarImage) setRewardAvatarImage(String(picked?.asset_url || ''));
    if (!rewardAvatarName) setRewardAvatarName(String(picked?.name || picked?.key || ''));
  }, [rewardAvatarKey, rewardAvatarOptions, rewardAvatarImage, rewardAvatarName]);

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
    setError('');
    if (!title || !description) {
      setError('Title and Description are required.');
      return;
    }

    if (loading || coverUploading || rewardAvatarLoading) return;

    let validTestCases = [];
    if (testCaseMode === 'advanced') {
      let parsed;
      try {
        parsed = JSON.parse(String(testCasesJson || '[]'));
      } catch {
        setError('Advanced test cases JSON is invalid. Please fix the JSON syntax.');
        return;
      }

      if (!Array.isArray(parsed)) {
        setError('Advanced test cases must be a JSON array.');
        return;
      }

      const normalized = parsed.map((tc) => normalizeTestCase(tc));
      const invalid = normalized.find((tc) => !tc.input || !tc.output);
      if (invalid) {
        setError('Each advanced test case must have both input and expected/output.');
        return;
      }
      validTestCases = normalized;
    } else {
      const normalized = (testCases || []).map((tc) => normalizeTestCase(tc));
      validTestCases = normalized.filter((tc) => tc.input !== '' || tc.output !== '');
      const invalid = validTestCases.find((tc) => !tc.input || !tc.output);
      if (invalid) {
        setError('Each test case must have both Input and Expected Output.');
        return;
      }
    }

    if (!validTestCases.length) {
      setError('Add at least one valid test case.');
      return;
    }

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
      reward_avatar_frame_key: difficulty === 'hard' ? (rewardAvatarKey || null) : null,
    };

    try {
      setError('');

      const res = isEdit
        ? await updateTask({ taskId, fields: payload })
        : await createTask(payload);

      if (res?.success) {
        resetForm();
        // Close first so reload/refetch doesn't leave the modal hanging.
        if (typeof onClose === 'function') {
          onClose();
        }
        if (typeof onTaskAdded === 'function') {
          setTimeout(() => onTaskAdded(), 0);
        } else {
          setTimeout(() => window.location.reload(), 0);
        }
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
    setTestCases([{ input: '', output: '', mode: 'function', functionName: 'solution', is_hidden: false }]);
    setTestCasesJson('');
    setTestCaseMode('builder');
    setCoverImage(null);
    setCoverUploading(false);
    setCoverError('');
    setRewardAvatarKey('');
    setRewardAvatarImage('');
    setRewardAvatarName('');
    setRewardAvatarOptions([]);
    setRewardAvatarLoading(false);
    setRewardAvatarError('');
    setError('');
    setShowDescriptionPreview(false);
  };

  const handleCoverFile = async (file) => {
    if (!file) return;
    setCoverUploading(true);
    setCoverError('');
    try {
      const res = await uploadCoverImage(file);
      const url = res?.data?.url || res?.url;
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

  const applyRewardSelection = (nextKey) => {
    const key = String(nextKey || '');
    setRewardAvatarKey(key);
    if (!key) {
      setRewardAvatarImage('');
      setRewardAvatarName('');
      return;
    }

    const picked = (rewardAvatarOptions || []).find((r) => String(r?.key) === key);
    setRewardAvatarImage(String(picked?.asset_url || ''));
    setRewardAvatarName(String(picked?.name || key));
  };

  const handleSwitchTestCaseMode = (nextMode) => {
    setError('');
    if (nextMode === testCaseMode) return;

    if (nextMode === 'advanced') {
      setTestCasesJson(toAdvancedJson(testCases));
      setTestCaseMode('advanced');
      return;
    }

    let parsed;
    try {
      parsed = JSON.parse(String(testCasesJson || '[]'));
    } catch {
      setError('Cannot switch to Builder mode: advanced JSON is invalid.');
      return;
    }
    if (!Array.isArray(parsed)) {
      setError('Cannot switch to Builder mode: advanced JSON must be an array.');
      return;
    }

    const mapped = parsed.map((tc) => normalizeTestCase(tc));
    setTestCases(
      mapped.length
        ? mapped.map((tc) => ({ ...tc, output: tc.output }))
        : [{ input: '', output: '', mode: 'function', functionName: 'solution', is_hidden: false }]
    );
    setTestCaseMode('builder');
  };

  const weeklyRuntimeCheatSheet = `#### Runtime test cases JSON

\`\`\`json
[
  {
    "mode": "function",
    "input": "{\"args\":[\"abccba\",1]}",
    "expected": "true",
    "functionName": "isShiftedPalindrome",
    "is_hidden": false
  },
  {
    "mode": "function",
    "input": "{\"args\":[\"abc\",1]}",
    "expected": "false",
    "functionName": "isShiftedPalindrome"
  }
]
\`\`\`

Supported fields:

- \`input\`: input payload for the test.
- \`expected\` or \`output\`: expected result.
- \`is_hidden\` (optional): hide case in learner preview.
- \`mode\`: fixed to \`function\` for weekly challenges.
- \`functionName\` (optional): function entry name (defaults to \`solution\`).

Tip: weekly challenges are runtime-first. Keep test cases as a valid JSON array.`;

  return (
    <div className="admin-modal-overlay">
      <div className="admin-modal-content">
        {loading ? (
          <div className="admin-modal-saving" aria-live="polite" aria-busy="true">
            <div className="admin-modal-saving-card">
              <div className="admin-modal-saving-spinner" />
              <div className="admin-modal-saving-text">Saving weekly task...</div>
            </div>
          </div>
        ) : null}
        <div className="admin-modal-header">
          <h2>{isEdit ? 'Edit Weekly Task (Code Quiz)' : 'Create Weekly Task (Code Quiz)'}</h2>
          <button className="admin-modal-close" onClick={onClose} disabled={loading}>
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
            <div className="admin-md-row">
              <label>Description (Markdown supported) <span className="required">*</span></label>
              <button
                type="button"
                className={`admin-md-toggle ${showDescriptionPreview ? "is-on" : ""}`}
                onClick={() => setShowDescriptionPreview((v) => !v)}
                title={showDescriptionPreview ? "Hide preview" : "Show preview"}
              >
                {showDescriptionPreview ? "Hide preview" : "Preview"}
              </button>
            </div>

            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              rows={3}
              placeholder="Write the problem statement here..."
              required
            />

            {showDescriptionPreview ? (
              <div className="admin-md-preview" aria-label="Description preview">
                <MarkdownRenderer>{description || "(empty)"}</MarkdownRenderer>
              </div>
            ) : null}
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
            <label>Reward Avatar Frame (Hard challenge only, optional)</label>
            {difficulty !== 'hard' ? (
              <div className="test-case-hint">Set difficulty to Hard to attach an avatar frame reward.</div>
            ) : null}

            {rewardAvatarError ? (
              <div className="test-case-hint" style={{ color: '#fca5a5' }}>{rewardAvatarError}</div>
            ) : null}

            <div className="form-row" style={{ marginBottom: '8px' }}>
              <div className="form-group">
                <label>Available frames</label>
                <select
                  value={rewardAvatarKey}
                  onChange={(e) => applyRewardSelection(e.target.value)}
                  disabled={loading || rewardAvatarLoading || difficulty !== 'hard'}
                >
                  <option value="">Auto pick available reward</option>
                  {(rewardAvatarOptions || []).map((opt) => (
                    <option key={opt.key} value={opt.key} disabled={Boolean(opt?.is_used)}>
                      {opt.name || opt.key}{opt?.is_used ? ' - Already used' : ''}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
              {rewardAvatarLoading ? <span className="test-case-hint">Loading available cosmetics...</span> : null}
              {!rewardAvatarLoading && difficulty === 'hard' && rewardAvatarOptions.length === 0 ? (
                <span className="test-case-hint">No avatar frame cosmetics found. Add cosmetics first.</span>
              ) : null}
              {!rewardAvatarLoading && difficulty === 'hard' && rewardAvatarOptions.length > 0 && availableRewardCount === 0 ? (
                <span className="test-case-hint">All avatar frame cosmetics are already used by weekly tasks.</span>
              ) : null}

              {rewardAvatarKey ? (
                <button
                  type="button"
                  className="btn-cancel"
                  onClick={() => applyRewardSelection('')}
                  disabled={rewardAvatarLoading || loading}
                >
                  Clear Selection
                </button>
              ) : null}
            </div>

            {rewardAvatarKey ? (
              <div style={{ marginTop: '10px', display: 'flex', gap: '10px', alignItems: 'center' }}>
                {rewardAvatarImage ? (
                  <img
                    src={rewardAvatarImage}
                    alt={rewardAvatarName || 'Reward avatar frame'}
                    style={{ width: '62px', height: '62px', objectFit: 'contain', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.12)', background: 'rgba(255,255,255,0.03)' }}
                  />
                ) : null}
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontWeight: 800 }}>{rewardAvatarName || 'Weekly Reward Frame'}</div>
                  <div style={{ fontSize: '0.8rem', opacity: 0.8 }}>Key: {rewardAvatarKey}</div>
                  {(() => {
                    const picked = (rewardAvatarOptions || []).find((r) => String(r?.key) === String(rewardAvatarKey));
                    if (!picked?.is_used || !picked?.used_by_task) return null;
                    return (
                      <div style={{ fontSize: '0.78rem', opacity: 0.82 }}>
                        Already used in task #{picked.used_by_task.task_id}: {picked.used_by_task.title}
                      </div>
                    );
                  })()}
                </div>
              </div>
            ) : null}
          </div>

          <div className="form-group">
            <label>Starter Code (Optional)</label>
            <div style={{ border: '1px solid rgba(148, 163, 184, 0.26)', borderRadius: '8px', overflow: 'hidden' }}>
              <Editor
                height="220px"
                language={monacoLang}
                theme={editorTheme}
                value={starterCode}
                onChange={(v) => setStarterCode(v ?? '')}
                options={codeEditorOptions}
              />
            </div>
          </div>

          <div className="form-group">
            <label>Solution Code (Optional but recommended)</label>
            <div style={{ border: '1px solid rgba(148, 163, 184, 0.26)', borderRadius: '8px', overflow: 'hidden' }}>
              <Editor
                height="220px"
                language={monacoLang}
                theme={editorTheme}
                value={solutionCode}
                onChange={(v) => setSolutionCode(v ?? '')}
                options={codeEditorOptions}
              />
            </div>
          </div>

          <div className="form-section">
            <div className="form-section-header">
              <h3>Test Cases</h3>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <button
                  type="button"
                  className={`admin-md-toggle ${testCaseMode === 'builder' ? 'is-on' : ''}`}
                  onClick={() => handleSwitchTestCaseMode('builder')}
                >
                  Builder
                </button>
                <button
                  type="button"
                  className={`admin-md-toggle ${testCaseMode === 'advanced' ? 'is-on' : ''}`}
                  onClick={() => handleSwitchTestCaseMode('advanced')}
                >
                  Advanced JSON
                </button>
                {testCaseMode === 'builder' ? (
                  <button type="button" className="btn-add-test" onClick={handleAddTestCase}>
                    <Plus size={16} /> Add Test Case
                  </button>
                ) : null}
              </div>
            </div>
            
            {testCaseMode === 'builder' ? (
              <>
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
                          placeholder='e.g. {"args":["abc",1]}'
                        />
                      </div>
                      <div className="form-group">
                        <label>Expected Output</label>
                        <input
                          type="text"
                          value={tc.output}
                          onChange={e => handleTestCaseChange(index, 'output', e.target.value)}
                          placeholder='e.g. true'
                        />
                      </div>

                      <div className="test-case-meta">
                        <div className="form-group">
                          <label>Mode</label>
                          <input type="text" value="function" readOnly disabled />
                        </div>

                        <div className="form-group">
                          <label>Function Name (optional)</label>
                          <input
                            type="text"
                            value={tc.functionName || ''}
                            onChange={e => handleTestCaseChange(index, 'functionName', e.target.value)}
                            placeholder="e.g. isShiftedPalindrome"
                          />
                        </div>

                        <label className="test-case-hidden-toggle">
                          <input
                            type="checkbox"
                            checked={Boolean(tc.is_hidden)}
                            onChange={e => handleTestCaseChange(index, 'is_hidden', e.target.checked)}
                          />
                          Hidden test case
                        </label>
                      </div>
                    </div>
                    <button type="button" className="btn-remove-test" onClick={() => handleRemoveTestCase(index)} disabled={testCases.length === 1}>
                      <Trash2 size={18} />
                    </button>
                  </div>
                ))}
                <div className="test-case-hint">Tip: Use JSON-style input like <code>{'{"args":["abccba",1]}'}</code> and expected values like <code>true</code>/<code>false</code>.</div>
              </>
            ) : (
              <>
                <div style={{ border: '1px solid rgba(148, 163, 184, 0.26)', borderRadius: '8px', overflow: 'hidden' }}>
                  <JsonEditor
                    height="260px"
                    value={testCasesJson}
                    onChange={(v) => setTestCasesJson(v ?? '')}
                  />
                </div>
                <div className="test-case-hint">Advanced mode: paste your full JSON test case array. Supports <code>expected</code> or <code>output</code>.</div>
              </>
            )}
          </div>

          <div className="admin-modal-footer">
            <button type="button" className="btn-cancel" onClick={onClose} disabled={loading}>
              Cancel
            </button>
            <button type="submit" className="btn-submit" disabled={loading}>
              {loading ? (isEdit ? 'Saving...' : 'Creating...') : (
                <>
                  <Save size={18} /> {isEdit ? 'Save Changes' : 'Save Weekly Task'}
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
