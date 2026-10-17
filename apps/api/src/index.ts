import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import { config } from './config/env.js';
import { errorHandler } from './middleware/error-handler.js';
import { authRouter } from './routes/auth.js';
import { healthRouter } from './routes/health.js';

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

// Centralized error handling
app.use(errorHandler);

app.listen(port, () => {
  console.log(`API server listening on http://localhost:${port}`);
});
