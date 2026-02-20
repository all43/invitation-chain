export const CREATE_TABLE = `
CREATE TABLE IF NOT EXISTS users (
    user_id     TEXT PRIMARY KEY,
    invited_by  TEXT,
    invited_at  TEXT NOT NULL,
    is_banned   INTEGER NOT NULL DEFAULT 0,
    banned_at   TEXT,
    FOREIGN KEY (invited_by) REFERENCES users(user_id)
)`;

export const CREATE_INDEX_INVITED_BY = `
CREATE INDEX IF NOT EXISTS idx_invited_by ON users(invited_by)`;

export const CREATE_INDEX_INVITED_AT = `
CREATE INDEX IF NOT EXISTS idx_invited_at ON users(invited_at)`;

export const INSERT_USER = `
INSERT INTO users (user_id, invited_by, invited_at, is_banned)
VALUES (?, ?, ?, 0)`;

export const SELECT_USER = `
SELECT user_id, invited_by, invited_at, is_banned, banned_at
FROM users WHERE user_id = ?`;

export const SELECT_ALL_USERS = `
SELECT user_id, invited_by, invited_at, is_banned, banned_at
FROM users ORDER BY invited_at ASC`;

export const ANCESTORS_CTE = `
WITH RECURSIVE ancestors AS (
    SELECT user_id, invited_by, invited_at, is_banned, banned_at, 0 AS depth
    FROM users WHERE user_id = ?
    UNION ALL
    SELECT u.user_id, u.invited_by, u.invited_at, u.is_banned, u.banned_at, a.depth + 1
    FROM users u
    JOIN ancestors a ON u.user_id = a.invited_by
)
SELECT user_id, invited_by, invited_at, is_banned, banned_at
FROM ancestors ORDER BY depth ASC`;

export const DESCENDANTS_CTE = `
WITH RECURSIVE descendants AS (
    SELECT user_id, invited_by, invited_at, is_banned, banned_at, 0 AS depth
    FROM users WHERE user_id = ?
    UNION ALL
    SELECT u.user_id, u.invited_by, u.invited_at, u.is_banned, u.banned_at, d.depth + 1
    FROM users u
    JOIN descendants d ON u.invited_by = d.user_id
)
SELECT user_id, invited_by, invited_at, is_banned, banned_at
FROM descendants ORDER BY depth ASC`;

export const DESCENDANTS_AFTER_DATE_CTE = `
WITH RECURSIVE descendants AS (
    SELECT user_id, invited_by, invited_at, is_banned, banned_at, 0 AS depth
    FROM users WHERE user_id = ?
    UNION ALL
    SELECT u.user_id, u.invited_by, u.invited_at, u.is_banned, u.banned_at, d.depth + 1
    FROM users u
    JOIN descendants d ON u.invited_by = d.user_id
)
SELECT user_id, invited_by, invited_at, is_banned, banned_at
FROM descendants
WHERE depth > 0 AND invited_at > ?
ORDER BY depth ASC`;

export const BAN_USER = `
UPDATE users SET is_banned = 1, banned_at = ? WHERE user_id = ?`;

export const UNBAN_USER = `
UPDATE users SET is_banned = 0, banned_at = NULL WHERE user_id = ?`;

export const BAN_USERS_BY_IDS = (count: number): string => `
UPDATE users SET is_banned = 1, banned_at = ?
WHERE user_id IN (${Array(count).fill('?').join(',')})`;

export const UNBAN_USERS_BY_IDS = (count: number): string => `
UPDATE users SET is_banned = 0, banned_at = NULL
WHERE user_id IN (${Array(count).fill('?').join(',')})`;

export const DROP_TABLE = `DROP TABLE IF EXISTS users`;
