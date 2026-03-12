-- 1) Add new columns to quizzes table
ALTER TABLE quizzes 
ADD COLUMN IF NOT EXISTS quiz_type VARCHAR(50) DEFAULT 'mcq',
ADD COLUMN IF NOT EXISTS code_prompt TEXT,
ADD COLUMN IF NOT EXISTS starting_code TEXT,
ADD COLUMN IF NOT EXISTS test_cases JSONB,
ADD COLUMN IF NOT EXISTS exp_total INTEGER;

-- 2) Update existing stage 1 quizzes to 'mcq'
UPDATE quizzes 
SET quiz_type = 'mcq' 
WHERE route LIKE '%stage-1%';

-- 3) Content/backfill for Stage 2-4 quizzes per language (Python)
-- Python Stage 2
UPDATE quizzes SET
  quiz_type = 'code',
  code_prompt = 'Write a Python function named "calculate_sum" that takes two numbers and returns their sum.',
  starting_code = 'def calculate_sum(a, b):\n    # Write your code here\n    pass',
  test_cases = '[
    {"input": "2, 3", "expected": "5", "is_hidden": false},
    {"input": "-1, 1", "expected": "0", "is_hidden": true},
    {"input": "10, 20", "expected": "30", "is_hidden": true}
  ]'::jsonb,
  exp_total = 500
WHERE programming_language_id = (SELECT id FROM programming_languages WHERE slug = 'python' LIMIT 1) AND route LIKE '%stage-2%';

-- Python Stage 3
UPDATE quizzes SET
  quiz_type = 'code',
  code_prompt = 'Write a Python function named "find_max" that takes a list of numbers and returns the maximum value. Do not use the built-in max() function.',
  starting_code = 'def find_max(numbers):\n    # Write your code here\n    pass',
  test_cases = '[
    {"input": "[1, 5, 3, 9, 2]", "expected": "9", "is_hidden": false},
    {"input": "[-10, -3, -20]", "expected": "-3", "is_hidden": true},
    {"input": "[42]", "expected": "42", "is_hidden": true}
  ]'::jsonb,
  exp_total = 500
WHERE programming_language_id = (SELECT id FROM programming_languages WHERE slug = 'python' LIMIT 1) AND route LIKE '%stage-3%';

-- Python Stage 4
UPDATE quizzes SET
  quiz_type = 'code',
  code_prompt = 'Write a Python function named "is_palindrome" that takes a string and returns True if it is a palindrome, and False otherwise. Ignore spaces and case differences.',
  starting_code = 'def is_palindrome(text):\n    # Write your code here\n    pass',
  test_cases = '[
    {"input": "\"racecar\"", "expected": "True", "is_hidden": false},
    {"input": "\"hello\"", "expected": "False", "is_hidden": true},
    {"input": "\"A man a plan a canal Panama\"", "expected": "True", "is_hidden": true}
  ]'::jsonb,
  exp_total = 500
WHERE programming_language_id = (SELECT id FROM programming_languages WHERE slug = 'python' LIMIT 1) AND route LIKE '%stage-4%';

-- 4) Content/backfill for JavaScript Stage 2-4
UPDATE quizzes SET
  quiz_type = 'code',
  code_prompt = 'Write a function named "calculateSum" that takes two numbers and returns their sum.',
  starting_code = 'function calculateSum(a, b) {\n    // Write your code here\n}',
  test_cases = '[
    {"input": "2, 3", "expected": "5", "is_hidden": false},
    {"input": "-1, 1", "expected": "0", "is_hidden": true},
    {"input": "10, 20", "expected": "30", "is_hidden": true}
  ]'::jsonb,
  exp_total = 500
WHERE programming_language_id = (SELECT id FROM programming_languages WHERE slug = 'javascript' LIMIT 1) AND route LIKE '%stage-2%';

UPDATE quizzes SET
  quiz_type = 'code',
  code_prompt = 'Write a function named "findMax" that takes an array of numbers and returns the maximum value.',
  starting_code = 'function findMax(numbers) {\n    // Write your code here\n}',
  test_cases = '[
    {"input": "[1, 5, 3, 9, 2]", "expected": "9", "is_hidden": false},
    {"input": "[-10, -3, -20]", "expected": "-3", "is_hidden": true},
    {"input": "[42]", "expected": "42", "is_hidden": true}
  ]'::jsonb,
  exp_total = 500
WHERE programming_language_id = (SELECT id FROM programming_languages WHERE slug = 'javascript' LIMIT 1) AND route LIKE '%stage-3%';

UPDATE quizzes SET
  quiz_type = 'code',
  code_prompt = 'Write a function named "isPalindrome" that takes a string and returns true if it is a palindrome, false otherwise. Ignore spaces and case.',
  starting_code = 'function isPalindrome(text) {\n    // Write your code here\n}',
  test_cases = '[
    {"input": "\"racecar\"", "expected": "true", "is_hidden": false},
    {"input": "\"hello\"", "expected": "false", "is_hidden": true},
    {"input": "\"A man a plan a canal Panama\"", "expected": "true", "is_hidden": true}
  ]'::jsonb,
  exp_total = 500
WHERE programming_language_id = (SELECT id FROM programming_languages WHERE slug = 'javascript' LIMIT 1) AND route LIKE '%stage-4%';

-- 5) Content/backfill for C++ Stage 2-4
UPDATE quizzes SET
  quiz_type = 'code',
  code_prompt = 'Write a function named "calculateSum" that takes two integers and returns their sum.',
  starting_code = 'int calculateSum(int a, int b) {\n    // Write your code here\n}',
  test_cases = '[
    {"input": "2 3", "expected": "5", "is_hidden": false},
    {"input": "-1 1", "expected": "0", "is_hidden": true},
    {"input": "10 20", "expected": "30", "is_hidden": true}
  ]'::jsonb,
  exp_total = 500
WHERE programming_language_id = (SELECT id FROM programming_languages WHERE slug = 'cpp' LIMIT 1) AND route LIKE '%stage-2%';

UPDATE quizzes SET
  quiz_type = 'code',
  code_prompt = 'Write a function named "findMax" that takes a std::vector<int> and returns the maximum value.',
  starting_code = '#include <vector>\nusing namespace std;\n\nint findMax(vector<int> numbers) {\n    // Write your code here\n}',
  test_cases = '[
    {"input": "5 1 5 3 9 2", "expected": "9", "is_hidden": false},
    {"input": "3 -10 -3 -20", "expected": "-3", "is_hidden": true},
    {"input": "1 42", "expected": "42", "is_hidden": true}
  ]'::jsonb,
  exp_total = 500
WHERE programming_language_id = (SELECT id FROM programming_languages WHERE slug = 'cpp' LIMIT 1) AND route LIKE '%stage-3%';

UPDATE quizzes SET
  quiz_type = 'code',
  code_prompt = 'Write a function named "isPalindrome" that takes a string and returns a boolean (true or false). Ignore spaces and case.',
  starting_code = '#include <string>\nusing namespace std;\n\nbool isPalindrome(string text) {\n    // Write your code here\n}',
  test_cases = '[
    {"input": "\"racecar\"", "expected": "1", "is_hidden": false},
    {"input": "\"hello\"", "expected": "0", "is_hidden": true},
    {"input": "\"A man a plan a canal Panama\"", "expected": "1", "is_hidden": true}
  ]'::jsonb,
  exp_total = 500
WHERE programming_language_id = (SELECT id FROM programming_languages WHERE slug = 'cpp' LIMIT 1) AND route LIKE '%stage-4%';
