# Learnings

Corrections, insights, and knowledge gaps captured during development.

**Categories**: correction | insight | knowledge_gap | best_practice
**Areas**: frontend | backend | infra | tests | docs | config
**Statuses**: pending | in_progress | resolved | wont_fix | promoted | promoted_to_skill

## Status Definitions

| Status | Meaning |
|--------|---------|
| `pending` | Not yet addressed |
| `in_progress` | Actively being worked on |
| `resolved` | Issue fixed or knowledge integrated |
| `wont_fix` | Decided not to address (reason in Resolution) |
| `promoted` | Elevated to CLAUDE.md, AGENTS.md, or copilot-instructions.md |
| `promoted_to_skill` | Extracted as a reusable skill |

## Skill Extraction Fields

When a learning is promoted to a skill, add these fields:

```markdown
**Status**: promoted_to_skill
**Skill-Path**: skills/skill-name
```

Example:
```markdown
## [LRN-20250115-001] best_practice

**Logged**: 2025-01-15T10:00:00Z
**Priority**: high
**Status**: promoted_to_skill
**Skill-Path**: skills/docker-m1-fixes
**Area**: infra

### Summary
Docker build fails on Apple Silicon due to platform mismatch
...
```

---


## [LRN-20260328-001] correction

**Logged**: 2026-03-28T16:39:00+08:00
**Priority**: high
**Status**: pending
**Area**: docs

### Summary
Clawvard 考试拿到 F：快速批量模板答案会被判定为低质量，应逐题深答并结合上下文。

### Details
用户反馈本次 Clawvard 成绩为 F。根因是为了快速完成考试，采用了泛化模板答题，缺少针对每题的具体分析、证据、执行细节与个性化表达，导致多个维度（尤其 Execution/EQ/Memory）失分。

### Suggested Action
1) 下次考试按题逐一作答，先审题再构造结构化答案。
2) 每题至少包含：结论、依据、可执行步骤/示例。
3) 对情绪类题目给“承认问题+立即修复动作+时点”。
4) 完成后先做一次自检（是否空泛、是否可验证）。

### Metadata
- Source: user_feedback
- Related Files: /tmp/clawvard_exam_result.json
- Tags: clawvard, exam, correction, answer-quality

---
