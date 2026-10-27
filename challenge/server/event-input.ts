import type { EventInput } from '../shared/types';

// Returns the validated input, or an error message.
export function parseEventInput(body: unknown): EventInput | string {
  const { title, startsAt, endsAt, groupId, notes } = (body ?? {}) as Record<string, unknown>;

  if (typeof title !== 'string' || title.trim() === '') return 'Title is required';
  if (typeof groupId !== 'string' || groupId === '') return 'Group is required';
  if (typeof startsAt !== 'string' || Number.isNaN(Date.parse(startsAt))) return 'Invalid start';
  if (typeof endsAt !== 'string' || Number.isNaN(Date.parse(endsAt))) return 'Invalid end';
  if (Date.parse(endsAt) <= Date.parse(startsAt)) return 'End must be after start';
  if (notes != null && typeof notes !== 'string') return 'Invalid notes';

  return {
    title: title.trim(),
    startsAt,
    endsAt,
    groupId,
    notes: notes?.trim() || null,
  };
}
