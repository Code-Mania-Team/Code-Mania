import React from "react";
import Editor from "@monaco-editor/react";

const baseOptions = {
  minimap: { enabled: false },
  scrollBeyondLastLine: false,
  wordWrap: "on",
  tabSize: 2,
  fontSize: 13,
  lineNumbers: "on",
  renderLineHighlight: "line",
  automaticLayout: true,
  formatOnPaste: true,
  formatOnType: true,
  bracketPairColorization: { enabled: true },
};

export default function JsonEditor({
  value,
  onChange,
  height = "220px",
  readOnly = false,
}) {
  return (
    <Editor
      height={height}
      language="json"
      theme="vs-dark"
      value={typeof value === "string" ? value : String(value ?? "")}
      onChange={(v) => {
        if (typeof onChange === "function") onChange(v ?? "");
      }}
      options={{
        ...baseOptions,
        readOnly,
      }}
    />
  );
}
