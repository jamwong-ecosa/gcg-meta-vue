<template>
  <div class="min-h-screen bg-white font-display dark:bg-nalika-bg dark:text-nalika-text-muted">
    <nav
      class="sticky top-0 z-999 flex w-full items-center gap-4 border-b border-gray-500/10 bg-white px-4 py-2 dark:bg-nalika-surface"
    >
      <div>item 1</div>
      <div>item 2</div>

      <DarkToggle class="ml-auto" />
    </nav>

    <router-view />
  </div>
</template>

<script setup></script>
