export function tierBarClass(tier) {
  const map = {
    S: tw`bg-red-300 dark:bg-red-700`,
    A: tw`bg-orange-300 dark:bg-orange-700`,
    B: tw`bg-amber-400 dark:bg-amber-700`,
    C: tw`bg-green-300 dark:bg-green-700`,
    D: tw`bg-blue-300 dark:bg-blue-900`,
    '--': tw`bg-gray-300 dark:bg-gray-700`,
  }
  return map[tier] || tw`bg-gray-300 dark:bg-gray-700`
}

export function tierBorderClass(tier) {
  const map = {
    S: tw`border-red-300 dark:border-red-800`,
    A: tw`border-orange-300 dark:border-orange-800`,
    B: tw`border-amber-400 dark:border-amber-800`,
    C: tw`border-green-300 dark:border-green-800`,
    D: tw`border-blue-300 dark:border-blue-900/65`,
    '--': tw`border-gray-300 dark:border-gray-700`,
  }
  return map[tier] || tw`border-gray-300 dark:border-gray-700`
}

export function tierPillClass(tier) {
  const map = {
    S: tw`bg-red-100 text-red-700 dark:bg-red-800/50 dark:text-red-300/90`,
    A: tw`bg-orange-100 text-orange-700 dark:bg-orange-700/50 dark:text-orange-300/70`,
    B: tw`bg-amber-100 text-amber-700 dark:bg-yellow-800/50 dark:text-yellow-400/70`,
    C: tw`bg-green-100 text-green-700 dark:bg-green-900/70 dark:text-green-500/80`,
    D: tw`bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400/90`,
    '--': tw`bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400`,
  }
  return map[tier] || tw`bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400`
}
