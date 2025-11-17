import { supabase } from '@/lib/supabaseClient';

export type Studio = {
  id: string;
  name: string;
  address: string | null;
  notes: string | null;
  am_start_time: string | null;
  am_end_time: string | null;
  pm_start_time: string | null;
  pm_end_time: string | null;
  created_at: string;
  updated_at: string | null;
};

export type Room = {
  id: string;
  studio_id: string;
  name: string | null;
  room_number: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string | null;
};

export type VoiceActor = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  code: string | null;
  dietary_notes: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string | null;
};

export type Director = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string | null;
};

export type DirectorWeeklyAvailability = {
  id: string;
  director_id: string;
  day_of_week: number;
  am_start_time: string | null;
  am_end_time: string | null;
  pm_start_time: string | null;
  pm_end_time: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string | null;
};

export type DirectorDateOverride = {
  id: string;
  director_id: string;
  date: string;
  override_type: string | null;
  am_start_time: string | null;
  am_end_time: string | null;
  pm_start_time: string | null;
  pm_end_time: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string | null;
};

export type EmailLog = {
  id: string;
  voice_actor_id: string | null;
  email: string;
  subject: string;
  sent_at: string;
  success: boolean;
  error_message: string | null;
  created_at: string;
};

export type Booking = {
  id: string;
  voice_actor_id: string;
  voice_actor_id_2: string; // Required, not optional
  director_id: string; // Required
  room_id: string;
  date: string;
  am_start_time: string | null;
  am_end_time: string | null;
  pm_start_time: string | null;
  pm_end_time: string | null;
  notes: string | null;
  am_emails_sent: boolean;
  pm_emails_sent: boolean;
  created_at: string;
  updated_at: string | null;
};

export type SavedSchedule = {
  id: string;
  name: string;
  date: string;
  created_at: string;
  created_by: string | null;
};

// Insert/Update helper types
export type StudioInsert = Omit<Studio, 'id' | 'created_at' | 'updated_at'>;
export type StudioUpdate = Partial<
  Omit<Studio, 'created_at' | 'updated_at'>
> & { id: string };

export type RoomInsert = Omit<Room, 'id' | 'created_at' | 'updated_at'>;
export type RoomUpdate = Partial<Omit<Room, 'created_at' | 'updated_at'>> & {
  id: string;
};

export type VoiceActorInsert = Omit<
  VoiceActor,
  'id' | 'created_at' | 'updated_at'
>;
export type VoiceActorUpdate = Partial<
  Omit<VoiceActor, 'created_at' | 'updated_at'>
> & { id: string };

export type DirectorInsert = Omit<Director, 'id' | 'created_at' | 'updated_at'>;
export type DirectorUpdate = Partial<
  Omit<Director, 'created_at' | 'updated_at'>
> & { id: string };

export type DirectorWeeklyAvailabilityInsert = Omit<
  DirectorWeeklyAvailability,
  'id' | 'created_at' | 'updated_at'
>;
export type DirectorWeeklyAvailabilityUpdate = Partial<
  Omit<DirectorWeeklyAvailability, 'created_at' | 'updated_at'>
> & { id: string };

export type DirectorDateOverrideInsert = Omit<
  DirectorDateOverride,
  'id' | 'created_at' | 'updated_at'
>;
export type DirectorDateOverrideUpdate = Partial<
  Omit<DirectorDateOverride, 'created_at' | 'updated_at'>
> & { id: string };

export type BookingInsert = Omit<
  Booking,
  'id' | 'created_at' | 'updated_at' | 'am_emails_sent' | 'pm_emails_sent'
> & {
  am_emails_sent?: boolean;
  pm_emails_sent?: boolean;
};
export type BookingUpdate = Partial<
  Omit<Booking, 'created_at' | 'updated_at'>
> & { id: string };

export type SavedScheduleInsert = Omit<SavedSchedule, 'id' | 'created_at'> & {
  created_by?: string | null;
};
export type SavedScheduleUpdate = Partial<Omit<SavedSchedule, 'created_at'>> & {
  id: string;
};

