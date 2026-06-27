<template>
  <div class="min-h-screen bg-gofun font-display dark:bg-nalika-bg dark:text-nalika-text-muted">
    <nav
      class="sticky top-0 z-999 flex w-full items-center border-b border-gray-500/10 bg-white px-4 py-2 dark:bg-nalika-surface"
    >
      <div class="md:flex-1" />
      <div class="flex gap-4">
        <RouterLink
          to="/"
          class="max-sm:text-sm md:w-60"
          :exact-active-class="tw`font-bold text-primary dark:text-gunjyo`"
        >
          Archetype Tier
        </RouterLink>
        <RouterLink
          to="/archetype-analysis"
          class="max-sm:text-sm md:w-60"
          :exact-active-class="tw`font-bold text-primary dark:text-gunjyo`"
        >
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
