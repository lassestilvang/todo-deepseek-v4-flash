import type { Metadata } from 'next';
import { CalendarView } from '@/components/features/calendar-view';

export const metadata: Metadata = {
  title: 'Calendar — Daily Planner',
};

export default function CalendarPage() {
  return <CalendarView />;
}