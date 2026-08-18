---
name: olympus-hera
description: Validate and reject unsafe changes via local PydanticAI.
version: 0.1.0
author: fesenko-code, Hermes Agent
license: MIT
platforms: [linux, macos, windows]
metadata:
  hermes:
    tags: [olympus, safety, validation, pydantic-ai, ollama]
    related_skills: [olympus-zeus, olympus-athena, olympus-hephaestus]
---

# Olympus: Hera — Guardian / Validator

Hera is the protector of the pantheon. She inspects a proposed change or
generated output and rejects anything dangerous, using a local PydanticAI
validator. No Anthropic keys; the judge runs on Ollama.

## When to Use

- Before applying a `patch` that could break behavior or leak secrets.
- To screen generated content for unsafe instructions or destructive actions.
- Don't use for: authoring new content (use Apollo) or structured research
  (use Athena) — Hera only judges.

## Archetype & Role

- **Archetype:** Queen / Guardian.
- **Role:** Classify a change as safe or unsafe; when unsafe, block and explain.

## Tools

- `patch` — apply the fix only after it passes validation.
- `read_file` — inspect the diff / file under review.
- `clarify` — ask the user when a verdict is genuinely ambiguous.

## Prerequisites

- `pip install pydantic-ai` (verified: pydantic-ai 2.31.1; pulls `openai>=2.45` for the Ollama provider).
- Ollama local with `hermes3:8b` at `http://localhost:11434/v1` (the OpenAI-compatible endpoint; the `/v1` suffix is required by pydantic-ai's `OllamaProvider`). No cloud keys.

## Example Invocation

```python
from pydantic import BaseModel, field_validator
from pydantic_ai import Agent
from pydantic_ai.models.ollama import OllamaModel
from pydantic_ai.providers.ollama import OllamaProvider

class Verdict(BaseModel):
    safe: bool
    risk: str
    reason: str

    @field_validator("safe")
    @classmethod
    def reject_dangerous(cls, v, info):
        if info.data.get("risk") in ("data-loss", "secret-leak", "rce") and v:
            raise ValueError("Dangerous change must be marked unsafe")
        return v

agent = Agent(
    OllamaModel(
        model_name="hermes3:8b",
        provider=OllamaProvider(base_url="http://localhost:11434/v1"),
    ),
    output_type=Verdict,
    instructions="You are Hera. Reply with ONLY a JSON object matching the schema.",
    retries=3,
)

verdict = (await agent.run(patch_text)).output
if not verdict.safe:
    clarify(f"Blocked: {verdict.reason}")   # do NOT patch
else:
    patch(path, old, new)
```

## Procedure

1. `read_file` the change under review. **Criterion:** you have the exact lines/diff.
2. Run the `Verdict` agent on the change. **Criterion:** `verdict` (the `output` of the agent run) validates as `Verdict`.
3. If `safe` is false → stop and `clarify` or report; do NOT patch. **Criterion:** no mutation happened.
4. If ambiguous → `clarify` before deciding. **Criterion:** the user's answer is recorded in context.
5. Only when `safe` is true, `patch` the file. **Criterion:** the file changed exactly as intended and still parses.

## Pitfalls

- Never patch first and validate after — Hera's whole point is to block early.
- A validator that always returns `safe=true` is a no-op; keep the risk taxonomy real.
- `clarify` is for genuine ambiguity, not for outsourcing the decision.

## Verification

- Every applied patch had a prior `safe=true` verdict.
- At least one dangerous sample was rejected in testing (keep a fixture).
