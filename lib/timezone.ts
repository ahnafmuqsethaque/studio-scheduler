/**
 * Convert UTC time string to PST/PDT
 * PST = UTC-8, PDT = UTC-7 (daylight saving)
 */
export function utcToPST(utcTime: string | null): string | null {
  if (!utcTime) return null;

  // Parse the time string (HH:MM format)
  const [hours, minutes] = utcTime.split(':').map(Number);
  if (isNaN(hours) || isNaN(minutes)) return utcTime;

  // Create a date object for today in UTC
  const now = new Date();
  const utcDate = new Date(
    Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate(),
      hours,
      minutes
    )
  );

  // Check if we're in daylight saving time (roughly March-November)
  // PST is UTC-8, PDT is UTC-7
  const isDST = isDaylightSavingTime(utcDate);
  const offsetHours = isDST ? 7 : 8;

  // Convert to PST/PDT
  const pstDate = new Date(utcDate.getTime() - offsetHours * 60 * 60 * 1000);

  // Format back to HH:MM
  const pstHours = pstDate.getUTCHours().toString().padStart(2, '0');
  const pstMinutes = pstDate.getUTCMinutes().toString().padStart(2, '0');
  return `${pstHours}:${pstMinutes}`;
}

/**
 * Convert PST/PDT time string to UTC
 */
export function pstToUTC(pstTime: string | null): string | null {
  if (!pstTime) return null;

  const [hours, minutes] = pstTime.split(':').map(Number);
  if (isNaN(hours) || isNaN(minutes)) return pstTime;

  const now = new Date();
  const pstDate = new Date(
    Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate(),
      hours,
      minutes
    )
  );

  const isDST = isDaylightSavingTime(pstDate);
  const offsetHours = isDST ? 7 : 8;

  const utcDate = new Date(pstDate.getTime() + offsetHours * 60 * 60 * 1000);

  const utcHours = utcDate.getUTCHours().toString().padStart(2, '0');
  const utcMinutes = utcDate.getUTCMinutes().toString().padStart(2, '0');
  return `${utcHours}:${utcMinutes}`;
}

/**
 * Check if a date is in daylight saving time (PDT)
 * DST in US: Second Sunday in March to First Sunday in November
 */
function isDaylightSavingTime(date: Date): boolean {
  const year = date.getUTCFullYear();
  const month = date.getUTCMonth();

  // Definitely PST (November - February)
  if (month >= 10 || month <= 1) return false;
  // Definitely PDT (April - September)
  if (month >= 3 && month <= 8) return true;

  // March: Check if after second Sunday
  if (month === 2) {
    const secondSunday = getNthSunday(year, 3, 2);
    return date.getUTCDate() >= secondSunday;
  }

  // November: Check if before first Sunday
  if (month === 9) {
    const firstSunday = getNthSunday(year, 11, 1);
    return date.getUTCDate() < firstSunday;
  }

  return false;
}

function getNthSunday(year: number, month: number, n: number): number {
  let count = 0;
  for (let day = 1; day <= 14; day++) {
    const date = new Date(year, month - 1, day);
    if (date.getDay() === 0) {
      count++;
      if (count === n) return day;
    }
  }
  return 1;
}

/**
 * Get today's date in PST/PDT as YYYY-MM-DD string
 */
export function getTodayPST(): string {
  const now = new Date();

  // Format date in PST timezone using Intl API
  // en-CA locale gives us YYYY-MM-DD format
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Los_Angeles',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });

  return formatter.format(now);
}
