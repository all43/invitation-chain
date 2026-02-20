<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted } from 'vue';
import * as d3Hierarchy from 'd3-hierarchy';
import * as d3Selection from 'd3-selection';
import * as d3Zoom from 'd3-zoom';
import * as d3Shape from 'd3-shape';
import type { TreeNode } from '../api';

const props = defineProps<{
  tree: TreeNode[];
  selectedId: string | null;
  ancestorIds: string[];
}>();

const emit = defineEmits<{
  select: [userId: string];
}>();

const svgRef = ref<SVGSVGElement | null>(null);
const containerRef = ref<HTMLDivElement | null>(null);

const NODE_RADIUS = 22;
const LEVEL_HEIGHT = 100;
const NODE_SPACING = 60;

function renderTree() {
  if (!svgRef.value || !containerRef.value) return;

  const svg = d3Selection.select(svgRef.value);
  svg.selectAll('*').remove();

  if (props.tree.length === 0) return;

  const width = containerRef.value.clientWidth;
  const height = containerRef.value.clientHeight;

  svg.attr('width', width).attr('height', height);

  // If multiple roots, create a virtual root
  let rootData: TreeNode;
  if (props.tree.length === 1) {
    rootData = props.tree[0];
  } else {
    rootData = {
      userId: '__virtual_root__',
      invitedBy: null,
      invitedAt: '',
      isBanned: false,
      bannedAt: null,
      children: props.tree,
    };
  }

  const root = d3Hierarchy.hierarchy(rootData, (d) => d.children);

  const treeLayout = d3Hierarchy.tree<TreeNode>().nodeSize([NODE_SPACING, LEVEL_HEIGHT]);
  treeLayout(root);

  const g = svg.append('g');

  // Set up zoom
  const zoom = d3Zoom.zoom<SVGSVGElement, unknown>()
    .scaleExtent([0.2, 3])
    .on('zoom', (event) => {
      g.attr('transform', event.transform);
    });

  svg.call(zoom);

  // Center the tree
  const initialTransform = d3Zoom.zoomIdentity.translate(width / 2, 60);
  svg.call(zoom.transform, initialTransform);

  // Filter out virtual root nodes
  const nodes = root.descendants().filter((d) => d.data.userId !== '__virtual_root__');
  const links = root.links().filter(
    (l) => l.source.data.userId !== '__virtual_root__'
  );

  // For virtual root, draw links from it but hide the node
  const virtualLinks = root.links().filter(
    (l) => l.source.data.userId === '__virtual_root__'
  );

  // Draw curved links
  const linkGenerator = d3Shape
    .linkVertical<d3Hierarchy.HierarchyLink<TreeNode>, d3Hierarchy.HierarchyPointNode<TreeNode>>()
    .x((d) => d.x!)
    .y((d) => d.y!);

  const allLinks = [...links, ...virtualLinks];
  g.selectAll('path.link')
    .data(allLinks)
    .enter()
    .append('path')
    .attr('class', 'link')
    .attr('d', (d) => linkGenerator(d as any))
    .attr('fill', 'none')
    .attr('stroke', '#94a3b8')
    .attr('stroke-width', 2);

  // Draw nodes
  const nodeGroup = g
    .selectAll('g.node')
    .data(nodes)
    .enter()
    .append('g')
    .attr('class', 'node')
    .attr('transform', (d) => `translate(${d.x},${d.y})`)
    .style('cursor', 'pointer')
    .on('click', (_event, d) => {
      emit('select', d.data.userId);
    });

  // Node circles
  nodeGroup
    .append('circle')
    .attr('r', NODE_RADIUS)
    .attr('fill', (d) => {
      if (d.data.isBanned) return '#ef4444';
      return '#22c55e';
    })
    .attr('stroke', (d) => {
      if (d.data.userId === props.selectedId) return '#2563eb';
      if (props.ancestorIds.includes(d.data.userId)) return '#f59e0b';
      return '#fff';
    })
    .attr('stroke-width', (d) => {
      if (d.data.userId === props.selectedId) return 4;
      if (props.ancestorIds.includes(d.data.userId)) return 3;
      return 2;
    });

  // Node labels
  nodeGroup
    .append('text')
    .attr('dy', NODE_RADIUS + 16)
    .attr('text-anchor', 'middle')
    .attr('fill', '#1e293b')
    .attr('font-size', '12px')
    .attr('font-weight', (d) => (d.data.userId === props.selectedId ? '700' : '500'))
    .text((d) => d.data.userId)
    .style('text-decoration', (d) => (d.data.isBanned ? 'line-through' : 'none'));
}

watch(() => [props.tree, props.selectedId, props.ancestorIds], renderTree, { deep: true });

onMounted(() => {
  renderTree();
  window.addEventListener('resize', renderTree);
});

onUnmounted(() => {
  window.removeEventListener('resize', renderTree);
});
</script>

<template>
  <div ref="containerRef" class="tree-container">
    <svg ref="svgRef"></svg>
    <div v-if="tree.length === 0" class="empty-state">
      No data yet. Click <strong>Seed Demo Data</strong> to get started.
    </div>
  </div>
</template>

<style scoped>
.tree-container {
  flex: 1;
  position: relative;
  overflow: hidden;
  background: #f8fafc;
}

.tree-container svg {
  width: 100%;
  height: 100%;
}

.empty-state {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  color: #64748b;
  font-size: 1.1rem;
}
</style>
