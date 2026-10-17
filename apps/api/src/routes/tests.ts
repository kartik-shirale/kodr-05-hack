import { Router } from 'express';
import { z } from 'zod';
import { DEFAULT_RULES_CONFIG } from '../config/rules.js';
import { authenticate, requireRole } from '../middleware/authenticate.js';
import { validate } from '../middleware/validate.js';
import { db, epochMsFromInstant, instantFromDate } from '../prisma/db.js';
import { AppError, formatSuccessResponse } from '../utils/errors.js';

export const testsRouter = Router();

// Teacher only for all test routes
testsRouter.use(authenticate, requireRole('TEACHER'));

// ─── Validation Schemas ──────────────────────────────────────────────
const questionSchema = z
  .object({
    text: z.string().min(1, 'Question text is required'),
    options: z
      .array(z.string().min(1, 'Option cannot be empty'))
      .min(2, 'At least 2 options are required')
      .max(6, 'At most 6 options are allowed'),
    correctIndex: z.number().int().min(0, 'correctIndex must be non-negative'),
    marks: z.number().int().min(1, 'marks must be at least 1').default(1),
    order: z.number().int().min(1, 'order must be at least 1'),
  })
  .refine((q) => q.correctIndex < q.options.length, {
    message: 'correctIndex must be inside the options range',
    path: ['correctIndex'],
  });

const questionSetSchema = z
  .object({
    name: z.string().min(1, 'Set name is required'),
    questions: z.array(questionSchema).min(1, 'Each set must have at least 1 question'),
  })
  .refine(
    (s) => {
      const orders = s.questions.map((q) => q.order);
      return new Set(orders).size === orders.length;
    },
    {
      message: 'Question order numbers must be unique within each set',
      path: ['questions'],
    }
  );

const testUpsertSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional().nullable(),
  startsAt: z
    .string()
    .datetime({ message: 'startsAt must be an ISO 8601 UTC timestamp' })
    .refine((val) => new Date(val).getTime() > Date.now(), {
      message: 'startsAt must be in the future',
    }),
  durationMinutes: z
    .number()
    .int()
    .min(5, 'Duration must be between 5 and 480 minutes')
    .max(480, 'Duration must be between 5 and 480 minutes'),
  warningsEnabled: z.boolean().default(true),
  maxWarnings: z
    .number()
    .int()
    .min(1, 'maxWarnings must be between 1 and 5')
    .max(5, 'maxWarnings must be between 1 and 5')
    .default(2),
  autoSubmitOnLimit: z.boolean().default(false),
  sets: z
    .array(questionSetSchema)
    .min(1, 'At least 1 question set is required')
    .refine(
      (sets) => {
        const names = sets.map((s) => s.name.trim().toLowerCase());
        return new Set(names).size === names.length;
      },
      {
        message: 'Question set names must be unique within a test',
        path: ['sets'],
      }
    ),
});

const testIdParamSchema = z.object({
  testId: z.string().uuid('Invalid testId UUID format'),
});

