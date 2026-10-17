import type { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';
import { AppError, formatErrorResponse } from '../utils/errors.js';

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
) {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json(
      formatErrorResponse(err.code, err.message, err.details)
    );
  }

  if (err instanceof ZodError) {
    const issues = (err as { issues?: Array<{ path: Array<string | number>; message: string }> }).issues ?? [];
    const details = issues.map((e) => ({
      path: e.path.join('.'),
      message: e.message,
    }));
    return res.status(400).json(
      formatErrorResponse('VALIDATION_ERROR', 'Validation failed', details)
    );
  }

  console.error('Unhandled internal server error:', err);
  return res.status(500).json(
    formatErrorResponse('INTERNAL_SERVER_ERROR', 'An unexpected internal error occurred')
  );
}
