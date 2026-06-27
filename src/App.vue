<template>
  <div class="min-h-screen bg-gofun font-display dark:bg-nalika-bg dark:text-nalika-text-muted">
    <nav
      class="sticky top-0 z-999 flex w-full items-center border-b border-gray-500/10 bg-shironeri px-4 py-2 dark:bg-nalika-surface"
    >
      <div class="flex-1" />
      <div class="flex gap-4">
        <RouterLink to="/" :exact-active-class="tw`font-bold text-primary`">
          Archetype Tier
        </RouterLink>
        <RouterLink to="/archetype-analysis" :exact-active-class="tw`font-bold text-primary`">
          Archetype Analysis
        </RouterLink>
      </div>
      <div class="flex flex-1 justify-end">
        <DarkToggle />
      </div>
    </nav>

    <RouterView />
  </div>
</template>

<script setup></script>
