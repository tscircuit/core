const SCHEMATIC_TEXT_WIDTH_FACTOR = 0.6

export function getSchematicTextWidth({
  text,
  fontSize,
}: {
  text: string
  fontSize: number
}) {
  return text.length * fontSize * SCHEMATIC_TEXT_WIDTH_FACTOR
}
