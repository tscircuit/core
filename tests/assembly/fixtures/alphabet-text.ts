import {
  glyphAdvanceRatio,
  glyphLineAlphabet,
  spaceWidthRatio,
  strokeWidthRatio,
} from "@tscircuit/alphabet"

export function alphabetText({
  text,
  x,
  y,
  size = 17,
}: {
  text: string
  x: number
  y: number
  size?: number
}) {
  let cursor = x
  const segments: string[] = []
  for (const character of text) {
    // Alphabet does not yet include these code punctuation glyphs.
    if (character === "{" || character === "}") {
      const points = [
        [0.55, 0.85],
        [0.35, 0.85],
        [0.25, 0.75],
        [0.25, 0.6],
        [0.1, 0.5],
        [0.25, 0.4],
        [0.25, 0.25],
        [0.35, 0.15],
        [0.55, 0.15],
      ]
      segments.push(
        points
          .map(
            ([px, py], i) =>
              `${i ? "L" : "M"} ${cursor + (character === "}" ? 0.65 - px! : px!) * size} ${y - py! * size}`,
          )
          .join(" "),
      )
      cursor += 0.65 * size
      continue
    }
    if (character === ":" || character === ";") {
      segments.push(
        `M ${cursor + 0.15 * size} ${y - 0.65 * size} l 0 ${0.025 * size} M ${cursor + 0.15 * size} ${y - 0.3 * size} l ${character === ";" ? -0.08 * size : 0} ${character === ";" ? 0.15 * size : 0.025 * size}`,
      )
      cursor += 0.3 * size
      continue
    }
    for (const stroke of glyphLineAlphabet[character] ?? []) {
      segments.push(
        `M ${cursor + stroke.x1 * size} ${y - stroke.y1 * size} L ${cursor + stroke.x2 * size} ${y - stroke.y2 * size}`,
      )
    }
    cursor += (glyphAdvanceRatio[character] ?? spaceWidthRatio) * size
  }
  return `<path d="${segments.join(" ")}" fill="none" stroke="#20344d" stroke-width="${size * strokeWidthRatio}" stroke-linecap="round"/>`
}
