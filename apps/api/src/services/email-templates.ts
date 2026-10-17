import type { CredentialsEmailPayload } from './email.js';

/**
 * Generates responsive, styled HTML for student exam credentials.
 * Compatible with all major email clients and EmailJS HTML template fields.
 */
export function renderCredentialsEmailHtml(payload: CredentialsEmailPayload): string {
  const formattedDate = payload.startsAt ? String(payload.startsAt) : 'Scheduled start time';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your Exam Credentials</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b; line-height: 1.6;">

  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #f1f5f9; padding: 40px 16px;">
    <tr>
      <td align="center">
        <!-- Main Container Card -->
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width: 600px; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 25px -5px rgba(15, 23, 42, 0.08), 0 8px 10px -6px rgba(15, 23, 42, 0.04); border: 1px solid #e2e8f0;">

          <!-- Header Banner -->
          <tr>
            <td style="background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%); padding: 36px 32px; text-align: left;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td>
                    <!-- Pill Tag -->
                    <span style="display: inline-block; background-color: rgba(56, 189, 248, 0.15); border: 1px solid rgba(56, 189, 248, 0.3); color: #38bdf8; font-size: 11px; font-weight: 700; letter-spacing: 1.5px; text-transform: uppercase; padding: 5px 12px; border-radius: 20px; margin-bottom: 14px;">
                      Proctored Assessment
                    </span>
                    <h1 style="margin: 8px 0 0 0; color: #ffffff; font-size: 24px; font-weight: 700; letter-spacing: -0.5px;">
                      Your Exam Credentials
                    </h1>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Main Content Area -->
          <tr>
            <td style="padding: 32px 32px 24px 32px;">
              <p style="margin: 0 0 16px 0; font-size: 16px; color: #334155;">
                Hello <strong>${escapeHtml(payload.studentName)}</strong>,
              </p>
              <p style="margin: 0 0 24px 0; font-size: 15px; color: #64748b; line-height: 1.6;">
                You have been registered for the assessment <strong>"${escapeHtml(payload.testTitle)}"</strong>. Please keep these credentials confidential and follow the instructions below to join your session.
              </p>

              <!-- Exam Details Card -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; margin-bottom: 24px;">
                <tr>
                  <td style="padding: 20px;">
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                      <tr>
                        <td style="padding-bottom: 12px; width: 35%; font-size: 13px; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px;">Assessment</td>
                        <td style="padding-bottom: 12px; font-size: 15px; font-weight: 600; color: #0f172a;">${escapeHtml(payload.testTitle)}</td>
                      </tr>
                      <tr>
                        <td style="padding-bottom: 12px; font-size: 13px; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px;">Starts At</td>
                        <td style="padding-bottom: 12px; font-size: 15px; font-weight: 500; color: #0f172a;">${escapeHtml(formattedDate)}</td>
                      </tr>
                      <tr>
                        <td style="font-size: 13px; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px;">Duration</td>
                        <td style="font-size: 15px; font-weight: 500; color: #0f172a;">${payload.durationMinutes} Minutes</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Student Password Card -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); border-radius: 12px; margin-bottom: 28px; text-align: center;">
                <tr>
                  <td style="padding: 24px;">
                    <div style="font-size: 11px; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 10px;">
                      Your One-Time Student Password
                    </div>
                    <div style="font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, Courier, monospace; font-size: 26px; font-weight: 800; color: #38bdf8; letter-spacing: 4px; padding: 10px 0;">
                      ${escapeHtml(payload.password)}
                    </div>
                    <div style="font-size: 12px; color: #64748b; margin-top: 6px;">
                      Copy this password to log in when entering the lobby
                    </div>
                  </td>
                </tr>
              </table>

              <!-- Action CTA Button -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-bottom: 32px; text-align: center;">
                <tr>
                  <td align="center">
                    <a href="${payload.joinUrl}" target="_blank" style="display: inline-block; background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); color: #ffffff; text-decoration: none; font-size: 16px; font-weight: 600; padding: 14px 36px; border-radius: 8px; box-shadow: 0 4px 14px rgba(37, 99, 235, 0.35);">
                      Join Exam Lobby &rarr;
                    </a>
                  </td>
                </tr>
                <tr>
                  <td align="center" style="padding-top: 12px;">
                    <span style="font-size: 12px; color: #94a3b8;">
                      Or copy direct link: <a href="${payload.joinUrl}" style="color: #2563eb; text-decoration: underline; word-break: break-all;">${payload.joinUrl}</a>
                    </span>
                  </td>
                </tr>
              </table>

              <!-- Important Instructions / Security Callout -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #f8fafc; border-left: 4px solid #3b82f6; border-radius: 4px 8px 8px 4px; padding: 18px 20px; margin-bottom: 16px;">
                <tr>
                  <td>
                    <h4 style="margin: 0 0 10px 0; font-size: 14px; font-weight: 700; color: #0f172a; text-transform: uppercase; letter-spacing: 0.5px;">
                      Important Assessment Rules
                    </h4>
                    <ul style="margin: 0; padding-left: 18px; font-size: 13px; color: #475569; line-height: 1.6;">
                      <li style="margin-bottom: 6px;"><strong>Camera & Microphone:</strong> A working camera is mandatory. Face detection and gaze tracking run continuously.</li>
                      <li style="margin-bottom: 6px;"><strong>Tab & Window Tracking:</strong> Switching browser tabs or windows will be logged as proctoring violations.</li>
                      <li style="margin-bottom: 6px;"><strong>Lobby Arrival:</strong> Arrive 5 minutes prior to the scheduled start time to complete camera consent.</li>
                      <li><strong>Confidentiality:</strong> Do not share your credentials or exam link with anyone.</li>
                    </ul>
                  </td>
                </tr>
              </table>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f8fafc; border-top: 1px solid #e2e8f0; padding: 24px 32px; text-align: center;">
              <p style="margin: 0 0 8px 0; font-size: 12px; color: #64748b;">
                If you have questions or experience technical difficulties, contact your instructor or exam proctor.
              </p>
              <p style="margin: 0; font-size: 11px; color: #94a3b8;">
                &copy; Kodr Proctoring System &bull; Automated notification. Please do not reply directly to this email.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>

