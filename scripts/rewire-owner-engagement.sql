-- Idempotent: safe to re-run. Rewires the seeded lead tied to
-- engagement 44 (automation 14) to the admin Clerk user's email
-- so /app auto-claim binds on first portal visit.

-- If engagement 44 doesn't exist anymore (e.g. you reset your Neon
-- DB), this is a no-op and you'll need to re-seed — see the pre-flight
-- checklist at the bottom of docs/plans/2026-04-14-phase-5-rehearsal.md.

UPDATE leads
SET email = 'ramonvallejerajr@gmail.com'
WHERE id = (
  SELECT lead_id FROM engagements WHERE id = 44
)
AND email LIKE 'n8n-smoke-%@raijuu.test';

-- Confirm the link
SELECT
  e.id  AS engagement_id,
  e.company_name,
  e.clerk_user_id,
  l.id  AS lead_id,
  l.email
FROM engagements e
JOIN leads l ON l.id = e.lead_id
WHERE e.id = 44;
