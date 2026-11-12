// Bar colour per card type in the level and cost charts (ChartDeckCurve) and
// the key above them (ChartDeckCurvePair), in stacking order
export const CURVE_TYPE_STYLE = {
  UNIT: { bar: tw`bg-ruri dark:bg-sky-600` },
  PILOT: { bar: tw`bg-sky-400 dark:bg-sky-300` },
  COMMAND: { bar: tw`bg-amber-400 dark:bg-amber-500` },
  BASE: { bar: tw`bg-emerald-500 dark:bg-emerald-600` },
}
export const CURVE_TYPES = Object.keys(CURVE_TYPE_STYLE)
