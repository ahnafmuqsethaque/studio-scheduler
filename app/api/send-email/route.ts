import { NextRequest, NextResponse } from 'next/server';
import { sendVoiceActorEmail } from '@/lib/email';
import { logEmailSend, markBookingEmailsSent } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      to,
      bcc,
      subject,
      text,
      voiceActorIds,
      bookingId,
      slotType,
    } = body;

    if (!to || !subject || !text) {
      return NextResponse.json(
        { error: 'Missing required fields: to, subject, text' },
        { status: 400 }
      );
    }

    // Send email with BCC
    const bccEmails = bcc
      ? (Array.isArray(bcc) ? bcc : bcc.split(',').map((e: string) => e.trim()))
      : [];

    const result = await sendVoiceActorEmail({
      to,
      bcc: bccEmails,
      subject,
      text,
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to send email' },
        { status: 500 }
      );
    }

    // Log emails for BCC recipients
    if (voiceActorIds && Array.isArray(voiceActorIds)) {
      for (let i = 0; i < bccEmails.length; i++) {
        const email = bccEmails[i];
        const voiceActorId = voiceActorIds[i] || null;
        if (email) {
          await logEmailSend({
            voice_actor_id: voiceActorId,
            email,
            subject,
            sent_at: new Date().toISOString(),
            success: true,
            error_message: null,
          });
        }
      }
    }

    if (bookingId && (slotType === 'am' || slotType === 'pm')) {
      await markBookingEmailsSent(bookingId, slotType, true);
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error sending email:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to send email' },
      { status: 500 }
    );
  }
}

