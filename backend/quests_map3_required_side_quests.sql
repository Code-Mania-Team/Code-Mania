-- Data-driven side-quest prerequisites for map3/order_index=3
-- Applies to Python, JavaScript, and C++ quests.

with langs as (
  select id
  from public.programming_languages
  where lower(slug) in ('python', 'javascript', 'cpp')
)
update public.quests q
set requirements = jsonb_set(
  case
    when jsonb_typeof(q.requirements) = 'object' then q.requirements
    else '{}'::jsonb
  end,
  '{required_side_quests}',
  '["addition","subtraction","multiplication","division"]'::jsonb,
  true
)
where q.programming_language_id in (select id from langs)
  and q.order_index = 3;
