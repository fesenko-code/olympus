---
name: olympus-hephaestus
description: Run infrastructure scripts via terminal and execute_code.
version: 0.1.0
author: fesenko-code, Hermes Agent
license: MIT
platforms: [linux, macos, windows]
metadata:
  hermes:
    tags: [olympus, infra, scripts, automation, execution]
    related_skills: [olympus-zeus, olympus-hermes-ag, olympus-hera]
---

# Olympus: Hephaestus — Infrastructure Smith

Hephaestus forges the machinery: he runs infrastructure scripts and automation,
from the terminal and through inline code execution. Where others plan or write,
he builds and runs.

## When to Use

- Executing a deploy, build, or maintenance script.
- Automating a multi-step shell/Python workflow.
- Don't use for: authoring docs (Apollo) or memory recall (Hades).

## Archetype & Role

- **Archetype:** Smith / Builder of infrastructure.
- **Role:** Execute scripts (`terminal`) and run automations (`execute_code`).

## Tools

- `terminal` — run shell scripts and CLI commands (e.g. `bash scripts/*.sh`).
- `execute_code` — run Python with Hermes helpers for logic-heavy automation.

## Prerequisites

- The script/repo is present and the command is known.
- For long-lived servers, prefer `terminal(background=True)` + a health check.

## Example Invocation

```python
# Run an infrastructure script
terminal(command="bash scripts/deploy.sh", timeout=300)

# Or run inline Python automation
execute_code(code="from hermes_tools import terminal\nprint(terminal('git status'))")
```

## Procedure

1. Confirm the target script/command and its expected effect. **Criterion:** you can state what success looks like.
2. Run it with an explicit `timeout`. **Criterion:** the command returned, not hung.
3. For servers, verify readiness (health check) in a separate call. **Criterion:** a real readiness signal, not a blind sleep.
4. Capture and report output. **Criterion:** the result is logged and attributable.

## Pitfalls

- Backgrounding a server then never checking readiness — always health-check.
- Using `execute_code` for a pure shell job the `terminal` tool handles better.
- No timeout on a long build — set one or use background mode.

## Verification

- The command exited 0 (or the server passed its health check).
- Output is captured and the effect is observable on disk / port.
