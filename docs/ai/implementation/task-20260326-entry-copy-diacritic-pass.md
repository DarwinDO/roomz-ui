---
phase: implementation
title: Entry Hero Vietnamese Diacritic Pass
date: 2026-03-26
owner: codex
feature: roomz-ui-refresh
---

# Task Summary

- Restore proper Vietnamese diacritics in the new layered hero content on landing and login.
- Fix the landing newsletter input `aria-label` so the accessibility text also uses correct Vietnamese.

# Files Updated

- `packages/web/src/components/common/HeroIllustrationPilot.tsx`
- `packages/web/src/pages/LandingPage.tsx`
- `docs/ai/monitoring/project-status.md`

# Changes

- Replaced temporary ASCII-only hero text with accented Vietnamese:
  - `12+ bạn mới`
  - `Đang tìm phòng gần Quận 1 và Thủ Đức trong hôm nay.`
  - `Xác thực rõ ràng`
  - `Ưu tiên các listing có hình thật, vị trí rõ và phản hồi nhanh.`
  - `Bắt đầu lại từ một nơi ở bạn thực sự muốn quay về.`
  - `Tìm phòng, ghép bạn ở và quay lại đúng hành trình bạn đang theo dõi.`
- Updated landing input accessibility label to:
  - `Nhập email để nhận thông báo phòng mới`

# Validation

- `npm run lint --workspace=@roomz/web`
- `npm run build --workspace=@roomz/web`
