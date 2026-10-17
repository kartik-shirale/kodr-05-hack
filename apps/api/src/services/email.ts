export interface CredentialsEmailPayload {
  to: string;
  studentName: string;
  testTitle: string;
  startsAt: unknown;
  durationMinutes: number;
  password: string;
  joinUrl: string;
}

export async function sendCredentialsEmail(payload: CredentialsEmailPayload): Promise<void> {
  const formattedDate = payload.startsAt ? String(payload.startsAt) : 'Scheduled start time';

  // In production, integrate SMTP / Resend / Sendgrid
  // In development, log the credentials clearly to the console
  console.log(`
════════════════════════════════════════════════════════════════
📧 [EMAIL DISPATCH]
To:       ${payload.to} (${payload.studentName})
Subject:  Your Exam Credentials for "${payload.testTitle}"
Start:    ${formattedDate}
Duration: ${payload.durationMinutes} minutes
Password: ${payload.password}
Join URL: ${payload.joinUrl}
════════════════════════════════════════════════════════════════
  `);

  // Simulated slight async network latency
  await new Promise((resolve) => setTimeout(resolve, 10));
}
