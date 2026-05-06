import { TaskListView } from '@/components/features/task-list-view';
import { getList } from '@/lib/data';

export default async function ListPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const list = getList(id);

  if (!list) {
    return (
      <div className="p-8 text-center">
        <h1 className="text-2xl font-bold">List not found</h1>
        <p className="text-muted-foreground mt-2">This list doesn't exist.</p>
      </div>
    );
  }

  return (
    <TaskListView
      title={`${list.icon} ${list.name}`}
      endpoint={`/api/tasks?listId=${id}`}
      emptyMessage="No tasks in this list"
    />
  );
}