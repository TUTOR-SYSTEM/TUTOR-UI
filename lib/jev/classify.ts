import { choice, noul, TypeSafeClient } from "@typesafe-ai/sdk";
import { countJevCall } from "@/lib/jev/count-call";
import type {
  ClaudeModelId,
  JevClassifyResult,
  JevComplexity,
} from "@/types/jev.types";

// Toàn bộ câu hỏi/ngưỡng/mapping model nằm ở đây để dễ audit và chỉnh.
export const MODEL_BY_COMPLEXITY: Record<JevComplexity, ClaudeModelId> = {
  simple: "claude-haiku-5-5",
  moderate: "claude-sonnet-5-5",
  complex: "claude-opus-5-5",
};

/** Noul "cần suy luận nhiều bước" >= ngưỡng này thì nâng lên complex (quyết định ở code). */
const MULTI_STEP_THRESHOLD = 0.7;

let client: TypeSafeClient | null = null;

export async function classifyComplexity(task: string): Promise<JevClassifyResult> {
  client ??= new TypeSafeClient(); // đọc TYPESAFE_API_KEY từ env (server only)

  countJevCall();
  const { answers } = await client.systemOne({
    state: { task },
    questions: {
      level: choice("Độ khó của yêu cầu `task` ở mức nào?", {
        simple: "Tra cứu, trả lời ngắn, định dạng lại, dịch, phân loại đơn giản",
        moderate: "Viết/giải thích có cấu trúc, tóm tắt, sửa lỗi code thông thường",
        complex: "Phân tích sâu, thiết kế, chứng minh, debug nhiều thành phần",
      }),
      multiStep: noul("Để làm đúng `task` cần suy luận qua nhiều bước phụ thuộc nhau?"),
    },
  });

  const probabilities = answers.level.probabilities as Record<JevComplexity, number>;
  let complexity = answers.level.choice as JevComplexity;
  if (complexity === "simple" && answers.multiStep.noul >= MULTI_STEP_THRESHOLD) {
    complexity = "moderate";
  }

  return { complexity, model: MODEL_BY_COMPLEXITY[complexity], probabilities };
}
