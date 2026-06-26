<template>
  <div class="space-y-6 p-2 md:p-8">
    <h1 class="text-2xl font-bold text-gray-900 dark:text-nalika-text">Welcome to GCG</h1>
    <p class="text-gray-600 dark:text-nalika-text-muted">
      This is body text using Tailwind gray utilities.
    </p>
    <div
      class="overflow-hidden rounded-lg bg-white not-dark:shadow-xs not-dark:shadow-gray-400/15 dark:bg-nalika-surface"
    >
      <table class="w-full text-left text-sm">
        <thead class="hidden md:table-header-group">
          <tr class="bg-blue-50 dark:bg-nalika-header">
            <th class="px-4 py-3 font-semibold text-gray-900 dark:text-nalika-text">Archetype</th>
            <th class="px-4 py-3 font-semibold text-gray-900 dark:text-nalika-text">Colors</th>
            <th class="px-4 py-3 text-right font-semibold text-gray-900 dark:text-nalika-text">
              Decks
            </th>
            <th class="px-4 py-3 text-right font-semibold text-gray-900 dark:text-nalika-text">
              Wins
            </th>
            <th class="px-4 py-3 text-right font-semibold text-gray-900 dark:text-nalika-text">
              Top4
            </th>
            <th class="px-4 py-3 text-right font-semibold text-gray-900 dark:text-nalika-text">
              Use%
            </th>
            <th class="px-4 py-3 text-right font-semibold text-gray-900 dark:text-nalika-text">
              Win/Ev
            </th>
            <th class="px-4 py-3 text-right font-semibold text-gray-900 dark:text-nalika-text">
              Win/Dk
            </th>
            <th class="px-4 py-3 text-right font-semibold text-gray-900 dark:text-nalika-text">
              T4/Dk
            </th>
            <th class="px-4 py-3 text-right font-semibold text-gray-900 dark:text-nalika-text">
              Score
            </th>
            <th class="px-4 py-3 text-right font-semibold text-gray-900 dark:text-nalika-text">
              Tier
            </th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="row in rows"
            :key="row.archetype"
            class="mb-3 flex flex-col rounded-lg border border-gray-200 bg-white p-4 md:mb-0 md:table-row md:border-0 md:bg-transparent md:p-0 odd:md:bg-gray-100/5 even:md:bg-gray-100/45 dark:border-nalika-border dark:bg-nalika-surface dark:even:md:bg-white/3"
          >
            <td
              class="flex items-center justify-between border-b border-gray-100 py-2 md:table-cell md:border-0 md:px-4 md:py-3 dark:border-nalika-border/50"
            >
              <span class="text-xs font-semibold text-gray-500 md:hidden">Archetype</span>
              <span class="text-gray-900 dark:text-nalika-text">{{ row.archetype }}</span>
            </td>
            <td
              class="flex items-center justify-between border-b border-gray-100 py-2 md:table-cell md:border-0 md:px-4 md:py-3 dark:border-nalika-border/50"
            >
              <span class="text-xs font-semibold text-gray-500 md:hidden">Colors</span>
              <span class="rounded px-1.5 py-0.5 text-xs font-medium" :class="row.colorClass">{{
                row.colors
              }}</span>
            </td>
            <td
              class="flex items-center justify-between border-b border-gray-100 py-2 md:table-cell md:border-0 md:px-4 md:py-3 md:text-right dark:border-nalika-border/50"
            >
              <span class="text-xs font-semibold text-gray-500 md:hidden">Decks</span>
              <span class="font-mono text-gray-600 tabular-nums dark:text-nalika-text-muted">{{
                row.decks
              }}</span>
            </td>
            <td
              class="flex items-center justify-between border-b border-gray-100 py-2 md:table-cell md:border-0 md:px-4 md:py-3 md:text-right dark:border-nalika-border/50"
            >
              <span class="text-xs font-semibold text-gray-500 md:hidden">Wins</span>
              <span class="font-mono text-gray-600 tabular-nums dark:text-nalika-text-muted">{{
                row.wins
              }}</span>
            </td>
            <td
              class="flex items-center justify-between border-b border-gray-100 py-2 md:table-cell md:border-0 md:px-4 md:py-3 md:text-right dark:border-nalika-border/50"
            >
              <span class="text-xs font-semibold text-gray-500 md:hidden">Top4</span>
              <span class="font-mono text-gray-600 tabular-nums dark:text-nalika-text-muted">{{
                row.top4
              }}</span>
            </td>
            <td
              class="flex items-center justify-between border-b border-gray-100 py-2 md:table-cell md:border-0 md:px-4 md:py-3 md:text-right dark:border-nalika-border/50"
            >
              <span class="text-xs font-semibold text-gray-500 md:hidden">Use%</span>
              <span class="font-mono text-gray-600 tabular-nums dark:text-nalika-text-muted">{{
                row.usePct
              }}</span>
            </td>
            <td
              class="flex items-center justify-between border-b border-gray-100 py-2 md:table-cell md:border-0 md:px-4 md:py-3 md:text-right dark:border-nalika-border/50"
            >
              <span class="text-xs font-semibold text-gray-500 md:hidden">Win/Ev</span>
              <span class="font-mono text-gray-600 tabular-nums dark:text-nalika-text-muted">{{
                row.winPerEv
              }}</span>
            </td>
            <td
              class="flex items-center justify-between border-b border-gray-100 py-2 md:table-cell md:border-0 md:px-4 md:py-3 md:text-right dark:border-nalika-border/50"
            >
              <span class="text-xs font-semibold text-gray-500 md:hidden">Win/Dk</span>
              <span class="font-mono text-gray-600 tabular-nums dark:text-nalika-text-muted">{{
                row.winPerDk
              }}</span>
            </td>
            <td
              class="flex items-center justify-between border-b border-gray-100 py-2 md:table-cell md:border-0 md:px-4 md:py-3 md:text-right dark:border-nalika-border/50"
            >
              <span class="text-xs font-semibold text-gray-500 md:hidden">T4/Dk</span>
              <span class="font-mono text-gray-600 tabular-nums dark:text-nalika-text-muted">{{
                row.t4PerDk
              }}</span>
            </td>
            <td
              class="flex items-center justify-between border-b border-gray-100 py-2 md:table-cell md:border-0 md:px-4 md:py-3 md:text-right dark:border-nalika-border/50"
            >
              <span class="text-xs font-semibold text-gray-500 md:hidden">Score</span>
              <span class="font-mono text-gray-600 tabular-nums dark:text-nalika-text-muted">{{
                row.score
              }}</span>
            </td>
            <td
              class="flex items-center justify-between border-b-0 py-2 md:table-cell md:border-0 md:px-4 md:py-3 md:text-right"
            >
              <span class="text-xs font-semibold text-gray-500 md:hidden">Tier</span>
              <span class="rounded-full px-2 py-0.5 text-xs font-medium" :class="row.tierClass">{{
                row.tier
              }}</span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
