import express, { type NextFunction, type Request, type Response } from 'express';
import { parseEventInput } from './event-input';
import * as events from './events.repository';
import * as users from './users.repository';

const PORT = 3001;

const app = express();
app.use(express.json());

// There is no auth: the acting user comes from the `?user=` query param.
function currentUserId(req: Request): string {
  return String(req.query.user ?? '');
}

app.get('/api/users', async (_req, res) => {
  res.json(await users.listUsers());
});

app.get('/api/me', async (req, res) => {
  const user = await users.findUser(currentUserId(req));
  if (!user) {
    res.status(404).json({ error: 'Unknown user' });
    return;
  }
  res.json({ user, groups: await users.listGroupsForUser(user.id) });
});

app.get('/api/events', async (req, res) => {
  res.json(await events.listEventsForUser(currentUserId(req)));
});

app.post('/api/events', async (req, res) => {
  const userId = currentUserId(req);
  const input = parseEventInput(req.body);
  if (typeof input === 'string') {
    res.status(400).json({ error: input });
    return;
  }
  if (!(await users.isMember(userId, input.groupId))) {
    res.status(403).json({ error: 'You are not a member of this group' });
    return;
  }
  res.status(201).json(await events.createEvent(input, userId));
});

app.patch('/api/events/:id', async (req, res) => {
  const userId = currentUserId(req);
  const existing = await events.findEvent(Number(req.params.id));
  if (!existing || !(await users.isMember(userId, existing.groupId))) {
    res.status(404).json({ error: 'Event not found' });
    return;
  }
  const input = parseEventInput(req.body);
  if (typeof input === 'string') {
    res.status(400).json({ error: input });
    return;
  }
  if (!(await users.isMember(userId, input.groupId))) {
    res.status(403).json({ error: 'You are not a member of this group' });
    return;
  }
  res.json(await events.updateEvent(existing.id, input));
});

app.delete('/api/events/:id', async (req, res) => {
  const existing = await events.findEvent(Number(req.params.id));
  if (!existing || !(await users.isMember(currentUserId(req), existing.groupId))) {
    res.status(404).json({ error: 'Event not found' });
    return;
  }
  await events.deleteEvent(existing.id);
  res.status(204).end();
});

app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error(err);
  res.status(500).json({ error: 'Something went wrong' });
});

app.listen(PORT, () => {
  console.log(`API listening on http://localhost:${PORT}`);
});
