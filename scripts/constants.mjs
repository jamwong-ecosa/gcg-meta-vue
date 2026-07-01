// Rank strings for winner / top-4 counting
export const WINNER = '優勝'
export const TOP4 = ['優勝', '準優勝', '3位', '4位']

// Card color → hex mapping for UI dot rendering
export const COLOR_HEX = {
  Blue: '#2b6cb0',
  White: '#cbd5e0',
  Purple: '#805ad5',
  Red: '#e53e3e',
  Green: '#38a169',
  Black: '#1a202c',
  Yellow: '#d69e2e',
}

// Sort order for card display in archetype card grid
export const TYPE_ORDER = { unit: 0, pilot: 1, command: 2, base: 3 }

// Featured-card selection priority (4 each type)
export const TYPE_PICK_ORDER = ['UNIT', 'PILOT', 'COMMAND', 'BASE']
