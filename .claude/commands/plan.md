---
description: أول برومت لمهمة جديدة — خطة تفصيلية بخطوات صغيرة قبل التنفيذ
argument-hint: [وصف المهمة]
---
Task: $ARGUMENTS

Hand to `planner`. Ultra-think: explore approaches internally, output only the final plan.
Plan = small sequential steps, each tagged with the executing agent and model (haiku/sonnet/opus per the assignment rules).
Save to `.claude/plans/<slug>.md`, show it, then ask: "أبدأ التنفيذ؟" before handing to `autopilot`.
