---
description: الأمر الوحيد — يشغّل الفريق كامل تلقائي من الخطة للتنفيذ للحفظ
argument-hint: [المهمة]
---
**CAVEMAN MODE ACTIVE** — كل خطوة تحت ده بتشتغل بسلوك caveman (رد قصير، بدون مقدمات، بدون خاتمة).

Request: $ARGUMENTS

## 0. ORCHESTRATE (تختار المهارات المناسبة)
Apply `skill-orchestrator`: read `.claude/skills/*/SKILL.md`, match this request.
Caveman is **always on** (not optional, not conditional). All other skills: optional.

## 1. BOOT
Read `.claude/work-log.md`. That is your full context.

## 2. ROUTE → `chief`
Deep think. Decompose. Apply `task-routing` + `dispatcher`.
Assign: part → agent → skills → model.

## 3. PLAN (لو الشغل كبير أو جديد)
`planner` writes `.claude/plans/<slug>.md`. Small/obvious? skip.

## 4. EXECUTE
Run steps. Parallel where independent. Each agent:
- Uses Browser tool to test UI/sites
- Max 3 error attempts, then reports
- Writes diffs only

## 5. REVIEW
`manager` reviews silently.

## 6. CONDITIONAL
- Code/build changed → `qa-tester`
- Registry/admin touched → `security-auditor`
- UI changed → `user-sim`
- Feature done → `changelog`

## 6b. TRACK
Apply `cost-tracker`: log to `.claude/cost-log.md`. Flag inline if issues.

## 7. SAVE
Update `.claude/work-log.md`:
```markdown
## آخر تحديث: <datetime>
- ✅ خلص: <اللي اتعمل>
- 🔄 جاري: <أو فاضي>
- ⛔ موقوف: <أو فاضي>
```

## OUTPUT (caveman إجباري)
```
✅ <اللي اتعمل>
⚠️ <خطر واحد — أو مفيش>
💡 <فكرة واحدة>
```
