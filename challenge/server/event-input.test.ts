import { describe, expect, it } from 'vitest';
import { parseEventInput } from './event-input';

const valid = {
  title: 'Dentist',
  startsAt: '2026-01-16T19:00:00.000Z',
  endsAt: '2026-01-16T20:00:00.000Z',
  groupId: 'family',
  notes: null,
};

describe('parseEventInput', () => {
  it('AC-2: rejects a missing group with "Group is required"', () => {
    expect(parseEventInput({ ...valid, groupId: undefined })).toBe('Group is required');
  });

  it('AC-2: rejects an empty group with "Group is required"', () => {
    expect(parseEventInput({ ...valid, groupId: '' })).toBe('Group is required');
  });

  it('AC-1: accepts an input with a chosen group', () => {
    expect(parseEventInput(valid)).toEqual(valid);
  });
});
