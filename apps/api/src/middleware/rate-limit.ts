import { rateLimit } from 'express-rate-limit';
import { formatErrorResponse } from '../utils/errors.js';

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 requests per window
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, res) => {
    res.status(429).json(
      formatErrorResponse(
        'RATE_LIMITED',
        'Too many attempts from this IP. Please try again after 15 minutes.'
      )
    );
  },
});
