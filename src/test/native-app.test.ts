import { describe, expect, it } from 'vitest';
import { backButtonAction } from '@/lib/native/back-button';
import { buildNativeAuthCallback, parseNativeAuthCallback } from '@/lib/native/auth-callback';
import { applyOp, withPending, type FeatureData } from '@/lib/sync-model';
import { defaultPreferences } from '@/lib/reminder-model';
import { notificationId, upcomingReminders } from '@/lib/reminder-schedule';
import type { PrayerHistory } from '@/lib/activity-analytics';

const STATE = 'a'.repeat(32);
const base = (): FeatureData => ({ completions: [], preferences: defaultPreferences, joined: '2026-10-01', prayers: {}, timezone: 'Asia/Kolkata', todos: [], tasks: [] });
const todo = { id: '11111111-1111-4111-8111-111111111111', title: 'Read', priority: 'Low' as const, due: '', time: '', completed: false };

describe('Android back button', () => {
 it('closes an open sheet first', () => expect(backButtonAction({ path: '/todos', canGoBack: true, dialogOpen: true })).toBe('close-dialog'));
 it('leaves the app from the home screen', () => expect(backButtonAction({ path: '/dashboard', canGoBack: true, dialogOpen: false })).toBe('exit'));
 it('goes back from inner screens', () => expect(backButtonAction({ path: '/tasks/new', canGoBack: true, dialogOpen: false })).toBe('back'));
 it('returns home when there is no history', () => expect(backButtonAction({ path: '/profile', canGoBack: false, dialogOpen: false })).toBe('home'));
});

describe('Google sign-in hand-back', () => {
 it('accepts tokens only with the state this app created', () => {
  const url = buildNativeAuthCallback({ state: STATE, access_token: 'at', refresh_token: 'rt' });
  expect(parseNativeAuthCallback(url, STATE)).toEqual({ kind: 'tokens', access_token: 'at', refresh_token: 'rt' });
  expect(parseNativeAuthCallback(url, 'b'.repeat(32)).kind).toBe('error');
  expect(parseNativeAuthCallback('https://evil.example/#access_token=x', STATE).kind).toBe('ignore');
 });
});

describe('Changes saved on the phone', () => {
 it('a to-do completed offline counts toward today', () => {
  const added = applyOp(base(), { id: 'o1', kind: 'todo', todo }, '2026-11-03', '2026-11-03T08:00:00Z');
  const done = applyOp(added, { id: 'o2', kind: 'todo', todo: { ...todo, completed: true } }, '2026-11-03', '2026-11-03T09:00:00Z');
  expect(done.todos).toHaveLength(1);
  expect(done.completions).toEqual([{ day: '2026-11-03', kind: 'todo', entity_id: todo.id }]);
 });
 it('a prayer marked offline keeps its earlier note', () => {
  const noted = applyOp(base(), { id: 'p1', kind: 'prayer', date: '2026-11-03', name: 'Fajr', patch: { note: 'Peaceful' } }, '2026-11-03', '');
  const prayed = applyOp(noted, { id: 'p2', kind: 'prayer', date: '2026-11-03', name: 'Fajr', patch: { status: 'Completed' } }, '2026-11-03', '');
  expect(prayed.prayers['2026-11-03']?.Fajr).toEqual({ status: 'Completed', note: 'Peaceful' });
 });
 it('unsent changes are applied on top of fresh server data', () => {
  const merged = withPending(base(), [{ id: 'o1', kind: 'todo', todo }, { id: 'o2', kind: 'deleteTodo', todoId: todo.id }], '2026-11-03', '');
  expect(merged.todos).toEqual([]);
 });
 it('completing a task completes its subtasks', () => {
  const task = { id: '22222222-2222-4222-8222-222222222222', title: 'Plan', description: '', priority: 'High' as const, due: '', category: 'Work' as const, project: '', status: 'Completed' as const, subtasks: [{ id: '33333333-3333-4333-8333-333333333333', title: 'a', completed: false }], created: '', updated: '' };
  const next = applyOp(base(), { id: 't', kind: 'task', task }, '2026-11-03', '2026-11-03T10:00:00Z');
  expect(next.tasks[0]?.subtasks[0]?.completed).toBe(true);
  expect(next.completions).toHaveLength(1);
 });
});

describe('On-device reminders', () => {
 const prefs = { ...defaultPreferences, latitude: 28.6139, longitude: 77.209 };
 const now = new Date('2026-11-03T00:30:00Z'); // 06:00 in Delhi
 it('schedules prayers with the chosen minutes before, and skips completed ones', () => {
  const custom = { ...prefs, settings: { ...prefs.settings, prayers: { ...prefs.settings.prayers, Dhuhr: { enabled: true, offset: 'Custom' as const, minutes: 30 } } } };
  const prayers: PrayerHistory = { '2026-11-03': { Fajr: { status: 'Completed', note: '' } } };
  const events = upcomingReminders({ preferences: custom, timezone: 'Asia/Kolkata', prayers, completions: [], now, days: 0 });
  expect(events.some(e => e.key === '2026-11-03:prayer:Fajr')).toBe(false);
  const dhuhr = events.find(e => e.key === '2026-11-03:prayer:Dhuhr');
  expect(dhuhr?.body).toBe('Dhuhr begins in 30 minutes.');
  expect(events.find(e => e.key === '2026-11-03:prayer:Asr')?.body).toBe('Asr begins in 15 minutes.');
 });
 it('adds the daily task reminder at the chosen time in the account timezone', () => {
  const events = upcomingReminders({ preferences: prefs, timezone: 'Asia/Kolkata', prayers: {}, completions: [], now, days: 0 });
  expect(events.find(e => e.key === '2026-11-03:tasks')?.at.toISOString()).toBe('2026-11-03T03:30:00.000Z');
  expect(events.find(e => e.key === '2026-11-03:check-in')?.at.toISOString()).toBe('2026-11-03T15:30:00.000Z');
 });
 it('needs a location for prayer reminders', () => {
  const events = upcomingReminders({ preferences: defaultPreferences, timezone: 'Asia/Kolkata', prayers: {}, completions: [], now });
  expect(events.some(e => e.key.includes(':prayer:'))).toBe(false);
 });
 it('celebrates a 7-day streak once the day is complete', () => {
  const prayers: PrayerHistory = {}; const completions: { day: string; kind: string; entity_id: string }[] = [];
  const days = ['2026-10-28', '2026-10-29', '2026-10-30', '2026-10-31', '2026-11-01', '2026-11-02', '2026-11-03'];
  for (const day of days) {
   prayers[day] = { Fajr: { status: 'Completed', note: '' }, Dhuhr: { status: 'Completed', note: '' }, Asr: { status: 'Completed', note: '' }, Maghrib: { status: 'Completed', note: '' }, Isha: { status: 'Completed', note: '' } };
   completions.push({ day, kind: 'todo', entity_id: day });
  }
  const events = upcomingReminders({ preferences: prefs, timezone: 'Asia/Kolkata', prayers, completions, now });
  expect(events.find(e => e.key === 'milestone:7:2026-11-03')?.title).toBe('🔥 7-Day Streak!');
  expect(events.some(e => e.key === '2026-11-03:check-in')).toBe(false);
 });
 it('gives each reminder a stable notification id', () => {
  expect(notificationId('2026-11-03:tasks')).toBe(notificationId('2026-11-03:tasks'));
  expect(notificationId('a')).not.toBe(notificationId('b'));
  expect(notificationId('x')).toBeGreaterThan(0);
 });
});
