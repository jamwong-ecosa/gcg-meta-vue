import axios from 'axios'
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs'
import { join } from 'node:path'

const dataFile = 'data/cards.json'
const outDir = 'data/images'
const concurrency = 10

function getImageUrl(imageUrl) {
  return imageUrl.split('?')[0]
}

function getDest(imageUrl) {
  return join(outDir, getImageUrl(imageUrl).split('/').pop())
}

async function downloadImage(url, dest) {
  const res = await axios.get(url, { responseType: 'arraybuffer' })
  writeFileSync(dest, Buffer.from(res.data))
}

if (!existsSync(dataFile)) {
  console.error(`${dataFile} not found. Run \`npm run scrape:cards\` first.`)
  process.exit(1)
}

const cards = JSON.parse(readFileSync(dataFile, 'utf8'))

mkdirSync(outDir, { recursive: true })

const seen = new Set()
const unique = []
for (const c of cards) {
  if (!c.imageUrl || seen.has(c.imageUrl)) {
    continue
  }
  seen.add(c.imageUrl)
  const dest = getDest(c.imageUrl)
  unique.push({ url: c.imageUrl, dest, exists: existsSync(dest) })
}

console.log(`Downloading ${unique.length} unique card images to ${outDir}/`)

let done = 0
let skipped = 0
let failed = 0

for (let i = 0; i < unique.length; i += concurrency) {
  const batch = unique.slice(i, i + concurrency)
  const results = await Promise.allSettled(
    batch.map(item =>
      item.exists
        ? Promise.resolve('skipped')
        : downloadImage(item.url, item.dest).then(() => 'done'),
    ),
  )
  results.forEach((r, j) => {
    if (r.status === 'rejected') {
      failed++
      console.error(`  FAILED ${batch[j].url}: ${r.reason.message}`)
    } else if (r.value === 'done') {
      done++
    } else {
      skipped++
    }
  })
  const processed = Math.min(i + concurrency, unique.length)
  if (processed % 50 === 0 || processed === unique.length) {
    console.log(`  Progress: ${processed}/${unique.length} (${done} new, ${skipped} cached)`)
  }
}

console.log(`Complete — ${done} downloaded, ${skipped} already existed, ${failed} failed`)
