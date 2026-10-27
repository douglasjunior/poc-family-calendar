import { describe, expect, it } from 'vitest';
import type { Group } from '../shared/types';
import { GROUP_REQUIRED, initialGroupId, validateGroupChoice } from './group-choice';

const family: Group = { id: 'family', name: 'Family', color: '#000' };
const soccer: Group = { id: 'soccer', name: 'Soccer team', color: '#111' };

describe('group choice', () => {
  it('AC-1: preselects nothing for a user with several groups', () => {
    expect(initialGroupId([family, soccer])).toBe('');
  });

  it('AC-3: preselects the only group of a single-group user', () => {
    expect(initialGroupId([soccer])).toBe('soccer');
  });

  it('AC-1: preselects nothing for a user with no groups', () => {
    expect(initialGroupId([])).toBe('');
  });

  it('AC-2: rejects an empty group with "Group is required"', () => {
    expect(validateGroupChoice('')).toBe(GROUP_REQUIRED);
    expect(GROUP_REQUIRED).toBe('Group is required');
  });

  it('AC-2: accepts a chosen group', () => {
    expect(validateGroupChoice('family')).toBeNull();
  });
});
