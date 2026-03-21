---
phase: implementation
title: Stitch Search Refine Selected Card
date: 2026-03-21
owner: Codex
status: completed
---

# Summary

- Used Stitch MCP to lightly refine the generated search screen instead of regenerating it from scratch
- Changed the first large room card from a premium editorial treatment into a selected-result state tied to the mini-map

# Output

- Refined screen:
  - `projects/17849223603191498901/screens/9c747e70493f43e2984e39691cc02b8f`
- Original screen kept for comparison:
  - `projects/17849223603191498901/screens/b63e095266a44b1492325b873fc0f635`

# Requested Changes Applied

- Replaced the `Premium Selection` treatment with a selected-map-result state
- Updated the label to a map-selection state (`ĐANG XEM TRÊN BẢN ĐỒ`)
- Made the corresponding map marker visually active
- Preserved the rest of the layout, filter console, room list, and mini-map structure

# Notes

- This was intentionally handled as a light refinement pass so the search screen keeps parity with the first generated concept while resolving the UX ambiguity the user flagged
