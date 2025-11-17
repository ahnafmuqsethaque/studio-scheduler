'use client';

import React, { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import {
  getStudios,
  getRoomsByStudio,
  getVoiceActors,
  getDirectors,
  getBookingsByDate,
  getBookingDates,
  getSavedSchedules,
  createBooking,
  updateBooking,
  deleteBooking,
  createSavedSchedule,
  getVoiceActorConflict,
  type Studio,
  type Room,
  type VoiceActor,
  type Director,
  type Booking,
  type SavedSchedule,
} from '@/lib/db';
import { utcToPST, pstToUTC, getTodayPST } from '@/lib/timezone';

type BookingSlot = {
  roomId: string;
  slotType: 'am' | 'pm';
  booking: Booking | null;
};

export default function SchedulePage() {
  const [selectedDate, setSelectedDate] = useState(() => {
    return getTodayPST();
  });
  const [studios, setStudios] = useState<Studio[]>([]);
  const [roomsByStudio, setRoomsByStudio] = useState<Record<string, Room[]>>(
    {}
  );
  const [voiceActors, setVoiceActors] = useState<VoiceActor[]>([]);
  const [directors, setDirectors] = useState<Director[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [scheduleDates, setScheduleDates] = useState<string[]>([]);
  const [savedSchedules, setSavedSchedules] = useState<SavedSchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingBooking, setEditingBooking] = useState<Booking | null>(null);
  const [editingSlotType, setEditingSlotType] = useState<'am' | 'pm' | null>(
    null
  );
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [saveScheduleName, setSaveScheduleName] = useState('');
  const [bookingForm, setBookingForm] = useState({
    roomId: '',
    voiceActorId: '',
    voiceActorId2: '',
    directorId: '',
    am_start_time: '',
    am_end_time: '',
    pm_start_time: '',
    pm_end_time: '',
    notes: '',
  });

  useEffect(() => {
    loadData();
  }, [selectedDate]);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [
        studiosData,
        voiceActorsData,
        directorsData,
        bookingsData,
        datesData,
        savedSchedulesData,
      ] = await Promise.all([
        getStudios(),
        getVoiceActors(),
        getDirectors(),
        getBookingsByDate(selectedDate),
        getBookingDates(),
        getSavedSchedules(),
      ]);

      setStudios(studiosData);
      setVoiceActors(voiceActorsData);
      setDirectors(directorsData);
      setBookings(bookingsData);
      setScheduleDates(datesData);
      setSavedSchedules(savedSchedulesData);

      // Load rooms for each studio
      const roomsMap: Record<string, Room[]> = {};
      for (const studio of studiosData) {
        const rooms = await getRoomsByStudio(studio.id);
        roomsMap[studio.id] = rooms;
      }
      setRoomsByStudio(roomsMap);
    } catch (e: any) {
      setError(e?.message ?? 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const getBookingForRoom = (roomId: string, slotType: 'am' | 'pm') => {
    // Find separate bookings for AM and PM slots
    // AM booking: has am_start_time and am_end_time
    // PM booking: has pm_start_time and pm_end_time
    return (
      bookings.find((b) => {
        if (b.room_id !== roomId) return false;
        if (slotType === 'am') {
          return (
            b.am_start_time &&
            b.am_end_time &&
            !b.pm_start_time &&
            !b.pm_end_time
          );
        } else {
          return (
            b.pm_start_time &&
            b.pm_end_time &&
            !b.am_start_time &&
            !b.am_end_time
          );
        }
      }) || null
    );
  };

  const getVoiceActorById = (id: string) => {
    return voiceActors.find((va) => va.id === id);
  };

  const getDirectorById = (id: string) => {
    return directors.find((dir) => dir.id === id);
  };

  const handleSlotClick = (roomId: string, slotType: 'am' | 'pm') => {
    // Find existing booking for this specific slot
    const existingBooking = getBookingForRoom(roomId, slotType);

    setEditingSlotType(slotType);

    if (existingBooking) {
      setEditingBooking(existingBooking);
      // Convert UTC times to PST for display
      setBookingForm({
        roomId: existingBooking.room_id,
        voiceActorId: existingBooking.voice_actor_id,
        voiceActorId2: existingBooking.voice_actor_id_2,
        directorId: existingBooking.director_id,
        am_start_time: utcToPST(existingBooking.am_start_time) ?? '',
        am_end_time: utcToPST(existingBooking.am_end_time) ?? '',
        pm_start_time: utcToPST(existingBooking.pm_start_time) ?? '',
        pm_end_time: utcToPST(existingBooking.pm_end_time) ?? '',
        notes: existingBooking.notes ?? '',
      });
    } else {
      setEditingBooking(null);
      // Pre-fill times based on slot type (in PST)
      const defaultTimes =
        slotType === 'am'
          ? {
              am_start_time: '09:00',
              am_end_time: '17:30',
              pm_start_time: '',
              pm_end_time: '',
            }
          : {
              am_start_time: '',
              am_end_time: '',
              pm_start_time: '17:30',
              pm_end_time: '02:00',
            };
      setBookingForm({
        roomId,
        voiceActorId: '',
        voiceActorId2: '',
        directorId: '',
        ...defaultTimes,
        notes: '',
      });
    }
    setShowBookingForm(true);
  };

  const handleSaveBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      const slotType = editingSlotType || 'am';

      // Validation 1: Voice actor 2 is required
      if (!bookingForm.voiceActorId2) {
        setError('Voice Actor 2 is required');
        return;
      }

      // Validation 2: Director is required
      if (!bookingForm.directorId) {
        setError('Director is required');
        return;
      }

      // Validation 3: Voice actor cannot be scheduled with themselves
      if (bookingForm.voiceActorId === bookingForm.voiceActorId2) {
        setError('A voice actor cannot be scheduled with themselves');
        return;
      }

      // Validation 4: Check if voice actor 1 is already scheduled in another room
      const conflict1 = await getVoiceActorConflict(
        bookingForm.voiceActorId,
        selectedDate,
        slotType,
        editingBooking?.id,
        bookingForm.roomId
      );
      if (conflict1) {
        const conflictRoom = allRooms.find(
          (r) => r.room.id === conflict1.room_id
        );
        const roomName = conflictRoom
          ? `${conflictRoom.studio.name} ${conflictRoom.room.name || ''}`
          : 'another room';
        setError(
          `Voice Actor 1 is already scheduled in ${roomName} for this ${slotType.toUpperCase()} slot`
        );
        return;
      }

      // Validation 5: Check if voice actor 2 is already scheduled in another room
      const conflict2 = await getVoiceActorConflict(
        bookingForm.voiceActorId2,
        selectedDate,
        slotType,
        editingBooking?.id,
        bookingForm.roomId
      );
      if (conflict2) {
        const conflictRoom = allRooms.find(
          (r) => r.room.id === conflict2.room_id
        );
        const roomName = conflictRoom
          ? `${conflictRoom.studio.name} ${conflictRoom.room.name || ''}`
          : 'another room';
        setError(
          `Voice Actor 2 is already scheduled in ${roomName} for this ${slotType.toUpperCase()} slot`
        );
        return;
      }

      // Convert PST times to UTC for storage
      const bookingData = {
        voice_actor_id: bookingForm.voiceActorId,
        voice_actor_id_2: bookingForm.voiceActorId2,
        director_id: bookingForm.directorId,
        room_id: bookingForm.roomId,
        date: selectedDate,
        am_start_time:
          slotType === 'am'
            ? pstToUTC(bookingForm.am_start_time) || null
            : null,
        am_end_time:
          slotType === 'am' ? pstToUTC(bookingForm.am_end_time) || null : null,
        pm_start_time:
          slotType === 'pm'
            ? pstToUTC(bookingForm.pm_start_time) || null
            : null,
        pm_end_time:
          slotType === 'pm' ? pstToUTC(bookingForm.pm_end_time) || null : null,
        notes: bookingForm.notes || null,
      };

      if (editingBooking) {
        // Update existing booking
        const updated = await updateBooking({
          id: editingBooking.id,
          ...bookingData,
        });
        setBookings((prev) =>
          prev.map((b) => (b.id === updated.id ? updated : b))
        );
      } else {
        // Create new booking
        const created = await createBooking(bookingData);
        setBookings((prev) => [...prev, created]);
      }

      // Reload schedule dates to include this date if it's new
      const dates = await getBookingDates();
      setScheduleDates(dates);

      setShowBookingForm(false);
      setEditingBooking(null);
      setEditingSlotType(null);
    } catch (e: any) {
      setError(e?.message ?? 'Failed to save booking');
    }
  };

  const handleDeleteBooking = async (id: string) => {
    if (!confirm('Delete this booking?')) return;
    try {
      await deleteBooking(id);
      setBookings((prev) => prev.filter((b) => b.id !== id));
      setShowBookingForm(false);
      setEditingBooking(null);
      setEditingSlotType(null);
      // Reload schedule dates
      const dates = await getBookingDates();
      setScheduleDates(dates);
    } catch (e: any) {
      setError(e?.message ?? 'Failed to delete booking');
    }
  };

  const handleSaveSchedule = async () => {
    if (!saveScheduleName.trim()) {
      setError('Please enter a name for this schedule');
      return;
    }
    setError(null);
    try {
      await createSavedSchedule({
        name: saveScheduleName.trim(),
        date: selectedDate,
        created_by: null,
      });
      setSaveScheduleName('');
      setShowSaveDialog(false);
      // Reload saved schedules
      const saved = await getSavedSchedules();
      setSavedSchedules(saved);
    } catch (e: any) {
      setError(e?.message ?? 'Failed to save schedule');
    }
  };

  const formatDate = (dateStr: string) => {
    // Parse date in PST timezone to avoid day shift issues
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
      'JAN',
      'FEB',
      'MAR',
      'APR',
      'MAY',
      'JUN',
      'JUL',
      'AUG',
      'SEP',
      'OCT',
      'NOV',
      'DEC',
    ];
    return `${months[date.getMonth()]} ${date.getDate()}, ${days[
      date.getDay()
    ].toUpperCase()}`;
  };

  const allRooms = useMemo(() => {
    const rooms: Array<{ room: Room; studio: Studio }> = [];
    studios.forEach((studio) => {
      const studioRooms = roomsByStudio[studio.id] || [];
      studioRooms.forEach((room) => {
        rooms.push({ room, studio });
      });
    });
    return rooms;
  }, [studios, roomsByStudio]);

  return (
    <div className="flex h-[calc(100vh-4rem)]">
      {/* Schedule History Sidebar */}
      <div
        className={`${
          showHistory ? 'w-64' : 'w-0'
        } transition-all duration-300 overflow-hidden border-r border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900`}
      >
        <div className="p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-zinc-900 dark:text-zinc-100">
              Past Schedules
            </h2>
            <button
              type="button"
              onClick={() => setShowHistory(false)}
              className="text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
            >
              ×
            </button>
          </div>
          <div className="space-y-4">
            <div>
              <h3 className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 mb-2 uppercase">
                Saved Schedules
              </h3>
              <div className="space-y-1 max-h-[calc(50vh-8rem)] overflow-y-auto">
                {savedSchedules.length === 0 ? (
                  <p className="text-sm text-zinc-500">No saved schedules</p>
                ) : (
                  savedSchedules.map((saved) => (
                    <div key={saved.id} className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedDate(saved.date);
                          setShowHistory(false);
                        }}
                        className={`flex-1 text-left px-3 py-2 rounded-md text-sm transition-colors ${
                          selectedDate === saved.date
                            ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900'
                            : 'hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300'
                        }`}
                      >
                        <div className="font-medium">{saved.name}</div>
                        <div className="text-xs opacity-75">
                          {formatDate(saved.date)}
                        </div>
                      </button>
                      <Link
                        href={`/schedule/${saved.id}/send-emails`}
                        className="px-2 py-1 text-xs rounded-md bg-blue-600 text-white hover:bg-blue-700 whitespace-nowrap"
                        onClick={(e) => e.stopPropagation()}
                      >
                        Send Emails
                      </Link>
                    </div>
                  ))
                )}
              </div>
            </div>
            <div>
              <h3 className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 mb-2 uppercase">
                All Dates
              </h3>
              <div className="space-y-1 max-h-[calc(50vh-8rem)] overflow-y-auto">
                {scheduleDates.length === 0 ? (
                  <p className="text-sm text-zinc-500">No past schedules</p>
                ) : (
                  scheduleDates.map((date) => (
                    <button
                      key={date}
                      type="button"
                      onClick={() => {
                        setSelectedDate(date);
                        setShowHistory(false);
                      }}
                      className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                        selectedDate === date
                          ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900'
                          : 'hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300'
                      }`}
                    >
                      {formatDate(date)}
                    </button>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => setShowHistory(!showHistory)}
              className="rounded-md border border-zinc-300 dark:border-zinc-700 px-3 py-2 text-sm hover:bg-zinc-50 dark:hover:bg-zinc-900"
            >
              {showHistory ? '← Hide' : '→ History'}
            </button>
            <div>
              <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100">
                Schedule
              </h1>
              <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
                {formatDate(selectedDate)}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => setShowSaveDialog(true)}
              className="rounded-md bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 px-4 py-2 text-sm font-medium hover:opacity-90"
            >
              Save Schedule
            </button>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 px-3 py-2 text-sm"
            />
            <button
              type="button"
              onClick={() => {
                setSelectedDate(getTodayPST());
              }}
              className="rounded-md border border-zinc-300 dark:border-zinc-700 px-3 py-2 text-sm"
            >
              Today
            </button>
          </div>
        </div>

        {showBookingForm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-zinc-950 rounded-lg border border-zinc-200 dark:border-zinc-800 p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <h2 className="text-lg font-semibold mb-4">
                {editingBooking ? 'Edit' : 'New'}{' '}
                {editingSlotType?.toUpperCase() || 'AM'} Booking
              </h2>
              <form onSubmit={handleSaveBooking} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Voice Actor 1
                    </label>
                    <select
                      value={bookingForm.voiceActorId}
                      onChange={(e) =>
                        setBookingForm((f) => ({
                          ...f,
                          voiceActorId: e.target.value,
                        }))
                      }
                      className="w-full rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 px-3 py-2"
                      required
                    >
                      <option value="">Select voice actor</option>
                      {voiceActors
                        .filter((va) => va.id !== bookingForm.voiceActorId2)
                        .map((va) => (
                          <option key={va.id} value={va.id}>
                            {va.name} {va.code ? `(${va.code})` : ''}
                          </option>
                        ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Voice Actor 2 <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={bookingForm.voiceActorId2}
                      onChange={(e) =>
                        setBookingForm((f) => ({
                          ...f,
                          voiceActorId2: e.target.value,
                        }))
                      }
                      className="w-full rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 px-3 py-2"
                      required
                    >
                      <option value="">Select voice actor</option>
                      {voiceActors
                        .filter((va) => va.id !== bookingForm.voiceActorId)
                        .map((va) => (
                          <option key={va.id} value={va.id}>
                            {va.name} {va.code ? `(${va.code})` : ''}
                          </option>
                        ))}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Director <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={bookingForm.directorId}
                    onChange={(e) =>
                      setBookingForm((f) => ({
                        ...f,
                        directorId: e.target.value,
                      }))
                    }
                    className="w-full rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 px-3 py-2"
                    required
                  >
                    <option value="">Select director</option>
                    {directors.map((dir) => (
                      <option key={dir.id} value={dir.id}>
                        {dir.name}
                      </option>
                    ))}
                  </select>
                </div>
                {editingSlotType === 'am' && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">
                        AM Start
                      </label>
                      <input
                        type="time"
                        value={bookingForm.am_start_time}
                        onChange={(e) =>
                          setBookingForm((f) => ({
                            ...f,
                            am_start_time: e.target.value,
                          }))
                        }
                        className="w-full rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 px-3 py-2"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">
                        AM End
                      </label>
                      <input
                        type="time"
                        value={bookingForm.am_end_time}
                        onChange={(e) =>
                          setBookingForm((f) => ({
                            ...f,
                            am_end_time: e.target.value,
                          }))
                        }
                        className="w-full rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 px-3 py-2"
                        required
                      />
                    </div>
                  </div>
                )}
                {editingSlotType === 'pm' && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">
                        PM Start
                      </label>
                      <input
                        type="time"
                        value={bookingForm.pm_start_time}
                        onChange={(e) =>
                          setBookingForm((f) => ({
                            ...f,
                            pm_start_time: e.target.value,
                          }))
                        }
                        className="w-full rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 px-3 py-2"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">
                        PM End
                      </label>
                      <input
                        type="time"
                        value={bookingForm.pm_end_time}
                        onChange={(e) =>
                          setBookingForm((f) => ({
                            ...f,
                            pm_end_time: e.target.value,
                          }))
                        }
                        className="w-full rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 px-3 py-2"
                        required
                      />
                    </div>
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Notes
                  </label>
                  <textarea
                    value={bookingForm.notes}
                    onChange={(e) =>
                      setBookingForm((f) => ({ ...f, notes: e.target.value }))
                    }
                    className="w-full rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 px-3 py-2"
                    rows={3}
                  />
                </div>
                <div className="flex gap-3">
                  <button
                    type="submit"
                    className="rounded-md bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 px-4 py-2 text-sm font-medium"
                  >
                    Save
                  </button>
                  {editingBooking && (
                    <button
                      type="button"
                      onClick={() => handleDeleteBooking(editingBooking.id)}
                      className="rounded-md border border-red-300 text-red-600 px-4 py-2 text-sm"
                    >
                      Delete
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      setShowBookingForm(false);
                      setEditingBooking(null);
                      setEditingSlotType(null);
                    }}
                    className="rounded-md border border-zinc-300 dark:border-zinc-700 px-4 py-2 text-sm"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {showSaveDialog && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-zinc-950 rounded-lg border border-zinc-200 dark:border-zinc-800 p-6 max-w-md w-full">
              <h2 className="text-lg font-semibold mb-4">Save Schedule</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Schedule Name
                  </label>
                  <input
                    type="text"
                    value={saveScheduleName}
                    onChange={(e) => setSaveScheduleName(e.target.value)}
                    placeholder="e.g., November 16 Schedule"
                    className="w-full rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 px-3 py-2"
                    autoFocus
                  />
                </div>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={handleSaveSchedule}
                    className="rounded-md bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 px-4 py-2 text-sm font-medium"
                  >
                    Save
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowSaveDialog(false);
                      setSaveScheduleName('');
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

        {error && (
          <div className="rounded-md bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-3 text-sm text-red-600 dark:text-red-400">
            {error}
          </div>
        )}

        {loading ? (
          <p className="text-sm text-zinc-600 dark:text-zinc-400">Loading…</p>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-800">
            <table className="min-w-full text-sm">
              <thead className="bg-zinc-50 dark:bg-zinc-900 sticky top-0">
                <tr>
                  <th className="px-3 py-2 text-left font-medium border-r border-zinc-200 dark:border-zinc-800 sticky left-0 bg-zinc-50 dark:bg-zinc-900 z-10">
                    Studio
                  </th>
                  <th
                    colSpan={3}
                    className="px-3 py-2 text-center font-medium border-r border-zinc-200 dark:border-zinc-800"
                  ></th>
                  <th className="px-3 py-2 text-left font-medium border-r border-zinc-200 dark:border-zinc-800">
                    #
                  </th>
                  <th
                    className="px-3 py-2 text-center font-medium border-r border-zinc-200 dark:border-zinc-800"
                    colSpan={5}
                  >
                    AM Slot (9AM - 5:30PM PST)
                  </th>
                  <th className="px-3 py-2 text-center font-medium" colSpan={5}>
                    PM Slot (5:30PM - 2:00AM PST)
                  </th>
                </tr>
                <tr>
                  <th className="px-3 py-2 text-left font-medium border-r border-zinc-200 dark:border-zinc-800 sticky left-0 bg-zinc-50 dark:bg-zinc-900 z-10"></th>
                  <th
                    colSpan={3}
                    className="px-3 py-2 text-left font-medium border-r border-zinc-200 dark:border-zinc-800"
                  ></th>
                  <th className="px-3 py-2 text-left font-medium border-r border-zinc-200 dark:border-zinc-800"></th>
                  {/* AM Slot */}
                  <th className="px-3 py-2 text-left font-medium border-r border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-800">
                    Time
                  </th>
                  <th className="px-3 py-2 text-left font-medium border-r border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-800">
                    Name
                  </th>
                  <th className="px-3 py-2 text-left font-medium border-r border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-800">
                    ID
                  </th>
                  <th className="px-3 py-2 text-left font-medium border-r border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-800">
                    Email
                  </th>
                  <th className="px-3 py-2 text-left font-medium border-r border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-800">
                    Phone
                  </th>
                  {/* PM Slot */}
                  <th className="px-3 py-2 text-left font-medium border-r border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-800">
                    Time
                  </th>
                  <th className="px-3 py-2 text-left font-medium border-r border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-800">
                    Name
                  </th>
                  <th className="px-3 py-2 text-left font-medium border-r border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-800">
                    ID
                  </th>
                  <th className="px-3 py-2 text-left font-medium border-r border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-800">
                    Email
                  </th>
                  <th className="px-3 py-2 text-left font-medium">Phone</th>
                </tr>
              </thead>
              <tbody>
                {allRooms.map(({ room, studio }) => {
                  const amBooking = getBookingForRoom(room.id, 'am');
                  const pmBooking = getBookingForRoom(room.id, 'pm');
                  const amVA1 = amBooking
                    ? getVoiceActorById(amBooking.voice_actor_id)
                    : null;
                  const amVA2 = amBooking?.voice_actor_id_2
                    ? getVoiceActorById(amBooking.voice_actor_id_2)
                    : null;
                  const amDirector = amBooking
                    ? getDirectorById(amBooking.director_id)
                    : null;
                  const pmVA1 = pmBooking
                    ? getVoiceActorById(pmBooking.voice_actor_id)
                    : null;
                  const pmVA2 = pmBooking?.voice_actor_id_2
                    ? getVoiceActorById(pmBooking.voice_actor_id_2)
                    : null;
                  const pmDirector = pmBooking
                    ? getDirectorById(pmBooking.director_id)
                    : null;

                  // Convert UTC times to PST for display
                  const amTimeDisplay =
                    amBooking &&
                    amBooking.am_start_time &&
                    amBooking.am_end_time
                      ? `${utcToPST(amBooking.am_start_time)} - ${utcToPST(
                          amBooking.am_end_time
                        )}`
                      : null;
                  const pmTimeDisplay =
                    pmBooking &&
                    pmBooking.pm_start_time &&
                    pmBooking.pm_end_time
                      ? `${utcToPST(pmBooking.pm_start_time)} - ${utcToPST(
                          pmBooking.pm_end_time
                        )}`
                      : null;

                  return (
                    <React.Fragment key={room.id}>
                      {/* Row 1: Voice Actor 1 */}
                      <tr
                        key={`${room.id}-va1`}
                        className="border-t border-zinc-200 dark:border-zinc-800"
                      >
                        <td
                          rowSpan={3}
                          className="px-3 py-2 border-r border-zinc-200 dark:border-zinc-800 sticky left-0 bg-white dark:bg-zinc-950 z-10 font-medium align-top"
                        >
                          {studio.name} {room.name || ''}
                        </td>
                        <td
                          colSpan={3}
                          className="px-3 py-2 border-r border-zinc-200 dark:border-zinc-800 text-center"
                        >
                          VA1
                        </td>
                        <td
                          rowSpan={3}
                          className="px-3 py-2 border-r border-zinc-200 dark:border-zinc-800 align-top"
                        >
                          {room.room_number || '-'}
                        </td>
                        {/* AM Slot - Voice Actor 1 */}
                        <td
                          className="px-3 py-2 border-r border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900 cursor-pointer bg-zinc-50 dark:bg-zinc-900"
                          onClick={() => handleSlotClick(room.id, 'am')}
                        >
                          {amTimeDisplay || (
                            <span className="text-zinc-400">Click to add</span>
                          )}
                        </td>
                        <td
                          className="px-3 py-2 border-r border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900 cursor-pointer bg-zinc-50 dark:bg-zinc-900"
                          onClick={() => handleSlotClick(room.id, 'am')}
                        >
                          {amVA1?.name || '-'}
                        </td>
                        <td
                          className="px-3 py-2 border-r border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900 cursor-pointer bg-zinc-50 dark:bg-zinc-900"
                          onClick={() => handleSlotClick(room.id, 'am')}
                        >
                          {amVA1?.code || (amVA1 ? amVA1.id.slice(0, 8) : '-')}
                        </td>
                        <td
                          className="px-3 py-2 border-r border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900 cursor-pointer bg-zinc-50 dark:bg-zinc-900"
                          onClick={() => handleSlotClick(room.id, 'am')}
                        >
                          {amVA1?.email || '-'}
                        </td>
                        <td
                          className="px-3 py-2 border-r border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900 cursor-pointer bg-zinc-50 dark:bg-zinc-900"
                          onClick={() => handleSlotClick(room.id, 'am')}
                        >
                          {amVA1?.phone || '-'}
                        </td>
                        {/* PM Slot - Voice Actor 1 */}
                        <td
                          className="px-3 py-2 border-r border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900 cursor-pointer bg-zinc-50 dark:bg-zinc-900"
                          onClick={() => handleSlotClick(room.id, 'pm')}
                        >
                          {pmTimeDisplay || (
                            <span className="text-zinc-400">Click to add</span>
                          )}
                        </td>
                        <td
                          className="px-3 py-2 border-r border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900 cursor-pointer bg-zinc-50 dark:bg-zinc-900"
                          onClick={() => handleSlotClick(room.id, 'pm')}
                        >
                          {pmVA1?.name || '-'}
                        </td>
                        <td
                          className="px-3 py-2 border-r border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900 cursor-pointer bg-zinc-50 dark:bg-zinc-900"
                          onClick={() => handleSlotClick(room.id, 'pm')}
                        >
                          {pmVA1?.code || (pmVA1 ? pmVA1.id.slice(0, 8) : '-')}
                        </td>
                        <td
                          className="px-3 py-2 border-r border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900 cursor-pointer bg-zinc-50 dark:bg-zinc-900"
                          onClick={() => handleSlotClick(room.id, 'pm')}
                        >
                          {pmVA1?.email || '-'}
                        </td>
                        <td
                          className="px-3 py-2 hover:bg-zinc-50 dark:hover:bg-zinc-900 cursor-pointer bg-zinc-50 dark:bg-zinc-900"
                          onClick={() => handleSlotClick(room.id, 'pm')}
                        >
                          {pmVA1?.phone || '-'}
                        </td>
                      </tr>
                      {/* Row 2: Voice Actor 2 */}
                      <tr
                        key={`${room.id}-va2`}
                        className="border-t border-zinc-200 dark:border-zinc-800"
                      >
                        <td
                          colSpan={3}
                          className="px-3 py-2 border-r border-zinc-200 dark:border-zinc-800 text-center"
                        >
                          VA2
                        </td>
                        {/* AM Slot - Voice Actor 2 */}
                        <td
                          className="px-3 py-2 border-r border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900 cursor-pointer bg-zinc-50 dark:bg-zinc-900"
                          onClick={() => handleSlotClick(room.id, 'am')}
                        >
                          {amTimeDisplay || (
                            <span className="text-zinc-400">Click to add</span>
                          )}
                        </td>
                        <td
                          className="px-3 py-2 border-r border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900 cursor-pointer"
                          onClick={() => handleSlotClick(room.id, 'am')}
                        >
                          {amVA2?.name || '-'}
                        </td>
                        <td
                          className="px-3 py-2 border-r border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900 cursor-pointer"
                          onClick={() => handleSlotClick(room.id, 'am')}
                        >
                          {amVA2?.code || (amVA2 ? amVA2.id.slice(0, 8) : '-')}
                        </td>
                        <td
                          className="px-3 py-2 border-r border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900 cursor-pointer"
                          onClick={() => handleSlotClick(room.id, 'am')}
                        >
                          {amVA2?.email || '-'}
                        </td>
                        <td
                          className="px-3 py-2 border-r border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900 cursor-pointer"
                          onClick={() => handleSlotClick(room.id, 'am')}
                        >
                          {amVA2?.phone || '-'}
                        </td>
                        {/* PM Slot - Voice Actor 2 */}
                        <td
                          className="px-3 py-2 border-r border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900 cursor-pointer bg-zinc-50 dark:bg-zinc-900"
                          onClick={() => handleSlotClick(room.id, 'pm')}
                        >
                          {pmTimeDisplay || (
                            <span className="text-zinc-400">Click to add</span>
                          )}
                        </td>
                        <td
                          className="px-3 py-2 border-r border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900 cursor-pointer"
                          onClick={() => handleSlotClick(room.id, 'pm')}
                        >
                          {pmVA2?.name || '-'}
                        </td>
                        <td
                          className="px-3 py-2 border-r border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900 cursor-pointer"
                          onClick={() => handleSlotClick(room.id, 'pm')}
                        >
                          {pmVA2?.code || (pmVA2 ? pmVA2.id.slice(0, 8) : '-')}
                        </td>
                        <td
                          className="px-3 py-2 border-r border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900 cursor-pointer"
                          onClick={() => handleSlotClick(room.id, 'pm')}
                        >
                          {pmVA2?.email || '-'}
                        </td>
                        <td
                          className="px-3 py-2 hover:bg-zinc-50 dark:hover:bg-zinc-900 cursor-pointer"
                          onClick={() => handleSlotClick(room.id, 'pm')}
                        >
                          {pmVA2?.phone || '-'}
                        </td>
                      </tr>
                      {/* Row 3: Director */}
                      <tr
                        key={`${room.id}-dir`}
                        className="border-t border-zinc-200 dark:border-zinc-800"
                      >
                        <td
                          colSpan={3}
                          className="px-3 py-2 border-r border-zinc-200 dark:border-zinc-800 text-center"
                        >
                          Director
                        </td>
                        {/* AM Slot - Director */}
                        <td
                          className="px-3 py-2 border-r border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900 cursor-pointer bg-zinc-50 dark:bg-zinc-900"
                          onClick={() => handleSlotClick(room.id, 'am')}
                        >
                          {amTimeDisplay || (
                            <span className="text-zinc-400">Click to add</span>
                          )}
                        </td>
                        <td
                          className="px-3 py-2 border-r border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900 cursor-pointer"
                          onClick={() => handleSlotClick(room.id, 'am')}
                        >
                          {amDirector?.name || '-'}
                        </td>
                        <td className="px-3 py-2 border-r border-zinc-200 dark:border-zinc-800">
                          -
                        </td>
                        <td
                          className="px-3 py-2 border-r border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900 cursor-pointer"
                          onClick={() => handleSlotClick(room.id, 'am')}
                        >
                          {amDirector?.email || '-'}
                        </td>
                        <td
                          className="px-3 py-2 border-r border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900 cursor-pointer"
                          onClick={() => handleSlotClick(room.id, 'am')}
                        >
                          {amDirector?.phone || '-'}
                        </td>
                        {/* PM Slot - Director */}
                        <td
                          className="px-3 py-2 border-r border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900 cursor-pointer bg-zinc-50 dark:bg-zinc-900"
                          onClick={() => handleSlotClick(room.id, 'pm')}
                        >
                          {pmTimeDisplay || (
                            <span className="text-zinc-400">Click to add</span>
                          )}
                        </td>
                        <td
                          className="px-3 py-2 border-r border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900 cursor-pointer"
                          onClick={() => handleSlotClick(room.id, 'pm')}
                        >
                          {pmDirector?.name || '-'}
                        </td>
                        <td className="px-3 py-2 border-r border-zinc-200 dark:border-zinc-800">
                          -
                        </td>
                        <td
                          className="px-3 py-2 border-r border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900 cursor-pointer"
                          onClick={() => handleSlotClick(room.id, 'pm')}
                        >
                          {pmDirector?.email || '-'}
                        </td>
                        <td
                          className="px-3 py-2 hover:bg-zinc-50 dark:hover:bg-zinc-900 cursor-pointer"
                          onClick={() => handleSlotClick(room.id, 'pm')}
                        >
                          {pmDirector?.phone || '-'}
                        </td>
                      </tr>
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