// Studios
export async function getStudios(): Promise<Studio[]> {
  const { data, error } = await supabase
    .from('studios')
    .select('*')
    .order('name', { ascending: true });
  if (error) throw error;
  return data as Studio[];
}

export async function getStudioById(id: string): Promise<Studio | null> {
  const { data, error } = await supabase
    .from('studios')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  return data as Studio | null;
}

export async function createStudio(values: StudioInsert): Promise<Studio> {
  const { data, error } = await supabase
    .from('studios')
    .insert(values)
    .select('*')
    .single();
  if (error) throw error;
  return data as Studio;
}

export async function updateStudio(values: StudioUpdate): Promise<Studio> {
  const { id, ...updates } = values;
  const { data, error } = await supabase
    .from('studios')
    .update(updates)
    .eq('id', id)
    .select('*')
    .single();
  if (error) throw error;
  return data as Studio;
}

export async function deleteStudio(id: string): Promise<void> {
  const { error } = await supabase.from('studios').delete().eq('id', id);
  if (error) throw error;
}

// Rooms
export async function getRoomsByStudio(studioId: string): Promise<Room[]> {
  const { data, error } = await supabase
    .from('rooms')
    .select('*')
    .eq('studio_id', studioId)
    .order('name', { ascending: true });
  if (error) throw error;
  return data as Room[];
}

export async function createRoom(values: RoomInsert): Promise<Room> {
  const { data, error } = await supabase
    .from('rooms')
    .insert(values)
    .select('*')
    .single();
  if (error) throw error;
  return data as Room;
}

export async function updateRoom(values: RoomUpdate): Promise<Room> {
  const { id, ...updates } = values;
  const { data, error } = await supabase
    .from('rooms')
    .update(updates)
    .eq('id', id)
    .select('*')
    .single();
  if (error) throw error;
  return data as Room;
}

export async function deleteRoom(id: string): Promise<void> {
  const { error } = await supabase.from('rooms').delete().eq('id', id);
  if (error) throw error;
}

// Voice Actors
export async function getVoiceActors(): Promise<VoiceActor[]> {
  const { data, error } = await supabase
    .from('voice_actors')
    .select('*')
    .order('name', { ascending: true });
  if (error) throw error;
  return data as VoiceActor[];
}

export async function createVoiceActor(
  values: VoiceActorInsert
): Promise<VoiceActor> {
  const { data, error } = await supabase
    .from('voice_actors')
    .insert(values)
    .select('*')
    .single();
  if (error) throw error;
  return data as VoiceActor;
}

export async function updateVoiceActor(
  values: VoiceActorUpdate
): Promise<VoiceActor> {
  const { id, ...updates } = values;
  const { data, error } = await supabase
    .from('voice_actors')
    .update(updates)
    .eq('id', id)
    .select('*')
    .single();
  if (error) throw error;
  return data as VoiceActor;
}

export async function deleteVoiceActor(id: string): Promise<void> {
  const { error } = await supabase.from('voice_actors').delete().eq('id', id);
  if (error) throw error;
}

// Directors
export async function getDirectors(): Promise<Director[]> {
  const { data, error } = await supabase
    .from('directors')
    .select('*')
    .order('name', { ascending: true });
  if (error) throw error;
  return data as Director[];
}

export async function getDirectorById(id: string): Promise<Director | null> {
  const { data, error } = await supabase
    .from('directors')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  return data as Director | null;
}

export async function createDirector(
  values: DirectorInsert
): Promise<Director> {
  const { data, error } = await supabase
    .from('directors')
    .insert(values)
    .select('*')
    .single();
  if (error) throw error;
  return data as Director;
}

export async function updateDirector(
  values: DirectorUpdate
): Promise<Director> {
  const { id, ...updates } = values;
  const { data, error } = await supabase
    .from('directors')
    .update(updates)
    .eq('id', id)
    .select('*')
    .single();
  if (error) throw error;
  return data as Director;
}

export async function deleteDirector(id: string): Promise<void> {
  const { error } = await supabase.from('directors').delete().eq('id', id);
  if (error) throw error;
}

