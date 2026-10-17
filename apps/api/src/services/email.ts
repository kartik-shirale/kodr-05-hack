import { config } from '../config/env.js';
import { renderCredentialsEmailHtml, renderPasswordResetEmailHtml } from './email-templates.js';

export interface CredentialsEmailPayload {
  to: string;
  studentName: string;
  testTitle: string;
  startsAt: unknown;
  durationMinutes: number;
  password: string;
  joinUrl: string;
}

export interface PasswordResetEmailPayload {
  to: string;
  name: string;
  resetUrl: string;
}

/**
 * Sends student credentials via EmailJS if configured,
 * otherwise logs the formatted credentials to the console for development.
 */
export async function sendCredentialsEmail(payload: CredentialsEmailPayload): Promise<void> {
  const formattedDate = payload.startsAt ? String(payload.startsAt) : 'Scheduled start time';
  const htmlContent = renderCredentialsEmailHtml(payload);

  const { serviceId, templateId, publicKey, privateKey } = config.emailjs;

  // 2. Fallback console output for local development / testing
  console.log(`
════════════════════════════════════════════════════════════════
📧 [EMAIL DISPATCH - CONSOLE FALLBACK]
To:       ${payload.to} (${payload.studentName})
Subject:  Your Exam Credentials for "${payload.testTitle}"
Start:    ${formattedDate}
Duration: ${payload.durationMinutes} minutes
Password: ${payload.password}
Join URL: ${payload.joinUrl}
════════════════════════════════════════════════════════════════
  `);

  // 1. If EmailJS is configured, send via REST API
  if (serviceId && templateId && publicKey) {
    const res = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        service_id: serviceId,
        template_id: templateId,
        user_id: publicKey,
        accessToken: privateKey,
        template_params: {
          to_email: payload.to,
          to_name: payload.studentName,
          student_name: payload.studentName,
          test_title: payload.testTitle,
          starts_at: formattedDate,
          duration_minutes: payload.durationMinutes,
          password: payload.password,
          join_url: payload.joinUrl,
          html_content: htmlContent,
        },
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.log(`EmailJS dispatch failed (${res.status}): ${errText}`);
      throw new Error(`EmailJS dispatch failed (${res.status}): ${errText}`);
    }
    return;
  }
  await new Promise((resolve) => setTimeout(resolve, 10));
}

/**
 * Sends teacher password reset link via EmailJS if configured,
 * otherwise logs the reset link to the console.
 */
export async function sendPasswordResetEmail(payload: PasswordResetEmailPayload): Promise<void> {
  const { serviceId, publicKey, privateKey } = config.emailjs;
  const htmlContent = renderPasswordResetEmailHtml(payload);

  if (serviceId && publicKey) {
    const res = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        service_id: serviceId,
        template_id: config.emailjs.templateId,
        user_id: publicKey,
        accessToken: privateKey,
        template_params: {
          to_email: payload.to,
          to_name: payload.name,
          name: payload.name,
          reset_url: payload.resetUrl,
          html_content: htmlContent,
        },
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`EmailJS password reset dispatch failed (${res.status}): ${errText}`);
    }
    return;
  }

  console.log(`[PASSWORD_RESET_LINK] To: ${payload.to} (${payload.name}) | URL: ${payload.resetUrl}`);
}
