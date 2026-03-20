-- Seed map3 arithmetic side quests for JavaScript and C++
-- Uses shared tags so prerequisites can stay data-driven.

alter table public.side_quests
  add column if not exists tag text;

with langs as (
  select id, lower(slug) as slug
  from public.programming_languages
  where lower(slug) in ('javascript', 'cpp')
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
cross join langs l
where not exists (
  select 1
  from public.side_quests sq
  where sq.programming_language_id = l.id
    and lower(coalesce(sq.tag, '')) = p.tag
);
