/**
 * Helper to extract pins from a side definition.
 *
 * The side definition can be either:
 * - An array of pin numbers/labels (new simplified syntax): [1, 2, 3]
 * - An object with pins and optional direction: { pins: [1, 2, 3], direction: "top-to-bottom" }
 *
 * Note: The @tscircuit/props Zod schema transforms arrays to objects during parsing,
 * so at runtime the value should always be an object. However, TypeScript types
 * show the input type which includes arrays.
 *
 * @param sideDefinition The side definition (array or object)
 * @returns The pins array, or empty array if undefined
 */
export function getPinsFromSideDefinition(
  sideDefinition:
    | { pins: (number | string)[]; direction?: string }
    | (number | string)[]
    | undefined,
): (number | string)[] {
  if (!sideDefinition) return []
  if (Array.isArray(sideDefinition)) return sideDefinition
  return sideDefinition.pins ?? []
}

/**
 * Helper to extract direction from a side definition.
 *
 * @param sideDefinition The side definition (array or object)
 * @param defaultDirection The default direction if not specified or if it's an array
 * @returns The direction
 */
export function getDirectionFromSideDefinition(
  sideDefinition:
    | { pins: (number | string)[]; direction?: string }
    | (number | string)[]
    | undefined,
  defaultDirection: string,
): string {
  if (!sideDefinition) return defaultDirection
  if (Array.isArray(sideDefinition)) return defaultDirection
  return sideDefinition.direction ?? defaultDirection
}
