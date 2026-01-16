'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  getStudios,
  getRoomsByStudio,
  getVoiceActors,
  getDirectors,
  getBookingsByDate,
  getSavedScheduleById,
  type Studio,
  type Room,
  type VoiceActor,
  type Director,
  type Booking,
  type SavedSchedule,
} from '@/lib/db';
import { utcToPST, getTodayPST } from '@/lib/timezone';

type CompleteShift = {
  studio: Studio;
  room: Room;
  slotType: 'am' | 'pm';
  booking: Booking;
  va1: VoiceActor;
  va2: VoiceActor;
  director: Director;
};

type ShiftWithStatus = CompleteShift & {
  emailSent: boolean;
};

export default function SendEmailsPage() {
  const params = useParams();
  const router = useRouter();
  const scheduleId = params?.scheduleId as string;

  const [savedSchedule, setSavedSchedule] = useState<SavedSchedule | null>(
    null
  );
  const [studios, setStudios] = useState<Studio[]>([]);
  const [roomsByStudio, setRoomsByStudio] = useState<Record<string, Room[]>>(
    {}
  );
  const [voiceActors, setVoiceActors] = useState<VoiceActor[]>([]);
  const [directors, setDirectors] = useState<Director[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingEmail, setEditingEmail] = useState<CompleteShift | null>(null);
  const [emailFilter, setEmailFilter] = useState<'all' | 'sent' | 'not_sent'>(
    'all'
  );
  const [emailForm, setEmailForm] = useState({
    to: '',
    bcc: '',
    subject: '',
    body: '',
  });

  useEffect(() => {
    if (!scheduleId) {
      setError('Schedule ID is missing');
      setLoading(false);
      return;
    }
    loadData();
  }, [scheduleId]);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [savedScheduleData, studiosData, voiceActorsData, directorsData] =
        await Promise.all([
          getSavedScheduleById(scheduleId),
          getStudios(),
          getVoiceActors(),
          getDirectors(),
        ]);

      if (!savedScheduleData) {
        setError('Schedule not found');
        setLoading(false);
        return;
      }

      setSavedSchedule(savedScheduleData);
      setStudios(studiosData);
      setVoiceActors(voiceActorsData);
      setDirectors(directorsData);

      // Load bookings for the schedule date
      const bookingsData = await getBookingsByDate(savedScheduleData.date);
      setBookings(bookingsData);

      // Load rooms for each studio
      const roomsMap: Record<string, Room[]> = {};
      for (const studio of studiosData) {
        const rooms = await getRoomsByStudio(studio.id);
        roomsMap[studio.id] = rooms;
      }
      setRoomsByStudio(roomsMap);
    } catch (e: any) {
      console.error('Error loading data:', e);
      setError(e?.message ?? 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const getVoiceActorById = (id: string) => {
    return voiceActors.find((va) => va.id === id);
  };

  const getDirectorById = (id: string) => {
    return directors.find((dir) => dir.id === id);
  };

  // Filter to only show studios with complete shifts
  const completeShifts = useMemo(() => {
    const shifts: CompleteShift[] = [];
    if (
      !studios.length ||
      !Object.keys(roomsByStudio).length ||
      !bookings.length
    ) {
      return shifts;
    }
    studios.forEach((studio) => {
      const rooms = roomsByStudio[studio.id] || [];
      rooms.forEach((room) => {
        // Check AM slot - convert both to strings for comparison
        const amBooking = bookings.find(
          (b) =>
            String(b.room_id) === String(room.id) &&
            b.am_start_time !== null &&
            b.am_end_time !== null
        );
        if (
          amBooking &&
          amBooking.voice_actor_id &&
          amBooking.voice_actor_id_2 &&
          amBooking.director_id
        ) {
          const va1 = getVoiceActorById(amBooking.voice_actor_id);
          const va2 = getVoiceActorById(amBooking.voice_actor_id_2);
          const director = getDirectorById(amBooking.director_id);
          if (va1 && va2 && director) {
            shifts.push({
              studio,
              room,
              slotType: 'am',
              booking: amBooking,
              va1,
              va2,
              director,
            });
          }
        }

        // Check PM slot - convert both to strings for comparison
        const pmBooking = bookings.find(
          (b) =>
            String(b.room_id) === String(room.id) &&
            b.pm_start_time !== null &&
            b.pm_end_time !== null
        );
        if (
          pmBooking &&
          pmBooking.voice_actor_id &&
          pmBooking.voice_actor_id_2 &&
          pmBooking.director_id
        ) {
          const va1 = getVoiceActorById(pmBooking.voice_actor_id);
          const va2 = getVoiceActorById(pmBooking.voice_actor_id_2);
          const director = getDirectorById(pmBooking.director_id);
          if (va1 && va2 && director) {
            shifts.push({
              studio,
              room,
              slotType: 'pm',
              booking: pmBooking,
              va1,
              va2,
              director,
            });
          }
        }
      });
    });
    return shifts;
  }, [studios, roomsByStudio, bookings, voiceActors, directors]);

  const shiftsWithStatus = useMemo<ShiftWithStatus[]>(() => {
    return completeShifts.map((shift) => ({
      ...shift,
      emailSent:
        shift.slotType === 'am'
          ? Boolean(shift.booking.am_emails_sent)
          : Boolean(shift.booking.pm_emails_sent),
    }));
  }, [completeShifts]);

  const formatDate = (dateStr: string) => {
    const [year, month, day] = dateStr.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    const days = [
      'Sunday',
      'Monday',
      'Tuesday',
      'Wednesday',
      'Thursday',
      'Friday',
      'Saturday',
    ];
    const months = [
      'January',
      'February',
      'March',
      'April',
      'May',
      'June',
      'July',
      'August',
      'September',
      'October',
      'November',
      'December',
    ];
    return {
      dayOfWeek: days[date.getDay()],
      month: months[date.getMonth()],
      day: date.getDate(),
      daySuffix: getDaySuffix(date.getDate()),
    };
  };

  const getDaySuffix = (day: number) => {
    if (day > 3 && day < 21) return 'th';
    switch (day % 10) {
      case 1:
        return 'st';
      case 2:
        return 'nd';
      case 3:
        return 'rd';
      default:
        return 'th';
    }
  };

  const handleSendEmailClick = (shift: CompleteShift) => {
    console.log('handleSendEmailClick called', shift);
    if (!savedSchedule) {
      console.error('No saved schedule');
      return;
    }

    const dateInfo = formatDate(savedSchedule.date);
    const timeDisplay =
      shift.slotType === 'am'
        ? shift.booking.am_start_time && shift.booking.am_end_time
          ? `${utcToPST(shift.booking.am_start_time)} - ${utcToPST(
              shift.booking.am_end_time
            )}`
          : ''
        : shift.booking.pm_start_time && shift.booking.pm_end_time
          ? `${utcToPST(shift.booking.pm_start_time)} - ${utcToPST(
              shift.booking.pm_end_time
            )}`
          : '';

    const [startTime, endTime] = timeDisplay.split(' - ');

    // Calculate 15 minutes before start time
    const startTimeMinutes = startTime
      ? (() => {
          const [hours, minutes] = startTime.split(':').map(Number);
          const date = new Date();
          date.setHours(hours, minutes, 0, 0);
          date.setMinutes(date.getMinutes() - 15);
          return date.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false,
          });
        })()
      : '';

    const to = shift.director.email || '';
    const bcc = [shift.va1.email, shift.va2.email]
      .filter((email) => email)
      .join(', ');
    const checkInTime =
      startTimeMinutes || startTime || '[Shift start time minus 15 minutes]';
    const subjectEndTime = endTime || '[Shift End time]';
    const subject = `Recording Session Confirmation - ${dateInfo.dayOfWeek}, ${dateInfo.month} ${dateInfo.day}${dateInfo.daySuffix} (${checkInTime} - ${subjectEndTime})`;
    const body = `Hey there!

Congratulations again! We're confirming your upcoming recording session on ${dateInfo.dayOfWeek}, ${dateInfo.month} ${dateInfo.day}${dateInfo.daySuffix} at ${timeDisplay || '[Shift Start Time] - [Shift End time]'}.

Location: ${shift.studio.name}
${shift.studio.address || '[Studio Address]'}

Our payment provider is Dots (https://dots.dev/). As mentioned, we will explain the payment process after your session is completed. Do not sign up on the platform until we explain the payment process after project completion (Feb 28).

[ Dress code ]
- Please avoid wearing green clothings
- Tie loose hair back
- Take off loose coats / especially leather jackets
- ⁠Remove dangly accessories such as earrings, bracelets and analog watches that tick
- Any accessibility devices that produce sound brought into the studio should be discussed prior to best accommodate you
- Wear contact lens if possible, as spectacles will cause interference with ear muffs.
- We may call approx. 20 mins before our session to confirm your attendance. 

On the day of your session:

- Please arrive 15 minutes early to check in (${startTimeMinutes || '[Shift start time minus 15 minutes]'}).
- Stay hydrated and well rested.
- Contact ${shift.director.name} at ${shift.director.phone || '778-681-9306'} once you've arrive to be let in.

Things to keep in mind for your recording session tomorrow:

BRING YOUR EARBUDS!
- Please arrive on time - account for traffic!
- Work with your director, follow their lead and please co-operate with them. Your performance will be evaluated by our team.
- Turn off your phone while in session, vibrations on silent mode are NOT okay
- DRINK WATER often to prevent sticky mouth 

ADDITIONAL NOTES:

We will be auditing our recording sessions. Sessions would be booked one at a time and quality will be verified before we book more sessions with you. Keep in mind for artists we have rebooked, our team reserves the right to defer your future bookings based on performance feedback. 

Lunch and snacks will be provided, but keep in mind that meals were not stipulated by the contract. We will try to accommodate everyone's dietary restrictions, but please don't expect perfect meals. If you have concerns, feel free to bring your own lunch.

Note: To clarify, the project title "Gametime" is only an internal working title. It has no connection to the production of any video game. Furthermore, this project is a non-union project, it does not fall under union jurisdiction.


We're looking forward to working with you!

Regards,
Mundo AI Team`;

    setEmailForm({ to, bcc, subject, body });
    setEditingEmail(shift);
    console.log('Email form set, editingEmail:', shift);
  };

  const handleSendEmail = async () => {
    if (!editingEmail) return;

    try {
      setError(null);

      // Send one email with TO=director and BCC=voice actors via API route
      const bccEmails = emailForm.bcc
        .split(',')
        .map((email) => email.trim())
        .filter((email) => email);

      // Get voice actor IDs for logging
      const voiceActorIds = bccEmails.map((email) => {
        const va = voiceActors.find((v) => v.email === email);
        return va?.id || null;
      });

      const response = await fetch('/api/send-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: emailForm.to,
          bcc: bccEmails,
          subject: emailForm.subject,
          text: emailForm.body,
          voiceActorIds,
          bookingId: editingEmail.booking.id,
          slotType: editingEmail.slotType,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send email');
      }

      // Close modal
      setEditingEmail(null);
      setEmailForm({ to: '', bcc: '', subject: '', body: '' });
      alert('Email sent successfully!');

      // Persist email status locally so UI updates immediately
      setBookings((prev) =>
        prev.map((booking) => {
          if (booking.id !== editingEmail.booking.id) return booking;
          if (editingEmail.slotType === 'am') {
            return { ...booking, am_emails_sent: true };
          }
          return { ...booking, pm_emails_sent: true };
        })
      );
    } catch (e: any) {
      console.error('Error sending email:', e);
      setError(e?.message ?? 'Failed to send email');
    }
  };

  // Filter shifts based on email status
  const filteredShifts = useMemo(() => {
    if (emailFilter === 'all') return shiftsWithStatus;

    return shiftsWithStatus.filter((shift) =>
      emailFilter === 'sent' ? shift.emailSent : !shift.emailSent
    );
  }, [shiftsWithStatus, emailFilter]);

  // Group filtered shifts by studio
  const shiftsByStudio = useMemo(() => {
    const grouped: Record<
      string,
      { studio: Studio; shifts: ShiftWithStatus[] }
    > = {};
    filteredShifts.forEach((shift) => {
      const key = String(shift.studio.id);
      if (!grouped[key]) {
        grouped[key] = { studio: shift.studio, shifts: [] };
      }
      grouped[key].shifts.push(shift);
    });
    return grouped;
  }, [filteredShifts]);

  // Always render something - never return null
  if (loading) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-semibold mb-4">Send Emails</h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">Loading…</p>
      </div>
    );
  }

  if (error && !savedSchedule) {
    return (
      <div className="p-6">
        <div className="rounded-md bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-3 text-sm text-red-600 dark:text-red-400">
          {error}
        </div>
        <Link
          href="/schedule"
          className="mt-4 inline-block text-sm text-blue-600 hover:underline"
        >
          ← Back to Schedule
        </Link>
      </div>
    );
  }

  if (!savedSchedule) {
    return (
      <div className="p-6">
        <div className="rounded-md bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-3 text-sm text-red-600 dark:text-red-400">
          Schedule not found
        </div>
        <Link
          href="/schedule"
          className="mt-4 inline-block text-sm text-blue-600 hover:underline"
        >
          ← Back to Schedule
        </Link>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100">
            Send Emails
          </h1>
          {savedSchedule && (
            <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
              {savedSchedule.name} - {formatDate(savedSchedule.date).dayOfWeek},{' '}
              {formatDate(savedSchedule.date).month}{' '}
              {formatDate(savedSchedule.date).day}
              {formatDate(savedSchedule.date).daySuffix}
            </p>
          )}
        </div>
        <Link
          href="/schedule"
          className="rounded-md border border-zinc-300 dark:border-zinc-700 px-4 py-2 text-sm hover:bg-zinc-50 dark:hover:bg-zinc-900"
        >
          ← Back to Schedule
        </Link>
      </div>

      {error && (
        <div className="rounded-md bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-3 text-sm text-red-600 dark:text-red-400">
          Error: {error}
        </div>
      )}

      <div className="flex items-center justify-between mb-4">
        <div className="text-sm text-zinc-600 dark:text-zinc-400">
          Found {filteredShifts.length} of {completeShifts.length} complete
          shift(s) across {Object.keys(shiftsByStudio).length} studio(s)
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setEmailFilter('all')}
            className={`px-3 py-1 text-sm rounded-md border transition-colors ${
              emailFilter === 'all'
                ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 border-zinc-900 dark:border-zinc-100'
                : 'border-zinc-300 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-900'
            }`}
          >
            All
          </button>
          <button
            type="button"
            onClick={() => setEmailFilter('sent')}
            className={`px-3 py-1 text-sm rounded-md border transition-colors ${
              emailFilter === 'sent'
                ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 border-zinc-900 dark:border-zinc-100'
                : 'border-zinc-300 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-900'
            }`}
          >
            Sent
          </button>
          <button
            type="button"
            onClick={() => setEmailFilter('not_sent')}
            className={`px-3 py-1 text-sm rounded-md border transition-colors ${
              emailFilter === 'not_sent'
                ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 border-zinc-900 dark:border-zinc-100'
                : 'border-zinc-300 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-900'
            }`}
          >
            Not Sent
          </button>
        </div>
      </div>

      {filteredShifts.length === 0 ? (
        <div className="rounded-md bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-6 text-center">
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            No complete shifts found. A shift must have VA1, VA2, and Director
            all filled to send emails.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(shiftsByStudio).map(([studioId, group]) => {
            const { studio, shifts } = group;
            return (
              <div
                key={studioId}
                className="rounded-lg border border-zinc-200 dark:border-zinc-800 p-6 space-y-4"
              >
                <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                  {studio.name}
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {shifts.map((shift) => {
                    const timeDisplay =
                      shift.slotType === 'am'
                        ? shift.booking.am_start_time &&
                          shift.booking.am_end_time
                          ? `${utcToPST(shift.booking.am_start_time)} - ${utcToPST(
                              shift.booking.am_end_time
                            )}`
                          : ''
                        : shift.booking.pm_start_time &&
                            shift.booking.pm_end_time
                          ? `${utcToPST(shift.booking.pm_start_time)} - ${utcToPST(
                              shift.booking.pm_end_time
                            )}`
                          : '';

                    return (
                      <div
                        key={`${shift.room.id}-${shift.slotType}`}
                        className="rounded-md border border-zinc-200 dark:border-zinc-800 p-4 space-y-3"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <h3 className="font-medium text-zinc-900 dark:text-zinc-100">
                                {shift.room.name ||
                                  `Room ${shift.room.room_number || ''}`}
                              </h3>
                              {shift.emailSent ? (
                                <span className="px-2 py-0.5 text-xs rounded-md bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 font-medium">
                                  Sent
                                </span>
                              ) : null}
                            </div>
                            <p className="text-sm text-zinc-600 dark:text-zinc-400">
                              {shift.slotType.toUpperCase()} Slot -{' '}
                              {timeDisplay}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleSendEmailClick(shift)}
                            className="rounded-md bg-blue-600 text-white px-4 py-2 text-sm font-medium hover:bg-blue-700"
                          >
                            Send Email
                          </button>
                        </div>
                        <div className="text-sm space-y-1">
                          <div>
                            <span className="font-medium">VA1:</span>{' '}
                            {shift.va1.name} ({shift.va1.email})
                          </div>
                          <div>
                            <span className="font-medium">VA2:</span>{' '}
                            {shift.va2.name} ({shift.va2.email})
                          </div>
                          <div>
                            <span className="font-medium">Director:</span>{' '}
                            {shift.director.name} (
                            {shift.director.email || 'No email'})
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Email Editor Modal */}
      {editingEmail && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-zinc-950 rounded-lg border border-zinc-200 dark:border-zinc-800 p-6 max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-semibold mb-4">Send Email</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">To</label>
                <input
                  type="email"
                  value={emailForm.to}
                  onChange={(e) =>
                    setEmailForm((f) => ({ ...f, to: e.target.value }))
                  }
                  className="w-full rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 px-3 py-2"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">BCC</label>
                <input
                  type="text"
                  value={emailForm.bcc}
                  onChange={(e) =>
                    setEmailForm((f) => ({ ...f, bcc: e.target.value }))
                  }
                  className="w-full rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 px-3 py-2"
                  placeholder="email1@example.com, email2@example.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Subject
                </label>
                <input
                  type="text"
                  value={emailForm.subject}
                  onChange={(e) =>
                    setEmailForm((f) => ({ ...f, subject: e.target.value }))
                  }
                  className="w-full rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 px-3 py-2"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Body</label>
                <textarea
                  value={emailForm.body}
                  onChange={(e) =>
                    setEmailForm((f) => ({ ...f, body: e.target.value }))
                  }
                  className="w-full rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 px-3 py-2"
                  rows={20}
                  required
                />
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={handleSendEmail}
                  className="rounded-md bg-blue-600 text-white px-4 py-2 text-sm font-medium hover:bg-blue-700"
                >
                  Send Email
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEditingEmail(null);
                    setEmailForm({ to: '', bcc: '', subject: '', body: '' });
                  }}
                  className="rounded-md border border-zinc-300 dark:border-zinc-700 px-4 py-2 text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
