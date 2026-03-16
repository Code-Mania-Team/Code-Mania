import React, { useEffect, useMemo, useState } from "react";
import styles from "../styles/TestCasesEditor.module.css";

function normalizeCase(item) {
  const safe = item && typeof item === "object" ? item : {};

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

  const inputVarsRaw = safe.input_vars ?? safe.inputVars;
  const input_vars =
    inputVarsRaw && typeof inputVarsRaw === "object" && !Array.isArray(inputVarsRaw)
      ? inputVarsRaw
      : undefined;

  return {
    ...safe,
    input: safe.input ?? "",
    expected: safe.expected ?? "",
    is_hidden: coerceBool(safe.is_hidden ?? safe.isHidden),
    ...(input_vars ? { input_vars } : {}),
  };
}

function parseCases(raw) {
  const trimmed = typeof raw === "string" ? raw.trim() : "";
  if (!trimmed) return { cases: [], error: "" };

  try {
    const parsed = JSON.parse(trimmed);
    if (!Array.isArray(parsed)) {
      return { cases: [], error: "Test cases JSON must be an array." };
    }
    return { cases: parsed.map(normalizeCase), error: "" };
  } catch {
    return { cases: [], error: "Test cases must be valid JSON." };
  }
}

export default function TestCasesEditor({ value, onChange, readOnly = false }) {
  const initial = useMemo(() => parseCases(value), [value]);
  const [cases, setCases] = useState(() => (initial.cases.length ? initial.cases : [normalizeCase({})]));
  const [activeIndex, setActiveIndex] = useState(0);
  const [parseError, setParseError] = useState(initial.error);
  const [varNameDrafts, setVarNameDrafts] = useState({});

  useEffect(() => {
    const parsed = parseCases(value);
    if (!parsed.error) {
      setCases(parsed.cases.length ? parsed.cases : [normalizeCase({})]);
      setParseError("");
      return;
    }

    // Keep existing UI state so user can fix it.
    setParseError(parsed.error);
    setCases((prev) => (Array.isArray(prev) && prev.length ? prev : [normalizeCase({})]));
  }, [value]);

  useEffect(() => {
    setActiveIndex((prev) => {
      const max = Math.max(0, (cases?.length || 1) - 1);
      return Math.min(prev, max);
    });
  }, [cases]);

  const emit = (nextCases) => {
    setCases(nextCases);
    if (typeof onChange === "function") {
      onChange(JSON.stringify(nextCases, null, 2));
    }
  };

  const addCase = () => {
    if (readOnly) return;
    const next = [...cases, normalizeCase({})];
    emit(next);
    setActiveIndex(next.length - 1);
  };

  const removeActiveCase = () => {
    if (readOnly) return;
    if (cases.length <= 1) return;
    const next = cases.filter((_, idx) => idx !== activeIndex);
    emit(next);
    setActiveIndex((prev) => Math.max(0, Math.min(prev, next.length - 1)));
  };

  const updateActive = (key, nextValue) => {
    if (readOnly) return;
    const next = cases.map((tc, idx) =>
      idx === activeIndex ? { ...tc, [key]: nextValue } : tc
    );
    emit(next);
  };

  const formatFieldForTextarea = (fieldValue) => {
    if (fieldValue === null || fieldValue === undefined) return "";
    if (typeof fieldValue === "string") return fieldValue;
    try {
      return JSON.stringify(fieldValue, null, 2);
    } catch {
      return String(fieldValue);
    }
  };

  const parseTextareaMaybeJson = (text) => {
    if (typeof text !== "string") return text;
    const trimmed = text.trim();
    if (!trimmed) return "";

    const looksJsonish =
      trimmed.startsWith("{") ||
      trimmed.startsWith("[") ||
      trimmed.startsWith('"') ||
      trimmed === "true" ||
      trimmed === "false" ||
      trimmed === "null" ||
      /^-?\d+(?:\.\d+)?$/.test(trimmed);

    if (!looksJsonish) return text;

    try {
      return JSON.parse(trimmed);
    } catch {
      return text;
    }
  };

  const upsertInputVar = (name, rawValue) => {
    if (readOnly) return;
    const key = String(name ?? "").trim();
    if (!key) return;

    const parseTyped = (v) => {
      if (v === null || v === undefined) return "";
      if (typeof v !== "string") return v;

      const s = v.trim();
      if (!s) return "";

      const looksJsonish =
        s.startsWith("{") ||
        s.startsWith("[") ||
        s.startsWith('"') ||
        s === "true" ||
        s === "false" ||
        s === "null" ||
        /^-?\d+(?:\.\d+)?$/.test(s);

      if (!looksJsonish) return v;

      try {
        return JSON.parse(s);
      } catch {
        return v;
      }
    };

    const nextValue = parseTyped(rawValue);
    const next = cases.map((tc, idx) => {
      if (idx !== activeIndex) return tc;
      const existing = tc?.input_vars && typeof tc.input_vars === "object" && !Array.isArray(tc.input_vars)
        ? tc.input_vars
        : {};
      return {
        ...tc,
        input_vars: {
          ...existing,
          [key]: nextValue,
        },
      };
    });

    emit(next);
  };

  const removeInputVar = (name) => {
    if (readOnly) return;
    const key = String(name ?? "").trim();
    if (!key) return;

    const next = cases.map((tc, idx) => {
      if (idx !== activeIndex) return tc;
      const existing = tc?.input_vars && typeof tc.input_vars === "object" && !Array.isArray(tc.input_vars)
        ? tc.input_vars
        : {};
      const { [key]: _omit, ...rest } = existing;
      const nextTc = { ...tc };
      if (Object.keys(rest).length) {
        nextTc.input_vars = rest;
      } else {
        delete nextTc.input_vars;
      }
      return nextTc;
    });

    emit(next);
  };

  const renameInputVar = (oldName, nextNameRaw) => {
    if (readOnly) return;
    const oldKey = String(oldName ?? "").trim();
    const desired = String(nextNameRaw ?? "").trim();
    if (!oldKey || !desired || desired === oldKey) return;

    const existingKeys = new Set(Object.keys(inputVars));
    existingKeys.delete(oldKey);

    let nextKey = desired;
    if (existingKeys.has(nextKey)) {
      let n = 2;
      while (existingKeys.has(`${desired}_${n}`)) n += 1;
      nextKey = `${desired}_${n}`;
    }

    const next = cases.map((tc, idx) => {
      if (idx !== activeIndex) return tc;
      const existing = tc?.input_vars && typeof tc.input_vars === "object" && !Array.isArray(tc.input_vars)
        ? tc.input_vars
        : {};
      const { [oldKey]: movedValue, ...rest } = existing;
      return {
        ...tc,
        input_vars: {
          ...rest,
          [nextKey]: movedValue,
        },
      };
    });

    emit(next);
    setVarNameDrafts((prev) => {
      const copy = { ...(prev || {}) };
      delete copy[oldKey];
      copy[nextKey] = nextKey;
      return copy;
    });
  };

  const active = cases[activeIndex] || normalizeCase({});
  const inputVars =
    active?.input_vars && typeof active.input_vars === "object" && !Array.isArray(active.input_vars)
      ? active.input_vars
      : {};
  const inputVarEntries = Object.entries(inputVars);
  const showVars = inputVarEntries.length > 0;

  useEffect(() => {
    setVarNameDrafts((prev) => {
      const next = {};
      for (const [k] of inputVarEntries) {
        next[k] = prev?.[k] ?? k;
      }
      return next;
    });
  }, [activeIndex, value]);

  return (
    <div className={styles.wrap}>
      <div className={styles.tabs} role="tablist" aria-label="Test cases">
        {cases.map((tc, idx) => {
          const isActive = idx === activeIndex;
          return (
            <button
              key={idx}
              type="button"
              className={`${styles.tab} ${isActive ? styles.tabActive : ""}`}
              onClick={() => setActiveIndex(idx)}
              role="tab"
              aria-selected={isActive}
            >
              Case {idx + 1}
              {tc?.is_hidden ? <span className={styles.hiddenDot} title="Hidden" /> : null}
            </button>
          );
        })}

        <button
          type="button"
          className={styles.tabAdd}
          onClick={addCase}
          disabled={readOnly}
          title={readOnly ? "Read-only" : "Add test case"}
          aria-label="Add test case"
        >
          +
        </button>
      </div>

      {parseError ? <div className={styles.parseError}>{parseError}</div> : null}

      <div className={styles.panel} role="tabpanel">
        <div className={styles.field}>
          <div className={styles.fieldLabel}>input =</div>
          <textarea
            className={styles.textarea}
            value={formatFieldForTextarea(active.input)}
            onChange={(e) => updateActive("input", parseTextareaMaybeJson(e.target.value))}
            rows={4}
            readOnly={readOnly}
            placeholder="Example: 3\nAva 20 60 70 yes\n..."
          />
        </div>

        <div className={styles.varsBox}>
          <div className={styles.varsHeader}>
            <div className={styles.varsTitle}>input_vars (optional)</div>
            <div className={styles.varsActions}>
              <button
                type="button"
                className={styles.varsBtn}
                onClick={() => {
                  let base = "var";
                  let n = 1;
                  const existing = new Set(Object.keys(inputVars));
                  while (existing.has(`${base}_${n}`)) n += 1;
                  upsertInputVar(`${base}_${n}`, "");
                }}
                disabled={readOnly}
                title="Add variable"
              >
                + Variable
              </button>
            </div>
          </div>

          {!showVars ? (
            <div className={styles.varsEmpty}>No variables yet. Add some for nicer display in the Test Cases tab.</div>
          ) : (
            <div className={styles.varsGrid}>
              {inputVarEntries.map(([k, v]) => {
                const valueText =
                  v && typeof v === "object"
                    ? (() => {
                        try {
                          return JSON.stringify(v, null, 2);
                        } catch {
                          return String(v);
                        }
                      })()
                    : String(v ?? "");

                return (
                  <div key={k} className={styles.varRow}>
                    <div className={styles.varNameWrap}>
                      <input
                        className={styles.varName}
                        value={varNameDrafts?.[k] ?? k}
                        onChange={(e) =>
                          setVarNameDrafts((prev) => ({
                            ...(prev || {}),
                            [k]: e.target.value,
                          }))
                        }
                        onBlur={() => renameInputVar(k, varNameDrafts?.[k] ?? k)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            e.currentTarget.blur();
                          }
                        }}
                        readOnly={readOnly}
                      />
                      <span className={styles.varEq}>=</span>
                    </div>
                    <textarea
                      className={styles.varValue}
                      value={valueText}
                      onChange={(e) => upsertInputVar(k, e.target.value)}
                      rows={2}
                      readOnly={readOnly}
                    />
                    <button
                      type="button"
                      className={styles.varRemove}
                      onClick={() => removeInputVar(k)}
                      disabled={readOnly}
                      title="Remove variable"
                    >
                      Remove
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className={styles.field}>
          <div className={styles.fieldLabel}>expected =</div>
          <textarea
            className={styles.textarea}
            value={formatFieldForTextarea(active.expected)}
            onChange={(e) => updateActive("expected", parseTextareaMaybeJson(e.target.value))}
            rows={4}
            readOnly={readOnly}
            placeholder="Example: 1\n2\n"
          />
        </div>

        <div className={styles.metaRow}>
          <label className={styles.checkbox}>
            <input
              type="checkbox"
              checked={Boolean(active.is_hidden)}
              onChange={(e) => updateActive("is_hidden", e.target.checked)}
              disabled={readOnly}
            />
            Hidden test case
          </label>

          <button
            type="button"
            className={styles.deleteBtn}
            onClick={removeActiveCase}
            disabled={readOnly || cases.length <= 1}
            title={cases.length <= 1 ? "Keep at least one case" : "Delete this case"}
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}
