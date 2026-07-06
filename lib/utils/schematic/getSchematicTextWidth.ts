export function getSchematicTextWidth({
  text,
  fontSize,
}: {
  text: string
  fontSize: number
}) {
  const fontScale = fontSize / 0.18
  const charWidth = 0.12 * fontScale
  return text.length * charWidth
}
