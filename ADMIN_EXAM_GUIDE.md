# Admin Exam Content Guide

This guide explains how to add/edit Coding Exam problems as an admin, and how to format `problem_description` + `test_cases` so they render correctly in the app.

## Where To Edit

- UI: open the Admin page, then go to the Exam Manager for the language.
- The editor shows a live Preview on the right.

## Data Model (exam_problems)

Each exam problem row is expected to have these fields:

- `problem_title` (string)
- `problem_description` (JSON)
- `starting_code` (string)
- `solution` (string)
- `test_cases` (JSON array)
- `exp` (number)
- `programming_language_id` (number)

Note: the app currently assumes **one exam problem per language**.

## problem_description Format (LeetCode-style)

Store `problem_description` as a JSON object with a `sections` array:

```json
{
  "sections": [
    { "type": "heading", "level": 2, "content": "Problem" },
    { "type": "paragraph", "content": "Your text here." },
    {
      "type": "list",
      "style": "bullet",
      "items": ["First", "Second"]
    }
  ]
}
```

Supported section types:

- `heading`: `level` (number) + `content` (string)
- `paragraph`: `content` (string)
- `list`: `style` is `"number"` or `"bullet"`, and `items` is a string array

Rendering tips:

- Inline code pills: wrap text in backticks inside `content`/`items`, e.g. ``"Use `n`"``.
- "Example" blocks: if a paragraph contains multi-line text with `Input:` / `Output:` / `Explanation:`, it renders as a code-style block.
- Chip rows: if a list is *all* backtick-wrapped items (e.g. ``"`1 <= n <= 10^5`"``), it renders as LeetCode-like chips.

## test_cases Format

Store `test_cases` as a JSON array of objects.

Recommended shape:

```json
[
  {
    "input": "3\nAva 20 60 70 yes\nBen 17 90 60 yes\nCia 18 49 80 yes\n",
    "expected": "1\n2\n",
    "is_hidden": false
  },
  {
    "input": "...",
    "expected": "...",
    "is_hidden": true
  }
]
```

Notes:

- `input` and `expected` should be strings (use `\n` for new lines).
- Use `is_hidden: true` for hidden cases. The UI masks hidden inputs/expected for non-admin users.

## Why Test Cases Sometimes Don’t Show

- The public list endpoint (`GET /v1/exam/problems?language=...`) returns a summary and may omit `test_cases`.
- The app fetches safe details via `GET /v1/exam/problems/:problemId` to get `test_cases`.
- The Admin editor fetches full details via `GET /v1/admin/exam/problems/:problemId`.

## Common Mistakes

- `problem_description` saved as plain text instead of JSON: the exam page won’t render sections.
- Invalid JSON in the Admin editor: Save is blocked if the field starts with `{` or `[` but isn’t valid JSON.
- Test cases not an array: backend expects a JSON array (or it will reject the update).

## Quick Checklist

- `problem_description` is valid JSON with `{ "sections": [...] }`.
- Lists use `style: "number"` or `style: "bullet"`.
- `test_cases` is a JSON array of `{ input, expected, is_hidden }` objects.
- Hidden cases have `is_hidden: true`.
