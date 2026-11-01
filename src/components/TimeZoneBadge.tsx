import { use } from 'react';
import { browser } from 'react-dom';

// Conditional bailout: when the server can supply a good default,
// render it into the HTML and never suspend. Only when there is
// no default does the component opt out of server rendering and
// read the value that only exists on the device.
export function useTimeZone(defaultValue?: string): string {
  if (defaultValue !== undefined) {
    return defaultValue;
  }

  use(browser('useTimeZone has no server default and reads the device time zone.'));

  return new Intl.DateTimeFormat().resolvedOptions().timeZone;
}

export default function TimeZoneBadge({
  defaultValue,
}: {
  defaultValue?: string;
}) {
  const timeZone = useTimeZone(defaultValue);
  return <p>Time zone: {timeZone}</p>;
}
