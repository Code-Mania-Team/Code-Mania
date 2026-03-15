import React, { useEffect, useMemo, useState } from "react";
import styles from "../styles/TestCasesEditor.module.css";

function normalizeCase(item) {
  const safe = item && typeof item === "object" ? item : {};
  return {
    ...safe,
    input: safe.input ?? "",
    expected: safe.expected ?? "",
    is_hidden: Boolean(safe.is_hidden),
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

  const active = cases[activeIndex] || normalizeCase({});

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
            value={String(active.input ?? "")}
            onChange={(e) => updateActive("input", e.target.value)}
            rows={4}
            readOnly={readOnly}
            placeholder="Example: 3\nAva 20 60 70 yes\n..."
          />
        </div>

        <div className={styles.field}>
          <div className={styles.fieldLabel}>expected =</div>
          <textarea
            className={styles.textarea}
            value={String(active.expected ?? "")}
            onChange={(e) => updateActive("expected", e.target.value)}
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
