<template>
  <div>
    <v-snackbar
      v-for="t in toast.state.items"
      :key="t.id"
      :model-value="true"
      :color="t.type"
      :timeout="t.timeout"
      :location="t.location"
      multi-line
      @update:model-value="(v) => !v && toast.remove(t.id)"
    >
      {{ t.text }}
      <template #actions>
        <v-btn icon="mdi-close" size="small" variant="text" @click="toast.remove(t.id)" />
      </template>
    </v-snackbar>
  </div>
</template>

<script setup>
const toast = useToast()
</script>
