export const percentOf = (value, total) => (total ? Math.round((value / total) * 100) : 0)

export const percentOf1 = (value, total) => (total ? ((value / total) * 100).toFixed(1) : 0)
