export function getGameDay() {
  const now = new Date()
  const utcMs = now.getTime() + now.getTimezoneOffset() * 60 * 1000
  const bangkokMs = utcMs + 7 * 60 * 60 * 1000
  const bangkok = new Date(bangkokMs)

  if (bangkok.getHours() < 3) {
    bangkok.setDate(bangkok.getDate() - 1)
  }

  const y = bangkok.getFullYear()
  const m = String(bangkok.getMonth() + 1).padStart(2, '0')
  const d = String(bangkok.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function formatGameDay(dateStr) {
  const [y, m, d] = dateStr.split('-')
  return `${d}/${m}/${y}`
}

export function daysBetween(dateStr1, dateStr2) {
  const d1 = new Date(dateStr1)
  const d2 = new Date(dateStr2)
  return Math.floor((d2 - d1) / (1000 * 60 * 60 * 24))
}

export function getTimeUntilReset() {
  const now = new Date()
  const utcMs = now.getTime() + now.getTimezoneOffset() * 60 * 1000
  const bangkokMs = utcMs + 7 * 60 * 60 * 1000
  const bangkok = new Date(bangkokMs)

  // Next reset = today 3am Bangkok, or tomorrow 3am if already past 3am
  const reset = new Date(bangkokMs)
  reset.setHours(3, 0, 0, 0)
  if (bangkok.getHours() >= 3) {
    reset.setDate(reset.getDate() + 1)
  }

  const diff = reset.getTime() - bangkokMs
  const h = Math.floor(diff / 3600000)
  const m = Math.floor((diff % 3600000) / 60000)
  const s = Math.floor((diff % 60000) / 1000)
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}
