// Tier rows use fullwidth parens ("Red+White（A / B）") while the archetype
// manifest uses ASCII ("Red+White (A / B)"); normalize both to compare them
export function normalizeArchetypeName(name) {
  return name.replace(/[（）]/g, c => (c === '（' ? '(' : ')')).replace(/\s*\(/g, '(')
}
