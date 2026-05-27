<!-- Listen-Kopf-Toolbar mit Zähler (Port von KeyHub navigation/shared/toolBar).
     v-model:filter steuert Suche + State-Filter; Emits: loadMore, new. -->
<template>
  <v-toolbar density="comfortable" :color="color" rounded class="mb-4 px-2">
    <v-icon v-if="icon" :icon="icon" class="me-2" />
    <span class="text-subtitle-1 font-weight-medium">{{ title }}</span>
    <v-btn v-if="count !== null" variant="text" size="small" class="ms-1 px-1 text-medium-emphasis" :disabled="!scrollable" @click="$emit('loadMore')">
      [<template v-if="filterCount !== null && filterCount !== count">{{ filterCount }} / </template>{{ count }}<template v-if="scrollable"> ..</template>
      <v-progress-circular v-if="scrolling" indeterminate size="14" width="2" class="ms-1" />]
    </v-btn>

    <v-spacer />

    <v-text-field v-if="hasSearch" :model-value="filter.query" :placeholder="$t('common.search')" density="compact" variant="solo-filled" flat hide-details rounded clearable prepend-inner-icon="mdi-magnify" style="max-width:260px" class="me-2" @update:model-value="(v) => emitFilter({ query: v || '' })" />

    <slot name="center" />

    <v-btn-toggle v-if="state" :model-value="filter.states" multiple density="compact" variant="outlined" class="me-2" @update:model-value="(v) => emitFilter({ states: v })">
      <v-btn value="active" icon="mdi-eye-outline" size="small" />
      <v-btn value="inactive" icon="mdi-eye-off-outline" size="small" />
    </v-btn-toggle>

    <slot name="actions" />

    <v-btn v-if="showNew" color="primary" variant="flat" prepend-icon="mdi-plus" :to="editPage || undefined" @click="onNew">{{ $t('common.new') }}</v-btn>
  </v-toolbar>
</template>

<script setup>
const props = defineProps({
  title: { type: String, default: '' },
  icon: { type: String, default: '' },
  color: { type: String, default: 'surface' },
  count: { type: Number, default: null },
  filterCount: { type: Number, default: null },
  scrollable: { type: Boolean, default: false },
  scrolling: { type: Boolean, default: false },
  state: { type: Boolean, default: false },
  editPage: { type: String, default: '' },
  noEdit: { type: Boolean, default: false },
  filter: { type: Object, default: () => ({ query: '', states: [] }) },
})
const emit = defineEmits(['loadMore', 'new', 'update:filter'])

const slots = useSlots()
const hasSearch = computed(() => props.filter && props.filter.query !== undefined)
const showNew = computed(() => !props.noEdit && !slots.actions)

function emitFilter(patch) { emit('update:filter', { ...props.filter, ...patch }) }
function onNew() { if (!props.editPage) emit('new') }
</script>
