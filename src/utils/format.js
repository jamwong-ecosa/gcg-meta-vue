export const percentOf = (value, total) => (total ? Math.round((value / total) * 100) : 0)

export const percentOf1 = (value, total) => (total ? ((value / total) * 100).toFixed(1) : 0)

// Splits an event name into its venue and the trailing player cap ("…店定員64名"),
// so a row can clip the venue in the middle and still show the cap
export function splitEventName(name = '') {
  const m = name.match(/^(.*?)\s*(定員\d+名)$/)
  return m ? { venue: m[1], cap: m[2] } : { venue: name, cap: '' }
}
