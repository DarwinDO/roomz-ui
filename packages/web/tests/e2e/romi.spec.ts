import { expect, test } from "@playwright/test";

const AI_CHATBOT_API = "**/functions/v1/ai-chatbot";

test.describe("/romi guest experience", () => {
  test("stays chat-first from the initial render", async ({ page }) => {
    await page.route(AI_CHATBOT_API, async (route) => {
      const streamBody = [
        'data: {"type":"start","sessionId":null,"session":null}',
        'data: {"type":"journey_update","journeyState":{"stage":"clarify","summary":"Đang tìm phòng gần Đại học Sư phạm Kỹ thuật và tối đa 5 triệu","district":"Thủ Đức","budgetMax":5000000}}',
        'data: {"type":"clarification_request","clarification":{"prompt":"Ngân sách bạn muốn giữ ở khoảng nào mỗi tháng?","missingFields":["budget_range"],"mode":"needs_clarification"},"journeyState":{"stage":"clarify","summary":"Đang tìm phòng gần Đại học Sư phạm Kỹ thuật và tối đa 5 triệu","district":"Thủ Đức","budgetMax":5000000,"resolutionOutcome":"needs_clarification"}}',
        'data: {"type":"final","sessionId":null,"messageId":"assistant-final","message":"Ngân sách bạn muốn giữ ở khoảng nào mỗi tháng?","metadata":{"clarification":{"prompt":"Ngân sách bạn muốn giữ ở khoảng nào mỗi tháng?","missingFields":["budget_range"],"mode":"needs_clarification"},"journeyState":{"stage":"clarify","summary":"Đang tìm phòng gần Đại học Sư phạm Kỹ thuật và tối đa 5 triệu","district":"Thủ Đức","budgetMax":5000000,"resolutionOutcome":"needs_clarification"},"session":null}}',
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
    await expect(page.getByRole("heading", { name: /ROMI hỏi đúng trước, trả lời sát hơn sau\./i })).toHaveCount(0);
    await expect(page.getByText("Lịch sử hội thoại")).toHaveCount(0);

    await page.getByPlaceholder(/Nêu khu vực, ngân sách/i).fill("Tìm phòng gần đại học sư phạm kỹ thuật");
    await page.getByRole("button", { name: /^Gửi$/ }).click();

    await expect(page.getByText("Ngân sách bạn muốn giữ ở khoảng nào mỗi tháng?").first()).toBeVisible();
    await expect(page.getByText("Journey")).toHaveCount(0);
    await expect(page.getByText("Knowledge đã dùng")).toHaveCount(0);
    await expect(page.getByText("Session đang lưu")).toHaveCount(0);
    await expect(page.getByText("ROMI cần thêm 1 chi tiết")).toBeVisible();
  });

  test("shows repair clarifications inline without falling back to the generic prompt label", async ({ page }) => {
    await page.route(AI_CHATBOT_API, async (route) => {
      const streamBody = [
        'data: {"type":"start","sessionId":null,"session":null}',
        'data: {"type":"journey_update","journeyState":{"stage":"clarify","summary":"Đang tìm phòng • khu vực Thành phố Thủ Đức","city":"TP.HCM","district":"Thành phố Thủ Đức"}}',
        'data: {"type":"clarification_request","clarification":{"prompt":"Mình chưa chốt được ngân sách từ câu vừa rồi. Nếu được, bạn nói theo kiểu \\"dưới 5 triệu\\" hoặc \\"3 đến 5 triệu\\" nhé.","missingFields":["ngan_sach"],"mode":"repair_after_failed_extraction"},"journeyState":{"stage":"clarify","summary":"Đang tìm phòng • khu vực Thành phố Thủ Đức","city":"TP.HCM","district":"Thành phố Thủ Đức","resolutionOutcome":"repair_after_failed_extraction"}}',
        'data: {"type":"final","sessionId":null,"messageId":"assistant-final","message":"Mình chưa chốt được ngân sách từ câu vừa rồi. Nếu được, bạn nói theo kiểu \\"dưới 5 triệu\\" hoặc \\"3 đến 5 triệu\\" nhé.","metadata":{"clarification":{"prompt":"Mình chưa chốt được ngân sách từ câu vừa rồi. Nếu được, bạn nói theo kiểu \\"dưới 5 triệu\\" hoặc \\"3 đến 5 triệu\\" nhé.","missingFields":["ngan_sach"],"mode":"repair_after_failed_extraction"},"journeyState":{"stage":"clarify","summary":"Đang tìm phòng • khu vực Thành phố Thủ Đức","city":"TP.HCM","district":"Thành phố Thủ Đức","resolutionOutcome":"repair_after_failed_extraction"},"session":null}}',
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
    await page.getByPlaceholder(/Nêu khu vực, ngân sách/i).fill("cũng tầm vậy thôi");
    await page.getByRole("button", { name: /^Gửi$/ }).click();

    await expect(page.getByText("ROMI đang sửa lại tiêu chí")).toBeVisible();
    await expect(page.getByText("ROMI cần thêm 1 chi tiết")).toHaveCount(0);
  });

  test("keeps mixed-intent replies search-first and appends product knowledge after the room answer", async ({ page }) => {
    await page.route(AI_CHATBOT_API, async (route) => {
      const streamBody = [
        'data: {"type":"start","sessionId":null,"session":null}',
        'data: {"type":"journey_update","journeyState":{"stage":"recommend","summary":"Đang tìm phòng • khu vực Thành phố Thủ Đức • ngân sách tối đa 5.000.000đ","city":"TP.HCM","district":"Thành phố Thủ Đức","budgetMax":5000000,"resolutionOutcome":"results"}}',
        'data: {"type":"final","sessionId":null,"messageId":"assistant-final","message":"Mình đang hiểu nhu cầu của bạn là Đang tìm phòng • khu vực Thành phố Thủ Đức • ngân sách tối đa 5.000.000đ.\\n\\nMình đã tìm theo bộ lọc: Thành phố Thủ Đức, TP.HCM • tối đa 5.000.000đ.\\n\\nHiện mình thấy có vài lựa chọn sát nhất để bạn mở tiếp trong app.\\n\\nNgoài phần tìm phòng, câu hỏi sản phẩm bạn vừa nhắc thêm có ý chính như sau:\\n- RommZ+ phù hợp hơn khi bạn cần liên hệ nhiều host hoặc mở deal Premium thường xuyên.","metadata":{"journeyState":{"stage":"recommend","summary":"Đang tìm phòng • khu vực Thành phố Thủ Đức • ngân sách tối đa 5.000.000đ","city":"TP.HCM","district":"Thành phố Thủ Đức","budgetMax":5000000,"resolutionOutcome":"results"},"session":null}}',
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
    await page.getByPlaceholder(/Nêu khu vực, ngân sách/i).fill("Tìm phòng ở Thủ Đức dưới 5 triệu, với lại RommZ+ có đáng nâng cấp không?");
    await page.getByRole("button", { name: /^Gửi$/ }).click();

    await expect(page.getByText(/Mình đang hiểu nhu cầu của bạn là Đang tìm phòng/i)).toBeVisible();
    await expect(page.getByText(/Ngoài phần tìm phòng, câu hỏi sản phẩm bạn vừa nhắc thêm có ý chính như sau/i)).toBeVisible();
    await expect(page.getByText("Knowledge đã dùng")).toHaveCount(0);
  });
});