</body>
</html>`;
}

/**
 * Generates responsive, styled HTML for teacher password reset.
 */
export function renderPasswordResetEmailHtml(payload: { name: string; resetUrl: string }): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reset Your Password</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b; line-height: 1.6;">

  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #f1f5f9; padding: 40px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width: 600px; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 25px -5px rgba(15, 23, 42, 0.08); border: 1px solid #e2e8f0;">

          <tr>
            <td style="background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%); padding: 36px 32px; text-align: left;">
              <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 700;">
                Password Reset Request
              </h1>
            </td>
          </tr>

          <tr>
            <td style="padding: 32px 32px 24px 32px;">
              <p style="margin: 0 0 16px 0; font-size: 16px; color: #334155;">
                Hello <strong>${escapeHtml(payload.name)}</strong>,
              </p>
              <p style="margin: 0 0 24px 0; font-size: 15px; color: #64748b; line-height: 1.6;">
                We received a request to reset your password for your Teacher account. Click the button below to choose a new password. This link is valid for 1 hour.
              </p>

              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin: 28px 0; text-align: center;">
                <tr>
                  <td align="center">
                    <a href="${payload.resetUrl}" target="_blank" style="display: inline-block; background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); color: #ffffff; text-decoration: none; font-size: 16px; font-weight: 600; padding: 14px 36px; border-radius: 8px;">
                      Reset Password &rarr;
                    </a>
                  </td>
                </tr>
                <tr>
                  <td align="center" style="padding-top: 12px;">
                    <span style="font-size: 12px; color: #94a3b8;">
                      Or copy direct link: <a href="${payload.resetUrl}" style="color: #2563eb; text-decoration: underline; word-break: break-all;">${payload.resetUrl}</a>
                    </span>
                  </td>
                </tr>
              </table>

              <p style="margin: 0; font-size: 13px; color: #94a3b8;">
                If you did not request a password reset, you can safely ignore this email. Your password will remain unchanged.
              </p>
            </td>
          </tr>

          <tr>
            <td style="background-color: #f8fafc; border-top: 1px solid #e2e8f0; padding: 20px 32px; text-align: center;">
              <p style="margin: 0; font-size: 11px; color: #94a3b8;">
                &copy; Kodr Proctoring System &bull; Automated notification.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>

</body>
</html>`;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
