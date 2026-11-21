export type JevComplexity = "simple" | "moderate" | "complex";

export type ClaudeModelId =
  | "claude-haiku-5-5"
  | "claude-sonnet-5-5"
  | "claude-opus-5-5";

export type JevClassifyResult = {
  complexity: JevComplexity;
  model: ClaudeModelId;
  /** Xác suất từng mức độ (0..1), để UI/log kiểm tra. */
  probabilities: Record<JevComplexity, number>;
};

export type JevTaskKind = "feature" | "bugfix" | "refactor" | "docs" | "i18n" | "question";

export type JevAgent = "dev" | "review" | "security";

export type JevTriageResult = {
  kind: JevTaskKind;
  complexity: JevComplexity;
  model: ClaudeModelId;
  /** Noul 0..1 cho từng tín hiệu; code (không phải Jev) quyết định agent. */
  signals: {
    touchesAuthOrRbac: number;
    touchesApi: number;
    touchesUi: number;
    needsTests: number;
    onlyTests: number;
  };
  /** Agent nên giao, suy ra trong code từ kind + signals. */
  agents: JevAgent[];
};
