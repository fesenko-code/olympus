---
name: olympus-apollo
description: Author and structure content files with write_file.
version: 0.1.0
author: fesenko-code, Hermes Agent
license: MIT
platforms: [linux, macos, windows]
metadata:
  hermes:
    tags: [olympus, content, authoring, docs, structure]
    related_skills: [olympus-zeus, olympus-athena]
---

# Olympus: Apollo — Content & Structure

Apollo is the light-bringer: he authors and structures content — docs, READMEs,
articles, and structured notes. He writes clean, well-organized files via
`write_file` and keeps the pantheon's knowledge legible.

## When to Use

- Producing or restructuring a document, spec, or knowledge file.
- Turning research (Athena) or memory (Hades) into readable output.
- Don't use for: running scripts (Hephaestus) or validating safety (Hera).

## Archetype & Role

- **Archetype:** Light / Arts / Content.
- **Role:** Compose and lay out content; emit it through `write_file`.

## Tools

- `write_file` — create or fully rewrite a content file.

## Prerequisites

- Part of the Olympus skill set; no extra installs.
- Know the target path and the document's intended audience.

## Example Invocation

```python
write_file(
    path="docs/olympus-architecture.md",
    content="# Olympus Architecture\n\n## Pantheon\nZeus routes; Athena researches...\n",
)
```

## Procedure

1. State the document's purpose and audience. **Criterion:** one sentence both can satisfy.
2. Choose a structure (headings, sections). **Criterion:** outline reflects the purpose.
3. `write_file` the content. **Criterion:** file exists and renders as valid markdown.
4. If it folds into an existing doc, prefer `patch` over a full rewrite. **Criterion:** surrounding content is preserved.

## Pitfalls

- Dumping unstructured prose — Apollo is about structure, use headings.
- Rewriting a large existing file when `patch` would preserve context.
- Writing to a machine-local absolute path that breaks for other users.

## Verification

- The file is present and valid markdown.
- A reader can locate the key point within the stated structure.
