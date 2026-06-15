import { Resend } from 'resend';

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

const FROM_EMAIL =
  process.env.EMAIL_FROM || 'Notes App <onboarding@resend.dev>';

function buildPasswordResetHtml(resetUrl: string, userName?: string): string {
  const greeting = userName ? `Hi ${userName},` : 'Hi,';

  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #111827; max-width: 560px; margin: 0 auto; padding: 24px;">
      <h1 style="font-size: 24px; font-weight: 700; margin: 0 0 16px;">Reset your password</h1>
      <p style="margin: 0 0 16px;">${greeting}</p>
      <p style="margin: 0 0 24px;">We received a request to reset the password for your Notes App account. Click the button below to choose a new password. This link expires in 1 hour.</p>
      <p style="margin: 0 0 24px;">
        <a href="${resetUrl}" style="display: inline-block; background: #2563eb; color: #ffffff; text-decoration: none; font-weight: 600; padding: 12px 20px; border-radius: 10px;">Reset Password</a>
      </p>
      <p style="margin: 0 0 16px; font-size: 14px; color: #6b7280;">If the button does not work, copy and paste this link into your browser:</p>
      <p style="margin: 0 0 24px; font-size: 14px; word-break: break-all;"><a href="${resetUrl}" style="color: #2563eb;">${resetUrl}</a></p>
      <p style="margin: 0; font-size: 14px; color: #6b7280;">If you did not request a password reset, you can safely ignore this email.</p>
    </div>
  `.trim();
}

function buildPasswordResetText(resetUrl: string, userName?: string): string {
  const greeting = userName ? `Hi ${userName},` : 'Hi,';

  return [
    greeting,
    '',
    'We received a request to reset the password for your Notes App account.',
    'Use the link below to choose a new password. This link expires in 1 hour.',
    '',
    resetUrl,
    '',
    'If you did not request a password reset, you can safely ignore this email.',
  ].join('\n');
}

export function isEmailConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY);
}

export async function sendPasswordResetEmail(options: {
  to: string;
  resetUrl: string;
  userName?: string;
}): Promise<{ sent: boolean; error?: string }> {
  if (!resend) {
    return { sent: false, error: 'RESEND_API_KEY is not configured' };
  }

  try {
    const { error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: options.to,
      subject: 'Reset your Notes App password',
      html: buildPasswordResetHtml(options.resetUrl, options.userName),
      text: buildPasswordResetText(options.resetUrl, options.userName),
    });

    if (error) {
      return { sent: false, error: error.message };
    }

    return { sent: true };
  } catch (err) {
    return {
      sent: false,
      error: err instanceof Error ? err.message : 'Failed to send email',
    };
  }
}
