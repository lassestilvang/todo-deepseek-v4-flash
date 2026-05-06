import { getDb } from './db';
import { generateId } from './utils';
import type { List, Task, TaskWithRelations, Subtask, Attachment, Reminder, Label, ActivityLog, Recurrence, Priority } from '@/types';

// --- Lists ---
export function getLists(): List[] {
  const db = getDb();
  return db.prepare('SELECT * FROM lists ORDER BY is_default DESC, name ASC').all() as List[];
}

export function getList(id: string): List | undefined {
  const db = getDb();
  return db.prepare('SELECT * FROM lists WHERE id = ?').get(id) as List | undefined;
}

export function createList(data: { name: string; color: string; icon: string }): List {
  const db = getDb();
  const id = generateId();
  const now = new Date().toISOString();
  db.prepare(
    'INSERT INTO lists (id, name, color, icon, is_default, created_at, updated_at) VALUES (?, ?, ?, ?, 0, ?, ?)'
  ).run(id, data.name, data.color, data.icon, now, now);
  return getList(id)!;
}

export function updateList(id: string, data: Partial<{ name: string; color: string; icon: string }>): List | undefined {
  const db = getDb();
  const now = new Date().toISOString();
  const updates: string[] = [];
  const values: (string | number)[] = [];
  if (data.name !== undefined) { updates.push('name = ?'); values.push(data.name); }
  if (data.color !== undefined) { updates.push('color = ?'); values.push(data.color); }
  if (data.icon !== undefined) { updates.push('icon = ?'); values.push(data.icon); }
  updates.push('updated_at = ?');
  values.push(now);
  values.push(id);
  db.prepare(`UPDATE lists SET ${updates.join(', ')} WHERE id = ?`).run(...values);
  return getList(id);
}

export function deleteList(id: string): void {
  const db = getDb();
  const list = getList(id);
  if (list?.isDefault) throw new Error('Cannot delete default list');
  // Move tasks to inbox
  db.prepare('UPDATE tasks SET list_id = ? WHERE list_id = ?').run('inbox', id);
  db.prepare('DELETE FROM lists WHERE id = ? AND is_default = 0').run(id);
}

// --- Labels ---
export function getLabels(): Label[] {
  const db = getDb();
  return db.prepare('SELECT * FROM labels ORDER BY name ASC').all() as Label[];
}

export function getLabel(id: string): Label | undefined {
  const db = getDb();
  return db.prepare('SELECT * FROM labels WHERE id = ?').get(id) as Label | undefined;
}

export function createLabel(data: { name: string; color: string; icon: string }): Label {
  const db = getDb();
  const id = generateId();
  db.prepare('INSERT INTO labels (id, name, color, icon) VALUES (?, ?, ?, ?)').run(id, data.name, data.color, data.icon);
  return getLabel(id)!;
}

export function updateLabel(id: string, data: Partial<{ name: string; color: string; icon: string }>): Label | undefined {
  const db = getDb();
  const updates: string[] = [];
  const values: (string | number)[] = [];
  if (data.name !== undefined) { updates.push('name = ?'); values.push(data.name); }
  if (data.color !== undefined) { updates.push('color = ?'); values.push(data.color); }
  if (data.icon !== undefined) { updates.push('icon = ?'); values.push(data.icon); }
  values.push(id);
  db.prepare(`UPDATE labels SET ${updates.join(', ')} WHERE id = ?`).run(...values);
  return getLabel(id);
}

export function deleteLabel(id: string): void {
  const db = getDb();
  db.prepare('DELETE FROM task_labels WHERE label_id = ?').run(id);
  db.prepare('DELETE FROM labels WHERE id = ?').run(id);
}

