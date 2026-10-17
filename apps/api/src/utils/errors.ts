export type ErrorCode =
  | 'VALIDATION_ERROR'
  | 'UNAUTHENTICATED'
  | 'INVALID_CREDENTIALS'
  | 'INVALID_REFRESH'
  | 'FORBIDDEN'
  | 'CONSENT_REQUIRED'
  | 'TEST_NOT_STARTED'
  | 'TEST_ENDED'
  | 'TEST_NOT_PUBLISHED'
  | 'NOT_FOUND'
  | 'EMAIL_TAKEN'
  | 'TEST_LOCKED'
  | 'ALREADY_SUBMITTED'
  | 'SESSION_ENDED'
  | 'NOT_READY'
  | 'ACCOUNT_LOCKED'
  | 'RATE_LIMITED'
  | 'INVALID_OR_EXPIRED_TOKEN'
  | 'TEST_STARTED'
  | 'SESSION_EXISTS'
  | 'UPSTREAM_ERROR'
  | 'INTERNAL_SERVER_ERROR';

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: ErrorCode;
  public readonly details?: unknown;

  constructor(statusCode: number, code: ErrorCode, message: string, details?: unknown) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export function formatErrorResponse(code: ErrorCode, message: string, details?: unknown) {
  return {
    error: {
      code,
      message,
      ...(details !== undefined ? { details } : {}),
    },
  };
}

export function formatSuccessResponse<T>(data: T, meta?: Record<string, unknown>) {
  return {
    data,
    ...(meta ? { meta } : {}),
  };
}
