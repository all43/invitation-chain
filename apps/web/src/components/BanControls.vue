<script setup lang="ts">
import { ref } from 'vue';
import { api } from '../api';
import type { User } from '../api';

const props = defineProps<{
  user: User;
}>();

const emit = defineEmits<{
  action: [];
  error: [message: string];
}>();

const cutoffDate = ref('');
const loading = ref(false);

async function banSingle() {
  loading.value = true;
  try {
    await api.banUser(props.user.userId);
    emit('action');
  } catch (e: any) {
    emit('error', e.message);
  } finally {
    loading.value = false;
  }
}

async function unbanSingle() {
  loading.value = true;
  try {
    await api.unbanUser(props.user.userId);
    emit('action');
  } catch (e: any) {
    emit('error', e.message);
  } finally {
    loading.value = false;
  }
}

async function banWithDescendants() {
  loading.value = true;
  try {
    const result = await api.banDescendants(props.user.userId);
    emit('action');
  } catch (e: any) {
    emit('error', e.message);
  } finally {
    loading.value = false;
  }
}

async function unbanWithDescendants() {
  loading.value = true;
  try {
    await api.unbanDescendants(props.user.userId);
    emit('action');
  } catch (e: any) {
    emit('error', e.message);
  } finally {
    loading.value = false;
  }
}

async function banAfterDate() {
  if (!cutoffDate.value) return;
  loading.value = true;
  try {
    const iso = new Date(cutoffDate.value).toISOString();
    const result = await api.banAfterDate(props.user.userId, iso);
    emit('action');
  } catch (e: any) {
    emit('error', e.message);
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <div class="ban-controls">
    <h3>Ban Controls</h3>
    <p class="target">Target: <strong>{{ user.userId }}</strong></p>

    <div class="actions">
      <button
        v-if="!user.isBanned"
        class="btn btn-warning"
        :disabled="loading"
        @click="banSingle"
      >
        Ban User
      </button>
      <button
        v-else
        class="btn btn-secondary"
        :disabled="loading"
        @click="unbanSingle"
      >
        Unban User
      </button>

      <button
        class="btn btn-danger"
        :disabled="loading"
        @click="banWithDescendants"
      >
        Ban + All Descendants
      </button>

      <button
        class="btn btn-success"
        :disabled="loading"
        @click="unbanWithDescendants"
      >
        Unban + All Descendants
      </button>
    </div>

    <div class="date-ban">
      <label class="date-label">Ban descendants invited after:</label>
      <input
        v-model="cutoffDate"
        type="datetime-local"
        class="input"
      />
      <button
        class="btn btn-warning"
        :disabled="loading || !cutoffDate"
        @click="banAfterDate"
      >
        Ban After Date
      </button>
    </div>
  </div>
</template>

<style scoped>
.ban-controls {
  padding: 0.75rem;
  background: #fff7ed;
  border-radius: 8px;
  border: 1px solid #fed7aa;
}

.ban-controls h3 {
  margin: 0 0 0.25rem 0;
  font-size: 0.8rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #9a3412;
}

.target {
  font-size: 0.85rem;
  color: #1e293b;
  margin: 0 0 0.5rem 0;
}

.actions {
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
  margin-bottom: 0.75rem;
}

.date-ban {
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
}

.date-label {
  font-size: 0.8rem;
  color: #64748b;
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
