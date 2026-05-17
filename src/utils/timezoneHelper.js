/**
 * Returns the local date string (YYYY-MM-DD) for a given Date in a specific IANA timezone.
 */
function getLocalDateString(date, timezone = "UTC") {
  try {
    const formatter = new Intl.DateTimeFormat("en-US", {
      timeZone: timezone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
    const parts = formatter.formatToParts(new Date(date));
    const year = parts.find(p => p.type === "year").value;
    const month = parts.find(p => p.type === "month").value;
    const day = parts.find(p => p.type === "day").value;
    return `${year}-${month}-${day}`;
  } catch (err) {
    // Fallback to UTC if timezone is invalid or unsupported
    const d = new Date(date);
    const year = d.getUTCFullYear();
    const month = String(d.getUTCMonth() + 1).padStart(2, "0");
    const day = String(d.getUTCDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }
}

/**
 * Returns the exact Date object corresponding to the start of a calendar day (00:00:00)
 * in a specific IANA timezone, adjusted for daylight savings.
 */
function getStartOfLocalDay(dateString, timezone = "UTC") {
  try {
    const [year, month, day] = dateString.split("-").map(Number);
    const targetUTC = Date.UTC(year, month - 1, day, 0, 0, 0);
    let temp = new Date(targetUTC);
    
    // Iteratively adjust offset to converge on local midnight relative to targetUTC
    for (let i = 0; i < 3; i++) {
      const formatter = new Intl.DateTimeFormat("en-US", {
        timeZone: timezone,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hourCycle: "h23",
      });
      const parts = formatter.formatToParts(temp);
      const y = Number(parts.find(p => p.type === "year").value);
      const m = Number(parts.find(p => p.type === "month").value);
      const d = Number(parts.find(p => p.type === "day").value);
      const h = Number(parts.find(p => p.type === "hour").value);
      const min = Number(parts.find(p => p.type === "minute").value);
      const s = Number(parts.find(p => p.type === "second").value);

      const offsetMs = Date.UTC(y, m - 1, d, h, min, s) - temp.getTime();
      temp = new Date(targetUTC - offsetMs);
    }
    return temp;
  } catch (err) {
    // Fallback to UTC start of day if timezone is invalid
    const [year, month, day] = dateString.split("-").map(Number);
    return new Date(Date.UTC(year, month - 1, day, 0, 0, 0));
  }
}

module.exports = {
  getLocalDateString,
  getStartOfLocalDay,
};
