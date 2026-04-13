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

    const composer = page.getByRole("textbox").last();
    await composer.fill("Tìm phòng gần đại học sư phạm kỹ thuật");
    await composer.press("Enter");

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
    const composer = page.getByRole("textbox").last();
    await composer.fill("cũng tầm vậy thôi");
    await composer.press("Enter");

    await expect(page.getByText("ROMI đang sửa lại tiêu chí")).toBeVisible();
    await expect(page.getByText("ROMI cần thêm 1 chi tiết")).toHaveCount(0);
  });

  test("clears an old clarification banner after the next turn resolves it", async ({ page }) => {
    let requestCount = 0;

    await page.route(AI_CHATBOT_API, async (route) => {
      requestCount += 1;

      const streamBody = requestCount === 1
        ? [
            'data: {"type":"start","sessionId":null,"session":null}',
            'data: {"type":"clarification_request","clarification":{"prompt":"Ngân sách bạn muốn giữ ở khoảng nào mỗi tháng?","missingFields":["ngan_sach"],"mode":"needs_clarification"},"journeyState":{"stage":"clarify","summary":"Đang tìm phòng • khu vực Thủ Đức","district":"Thủ Đức","resolutionOutcome":"needs_clarification"}}',
            'data: {"type":"final","sessionId":null,"messageId":"assistant-first","message":"Ngân sách bạn muốn giữ ở khoảng nào mỗi tháng?","metadata":{"clarification":{"prompt":"Ngân sách bạn muốn giữ ở khoảng nào mỗi tháng?","missingFields":["ngan_sach"],"mode":"needs_clarification"},"journeyState":{"stage":"clarify","summary":"Đang tìm phòng • khu vực Thủ Đức","district":"Thủ Đức","resolutionOutcome":"needs_clarification"}}}',
          ].join("\n")
        : [
            'data: {"type":"start","sessionId":null,"session":null}',
            'data: {"type":"final","sessionId":null,"messageId":"assistant-second","message":"Mình đã ghi nhận ngân sách dưới 5 triệu và sẽ bám theo tiêu chí này.","metadata":{"journeyState":{"stage":"recommend","summary":"Đang tìm phòng • khu vực Thủ Đức • ngân sách tối đa 5.000.000đ","district":"Thủ Đức","budgetMax":5000000,"resolutionOutcome":"results"}}}',
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
    const composer = page.getByRole("textbox").last();

    await composer.fill("Tìm phòng ở Thủ Đức");
    await composer.press("Enter");

    await expect(page.getByText(/ROMI .*1 chi tiết/i)).toBeVisible();

    await composer.fill("Dưới 5 triệu");
    await composer.press("Enter");

    await expect(page.getByText(/Mình đã ghi nhận ngân sách dưới 5 triệu/i)).toBeVisible();
    await expect(page.getByText(/ROMI .*1 chi tiết/i)).toHaveCount(0);
  });

  test("replaces a failed streaming placeholder with an error bubble", async ({ page }) => {
    await page.route(AI_CHATBOT_API, async (route) => {
      await route.fulfill({
        status: 500,
        headers: {
          "content-type": "application/json; charset=utf-8",
        },
        body: JSON.stringify({
          error: "ROMI tạm thời bận, bạn thử lại sau ít phút nhé.",
          code: "GEMINI_ERROR",
        }),
      });
    });

    await page.goto("/romi");
    const composer = page.getByRole("textbox").last();

    await composer.fill("Tìm phòng ở Thủ Đức");
    await composer.press("Enter");

    await expect(page.getByText(/ROMI tạm thời bận, bạn thử lại sau ít phút nhé\./i).first()).toBeVisible();
    await expect(page.getByText(/ROMI .*ghép câu trả lời/i)).toHaveCount(0);
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
    const composer = page.getByRole("textbox").last();
    await composer.fill("Tìm phòng ở Thủ Đức dưới 5 triệu, với lại RommZ+ có đáng nâng cấp không?");
    await composer.press("Enter");

    await expect(page.getByText(/Mình đang hiểu nhu cầu của bạn là Đang tìm phòng/i)).toBeVisible();
    await expect(page.getByText(/Ngoài phần tìm phòng, câu hỏi sản phẩm bạn vừa nhắc thêm có ý chính như sau/i)).toBeVisible();
    await expect(page.getByText("Knowledge đã dùng")).toHaveCount(0);
  });

  test("reuses journey selection memory on the next detail follow-up", async ({ page }) => {
    let requestCount = 0;
    let secondRequestBody: Record<string, unknown> | null = null;

    await page.route(AI_CHATBOT_API, async (route) => {
      requestCount += 1;

      const rawBody = route.request().postData();
      if (requestCount === 2 && rawBody) {
        secondRequestBody = JSON.parse(rawBody) as Record<string, unknown>;
      }

      const streamBody = requestCount === 1
        ? [
            'data: {"type":"start","sessionId":null,"session":null}',
            'data: {"type":"final","sessionId":null,"messageId":"assistant-shortlist","message":"Shortlist batch A\\n1. Room One\\n2. Room Two","metadata":{"journeyState":{"stage":"recommend","summary":"Đang giữ shortlist phòng","activeEntityType":"room","activeEntityId":"room-1","lastResultSetType":"room","lastResultIds":["room-1","room-2"],"lastResultSourceIntent":"room_search"},"session":null}}',
          ].join("\n")
        : [
            'data: {"type":"start","sessionId":null,"session":null}',
            'data: {"type":"final","sessionId":null,"messageId":"assistant-detail","message":"Room 2 detail reply","metadata":{"selection":{"entityType":"room","entityId":"room-2","resolvedFrom":"ordinal","ordinal":2},"journeyState":{"stage":"recommend","summary":"Đang mở chi tiết Room Two","activeEntityType":"room","activeEntityId":"room-2","lastResultSetType":"room","lastResultIds":["room-1","room-2"],"lastResultSourceIntent":"room_search"},"actions":[{"type":"open_room","label":"Open room 2","href":"/room/room-2"}],"session":null}}',
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
    const composer = page.getByRole("textbox").last();

    await composer.fill("Find me a room");
    await composer.press("Enter");
    await expect(page.getByText("Shortlist batch A")).toBeVisible();

    await composer.fill("room 2 details");
    await composer.press("Enter");

    await expect(page.getByText("Room 2 detail reply")).toBeVisible();
    await expect(page.getByRole("button", { name: "Open room 2" })).toBeVisible();
    await expect(page.getByText("Shortlist batch A")).toHaveCount(1);
    expect(secondRequestBody).not.toBeNull();
    expect(secondRequestBody?.viewerMode).toBe("guest");
    expect(secondRequestBody?.journeyState).toMatchObject({
      activeEntityType: "room",
      activeEntityId: "room-1",
      lastResultSetType: "room",
      lastResultIds: ["room-1", "room-2"],
      lastResultSourceIntent: "room_search",
    });
  });
});
