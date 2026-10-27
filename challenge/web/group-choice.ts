import type { Group } from '../shared/types';

export const GROUP_REQUIRED = 'Group is required';

// Only a user with a single group gets one preselected: with several, past events must not decide.
export function initialGroupId(groups: Group[]): string {
  return groups.length === 1 ? groups[0].id : '';
}

export function validateGroupChoice(groupId: string): string | null {
  return groupId === '' ? GROUP_REQUIRED : null;
}
