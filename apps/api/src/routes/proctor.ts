import { Router } from 'express';
import { z } from 'zod';
import { authenticate, requireRole } from '../middleware/authenticate.js';
import { db } from '../prisma/db.js';
import {
  ingestProctoring,
  proctorUploadMiddleware,
  resolveRules,
} from '../services/proctoring.js';
import { AppError, formatSuccessResponse } from '../utils/errors.js';

export const proctorRouter = Router();

proctorRouter.use(authenticate, requireRole('STUDENT'));

const ingestBodySchema = z.object({
  examSessionId: z.string().uuid('examSessionId must be a UUID'),
});

async function handleIngest(
  req: Parameters<typeof proctorUploadMiddleware>[0],
  res: Parameters<typeof proctorUploadMiddleware>[1],
  next: Parameters<typeof proctorUploadMiddleware>[2]
) {
  try {
    const body = (req.body ?? {}) as Record<string, unknown>;
    const { examSessionId } = ingestBodySchema.parse({ examSessionId: body.examSessionId });
    const studentId = req.user!.id;

    const session = await db.orm.public.ExamSession.where({ id: examSessionId }).first();
    if (!session) {
      throw new AppError(404, 'NOT_FOUND', 'Exam session not found');
    }
    if (session.participantId !== studentId) {
      throw new AppError(403, 'FORBIDDEN', 'This exam session belongs to another student');
    }
    if (session.status !== 'IN_PROGRESS') {
      throw new AppError(409, 'SESSION_ENDED', 'Exam session already ended');
    }

    const participant = await db.orm.public.Participant.where({ id: studentId }).first();
    if (!participant) {
      throw new AppError(404, 'NOT_FOUND', 'Participant not found');
    }
    const test = await db.orm.public.Test.where({ id: participant.testId }).first();
    if (!test) {
      throw new AppError(404, 'NOT_FOUND', 'Test not found');
    }

    const rules = resolveRules(test.rulesConfig);
    const result = await ingestProctoring({
      req,
      examSessionId,
      rules,
      policy: {
        warningsEnabled: test.warningsEnabled,
        maxWarnings: test.maxWarnings,
        autoSubmitOnLimit: test.autoSubmitOnLimit,
      },
    });

    res.status(200).json(formatSuccessResponse(result));
  } catch (error) {
    next(error);
  }
}

proctorRouter.post('/', proctorUploadMiddleware, handleIngest);
proctorRouter.post('/ingest', proctorUploadMiddleware, handleIngest);
