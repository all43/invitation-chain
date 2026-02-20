<script setup lang="ts">
import type { User } from '../api';

defineProps<{
  user: User;
  ancestors: User[];
}>();

const emit = defineEmits<{
  select: [userId: string];
}>();

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}
</script>

<template>
  <div class="node-detail">
    <h3>User Details</h3>
    <div class="detail-row">
      <span class="label">ID</span>
      <span class="value">{{ user.userId }}</span>
    </div>
    <div class="detail-row">
      <span class="label">Invited by</span>
      <span class="value">
        <a
          v-if="user.invitedBy"
          href="#"
          @click.prevent="emit('select', user.invitedBy!)"
        >{{ user.invitedBy }}</a>
        <em v-else>root (no inviter)</em>
      </span>
    </div>
    <div class="detail-row">
      <span class="label">Invited at</span>
      <span class="value">{{ formatDate(user.invitedAt) }}</span>
    </div>
    <div class="detail-row">
      <span class="label">Status</span>
      <span :class="['status-badge', user.isBanned ? 'banned' : 'active']">
        {{ user.isBanned ? 'Banned' : 'Active' }}
      </span>
    </div>
    <div v-if="user.bannedAt" class="detail-row">
      <span class="label">Banned at</span>
      <span class="value">{{ formatDate(user.bannedAt) }}</span>
    </div>

    <div v-if="ancestors.length > 1" class="ancestry">
      <h4>Ancestry Chain</h4>
      <div class="chain">
        <span
          v-for="(a, i) in [...ancestors].reverse()"
          :key="a.userId"
          class="chain-item"
        >
          <a href="#" @click.prevent="emit('select', a.userId)">{{ a.userId }}</a>
          <span v-if="i < ancestors.length - 1" class="chain-arrow">&rarr;</span>
        </span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.node-detail {
  padding: 0.75rem;
  background: #f1f5f9;
  border-radius: 8px;
}

.node-detail h3 {
  margin: 0 0 0.5rem 0;
  font-size: 0.8rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #64748b;
}

.detail-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.25rem 0;
  font-size: 0.85rem;
}

.label {
  color: #64748b;
}

.value {
  color: #1e293b;
  font-weight: 500;
}

.value a {
  color: #2563eb;
  text-decoration: none;
}

.value a:hover {
  text-decoration: underline;
}

.status-badge {
  padding: 0.125rem 0.5rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 600;
}

.status-badge.active {
  background: #dcfce7;
  color: #16a34a;
}

.status-badge.banned {
  background: #fef2f2;
  color: #dc2626;
}

.ancestry {
  margin-top: 0.5rem;
  padding-top: 0.5rem;
  border-top: 1px solid #e2e8f0;
}

.ancestry h4 {
  margin: 0 0 0.25rem 0;
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #64748b;
}

.chain {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.125rem;
  font-size: 0.85rem;
}

.chain-item a {
  color: #2563eb;
  text-decoration: none;
}

.chain-item a:hover {
  text-decoration: underline;
}

.chain-arrow {
  color: #94a3b8;
  margin: 0 0.125rem;
}
</style>
