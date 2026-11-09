<template>
  <!-- An archetype's card names on their own line (see archetypeNameParts). Each
       name is an inline-block, so one that doesn't fit the rest of the line moves
       down whole. One wider than the line breaks after a "・" or before a "（"
       (the <wbr>s), and only past those anywhere. The slash sits in the block
       before it, so it ends a line rather than starting the next. Anything
       slotted follows the last name -->
  <div class="[overflow-wrap:anywhere] break-keep">
    <template v-for="(card, ci) in cards" :key="ci">
      <span class="inline-block max-w-full">
        <span :class="card.color && !keepWeight && 'font-medium'" :style="{ color: card.color }">
          <template v-for="(part, pi) in namePieces(card.name)" :key="pi">
            <wbr v-if="pi > 0" />
            <span v-text="part" />
          </template>
        </span>
        <template v-if="ci < cards.length - 1">{{ CARD_SEP }}</template>
      </span>
      <template v-if="ci < cards.length - 1">{{ ' ' }}</template>
    </template>
    <slot />
  </div>
</template>

<script setup>
defineProps({
  // [{ name, color }], color only for signature cards
  cards: { type: Array, required: true },
  // Signature cards take the surrounding weight instead of standing out in
  // font-medium, for text that's already bold
  keepWeight: { type: Boolean, default: false },
})

const CARD_SEP = '\u00a0/'

// "ガンダム・バルバトス（第1形態）" → ['ガンダム・', 'バルバトス', '（第1形態）']
const namePieces = name => name.split(/(?<=・)|(?=（)/)
</script>
