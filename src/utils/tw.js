import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export const tw = (strings, ...values) => {
  const combined = strings.reduce((acc, str, i) => acc + str + (values[i] ?? ''), '')
  return twMerge(clsx(combined))
}
