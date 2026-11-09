// Where the unit's head (or the character's face) sits on each card image, as
// fractions of the card's width and height, for crops that show the face. An
// optional third item moves the top-left corner of the illustration trim (ART).
// Image services find human faces, not mobile suits, so these are set by eye.
// Covers the cards the colour pie chart uses; others fall back to the default,
// the upper middle of the art.
const CARD_FOCUS = {
  'GD01-001': [0.83, 0.29], // ガンダム
  'GD01-024': [0.67, 0.18], // ウイングガンダムゼロ
  'GD01-066': [0.63, 0.19], // ジャスティスガンダム
  // Head right under the cost box: trim from just below the box and right of
  // the purple bar, keeping as much art as possible left of and above the head
  'GD03-050': [0.208, 0.233, { x: 50, y: 142 }], // ガンダム・バルバトスルプス
  'GD04-017': [0.4, 0.36], // ジオング
  'GD04-065': [0.52, 0.19], // バンシィ・ノルン
  'GD05-002': [0.41, 0.24], // ストライクフリーダムガンダム
  'GD05-017': [0.38, 0.31], // νガンダム
  // Head near the left edge, below the cost box: trim from just right of the colour bar
  'GD05-033': [0.25, 0.36, { x: 75, y: 180 }], // マスターガンダム
  'GD05-049': [0.59, 0.2], // サザビー
  'ST01-001': [0.48, 0.14], // ガンダム
  'ST03-006': [0.4, 0.25], // ザクⅡ（シャア・アズナブル機）
  'ST04-001': [0.53, 0.25], // エールストライクガンダム
  'EXRP-002': [0.53, 0.23], // EXリソース (Lacus)
}

const DEFAULT_FOCUS = [0.5, 0.3]

// The illustration on a card image (source 600×838): right of the colour bar
// and the level/cost box, below the top strip, left of the fine print, above the name
const ART = { x: 100, y: 42, w: 470, h: 478 }
const SRC = { w: 600, h: 838 }

// A square crop around the card's face, cut by hand rather than left to the
// image service, so we know where the face lands: { url, u, v }, with u and v
// the face's position in the crop as fractions (0.5, 0.5 is the centre). The
// square stays inside the illustration (ART), so a face near its edge is
// off-centre rather than letting the card frame in; callers line the image up
// on (u, v). `zoom` 1.3 is a square about 3/4 of the illustration's shorter
// side: the unit around its face, and no more enlarged than the source allows
export function cardFace(cardId, width, zoom = 1.3) {
  const [x, y, corner] = CARD_FOCUS[cardId] ?? DEFAULT_FOCUS
  const left = corner?.x ?? ART.x
  const top = corner?.y ?? ART.y
  const right = ART.x + ART.w
  const bottom = ART.y + ART.h
  const side = Math.round(Math.min(right - left, bottom - top) / zoom)
  const fx = x * SRC.w
  const fy = y * SRC.h
  const clamp = (v, lo, hi) => Math.round(Math.min(hi, Math.max(lo, v)))
  const cropX = clamp(fx - side / 2, left, right - side)
  const cropY = clamp(fy - side / 2, top, bottom - side)
  return {
    url: `https://jw-assets.imgix.net/gcg-img/${cardId}.webp?rect=${cropX},${cropY},${side},${side}&w=${width}&auto=format,compress`,
    u: (fx - cropX) / side,
    v: (fy - cropY) / side,
  }
}
