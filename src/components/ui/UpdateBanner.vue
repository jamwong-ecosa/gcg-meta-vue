<template>
  <Transition
    :enter-active-class="tw`transition duration-200`"
    :leave-active-class="tw`transition duration-200`"
    :enter-from-class="tw`translate-y-2 opacity-0`"
    :leave-to-class="tw`translate-y-2 opacity-0`"
  >
    <div
      v-if="needRefresh"
      role="status"
      class="fixed inset-x-3 bottom-[max(0.75rem,env(safe-area-inset-bottom))] z-[1200] mx-auto flex max-w-md items-center gap-3 rounded-xl border border-gray-500/15 bg-white p-3 shadow-xl dark:border-nalika-border dark:bg-nalika-surface"
    >
      <span class="min-w-0 flex-1 text-sm text-gray-700 dark:text-gray-200">
        {{ $t('ui.update.available') }}
      </span>
      <button
        class="shrink-0 rounded-lg bg-ruri px-3 py-1.5 text-sm font-bold text-white dark:bg-sora dark:text-nalika-bg"
        @click="updateServiceWorker(true)"
      >
        {{ $t('ui.update.reload') }}
      </button>
      <button
        class="flex size-8 shrink-0 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-white/10"
        :aria-label="$t('ui.close')"
        @click="needRefresh = false"
      >
        <svg class="size-5" viewBox="0 0 20 20" fill="currentColor">
          <path
            d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z"
          />
        </svg>
      </button>
    </div>
  </Transition>
</template>

<script setup>
import { useRegisterSW } from 'virtual:pwa-register/vue'

const CHECK_EVERY_MS = 60 * 60 * 1000
const MIN_GAP_MS = 60 * 1000

const router = useRouter()

// Browsers only look for a new service worker on a full page load, which an
// installed app left open never does: check hourly, whenever it comes back to
// the front, and on in-app page changes (at most once a minute)
const { needRefresh, updateServiceWorker } = useRegisterSW({
  onRegisteredSW(swUrl, registration) {
    if (!registration) {
      return
    }
    let lastCheck = Date.now()
    const check = () => {
      if (!navigator.onLine || Date.now() - lastCheck < MIN_GAP_MS) {
        return
      }
      lastCheck = Date.now()
      registration.update()
    }
    setInterval(check, CHECK_EVERY_MS)
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        check()
      }
    })
    router.afterEach(check)
  },
})
</script>
