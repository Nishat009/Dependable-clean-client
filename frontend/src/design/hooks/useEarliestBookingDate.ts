import { useEffect, useState } from 'react';
import { earliestBookingDate } from '../data';

// The server renders before it knows the visitor's calendar, so the date is filled in once the page is in the browser.
export function useEarliestBookingDate(): string {
  const [date, setDate] = useState('');
  useEffect(() => setDate(earliestBookingDate()), []);
  return date;
}
