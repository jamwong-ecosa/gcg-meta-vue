<template>
  <!-- A section folded by default: shaped like the archetype staples / flex
       headers, but grey and quieter, with a few card faces as a peek inside -->
  <section
    ref="rootRef"
    class="scroll-mt-14 overflow-hidden rounded border border-gray-500/15 bg-gray-50 dark:border-nalika-border dark:bg-white/[0.02]"
  >
    <button
      class="flex w-full cursor-pointer items-baseline gap-x-2.5 px-3 py-1.5 text-left sm:py-2 transition-colors hover:bg-gray-500/[0.06] focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ruri sm:px-4 dark:hover:bg-white/[0.04] dark:focus-visible:outline-sora"
      :class="show && 'border-b border-gray-500/15 dark:border-nalika-border'"
      :aria-expanded="show"
      @click="emit('toggle')"
    >
      <span
        class="inline-block w-3 shrink-0 text-center text-gray-400 transition-transform dark:text-gray-500"
        :class="show && 'rotate-90'"
        aria-hidden="true"
      >
        ▸
      </span>
      <span class="flex min-w-0 flex-1 flex-wrap items-baseline gap-x-2.5 gap-y-0.5 sm:gap-y-1">
        <span class="text-base font-semibold tracking-wider text-gray-700 dark:text-nalika-text">
          {{ title }}
        </span>
        <span
          v-if="range"
          class="rounded-full bg-gray-500/10 px-2 py-0.5 font-mono text-xs font-semibold text-gray-600 tabular-nums dark:bg-white/10 dark:text-nalika-text-muted"
        >
          {{ range }}
        </span>
        <!-- Own row on mobile, like the staples / flex headers -->
        <span class="text-xs text-gray-500 max-sm:basis-full dark:text-nalika-text-muted">
          {{ [blurb, countText].filter(Boolean).join(' · ') }}
        </span>
      </span>
      <!-- Peek: hidden once open (the content is right below) and on phones -->
      <span
        v-if="!show && peek.length"
        class="ml-auto hidden shrink-0 items-center self-center sm:flex"
        aria-hidden="true"
      >
        <img
          v-for="(id, i) in peek"
          :key="i"
          :src="cardFace(id, 64).url"
          alt=""
          loading="lazy"
          class="-ml-1.5 size-7 rounded-full object-cover ring-2 ring-gray-50 first:ml-0 dark:ring-nalika-surface"
        />
        <span
          v-if="count > peek.length"
          class="ml-1.5 font-mono text-xs text-gray-400 tabular-nums dark:text-gray-500"
        >
          +{{ count - peek.length }}
        </span>
      </span>
    </button>
    <div v-if="show">
      <slot />
    </div>
  </section>
</template>

<script setup>
const props = defineProps({
  show: Boolean,
  title: { type: String, required: true },
  blurb: { type: String, default: '' },
  // Share badge, e.g. '<15%'; left out when the section has no share to show
  range: { type: String, default: '' },
  // Item count, e.g. '35 張卡', after the blurb
  countText: { type: String, default: '' },
  // Card ids for the peek faces (the first few are shown), and how many items
  // the section holds, for the '+N' after them
  peekIds: { type: Array, default: () => [] },
  count: { type: Number, default: 0 },
})
const emit = defineEmits(['toggle'])
const rootRef = ref(null)

const PEEK = 5
const peek = computed(() => props.peekIds.slice(0, PEEK))

watch(
  () => props.show,
  val => {
    if (val) {
      nextTick(() => rootRef.value?.scrollIntoView({ behavior: 'smooth', block: 'start' }))
    }
  },
)
</script>
