import type { NextFunction, Request, Response } from 'express';
import { type ZodType, ZodError } from 'zod';
import { AppError } from '../utils/errors.js';

interface RequestValidationSchema {
  body?: ZodType<unknown>;
  query?: ZodType<unknown>;
  params?: ZodType<unknown>;
}

export function validate(schema: RequestValidationSchema) {
  return async (req: Request, _res: Response, next: NextFunction) => {
    try {
      if (schema.body) {
        req.body = await schema.body.parseAsync(req.body);
      }
      if (schema.query) {
        req.query = (await schema.query.parseAsync(req.query)) as typeof req.query;
      }
      if (schema.params) {
        req.params = (await schema.params.parseAsync(req.params)) as typeof req.params;
      }
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const issues = (error as { issues?: Array<{ path: Array<string | number>; message: string }> }).issues ?? [];
        const details = issues.map((e) => ({
          path: e.path.join('.'),
          message: e.message,
        }));
        return next(new AppError(400, 'VALIDATION_ERROR', 'Validation failed', details));
      }
      next(error);
    }
  };
}
