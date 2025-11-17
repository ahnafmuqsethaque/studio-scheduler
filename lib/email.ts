import { Resend } from 'resend';
import process from 'node:process';
import { logEmailSend } from './db';

// Lazy initialization to avoid errors if API key is not set
function getResendClient() {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error('RESEND_API_KEY environment variable is not set');
  }
  return new Resend(apiKey);
}

export interface SendVoiceActorEmailOptions {
  to: string;
  subject: string;
  text: string;
  voiceActorId?: string | null;
  bcc?: string | string[];
}

export async function sendVoiceActorEmail(
  options: SendVoiceActorEmailOptions
): Promise<{ success: boolean; error?: string }> {
  const { to, subject, text, voiceActorId, bcc } = options;
  const from = process.env.EMAIL_FROM;

  if (!from) {
    const error = 'EMAIL_FROM environment variable is not set';
    await logEmailSend({
      voice_actor_id: voiceActorId ?? null,
      email: to,
      subject,
      sent_at: new Date().toISOString(),
      success: false,
      error_message: error,
    });
    return { success: false, error };
  }

  try {
    const resend = getResendClient();
    const emailOptions: {
      from: string;
      to: string;
      subject: string;
      text: string;
      bcc?: string[];
    } = {
      from,
      to,
      subject,
      text,
    };
    if (bcc) {
      emailOptions.bcc = Array.isArray(bcc) ? bcc : [bcc];
    }
    const result = await resend.emails.send(emailOptions);

    if (result.error) {
      await logEmailSend({
        voice_actor_id: voiceActorId ?? null,
        email: to,
        subject,
        sent_at: new Date().toISOString(),
        success: false,
        error_message: result.error.message || 'Unknown error from Resend',
      });
      return { success: false, error: result.error.message };
    }

    await logEmailSend({
      voice_actor_id: voiceActorId ?? null,
      email: to,
      subject,
      sent_at: new Date().toISOString(),
      success: true,
      error_message: null,
    });

    return { success: true };
  } catch (error: any) {
    const errorMessage = error?.message || 'Failed to send email';
    await logEmailSend({
      voice_actor_id: voiceActorId ?? null,
      email: to,
      subject,
      sent_at: new Date().toISOString(),
      success: false,
      error_message: errorMessage,
    });
    return { success: false, error: errorMessage };
  }
}
