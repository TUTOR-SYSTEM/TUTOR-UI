import { choice, noul, TypeSafeClient } from "@typesafe-ai/sdk";
import { countJevCall } from "@/lib/jev/count-call";
import type {
  JevAgent,
  JevComplexity,
  JevTaskKind,
  JevTriageResult,
} from "@/types/jev.types";
import { MODEL_BY_COMPLEXITY } from "@/lib/jev/classify";

// Câu hỏi + ngưỡng nằm một chỗ ở đây; "agent nào chạy" là truth table trong code bên dưới.
const YES = 0.7;

let client: TypeSafeClient | null = null;

export async function triageTask(task: string): Promise<JevTriageResult> {
  client ??= new TypeSafeClient();

  countJevCall();
  const { answers } = await client.systemOne({
    state: { task },
    questions: {
      kind: choice("`task` thuộc loại việc nào?", {
        feature: "Thêm tính năng/màn hình/component mới",
        bugfix: "Sửa lỗi hoặc hành vi sai đang có",
        refactor: "Dọn/đổi cấu trúc code mà không đổi hành vi",
        docs: "Viết hoặc sửa tài liệu, rule, ghi chú (không đụng code chạy)",
        i18n: "Dịch hoặc thêm/sửa chuỗi hiển thị (copy vi/en) trong giao diện",
        question: "Câu hỏi, giải thích, không yêu cầu sửa code",
      }),
      level: choice("Độ khó của `task` ở mức nào?", {
        simple: "Sửa nhỏ, một file, đổi text/style",
        moderate: "Vài file, theo mẫu có sẵn trong repo",
        complex: "Nhiều thành phần, cần thiết kế hoặc debug sâu",
      }),
      touchesAuthOrRbac: noul("`task` liên quan đăng nhập, token, phân quyền theo role hoặc dữ liệu nhạy cảm?"),
      touchesApi: noul("`task` cần gọi hoặc đổi cách gọi API backend?"),
      touchesUi: noul("`task` thay đổi giao diện người dùng?"),
      onlyTests: noul("`task` chỉ là viết hoặc sửa test, không đổi code chạy của ứng dụng?"),
      needsTests: noul("`task` đổi logic đủ để cần thêm hoặc sửa test?"),
    },
  });

  const kind = answers.kind.choice as JevTaskKind;
  let complexity = answers.level.choice as JevComplexity;
  const signals = {
    touchesAuthOrRbac: answers.touchesAuthOrRbac.noul,
    touchesApi: answers.touchesApi.noul,
    touchesUi: answers.touchesUi.noul,
    needsTests: answers.needsTests.noul,
    onlyTests: answers.onlyTests.noul,
  };

  // Truth table (code quyết định, Jev chỉ trả tín hiệu):
  // - việc sửa code (không phải question/docs) → dev + review
  // - sửa code mà đụng auth/RBAC → thêm security, và tối thiểu complexity "moderate"
  const changesCode = kind !== "question" && kind !== "docs";
  // Chỉ viết/sửa test thì không đổi hành vi auth → không cần security dù nội dung nhắc auth.
  const sensitive = signals.touchesAuthOrRbac >= YES && signals.onlyTests < YES;
  if (changesCode && sensitive && complexity === "simple") complexity = "moderate";

  const agents: JevAgent[] = [];
  if (changesCode) agents.push("dev", "review");
  if (changesCode && sensitive) agents.push("security");

  return { kind, complexity, model: MODEL_BY_COMPLEXITY[complexity], signals, agents };
}
