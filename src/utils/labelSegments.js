function buildSegmentsFor(part, sigCards) {
  if (!sigCards?.length) {
    return [{ text: part }]
  }
  let rest = part
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

export function buildLabelSegments(combo, sigCards, { skipBaseCombo } = {}) {
  const parenMatch = combo.match(/^(.+?)\s*[（(](.+)[）)]$/)
  const baseCombo = parenMatch ? parenMatch[1].trimEnd() : combo
  const qualifier = parenMatch ? parenMatch[2] : ''

  if (skipBaseCombo) {
    return buildSegmentsFor(qualifier, sigCards)
  }

  // The base is a color combo ('Red+White'); show it in the current language
  const segs = [{ text: comboName(baseCombo) }]
  if (qualifier) {
    segs.push({ text: '（' })
    segs.push(...buildSegmentsFor(qualifier, sigCards))
    segs.push({ text: '）' })
  }
  return segs
}
