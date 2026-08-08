---
description: كود التفعيل — يشغّل كل الوكلاء والمهارات مع بعض
---
Activation. Fast, no preamble:

1. Read `AGENTS.md` — confirm caveman mode, Egyptian Arabic replies, `token-budget` active.
2. Glob and COUNT: `.claude/agents/*.md`, `.claude/skills/*/SKILL.md`, `.claude/commands/*.md`, `.claude/shared/*`.
3. Create `.claude/memo.md` if missing (skill: `session-memo` format, empty sections).
4. Create `.claude/known-issues.md` if missing (header only).
5. Confirm `chief` is the default entry point and `planner` handles first-time plans.
6. Reply EXACTLY in this shape:
```
✅ الفريق شغال
الوكلاء (<n>): chief, planner, autopilot, manager, ...
المهارات (<n>): token-budget, caveman, self-improve, ...
الأوامر (<n>): /chief /plan /auto /ideas /improve /go /memo /fix /ship ...
أكواد جاهزة: <n> ملف في .claude/shared
رجل الكهف + توفير التوكنز: مفعّل
الميمو: <اتعمل/موجود>

جاهز. اكتب /chief <المهمة> ونبدأ.
```
7. Anything missing → name the folder and the one command that fixes it. Nothing more.
