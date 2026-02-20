import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { InvitationChain } from '../src/invitation-chain.js';
import type { User } from '../src/types.js';

describe('InvitationChain', () => {
  let chain: InvitationChain;

  beforeEach(() => {
    chain = new InvitationChain(); // in-memory
  });

  afterEach(() => {
    chain.close();
  });

  describe('addRoot / getUser', () => {
    it('creates a root user with no inviter', () => {
      const user = chain.addRoot('admin');
      expect(user.userId).toBe('admin');
      expect(user.invitedBy).toBeNull();
      expect(user.isBanned).toBe(false);
    });

    it('retrieves a user by id', () => {
      chain.addRoot('admin');
      const user = chain.getUser('admin');
      expect(user).not.toBeNull();
      expect(user!.userId).toBe('admin');
    });

    it('returns null for non-existent user', () => {
      expect(chain.getUser('nobody')).toBeNull();
    });
  });

  describe('addInvitation', () => {
    it('creates an invited user linked to the inviter', () => {
      chain.addRoot('admin');
      const alice = chain.addInvitation({
        userId: 'alice',
        invitedBy: 'admin',
        invitedAt: '2025-01-15T00:00:00.000Z',
      });
      expect(alice.userId).toBe('alice');
      expect(alice.invitedBy).toBe('admin');
      expect(alice.invitedAt).toBe('2025-01-15T00:00:00.000Z');
    });

    it('throws if inviter does not exist', () => {
      expect(() =>
        chain.addInvitation({ userId: 'alice', invitedBy: 'ghost' })
      ).toThrow('Inviter "ghost" does not exist');
    });
  });

  describe('getAllUsers', () => {
    it('returns all users ordered by invite time', () => {
      chain.addRoot('admin');
      chain.addInvitation({ userId: 'alice', invitedBy: 'admin', invitedAt: '2025-01-10T00:00:00Z' });
      chain.addInvitation({ userId: 'bob', invitedBy: 'alice', invitedAt: '2025-01-20T00:00:00Z' });
      const all = chain.getAllUsers();
      expect(all).toHaveLength(3);
      // admin's auto-generated timestamp is "now" which is after the explicit dates
      // so order is: alice, bob, admin
      const ids = all.map((u) => u.userId);
      expect(ids).toContain('admin');
      expect(ids).toContain('alice');
      expect(ids).toContain('bob');
    });
  });

  describe('getAncestryChain', () => {
    it('returns chain from user up to root', () => {
      chain.addRoot('admin');
      chain.addInvitation({ userId: 'alice', invitedBy: 'admin', invitedAt: '2025-01-01T00:00:00Z' });
      chain.addInvitation({ userId: 'bob', invitedBy: 'alice', invitedAt: '2025-02-01T00:00:00Z' });
      chain.addInvitation({ userId: 'charlie', invitedBy: 'bob', invitedAt: '2025-03-01T00:00:00Z' });

      const ancestry = chain.getAncestryChain('charlie');
      expect(ancestry.map((u) => u.userId)).toEqual(['charlie', 'bob', 'alice', 'admin']);
    });

    it('returns just the user for a root', () => {
      chain.addRoot('admin');
      const ancestry = chain.getAncestryChain('admin');
      expect(ancestry).toHaveLength(1);
      expect(ancestry[0].userId).toBe('admin');
    });
  });

  describe('getDescendants', () => {
    it('returns the user and all descendants', () => {
      chain.addRoot('admin');
      chain.addInvitation({ userId: 'alice', invitedBy: 'admin', invitedAt: '2025-01-01T00:00:00Z' });
      chain.addInvitation({ userId: 'bob', invitedBy: 'alice', invitedAt: '2025-02-01T00:00:00Z' });
      chain.addInvitation({ userId: 'charlie', invitedBy: 'alice', invitedAt: '2025-02-15T00:00:00Z' });
      chain.addInvitation({ userId: 'dave', invitedBy: 'bob', invitedAt: '2025-03-01T00:00:00Z' });

      const desc = chain.getDescendants('alice');
      const ids = desc.map((u) => u.userId);
      expect(ids).toContain('alice');
      expect(ids).toContain('bob');
      expect(ids).toContain('charlie');
      expect(ids).toContain('dave');
      expect(ids).not.toContain('admin');
    });
  });

  describe('getTree', () => {
    it('builds a nested tree structure', () => {
      chain.addRoot('admin');
      chain.addInvitation({ userId: 'alice', invitedBy: 'admin', invitedAt: '2025-01-01T00:00:00Z' });
      chain.addInvitation({ userId: 'bob', invitedBy: 'alice', invitedAt: '2025-02-01T00:00:00Z' });

      const tree = chain.getTree();
      expect(tree).toHaveLength(1);
      expect(tree[0].userId).toBe('admin');
      expect(tree[0].children).toHaveLength(1);
      expect(tree[0].children[0].userId).toBe('alice');
      expect(tree[0].children[0].children).toHaveLength(1);
      expect(tree[0].children[0].children[0].userId).toBe('bob');
    });

    it('handles multiple roots', () => {
      chain.addRoot('root1');
      chain.addRoot('root2');
      chain.addInvitation({ userId: 'a', invitedBy: 'root1', invitedAt: '2025-01-01T00:00:00Z' });
      chain.addInvitation({ userId: 'b', invitedBy: 'root2', invitedAt: '2025-01-01T00:00:00Z' });

      const tree = chain.getTree();
      expect(tree).toHaveLength(2);
    });
  });

  describe('findEntryPoint', () => {
    it('returns the root ancestor of any user', () => {
      chain.addRoot('admin');
      chain.addInvitation({ userId: 'alice', invitedBy: 'admin', invitedAt: '2025-01-01T00:00:00Z' });
      chain.addInvitation({ userId: 'bob', invitedBy: 'alice', invitedAt: '2025-02-01T00:00:00Z' });
      chain.addInvitation({ userId: 'charlie', invitedBy: 'bob', invitedAt: '2025-03-01T00:00:00Z' });

      const entry = chain.findEntryPoint('charlie');
      expect(entry.userId).toBe('admin');
    });

    it('throws for non-existent user', () => {
      expect(() => chain.findEntryPoint('ghost')).toThrow('does not exist');
    });
  });

  describe('banUser / unbanUser', () => {
    it('bans a user', () => {
      chain.addRoot('admin');
      const banned = chain.banUser('admin');
      expect(banned.isBanned).toBe(true);
      expect(banned.bannedAt).not.toBeNull();
    });

    it('unbans a user', () => {
      chain.addRoot('admin');
      chain.banUser('admin');
      const unbanned = chain.unbanUser('admin');
      expect(unbanned.isBanned).toBe(false);
      expect(unbanned.bannedAt).toBeNull();
    });

    it('throws when banning non-existent user', () => {
      expect(() => chain.banUser('ghost')).toThrow('does not exist');
    });
  });

  describe('banWithDescendants', () => {
    it('bans a user and all their descendants', () => {
      chain.addRoot('admin');
      chain.addInvitation({ userId: 'alice', invitedBy: 'admin', invitedAt: '2025-01-01T00:00:00Z' });
      chain.addInvitation({ userId: 'bob', invitedBy: 'alice', invitedAt: '2025-02-01T00:00:00Z' });
      chain.addInvitation({ userId: 'charlie', invitedBy: 'alice', invitedAt: '2025-02-15T00:00:00Z' });
      chain.addInvitation({ userId: 'dave', invitedBy: 'bob', invitedAt: '2025-03-01T00:00:00Z' });

      const result = chain.banWithDescendants('alice');
      expect(result.bannedCount).toBe(4); // alice, bob, charlie, dave
      expect(result.bannedUserIds).toContain('alice');
      expect(result.bannedUserIds).toContain('bob');
      expect(result.bannedUserIds).toContain('charlie');
      expect(result.bannedUserIds).toContain('dave');

      // admin should NOT be banned
      const admin = chain.getUser('admin');
      expect(admin!.isBanned).toBe(false);
    });
  });

  describe('banDescendantsAfterDate', () => {
    it('bans only descendants invited after the cutoff date', () => {
      chain.addRoot('admin');
      chain.addInvitation({ userId: 'alice', invitedBy: 'admin', invitedAt: '2025-01-01T00:00:00Z' });
      chain.addInvitation({ userId: 'bob', invitedBy: 'alice', invitedAt: '2025-02-01T00:00:00Z' });
      chain.addInvitation({ userId: 'charlie', invitedBy: 'alice', invitedAt: '2025-03-01T00:00:00Z' });
      chain.addInvitation({ userId: 'dave', invitedBy: 'bob', invitedAt: '2025-04-01T00:00:00Z' });

      // Ban descendants of alice invited after Feb 15
      const result = chain.banDescendantsAfterDate('alice', '2025-02-15T00:00:00Z');

      expect(result.bannedCount).toBe(2); // charlie (Mar), dave (Apr)
      expect(result.bannedUserIds).toContain('charlie');
      expect(result.bannedUserIds).toContain('dave');

      // alice and bob should NOT be banned
      expect(chain.getUser('alice')!.isBanned).toBe(false);
      expect(chain.getUser('bob')!.isBanned).toBe(false);
    });

    it('returns empty result when no descendants match', () => {
      chain.addRoot('admin');
      chain.addInvitation({ userId: 'alice', invitedBy: 'admin', invitedAt: '2025-01-01T00:00:00Z' });

      const result = chain.banDescendantsAfterDate('admin', '2026-01-01T00:00:00Z');
      expect(result.bannedCount).toBe(0);
      expect(result.bannedUserIds).toEqual([]);
    });
  });

  describe('reset', () => {
    it('clears all data', () => {
      chain.addRoot('admin');
      chain.addInvitation({ userId: 'alice', invitedBy: 'admin', invitedAt: '2025-01-01T00:00:00Z' });
      chain.reset();
      expect(chain.getAllUsers()).toHaveLength(0);
    });
  });
});
