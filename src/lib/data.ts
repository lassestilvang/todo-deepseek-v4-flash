/* eslint-disable @typescript-eslint/no-explicit-any */

import Database from 'better-sqlite3';
import { getDb } from './db';
import { generateId } from './utils';
import type { List, Task, TaskWithRelations, Subtask, Attachment, Reminder, Label, ActivityLog, Recurrence, Priority } from '@/types';

// Prepared statement cache for better-sqlite3 performance
const stmtCache = new Map<string, Database.Statement>();

function prepare(db: Database.Database, sql: string): Database.Statement {
  let stmt = stmtCache.get(sql);
  if (!stmt) {
    stmt = db.prepare(sql);
    stmtCache.set(sql, stmt);
  }
  return stmt;
}

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
  const deleteListTx = db.transaction(() => {
    const affectedTasks = db.prepare('SELECT id, name FROM tasks WHERE list_id = ?').all(id) as { id: string; name: string }[];
    for (const task of affectedTasks) {
      logActivity(db, task.id, 'moved', 'list', list?.name || '', 'Inbox');
    }
    db.prepare('UPDATE tasks SET list_id = ? WHERE list_id = ?').run('inbox', id);
    db.prepare('DELETE FROM lists WHERE id = ? AND is_default = 0').run(id);
  });
  deleteListTx();
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

const BATCH_LABEL_SQL = (placeholders: string) => `SELECT task_id, label_id FROM task_labels WHERE task_id IN (${placeholders})`;

function getBatchTaskLabelIds(db: Database.Database, taskIds: string[]): Record<string, string[]> {
  if (taskIds.length === 0) return {};
  const placeholders = taskIds.map(() => '?').join(',');
  const rows = prepare(db, BATCH_LABEL_SQL(placeholders)).all(...taskIds) as { task_id: string; label_id: string }[];
  const result: Record<string, string[]> = {};
  for (const taskId of taskIds) result[taskId] = [];
  for (const row of rows) {
    if (!result[row.task_id]) result[row.task_id] = [];
    result[row.task_id].push(row.label_id);
  }
  return result;
}

const BATCH_SUBTASK_SQL = (placeholders: string) => `SELECT * FROM subtasks WHERE task_id IN (${placeholders}) ORDER BY created_at ASC`;

