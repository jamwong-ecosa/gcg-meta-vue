<template>
  <div class="space-y-6 p-2 md:p-8">
    <h1 class="text-2xl font-bold text-gray-900 dark:text-nalika-text">Welcome to GCG</h1>
    <p class="text-gray-600 dark:text-nalika-text-muted">
      This is body text using Tailwind gray utilities.
    </p>

    <!-- Mobile cards -->
    <div class="space-y-3 md:hidden">
      <div
        v-for="row in rows"
        :key="row.archetype"
        class="overflow-hidden rounded-lg bg-white not-dark:shadow not-dark:shadow-gray-400/10 dark:bg-nalika-surface"
      >
        <div :class="['flex h-9 items-center justify-between px-4', tierBarClass(row.tier)]">
          <span class="text-sm font-bold text-gray-700 uppercase dark:text-gray-200">
            {{ row.tier }}
          </span>
          <span class="text-sm font-bold text-gray-700 dark:text-gray-200">
            {{ row.score }}
          </span>
        </div>

        <div class="px-4 pt-3 pb-2">
          <span class="inline-flex items-center gap-0.5">
            <span
              v-for="dot in row.colorDots"
              :key="dot.name"
              class="inline-block h-2 w-2 rounded-full"
              :style="{ background: dot.hex }"
            />
            <span class="font-bold text-gray-800 dark:text-nalika-text">{{ row.colors }}</span>
          </span>
          <span class="mt-0.5 block text-xs text-gray-500 dark:text-nalika-text-muted">
            （{{ row.archetype }}）
          </span>
        </div>

        <div class="grid grid-cols-4 gap-2 px-4 pb-2">
          <div>
            <span class="block text-[0.6rem] font-semibold tracking-widest text-gray-400 uppercase">
              Decks
            </span>
            <span
              class="font-mono text-sm font-bold text-gray-700 tabular-nums dark:text-nalika-text-muted"
            >
              {{ row.decks }}
            </span>
          </div>
          <div>
            <span class="block text-[0.6rem] font-semibold tracking-widest text-gray-400 uppercase">
              Wins
            </span>
            <span
              class="font-mono text-sm font-bold text-gray-700 tabular-nums dark:text-nalika-text-muted"
            >
              {{ row.wins }}
            </span>
          </div>
          <div class="col-start-4">
            <span class="block text-[0.6rem] font-semibold tracking-widest text-gray-400 uppercase">
              Top4
            </span>
            <span
              class="font-mono text-sm font-bold text-gray-700 tabular-nums dark:text-nalika-text-muted"
            >
              {{ row.top4 }}
            </span>
          </div>
        </div>

        <div class="grid grid-cols-4 gap-2 px-4 pb-4">
          <div>
            <span class="block text-[0.6rem] font-semibold tracking-widest text-gray-400 uppercase">
              Use%
            </span>
            <span
              class="font-mono text-xs font-bold text-gray-700 tabular-nums dark:text-nalika-text-muted"
            >
              {{ row.usePct }}
            </span>
          </div>
          <div>
            <span class="block text-[0.6rem] font-semibold tracking-widest text-gray-400 uppercase">
              Win/Ev
            </span>
            <span
              class="font-mono text-xs font-bold text-gray-700 tabular-nums dark:text-nalika-text-muted"
            >
              {{ row.winPerEv }}
            </span>
          </div>
          <div>
            <span class="block text-[0.6rem] font-semibold tracking-widest text-gray-400 uppercase">
              Win/Dk
            </span>
            <span
              class="font-mono text-xs font-bold text-gray-700 tabular-nums dark:text-nalika-text-muted"
            >
              {{ row.winPerDk }}
            </span>
          </div>
          <div>
            <span class="block text-[0.6rem] font-semibold tracking-widest text-gray-400 uppercase">
              T4/Dk
            </span>
            <span
              class="font-mono text-xs font-bold text-gray-700 tabular-nums dark:text-nalika-text-muted"
            >
              {{ row.t4PerDk }}
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- Desktop table -->
    <div
      class="hidden overflow-hidden rounded-lg bg-white not-dark:shadow-xs not-dark:shadow-gray-400/15 md:block dark:bg-nalika-surface"
    >
      <table class="w-full text-left text-sm">
        <thead>
          <tr class="bg-blue-50 text-gray-900 dark:bg-nalika-header dark:text-nalika-text">
            <th class="px-4 py-3 font-semibold">Archetype</th>
            <th class="px-4 py-3 text-right font-semibold">Decks</th>
            <th class="px-4 py-3 text-right font-semibold">Wins</th>
            <th class="px-4 py-3 text-right font-semibold">Top4</th>
            <th class="px-4 py-3 text-right font-semibold">Use%</th>
            <th class="px-4 py-3 text-right font-semibold">Win/Ev</th>
            <th class="px-4 py-3 text-right font-semibold">Win/Dk</th>
            <th class="px-4 py-3 text-right font-semibold">T4/Dk</th>
            <th class="px-4 py-3 text-right font-semibold">Score</th>
            <th class="px-4 py-3 text-right font-semibold">Tier</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="row in rows"
            :key="row.archetype"
            class="text-gray-500 odd:bg-gray-100/5 even:bg-gray-100/45 hover:bg-blue-50/30 dark:text-nalika-text-muted dark:even:bg-white/3 dark:hover:bg-white/10"
          >
            <td class="px-4 py-3">
              <span class="inline-flex items-center gap-0.5">
                <span
                  v-for="dot in row.colorDots"
                  :key="dot.name"
                  class="mr-px inline-block h-2 w-2 rounded-full"
                  :style="{ background: dot.hex }"
                />
                <span class="ml-1 text-gray-900 dark:text-nalika-text">{{ row.colors }}</span>
              </span>
              <span class="text-xs">（{{ row.archetype }}）</span>
            </td>
            <td class="px-4 py-3 text-right">
              <span class="font-mono tabular-nums">
                {{ row.decks }}
              </span>
            </td>
            <td class="px-4 py-3 text-right">
              <span class="font-mono tabular-nums">
                {{ row.wins }}
              </span>
            </td>
            <td class="px-4 py-3 text-right">
              <span class="font-mono tabular-nums">
                {{ row.top4 }}
              </span>
            </td>
            <td class="px-4 py-3 text-right">
              <span class="font-mono tabular-nums">
                {{ row.usePct }}
              </span>
            </td>
            <td class="px-4 py-3 text-right">
              <span class="font-mono tabular-nums">
                {{ row.winPerEv }}
              </span>
            </td>
            <td class="px-4 py-3 text-right">
              <span class="font-mono tabular-nums">
                {{ row.winPerDk }}
              </span>
            </td>
            <td class="px-4 py-3 text-right">
              <span class="font-mono tabular-nums">
                {{ row.t4PerDk }}
              </span>
            </td>
            <td class="px-4 py-3 text-right">
              <span class="font-mono tabular-nums">
                {{ row.score }}
              </span>
            </td>
            <td class="px-4 py-3 text-right">
              <span
                class="rounded px-1.5 py-0.5 text-xs font-bold"
                :class="tierPillClass(row.tier)"
              >
                {{ row.tier }}
              </span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
