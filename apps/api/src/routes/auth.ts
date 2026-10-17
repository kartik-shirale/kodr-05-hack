import crypto from 'node:crypto';
import { Router } from 'express';
import { z } from 'zod';
import { config } from '../config/env.js';
import { authenticate } from '../middleware/authenticate.js';
import { authLimiter } from '../middleware/rate-limit.js';
import { validate } from '../middleware/validate.js';
import { db, epochMsFromInstant, instantFromMs, nowInstant } from '../prisma/db.js';
import { AppError, formatSuccessResponse } from '../utils/errors.js';
import { comparePassword, hashPassword } from '../utils/password.js';
import {
  clearAuthCookies,
  generateRandomToken,
  hashToken,
  setAuthCookies,
  signAccessToken,
  type UserRole,
} from '../utils/tokens.js';

export const authRouter = Router();

// ─── 1. Teacher Register ─────────────────────────────────────────────
const teacherRegisterSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Valid email is required'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

authRouter.post(
  '/teacher/register',
  validate({ body: teacherRegisterSchema }),
  async (req, res, next) => {
    try {
      const { name, email, password } = req.body;
      const normalizedEmail = email.toLowerCase().trim();

      const existing = await db.orm.public.Teacher.where({ email: normalizedEmail }).first();
      if (existing) {
        throw new AppError(409, 'EMAIL_TAKEN', 'An account with this email already exists');
      }

      const passwordHash = await hashPassword(password);
      const teacher = await db.orm.public.Teacher.create({
        name: name.trim(),
        email: normalizedEmail,
        passwordHash,
        failedLogins: 0,
        lockedUntil: null,
        lastLoginAt: nowInstant(),
      });

      const rawRefreshToken = generateRandomToken(40);
      const tokenHash = hashToken(rawRefreshToken);
      const familyId = crypto.randomUUID();

      await db.orm.public.RefreshToken.create({
        tokenHash,
        familyId,
        role: 'TEACHER',
        teacherId: teacher.id,
        participantId: null,
        expiresAt: instantFromMs(Date.now() + config.refreshTokenTtlMs),
        revokedAt: null,
        replacedById: null,
        userAgent: req.headers['user-agent'] ?? null,
        ip: req.ip ?? null,
      });

      const accessToken = signAccessToken({ sub: teacher.id, role: 'TEACHER' });
      setAuthCookies(res, accessToken, rawRefreshToken);

      res.status(201).json(
        formatSuccessResponse({
          id: teacher.id,
          name: teacher.name,
          email: teacher.email,
          role: 'TEACHER',
        })
      );
    } catch (err) {
      next(err);
    }
  }
);

// ─── 2. Teacher Login ────────────────────────────────────────────────
const teacherLoginSchema = z.object({
  email: z.string().email('Valid email is required'),
  password: z.string().min(1, 'Password is required'),
});