const listTestsQuerySchema = z.object({
  status: z.enum(['DRAFT', 'PUBLISHED']).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

// Helper: load full test with sets and questions
async function loadFullTest(testId: string) {
  const test = await db.orm.public.Test.where({ id: testId }).first();
  if (!test) return null;

  const sets = await db.orm.public.QuestionSet.where({ testId }).all();
  const setsWithQuestions = await Promise.all(
    sets.map(async (set) => {
      const questions = await db.orm.public.Question.where({ setId: set.id })
        .orderBy((q) => q.order.asc())
        .all();
      return {
        id: set.id,
        name: set.name,
        questions: questions.map((q) => ({
          id: q.id,
          text: q.text,
          options: q.options,
          correctIndex: q.correctIndex,
          marks: q.marks,
          order: q.order,
        })),
      };
    })
  );

  return {
    id: test.id,
    teacherId: test.teacherId,
    title: test.title,
    description: test.description,
    startsAt: test.startsAt,
    durationMinutes: test.durationMinutes,
    status: test.status,
    warningsEnabled: test.warningsEnabled,
    maxWarnings: test.maxWarnings,
    autoSubmitOnLimit: test.autoSubmitOnLimit,
    rulesConfig: test.rulesConfig,
    createdAt: test.createdAt,
    updatedAt: test.updatedAt,
    sets: setsWithQuestions,
  };
}

// ─── 1. POST /tests (Create Test) ────────────────────────────────────
testsRouter.post('/', validate({ body: testUpsertSchema }), async (req, res, next) => {
  try {
    const teacherId = req.user!.id;
    const body = req.body;

    const test = await db.orm.public.Test.create({
      teacherId,
      title: body.title.trim(),
      description: body.description?.trim() ?? null,
      startsAt: instantFromDate(new Date(body.startsAt)),
      durationMinutes: body.durationMinutes,
      status: 'DRAFT',
      warningsEnabled: body.warningsEnabled,
      maxWarnings: body.maxWarnings,
      autoSubmitOnLimit: body.autoSubmitOnLimit,
      rulesConfig: DEFAULT_RULES_CONFIG,
    });

    for (const set of body.sets) {
      const createdSet = await db.orm.public.QuestionSet.create({
        testId: test.id,
        name: set.name.trim(),
      });

      for (const q of set.questions) {
        await db.orm.public.Question.create({
          setId: createdSet.id,
          text: q.text.trim(),
          options: q.options.map((opt: string) => opt.trim()),
          correctIndex: q.correctIndex,
          marks: q.marks ?? 1,
          order: q.order,
        });
      }
    }

    const fullTest = await loadFullTest(test.id);
    res.status(201).json(formatSuccessResponse(fullTest));
  } catch (err) {
    next(err);
  }
});

// ─── 2. GET /tests (List Tests) ──────────────────────────────────────
testsRouter.get('/', validate({ query: listTestsQuerySchema }), async (req, res, next) => {
  try {
    const teacherId = req.user!.id;
    const { status, page, limit } = req.query as unknown as {
      status?: 'DRAFT' | 'PUBLISHED';
      page: number;
      limit: number;
    };

    const whereClause = status ? { teacherId, status } : { teacherId };

    const allTeacherTests = await db.orm.public.Test.where(whereClause)
      .orderBy((t) => t.createdAt.desc())
      .all();

    const total = allTeacherTests.length;
    const offset = (page - 1) * limit;
    const pagedTests = allTeacherTests.slice(offset, offset + limit);

    // Compute participantCount and submittedCount for each test
    const items = await Promise.all(
      pagedTests.map(async (t) => {
        const participants = await db.orm.public.Participant.where({ testId: t.id }).all();
        const participantCount = participants.length;

        let submittedCount = 0;
        if (participantCount > 0) {
          const participantIds = new Set(participants.map((p) => p.id));
          const allSessions = await db.orm.public.ExamSession.all();
          submittedCount = allSessions.filter(
            (s) =>
              participantIds.has(s.participantId) &&
              (s.status === 'SUBMITTED' || s.status === 'AUTO_SUBMITTED')
          ).length;
        }

        return {
          id: t.id,
          title: t.title,
          startsAt: t.startsAt,
          durationMinutes: t.durationMinutes,
          status: t.status,
          participantCount,
          submittedCount,
        };
      })
    );

    res.status(200).json(
      formatSuccessResponse(items, {
        page,
        limit,
        total,
      })
    );
  } catch (err) {
    console.error('Error in GET /tests:', err);
    next(err);
  }
});

// ─── 3. GET /tests/:testId (Get Test Details) ────────────────────────
testsRouter.get('/:testId', validate({ params: testIdParamSchema }), async (req, res, next) => {
  try {
    const { testId } = req.params as { testId: string };
    const teacherId = req.user!.id;

    const test = await db.orm.public.Test.where({ id: testId }).first();
    if (!test || test.teacherId !== teacherId) {
      throw new AppError(404, 'NOT_FOUND', 'Test not found');
    }

    const fullTest = await loadFullTest(testId);
    res.status(200).json(formatSuccessResponse(fullTest));
  } catch (err) {
    next(err);
  }
});

// ─── 4. PUT /tests/:testId (Update Test) ─────────────────────────────
testsRouter.put(
  '/:testId',
  validate({ params: testIdParamSchema, body: testUpsertSchema }),
  async (req, res, next) => {
    try {
      const { testId } = req.params as { testId: string };
      const teacherId = req.user!.id;
      const body = req.body;

      const test = await db.orm.public.Test.where({ id: testId }).first();
      if (!test || test.teacherId !== teacherId) {
        throw new AppError(404, 'NOT_FOUND', 'Test not found');
      }

      if (test.status !== 'DRAFT') {
        throw new AppError(409, 'TEST_LOCKED', 'Published tests cannot be edited');
      }

      // Update test metadata and policy
      await db.orm.public.Test.where({ id: testId }).update({
        title: body.title.trim(),
        description: body.description?.trim() ?? null,
        startsAt: instantFromDate(new Date(body.startsAt)),
        durationMinutes: body.durationMinutes,
        warningsEnabled: body.warningsEnabled,
        maxWarnings: body.maxWarnings,
        autoSubmitOnLimit: body.autoSubmitOnLimit,
      });

      // Replace sets and questions (delete existing sets which cascades to questions)
      await db.orm.public.QuestionSet.where({ testId }).deleteAll();

      for (const set of body.sets) {
        const createdSet = await db.orm.public.QuestionSet.create({
          testId,
          name: set.name.trim(),
        });

        for (const q of set.questions) {
          await db.orm.public.Question.create({
            setId: createdSet.id,
            text: q.text.trim(),
            options: q.options.map((opt: string) => opt.trim()),
            correctIndex: q.correctIndex,
            marks: q.marks ?? 1,
            order: q.order,
          });
        }
      }

      const fullTest = await loadFullTest(testId);
      res.status(200).json(formatSuccessResponse(fullTest));
    } catch (err) {
      next(err);
    }
  }
);

// ─── 5. DELETE /tests/:testId (Delete Test) ──────────────────────────
testsRouter.delete('/:testId', validate({ params: testIdParamSchema }), async (req, res, next) => {
  try {
    const { testId } = req.params as { testId: string };
    const teacherId = req.user!.id;

    const test = await db.orm.public.Test.where({ id: testId }).first();
    if (!test || test.teacherId !== teacherId) {
      throw new AppError(404, 'NOT_FOUND', 'Test not found');
    }

    if (test.status !== 'DRAFT') {
      throw new AppError(409, 'TEST_LOCKED', 'Published tests cannot be deleted');
    }

    await db.orm.public.Test.where({ id: testId }).delete();
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

// ─── 6. POST /tests/:testId/publish (Publish Test) ───────────────────
testsRouter.post(
  '/:testId/publish',
  validate({ params: testIdParamSchema }),
  async (req, res, next) => {
    try {
      const { testId } = req.params as { testId: string };
      const teacherId = req.user!.id;

      const test = await db.orm.public.Test.where({ id: testId }).first();
      if (!test || test.teacherId !== teacherId) {
        throw new AppError(404, 'NOT_FOUND', 'Test not found');
      }

      if (test.status === 'PUBLISHED') {
        return res.status(200).json(
          formatSuccessResponse({
            id: test.id,
            status: 'PUBLISHED',
          })
        );
      }

      const details: string[] = [];

      // Check 1: At least 1 set with at least 1 question
      const sets = await db.orm.public.QuestionSet.where({ testId }).all();
      if (sets.length === 0) {
        details.push('Test must have at least one question set with questions');
      } else {
        let hasQuestion = false;
        for (const s of sets) {
          const qCount = (await db.orm.public.Question.where({ setId: s.id }).all()).length;
          if (qCount > 0) {
            hasQuestion = true;
            break;
          }
        }
        if (!hasQuestion) {
          details.push('Question sets must have at least one question');
        }
      }

      // Check 2: At least 1 participant
      const participants = await db.orm.public.Participant.where({ testId }).all();
      if (participants.length === 0) {
        details.push('Test must have at least one participant');
      }

      // Check 3: startsAt in the future
      const startMs = epochMsFromInstant(test.startsAt);
      if (startMs <= Date.now()) {
        details.push('Test start time must be in the future');
      }

      if (details.length > 0) {
        throw new AppError(422, 'NOT_READY', 'Test is not ready to be published', details);
      }

      await db.orm.public.Test.where({ id: testId }).update({
        status: 'PUBLISHED',
      });

      res.status(200).json(
        formatSuccessResponse({
          id: test.id,
          status: 'PUBLISHED',
        })
      );
    } catch (err) {
      next(err);
    }
  }
);
