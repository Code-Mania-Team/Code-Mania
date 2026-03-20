-- Seed data for Python map3 side quests
-- Goal: require addition, subtraction, multiplication, division

alter table public.side_quests
  add column if not exists tag text;

with python_lang as (
  select id
  from public.programming_languages
  where lower(slug) = 'python'
  limit 1
),
payload(tag, title, description, task, reward_xp, difficulty, min_xp_required) as (
  values
    ('addition','Side Quest: Addition','Complete the addition practice challenge.','Solve at least one addition problem correctly.',25,'easy',0),
    ('subtraction','Side Quest: Subtraction','Complete the subtraction practice challenge.','Solve at least one subtraction problem correctly.',25,'easy',0),
    ('multiplication','Side Quest: Multiplication','Complete the multiplication practice challenge.','Solve at least one multiplication problem correctly.',25,'easy',0),
    ('division','Side Quest: Division','Complete the division practice challenge.','Solve at least one division problem correctly.',25,'easy',0)
)
insert into public.side_quests (
  tag,
  title,
  description,
  task,
  reward_xp,
  difficulty,
  programming_language_id,
  min_xp_required,
  starts_at,
  expires_at,
  is_active
)
select
  p.tag,
  p.title,
  p.description,
  p.task,
  p.reward_xp,
  p.difficulty,
  l.id,
  p.min_xp_required,
  now(),
  now() + interval '365 day',
  true
from payload p
cross join python_lang l
where not exists (
  select 1
  from public.side_quests sq
  where sq.programming_language_id = l.id
    and lower(coalesce(sq.tag, '')) = p.tag
);

-- Optional test helper: mark all four as completed for a user
-- replace 123 with an existing user_id
--
-- insert into public.user_side_quests (user_id, quest_id, status, completed_at, xp_awarded)
-- select
--   123 as user_id,
--   sq.quest_id,
--   'completed' as status,
--   now() as completed_at,
--   sq.reward_xp as xp_awarded
-- from public.side_quests sq
-- where sq.tag in ('addition', 'subtraction', 'multiplication', 'division')
-- on conflict (user_id, quest_id)
-- do update set
--   status = excluded.status,
--   completed_at = excluded.completed_at,
--   xp_awarded = excluded.xp_awarded,
--   updated_at = now();
