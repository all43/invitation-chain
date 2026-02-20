export interface User {
  userId: string;
  invitedBy: string | null;
  invitedAt: string;
  isBanned: boolean;
  bannedAt: string | null;
}

export interface TreeNode extends User {
  children: TreeNode[];
}

export interface BanResult {
  bannedCount: number;
  bannedUserIds: string[];
}

const BASE = '/api';

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? `Request failed: ${res.status}`);
  }
  return res.json();
}

export const api = {
  getTree: () => request<TreeNode[]>('/tree'),
  getUsers: () => request<User[]>('/users'),
  getUser: (id: string) => request<User>(`/users/${encodeURIComponent(id)}`),
  getAncestors: (id: string) => request<User[]>(`/users/${encodeURIComponent(id)}/ancestors`),
  getDescendants: (id: string) => request<User[]>(`/users/${encodeURIComponent(id)}/descendants`),
  getEntryPoint: (id: string) => request<User>(`/users/${encodeURIComponent(id)}/entry-point`),

  addRoot: (userId: string) =>
    request<User>('/users', { method: 'POST', body: JSON.stringify({ userId }) }),

  addInvitation: (userId: string, invitedBy: string, invitedAt?: string) =>
    request<User>('/invitations', {
      method: 'POST',
      body: JSON.stringify({ userId, invitedBy, invitedAt }),
    }),

  banUser: (id: string) =>
    request<User>(`/users/${encodeURIComponent(id)}/ban`, { method: 'POST' }),

  unbanUser: (id: string) =>
    request<User>(`/users/${encodeURIComponent(id)}/unban`, { method: 'POST' }),

  banDescendants: (id: string) =>
    request<BanResult>(`/users/${encodeURIComponent(id)}/ban-descendants`, { method: 'POST' }),

  unbanDescendants: (id: string) =>
    request<BanResult>(`/users/${encodeURIComponent(id)}/unban-descendants`, { method: 'POST' }),

  banAfterDate: (id: string, cutoffDate: string) =>
    request<BanResult>(`/users/${encodeURIComponent(id)}/ban-after-date`, {
      method: 'POST',
      body: JSON.stringify({ cutoffDate }),
    }),

  seed: () => request<{ ok: boolean; count: number }>('/seed', { method: 'POST' }),
  reset: () => request<{ ok: boolean }>('/reset', { method: 'POST' }),
};
