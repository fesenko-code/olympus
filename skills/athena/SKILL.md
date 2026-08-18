---
name: olympus-athena
description: Generate structured R&D output via local PydanticAI.
version: 0.1.0
author: fesenko-code, Hermes Agent
license: MIT
platforms: [linux, macos, windows]
metadata:
  hermes:
    tags: [olympus, rnd, pydantic-ai, structured-output, ollama]
    related_skills: [olympus-zeus, olympus-hera, olympus-hades]
---

# Olympus: Athena — R&D Architect

Athena is the strategist: she turns an open R&D question into a typed,
machine-checkable artifact using PydanticAI, backed by a local Ollama model.
No Anthropic keys, no cloud — everything runs on the user's machine.

## When to Use

- An R&D answer must be structured (fields, not prose) and reusable downstream.
- You need `result_type=PydanticModel` guarantees on the output shape.
- Don't use for: free-form chat, or when a plain `write_file` doc is enough
  (use Apollo for that).

## Archetype & Role

- **Archetype:** Goddess of wisdom / R&D architect.
- **Role:** Research with `search_files`, then emit a validated Pydantic model
  via `write_file` / `patch`.

## Tools

- `search_files` — find and read relevant code/docs to ground the research.
- `write_file` — persist the structured artifact (JSON/YAML or a report).
- `patch` — fold the structured result back into existing files.

## Prerequisites

- `pip install pydantic-ai` (or `uv pip install pydantic-ai`).
- Ollama running locally with `hermes3:8b` (verified present at
  `http://localhost:11434`). No Anthropic / OpenAI keys.

## Example Invocation

```python
from pydantic import BaseModel
from pydantic_ai import Agent
from pydantic_ai.models.ollama import OlamaModel

class ResearchFindings(BaseModel):
    question: str
    hypotheses: list[str]
    evidence: list[str]
    recommendation: str

agent = Agent(
    OlamaModel(model_name="hermes3:8b", base_url="http://localhost:11434"),
    result_type=ResearchFindings,
    system_prompt="You are Athena, an R&D architect. Return only the model.",
)

result = await agent.run("How should Olympus cache TencentDB scene reads?")
# result.data is a validated ResearchFindings instance
write_file("findings.json", result.data.model_dump_json(indent=2))
```

## Procedure

1. Define the Pydantic `result_type` that captures the answer. **Criterion:** every field the consumer needs is present and typed.
2. `search_files` the repo for grounding context. **Criterion:** cited files actually exist and are referenced.
3. Build the `Agent` with `OlamaModel` (local, no keys). **Criterion:** base_url points at localhost Ollama.
4. Run and capture `result.data`. **Criterion:** it validates against `result_type` with no coercion warnings.
5. Persist with `write_file` / fold with `patch`. **Criterion:** the artifact is on disk and parseable.

## Pitfalls

- PydanticAI is not preinstalled — install it first or the import fails.
- Pointing at a cloud model instead of Ollama leaks keys and breaks the "local only" rule.
- `result_type` too loose (everything `str`) defeats the purpose — type it tightly.

## Verification

- `result.data` is an instance of the declared model (assert `isinstance`).
- The written file parses and matches the schema.
