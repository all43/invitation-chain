<script setup lang="ts">
import { ref } from 'vue';
import { api } from '../api';

const emit = defineEmits<{
  added: [];
  error: [message: string];
}>();

const userId = ref('');
const invitedBy = ref('');
const invitedAt = ref('');
const isRoot = ref(false);
const loading = ref(false);

async function handleSubmit() {
  if (!userId.value.trim()) return;
  if (!isRoot.value && !invitedBy.value.trim()) return;

  loading.value = true;
  try {
    if (isRoot.value) {
      await api.addRoot(userId.value.trim());
    } else {
      await api.addInvitation(
        userId.value.trim(),
        invitedBy.value.trim(),
        invitedAt.value ? new Date(invitedAt.value).toISOString() : undefined,
      );
    }
    userId.value = '';
    invitedBy.value = '';
    invitedAt.value = '';
    emit('added');
  } catch (e: any) {
    emit('error', e.message);
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <form class="add-form" @submit.prevent="handleSubmit">
    <h3>Add User</h3>

    <label class="checkbox-label">
      <input type="checkbox" v-model="isRoot" />
      Root user (no inviter)
    </label>

    <input
      v-model="userId"
      type="text"
      placeholder="New user ID"
      class="input"
      required
    />

    <input
      v-if="!isRoot"
      v-model="invitedBy"
      type="text"
      placeholder="Invited by (existing user)"
      class="input"
      required
    />

    <input
      v-if="!isRoot"
      v-model="invitedAt"
      type="datetime-local"
      class="input"
    />

    <button type="submit" class="btn btn-primary" :disabled="loading">
      {{ loading ? 'Adding...' : isRoot ? 'Add Root' : 'Add Invitation' }}
    </button>
  </form>
</template>

<style scoped>
.add-form {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding: 0.75rem;
  background: #f1f5f9;
  border-radius: 8px;
}

.add-form h3 {
  margin: 0;
  font-size: 0.8rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #64748b;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.85rem;
  color: #334155;
}

.input {
  padding: 0.4rem 0.6rem;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  font-size: 0.85rem;
  outline: none;
}

.input:focus {
  border-color: #2563eb;
  box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.15);
}
</style>