// Director Weekly Availability
export async function getDirectorWeeklyAvailability(
  directorId: string
): Promise<DirectorWeeklyAvailability[]> {
  const { data, error } = await supabase
    .from('director_weekly_availability')
    .select('*')
    .eq('director_id', directorId)
    .order('day_of_week', { ascending: true });
  if (error) throw error;
  return data as DirectorWeeklyAvailability[];
}

export async function upsertDirectorWeeklyAvailability(
  values: DirectorWeeklyAvailabilityInsert
): Promise<DirectorWeeklyAvailability> {
  // Check if exists
  const existing = await supabase
    .from('director_weekly_availability')
    .select('*')
    .eq('director_id', values.director_id)
    .eq('day_of_week', values.day_of_week)
    .maybeSingle();

  if (existing.data) {
    // Update
    const { data, error } = await supabase
      .from('director_weekly_availability')
      .update(values)
      .eq('id', existing.data.id)
      .select('*')
      .single();
    if (error) throw error;
    return data as DirectorWeeklyAvailability;
  } else {
    // Insert
    const { data, error } = await supabase
      .from('director_weekly_availability')
      .insert(values)
      .select('*')
      .single();
    if (error) throw error;
    return data as DirectorWeeklyAvailability;
  }
}

export async function deleteDirectorWeeklyAvailability(
  id: string
): Promise<void> {
  const { error } = await supabase
    .from('director_weekly_availability')
    .delete()
    .eq('id', id);
  if (error) throw error;
}

// Director Date Overrides
export async function getDirectorDateOverrides(
  directorId: string
): Promise<DirectorDateOverride[]> {
  const { data, error } = await supabase
    .from('director_date_overrides')
    .select('*')
    .eq('director_id', directorId)
    .order('date', { ascending: true });
  if (error) throw error;
  return data as DirectorDateOverride[];
}

export async function createDirectorDateOverride(
  values: DirectorDateOverrideInsert
): Promise<DirectorDateOverride> {
  const { data, error } = await supabase
    .from('director_date_overrides')
    .insert(values)
    .select('*')
    .single();
  if (error) throw error;
  return data as DirectorDateOverride;
}

export async function updateDirectorDateOverride(
  values: DirectorDateOverrideUpdate
): Promise<DirectorDateOverride> {
  const { id, ...updates } = values;
  const { data, error } = await supabase
    .from('director_date_overrides')
    .update(updates)
    .eq('id', id)
    .select('*')
    .single();
  if (error) throw error;
  return data as DirectorDateOverride;
}

export async function deleteDirectorDateOverride(id: string): Promise<void> {
  const { error } = await supabase
    .from('director_date_overrides')
    .delete()
    .eq('id', id);
  if (error) throw error;
}

// Email Logs
export async function logEmailSend(
  values: Omit<EmailLog, 'id' | 'created_at'>
): Promise<EmailLog> {
  const { data, error } = await supabase
    .from('email_logs')
    .insert({
      ...values,
      sent_at: new Date().toISOString(),
    })
    .select('*')
    .single();
  if (error) throw error;
  return data as EmailLog;
}

export async function getEmailLogsBySubject(
  subject: string
): Promise<EmailLog[]> {
  const { data, error } = await supabase
    .from('email_logs')
    .select('*')
    .eq('subject', subject)
    .eq('success', true)
    .order('sent_at', { ascending: false });
  if (error) throw error;
  return data as EmailLog[];
}

export async function getEmailLogsByEmails(
  emails: string[]
): Promise<EmailLog[]> {
  if (emails.length === 0) return [];
  const { data, error } = await supabase
    .from('email_logs')
    .select('*')
    .in('email', emails)
    .eq('success', true)
    .order('sent_at', { ascending: false });
  if (error) throw error;
  return data as EmailLog[];
}

// Bookings
export async function getBookingsByDate(date: string): Promise<Booking[]> {
  const { data, error } = await supabase
    .from('bookings')
    .select('*')
    .eq('date', date)
    .order('room_id', { ascending: true });
  if (error) throw error;
  return data as Booking[];
}

