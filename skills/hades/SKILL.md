---
name: olympus-hades
description: Query and read the TencentDB memory and data-lake store.
version: 0.1.0
author: fesenko-code, Hermes Agent
license: MIT
platforms: [linux, macos, windows]
metadata:
  hermes:
    tags: [olympus, memory, tencentdb, data-lake, recall]
    related_skills: [olympus-zeus, olympus-athena]
---

# Olympus: Hades — Memory Keeper

Hades rules the underworld of memory: the TencentDB-backed long-term store and
data lake. He retrieves what was saved before — structured memories, raw
conversation history, and scene blocks — so the rest of Olympus doesn't
reinvent the wheel.

## When to Use

- You need a past decision, fact, or conversation excerpt.
- A task depends on context captured in an earlier session.
- Don't use for: live web data (Hermes-ag) or writing new code (Hephaestus).

## Archetype & Role

- **Archetype:** Underworld / Memory keeper.
- **Role:** Search and read from the TencentDB memory tools; return cited context.

## Tools

- `memory_tencentdb_memory_search` — semantic search over long-term memories.
- `memory_tencentdb_conversation_search` — search raw conversation history.
- `memory_tencentdb_read_scene` — read a full scene block by name.

## Prerequisites

- TencentDB gateway running locally (auto-kept alive by a 10-minute cronjob on
  this machine). Gateway port 8420; Ollama `hermes3` for embedding.

## Example Invocation

```python
# Find a specific past decision
memory_tencentdb_memory_search(query="Olympus skill install path", limit=5)

# Recover an earlier conversation about a topic
memory_tencentdb_conversation_search(query="TencentDB gateway setup", limit=5)

# Read a stored scene in full
memory_tencentdb_read_scene(scene_id="travel-plan.md")
```

## Procedure

1. Phrase the need as a search query. **Criterion:** one focused question, not a paragraph.
2. Pick the right tool: memory vs conversation vs scene. **Criterion:** the chosen tool matches the information type.
3. Call it with a tight `limit`. **Criterion:** results are ranked and relevant.
4. Cite the returned memory/scene in your answer. **Criterion:** the user can trace each fact back to a source.

## Pitfalls

- Confusing conversation search (raw dialogue) with memory search (curated facts) — pick by need.
- Asking the model to "remember" instead of querying the store — always hit the tool.
- Scene names are file paths; pass the exact `scene_id`.

## Verification

- Each cited fact maps to a returned memory or scene.
- The gateway responded (no timeout / connection error).
