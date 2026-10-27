import { afterAll, describe, expect, it } from 'vitest';
import { pool } from './db';
import { createEvent, listEventsForUser } from './events.repository';

afterAll(() => pool.end());

const movieNight = {
  title: 'Movie night',
  startsAt: '2026-01-16T19:00:00.000Z',
  endsAt: '2026-01-16T21:00:00.000Z',
  groupId: 'family',
  notes: null,
};

describe('events repository', () => {
  it('shows an event to every member of its group', async () => {
    const event = await createEvent(movieNight, 'dad');

    const momEvents = await listEventsForUser('mom');
    expect(momEvents.map((e) => e.id)).toContain(event.id);
  });

  it('does not show an event to users outside its group', async () => {
    const event = await createEvent(movieNight, 'dad');

    const coachEvents = await listEventsForUser('coach');
    expect(coachEvents.map((e) => e.id)).not.toContain(event.id);
  });

  it('AC-6: does not return an event of Soccer team to Dad', async () => {
    const practice = await createEvent({ ...movieNight, title: 'Practice', groupId: 'soccer' }, 'coach');

    const dadEvents = await listEventsForUser('dad');
    expect(dadEvents.map((e) => e.id)).not.toContain(practice.id);
  });
});
