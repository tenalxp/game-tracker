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
