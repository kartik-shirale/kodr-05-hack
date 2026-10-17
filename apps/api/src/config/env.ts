import 'dotenv/config';

export const config = {
  port: Number(process.env.PORT ?? 4000),
  nodeEnv: process.env.NODE_ENV ?? 'development',
  jwtAccessSecret: process.env.JWT_ACCESS_SECRET ?? 'dev_jwt_access_secret_key_change_in_production_32char',
  accessTokenTtlMs: 15 * 60 * 1000, // 15 minutes
  refreshTokenTtlMs: 7 * 24 * 60 * 60 * 1000, // 7 days
  frontendUrl: process.env.FRONTEND_URL ?? 'http://localhost:3000',
  isProd: process.env.NODE_ENV === 'production',
  emailjs: {
    serviceId: process.env.EMAILJS_SERVICE_ID,
    templateId: process.env.EMAILJS_TEMPLATE_ID,
    publicKey: process.env.EMAILJS_PUBLIC_KEY,
    privateKey: process.env.EMAILJS_PRIVATE_KEY,
  },
};
