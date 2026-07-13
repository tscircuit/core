type SchematicDirection = "up" | "right" | "down" | "left"

/**
 * Rotate a facing direction ("up"/"right"/"down"/"left") counter-clockwise by
 * the given number of degrees (rounded to the nearest quarter turn).
 */
export function rotateDirection(
  direction: string,
  ccwRotationDegrees: number,
): SchematicDirection {
  const directions: SchematicDirection[] = ["right", "up", "left", "down"]
  const currentIndex = directions.indexOf(direction as SchematicDirection)
  if (currentIndex === -1) return direction as SchematicDirection

  const steps = Math.round(ccwRotationDegrees / 90)
  const newIndex = (currentIndex + steps) % 4

  return directions[newIndex < 0 ? newIndex + 4 : newIndex]
}

/**
 * Return the symbol name a schematic component would use after being rotated
 * counter-clockwise by `ccwRotationDegrees`. Directional symbols
 * (`..._right`/`..._down`) have their direction rotated, and orientation
 * symbols (`..._horz`/`..._vert`) are swapped on quarter turns. Any other
 * symbol name is returned unchanged.
 */
export function getRotatedSymbolName(
  symbolName: string | undefined,
  ccwRotationDegrees: number,
): string | undefined {
  if (!symbolName) return symbolName

  let rotatedSymbolName = symbolName

  const schematicSymbolDirection = rotatedSymbolName.match(
    /_(right|left|up|down)$/,
  )
  if (schematicSymbolDirection) {
    rotatedSymbolName = rotatedSymbolName.replace(
      schematicSymbolDirection[0],
      `_${rotateDirection(schematicSymbolDirection[1], ccwRotationDegrees)}`,
    )
  }

  const schematicSymbolOrientation = rotatedSymbolName.match(/_(horz|vert)$/)
  if (schematicSymbolOrientation && shouldSwapOrientation(ccwRotationDegrees)) {
    rotatedSymbolName = rotatedSymbolName.replace(
      schematicSymbolOrientation[0],
      schematicSymbolOrientation[1] === "horz" ? "_vert" : "_horz",
    )
  }

  return rotatedSymbolName
}

/**
 * Whether rotating counter-clockwise by `ccwRotationDegrees` swaps a component's
 * orientation, i.e. a 90° or 270° turn. Such a rotation transposes the
 * component's width and height (and its `..._horz`/`..._vert` symbol variant).
 */
export function shouldSwapOrientation(ccwRotationDegrees: number): boolean {
  const normalizedRotation =
    ((Math.round(ccwRotationDegrees) % 360) + 360) % 360
  return normalizedRotation === 90 || normalizedRotation === 270
}

/**
 * Bounding-box dimensions of a `{ width, height }` after rotating it
 * counter-clockwise by `ccwRotationDegrees`: width and height swap when the
 * rotation swaps orientation and are unchanged otherwise. Swapping is its own
 * inverse, so passing the same rotation again maps the dimensions back to the
 * original frame.
 */
export function getRotatedSize(
  size: { width: number; height: number },
  ccwRotationDegrees: number,
): { width: number; height: number } {
  if (!shouldSwapOrientation(ccwRotationDegrees)) return size
  return { width: size.height, height: size.width }
}
