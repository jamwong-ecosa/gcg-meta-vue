<template>
  <span
    ref="root"
    class="cursor-help"
    @pointerdown="onPointerDown"
    @pointerenter="onEnter"
    @pointerleave="onLeave"
    @focusin="onFocus"
    @focusout="hide"
    @click="onClick"
  >
    <slot />

    <!-- Teleported and fixed so an overflow-hidden parent or a modal can't clip it -->
    <Teleport to="body">
      <div
        v-if="open"
        ref="bubble"
        role="tooltip"
        class="pointer-events-none fixed z-1300 max-w-xs rounded-md bg-gray-900 px-2.5 py-1.5 text-xs leading-snug font-normal whitespace-pre-line text-white shadow-lg dark:bg-gray-700"
        :style="{
          top: `${pos.top}px`,
          left: `${pos.left}px`,
          visibility: pos.ready ? '' : 'hidden',
        }"
      >
        {{ text }}
      </div>
    </Teleport>
  </span>
</template>

<script setup>
import { onClickOutside, onKeyStroke, useEventListener } from '@vueuse/core'

// Explanatory hint shown in a popover instead of a native `title`: hover with a
// mouse, tap on touch screens (tap again or anywhere else to close)
const props = defineProps({
  text: { type: String, default: '' },
})

const open = ref(false)
const root = useTemplateRef('root')
const bubble = useTemplateRef('bubble')
const pos = ref({ top: 0, left: 0, ready: false })
let showTimer = null
// Not every browser's click event says which pointer made it; pointerdown does
let lastPointer = ''

const MARGIN = 8
const OFFSET = 6

async function show() {
  if (!props.text) {
    return
  }
  pos.value = { top: 0, left: 0, ready: false }
  open.value = true
  await nextTick()
  place()
}

function hide() {
  clearTimeout(showTimer)
  open.value = false
}

// Above the trigger when it fits, otherwise below; centred and kept on screen
function place() {
  if (!root.value || !bubble.value) {
    return
  }
  const rect = root.value.getBoundingClientRect()
  const { width, height } = bubble.value.getBoundingClientRect()
  const vw = window.innerWidth
  const above = rect.top - OFFSET - height
  const top = above >= MARGIN ? above : rect.bottom + OFFSET
  const left = Math.min(
    Math.max(rect.left + rect.width / 2 - width / 2, MARGIN),
    vw - width - MARGIN,
  )
  pos.value = { top, left, ready: true }
}

function onEnter(event) {
  if (event.pointerType !== 'mouse') {
    return
  }
  clearTimeout(showTimer)
  showTimer = setTimeout(show, 150)
}

function onLeave(event) {
  if (event.pointerType === 'mouse') {
    hide()
  }
}

function onPointerDown(event) {
  lastPointer = event.pointerType
}

// Keyboard focus only: a tap also focuses a button inside, and onClick handles taps
function onFocus(event) {
  if (event.target.matches?.(':focus-visible')) {
    show()
  }
}

// Touch: toggle on tap. A tap on a button or link inside does that control's
// job instead (a card zooms, a header sorts). Otherwise stop the tap so a
// clickable row around the hint doesn't also open
function onClick(event) {
  const tapped = lastPointer === 'touch' || lastPointer === 'pen'
  lastPointer = ''
  if (!tapped || !props.text || event.target.closest?.('button, a')) {
    return
  }
  event.stopPropagation()
  if (open.value) {
    hide()
  } else {
    show()
  }
}

onClickOutside(root, () => open.value && hide())
// Fixed coordinates go stale once anything scrolls; listen only while open
useEventListener(() => (open.value ? window : null), 'scroll', hide, {
  capture: true,
  passive: true,
})
onKeyStroke('Escape', () => open.value && hide())

onUnmounted(() => clearTimeout(showTimer))
</script>
