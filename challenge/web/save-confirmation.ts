import type { GroupWithMembers } from '../shared/types';

export function formatSaveConfirmation(group: GroupWithMembers): string {
  const names = group.members.map((member) => member.name).join(', ');
  return `Added to ${group.name} · visible to ${names}`;
}
