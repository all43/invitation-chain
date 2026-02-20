import type { InvitationChain } from '@invitation-chain/lib';

export function seedDemoData(chain: InvitationChain): number {
  chain.reset();

  chain.addRoot('admin');

  // Branch 1: admin -> alice -> ...
  chain.addInvitation({ userId: 'alice', invitedBy: 'admin', invitedAt: '2025-01-01T10:00:00Z' });
  chain.addInvitation({ userId: 'bob', invitedBy: 'alice', invitedAt: '2025-01-15T10:00:00Z' });
  chain.addInvitation({ userId: 'dave', invitedBy: 'bob', invitedAt: '2025-02-01T10:00:00Z' });
  chain.addInvitation({ userId: 'eve', invitedBy: 'bob', invitedAt: '2025-02-10T10:00:00Z' });
  chain.addInvitation({ userId: 'charlie', invitedBy: 'alice', invitedAt: '2025-01-20T10:00:00Z' });
  chain.addInvitation({ userId: 'frank', invitedBy: 'charlie', invitedAt: '2025-03-01T10:00:00Z' });

  // Branch 2: admin -> grace -> ...
  chain.addInvitation({ userId: 'grace', invitedBy: 'admin', invitedAt: '2025-01-05T10:00:00Z' });
  chain.addInvitation({ userId: 'heidi', invitedBy: 'grace', invitedAt: '2025-02-01T10:00:00Z' });
  chain.addInvitation({ userId: 'ivan', invitedBy: 'grace', invitedAt: '2025-02-15T10:00:00Z' });
  chain.addInvitation({ userId: 'judy', invitedBy: 'ivan', invitedAt: '2025-03-01T10:00:00Z' });

  // Suspicious branch: ivan -> mallory -> bots
  chain.addInvitation({ userId: 'mallory', invitedBy: 'ivan', invitedAt: '2025-03-05T10:00:00Z' });
  chain.addInvitation({ userId: 'bot1', invitedBy: 'mallory', invitedAt: '2025-03-06T10:00:00Z' });
  chain.addInvitation({ userId: 'bot2', invitedBy: 'mallory', invitedAt: '2025-03-06T12:00:00Z' });
  chain.addInvitation({ userId: 'bot3', invitedBy: 'mallory', invitedAt: '2025-03-07T10:00:00Z' });

  // Branch 3: admin -> oscar
  chain.addInvitation({ userId: 'oscar', invitedBy: 'admin', invitedAt: '2025-01-10T10:00:00Z' });

  return chain.getAllUsers().length;
}
