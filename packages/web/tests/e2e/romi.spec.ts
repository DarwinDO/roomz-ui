import { expect, test } from "@playwright/test";

const AI_CHATBOT_API = "**/functions/v1/ai-chatbot";

test.describe("/romi guest experience", () => {
  test("collapses into a chat-first layout after the first turn", async ({ page }) => {
    await page.route(AI_CHATBOT_API, async (route) => {
      const streamBody = [
        'data: {"type":"start","sessionId":null,"session":null}',
        'data: {"type":"journey_update","journeyState":{"stage":"clarify","summary":"Đang tìm phòng gần Đại học Sư phạm Kỹ thuật và tối đa 5 triệu","district":"Thủ Đức","budgetMax":5000000}}',
        'data: {"type":"clarification_request","clarification":{"prompt":"Ngân sách bạn muốn giữ ở khoảng nào mỗi tháng?","missingFields":["budget_range"]},"journeyState":{"stage":"clarify","summary":"Đang tìm phòng gần Đại học Sư phạm Kỹ thuật và tối đa 5 triệu","district":"Thủ Đức","budgetMax":5000000}}',
        'data: {"type":"final","sessionId":null,"messageId":"assistant-final","message":"Ngân sách bạn muốn giữ ở khoảng nào mỗi tháng?","metadata":{"clarification":{"prompt":"Ngân sách bạn muốn giữ ở khoảng nào mỗi tháng?","missingFields":["budget_range"]},"journeyState":{"stage":"clarify","summary":"Đang tìm phòng gần Đại học Sư phạm Kỹ thuật và tối đa 5 triệu","district":"Thủ Đức","budgetMax":5000000}},"session":null}',
      ].join("\n");

      await route.fulfill({
        status: 200,
        headers: {
          "content-type": "text/event-stream; charset=utf-8",
          "cache-control": "no-cache",
          connection: "keep-alive",
        },
        body: streamBody,
      });
    });

    await page.goto("/romi");

    await expect(page.getByRole("heading", { name: /ROMI hỏi đúng trước, trả lời sát hơn sau\./i })).toBeVisible();

    await page.getByPlaceholder(/Nêu khu vực, ngân sách/i).fill("Tìm phòng gần đại học sư phạm kỹ thuật");
    await page.getByRole("button", { name: /^Gửi$/ }).click();

    await expect(page.getByText("Ngân sách bạn muốn giữ ở khoảng nào mỗi tháng?").first()).toBeVisible();
    await expect(page.getByRole("heading", { name: /ROMI hỏi đúng trước, trả lời sát hơn sau\./i })).toHaveCount(0);
    await expect(page.getByText("Journey")).toHaveCount(0);
    await expect(page.getByText("Knowledge đã dùng")).toHaveCount(0);
    await expect(page.getByText("Session đang lưu")).toHaveCount(0);
    await expect(page.getByText("ROMI cần thêm 1 chi tiết")).toBeVisible();
  });
});
