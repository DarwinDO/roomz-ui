---
trigger: manual
---

# GEMINI Compatibility Note

This file is kept for compatibility with Gemini-style tooling.

## Canonical Rule Source

1. The canonical instruction file for this repository is `/AGENTS.md`.
2. For Codex, rules are auto-loaded from `AGENTS.md` at the workspace root.
3. For command workflows in Codex, use `.codex/commands/`.

## Repository Paths

1. Agents: `.agents/agents/`
2. Skills: `.agents/skills/`
3. Rules: `.agents/rules/`
4. Workflow source: `.agents/workflows/`
5. Codex runtime commands: `.codex/commands/`
