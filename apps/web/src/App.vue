<script setup lang="ts">
import { ref, watch } from 'vue';
import { api } from './api';
import type { TreeNode, User } from './api';
import TreeView from './components/TreeView.vue';
import NodeDetail from './components/NodeDetail.vue';
import AddInvitation from './components/AddInvitation.vue';
import BanControls from './components/BanControls.vue';

const tree = ref<TreeNode[]>([]);
const selectedId = ref<string | null>(null);
const selectedUser = ref<User | null>(null);
const ancestors = ref<User[]>([]);
const ancestorIds = ref<string[]>([]);
const error = ref<string | null>(null);

async function refreshTree() {
  try {
    tree.value = await api.getTree();
    error.value = null;
  } catch (e: any) {
    error.value = e.message;
  }
}

async function selectNode(userId: string) {
  selectedId.value = userId;
  try {
    selectedUser.value = await api.getUser(userId);
    ancestors.value = await api.getAncestors(userId);
    ancestorIds.value = ancestors.value.map((a) => a.userId);
    error.value = null;
  } catch (e: any) {
    error.value = e.message;
  }
}

async function handleSeed() {
  await api.seed();
  selectedId.value = null;
  selectedUser.value = null;
  ancestors.value = [];
  ancestorIds.value = [];
  await refreshTree();
}

async function handleReset() {
  await api.reset();
  selectedId.value = null;
  selectedUser.value = null;
  ancestors.value = [];
  ancestorIds.value = [];
  tree.value = [];
}

async function handleAction() {
  await refreshTree();
  if (selectedId.value) {
    await selectNode(selectedId.value);
  }
}

refreshTree();
</script>

<template>
  <div class="app">
    <header class="header">
      <h1>Invitation Chain</h1>
      <div class="header-actions">
        <button class="btn btn-primary" @click="handleSeed">Seed Demo Data</button>
        <button class="btn btn-danger" @click="handleReset">Clear Database</button>
      </div>
    </header>

    <div v-if="error" class="error-bar">
      {{ error }}
      <button class="error-close" @click="error = null">&times;</button>
    </div>

    <div class="main">
      <div class="sidebar">
        <AddInvitation @added="handleAction" @error="(msg) => (error = msg)" />

        <NodeDetail
          v-if="selectedUser"
          :user="selectedUser"
          :ancestors="ancestors"
          @select="selectNode"
        />

        <BanControls
          v-if="selectedUser"
          :user="selectedUser"
          @action="handleAction"
          @error="(msg) => (error = msg)"
        />

        <div class="legend">
          <h3>Legend</h3>
          <div class="legend-item">
            <span class="legend-dot active"></span> Active
          </div>
          <div class="legend-item">
            <span class="legend-dot banned"></span> Banned
          </div>
          <div class="legend-item">
            <span class="legend-dot selected"></span> Selected
          </div>
          <div class="legend-item">
            <span class="legend-dot ancestor"></span> Ancestor
          </div>
        </div>
      </div>

      <TreeView
        :tree="tree"
        :selected-id="selectedId"
        :ancestor-ids="ancestorIds"
        @select="selectNode"
      />
    </div>
  </div>
</template>

<style scoped>
.app {
  display: flex;
  flex-direction: column;
  height: 100vh;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem 1.5rem;
  background: #1e293b;
  color: #fff;
}

.header h1 {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 600;
}

.header-actions {
  display: flex;
  gap: 0.5rem;
}

.error-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.5rem 1.5rem;
  background: #fef2f2;
  color: #dc2626;
  border-bottom: 1px solid #fecaca;
  font-size: 0.875rem;
}

.error-close {
  background: none;
  border: none;
  color: #dc2626;
  cursor: pointer;
  font-size: 1.25rem;
}

.main {
  display: flex;
  flex: 1;
  overflow: hidden;
}

.sidebar {
  width: 320px;
  min-width: 320px;
  padding: 1rem;
  overflow-y: auto;
  background: #fff;
  border-right: 1px solid #e2e8f0;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.legend {
  padding: 0.75rem;
  background: #f1f5f9;
  border-radius: 8px;
}

.legend h3 {
  margin: 0 0 0.5rem 0;
  font-size: 0.8rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #64748b;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.85rem;
  color: #334155;
  margin-bottom: 0.25rem;
}

.legend-dot {
  width: 14px;
  height: 14px;
  border-radius: 50%;
  display: inline-block;
}

.legend-dot.active {
  background: #22c55e;
  border: 2px solid #fff;
}

.legend-dot.banned {
  background: #ef4444;
  border: 2px solid #fff;
}

.legend-dot.selected {
  background: #22c55e;
  border: 3px solid #2563eb;
}

.legend-dot.ancestor {
  background: #22c55e;
  border: 3px solid #f59e0b;
}
</style>
