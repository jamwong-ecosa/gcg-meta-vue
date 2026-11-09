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

// Group bar behind a tier's rows (tier table, mobile cards): a light wash of
// the tier's colour, lighter than its pill. Opaque, dark mode included (the
// colour mixed into the surface), since the mobile bar is sticky and rows scroll under it
export function tierBandClass(tier) {
  const map = {
    S: tw`bg-[color-mix(in_oklab,var(--color-red-500)_4%,var(--color-white))] dark:bg-[color-mix(in_oklab,var(--color-red-500)_6%,var(--color-nalika-surface))]`,
    A: tw`bg-[color-mix(in_oklab,var(--color-orange-500)_4%,var(--color-white))] dark:bg-[color-mix(in_oklab,var(--color-orange-500)_6%,var(--color-nalika-surface))]`,
    B: tw`bg-[color-mix(in_oklab,var(--color-amber-500)_5%,var(--color-white))] dark:bg-[color-mix(in_oklab,var(--color-amber-500)_6%,var(--color-nalika-surface))]`,
    C: tw`bg-[color-mix(in_oklab,var(--color-green-500)_4%,var(--color-white))] dark:bg-[color-mix(in_oklab,var(--color-green-500)_6%,var(--color-nalika-surface))]`,
    D: tw`bg-[color-mix(in_oklab,var(--color-blue-500)_4%,var(--color-white))] dark:bg-[color-mix(in_oklab,var(--color-blue-500)_6%,var(--color-nalika-surface))]`,
  }
  return map[tier] || tw`bg-gray-100 dark:bg-white/10`
}

// Group bar for a colour-combo group (group by colour): its colours blended left
// to right, each lightly mixed into the surface (white, or the dark surface) so
// the bar stays opaque like the tier bars. Pair the style with COLOR_BAND_BASE
export const COLOR_BAND_BASE = tw`[--band-base:var(--color-white)] dark:[--band-base:var(--color-nalika-surface)]`
export function colorBandStyle(dots = []) {
  const tints = dots.map(d => `color-mix(in oklab, ${d.hex} 6%, var(--band-base))`)
  if (!tints.length) {
    return {}
  }
  return { background: tints.length > 1 ? `linear-gradient(90deg, ${tints.join(', ')})` : tints[0] }
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

const TIER_RANKS = ['S', 'A', 'B', 'C', 'D', '--']

// Direction of a tier change: 'up' (promoted, e.g. B → A), 'down', or null when unchanged/unknown
export function tierShift(prevTier, tier) {
  const from = TIER_RANKS.indexOf(prevTier)
  const to = TIER_RANKS.indexOf(tier)
  if (from < 0 || to < 0 || from === to) {
    return null
  }
  return to < from ? 'up' : 'down'
}

// Hover help for tier table headers and mobile stat labels (keys of `tier.help`)
export const tierColumnHelp = key => translate(`tier.help.${key}`)

export const darkHorseHelp = () => translate('tier.help.darkHorse')