authRouter.post(
  '/teacher/login',
  authLimiter,
  validate({ body: teacherLoginSchema }),
  async (req, res, next) => {
    try {
      const { email, password } = req.body;
      const normalizedEmail = email.toLowerCase().trim();

      const teacher = await db.orm.public.Teacher.where({ email: normalizedEmail }).first();
      if (!teacher) {
        throw new AppError(401, 'INVALID_CREDENTIALS', 'Invalid email or password');
      }

      const nowMs = Date.now();
      if (teacher.lockedUntil && epochMsFromInstant(teacher.lockedUntil) > nowMs) {
        throw new AppError(
          423,
          'ACCOUNT_LOCKED',
          'Account is temporarily locked due to too many failed attempts. Please try again later.'
        );
      }

      const isValidPassword = await comparePassword(password, teacher.passwordHash);
      if (!isValidPassword) {
        const failedCount = (teacher.failedLogins ?? 0) + 1;
        const lockUntilInstant = failedCount >= 5 ? instantFromMs(nowMs + 15 * 60 * 1000) : null;

        await db.orm.public.Teacher.where({ id: teacher.id }).update({
          failedLogins: failedCount,
          lockedUntil: lockUntilInstant,
        });

        if (failedCount >= 5) {
          throw new AppError(
            423,
            'ACCOUNT_LOCKED',
            'Account has been temporarily locked for 15 minutes due to 5 failed attempts.'
          );
        }

        throw new AppError(401, 'INVALID_CREDENTIALS', 'Invalid email or password');
      }

      await db.orm.public.Teacher.where({ id: teacher.id }).update({
        failedLogins: 0,
        lockedUntil: null,
        lastLoginAt: nowInstant(),
      });

      const rawRefreshToken = generateRandomToken(40);
      const tokenHash = hashToken(rawRefreshToken);
      const familyId = crypto.randomUUID();

      await db.orm.public.RefreshToken.create({
        tokenHash,
        familyId,
        role: 'TEACHER',
        teacherId: teacher.id,
        participantId: null,
        expiresAt: instantFromMs(nowMs + config.refreshTokenTtlMs),
        revokedAt: null,
        replacedById: null,
        userAgent: req.headers['user-agent'] ?? null,
        ip: req.ip ?? null,
      });

      const accessToken = signAccessToken({ sub: teacher.id, role: 'TEACHER' });
      setAuthCookies(res, accessToken, rawRefreshToken);

      res.status(200).json(
        formatSuccessResponse({
          id: teacher.id,
          name: teacher.name,
          email: teacher.email,
          role: 'TEACHER',
        })
      );
    } catch (err) {
      next(err);
    }
  }
);

// ─── 3. Student Login ────────────────────────────────────────────────
const studentLoginSchema = z.object({
  testId: z.string().uuid('Valid testId UUID is required'),
  email: z.string().email('Valid email is required'),
  password: z.string().min(1, 'Password is required'),
});

authRouter.post(
  '/student/login',
  authLimiter,
  validate({ body: studentLoginSchema }),
  async (req, res, next) => {
    try {
      const { testId, email, password } = req.body;
      const normalizedEmail = email.toLowerCase().trim();

      const participant = await db.orm.public.Participant.where({
        testId,
        email: normalizedEmail,
      }).first();

      if (!participant) {
        throw new AppError(401, 'INVALID_CREDENTIALS', 'Invalid credentials or test not found');
      }

      const nowMs = Date.now();
      if (participant.lockedUntil && epochMsFromInstant(participant.lockedUntil) > nowMs) {
        throw new AppError(
          423,
          'ACCOUNT_LOCKED',
          'Account is temporarily locked due to too many failed attempts.'
        );
      }

      const isValidPassword = await comparePassword(password, participant.passwordHash);
      if (!isValidPassword) {
        const failedCount = (participant.failedLogins ?? 0) + 1;
        const lockUntilInstant = failedCount >= 5 ? instantFromMs(nowMs + 15 * 60 * 1000) : null;

        await db.orm.public.Participant.where({ id: participant.id }).update({
          failedLogins: failedCount,
          lockedUntil: lockUntilInstant,
        });

        if (failedCount >= 5) {
          throw new AppError(
            423,
            'ACCOUNT_LOCKED',
            'Account has been temporarily locked due to too many failed attempts.'
          );
        }

        throw new AppError(401, 'INVALID_CREDENTIALS', 'Invalid credentials');
      }

      const test = await db.orm.public.Test.where({ id: testId }).first();
      if (!test || test.status !== 'PUBLISHED') {
        throw new AppError(403, 'TEST_NOT_PUBLISHED', 'Test is not published yet');
      }

      const testStartMs = epochMsFromInstant(test.startsAt);
      const testEndMs = testStartMs + test.durationMinutes * 60 * 1000;
      if (nowMs > testEndMs) {
        throw new AppError(403, 'TEST_ENDED', 'Test has already ended');
      }

      await db.orm.public.Participant.where({ id: participant.id }).update({
        failedLogins: 0,
        lockedUntil: null,
        lastLoginAt: nowInstant(),
      });

      const rawRefreshToken = generateRandomToken(40);
      const tokenHash = hashToken(rawRefreshToken);
      const familyId = crypto.randomUUID();

      await db.orm.public.RefreshToken.create({
        tokenHash,
        familyId,
        role: 'STUDENT',
        teacherId: null,
        participantId: participant.id,
        expiresAt: instantFromMs(nowMs + config.refreshTokenTtlMs),
        revokedAt: null,
        replacedById: null,
        userAgent: req.headers['user-agent'] ?? null,
        ip: req.ip ?? null,
      });

      const accessToken = signAccessToken({ sub: participant.id, role: 'STUDENT' });
      setAuthCookies(res, accessToken, rawRefreshToken);

      res.status(200).json(
        formatSuccessResponse({
          participantId: participant.id,
          name: participant.name,
          email: participant.email,
          role: 'STUDENT',
          testId: participant.testId,
        })
      );
    } catch (err) {
      next(err);
    }
  }
);