// --- Tasks ---
function rowToTask(row: Record<string, any>): Task {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    date: row.date,
    deadline: row.deadline,
    estimate: row.estimate,
    actualTime: row.actual_time,
    priority: row.priority as Priority,
    listId: row.list_id,
    labels: [],
    recurrence: row.recurrence ? JSON.parse(row.recurrence) : null,
    completed: !!row.completed,
    completedAt: row.completed_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function getBatchTaskLabelIds(db: any, taskIds: string[]): Record<string, string[]> {
  if (taskIds.length === 0) return {};
  const placeholders = taskIds.map(() => '?').join(',');
  const rows = db.prepare(`SELECT task_id, label_id FROM task_labels WHERE task_id IN (${placeholders})`).all(...taskIds) as { task_id: string; label_id: string }[];
  const result: Record<string, string[]> = {};
  for (const taskId of taskIds) result[taskId] = [];
  for (const row of rows) {
    if (!result[row.task_id]) result[row.task_id] = [];
    result[row.task_id].push(row.label_id);
  }
  return result;
}

function getBatchSubtasks(db: any, taskIds: string[]): Record<string, Subtask[]> {
  if (taskIds.length === 0) return {};
  const placeholders = taskIds.map(() => '?').join(',');
  const rows = db.prepare(`SELECT * FROM subtasks WHERE task_id IN (${placeholders}) ORDER BY created_at ASC`).all(...taskIds) as any[];
  const result: Record<string, Subtask[]> = {};
  for (const taskId of taskIds) result[taskId] = [];
  for (const row of rows) {
    if (!result[row.task_id]) result[row.task_id] = [];
    result[row.task_id].push({
      id: row.id,
      taskId: row.task_id,
      title: row.title,
      completed: !!row.completed,
      createdAt: row.created_at,
    });
  }
  return result;
}

function getBatchAttachments(db: any, taskIds: string[]): Record<string, Attachment[]> {
  if (taskIds.length === 0) return {};
  const placeholders = taskIds.map(() => '?').join(',');
  const rows = db.prepare(`SELECT * FROM attachments WHERE task_id IN (${placeholders}) ORDER BY created_at ASC`).all(...taskIds) as any[];
  const result: Record<string, Attachment[]> = {};
  for (const taskId of taskIds) result[taskId] = [];
  for (const row of rows) {
    if (!result[row.task_id]) result[row.task_id] = [];
    result[row.task_id].push({
      id: row.id,
      taskId: row.task_id,
      name: row.name,
      url: row.url,
      type: row.type,
      size: row.size,
      createdAt: row.created_at,
    });
  }
  return result;
}

function getBatchReminders(db: any, taskIds: string[]): Record<string, Reminder[]> {
  if (taskIds.length === 0) return {};
  const placeholders = taskIds.map(() => '?').join(',');
  const rows = db.prepare(`SELECT * FROM reminders WHERE task_id IN (${placeholders}) ORDER BY time ASC`).all(...taskIds) as any[];
  const result: Record<string, Reminder[]> = {};
  for (const taskId of taskIds) result[taskId] = [];
  for (const row of rows) {
    if (!result[row.task_id]) result[row.task_id] = [];
    result[row.task_id].push({
      id: row.id,
      taskId: row.task_id,
      time: row.time,
      type: row.type as Reminder['type'],
      sent: !!row.sent,
    });
  }
  return result;
}

function getBatchLists(db: any, listIds: string[]): Record<string, List> {
  if (listIds.length === 0) return {};
  const placeholders = listIds.map(() => '?').join(',');
  const rows = db.prepare(`SELECT * FROM lists WHERE id IN (${placeholders})`).all(...listIds) as any[];
  const result: Record<string, List> = {};
  for (const row of rows) {
    result[row.id] = rowToList(row);
  }
  return result;
}

function getBatchLabels(db: any, labelIds: string[]): Record<string, Label> {
  if (labelIds.length === 0) return {};
  const placeholders = labelIds.map(() => '?').join(',');
  const rows = db.prepare(`SELECT * FROM labels WHERE id IN (${placeholders})`).all(...labelIds) as any[];
  const result: Record<string, Label> = {};
  for (const row of rows) {
    result[row.id] = {
      id: row.id,
      name: row.name,
      color: row.color,
      icon: row.icon,
      createdAt: row.created_at,
    };
  }
  return result;
}

function rowToList(row: any): List {
  return {
    id: row.id,
    name: row.name,
    color: row.color,
    icon: row.icon,
    isDefault: !!row.is_default,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function getTaskLabelIds(db: any, taskId: string): string[] {
  const rows = db.prepare('SELECT label_id FROM task_labels WHERE task_id = ?').all(taskId) as { label_id: string }[];
  return rows.map(r => r.label_id);
}

function getSubtasks(db: any, taskId: string): Subtask[] {
  return (db.prepare('SELECT * FROM subtasks WHERE task_id = ? ORDER BY created_at ASC').all(taskId) as any[]).map((row: any) => ({
    id: row.id,
    taskId: row.task_id,
    title: row.title,
    completed: !!row.completed,
    createdAt: row.created_at,
  }));
}

function getAttachments(db: any, taskId: string): Attachment[] {
  return (db.prepare('SELECT * FROM attachments WHERE task_id = ? ORDER BY created_at ASC').all(taskId) as any[]).map((row: any) => ({
    id: row.id,
    taskId: row.task_id,
    name: row.name,
    url: row.url,
    type: row.type,
    size: row.size,
    createdAt: row.created_at,
  }));
}

function getReminders(db: any, taskId: string): Reminder[] {
  return (db.prepare('SELECT * FROM reminders WHERE task_id = ? ORDER BY time ASC').all(taskId) as any[]).map((row: any) => ({
    id: row.id,
    taskId: row.task_id,
    time: row.time,
    type: row.type as Reminder['type'],
    sent: !!row.sent,
  }));
}

export function getTasks(params?: {
  listId?: string;
  labelId?: string;
  completed?: boolean;
  date?: string;
  startDate?: string;
  endDate?: string;
  search?: string;
}): TaskWithRelations[] {
  const db = getDb();
  let query = 'SELECT * FROM tasks WHERE 1=1';
  const values: any[] = [];

  if (params?.listId) {
    query += ' AND list_id = ?';
    values.push(params.listId);
  }
  if (params?.completed !== undefined) {
    query += ' AND completed = ?';
    values.push(params.completed ? 1 : 0);
  }
  if (params?.date) {
    query += ' AND date = ?';
    values.push(params.date);
  }
  if (params?.startDate) {
    query += ' AND (date >= ? OR date IS NULL)';
    values.push(params.startDate);
  }
  if (params?.endDate) {
    query += ' AND date <= ?';
    values.push(params.endDate);
  }
  if (params?.labelId) {
    query += ' AND id IN (SELECT task_id FROM task_labels WHERE label_id = ?)';
    values.push(params.labelId);
  }
  if (params?.search) {
    query += ' AND (name LIKE ? OR description LIKE ?)';
    values.push(`%${params.search}%`, `%${params.search}%`);
  }

  query += ' ORDER BY completed ASC, priority DESC, date ASC, created_at DESC';

  const rows = db.prepare(query).all(...values) as Record<string, any>[];
  
  const taskIds = rows.map(r => r.id);
  const labelsMap = getBatchTaskLabelIds(db, taskIds);
  const subtasksMap = getBatchSubtasks(db, taskIds);
  const attachmentsMap = getBatchAttachments(db, taskIds);
  const remindersMap = getBatchReminders(db, taskIds);
  const listIds = [...new Set(rows.map(r => r.list_id))];
  const listsMap = getBatchLists(db, listIds);

  // Resolve all unique label IDs to Label objects
  const allLabelIds = [...new Set(Object.values(labelsMap).flat())];
  const labelObjMap = getBatchLabels(db, allLabelIds);

  return rows.map(row => {
    const task = rowToTask(row);
    const labelIds = labelsMap[task.id] || [];
    task.labels = labelIds;
    const list = listsMap[task.listId];
    return {
      ...task,
      subtasks: subtasksMap[task.id] || [],
      attachments: attachmentsMap[task.id] || [],
      reminders: remindersMap[task.id] || [],
      list,
      labelObjects: labelIds.map(id => labelObjMap[id]).filter(Boolean),
    };
  });
}

export function getTask(id: string): TaskWithRelations | undefined {
  const db = getDb();
  const row = db.prepare('SELECT * FROM tasks WHERE id = ?').get(id) as Record<string, any> | undefined;
  if (!row) return undefined;
  const task = rowToTask(row);
  task.labels = getTaskLabelIds(db, task.id);
  const list = getList(task.listId);
  return {
    ...task,
    subtasks: getSubtasks(db, task.id),
    attachments: getAttachments(db, task.id),
    reminders: getReminders(db, task.id),
    list,
  };
}

export function createTask(data: {
  name: string;
  description?: string;
  date?: string | null;
  deadline?: string | null;
  estimate?: string | null;
  priority?: Priority;
  listId?: string;
  labels?: string[];
  recurrence?: Recurrence | null;
  subtasks?: { id: string; title: string; completed: boolean }[];
}): TaskWithRelations {
  const db = getDb();
  const id = generateId();
  const now = new Date().toISOString();
  const listId = data.listId || 'inbox';

  db.prepare(`
    INSERT INTO tasks (id, name, description, date, deadline, estimate, priority, list_id, recurrence, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id,
    data.name,
    data.description || '',
    data.date || null,
    data.deadline || null,
    data.estimate || null,
    data.priority || 'none',
    listId,
    data.recurrence ? JSON.stringify(data.recurrence) : null,
    now,
    now
  );

  // Add labels
  if (data.labels) {
    const insertLabel = db.prepare('INSERT OR IGNORE INTO task_labels (task_id, label_id) VALUES (?, ?)');
    for (const labelId of data.labels) {
      insertLabel.run(id, labelId);
    }
  }

  // Add subtasks
  if (data.subtasks) {
    const insertSubtask = db.prepare('INSERT INTO subtasks (id, task_id, title, completed, created_at) VALUES (?, ?, ?, ?, ?)');
    for (const st of data.subtasks) {
      insertSubtask.run(st.id, id, st.title, st.completed ? 1 : 0, now);
    }
  }

  // Log activity
  logActivity(db, id, 'created', '', null, data.name);

  return getTask(id)!;
}

export function updateTask(id: string, data: Partial<{
  name: string;
  description: string;
  date: string | null;
  deadline: string | null;
  estimate: string | null;
  actualTime: string | null;
  priority: Priority;
  listId: string;
  completed: boolean;
  recurrence: Recurrence | null;
  labels?: string[];
  subtasks?: { id: string; title: string; completed: boolean }[];
}>): TaskWithRelations | undefined {
  const db = getDb();
  const existing = getTask(id);
  if (!existing) return undefined;

  const now = new Date().toISOString();
  const updates: string[] = [];
  const values: any[] = [];

  const fieldMapping: Record<string, { field: string; col: string }> = {
    name: { field: 'name', col: 'name' },
    description: { field: 'description', col: 'description' },
    date: { field: 'date', col: 'date' },
    deadline: { field: 'deadline', col: 'deadline' },
    estimate: { field: 'estimate', col: 'estimate' },
    actualTime: { field: 'actual time', col: 'actual_time' },
    priority: { field: 'priority', col: 'priority' },
    listId: { field: 'list', col: 'list_id' },
    recurrence: { field: 'recurrence', col: 'recurrence' },
  };

  for (const [key, mapping] of Object.entries(fieldMapping)) {
    if ((data as any)[key] !== undefined) {
      const oldVal = (existing as any)[key];
      const newVal = (data as any)[key];
      const dbVal = key === 'recurrence' ? (newVal ? JSON.stringify(newVal) : null) : (newVal !== null ? String(newVal) : null);
      
      updates.push(`${mapping.col} = ?`);
      values.push(dbVal);
      
      if (String(oldVal) !== String(newVal)) {
        logActivity(db, id, 'update', mapping.field, String(oldVal ?? ''), String(newVal ?? ''));
      }
    }
  }

  if (data.completed !== undefined) {
    updates.push('completed = ?');
    values.push(data.completed ? 1 : 0);
    updates.push('completed_at = ?');
    values.push(data.completed ? now : null);
    logActivity(db, id, data.completed ? 'completed' : 'uncompleted', 'completed', '', '');
  }

  updates.push('updated_at = ?');
  values.push(now);
  values.push(id);

  db.prepare(`UPDATE tasks SET ${updates.join(', ')} WHERE id = ?`).run(...values);

  // Sync labels if provided
  if (data.labels !== undefined) {
    db.prepare('DELETE FROM task_labels WHERE task_id = ?').run(id);
    const insertLabel = db.prepare('INSERT OR IGNORE INTO task_labels (task_id, label_id) VALUES (?, ?)');
    for (const labelId of data.labels) {
      insertLabel.run(id, labelId);
    }
  }

  // Sync subtasks if provided
  if (data.subtasks !== undefined) {
    db.prepare('DELETE FROM subtasks WHERE task_id = ?').run(id);
    const insertSubtask = db.prepare('INSERT INTO subtasks (id, task_id, title, completed, created_at) VALUES (?, ?, ?, ?, ?)');
    for (const st of data.subtasks) {
      insertSubtask.run(st.id, id, st.title, st.completed ? 1 : 0, now);
    }
  }
  
  return getTask(id);
}

export function deleteTask(id: string): void {
  const db = getDb();
  db.prepare('DELETE FROM tasks WHERE id = ?').run(id);
}

export function toggleTaskCompletion(id: string): TaskWithRelations | undefined {
  const task = getTask(id);
  if (!task) return undefined;
  return updateTask(id, { completed: !task.completed });
}

// --- Subtasks ---
export function addSubtask(taskId: string, title: string): Subtask {
  const db = getDb();
  const id = generateId();
  const now = new Date().toISOString();
  db.prepare('INSERT INTO subtasks (id, task_id, title, created_at) VALUES (?, ?, ?, ?)').run(id, taskId, title, now);
  logActivity(db, taskId, 'add', 'subtask', '', title);
  return { id, taskId, title, completed: false, createdAt: now };
}

export function toggleSubtask(id: string): Subtask | undefined {
  const db = getDb();
  const row = db.prepare('SELECT * FROM subtasks WHERE id = ?').get(id) as any;
  if (!row) return undefined;
  const newCompleted = row.completed ? 0 : 1;
  db.prepare('UPDATE subtasks SET completed = ? WHERE id = ?').run(newCompleted, id);
  return { ...row, completed: !!newCompleted, taskId: row.task_id, createdAt: row.created_at };
}

export function deleteSubtask(id: string): void {
  const db = getDb();
  db.prepare('DELETE FROM subtasks WHERE id = ?').run(id);
}

// --- Reminders ---
export function addReminder(taskId: string, time: string, type: Reminder['type'] = 'notification'): Reminder {
  const db = getDb();
  const id = generateId();
  db.prepare('INSERT INTO reminders (id, task_id, time, type) VALUES (?, ?, ?, ?)').run(id, taskId, time, type);
  return { id, taskId, time, type, sent: false };
}

export function deleteReminder(id: string): void {
  const db = getDb();
  db.prepare('DELETE FROM reminders WHERE id = ?').run(id);
}

// --- Labels on Tasks ---
export function addLabelToTask(taskId: string, labelId: string): void {
  const db = getDb();
  const label = getLabel(labelId);
  if (label) {
    db.prepare('INSERT OR IGNORE INTO task_labels (task_id, label_id) VALUES (?, ?)').run(taskId, labelId);
    logActivity(db, taskId, 'add_label', 'label', '', label.name);
  }
}

export function removeLabelFromTask(taskId: string, labelId: string): void {
  const db = getDb();
  const label = getLabel(labelId);
  if (label) {
    db.prepare('DELETE FROM task_labels WHERE task_id = ? AND label_id = ?').run(taskId, labelId);
    logActivity(db, taskId, 'remove_label', 'label', label.name, '');
  }
}

// --- Activity Logs ---
function logActivity(db: any, taskId: string, action: string, field: string, oldValue: string | null, newValue: string | null): void {
  const id = generateId();
  db.prepare('INSERT INTO activity_logs (id, task_id, action, field, old_value, new_value) VALUES (?, ?, ?, ?, ?, ?)')
    .run(id, taskId, action, field, oldValue, newValue);
}

export function getActivityLogs(taskId: string): ActivityLog[] {
  const db = getDb();
  return (db.prepare('SELECT * FROM activity_logs WHERE task_id = ? ORDER BY timestamp DESC').all(taskId) as any[]).map((row: any) => ({
    id: row.id,
    taskId: row.task_id,
    action: row.action,
    field: row.field,
    oldValue: row.old_value,
    newValue: row.new_value,
    timestamp: row.timestamp,
  }));
}

// --- Search ---
export function searchTasks(query: string): TaskWithRelations[] {
  const db = getDb();
  const searchTerm = `%${query}%`;
  const rows = db.prepare(`
    SELECT * FROM tasks 
    WHERE name LIKE ? OR description LIKE ? 
    ORDER BY 
      CASE 
        WHEN name LIKE ? THEN 0 
        WHEN description LIKE ? THEN 1 
        ELSE 2 
      END,
      completed ASC,
      created_at DESC
    LIMIT 50
  `).all(searchTerm, searchTerm, searchTerm, searchTerm) as Record<string, any>[];

  const taskIds = rows.map(r => r.id);
  const labelsMap = getBatchTaskLabelIds(db, taskIds);
  const subtasksMap = getBatchSubtasks(db, taskIds);
  const attachmentsMap = getBatchAttachments(db, taskIds);
  const remindersMap = getBatchReminders(db, taskIds);
  const listIds = [...new Set(rows.map(r => r.list_id))];
  const listsMap = getBatchLists(db, listIds);

  // Resolve all unique label IDs to Label objects
  const allLabelIds = [...new Set(Object.values(labelsMap).flat())];
  const labelObjMap = getBatchLabels(db, allLabelIds);

  return rows.map(row => {
    const task = rowToTask(row);
    const labelIds = labelsMap[task.id] || [];
    task.labels = labelIds;
    const list = listsMap[task.listId];
    return {
      ...task,
      subtasks: subtasksMap[task.id] || [],
      attachments: attachmentsMap[task.id] || [],
      reminders: remindersMap[task.id] || [],
      list,
      labelObjects: labelIds.map(id => labelObjMap[id]).filter(Boolean),
    };
  });
}

export function getUpcomingTasks(startDate: string, endDate?: string): TaskWithRelations[] {
  return getTasks({
    completed: false,
    startDate,
    endDate,
  });
}

export function getTasksForView(view: string): TaskWithRelations[] {
  const now = new Date();
  const today = now.toISOString().split('T')[0];

  switch (view) {
    case 'today': {
      return getTasks({ date: today });
    }
    case 'next-7-days': {
      const end = new Date(now);
      end.setDate(end.getDate() + 7);
      return getTasks({ startDate: today, endDate: end.toISOString().split('T')[0] });
    }
    case 'upcoming': {
      return getTasks({ startDate: today });
    }
    case 'all': {
      return getTasks({});
    }
    default:
      return getTasks({ listId: view });
  }
}