// Pure rules for the packaged app's on-device copy: how a queued change updates the local data.
import type { PrayerName, PrayerRecord, Todo, Task } from './feature-model';
import type { Completion, PrayerHistory } from './activity-analytics';
import type { Preferences } from './reminder-model';

export type FeatureData = {
 completions: Completion[];
 preferences: Preferences;
 joined: string;
 prayers: PrayerHistory;
 timezone: string;
 todos: Todo[];
 tasks: Task[];
};

export type SyncOp =
 | { id: string; kind: 'prayer'; date: string; name: PrayerName; patch: Partial<PrayerRecord> }
 | { id: string; kind: 'todo'; todo: Todo }
 | { id: string; kind: 'deleteTodo'; todoId: string }
 | { id: string; kind: 'reorder'; ids: string[] }
 | { id: string; kind: 'task'; task: Task }
 | { id: string; kind: 'deleteTask'; taskId: string }
 | { id: string; kind: 'preferences'; preferences: Preferences }
 | { id: string; kind: 'profile'; name: string; timezone: string; language: 'English' | 'Arabic' | 'Both' };

function addCompletion(list: Completion[], day: string, kind: 'todo' | 'task', id: string): Completion[] {
 if (!day || list.some(c => c.day === day && c.kind === kind && c.entity_id === id)) return list;
 return [...list, { day, kind, entity_id: id }];
}

/** Applies one queued change to the local copy; `today` is the account's current date, `now` an ISO time. */
export function applyOp(data: FeatureData, op: SyncOp, today: string, now: string): FeatureData {
 switch (op.kind) {
  case 'prayer': {
   const day = { ...(data.prayers[op.date] ?? {}) };
   const existing = day[op.name];
   day[op.name] = { status: op.patch.status ?? existing?.status ?? 'Pending', note: op.patch.note ?? existing?.note ?? '' };
   return { ...data, prayers: { ...data.prayers, [op.date]: day } };
  }
  case 'todo': {
   const previous = data.todos.find(t => t.id === op.todo.id);
   const todos = previous ? data.todos.map(t => (t.id === op.todo.id ? op.todo : t)) : [...data.todos, op.todo];
   const completions = op.todo.completed && !previous?.completed ? addCompletion(data.completions, today, 'todo', op.todo.id) : data.completions;
   return { ...data, todos, completions };
  }
  case 'deleteTodo':
   return { ...data, todos: data.todos.filter(t => t.id !== op.todoId) };
  case 'reorder': {
   const order = new Map(op.ids.map((id, i) => [id, i]));
   const todos = [...data.todos].sort((a, b) => (order.get(a.id) ?? Infinity) - (order.get(b.id) ?? Infinity));
   return { ...data, todos };
  }
  case 'task': {
   const previous = data.tasks.find(t => t.id === op.task.id);
   const done = op.task.status === 'Completed';
   const task: Task = { ...op.task, created: previous?.created ?? (op.task.created || now), updated: now, subtasks: done ? op.task.subtasks.map(s => ({ ...s, completed: true })) : op.task.subtasks };
   const tasks = previous ? data.tasks.map(t => (t.id === task.id ? task : t)) : [task, ...data.tasks];
   const completions = done && previous?.status !== 'Completed' ? addCompletion(data.completions, today, 'task', task.id) : data.completions;
   return { ...data, tasks, completions };
  }
  case 'deleteTask':
   return { ...data, tasks: data.tasks.filter(t => t.id !== op.taskId) };
  case 'preferences':
   return { ...data, preferences: op.preferences };
  case 'profile':
   return { ...data, timezone: op.timezone };
 }
}

/** Server data with every still-unsent change from this phone applied on top. */
export function withPending(data: FeatureData, ops: SyncOp[], today: string, now: string): FeatureData {
 return ops.reduce((current, op) => applyOp(current, op, today, now), data);
}
