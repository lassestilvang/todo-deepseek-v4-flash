import type { Metadata } from 'next';
import { TaskListView } from '@/components/features/task-list-view';

export const metadata: Metadata = {
  title: 'All Tasks — Daily Planner',
};

export default function AllPage() {
  return (
    <TaskListView
      title="All Tasks"
      description="Every task in your planner"
      endpoint="/api/tasks?view=all"
      emptyMessage="No tasks yet. Start by creating one!"
    />
  );
}
