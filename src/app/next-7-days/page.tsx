import type { Metadata } from 'next';
import { TaskListView } from '@/components/features/task-list-view';

export const metadata: Metadata = {
  title: 'Next 7 Days — Daily Planner',
};

export default function Next7DaysPage() {
  return (
    <TaskListView
      title="Next 7 Days"
      description="Tasks scheduled for the next 7 days"
      endpoint="/api/tasks?view=next-7-days"
      emptyMessage="Nothing planned for the next 7 days"
    />
  );
}