function tierBarClass(tier) {
  const map = {
    T1: tw`bg-red-300 dark:bg-red-700`,
    'T1.5': tw`bg-orange-300 dark:bg-orange-700`,
    T2: tw`bg-amber-400 dark:bg-amber-700`,
    'T2.5': tw`bg-green-300 dark:bg-green-700`,
    T3: tw`bg-blue-300 dark:bg-blue-900`,
    '--': tw`bg-gray-300 dark:bg-gray-700`,
  }
  return map[tier] || tw`bg-gray-300 dark:bg-gray-700`
}

function tierPillClass(tier) {
  const map = {
    T1: tw`bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400`,
    'T1.5': tw`bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-400`,
    T2: tw`bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400`,
    'T2.5': tw`bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400`,
    T3: tw`bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400`,
    '--': tw`bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400`,
  }
  return map[tier] || tw`bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400`
}

const colorMap = {
  Blue: '#2b6cb0',
  Red: '#e53e3e',
  Green: '#38a169',
  Purple: '#805ad5',
  White: '#cbd5e0',
}

function parseColors(str) {
  return str.split('+').map(name => ({ name, hex: colorMap[name] }))
}

const rows = [
  {
    archetype: 'ガンダム / バルバトス（第1形態）',
    colors: 'Blue+Purple',
    colorDots: parseColors('Blue+Purple'),
    decks: 327,
    wins: 44,
    top4: 147,
    usePct: '19.9%',
    winPerEv: '25.0%',
    winPerDk: '13.5%',
    t4PerDk: '45.0%',
    score: 224,
    tier: 'T1',
  },
  {
    archetype: 'GQuuuuuuX（Ω起動時） / ジャスティス',
    colors: 'Red+White',
    colorDots: parseColors('Red+White'),
    decks: 146,
    wins: 23,
    top4: 64,
    usePct: '8.9%',
    winPerEv: '13.1%',
    winPerDk: '15.8%',
    t4PerDk: '43.8%',
    score: 153,
    tier: 'T1.5',
  },
  {
    archetype: 'ガンダム / グシオンリベイク',
    colors: 'Blue+Purple',
    colorDots: parseColors('Blue+Purple'),
    decks: 47,
    wins: 11,
    top4: 28,
    usePct: '2.9%',
    winPerEv: '6.3%',
    winPerDk: '23.4%',
    t4PerDk: '59.6%',
    score: 136,
    tier: 'T1.5',
  },
  {
    archetype: 'ウイングゼロ / ジャスティス',
    colors: 'Green+White',
    colorDots: parseColors('Green+White'),
    decks: 35,
    wins: 6,
    top4: 16,
    usePct: '2.1%',
    winPerEv: '3.4%',
    winPerDk: '17.1%',
    t4PerDk: '45.7%',
    score: 98,
    tier: 'T2',
  },
  {
    archetype: 'ネオ・ジオング / エールストライク',
    colors: 'Red+White',
    colorDots: parseColors('Red+White'),
    decks: 28,
    wins: 5,
    top4: 13,
    usePct: '1.7%',
    winPerEv: '2.8%',
    winPerDk: '17.9%',
    t4PerDk: '46.4%',
    score: 95,
    tier: 'T2',
  },
  {
    archetype: 'バルバトスルプス / ジャスティス',
    colors: 'Purple+White',
    colorDots: parseColors('Purple+White'),
    decks: 24,
    wins: 5,
    top4: 10,
    usePct: '1.5%',
    winPerEv: '2.8%',
    winPerDk: '20.8%',
    t4PerDk: '41.7%',
    score: 95,
    tier: 'T2',
  },
  {
    archetype: 'ガンダム / ジオング',
    colors: 'Blue+Green',
    colorDots: parseColors('Blue+Green'),
    decks: 111,
    wins: 9,
    top4: 49,
    usePct: '6.8%',
    winPerEv: '5.1%',
    winPerDk: '8.1%',
    t4PerDk: '44.1%',
    score: 94,
    tier: 'T2',
  },
  {
    archetype: 'ネオ・ジオング / ジャスティス',
    colors: 'Red+White',
    colorDots: parseColors('Red+White'),
    decks: 72,
    wins: 7,
    top4: 34,
    usePct: '4.4%',
    winPerEv: '4.0%',
    winPerDk: '9.7%',
    t4PerDk: '47.2%',
    score: 92,
    tier: 'T2',
  },
  {
    archetype: 'ジ・O / エールストライク',
    colors: 'Blue+White',
    colorDots: parseColors('Blue+White'),
    decks: 38,
    wins: 5,
    top4: 18,
    usePct: '2.3%',
    winPerEv: '2.8%',
    winPerDk: '13.2%',
    t4PerDk: '47.4%',
    score: 90,
    tier: 'T2',
  },
  {
    archetype: 'ウイングゼロ / ウイング',
    colors: 'Green+White',
    colorDots: parseColors('Green+White'),
    decks: 19,
    wins: 3,
    top4: 10,
    usePct: '1.2%',
    winPerEv: '1.7%',
    winPerDk: '15.8%',
    t4PerDk: '52.6%',
    score: 89,
    tier: 'T2',
  },
  {
    archetype: 'ウイングゼロ / エールストライク',
    colors: 'Green+White',
    colorDots: parseColors('Green+White'),
    decks: 120,
    wins: 8,
    top4: 46,
    usePct: '7.3%',
    winPerEv: '4.5%',
    winPerDk: '6.7%',
    t4PerDk: '38.3%',
    score: 83,
    tier: 'T2.5',
  },
  {
    archetype: 'デスティニー / エールストライク',
    colors: 'Purple+White',
    colorDots: parseColors('Purple+White'),
    decks: 49,
    wins: 3,
    top4: 28,
    usePct: '3.0%',
    winPerEv: '1.7%',
    winPerDk: '6.1%',
    t4PerDk: '57.1%',
    score: 81,
    tier: 'T2.5',
  },
  {
    archetype: 'ガンダム / バルバトスルプス',
    colors: 'Blue+Purple',
    colorDots: parseColors('Blue+Purple'),
    decks: 67,
    wins: 5,
    top4: 29,
    usePct: '4.1%',
    winPerEv: '2.8%',
    winPerDk: '7.5%',
    t4PerDk: '43.3%',
    score: 78,
    tier: 'T2.5',
  },
  {
    archetype: 'バルバトスルプス / グシオンリベイク',
    colors: 'Purple+White',
    colorDots: parseColors('Purple+White'),
    decks: 17,
    wins: 2,
    top4: 8,
    usePct: '1.0%',
    winPerEv: '1.1%',
    winPerDk: '11.8%',
    t4PerDk: '47.1%',
    score: 77,
    tier: 'T2.5',
  },
  {
    archetype: 'ガンダム / バンシィ・ノルン',
    colors: 'Blue+White',
    colorDots: parseColors('Blue+White'),
    decks: 27,
    wins: 3,
    top4: 11,
    usePct: '1.6%',
    winPerEv: '1.7%',
    winPerDk: '11.1%',
    t4PerDk: '40.7%',
    score: 75,
    tier: 'T2.5',
  },
  {
    archetype: 'Vガンダム / バンシィ・ノルン',
    colors: 'Blue+White',
    colorDots: parseColors('Blue+White'),
    decks: 38,
    wins: 4,
    top4: 14,
    usePct: '2.3%',
    winPerEv: '2.3%',
    winPerDk: '10.5%',
    t4PerDk: '36.8%',
    score: 74,
    tier: 'T2.5',
  },
  {
    archetype: 'プロヴィデンス / ジャスティス',
    colors: 'Red+White',
    colorDots: parseColors('Red+White'),
    decks: 31,
    wins: 3,
    top4: 9,
    usePct: '1.9%',
    winPerEv: '1.7%',
    winPerDk: '9.7%',
    t4PerDk: '29.0%',
    score: 64,
    tier: 'T3',
  },
  {
    archetype: 'ガンダム / ザクⅡ（シャア）',
    colors: 'Blue+Green',
    colorDots: parseColors('Blue+Green'),
    decks: 25,
    wins: 1,
    top4: 10,
    usePct: '1.5%',
    winPerEv: '0.6%',
    winPerDk: '4.0%',
    t4PerDk: '40.0%',
    score: 58,
    tier: 'T3',
  },
  {
    archetype: 'ユニコーン（Dモード） / ユニコーン（覚醒）',
    colors: 'Blue+White',
    colorDots: parseColors('Blue+White'),
    decks: 35,
    wins: 1,
    top4: 13,
    usePct: '2.1%',
    winPerEv: '0.6%',
    winPerDk: '2.9%',
    t4PerDk: '37.1%',
    score: 53,
    tier: 'T3',
  },
  {
    archetype: 'プロヴィデンス / エールストライク',
    colors: 'Red+White',
    colorDots: parseColors('Red+White'),
    decks: 22,
    wins: 0,
    top4: 6,
    usePct: '1.3%',
    winPerEv: '0.0%',
    winPerDk: '0.0%',
    t4PerDk: '27.3%',
    score: 0,
    tier: '--',
  },
]
</script>
