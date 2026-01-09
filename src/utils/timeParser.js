/**
 * Parse time string like "1m", "2h", "3d" into milliseconds
 * Supports: m (minutes), h (hours), d (days)
 * Max: 30 days
 */
export function parseTimeString(timeString) {
  if (!timeString || typeof timeString !== 'string') {
    return null;
  }

  const trimmed = timeString.trim().toLowerCase();
  const match = trimmed.match(/^(\d+)([mhd])$/);
  
  if (!match) {
    return null;
  }

  const value = parseInt(match[1], 10);
  const unit = match[2];

  if (value <= 0) {
    return null;
  }

  let milliseconds = 0;

  switch (unit) {
    case 'm':
      milliseconds = value * 60 * 1000;
      break;
    case 'h':
      milliseconds = value * 60 * 60 * 1000;
      break;
    case 'd':
      milliseconds = value * 24 * 60 * 60 * 1000;
      break;
    default:
      return null;
  }

  // Max 30 days
  const maxMs = 30 * 24 * 60 * 60 * 1000;
  if (milliseconds > maxMs) {
    return null;
  }

  return milliseconds;
}

/**
 * Format milliseconds into human-readable string
 */
export function formatDuration(ms) {
  const days = Math.floor(ms / (1000 * 60 * 60 * 24));
  const hours = Math.floor((ms % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));

  if (days > 0) return `${days}d ${hours}h ${minutes}m`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}