/**
 * Scale a normalized 24-hour profile to 8760 hourly values for an entire year.
 * @param normalized24h - 24 values summing to ~1.0 (normalized daily profile)
 * @param annualMwh - total annual consumption in MWh
 * @param workingDays - optional array of working days ["lun","mar",...] (default: all days)
 * @returns 8760 hourly values in MWh
 */
export function scaleProfile(
  normalized24h: number[],
  annualMwh: number,
  workingDays?: string[] | null,
): number[] {
  if (normalized24h.length !== 24) {
    throw new Error("Il profilo giornaliero deve avere esattamente 24 valori");
  }

  const dayNames = ["dom", "lun", "mar", "mer", "gio", "ven", "sab"];
  const activeDays = workingDays ?? dayNames;
  const activeDaySet = new Set(activeDays.map((d) => d.toLowerCase()));

  // Count active hours in the year
  const hoursPerYear = 8760;
  const profile = new Array<number>(hoursPerYear);
  let totalWeight = 0;

  // Jan 1, 2024 is a Monday (day index 1)
  for (let h = 0; h < hoursPerYear; h++) {
    const dayOfYear = Math.floor(h / 24);
    const hourOfDay = h % 24;
    const dayOfWeek = (1 + dayOfYear) % 7; // 0=dom, 1=lun, ...
    const dayName = dayNames[dayOfWeek];
    const isActive = activeDaySet.has(dayName);

    const weight = isActive ? normalized24h[hourOfDay] : 0;
    profile[h] = weight;
    totalWeight += weight;
  }

  // Scale so total equals annualMwh
  if (totalWeight > 0) {
    const scale = annualMwh / totalWeight;
    for (let h = 0; h < hoursPerYear; h++) {
      profile[h] *= scale;
    }
  }

  return profile;
}

/**
 * Aggregate an 8760 profile into a 24-hour average daily profile.
 */
export function to24hProfile(hourly8760: number[]): number[] {
  const daily = new Array<number>(24).fill(0);
  const counts = new Array<number>(24).fill(0);

  for (let h = 0; h < hourly8760.length; h++) {
    const hour = h % 24;
    daily[hour] += hourly8760[h];
    counts[hour]++;
  }

  return daily.map((sum, i) => (counts[i] > 0 ? sum / counts[i] : 0));
}
