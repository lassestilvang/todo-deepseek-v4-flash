import { TaskListView } from '@/components/features/task-list-view';

export default async function LabelPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { getLabel } = await import('@/lib/data');
  const label = getLabel(id);

  if (!label) {
    return (
      <div className="p-8 text-center">
        <h1 className="text-2xl font-bold">Label not found</h1>
        <p className="text-muted-foreground mt-2">This label doesn't exist.</p>
      </div>
    );
  }

  return (
    <TaskListView
      title={`${label.icon} ${label.name}`}
      endpoint={`/api/tasks?labelId=${id}`}
      emptyMessage="No tasks with this label"
    />
  );
}