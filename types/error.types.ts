/** Nest `ZodValidationPipe` body shape */
export type ApiValidationErrorItem = {
  field: string;
  message: string;
  code?: string;
};

export type ApiErrorResponse = {
  statusCode?: number;
  message?: string | string[];
  error?: string;
  /** Nest Zod pipe */
  errors?: ApiValidationErrorItem[];
  /** Alternative / legacy shape */
  issues?: Array<{
    path?: string;
    message?: string;
  }>;
  /** Request context id set by gateway middleware — same id `/logs/trace/:correlationId` groups on. */
  correlationId?: string;
  [key: string]: unknown;
};

export class ApiError extends Error {
  statusCode?: number;
  data?: ApiErrorResponse;

  constructor(message: string, statusCode?: number, data?: ApiErrorResponse) {
    super(message);
    this.name = "ApiError";
    this.statusCode = statusCode;
    this.data = data;
  }
}
