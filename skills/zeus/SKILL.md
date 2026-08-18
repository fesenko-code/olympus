---
name: olympus-zeus
description: Coordinate subagents and route work via delegate_task.
version: 0.1.0
author: fesenko-code, Hermes Agent
license: MIT
platforms: [linux, macos, windows]
metadata:
  hermes:
    tags: [olympus, orchestrator, delegation, planning]
    related_skills: [olympus-athena, olympus-hermes-ag, olympus-hephaestus, olympus-apollo]
---

# Olympus: Zeus — Orchestrator

Zeus is the king of the Olympus pantheon and the orchestration archetype: he
decomposes a high-level goal into independent subagent runs, dispatches them, and
reconciles their results. He does not do the deep work himself — he routes.

## When to Use

- A request is too large or parallelizable for one agent turn.
- You need isolated contexts (each subagent sees only what you pass it).
- Work should fan out to specialist gods (Athena for R&D, Hermes-ag for APIs,
  Hephaestus for infra, Apollo for content).
- Don't use for: a single quick tool call, or work that must share live state
  with the parent (subagents cannot ask questions or see this conversation).

## Archetype & Role

- **Archetype:** King / Orchestrator.
- **Role:** Plan the decomposition, then delegate. Read only what you need to
  route correctly — never the whole codebase.

## Tools

- `delegate_task` — spawn isolated subagents (use `role="leaf"`).
- `read_file` — inspect a spec, plan, or prior output before routing.

## Prerequisites

- Part of the Olympus skill set; no extra installs.
- Ollama is optional (Zeus himself runs on the host Hermes model).

## Example Invocation

```python
delegate_task(
    goal="Summarize the TencentDB memory schema and propose 3 query helpers.",
    context="Repo at C:/Users/Admin/Documents/olympus. Use local Ollama, no Anthropic keys.",
    toolsets=["read_file", "search_files", "write_file"],
    role="leaf",
)
```

## Procedure

1. Restate the goal in one line. **Criterion:** a single sentence the user would recognize.
2. Identify independent workstreams. **Criterion:** each stream needs no output from another to start.
3. For each stream, call `delegate_task` with a self-contained `context`. **Criterion:** a child can run with no further questions.
4. If a child needs a file you hold, `read_file` it and paste the relevant excerpt into `context`. **Criterion:** the excerpt contains the exact lines the child references.
5. Collect child summaries; reconcile contradictions. **Criterion:** one consolidated answer, no dangling references to missing artifacts.

## Pitfalls

- Delegating work that needs clarification just strands a child — resolve ambiguity first or pass it explicitly.
- Subagents cannot call `clarify` back to you; encode every decision they need into `context`.
- Too many parallel children floods context — batch at most 3 at a time on this user's setup.

## Verification

- All `delegate_task` children returned a summary.
- The consolidated answer names each artifact and its owner god.
