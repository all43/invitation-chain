import { Router } from 'express';
import type { InvitationChain } from '@invitation-chain/lib';
import { seedDemoData } from './seed.js';

export function createRouter(chain: InvitationChain): Router {
  const router = Router();

  router.get('/api/users', (_req, res) => {
    res.json(chain.getAllUsers());
  });

  router.get('/api/tree', (_req, res) => {
    res.json(chain.getTree());
  });

  router.get('/api/users/:id', (req, res) => {
    const user = chain.getUser(req.params.id);
    if (!user) {
      res.status(404).json({ error: `User "${req.params.id}" not found` });
      return;
    }
    res.json(user);
  });

  router.get('/api/users/:id/ancestors', (req, res) => {
    try {
      res.json(chain.getAncestryChain(req.params.id));
    } catch (e: any) {
      res.status(404).json({ error: e.message });
    }
  });

  router.get('/api/users/:id/descendants', (req, res) => {
    try {
      res.json(chain.getDescendants(req.params.id));
    } catch (e: any) {
      res.status(404).json({ error: e.message });
    }
  });

  router.get('/api/users/:id/entry-point', (req, res) => {
    try {
      res.json(chain.findEntryPoint(req.params.id));
    } catch (e: any) {
      res.status(404).json({ error: e.message });
    }
  });

  router.post('/api/users', (req, res) => {
    try {
      const { userId } = req.body;
      if (!userId) {
        res.status(400).json({ error: 'userId is required' });
        return;
      }
      res.status(201).json(chain.addRoot(userId));
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  });

  router.post('/api/invitations', (req, res) => {
    try {
      const { userId, invitedBy, invitedAt } = req.body;
      if (!userId || !invitedBy) {
        res.status(400).json({ error: 'userId and invitedBy are required' });
        return;
      }
      res.status(201).json(chain.addInvitation({ userId, invitedBy, invitedAt }));
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  });

  router.post('/api/users/:id/ban', (req, res) => {
    try {
      res.json(chain.banUser(req.params.id));
    } catch (e: any) {
      res.status(404).json({ error: e.message });
    }
  });

  router.post('/api/users/:id/unban', (req, res) => {
    try {
      res.json(chain.unbanUser(req.params.id));
    } catch (e: any) {
      res.status(404).json({ error: e.message });
    }
  });

  router.post('/api/users/:id/ban-descendants', (req, res) => {
    try {
      res.json(chain.banWithDescendants(req.params.id));
    } catch (e: any) {
      res.status(404).json({ error: e.message });
    }
  });

  router.post('/api/users/:id/ban-after-date', (req, res) => {
    try {
      const { cutoffDate } = req.body;
      if (!cutoffDate) {
        res.status(400).json({ error: 'cutoffDate is required' });
        return;
      }
      res.json(chain.banDescendantsAfterDate(req.params.id, cutoffDate));
    } catch (e: any) {
      res.status(404).json({ error: e.message });
    }
  });

  router.post('/api/seed', (_req, res) => {
    const count = seedDemoData(chain);
    res.json({ ok: true, count });
  });

  router.post('/api/reset', (_req, res) => {
    chain.reset();
    res.json({ ok: true });
  });

  return router;
}
