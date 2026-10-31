// Fetches every NYT Wordle answer from 19 Jun 2021 up to today (never future days)
// and writes answers.js (window.ANSWERS = {date: word}) into each directory given.
// Usage: node scripts/answers.mjs public build
// Cache: scripts/answers.json, so a daily run fetches only the new day.
import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const cacheFile = join(dirname(fileURLToPath(import.meta.url)), 'answers.json')
const cache = existsSync(cacheFile) ? JSON.parse(readFileSync(cacheFile, 'utf8')) : {}

const iso = (d) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
const today = iso(new Date())
const missing = []
for (let d = new Date(2021, 5, 19); iso(d) <= today; d.setDate(d.getDate() + 1)) {
  if (!cache[iso(d)]) missing.push(iso(d))
}

const failed = []
for (let i = 0; i < missing.length; i += 8) {
  await Promise.all(
    missing.slice(i, i + 8).map(async (date) => {
      const res = await fetch(`https://www.nytimes.com/svc/wordle/v2/${date}.json`)
      if (!res.ok) return failed.push(`${date} ${res.status}`)
      cache[date] = (await res.json()).solution
    })
  )
}

const sorted = Object.fromEntries(Object.entries(cache).filter(([d]) => d <= today).sort())
writeFileSync(cacheFile, JSON.stringify(sorted, null, 0) + '\n')
const js = `window.ANSWERS = ${JSON.stringify(sorted)}\n`
for (const dir of process.argv.slice(2)) writeFileSync(join(dir, 'answers.js'), js)

console.log(`${Object.keys(sorted).length} answers, ${missing.length - failed.length} fetched, latest ${today}`)
if (failed.length) {
  console.error(`failed: ${failed.join(', ')}`)
  process.exit(1)
}
