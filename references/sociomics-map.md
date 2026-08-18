# Olympus ↔ Sociomics Map

Each Olympus god is modelled on a **sociomics (Socionics) type** — a temperament
that predicts how the agent prefers to gather information, make decisions, and
communicate. Giving each archetype a coherent "personality" makes its role and
tool choices self-consistent: you always know which god to summon for a given
kind of work.

| Sociotype | Code | Ukrainian name | God | Role | Key tools |
|-----------|------|----------------|-----|------|-----------|
| SLE | СЛЕ | Жуків | **Zeus** | Orchestrator — plans & delegates | `delegate_task`, `read_file` |
| LSE | ЛСЕ | Штирліц | **Athena** | R&D / Architect — structures, schemas | `search_files`, `write_file`, `patch` |
| ILE | ІЛЕ | Дон Кіхот | **Hermes-ag** | API gateway — external calls, integration | `delegate_task`, `web_extract` |
| ILI | ІЛІ | Бальзак | **Hades** | Memory / Data Lake — persist & recall | `memory_tencentdb_*` |
| EIE | ЕІЕ | Гамлет | **Hera** | Security / Validation — guardrails | `patch`, `read_file`, `clarify` |
| LII | ЛІІ | Робесп'єр | **Apollo** | Content — structured writing | `write_file` |
| SLI | СЛІ | Габен | **Hephaestus** | Infrastructure — scripts, automation | `terminal`, `execute_code` |

## Why these mappings

- **Zeus = SLE (Жуків).** Pragmatic, decisive extrovert-logic type — the natural
  commander who breaks goals into actions and delegates. Drives `delegate_task`.
- **Athena = LSE (Штирліц).** Order-building logic type, obsessed with structure
  and systems. The architect who turns messy research into strict schemas
  (hence PydanticAI `result_type`).
- **Hermes-ag = ILE (Дон Кіхот).** Inventive, possibility-driven explorer — the
  perfect API/integration gateway that reaches outward via `web_extract`.
- **Hades = ILI (Бальзак).** Strategic introvert-intuition type, the long-term
  observer who remembers and foresees. The memory/Data-Lake keeper.
- **Hera = EIE (Гамлет).** Ethic-intuition type, persuasive and protective — the
  guardian who validates and enforces policy (model-validated guardrails).
- **Apollo = LII (Робесп'єр).** Logical structuralist who prizes clarity and
  precise form — the content author.
- **Hephaestus = SLI (Габен).** Sensate, hands-on craftsman — builds the
  infrastructure and scripts that everything else runs on.

## Notes

- The **Code** column is the international Socionics notation (SLE, LSE, ILE,
  ILI, EIE, LII, SLI). The **Ukrainian name** is the local sociotype nickname.
- PydanticAI is used **only** by Athena and Hera — the two gods whose jobs are
  structure and validation. All others are plain Hermes tool use.
- This map is a design aid, not a constraint: a god may use any Hermes tool,
  but its default toolset reflects its sociomics temperament.
