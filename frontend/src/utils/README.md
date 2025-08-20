# Date Utilities

This directory contains utility functions for handling date and time conversion from UTC (stored in database) to local time (displayed in UI).

## Overview

All dates stored in the database are in UTC format. These utilities help convert them to the user's local timezone for display in the frontend.

## Functions

### `utcToLocalDate(utcDateString)`
Converts UTC date string to local date only.
```typescript
utcToLocalDate("2025-08-20T10:30:00Z") // Returns: "8/20/2025"
```

### `utcToLocalDateTime(utcDateString)`
Converts UTC date string to local date and time.
```typescript
utcToLocalDateTime("2025-08-20T10:30:00Z") // Returns: "8/20/2025, 3:30:00 PM"
```

### `utcToLocalTime(utcDateString)`
Converts UTC date string to local time only.
```typescript
utcToLocalTime("2025-08-20T10:30:00Z") // Returns: "3:30:00 PM"
```

### `utcToRelativeTime(utcDateString)`
Converts UTC date string to relative time (e.g., "2 hours ago").
```typescript
utcToRelativeTime("2025-08-20T10:30:00Z") // Returns: "2 hours ago"
```

### `formatUtcDate(utcDateString, options)`
Formats UTC date with custom options.
```typescript
formatUtcDate("2025-08-20T10:30:00Z", { 
  year: 'numeric', 
  month: 'long', 
  day: 'numeric' 
}) // Returns: "August 20, 2025"
```

### `getUserTimezone()`
Gets the user's current timezone.
```typescript
getUserTimezone() // Returns: "America/New_York"
```

### `isToday(utcDateString)` and `isYesterday(utcDateString)`
Check if a date is today or yesterday.
```typescript
isToday("2025-08-20T10:30:00Z") // Returns: true/false
isYesterday("2025-08-19T10:30:00Z") // Returns: true/false
```

## React Component

### `DateTimeDisplay`
A reusable React component for displaying dates with automatic UTC to local conversion.

```typescript
import DateTimeDisplay from '../components/DateTimeDisplay';

// Basic usage
<DateTimeDisplay utcDate="2025-08-20T10:30:00Z" />

// With options
<DateTimeDisplay 
  utcDate="2025-08-20T10:30:00Z"
  format="datetime"
  showTooltip={true}
  variant="body2"
  color="text.secondary"
  showRelativeDay={true}
/>
```

#### Props
- `utcDate`: The UTC date string from the backend
- `format`: Display format ('date', 'datetime', 'time', 'relative', 'custom')
- `customOptions`: Custom formatting options for 'custom' format
- `showTooltip`: Show tooltip with full details
- `variant`: Typography variant
- `color`: Text color
- `showRelativeDay`: Show "Today" or "Yesterday" for recent dates
- `className`: Custom CSS class

## Usage Examples

### In Components
```typescript
import { utcToLocalDateTime, utcToRelativeTime } from '../utils/dateUtils';

// Simple conversion
const localTime = utcToLocalDateTime(user.lastLoginAtUtc);

// Relative time for recent activities
const relativeTime = utcToRelativeTime(auditLog.occurredAtUtc);
```

### In Tables
```typescript
// Use the DateTimeDisplay component for consistent formatting
<TableCell>
  <DateTimeDisplay 
    utcDate={log.occurredAtUtc} 
    format="datetime" 
    showTooltip={true}
  />
</TableCell>
```

### For Recent Activities
```typescript
// Show relative time for recent items
<DateTimeDisplay 
  utcDate={activity.createdAtUtc} 
  format="relative" 
  showRelativeDay={true}
/>
```

## Error Handling

All functions include error handling and will:
- Return `'-'` for null/undefined inputs
- Return the original string if parsing fails
- Log errors to console for debugging

## Timezone Information

The user's timezone is automatically detected using `Intl.DateTimeFormat().resolvedOptions().timeZone` and is displayed in the footer of the application.

## Best Practices

1. **Always use these utilities** for displaying dates from the backend
2. **Use DateTimeDisplay component** for consistent formatting across the app
3. **Show tooltips** for detailed date information when space is limited
4. **Use relative time** for recent activities (last 24-48 hours)
5. **Consider user timezone** - it's shown in the footer for reference
