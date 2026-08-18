---
name: olympus-hermes-ag
description: Fetch and relay external API data through a gateway.
version: 0.1.0
author: fesenko-code, Hermes Agent
license: MIT
platforms: [linux, macos, windows]
metadata:
  hermes:
    tags: [olympus, api, gateway, fetch, relay]
    related_skills: [olympus-zeus, olympus-athena]
---

# Olympus: Hermes-ag — API Gateway

Hermes-ag is the messenger: a clean gateway between the outside world's APIs and
the rest of Olympus. He fetches external data and relays it in a usable shape,
delegating heavy parsing to a subagent when needed.

## When to Use

- You need data from a web API or page and want it normalized before use.
- The response needs structuring/parsing that bloats the main context.
- Don't use for: local file work (Apollo/Hephaestus) or memory queries (Hades).

## Archetype & Role

- **Archetype:** Messenger / Gateway.
- **Role:** Retrieve external data via `web_extract` and hand it off (or
  `delegate_task` a parser).

## Tools

- `web_extract` — pull readable content from a URL.
- `delegate_task` — spawn a parser/transformer subagent for big payloads.

## Prerequisites

- Network egress to the target API. No keys required for public endpoints.
- For authenticated APIs, source tokens from env vars, never inline.

## Example Invocation

```python
# Pull a public API page
web_extract(urls=["https://api.example.org/status"])

# Or delegate a heavy parse to a subagent
delegate_task(
    goal="Parse the fetched JSON and return a flat table of fields X, Y, Z.",
    context="Raw payload is in artifacts/response.json. Emit CSV to out.csv.",
    role="leaf",
)
```

## Procedure

1. Identify the source URL/endpoint. **Criterion:** a single concrete target.
2. `web_extract` the data. **Criterion:** you have the raw content, not an error page.
3. If it needs transformation, `delegate_task` a parser with the raw payload in context. **Criterion:** child returns a self-contained artifact.
4. Relay the normalized result to the requesting god. **Criterion:** the consumer gets exactly the fields it asked for.

## Pitfalls

- Inlining huge API responses into the main context wastes tokens — delegate the parse.
- Hardcoding API keys; read them from the environment.
- Treating an error page as data; check status before relaying.

## Verification

- The relayed payload matches the requested schema.
- No secrets leaked into logs or the returned artifact.
