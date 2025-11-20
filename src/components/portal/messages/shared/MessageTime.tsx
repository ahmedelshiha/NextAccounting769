/**
 * MessageTime Component - Time Formatter
 * Displays relative time for messages
 */

import { formatDistanceToNow, format, isToday, isYesterday } from "date-fns";

interface MessageTimeProps {
  timestamp: string;
  className?: string;
  showFull?: boolean;
}

export function MessageTime({ timestamp, className, showFull = false }: MessageTimeProps) {
  const date = new Date(timestamp);

  const getFormattedTime = () => {
    if (showFull) {
      return format(date, "PPp"); // Full date and time
    }

    if (isToday(date)) {
      return format(date, "p"); // Just time
    }

    if (isYesterday(date)) {
      return `Yesterday ${format(date, "p")}`;
    }

    // More than 1 day ago
    return formatDistanceToNow(date, { addSuffix: true });
  };

  return (
    <span
      className={`text-xs text-gray-500 dark:text-gray-400 ${className || ""}`}
      title={format(date, "PPp")}
    >
      {getFormattedTime()}
    </span>
  );
}
