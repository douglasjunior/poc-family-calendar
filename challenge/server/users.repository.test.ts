import { afterAll, describe, expect, it } from 'vitest';
import { pool } from './db';
import { listGroupsForUser } from './users.repository';

afterAll(() => pool.end());

describe('users repository', () => {
  it('AC-4: lists the members of each group sorted by name', async () => {
    const groups = await listGroupsForUser('son');

    const family = groups.find((group) => group.id === 'family');
    expect(family?.members.map((member) => member.name)).toEqual(['Dad', 'Mom', 'Son']);
  });

  it('returns only the groups the user belongs to', async () => {
    const groups = await listGroupsForUser('coach');

    expect(groups.map((group) => group.id)).toEqual(['soccer']);
  });
});
