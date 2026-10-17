import fs from 'node:fs';
import path from 'node:path';
import { db, epochMsFromInstant, nowInstant } from '../prisma/db.js';

// ─── 1. finalize-expired-sessions ────────────────────────────────────
// Every minute: Sessions IN_PROGRESS with endsAt in the past: grade, set AUTO_SUBMITTED, endReason = TIME_UP
export async function finalizeExpiredSessions() {
  try {
    const allSessions = await db.orm.public.ExamSession.where({
      status: 'IN_PROGRESS',
    }).all();

    const nowMs = Date.now();
    const expiredSessions = allSessions.filter(
      (s) => epochMsFromInstant(s.endsAt) <= nowMs
    );

    for (const session of expiredSessions) {
      const participant = await db.orm.public.Participant.where({
        id: session.participantId,
      }).first();

      let totalScore = 0;
      if (participant?.setId) {
        const questions = await db.orm.public.Question.where({
          setId: participant.setId,
        }).all();
        const answers = await db.orm.public.Answer.where({
          examSessionId: session.id,
        }).all();
        const answerMap = new Map(answers.map((a) => [a.questionId, a.selectedIndex]));

        for (const q of questions) {
          if (answerMap.get(q.id) === q.correctIndex) {
            totalScore += q.marks;
          }
        }
      }

      await db.orm.public.ExamSession.where({ id: session.id }).update({
        status: 'AUTO_SUBMITTED',
        endReason: 'TIME_UP',
        score: totalScore,
        submittedAt: nowInstant(),
      });
    }
  } catch (err) {
    console.error('Error in finalizeExpiredSessions job:', err);
  }
}

// ─── 2. cleanup-auth-tokens ──────────────────────────────────────────
// Daily: Delete expired RefreshToken and used/expired PasswordResetToken rows
export async function cleanupAuthTokens() {
  try {
    const nowMs = Date.now();
    const allRefreshTokens = await db.orm.public.RefreshToken.all();
    const expiredRefreshTokens = allRefreshTokens.filter(
      (t) => epochMsFromInstant(t.expiresAt) <= nowMs
    );

    for (const token of expiredRefreshTokens) {
      await db.orm.public.RefreshToken.where({ id: token.id }).delete();
    }

    const allResetTokens = await db.orm.public.PasswordResetToken.all();
    const expiredResetTokens = allResetTokens.filter(
      (t) => t.usedAt != null || epochMsFromInstant(t.expiresAt) <= nowMs
    );

    for (const token of expiredResetTokens) {
      await db.orm.public.PasswordResetToken.where({ id: token.id }).delete();
    }
  } catch (err) {
    console.error('Error in cleanupAuthTokens job:', err);
  }
}

// ─── 3. cleanup-snapshots ────────────────────────────────────────────
// Daily: Delete snapshots older than retentionDays (default 30 days)
export async function cleanupSnapshots(retentionDays = 30) {
  try {
    const cutoffMs = Date.now() - retentionDays * 24 * 60 * 60 * 1000;
    const allEvents = await db.orm.public.Event.all();
    const oldEventsWithSnapshots = allEvents.filter(
      (e) =>
        e.snapshotPath != null && epochMsFromInstant(e.createdAt) <= cutoffMs
    );

    for (const event of oldEventsWithSnapshots) {
      if (event.snapshotPath) {
        if (!event.snapshotPath.startsWith('data:')) {
          const resolvedPath = path.isAbsolute(event.snapshotPath)
            ? event.snapshotPath
            : path.join(process.cwd(), event.snapshotPath);

          if (fs.existsSync(resolvedPath)) {
            try {
              fs.unlinkSync(resolvedPath);
            } catch (_e) {
              // Ignore file unlink error
            }
          }
        }

        await db.orm.public.Event.where({ id: event.id }).update({
          snapshotPath: null,
        });
      }
    }
  } catch (err) {
    console.error('Error in cleanupSnapshots job:', err);
  }
}

// ─── Background Job Runner ───────────────────────────────────────────
export function startBackgroundJobs() {
  // Run expired session check every 60 seconds
  const sessionInterval = setInterval(finalizeExpiredSessions, 60 * 1000);

  // Run cleanup jobs once a day (24 hours)
  const cleanupInterval = setInterval(() => {
    cleanupAuthTokens();
    cleanupSnapshots();
  }, 24 * 60 * 60 * 1000);

  // Prevent timers from blocking Node event loop on process exit
  sessionInterval.unref();
  cleanupInterval.unref();

  // Run initial checks on startup
  finalizeExpiredSessions();
}
