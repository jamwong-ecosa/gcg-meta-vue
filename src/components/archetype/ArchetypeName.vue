<template>
  <span class="flex min-w-0 items-baseline gap-1.5">
    <span v-if="!hideColorDots" class="flex shrink-0 items-center gap-0.5">
      <span
        v-for="dot in row.colorDots"
        :key="dot.name"
        class="mr-px inline-block h-2 w-2 rounded-full"
        :style="{ background: dot.hex }"
      />
    </span>
    <span class="min-w-0 text-sm text-sumi dark:text-nalika-text">
      <template
        v-for="(seg, si) in buildLabelSegments(row.archetype, row.sigCards ?? [], {
          skipBaseCombo: hideColorName,
        })"
        :key="si"
      >
        <span v-if="seg.color" :style="{ color: seg.color }">{{ seg.text }}</span>
        <span v-else>{{ seg.text }}</span>
      </template>
    </span>
    <span
      v-if="row.darkHorse"
      class="inline-flex shrink-0 items-center gap-0.5 rounded bg-amber-100 px-1 text-xs font-semibold text-amber-800 dark:bg-amber-900/40 dark:text-amber-300"
    >
      🐴
    </span>
  </span>
</template>

<script setup>
defineProps({
  row: { type: Object, required: true },
  hideColorDots: { type: Boolean, default: false },
  hideColorName: { type: Boolean, default: false },
})
</script>
