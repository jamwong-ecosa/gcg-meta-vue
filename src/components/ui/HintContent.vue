<template>
  <!-- The laid-out body of a hint: in UiHint's hover popover, and under the
       enlarged card where touch screens can't hover -->
  <p v-if="content.title" class="font-bold text-gray-900 dark:text-white">
    {{ content.title }}
  </p>
  <p v-if="content.subtitle" class="text-xs text-gray-500 dark:text-gray-400">
    {{ content.subtitle }}
  </p>
  <dl
    v-if="content.rows?.length"
    class="mt-1.5 grid grid-cols-[auto_1fr] items-baseline gap-x-3 gap-y-0.5"
  >
    <template v-for="r in content.rows" :key="r.label">
      <dt class="text-xs font-semibold text-gray-500 uppercase dark:text-gray-400">
        {{ r.label }}
      </dt>
      <dd>
        <span class="font-mono tabular-nums" :class="r.class">{{ r.value }}</span>
        <span v-if="r.note" class="ml-1.5 text-xs text-gray-500 dark:text-gray-400">
          {{ r.note }}
        </span>
      </dd>
    </template>
  </dl>
  <p v-if="content.footnote" class="mt-1.5 text-xs text-gray-500 dark:text-gray-400">
    {{ content.footnote }}
  </p>
  <ul
    v-if="content.tags?.length"
    class="mt-2 space-y-1 border-t border-sky-200 pt-2 dark:border-sky-800"
  >
    <li v-for="t in content.tags" :key="t.text" class="flex items-baseline gap-2">
      <span class="shrink-0 rounded px-1 text-xxs leading-tight font-bold" :class="t.class">
        {{ t.text }}
      </span>
      <span class="text-xs">{{ t.title }}</span>
    </li>
  </ul>
</template>

<script setup>
// { title, subtitle, rows: [{ label, value, note, class }], footnote, tags: [{ text, title, class }] }
defineProps({
  content: { type: Object, required: true },
})
</script>
