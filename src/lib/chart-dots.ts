/**
 * A dot on every data point of a line chart -- each day, month or year the
 * current range shows (Carlos, 2026-09-29). Dots shrink as the range gets
 * denser, so fifteen years of monthly closes still read as a line rather
 * than a bead necklace. Pass the returned object to a Recharts `dot` prop.
 */
export function pointDot(count: number, color: string) {
  const r = count <= 40 ? 3 : count <= 90 ? 2.4 : count <= 200 ? 1.8 : 1.3
  return {
    r,
    fill: color,
    // A thin ring in the card colour separates dots from the line on short ranges.
    stroke: 'var(--card)',
    strokeWidth: count <= 90 ? 1.25 : 0,
  }
}
