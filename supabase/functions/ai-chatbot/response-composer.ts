import type { RomiIntent, RomiJourneyState, RomiKnowledgeSource, RomiViewerMode } from '../../../packages/shared/src/services/ai-chatbot/types.ts';

interface BuildSystemPromptOptions {
  viewerMode: RomiViewerMode;
  entryPoint: string;
  intakeIntent: RomiIntent;
  journeyState: RomiJourneyState;
  knowledgeContext: string;
}

export function buildRomiSystemPrompt({
  viewerMode,
  entryPoint,
  intakeIntent,
  journeyState,
  knowledgeContext,
}: BuildSystemPromptOptions) {
  return `Bạn là ROMI, concierge của RommZ dành cho người đang cần hiểu sản phẩm, tìm phòng, deal hoặc dịch vụ.

Chế độ người dùng: ${viewerMode}
Điểm vào: ${entryPoint}
Intent hiện tại: ${intakeIntent}
Journey state:
${JSON.stringify(journeyState, null, 2)}

Quy tắc:
1. Trả lời bằng tiếng Việt, ngắn gọn nhưng đủ hành động.
2. Không bịa dữ liệu. Nếu kiến thức không có trong context thì nói rõ.
3. Khi có knowledge context, chỉ dùng nó cho câu hỏi sản phẩm, pricing, entitlement, onboarding và policy.
4. Khi có tool result về phòng, deal hoặc dịch vụ, ưu tiên dữ liệu sống đó hơn knowledge chunks.
5. Nếu journey state còn thiếu dữ liệu bắt buộc thì hỏi bù rõ ràng, không suy diễn.
6. Nếu viewerMode là guest và flow cần cá nhân hóa hoặc entitlement, giải thích ngắn và handoff sang đăng nhập.
7. Với mọi recommendation, nếu có thể thì nói "vì sao phù hợp" dựa trên journey state.

Knowledge context:
${knowledgeContext || 'Không có knowledge chunk phù hợp cho lượt này.'}`;
}

export function buildKnowledgeOnlyReply(
  sources: RomiKnowledgeSource[],
  journeyState: RomiJourneyState,
) {
  if (!sources.length) {
    return journeyState.summary
      ? `Mình đã hiểu nhu cầu ở mức: ${journeyState.summary}. Bạn cho mình thêm câu hỏi cụ thể hơn để ROMI trả lời sát hơn nhé.`
      : 'Mình cần thêm một chút bối cảnh để trả lời sát hơn. Bạn nói rõ mục tiêu hoặc quyền lợi đang muốn tìm nhé.';
  }

  const lead = journeyState.summary
    ? `Mình đang hiểu nhu cầu của bạn là ${journeyState.summary}.`
    : 'Mình tóm tắt nhanh từ knowledge hiện có như sau.';

  return `${lead}\n\n${sources.map((source) => `- ${source.snippet}`).join('\n')}`;
}
