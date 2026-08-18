# Olympus

> Gods as agent archetypes, running inside Hermes Agent.
> **Zero config. 30-second install. No API keys.**

Olympus turns Hermes Agent into a pantheon. Each "god" is a focused, reusable
skill with one clear role and a small set of tools — an *agent archetype* you can
summon on demand. Hermes is the orchestrator (the OS); Olympus is just a
convention for dividing labor among specialized agents, not a separate process.

- No Claude. No `ANTHROPIC_API_KEY`. No Docker emulation.
- Uses the Hermes tools you already have, plus local Ollama (only for the two
  schema/validation gods).
- Free: local Ollama + Hermes (MIT).

---

## Install (30 seconds, zero config)

```bash
git clone https://github.com/fesenko-code/olympus.git ~/.hermes/skills/olympus
cd ~/.hermes/skills/olympus && ./setup.sh
```

That's it. `setup.sh` is idempotent: it clones (or updates) the repo, symlinks the
seven god skills into your Hermes skills folder, and runs `hermes profiles reload`.
No prompts, no keys.

> On this machine `HERMES_HOME` already points at your brain profile, so the
> script resolves the correct skills path automatically — you don't need to set
> anything.

---

## The Gods

| God | Archetype | Role | Tools | PydanticAI |
|-----|-----------|------|-------|------------|
| **Zeus** | Orchestrator | Plans work, delegates to other gods | `delegate_task`, `read_file` | no |
| **Athena** | R&D / Architect | Structures research, emits strict schemas | `search_files`, `write_file`, `patch` | **yes** (`result_type`) |
| **Hermes-ag** | API gateway | External calls, integration, web extract | `delegate_task`, `web_extract` | no |
| **Hades** | Memory / Data Lake | Persists & recalls via TencentDB | `memory_tencentdb_*` | no |
| **Hera** | Security / Validation | Model-validated guardrails & reviews | `patch`, `read_file`, `clarify` | **yes** (model validation) |
| **Apollo** | Content | Writes structured docs & artifacts | `write_file` | no |
| **Hephaestus** | Infrastructure | Scripts, automation, builds | `terminal`, `execute_code` | no |

Each god is also mapped to a sociomics (Socionics) type — see
[references/sociomics-map.md](references/sociomics-map.md).

---

## Usage

After `hermes profiles reload`, summon a god by its `olympus-<name>` skill from any
Hermes session:

```
Use olympus-zeus to plan and delegate this feature across the other gods.
Use olympus-athena to design the data schema and emit a Pydantic model.
Use olympus-hera to validate this config against the security policy.
Use olympus-hades to remember this decision and recall it next session.
```

Ready-made slash-style invocations (a memorable command wins):

- `/olympus:zeus <goal>` — break a goal into a delegated plan
- `/olympus:athena <topic>` — research + structured output
- `/olympus:hera <artifact>` — validate / review
- `/olympus:hades <fact>` — store or recall memory

---

## Principles

- **Hermes Agent = orchestrator (OS).** "Olympus" is a convention for dividing
  work *inside* Hermes, not a new runtime.
- **PydanticAI only inside Athena/Hera** — used purely for structure and
  validation. Everything else is plain Hermes tool use.
- **Free stack:** local Ollama + Hermes (MIT). Nothing leaves your machine
  unless a god's tools (e.g. `web_extract`) are explicitly invoked.

---

## Repository layout

```
olympus/
├── README.md
├── setup.sh
├── references/
│   └── sociomics-map.md
└── skills/
    ├── zeus/        SKILL.md
    ├── athena/      SKILL.md   (PydanticAI)
    ├── hermes-ag/   SKILL.md
    ├── hades/       SKILL.md
    ├── hera/        SKILL.md   (PydanticAI)
    ├── apollo/      SKILL.md
    └── hephaestus/  SKILL.md
```

## License

MIT. Original Hermes skills only — no third-party or copied code.
