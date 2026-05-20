import type { Metadata } from 'next';
import { TaskListView } from '@/components/features/task-list-view';

export const metadata: Metadata = {
  title: 'Upcoming — Daily Planner',
};

export default function UpcomingPage() {
  return (
    <TaskListView
      title="Upcoming"
      description="All tasks from today onwards"
      endpoint="/api/tasks?view=upcoming"
      emptyMessage="No upcoming tasks"
    />
  );
}
