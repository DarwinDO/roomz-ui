---
phase: requirements
feature: ai-chatbot
title: AI Chatbot - Requirements & Problem Understanding
description: AI-powered chatbot using Gemini Flash for customer support and data-integrated assistance
---

# AI Chatbot — Requirements & Problem Understanding

## Problem Statement

**What problem are we solving?**

- RommZ hiện có chatbot web (`Chatbot.tsx`) dùng **hardcoded keyword matching** — không thông minh, cố định, không thể xử lý câu hỏi ngoài kịch bản
- User cần hỗ trợ nhanh 24/7 về: tìm phòng, booking, thanh toán, tính năng app
- Mobile app **chưa có chatbot** — chỉ có user-to-user chat
- Không có khả năng truy vấn dữ liệu thực (phòng available, giá, khu vực...)

**Who is affected?**

- Tất cả user RommZ (sinh viên tìm phòng, chủ trọ đăng tin)
- Team support (giảm tải hỗ trợ thủ công)

## Goals & Objectives

**Primary Goals:**

1. Thay thế chatbot hardcoded bằng **AI chatbot sử dụng Gemini 2.0 Flash**
2. Hỗ trợ **customer support** (FAQ, hướng dẫn app, troubleshooting)
3. **Tích hợp dữ liệu app** qua function calling (tìm phòng, tra giá, gợi ý phòng)
4. Triển khai trên **cả Web + Mobile** (shared logic)
5. Lưu lịch sử chat vào **database** (persistent, sync cross-platform)

**Secondary Goals:**

- Phân tích câu hỏi thường gặp để cải thiện sản phẩm
- Hỗ trợ song ngữ (Tiếng Việt + English)
- Streaming response (từng token) cho UX tốt hơn

**Non-goals (out of scope):**

- AI tự động đặt phòng/thanh toán (chỉ gợi ý, không thực hiện action)
- Tích hợp voice (chỉ text)
- Fine-tuning model riêng
- Multi-modal (ảnh, video)

## User Stories & Use Cases

**Core Stories:**

1. **Hỗ trợ khách hàng:**
   - As a student, I want to ask the chatbot how to verify my account so that I can start listing rooms
   - As a user, I want to ask about RommZ+ features so that I can decide whether to upgrade
   - As a landlord, I want to ask how to post a room listing so that I can attract tenants

2. **Tích hợp dữ liệu:**
   - As a student, I want to ask "phòng nào ở Quận 7 dưới 3 triệu?" so that I can find affordable rooms
   - As a user, I want to ask "phòng nào còn trống gần ĐH FPT?" so that I can find nearby rooms
   - As a user, I want to ask about SwapRoom availability for a specific time period

3. **Cross-platform:**
   - As a user, I want my chatbot conversation history synced between web and mobile
   - As a mobile user, I want the chatbot accessible from the app bottom sheet

**Edge Cases:**

- User hỏi ngoài phạm vi app → Bot trả lời lịch sự, gợi ý tìm hiểu nơi khác
- User spam liên tục → Rate limiting ở Edge Function
- User gửi nội dung không phù hợp → Content filter
- API Gemini lỗi/chậm → Fallback response + retry

## Success Criteria

1. ✅ Chatbot trả lời chính xác >80% câu hỏi FAQ về RommZ
2. ✅ Function calling hoạt động: tìm phòng theo tiêu chí trả kết quả đúng
3. ✅ Response time < 3s cho câu hỏi thường, < 5s cho queries cần DB
4. ✅ Lịch sử chat persist & sync giữa web ↔ mobile
5. ✅ Web chatbot UI hoạt động (upgrade từ component hiện có)
6. ✅ Mobile chatbot UI hoạt động (bottom sheet / dedicated screen)
7. ✅ No TypeScript errors (`npx tsc --noEmit`)
8. ✅ Edge Function deploy thành công

## Constraints & Assumptions

**Technical Constraints:**

- Supabase Edge Functions dùng Deno runtime
- Gemini API key lưu trong Supabase secrets (không expose client-side)
- Monorepo structure: shared logic trong `@roomz/shared`
- Mobile: Expo SDK 55 + React Native 0.83.2 + NativeWind v4
- Web: React + Vite + Tailwind CSS

**Assumptions:**

- Google Gemini API available và free tier đủ cho development
- DB schema chat hiện có (conversations, messages, conversation_participants) có thể mở rộng
- User đã authenticated khi dùng chatbot (có JWT token)

## Questions & Open Items

- [ ] ~AI Engine~ → **Đã chọn: Gemini 2.0 Flash**
- [ ] ~Platform~ → **Đã chọn: Web + Mobile**
- [ ] ~Persistence~ → **Đã chọn: DB + Edge Function**
- [ ] Cần tạo bảng riêng cho AI chat hay dùng chung bảng messages/conversations?
- [ ] Rate limit cụ thể: bao nhiêu request/phút cho mỗi user?
- [ ] Có cần admin dashboard để xem thống kê chatbot không?
