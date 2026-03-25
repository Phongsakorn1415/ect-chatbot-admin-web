/**
 * Parses a duration string (e.g., "7d", "2h", "1h30m", "15s") and returns the total seconds.
 * Supported units:
 * d - days
 * h - hours
 * m - minutes
 * s - seconds
 *
 * Example: "1h30m" -> 3600 + 1800 = 5400 seconds
 */
export function parseDuration(duration: string): number {
  if (!duration) return 1 * 24 * 60 * 60; // Default: 1 day

  const regex = /(\d+)([dhms])/g;
  let totalSeconds = 0;
  let match;

  while ((match = regex.exec(duration)) !== null) {
    const value = parseInt(match[1]);
    const unit = match[2];

    switch (unit) {
      case "d":
        totalSeconds += value * 24 * 60 * 60;
        break;
      case "h":
        totalSeconds += value * 60 * 60;
        break;
      case "m":
        totalSeconds += value * 60;
        break;
      case "s":
        totalSeconds += value;
        break;
    }
  }

  // If no valid units found but it's a number string, assume seconds
  if (totalSeconds === 0 && !isNaN(Number(duration))) {
    return Number(duration);
  }

  return totalSeconds || 30 * 24 * 60 * 60; // Fallback to 30 days if parsing fails
}
