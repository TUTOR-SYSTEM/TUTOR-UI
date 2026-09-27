/** Response envelope wrapping every BE payload (Nest's global `ResponseInterceptor`). */
export type ApiResponse<T> = {
  statusCode: number;
  message: string;
  data: T;
  timestamp: string;
  method: string;
  path: string;
  /** Request context id set by gateway middleware — same id `/logs/trace/:correlationId` groups on. */
  correlationId?: string;
};

/** Common shape returned by `DELETE` endpoints across resources. */
export type DeleteResult = { id: string };
