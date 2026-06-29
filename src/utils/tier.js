export function tierBarClass(tier) {
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

export function tierBorderClass(tier) {
  const map = {
    T1: tw`border-red-300 dark:border-red-800`,
    'T1.5': tw`border-orange-300 dark:border-orange-800`,
    T2: tw`border-amber-400 dark:border-amber-800`,
    'T2.5': tw`border-green-300 dark:border-green-800`,
    T3: tw`border-blue-300 dark:border-blue-900/65`,
    '--': tw`border-gray-300 dark:border-gray-700`,
  }
  return map[tier] || tw`border-gray-300 dark:border-gray-700`
}

export function tierPillClass(tier) {
  const map = {
    T1: tw`bg-red-100 text-red-700 dark:bg-red-800/50 dark:text-red-300/90`,
    'T1.5': tw`bg-orange-100 text-orange-700 dark:bg-orange-700/50 dark:text-orange-300/70`,
    T2: tw`bg-amber-100 text-amber-700 dark:bg-yellow-800/50 dark:text-yellow-400/70`,
    'T2.5': tw`bg-green-100 text-green-700 dark:bg-green-900/70 dark:text-green-500/80`,
    T3: tw`bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400/90`,
    '--': tw`bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400`,
  }
  return map[tier] || tw`bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400`
}
