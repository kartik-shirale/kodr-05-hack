import 'dotenv/config';

export const config = {
  port: Number(process.env.PORT ?? 4000),
  nodeEnv: process.env.NODE_ENV ?? 'development',
  jwtAccessSecret: process.env.JWT_ACCESS_SECRET ?? 'dev_jwt_access_secret_key_change_in_production_32char',
  accessTokenTtlMs: 15 * 60 * 1000, // 15 minutes
  refreshTokenTtlMs: 7 * 24 * 60 * 60 * 1000, // 7 days
  frontendUrl: process.env.FRONTEND_URL ?? 'http://localhost:3000',
  isProd: process.env.NODE_ENV === 'production',
  proctor: {
    // Which vision backend to use: 'auto' picks OpenRouter whenever an
    // OpenRouter API key is present, otherwise the Vercel AI Gateway (JEV).
    visionProvider: (process.env.VISION_PROVIDER ?? 'auto') as 'auto' | 'openrouter' | 'gateway',
    // JEV decision model, resolved through the Vercel AI Gateway.
    // Requires a real gateway key (AI_GATEWAY_API_KEY or VERCEL_OIDC_TOKEN).
    visionModel: process.env.VISION_MODEL ?? 'typesafe-ai/jev-1.14.0',
    // OpenRouter vision model (OpenAI-compatible). OPENROUTER_API_KEY may be
    // supplied directly or fall back to AI_GATEWAY_API_KEY.
    openRouterApiKey: process.env.OPENROUTER_API_KEY ?? process.env.AI_GATEWAY_API_KEY,
    openRouterModel: process.env.OPENROUTER_MODEL ?? 'openai/gpt-4o-mini',
    openRouterAppUrl: process.env.OPENROUTER_APP_URL,
    uploadDir: process.env.UPLOAD_DIR ?? 'uploads',
    maxImageBytes: Number(process.env.PROCTOR_MAX_IMAGE_BYTES ?? 3 * 1024 * 1024),
    visionTimeoutMs: Number(process.env.PROCTOR_VISION_TIMEOUT_MS ?? 20000),
    redisUrl: process.env.REDIS_URL,
  },
  emailjs: {
    serviceId: process.env.EMAILJS_SERVICE_ID,
    templateId: process.env.EMAILJS_TEMPLATE_ID,
    publicKey: process.env.EMAILJS_PUBLIC_KEY,
    privateKey: process.env.EMAILJS_PRIVATE_KEY,
  }
};