const rows = [
  {
    archetype: 'ガンダム / バルバトス（第1形態）',
    colors: 'Blue+Purple',
    colorClass: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400',
    decks: 327,
    wins: 44,
    top4: 147,
    usePct: '19.9%',
    winPerEv: '25.0%',
    winPerDk: '13.5%',
    t4PerDk: '45.0%',
    score: 224,
    tier: 'T1',
    tierClass: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400',
  },
  {
    archetype: 'GQuuuuuuX（Ω起動時） / ジャスティス',
    colors: 'Red+White',
    colorClass: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400',
    decks: 146,
    wins: 23,
    top4: 64,
    usePct: '8.9%',
    winPerEv: '13.1%',
    winPerDk: '15.8%',
    t4PerDk: '43.8%',
    score: 153,
    tier: 'T1.5',
    tierClass: 'bg-lime-100 text-lime-700 dark:bg-lime-900/40 dark:text-lime-400',
  },
  {
    archetype: 'ガンダム / グシオンリベイク',
    colors: 'Blue+Purple',
    colorClass: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400',
    decks: 47,
    wins: 11,
    top4: 28,
    usePct: '2.9%',
    winPerEv: '6.3%',
    winPerDk: '23.4%',
    t4PerDk: '59.6%',
    score: 136,
    tier: 'T1.5',
    tierClass: 'bg-lime-100 text-lime-700 dark:bg-lime-900/40 dark:text-lime-400',
  },
  {
    archetype: 'ウイングゼロ / ジャスティス',
    colors: 'Green+White',
    colorClass: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400',
    decks: 35,
    wins: 6,
    top4: 16,
    usePct: '2.1%',
    winPerEv: '3.4%',
    winPerDk: '17.1%',
    t4PerDk: '45.7%',
    score: 98,
    tier: 'T2',
    tierClass: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-400',
  },
  {
    archetype: 'ネオ・ジオング / エールストライク',
    colors: 'Red+White',
    colorClass: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400',
    decks: 28,
    wins: 5,
    top4: 13,
    usePct: '1.7%',
    winPerEv: '2.8%',
    winPerDk: '17.9%',
    t4PerDk: '46.4%',
    score: 95,
    tier: 'T2',
    tierClass: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-400',
  },
  {
    archetype: 'バルバトスルプス / ジャスティス',
    colors: 'Purple+White',
    colorClass: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-400',
    decks: 24,
    wins: 5,
    top4: 10,
    usePct: '1.5%',
    winPerEv: '2.8%',
    winPerDk: '20.8%',
    t4PerDk: '41.7%',
    score: 95,
    tier: 'T2',
    tierClass: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-400',
  },
  {
    archetype: 'ガンダム / ジオング',
    colors: 'Blue+Green',
    colorClass: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-400',
    decks: 111,
    wins: 9,
    top4: 49,
    usePct: '6.8%',
    winPerEv: '5.1%',
    winPerDk: '8.1%',
    t4PerDk: '44.1%',
    score: 94,
    tier: 'T2',
    tierClass: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-400',
  },
  {
    archetype: 'ネオ・ジオング / ジャスティス',
    colors: 'Red+White',
    colorClass: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400',
    decks: 72,
    wins: 7,
    top4: 34,
    usePct: '4.4%',
    winPerEv: '4.0%',
    winPerDk: '9.7%',
    t4PerDk: '47.2%',
    score: 92,
    tier: 'T2',
    tierClass: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-400',
  },
  {
    archetype: 'ジ・O / エールストライク',
    colors: 'Blue+White',
    colorClass: 'bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-400',
    decks: 38,
    wins: 5,
    top4: 18,
    usePct: '2.3%',
    winPerEv: '2.8%',
    winPerDk: '13.2%',
    t4PerDk: '47.4%',
    score: 90,
    tier: 'T2',
    tierClass: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-400',
  },
  {
    archetype: 'ウイングゼロ / ウイング',
    colors: 'Green+White',
    colorClass: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400',
    decks: 19,
    wins: 3,
    top4: 10,
    usePct: '1.2%',
    winPerEv: '1.7%',
    winPerDk: '15.8%',
    t4PerDk: '52.6%',
    score: 89,
    tier: 'T2',
    tierClass: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-400',
  },
  {
    archetype: 'ウイングゼロ / エールストライク',
    colors: 'Green+White',
    colorClass: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400',
    decks: 120,
    wins: 8,
    top4: 46,
    usePct: '7.3%',
    winPerEv: '4.5%',
    winPerDk: '6.7%',
    t4PerDk: '38.3%',
    score: 83,
    tier: 'T2.5',
    tierClass: 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-400',
  },
  {
    archetype: 'デスティニー / エールストライク',
    colors: 'Purple+White',
    colorClass: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-400',
    decks: 49,
    wins: 3,
    top4: 28,
    usePct: '3.0%',
    winPerEv: '1.7%',
    winPerDk: '6.1%',
    t4PerDk: '57.1%',
    score: 81,
    tier: 'T2.5',
    tierClass: 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-400',
  },
  {
    archetype: 'ガンダム / バルバトスルプス',
    colors: 'Blue+Purple',
    colorClass: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400',
    decks: 67,
    wins: 5,
    top4: 29,
    usePct: '4.1%',
    winPerEv: '2.8%',
    winPerDk: '7.5%',
    t4PerDk: '43.3%',
    score: 78,
    tier: 'T2.5',
    tierClass: 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-400',
  },
  {
    archetype: 'バルバトスルプス / グシオンリベイク',
    colors: 'Purple+White',
    colorClass: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-400',
    decks: 17,
    wins: 2,
    top4: 8,
    usePct: '1.0%',
    winPerEv: '1.1%',
    winPerDk: '11.8%',
    t4PerDk: '47.1%',
    score: 77,
    tier: 'T2.5',
    tierClass: 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-400',
  },
  {
    archetype: 'ガンダム / バンシィ・ノルン',
    colors: 'Blue+White',
    colorClass: 'bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-400',
    decks: 27,
    wins: 3,
    top4: 11,
    usePct: '1.6%',
    winPerEv: '1.7%',
    winPerDk: '11.1%',
    t4PerDk: '40.7%',
    score: 75,
    tier: 'T2.5',
    tierClass: 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-400',
  },
  {
    archetype: 'Vガンダム / バンシィ・ノルン',
    colors: 'Blue+White',
    colorClass: 'bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-400',
    decks: 38,
    wins: 4,
    top4: 14,
    usePct: '2.3%',
    winPerEv: '2.3%',
    winPerDk: '10.5%',
    t4PerDk: '36.8%',
    score: 74,
    tier: 'T2.5',
    tierClass: 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-400',
  },
  {
    archetype: 'プロヴィデンス / ジャスティス',
    colors: 'Red+White',
    colorClass: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400',
    decks: 31,
    wins: 3,
    top4: 9,
    usePct: '1.9%',
    winPerEv: '1.7%',
    winPerDk: '9.7%',
    t4PerDk: '29.0%',
    score: 64,
    tier: 'T3',
    tierClass: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400',
  },
  {
    archetype: 'ガンダム / ザクⅡ（シャア）',
    colors: 'Blue+Green',
    colorClass: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-400',
    decks: 25,
    wins: 1,
    top4: 10,
    usePct: '1.5%',
    winPerEv: '0.6%',
    winPerDk: '4.0%',
    t4PerDk: '40.0%',
    score: 58,
    tier: 'T3',
    tierClass: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400',
  },
  {
    archetype: 'ユニコーン（Dモード） / ユニコーン（覚醒）',
    colors: 'Blue+White',
    colorClass: 'bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-400',
    decks: 35,
    wins: 1,
    top4: 13,
    usePct: '2.1%',
    winPerEv: '0.6%',
    winPerDk: '2.9%',
    t4PerDk: '37.1%',
    score: 53,
    tier: 'T3',
    tierClass: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400',
  },
  {
    archetype: 'プロヴィデンス / エールストライク',
    colors: 'Red+White',
    colorClass: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400',
    decks: 22,
    wins: 0,
    top4: 6,
    usePct: '1.3%',
    winPerEv: '0.0%',
    winPerDk: '0.0%',
    t4PerDk: '27.3%',
    score: 0,
    tier: '--',
    tierClass: 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400',
  },
]
</script>
