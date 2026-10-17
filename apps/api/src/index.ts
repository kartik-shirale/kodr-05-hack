import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import { config } from './config/env.js';
import { errorHandler } from './middleware/error-handler.js';
import { authRouter } from './routes/auth.js';
import { eventsRouter } from './routes/events.js';
import { healthRouter } from './routes/health.js';
import { sessionsRouter } from './routes/sessions.js';
import { testsRouter } from './routes/tests.js';

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

// 4. Teacher: Sessions routes
// Specs: Base path /api/v1, Sessions routes mounted at /api/v1/sessions and aliased to /sessions
app.use('/api/v1/sessions', sessionsRouter);
app.use('/sessions', sessionsRouter);

// 5. Teacher: Events routes
// Specs: Base path /api/v1, Events routes mounted at /api/v1/events and aliased to /events
app.use('/api/v1/events', eventsRouter);
app.use('/events', eventsRouter);

// Centralized error handling
app.use(errorHandler);

app.listen(port, () => {
  console.log(`API server listening on http://localhost:${port}`);
});