// ─── 4. Refresh Token ────────────────────────────────────────────────
authRouter.post('/refresh', async (req, res, next) => {
  try {
    const rawToken = req.cookies?.refresh_token;
    if (!rawToken) {
      throw new AppError(401, 'INVALID_REFRESH', 'Refresh token missing');
    }

    const tokenHash = hashToken(rawToken);
    const existingToken = await db.orm.public.RefreshToken.where({ tokenHash }).first();

    if (!existingToken) {
      throw new AppError(401, 'INVALID_REFRESH', 'Invalid refresh token');
    }

    // Reuse detection: If revoked token is reused, revoke the whole family
    if (existingToken.revokedAt !== null) {
      await db.orm.public.RefreshToken.where({ familyId: existingToken.familyId }).updateAll({
        revokedAt: nowInstant(),
      });
      clearAuthCookies(res);
      throw new AppError(
        401,
        'INVALID_REFRESH',
        'Revoked refresh token reuse detected. All sessions in this family have been terminated.'
      );
    }

    // Check expiration
    if (epochMsFromInstant(existingToken.expiresAt) < Date.now()) {
      clearAuthCookies(res);
      throw new AppError(401, 'INVALID_REFRESH', 'Refresh token has expired');
    }

    // Rotate: Issue new refresh token in the same family, revoke the old one
    const newRawToken = generateRandomToken(40);
    const newTokenHash = hashToken(newRawToken);

    const newToken = await db.orm.public.RefreshToken.create({
      tokenHash: newTokenHash,
      familyId: existingToken.familyId,
      role: existingToken.role,
      teacherId: existingToken.teacherId,
      participantId: existingToken.participantId,
      expiresAt: instantFromMs(Date.now() + config.refreshTokenTtlMs),
      revokedAt: null,
      replacedById: null,
      userAgent: req.headers['user-agent'] ?? null,
      ip: req.ip ?? null,
    });

    await db.orm.public.RefreshToken.where({ id: existingToken.id }).update({
      revokedAt: nowInstant(),
      replacedById: newToken.id,
    });

    const sub = (existingToken.teacherId ?? existingToken.participantId)!;
    const newAccessToken = signAccessToken({ sub, role: existingToken.role as UserRole });
    setAuthCookies(res, newAccessToken, newRawToken);

    res.status(200).json(formatSuccessResponse({ ok: true }));
  } catch (err) {
    next(err);
  }
});

