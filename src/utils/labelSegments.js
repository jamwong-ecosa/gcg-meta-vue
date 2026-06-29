import { COLOR_TEXT } from './colors.js'

export function buildLabelSegments(combo, sigCards) {
  if (!sigCards?.length) {
    return [{ text: combo }]
  }
  let rest = combo
  const segs = []
  for (const sc of sigCards) {
    const idx = rest.indexOf(sc.name)
    if (idx === -1) {
      continue
    }
    if (idx > 0) {
      segs.push({ text: rest.slice(0, idx) })
    }
    segs.push({ text: sc.name, color: COLOR_TEXT[sc.color] })
    rest = rest.slice(idx + sc.name.length)
  }
  if (rest) {
    segs.push({ text: rest })
  }
  return segs
}
