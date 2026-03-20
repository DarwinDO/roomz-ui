---
phase: requirements
feature: roomz-ui-refresh
title: RoomZ UI Refresh - Requirements & Problem Understanding
description: UI system refresh for trust, clarity, services hub unification, and future 3D accent support
---

# RoomZ UI Refresh — Requirements

## Problem Statement

- Current UI feels too generic, too simple, and not specific enough to a room-rental product.
- Information architecture splits `Dịch vụ` and `Ưu đãi` even though they belong to one ecosystem.
- Typography, layout clarity, trust signals, and branded identity are inconsistent across the product.
- Accessibility, UX, and SEO audits already show objective debt.

## Goals

- Make RoomZ feel clearly like a trusted room-rental platform.
- Unify the public visual language across landing, login, search, detail, and profile.
- Merge `Dịch vụ + Ưu đãi` into one canonical product surface.
- Establish a web-first design system that can later map cleanly to mobile MD-style surfaces.
- Prepare the platform for light 3D accent work without turning the whole product into a showcase site.

## Non-goals

- Full mobile redesign in the same phase
- 3D across every feature surface
- Heavy shader or interaction-driven 3D in phase 1

## Success Criteria

- Public pages feel product-specific, not generic SaaS
- `Dịch vụ + Ưu đãi` has one canonical route and one nav entry
- Typography is limited to 2 families with consistent hierarchy
- Design tokens and primitives are unified before page redesign expands
- Accessibility / UX / SEO baseline improves from the current audit failure state

## Constraints

- Existing web stack remains React + Vite + Tailwind + Radix
- Framer Motion remains the only motion library for 2D UI
- 3D uses `three.js + @react-three/fiber + @react-three/drei`
- 3D must have reduced-motion and low-end fallbacks
