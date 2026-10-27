import type { GroupWithMembers, User } from '../shared/types';
import { pool } from './db';

export async function listUsers(): Promise<User[]> {
  const { rows } = await pool.query<User>('SELECT id, name FROM users ORDER BY name');
  return rows;
}

export async function findUser(id: string): Promise<User | undefined> {
  const { rows } = await pool.query<User>('SELECT id, name FROM users WHERE id = $1', [id]);
  return rows[0];
}

export async function listGroupsForUser(userId: string): Promise<GroupWithMembers[]> {
  const { rows } = await pool.query<GroupWithMembers>(
    `SELECT g.id, g.name, g.color,
            (SELECT json_agg(json_build_object('id', u.id, 'name', u.name) ORDER BY u.name)
               FROM group_members gm
               JOIN users u ON u.id = gm.user_id
              WHERE gm.group_id = g.id) AS members
       FROM groups g
       JOIN group_members m ON m.group_id = g.id
      WHERE m.user_id = $1
      ORDER BY g.name`,
    [userId],
  );
  return rows;
}

export async function isMember(userId: string, groupId: string): Promise<boolean> {
  const { rowCount } = await pool.query(
    'SELECT 1 FROM group_members WHERE user_id = $1 AND group_id = $2',
    [userId, groupId],
  );
  return rowCount === 1;
}
