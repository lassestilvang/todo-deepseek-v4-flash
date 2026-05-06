import { TaskListView } from '@/components/features/task-list-view';
import { format } from 'date-fns';

export default function TodayPage() {
  const today = format(new Date(), 'EEEE, MMMM d');
  const dateStr = new Date().toISOString().split('T')[0];

  return (
    <TaskListView
      title="Today"
      description={today}
      endpoint={`/api/tasks?view=today`}
      emptyMessage="Nothing planned for today"
    />
  );
}