import { describe, expect, it } from 'vitest';
import type { GroupWithMembers } from '../shared/types';
import { formatSaveConfirmation } from './save-confirmation';

const family: GroupWithMembers = {
  id: 'family',
  name: 'Family',
  color: '#000',
  members: [
    { id: 'dad', name: 'Dad' },
    { id: 'mom', name: 'Mom' },
    { id: 'son', name: 'Son' },
  ],
};

describe('save confirmation', () => {
  it('AC-4: names the group and the people who can see the event', () => {
    expect(formatSaveConfirmation(family)).toBe('Added to Family · visible to Dad, Mom, Son');
  });

  it('AC-4: lists a single member alone', () => {
    const solo = { ...family, members: [{ id: 'mom', name: 'Mom' }] };
    expect(formatSaveConfirmation(solo)).toBe('Added to Family · visible to Mom');
  });
});
