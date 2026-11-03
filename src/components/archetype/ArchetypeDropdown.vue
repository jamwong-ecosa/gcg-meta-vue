<template>
  <div ref="dropdownRef" class="relative">
    <button
      class="relative flex w-full cursor-pointer items-center gap-2 overflow-hidden rounded-lg border border-gray-500/10 bg-gray-50 px-3 pt-3 pb-2 text-left transition-colors hover:border-gray-300 focus:border-sora focus:ring-2 focus:ring-hai/5 focus:outline-none md:gap-3 md:px-5 md:pt-4 md:pb-3 dark:border-nalika-border dark:bg-nalika-surface dark:text-nalika-text dark:hover:border-gray-600/70 dark:focus:border-ruri"
      @click="open = !open"
    >
      <div class="absolute inset-x-0 top-0 h-1" :style="{ background: colorStrip }" />

      <div class="min-w-0 flex-1">
        <div class="flex items-baseline gap-1.5">
          <div
            v-for="h in selectedColors"
            :key="h"
            class="h-2.5 w-2.5 shrink-0 rounded-full md:h-2.5 md:w-2.5"
            :style="{ background: h }"
          />

          <div
            class="ml-1 text-sm leading-snug font-bold text-sumi sm:text-base md:text-lg dark:text-nalika-text"
          >
            <template v-for="(seg, si) in selectedSegments" :key="si">
              <span v-if="seg.color" :style="{ color: seg.color }">{{ seg.text }}</span>
              <span v-else>{{ seg.text }}</span>
            </template>
          </div>
        </div>

        <div class="mt-1 flex items-center gap-2 md:mt-2">
          <div
            v-if="selectedTier"
            class="rounded px-1.5 py-0.5 text-xxs font-bold md:px-2 md:text-sm"
            :class="tierPillClass(selectedTier)"
          >
            {{ selectedTier }}
          </div>

          <div
            v-if="selectedDetails"
            class="text-xxs text-gray-500 sm:text-xs md:text-sm dark:text-nalika-text-muted/70"
          >
            {{ selectedDetails }}
          </div>
        </div>
      </div>

      <svg
        class="h-4 w-4 shrink-0 text-gray-400 md:h-5 md:w-5"
        viewBox="0 0 20 20"
        fill="currentColor"
      >
        <path
          d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
        />
      </svg>
    </button>

    <div
      v-if="open"
      class="absolute left-0 z-50 mt-1 max-h-60 w-full overflow-y-auto rounded-lg border border-gray-500/10 bg-white py-1 shadow-lg md:right-0 dark:border-nalika-border dark:bg-nalika-surface"
    >
      <button
        v-for="opt in options"
        :key="opt.value"
        :ref="
          el => {
            if (el && opt.value === modelValue) activeBtn = el
          }
        "
        class="flex w-full items-center gap-2 border-gray-100 px-3 py-2 text-xs not-last:border-b hover:bg-gray-100/30 sm:text-sm dark:hover:bg-white/5"
        :class="{ 'bg-gunjyo/10 dark:bg-gunjyo/15': opt.value === modelValue }"
        @click="select(opt.value)"
      >
        <div class="min-w-0 flex-1">
          <div class="flex items-baseline gap-1 text-left text-gray-700 dark:text-nalika-text">
            <div
              v-for="h in opt.colors"
              :key="h"
              class="h-2 w-2 shrink-0 rounded-full"
              :style="{ background: h }"
            />

            <div class="ml-1">
              <template v-for="(seg, si) in opt.labelSegments" :key="si">
                <span v-if="seg.color" :style="{ color: seg.color }">{{ seg.text }}</span>
                <span v-else>{{ seg.text }}</span>
              </template>
            </div>
          </div>

          <div class="mt-1 flex items-center gap-2">
            <div
              v-if="opt.tier"
              class="mr-1 h-fit w-10 rounded px-1.5 py-0.5 text-center text-xxs font-bold"
              :class="tierPillClass(opt.tier)"
            >
              {{ opt.tier }}
            </div>
            <div v-if="opt.details" class="text-xs text-gray-500 dark:text-nalika-text-muted/70">
              {{ opt.details }}
            </div>
          </div>
        </div>
      </button>
    </div>
  </div>
</template>

<script setup>
import { onClickOutside } from '@vueuse/core'

const modelValue = defineModel({ type: [String, Number], required: true })
const props = defineProps({
  options: { type: Array, required: true },
})

const dropdownRef = useTemplateRef('dropdownRef')
const open = ref(false)
const activeBtn = ref(null)

onClickOutside(dropdownRef, () => {
  open.value = false
})

watch(open, val => {
  if (val) {
    nextTick(() => {
      activeBtn.value?.scrollIntoView({ block: 'nearest' })
    })
  }
})

const selected = computed(() => props.options.find(o => o.value === modelValue.value))

const selectedColors = computed(() => selected.value?.colors ?? [])
const selectedSegments = computed(() => selected.value?.labelSegments ?? [])
const selectedDetails = computed(() => selected.value?.details ?? '')
const selectedTier = computed(() => selected.value?.tier ?? null)

// Hard-stop gradient: one equal band per archetype color
const colorStrip = computed(() => {
  const colors = selectedColors.value
  if (!colors.length) {
    return 'transparent'
  }
  const step = 100 / colors.length
  const stops = colors.map((c, i) => `${c} ${i * step}% ${(i + 1) * step}%`)
  return `linear-gradient(90deg, ${stops.join(', ')})`
})

function select(value) {
  modelValue.value = value
  open.value = false
}
</script>
