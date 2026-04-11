export enum ErrorCode {
  Unknown = 'unknown',
  Validation = 'validation',
  Unauthorized = 'unauthorized',
  Forbidden = 'forbidden',
  NotFound = 'not_found',
  Conflict = 'conflict',
  Network = 'network',
}

export interface AppError {
  code: ErrorCode;
  message: string;
  cause?: unknown;
}

export type Result<T> =
  | { success: true; data: T }
  | { success: false; error: AppError };
