export interface List {
  id: string;
  name: string;
  color: string;
  icon: string;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export type Priority = 'none' | 'low' | 'medium' | 'high';

export type RecurrenceType = 'none' | 'daily' | 'weekly' | 'weekdays' | 'monthly' | 'yearly' | 'custom';

export interface Recurrence {
  type: RecurrenceType;
  interval?: number; // e.g., every 2 days, every 3 weeks
  daysOfWeek?: number[]; // [0, 1, 2] for Sun, Mon, Tue
  dayOfMonth?: number; // 1-31
  monthOfYear?: number; // 1-12
  endDate?: string; // ISO date string
}

export interface Subtask {
  id: string;
  taskId: string;
  title: string;
  completed: boolean;
  position: number;
  createdAt: string;
}

export interface Attachment {
  id: string;
  taskId: string;
  name: string;
  url: string;
  type: string;
  size: number;
  createdAt: string;
}

export interface Reminder {
  id: string;
  taskId: string;
  time: string; // ISO string
  type: 'email' | 'push' | 'notification';
  sent: boolean;
}

export interface Task {
  id: string;
  name: string;
  description: string;
  date: string | null; // ISO date string
  deadline: string | null; // ISO date string
  estimate: string | null; // HH:mm
  actualTime: string | null; // HH:mm
  priority: Priority;
  listId: string;
  labels: string[]; // label IDs
  recurrence: Recurrence | null;
  completed: boolean;
  completedAt: string | null;
  pinned: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface TaskWithRelations extends Task {
  subtasks: Subtask[];
  attachments: Attachment[];
  reminders: Reminder[];
  list?: List;
  labelObjects?: Label[];
  activityLogs?: ActivityLog[];
}

export interface Label {
  id: string;
  name: string;
  color: string;
  icon: string;
  createdAt: string;
}

export interface ActivityLog {
  id: string;
  taskId: string;
  action: string;
  field: string;
  oldValue: string | null;
  newValue: string | null;
  timestamp: string;
}
