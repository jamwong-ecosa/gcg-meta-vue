// Play styles in display order (fastest first) and their solid colours for
// bars and dots; UiStylePill has the matching outlined tones. The style itself
// comes from the data build (scripts/play-style.mjs)
export const PLAY_STYLES = ['aggro', 'midrange', 'control', 'combo']

export const PLAY_STYLE_FILL = {
  aggro: tw`bg-rose-500 dark:bg-rose-400`,
  midrange: tw`bg-teal-500 dark:bg-teal-400`,
  control: tw`bg-indigo-500 dark:bg-indigo-400`,
  combo: tw`bg-fuchsia-500 dark:bg-fuchsia-400`,
}