// ─── 5. Logout ───────────────────────────────────────────────────────
authRouter.post('/logout', async (req, res, next) => {
  try {
    const rawToken = req.cookies?.refresh_token;
    if (rawToken) {
      const tokenHash = hashToken(rawToken);
      await db.orm.public.RefreshToken.where({ tokenHash }).updateAll({
        revokedAt: nowInstant(),
      });
    }

    clearAuthCookies(res);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

// ─── 6. Current User (Me) ────────────────────────────────────────────
authRouter.get('/me', authenticate, async (req, res, next) => {
  try {
    const user = req.user!;

    if (user.role === 'TEACHER') {
      const teacher = await db.orm.public.Teacher.where({ id: user.id }).first();
      if (!teacher) {
        throw new AppError(401, 'UNAUTHENTICATED', 'Teacher not found');
      }

      return res.status(200).json(
        formatSuccessResponse({
          id: teacher.id,
          name: teacher.name,
          email: teacher.email,
          role: 'TEACHER',
        })
      );
    }

    if (user.role === 'STUDENT') {
      const participant = await db.orm.public.Participant.where({ id: user.id }).first();
      if (!participant) {
        throw new AppError(401, 'UNAUTHENTICATED', 'Student not found');
      }

      return res.status(200).json(
        formatSuccessResponse({
          participantId: participant.id,
          name: participant.name,
          email: participant.email,
          role: 'STUDENT',
          testId: participant.testId,
        })
      );
    }

    throw new AppError(403, 'FORBIDDEN', 'Unknown user role');
  } catch (err) {
    next(err);
  }
});

// ─── 7. Teacher Forgot Password ──────────────────────────────────────
const forgotPasswordSchema = z.object({
  email: z.string().email('Valid email is required'),
});

authRouter.post(
  '/teacher/forgot-password',
  authLimiter,
  validate({ body: forgotPasswordSchema }),
  async (req, res, next) => {
    try {
      const { email } = req.body;
      const normalizedEmail = email.toLowerCase().trim();

      const teacher = await db.orm.public.Teacher.where({ email: normalizedEmail }).first();

      if (teacher) {
        const rawToken = generateRandomToken(32);
        const tokenHash = hashToken(rawToken);

        await db.orm.public.PasswordResetToken.create({
          teacherId: teacher.id,
          tokenHash,
          expiresAt: instantFromMs(Date.now() + 60 * 60 * 1000), // 1 hour
          usedAt: null,
        });

        const resetUrl = `${config.frontendUrl}/reset-password?token=${rawToken}`;
        console.log(`[PASSWORD_RESET_LINK] To: ${teacher.email} | URL: ${resetUrl}`);
      }

      // Always return 200 without revealing if email exists
      res.status(200).json(
        formatSuccessResponse({
          message: 'If an account exists with this email, a password reset link has been sent.',
        })
      );
    } catch (err) {
      next(err);
    }
  }
);

// ─── 8. Teacher Reset Password ───────────────────────────────────────
const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Reset token is required'),
  newPassword: z.string().min(8, 'New password must be at least 8 characters'),
});

authRouter.post(
  '/teacher/reset-password',
  authLimiter,
  validate({ body: resetPasswordSchema }),
  async (req, res, next) => {
    try {
      const { token, newPassword } = req.body;
      const tokenHash = hashToken(token);

      const resetToken = await db.orm.public.PasswordResetToken.where({ tokenHash }).first();
      if (
        !resetToken ||
        resetToken.usedAt !== null ||
        epochMsFromInstant(resetToken.expiresAt) < Date.now()
      ) {
        throw new AppError(400, 'INVALID_OR_EXPIRED_TOKEN', 'Password reset token is invalid or has expired');
      }

      await db.orm.public.PasswordResetToken.where({ id: resetToken.id }).update({
        usedAt: nowInstant(),
      });

      const newPasswordHash = await hashPassword(newPassword);
      await db.orm.public.Teacher.where({ id: resetToken.teacherId }).update({
        passwordHash: newPasswordHash,
        failedLogins: 0,
        lockedUntil: null,
      });

      // Revoke all refresh tokens for this teacher
      await db.orm.public.RefreshToken.where({ teacherId: resetToken.teacherId }).updateAll({
        revokedAt: nowInstant(),
      });

      res.status(200).json(
        formatSuccessResponse({
          message: 'Password reset successful',
        })
      );
    } catch (err) {
      next(err);
    }
  }
);
