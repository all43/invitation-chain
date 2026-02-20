import type Database from 'better-sqlite3';
import { openDatabase } from './db.js';
import {
  INSERT_USER,
  SELECT_USER,
  SELECT_ALL_USERS,
  ANCESTORS_CTE,
  DESCENDANTS_CTE,
  DESCENDANTS_AFTER_DATE_CTE,
  BAN_USER,
  UNBAN_USER,
  BAN_USERS_BY_IDS,
  UNBAN_USERS_BY_IDS,
  DROP_TABLE,
} from './queries.js';
import type { User, TreeNode, InvitationInput, BanResult } from './types.js';

interface UserRow {
  user_id: string;
  invited_by: string | null;
  invited_at: string;
  is_banned: number;
  banned_at: string | null;
}

function rowToUser(row: UserRow): User {
  return {
    userId: row.user_id,
    invitedBy: row.invited_by,
    invitedAt: row.invited_at,
    isBanned: row.is_banned === 1,
    bannedAt: row.banned_at,
  };
}

export class InvitationChain {
  private db: Database.Database;

  constructor(dbPath?: string) {
    this.db = openDatabase(dbPath);
  }

  addRoot(userId: string): User {
    const now = new Date().toISOString();
    this.db.prepare(INSERT_USER).run(userId, null, now);
    return this.getUser(userId)!;
  }

  addInvitation(input: InvitationInput): User {
    const invitedAt = input.invitedAt ?? new Date().toISOString();
    const inviter = this.getUser(input.invitedBy);
    if (!inviter) {
      throw new Error(`Inviter "${input.invitedBy}" does not exist`);
    }
    this.db.prepare(INSERT_USER).run(input.userId, input.invitedBy, invitedAt);
    return this.getUser(input.userId)!;
  }

  getUser(userId: string): User | null {
    const row = this.db.prepare(SELECT_USER).get(userId) as UserRow | undefined;
    return row ? rowToUser(row) : null;
  }

  getAllUsers(): User[] {
    const rows = this.db.prepare(SELECT_ALL_USERS).all() as UserRow[];
    return rows.map(rowToUser);
  }

  getAncestryChain(userId: string): User[] {
    const rows = this.db.prepare(ANCESTORS_CTE).all(userId) as UserRow[];
    return rows.map(rowToUser);
  }

  getDescendants(userId: string): User[] {
    const rows = this.db.prepare(DESCENDANTS_CTE).all(userId) as UserRow[];
    return rows.map(rowToUser);
  }

  getTree(): TreeNode[] {
    const users = this.getAllUsers();
    const nodeMap = new Map<string, TreeNode>();

    for (const user of users) {
      nodeMap.set(user.userId, { ...user, children: [] });
    }

    const roots: TreeNode[] = [];
    for (const node of nodeMap.values()) {
      if (node.invitedBy === null) {
        roots.push(node);
      } else {
        const parent = nodeMap.get(node.invitedBy);
        if (parent) {
          parent.children.push(node);
        }
      }
    }

    return roots;
  }

  findEntryPoint(userId: string): User {
    const chain = this.getAncestryChain(userId);
    if (chain.length === 0) {
      throw new Error(`User "${userId}" does not exist`);
    }
    return chain[chain.length - 1];
  }

  banUser(userId: string): User {
    const now = new Date().toISOString();
    const result = this.db.prepare(BAN_USER).run(now, userId);
    if (result.changes === 0) {
      throw new Error(`User "${userId}" does not exist`);
    }
    return this.getUser(userId)!;
  }

  unbanUser(userId: string): User {
    const result = this.db.prepare(UNBAN_USER).run(userId);
    if (result.changes === 0) {
      throw new Error(`User "${userId}" does not exist`);
    }
    return this.getUser(userId)!;
  }

  banWithDescendants(userId: string): BanResult {
    const descendants = this.getDescendants(userId);
    if (descendants.length === 0) {
      throw new Error(`User "${userId}" does not exist`);
    }

    const ids = descendants.map((u) => u.userId);
    const now = new Date().toISOString();

    const banMany = this.db.transaction((userIds: string[]) => {
      const stmt = this.db.prepare(BAN_USERS_BY_IDS(userIds.length));
      stmt.run(now, ...userIds);
    });
    banMany(ids);

    return { bannedCount: ids.length, bannedUserIds: ids };
  }

  unbanWithDescendants(userId: string): BanResult {
    const descendants = this.getDescendants(userId);
    if (descendants.length === 0) {
      throw new Error(`User "${userId}" does not exist`);
    }

    const ids = descendants.filter((u) => u.isBanned).map((u) => u.userId);

    if (ids.length === 0) {
      return { bannedCount: 0, bannedUserIds: [] };
    }

    const unbanMany = this.db.transaction((userIds: string[]) => {
      const stmt = this.db.prepare(UNBAN_USERS_BY_IDS(userIds.length));
      stmt.run(...userIds);
    });
    unbanMany(ids);

    return { bannedCount: ids.length, bannedUserIds: ids };
  }

  banDescendantsAfterDate(userId: string, cutoffDate: string): BanResult {
    const user = this.getUser(userId);
    if (!user) {
      throw new Error(`User "${userId}" does not exist`);
    }

    const rows = this.db
      .prepare(DESCENDANTS_AFTER_DATE_CTE)
      .all(userId, cutoffDate) as UserRow[];
    const ids = rows.map((r) => r.user_id);

    if (ids.length === 0) {
      return { bannedCount: 0, bannedUserIds: [] };
    }

    const now = new Date().toISOString();
    const banMany = this.db.transaction((userIds: string[]) => {
      const stmt = this.db.prepare(BAN_USERS_BY_IDS(userIds.length));
      stmt.run(now, ...userIds);
    });
    banMany(ids);

    return { bannedCount: ids.length, bannedUserIds: ids };
  }

  reset(): void {
    this.db.exec(DROP_TABLE);
    this.db.exec(
      `CREATE TABLE IF NOT EXISTS users (
        user_id TEXT PRIMARY KEY,
        invited_by TEXT,
        invited_at TEXT NOT NULL,
        is_banned INTEGER NOT NULL DEFAULT 0,
        banned_at TEXT,
        FOREIGN KEY (invited_by) REFERENCES users(user_id)
      )`
    );
    this.db.exec(`CREATE INDEX IF NOT EXISTS idx_invited_by ON users(invited_by)`);
    this.db.exec(`CREATE INDEX IF NOT EXISTS idx_invited_at ON users(invited_at)`);
  }

  close(): void {
    this.db.close();
  }
}
