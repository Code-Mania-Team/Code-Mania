-- Migration helper: store exam problem descriptions as Markdown text.
--
-- If your `exam_problems.problem_description` column is currently JSON/JSONB,
-- this converts it to TEXT by stringifying the JSON value.
-- If you want prettier Markdown for existing JSON `{sections:[...]}` rows,
-- migrate them via the app (Admin save will convert to Markdown) or do a custom script.

ALTER TABLE exam_problems
  ALTER COLUMN problem_description
  TYPE text
  USING problem_description::text;
