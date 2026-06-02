import type { Metadata } from 'next';
import { TaskListView } from '@/components/features/task-list-view';

export const metadata: Metadata = {
  title: 'Today — Daily Planner',
};

export default function TodayPage() {
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

  return (
    <TaskListView
      title="Today"
      description={today}
      endpoint="/api/tasks?view=today"
      emptyMessage="Nothing planned for today"
      showStats={true}
    />
  );
}
