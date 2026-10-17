import crypto from 'node:crypto';
import { config } from '../config/env.js';

/**
 * Deterministically generates a secure, readable student password
 * from testId + student email using HMAC-SHA256 with the app secret.
 * This allows send-credentials to retrieve the plain password
 * without storing it in plain text in the database.
 */
export function generateStudentPassword(testId: string, email: string): string {
  const hmac = crypto.createHmac('sha256', config.jwtAccessSecret);
  hmac.update(`${testId}:${email.toLowerCase().trim()}`);
  const hash = hmac.digest('hex');
  const part1 = hash.slice(0, 4).toUpperCase();
  const part2 = hash.slice(4, 8).toLowerCase();
  const part3 = hash.slice(8, 10);
  return `${part1}-${part2}${part3}`; // e.g. "9F4A-3b8c12"
}

/**
 * Generates a random readable student password for resend requests.
 */
export function generateRandomStudentPassword(): string {
  const bytes = crypto.randomBytes(5).toString('hex');
  const part1 = bytes.slice(0, 4).toUpperCase();
  const part2 = bytes.slice(4, 8).toLowerCase();
  const part3 = bytes.slice(8, 10);
  return `${part1}-${part2}${part3}`;
}
