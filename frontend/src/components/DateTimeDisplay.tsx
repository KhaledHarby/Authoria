import React from 'react';
import { Typography, Tooltip, Box } from '@mui/material';
import { 
  utcToLocalDate, 
  utcToLocalDateTime, 
  utcToLocalTime, 
  utcToRelativeTime,
  formatUtcDate,
  isToday,
  isYesterday
} from '../utils/dateUtils';

interface DateTimeDisplayProps {
  /** The UTC date string from the backend */
  utcDate: string | null | undefined;
  /** The type of display format */
  format?: 'date' | 'datetime' | 'time' | 'relative' | 'custom';
  /** Custom formatting options for 'custom' format */
  customOptions?: Intl.DateTimeFormatOptions;
  /** Show tooltip with full details */
  showTooltip?: boolean;
  /** Typography variant */
  variant?: 'body1' | 'body2' | 'caption' | 'overline';
  /** Color */
  color?: 'text.primary' | 'text.secondary' | 'primary' | 'secondary';
  /** Show "Today" or "Yesterday" for recent dates */
  showRelativeDay?: boolean;
  /** Custom CSS class */
  className?: string;
}

/**
 * A reusable component for displaying dates and times with UTC to local conversion
 */
export const DateTimeDisplay: React.FC<DateTimeDisplayProps> = ({
  utcDate,
  format = 'datetime',
  customOptions,
  showTooltip = false,
  variant = 'body2',
  color = 'text.secondary',
  showRelativeDay = false,
  className
}) => {
  if (!utcDate) {
    return (
      <Typography variant={variant} color={color} className={className}>
        —
      </Typography>
    );
  }

  let displayText = '';
  let tooltipText = '';

  switch (format) {
    case 'date':
      displayText = utcToLocalDate(utcDate);
      tooltipText = `Date: ${utcToLocalDate(utcDate)}`;
      break;
    case 'datetime':
      displayText = utcToLocalDateTime(utcDate);
      tooltipText = `Date & Time: ${utcToLocalDateTime(utcDate)}`;
      break;
    case 'time':
      displayText = utcToLocalTime(utcDate);
      tooltipText = `Time: ${utcToLocalTime(utcDate)}`;
      break;
    case 'relative':
      displayText = utcToRelativeTime(utcDate);
      tooltipText = `Full Date: ${utcToLocalDateTime(utcDate)}`;
      break;
    case 'custom':
      displayText = formatUtcDate(utcDate, customOptions);
      tooltipText = `Custom Format: ${displayText}`;
      break;
    default:
      displayText = utcToLocalDateTime(utcDate);
      tooltipText = `Date & Time: ${utcToLocalDateTime(utcDate)}`;
  }

  // Add relative day indicator if enabled
  if (showRelativeDay) {
    if (isToday(utcDate)) {
      displayText = `Today, ${displayText}`;
    } else if (isYesterday(utcDate)) {
      displayText = `Yesterday, ${displayText}`;
    }
  }

  const content = (
    <Typography variant={variant} color={color} className={className}>
      {displayText}
    </Typography>
  );

  if (showTooltip) {
    return (
      <Tooltip title={tooltipText} arrow>
        <Box component="span">
          {content}
        </Box>
      </Tooltip>
    );
  }

  return content;
};

export default DateTimeDisplay;
