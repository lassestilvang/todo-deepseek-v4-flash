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
  return prepare(db, 'SELECT * FROM lists ORDER BY is_default DESC, name ASC').all() as List[];
}

export function getList(id: string): List | undefined {
  const db = getDb();
  return prepare(db, 'SELECT * FROM lists WHERE id = ?').get(id) as List | undefined;
}

export function createList(data: { name: string; color: string; icon: string }): List {
  const db = getDb();
  const id = generateId();
  const now = new Date().toISOString();
  prepare(db,
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
  prepare(db, `UPDATE lists SET ${updates.join(', ')} WHERE id = ?`).run(...values);
  return getList(id);
}

export function deleteList(id: string): void {
  const db = getDb();
  const list = getList(id);
  if (list?.isDefault) throw new Error('Cannot delete default list');
  const deleteListTx = db.transaction(() => {
    const affectedTasks = prepare(db, 'SELECT id, name FROM tasks WHERE list_id = ?').all(id) as { id: string; name: string }[];
    for (const task of affectedTasks) {
      logActivity(db, task.id, 'moved', 'list', list?.name || '', 'Inbox');
    }
    prepare(db, 'UPDATE tasks SET list_id = ? WHERE list_id = ?').run('inbox', id);
    prepare(db, 'DELETE FROM lists WHERE id = ? AND is_default = 0').run(id);
  });
  deleteListTx();
}

// --- Labels ---
export function getLabels(): Label[] {
  const db = getDb();
  return prepare(db, 'SELECT * FROM labels ORDER BY name ASC').all() as Label[];
}

export function getLabel(id: string): Label | undefined {
  const db = getDb();
  return prepare(db, 'SELECT * FROM labels WHERE id = ?').get(id) as Label | undefined;
}

export function createLabel(data: { name: string; color: string; icon: string }): Label {
  const db = getDb();
  const id = generateId();
  prepare(db, 'INSERT INTO labels (id, name, color, icon) VALUES (?, ?, ?, ?)').run(id, data.name, data.color, data.icon);
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
  prepare(db, `UPDATE labels SET ${updates.join(', ')} WHERE id = ?`).run(...values);
  return getLabel(id);
}

export function deleteLabel(id: string): void {
  const db = getDb();
  prepare(db, 'DELETE FROM task_labels WHERE label_id = ?').run(id);
  prepare(db, 'DELETE FROM labels WHERE id = ?').run(id);
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
    pinned: !!row.pinned,
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
  const rows = prepare(db, `SELECT * FROM attachments WHERE task_id IN (${placeholders}) ORDER BY created_at ASC`).all(...taskIds) as any[];
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
  const rows = prepare(db, `SELECT * FROM reminders WHERE task_id IN (${placeholders}) ORDER BY time ASC`).all(...taskIds) as any[];
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
  const rows = prepare(db, `SELECT * FROM lists WHERE id IN (${placeholders})`).all(...listIds) as any[];
  const result: Record<string, List> = {};
  for (const row of rows) {
    result[row.id] = rowToList(row);
  }
  return result;
}

function getBatchLabels(db: Database.Database, labelIds: string[]): Record<string, Label> {
  if (labelIds.length === 0) return {};
  const placeholders = labelIds.map(() => '?').join(',');
  const rows = prepare(db, `SELECT * FROM labels WHERE id IN (${placeholders})`).all(...labelIds) as any[];
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
  const rows = prepare(db, 'SELECT label_id FROM task_labels WHERE task_id = ?').all(taskId) as { label_id: string }[];
  return rows.map(r => r.label_id);
}

function getSubtasks(db: Database.Database, taskId: string): Subtask[] {
  return (prepare(db, 'SELECT * FROM subtasks WHERE task_id = ? ORDER BY created_at ASC').all(taskId) as any[]).map((row: any) => ({
    id: row.id,
    taskId: row.task_id,
    title: row.title,
    completed: !!row.completed,
    createdAt: row.created_at,
  }));
}

function getAttachments(db: Database.Database, taskId: string): Attachment[] {
  return (prepare(db, 'SELECT * FROM attachments WHERE task_id = ? ORDER BY created_at ASC').all(taskId) as any[]).map((row: any) => ({
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
  return (prepare(db, 'SELECT * FROM reminders WHERE task_id = ? ORDER BY time ASC').all(taskId) as any[]).map((row: any) => ({
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
  // Run batch queries in parallel using better-sqlite3 synchronous batch
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

  query += ' ORDER BY completed ASC, pinned DESC, position ASC, priority DESC, date ASC, created_at DESC';

  const rows = prepare(db, query).all(...values) as Record<string, any>[];
  return hydrateTasks(db, rows, {
    includeAttachments: params?.includeAttachments,
    includeReminders: params?.includeReminders,
  });
}

export function getTask(id: string): TaskWithRelations | undefined {
  const db = getDb();
  const row = prepare(db, 'SELECT * FROM tasks WHERE id = ?').get(id) as Record<string, any> | undefined;
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

/** Lightweight version that skips attachments and reminders — used internally for updates */
export function getTaskLight(id: string): TaskWithRelations | undefined {
  const db = getDb();
  const row = prepare(db, 'SELECT * FROM tasks WHERE id = ?').get(id) as Record<string, any> | undefined;
  if (!row) return undefined;
  const task = rowToTask(row);
  task.labels = getTaskLabelIds(db, task.id);
  const list = getList(task.listId);
  return {
    ...task,
    subtasks: getSubtasks(db, task.id),
    attachments: [],
    reminders: [],
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
    prepare(db, `
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
      const insertLabel = prepare(db, 'INSERT OR IGNORE INTO task_labels (task_id, label_id) VALUES (?, ?)');
      for (const labelId of data.labels) {
        insertLabel.run(id, labelId);
      }
    }

    // Add subtasks
    if (data.subtasks) {
      const insertSubtask = prepare(db, 'INSERT INTO subtasks (id, task_id, title, completed, created_at) VALUES (?, ?, ?, ?, ?)');
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
  const existing = getTaskLight(id);
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
    pinned: { field: 'pinned', col: 'pinned' },
  };

  const update = db.transaction(() => {
    for (const [key, mapping] of Object.entries(fieldMapping)) {
      if ((data as any)[key] !== undefined) {
        const oldVal = (existing as any)[key];
        const newVal = (data as any)[key];
        const dbVal = key === 'recurrence' ? (newVal ? JSON.stringify(newVal) : null) : (newVal !== null ? String(newVal) : null);
        
        updates.push(`${mapping.col} = ?`);
        values.push(dbVal);
        
        const oldStr = oldVal !== null && oldVal !== undefined ? String(oldVal) : '';
        const newStr = newVal !== null && newVal !== undefined ? String(newVal) : '';
        if (oldStr !== newStr) {
          logActivity(db, id, 'update', mapping.field, oldStr, newStr);
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

    prepare(db, `UPDATE tasks SET ${updates.join(', ')} WHERE id = ?`).run(...values);

    // Sync labels if provided
    if (data.labels !== undefined) {
      prepare(db, 'DELETE FROM task_labels WHERE task_id = ?').run(id);
      const insertLabel = prepare(db, 'INSERT OR IGNORE INTO task_labels (task_id, label_id) VALUES (?, ?)');
      for (const labelId of data.labels) {
        insertLabel.run(id, labelId);
      }
    }

    // Sync subtasks if provided — preserve created_at for existing ones
    if (data.subtasks !== undefined) {
      const existingRows = prepare(db, 'SELECT id, created_at FROM subtasks WHERE task_id = ?').all(id) as { id: string; created_at: string }[];
      const existingMap = new Map(existingRows.map(r => [r.id, r.created_at]));
      const incomingIds = new Set(data.subtasks.map(s => s.id));

      // Delete subtasks removed by user
      for (const row of existingRows) {
        if (!incomingIds.has(row.id)) {
          prepare(db, 'DELETE FROM subtasks WHERE id = ?').run(row.id);
        }
      }

      const upsert = prepare(db, `
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

export function incrementTaskActualTime(id: string, minutes: number): TaskWithRelations | undefined {
  const db = getDb();
  const task = getTaskLight(id);
  if (!task) return undefined;

  const { parseEstimateToMinutes, minutesToEstimate } = require('./utils');
  const currentMinutes = parseEstimateToMinutes(task.actualTime);
  const newActualTime = minutesToEstimate(currentMinutes + minutes);
  
  return updateTask(id, { actualTime: newActualTime });
}

export function deleteTask(id: string): void {
  const db = getDb();
  prepare(db, 'DELETE FROM tasks WHERE id = ?').run(id);
}
export function deleteTasksBatch(ids: string[]): void {
  if (ids.length === 0) return;
  const db = getDb();
  const deleteMany = db.transaction(() => {
    const stmt = prepare(db, 'DELETE FROM tasks WHERE id = ?');
    for (const id of ids) {
      stmt.run(id);
    }
  });
  deleteMany();
}


export function toggleTaskCompletion(id: string): TaskWithRelations | undefined {
  const db = getDb();
  const row = prepare(db, 'SELECT * FROM tasks WHERE id = ?').get(id) as Record<string, any> | undefined;
  if (!row) return undefined;
  const now = new Date().toISOString();
  const newCompleted = row.completed ? 0 : 1;

  const update = db.transaction(() => {
    prepare(db, `
      UPDATE tasks
      SET completed = ?,
          completed_at = CASE WHEN ? THEN ? ELSE NULL END,
          updated_at = ?
      WHERE id = ?
    `).run(newCompleted, newCompleted, now, now, id);
    logActivity(db, id, newCompleted ? 'completed' : 'uncompleted', 'completed', '', '');

    // Auto-generate next recurring task instance when completing
    if (newCompleted && row.recurrence) {
      const recurrence = JSON.parse(row.recurrence) as Recurrence;
      if (recurrence.type !== 'none') {
        const nextTask = createNextRecurrence(db, row, recurrence);
        if (nextTask) {
          logActivity(db, nextTask.id, 'created', 'recurrence', '', 'Auto-created from "' + row.name + '"');
        }
      }
    }
  });

  update();
  return getTask(id);
}

export function togglePinTask(id: string): TaskWithRelations | undefined {
  const db = getDb();
  const row = prepare(db, 'SELECT pinned FROM tasks WHERE id = ?').get(id) as { pinned: number } | undefined;
  if (!row) return undefined;
  const newPinned = row.pinned ? 0 : 1;
  prepare(db, 'UPDATE tasks SET pinned = ?, updated_at = datetime(\'now\') WHERE id = ?').run(newPinned, id);
  logActivity(db, id, newPinned ? 'pinned' : 'unpinned', 'pinned', '', '');
  return getTask(id);
}

function createNextRecurrence(db: Database.Database, row: Record<string, any>, recurrence: Recurrence): TaskWithRelations | undefined {
  const currentDate = new Date(row.date || new Date());
  let nextDate: Date | null = null;

  switch (recurrence.type) {
    case 'daily': {
      nextDate = new Date(currentDate);
      nextDate.setDate(nextDate.getDate() + (recurrence.interval || 1));
      break;
    }
    case 'weekdays': {
      nextDate = new Date(currentDate);
      do {
        nextDate.setDate(nextDate.getDate() + 1);
      } while (nextDate.getDay() === 0 || nextDate.getDay() === 6);
      break;
    }
    case 'weekly': {
      nextDate = new Date(currentDate);
      nextDate.setDate(nextDate.getDate() + 7 * (recurrence.interval || 1));
      break;
    }
    case 'monthly': {
      nextDate = new Date(currentDate);
      nextDate.setMonth(nextDate.getMonth() + (recurrence.interval || 1));
      break;
    }
    case 'yearly': {
      nextDate = new Date(currentDate);
      nextDate.setFullYear(nextDate.getFullYear() + (recurrence.interval || 1));
      break;
    }
  }

  if (!nextDate) return undefined;

  // Check end date
  if (recurrence.endDate) {
    const end = new Date(recurrence.endDate);
    if (nextDate > end) return undefined;
  }

  const now = new Date().toISOString();
  const nextId = generateId();
  const nextDateStr = nextDate.toISOString().split('T')[0];

  prepare(db, `
    INSERT INTO tasks (id, name, description, date, deadline, estimate, priority, list_id, recurrence, completed, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?)
  `).run(
    nextId,
    row.name,
    row.description,
    nextDateStr,
    null,
    row.estimate,
    row.priority,
    row.list_id,
    row.recurrence,
    now,
    now
  );

  // Copy labels
  const labelRows = prepare(db, 'SELECT label_id FROM task_labels WHERE task_id = ?').all(row.id) as { label_id: string }[];
  for (const lr of labelRows) {
    prepare(db, 'INSERT INTO task_labels (task_id, label_id) VALUES (?, ?)').run(nextId, lr.label_id);
  }

  // Copy subtasks
  const subtaskRows = prepare(db, 'SELECT * FROM subtasks WHERE task_id = ?').all(row.id) as any[];
  for (const st of subtaskRows) {
    const stId = generateId();
    prepare(db, 'INSERT INTO subtasks (id, task_id, title, completed, created_at) VALUES (?, ?, ?, 0, ?)').run(stId, nextId, st.title, now);
  }

  return getTask(nextId);
}

export function reorderSubtasks(taskId: string, subtaskIds: string[]): void {
  const db = getDb();
  const reorder = db.transaction(() => {
    const deleteAll = prepare(db, 'DELETE FROM subtasks WHERE task_id = ?');
    const existingRows = prepare(db, 'SELECT id, title, completed, created_at FROM subtasks WHERE task_id = ?').all(taskId) as { id: string; title: string; completed: number; created_at: string }[];
    const existingMap = new Map(existingRows.map(r => [r.id, r]));
    const insert = prepare(db, 'INSERT INTO subtasks (id, task_id, title, completed, created_at) VALUES (?, ?, ?, ?, ?)');
    
    // Delete all and re-insert in new order
    deleteAll.run(taskId);
    for (let i = 0; i < subtaskIds.length; i++) {
      const existing = existingMap.get(subtaskIds[i]);
      if (existing) {
        insert.run(existing.id, taskId, existing.title, existing.completed, existing.created_at);
      }
    }
  });
  reorder();
}
export function addSubtask(taskId: string, title: string): Subtask {
  const db = getDb();
  const id = generateId();
  const now = new Date().toISOString();
  prepare(db, 'INSERT INTO subtasks (id, task_id, title, created_at) VALUES (?, ?, ?, ?)').run(id, taskId, title, now);
  logActivity(db, taskId, 'add', 'subtask', '', title);
  return { id, taskId, title, completed: false, createdAt: now };
}

export function toggleSubtask(id: string): Subtask | undefined {
  const db = getDb();
  const row = prepare(db, 'SELECT * FROM subtasks WHERE id = ?').get(id) as any;
  if (!row) return undefined;
  const newCompleted = row.completed ? 0 : 1;
  prepare(db, 'UPDATE subtasks SET completed = ? WHERE id = ?').run(newCompleted, id);
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
  const row = prepare(db, 'SELECT task_id, title FROM subtasks WHERE id = ?').get(id) as { task_id: string; title: string } | undefined;
  if (row) {
    logActivity(db, row.task_id, 'delete', 'subtask', row.title, '');
  }
  prepare(db, 'DELETE FROM subtasks WHERE id = ?').run(id);
}

// --- Reminders ---
export function addReminder(taskId: string, time: string, type: Reminder['type'] = 'notification'): Reminder {
  const db = getDb();
  const id = generateId();
  prepare(db, 'INSERT INTO reminders (id, task_id, time, type) VALUES (?, ?, ?, ?)').run(id, taskId, time, type);
  return { id, taskId, time, type, sent: false };
}

export function deleteReminder(id: string): void {
  const db = getDb();
  prepare(db, 'DELETE FROM reminders WHERE id = ?').run(id);
}

// --- Labels on Tasks ---
export function addLabelToTask(taskId: string, labelId: string): void {
  const db = getDb();
  const label = getLabel(labelId);
  if (label) {
    prepare(db, 'INSERT OR IGNORE INTO task_labels (task_id, label_id) VALUES (?, ?)').run(taskId, labelId);
    logActivity(db, taskId, 'add_label', 'label', '', label.name);
  }
}

export function removeLabelFromTask(taskId: string, labelId: string): void {
  const db = getDb();
  const label = getLabel(labelId);
  if (label) {
    prepare(db, 'DELETE FROM task_labels WHERE task_id = ? AND label_id = ?').run(taskId, labelId);
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
  completedToday: number;
  completedThisWeek: number;
  streak: number;
  weeklyCompletions: { day: string; count: number }[];
} {
  const db = getDb();
  const now = new Date();
  const today = now.toISOString().split('T')[0];
  const end7 = new Date(now);
  end7.setDate(end7.getDate() + 6);
  const end7Str = end7.toISOString().split('T')[0];

  // Get start of week (Monday)
  const dayOfWeek = now.getDay();
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const weekStart = new Date(now);
  weekStart.setDate(weekStart.getDate() + mondayOffset);
  const weekStartStr = weekStart.toISOString().split('T')[0];

  // Single combined query using the composite index idx_tasks_completed_date
  const countRow = prepare(db, `
    SELECT
      COUNT(*) as total,
      SUM(CASE WHEN date = ? THEN 1 ELSE 0 END) as today,
      SUM(CASE WHEN date >= ? AND date IS NOT NULL THEN 1 ELSE 0 END) as upcoming,
      SUM(CASE WHEN date >= ? AND date <= ? THEN 1 ELSE 0 END) as next7
    FROM tasks WHERE completed = 0
  `).get(today, today, today, end7Str) as { total: number; today: number; upcoming: number; next7: number };

  // Completed today & this week
  const completedRow = prepare(db, `
    SELECT
      SUM(CASE WHEN DATE(completed_at) = ? THEN 1 ELSE 0 END) as completed_today,
      SUM(CASE WHEN DATE(completed_at) >= ? THEN 1 ELSE 0 END) as completed_week
    FROM tasks WHERE completed = 1
  `).get(today, weekStartStr) as { completed_today: number; completed_week: number };

  // Streak: count consecutive days with at least one completion going backwards from today
  let streak = 0;
  const checkDate = new Date(now);
  for (let i = 0; i < 365; i++) {
    const dateStr = checkDate.toISOString().split('T')[0];
    const dayCount = prepare(db, `SELECT COUNT(*) as c FROM tasks WHERE completed = 1 AND DATE(completed_at) = ?`).get(dateStr) as { c: number };
    if (dayCount.c > 0) {
      streak++;
    } else if (i > 0) {
      // Allow today to be incomplete and still count streak from yesterday
      break;
    }
    checkDate.setDate(checkDate.getDate() - 1);
  }

  // Weekly completions for chart (last 7 days)
  const weeklyCompletions: { day: string; count: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const dayStr = d.toISOString().split('T')[0];
    const dayLabel = d.toLocaleDateString('en-US', { weekday: 'short' });
    const dayCount = prepare(db, `SELECT COUNT(*) as c FROM tasks WHERE completed = 1 AND DATE(completed_at) = ?`).get(dayStr) as { c: number };
    weeklyCompletions.push({ day: dayLabel, count: dayCount.c });
  }

  const byListRows = prepare(db, 'SELECT list_id, COUNT(*) as c FROM tasks WHERE completed = 0 GROUP BY list_id').all() as { list_id: string; c: number }[];
  const byList: Record<string, number> = {};
  for (const row of byListRows) byList[row.list_id] = row.c;

  const byLabelRows = prepare(db, `
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
    completedToday: completedRow.completed_today,
    completedThisWeek: completedRow.completed_week,
    streak,
    weeklyCompletions,
  };
}

// --- Activity Logs ---
function logActivity(db: Database.Database, taskId: string, action: string, field: string, oldValue: string | null, newValue: string | null): void {
  const id = generateId();
  prepare(db, 'INSERT INTO activity_logs (id, task_id, action, field, old_value, new_value) VALUES (?, ?, ?, ?, ?, ?)')
    .run(id, taskId, action, field, oldValue, newValue);
}

export function getActivityLogs(taskId: string): ActivityLog[] {
  const db = getDb();
  return (prepare(db, 'SELECT * FROM activity_logs WHERE task_id = ? ORDER BY timestamp DESC').all(taskId) as any[]).map((row: any) => ({
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
  // Use FTS5 for full-text search with relevance ranking
  const searchTerms = query.trim().split(/\s+/).filter(Boolean).map(t => `"${t.replace(/"/g, '""')}"`).join(' ');
  let rows: Record<string, any>[];
  try {
    rows = prepare(db, `
      SELECT tasks.* FROM tasks
      JOIN tasks_fts ON tasks.rowid = tasks_fts.rowid
      WHERE tasks_fts MATCH ?
      ORDER BY rank
      LIMIT 50
    `).all(searchTerms) as Record<string, any>[];
  } catch {
    // Fallback to LIKE search if FTS5 query fails (e.g. special characters)
    const searchTerm = `%${query}%`;
    rows = prepare(db, `
      SELECT * FROM tasks 
      WHERE name LIKE ? OR description LIKE ? 
      ORDER BY 
        CASE 
          WHEN name LIKE ? THEN 0 
          WHEN description LIKE ? THEN 1 
          ELSE 2 
        END,
        completed ASC,
        pinned DESC,
        position ASC,
        created_at DESC
      LIMIT 50
    `).all(searchTerm, searchTerm, searchTerm, searchTerm) as Record<string, any>[];
  }

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

// --- Reordering ---
export function reorderTasks(ids: string[]): void {
  const db = getDb();
  const updatePosition = db.transaction(() => {
    const stmt = prepare(db, 'UPDATE tasks SET position = ?, updated_at = datetime(\'now\') WHERE id = ?');
    for (let i = 0; i < ids.length; i++) {
      stmt.run(i, ids[i]);
    }
  });
  updatePosition();
}
