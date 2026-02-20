export interface User {
  userId: string;
  invitedBy: string | null;
  invitedAt: string; // ISO 8601
  isBanned: boolean;
  bannedAt: string | null; // ISO 8601
}

export interface TreeNode extends User {
  children: TreeNode[];
}

export interface InvitationInput {
  userId: string;
  invitedBy: string;
  invitedAt?: string; // defaults to now
}

export interface BanResult {
  bannedCount: number;
  bannedUserIds: string[];
}