function getBatchSubtasks(db: Database.Database, taskIds: string[]): Record<string, Subtask[]> {
  if (taskIds.length === 0) return {};
  const placeholders = taskIds.map(() => '?').join(',');
  const rows = prepare(db, BATCH_SUBTASK_SQL(placeholders)).all(...taskIds) as any[];
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

function getBatchAttachments(db: Database.Database, taskIds: string[]): Record<string, Attachment[]> {
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

function getBatchReminders(db: Database.Database, taskIds: string[]): Record<string, Reminder[]> {
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

function getBatchLists(db: Database.Database, listIds: string[]): Record<string, List> {
  if (listIds.length === 0) return {};
  const placeholders = listIds.map(() => '?').join(',');
  const rows = db.prepare(`SELECT * FROM lists WHERE id IN (${placeholders})`).all(...listIds) as any[];
  const result: Record<string, List> = {};
  for (const row of rows) {
    result[row.id] = rowToList(row);
  }
  return result;
}

function getBatchLabels(db: Database.Database, labelIds: string[]): Record<string, Label> {
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

function getTaskLabelIds(db: Database.Database, taskId: string): string[] {
  const rows = db.prepare('SELECT label_id FROM task_labels WHERE task_id = ?').all(taskId) as { label_id: string }[];
  return rows.map(r => r.label_id);
}

function getSubtasks(db: Database.Database, taskId: string): Subtask[] {
  return (db.prepare('SELECT * FROM subtasks WHERE task_id = ? ORDER BY created_at ASC').all(taskId) as any[]).map((row: any) => ({
    id: row.id,
    taskId: row.task_id,
    title: row.title,
    completed: !!row.completed,
    createdAt: row.created_at,
  }));
}

function getAttachments(db: Database.Database, taskId: string): Attachment[] {
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

function getReminders(db: Database.Database, taskId: string): Reminder[] {
  return (db.prepare('SELECT * FROM reminders WHERE task_id = ? ORDER BY time ASC').all(taskId) as any[]).map((row: any) => ({
    id: row.id,
    taskId: row.task_id,
    time: row.time,
    type: row.type as Reminder['type'],
    sent: !!row.sent,
  }));
}

function hydrateTasks(db: Database.Database, rows: Record<string, any>[], options?: { includeAttachments?: boolean; includeReminders?: boolean }): TaskWithRelations[] {
  const taskIds = rows.map(r => r.id);
  if (taskIds.length === 0) return [];
  const labelsMap = getBatchTaskLabelIds(db, taskIds);
  const subtasksMap = getBatchSubtasks(db, taskIds);
  const attachmentsMap = options?.includeAttachments ? getBatchAttachments(db, taskIds) : {};
  const remindersMap = options?.includeReminders ? getBatchReminders(db, taskIds) : {};
  const listIds = [...new Set(rows.map(r => r.list_id))];
  const listsMap = getBatchLists(db, listIds);
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

export function getTasks(params?: {
  listId?: string;
  labelId?: string;
  completed?: boolean;
  date?: string;
  startDate?: string;
  endDate?: string;
  search?: string;
  includeUndated?: boolean;
  includeAttachments?: boolean;
  includeReminders?: boolean;
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
    query += params?.includeUndated === false ? ' AND date >= ?' : ' AND (date >= ? OR date IS NULL)';
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
  return hydrateTasks(db, rows, {
    includeAttachments: params?.includeAttachments,
    includeReminders: params?.includeReminders,
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

  const insert = db.transaction(() => {
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
  });

  insert();
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

  const update = db.transaction(() => {
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

    // Sync subtasks if provided — preserve created_at for existing ones
    if (data.subtasks !== undefined) {
      const existingRows = db.prepare('SELECT id, created_at FROM subtasks WHERE task_id = ?').all(id) as { id: string; created_at: string }[];
      const existingMap = new Map(existingRows.map(r => [r.id, r.created_at]));
      const incomingIds = new Set(data.subtasks.map(s => s.id));

      // Delete subtasks removed by user
      for (const row of existingRows) {
        if (!incomingIds.has(row.id)) {
          db.prepare('DELETE FROM subtasks WHERE id = ?').run(row.id);
        }
      }

      const upsert = db.prepare(`
        INSERT INTO subtasks (id, task_id, title, completed, created_at) VALUES (?, ?, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET title = excluded.title, completed = excluded.completed
      `);
      for (const st of data.subtasks) {
        const origCreatedAt = existingMap.get(st.id);
        upsert.run(st.id, id, st.title, st.completed ? 1 : 0, origCreatedAt || now);
      }
    }
  });

  update();
  return getTask(id);
}

export function deleteTask(id: string): void {
  const db = getDb();
  db.prepare('DELETE FROM tasks WHERE id = ?').run(id);
}
export function deleteTasksBatch(ids: string[]): void {
  if (ids.length === 0) return;
  const db = getDb();
  const deleteMany = db.transaction(() => {
    const stmt = db.prepare('DELETE FROM tasks WHERE id = ?');
    for (const id of ids) {
      stmt.run(id);
    }
  });
  deleteMany();
}


export function toggleTaskCompletion(id: string): TaskWithRelations | undefined {
  const db = getDb();
  const existing = getTask(id);
  if (!existing) return undefined;
  const now = new Date().toISOString();
  const newCompleted = existing.completed ? 0 : 1;
  db.prepare(`
    UPDATE tasks
    SET completed = ?,
        completed_at = CASE WHEN ? THEN ? ELSE NULL END,
        updated_at = ?
    WHERE id = ?
  `).run(newCompleted, newCompleted, now, now, id);
  logActivity(db, id, newCompleted ? 'completed' : 'uncompleted', 'completed', '', '');
  return getTask(id);
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
  logActivity(db, row.task_id, 'update', 'subtask', row.title, String(!!newCompleted));
  return {
    id: row.id,
    taskId: row.task_id,
    title: row.title,
    completed: !!newCompleted,
    createdAt: row.created_at,
  };
}

export function deleteSubtask(id: string): void {
  const db = getDb();
  const row = db.prepare('SELECT task_id, title FROM subtasks WHERE id = ?').get(id) as { task_id: string; title: string } | undefined;
  if (row) {
    logActivity(db, row.task_id, 'delete', 'subtask', row.title, '');
  }
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

// --- Task Counts ---
export function getTaskCounts(): {
  total: number;
  today: number;
  upcoming: number;
  next7Days: number;
  byList: Record<string, number>;
  byLabel: Record<string, number>;
} {
  const db = getDb();
  const now = new Date();
  const today = now.toISOString().split('T')[0];
  const end7 = new Date(now);
  end7.setDate(end7.getDate() + 6);
  const end7Str = end7.toISOString().split('T')[0];

  // Single combined query for counts
  const countRow = db.prepare(`
    SELECT
      COUNT(*) as total,
      SUM(CASE WHEN date = ? THEN 1 ELSE 0 END) as today,
      SUM(CASE WHEN date >= ? THEN 1 ELSE 0 END) as upcoming,
      SUM(CASE WHEN date >= ? AND date <= ? THEN 1 ELSE 0 END) as next7
    FROM tasks WHERE completed = 0
  `).get(today, today, today, end7Str) as { total: number; today: number; upcoming: number; next7: number };

  const byListRows = db.prepare('SELECT list_id, COUNT(*) as c FROM tasks WHERE completed = 0 GROUP BY list_id').all() as { list_id: string; c: number }[];
  const byList: Record<string, number> = {};
  for (const row of byListRows) byList[row.list_id] = row.c;

  const byLabelRows = db.prepare(`
    SELECT tl.label_id, COUNT(*) as c
    FROM task_labels tl
    JOIN tasks t ON t.id = tl.task_id
    WHERE t.completed = 0
    GROUP BY tl.label_id
  `).all() as { label_id: string; c: number }[];
  const byLabel: Record<string, number> = {};
  for (const row of byLabelRows) byLabel[row.label_id] = row.c;

  return {
    total: countRow.total,
    today: countRow.today,
    upcoming: countRow.upcoming,
    next7Days: countRow.next7,
    byList,
    byLabel,
  };
}

// --- Activity Logs ---
function logActivity(db: Database.Database, taskId: string, action: string, field: string, oldValue: string | null, newValue: string | null): void {
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

  return hydrateTasks(db, rows);
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
      end.setDate(end.getDate() + 6);
      return getTasks({ startDate: today, endDate: end.toISOString().split('T')[0], includeUndated: false });
    }
    case 'upcoming': {
      return getTasks({ startDate: today, includeUndated: false });
    }
    case 'all': {
      return getTasks({});
    }
    default:
      return getTasks({ listId: view });
  }
}