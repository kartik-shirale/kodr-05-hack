import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import { config } from './config/env.js';
import { errorHandler } from './middleware/error-handler.js';
import { authRouter } from './routes/auth.js';
import { examRouter } from './routes/exam.js';
import { healthRouter } from './routes/health.js';
import { proctorRouter } from './routes/proctor.js';
import { sessionReviewRouter } from './routes/sessions.js';
import { testsRouter } from './routes/tests.js';
import { startBackgroundJobs } from './jobs/index.js';

const app = express();
const port = config.port;

// CORS configuration supporting credentials from frontend
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, postman) or matching frontend
      if (!origin || origin.startsWith('http://localhost:') || origin === config.frontendUrl) {
        return callback(null, true);
      }
      return callback(null, true);
    },
    credentials: true,
  })
);

app.use(cookieParser());
app.use(express.json());

// 1. Health routes
// Specs: GET /health (no /api/v1 prefix) -> { status: "ok" }
app.use('/health', healthRouter);
app.use('/api/v1/health', healthRouter);

// 2. Auth routes
// Specs: Base path /api/v1, Auth routes mounted at /api/v1/auth and aliased to /auth
app.use('/api/v1/auth', authRouter);
app.use('/auth', authRouter);

// 3. Teacher: Tests routes
// Specs: Base path /api/v1, Tests routes mounted at /api/v1/tests and aliased to /tests
app.use('/api/v1/tests', testsRouter);
app.use('/tests', testsRouter);

// 4. Student: Proctoring ingest routes
app.use('/api/v1/proctor', proctorRouter);
app.use('/proctor', proctorRouter);

// 5. Student: Exam flow routes
app.use('/api/v1/exam', examRouter);
app.use('/exam', examRouter);

// 6. Teacher: Session detail + event review routes
app.use('/api/v1', sessionReviewRouter);
app.use('/', sessionReviewRouter);

// Centralized error handling
app.use(errorHandler);

app.listen(port, () => {
  console.log(`API server listening on http://localhost:${port}`);
  startBackgroundJobs();
});