export async function getBookingDates(): Promise<string[]> {
  const { data, error } = await supabase
    .from('bookings')
    .select('date')
    .order('date', { ascending: false });
  if (error) throw error;
  // Get unique dates
  const uniqueDates = Array.from(
    new Set((data as Array<{ date: string }>).map((b) => b.date))
  ).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
  return uniqueDates as string[];
}

export async function getBookingsByRoomAndDate(
  roomId: string,
  date: string
): Promise<Booking[]> {
  const { data, error } = await supabase
    .from('bookings')
    .select('*')
    .eq('room_id', roomId)
    .eq('date', date);
  if (error) throw error;
  return data as Booking[];
}

/**
 * Check if a voice actor is already scheduled in another room for the same date and slot
 * Returns conflicting booking if found, null otherwise
 */
export async function getVoiceActorConflict(
  voiceActorId: string,
  date: string,
  slotType: 'am' | 'pm',
  excludeBookingId?: string,
  excludeRoomId?: string
): Promise<Booking | null> {
  const { data, error } = await supabase
    .from('bookings')
    .select('*')
    .eq('date', date)
    .or(
      `voice_actor_id.eq.${voiceActorId},voice_actor_id_2.eq.${voiceActorId}`
    );

  if (error) throw error;

  // Filter by slot type and exclude the current booking/room if editing
  const conflicts = (data as Booking[]).filter((booking) => {
    if (excludeBookingId && booking.id === excludeBookingId) return false;
    if (excludeRoomId && booking.room_id === excludeRoomId) return false;

    if (slotType === 'am') {
      return booking.am_start_time !== null && booking.am_end_time !== null;
    } else {
      return booking.pm_start_time !== null && booking.pm_end_time !== null;
    }
  });

  return conflicts.length > 0 ? conflicts[0] : null;
}

export async function createBooking(values: BookingInsert): Promise<Booking> {
  const payload: BookingInsert = {
    am_emails_sent: false,
    pm_emails_sent: false,
    ...values,
  };
  const { data, error } = await supabase
    .from('bookings')
    .insert(payload)
    .select('*')
    .single();
  if (error) throw error;
  return data as Booking;
}

export async function updateBooking(values: BookingUpdate): Promise<Booking> {
  const { id, ...updates } = values;
  const { data, error } = await supabase
    .from('bookings')
    .update(updates)
    .eq('id', id)
    .select('*')
    .single();
  if (error) throw error;
  return data as Booking;
}

export async function deleteBooking(id: string): Promise<void> {
  const { error } = await supabase.from('bookings').delete().eq('id', id);
  if (error) throw error;
}

export async function markBookingEmailsSent(
  bookingId: string,
  slotType: 'am' | 'pm',
  sent: boolean
): Promise<void> {
  const column = slotType === 'am' ? 'am_emails_sent' : 'pm_emails_sent';
  const { error } = await supabase
    .from('bookings')
    .update({ [column]: sent, updated_at: new Date().toISOString() })
    .eq('id', bookingId);
  if (error) throw error;
}

// Saved Schedules
export async function getSavedSchedules(): Promise<SavedSchedule[]> {
  const { data, error } = await supabase
    .from('saved_schedules')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data as SavedSchedule[];
}

export async function getSavedScheduleById(
  id: string
): Promise<SavedSchedule | null> {
  const { data, error } = await supabase
    .from('saved_schedules')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  return data as SavedSchedule | null;
}

export async function createSavedSchedule(
  values: SavedScheduleInsert
): Promise<SavedSchedule> {
  const { data, error } = await supabase
    .from('saved_schedules')
    .insert(values)
    .select('*')
    .single();
  if (error) throw error;
  return data as SavedSchedule;
}

export async function deleteSavedSchedule(id: string): Promise<void> {
  const { error } = await supabase
    .from('saved_schedules')
    .delete()
    .eq('id', id);
  if (error) throw error;
}

export * as db from './db';
