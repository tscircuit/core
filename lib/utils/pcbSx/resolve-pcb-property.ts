import type { PcbSx } from "@tscircuit/props"
import type { PrimitiveComponent } from "lib/components/base-components/PrimitiveComponent"

/**
 * Parse a single selector segment like "footprint[src^='kicad:']" into
 * { tag: "footprint", attrName: "src", attrOp: "^=", attrValue: "kicad:" }
 */
function parseSegment(seg: string): {
  tag: string
  attrName?: string
  attrOp?: string
  attrValue?: string
} {
  const bracketIdx = seg.indexOf("[")
  if (bracketIdx === -1) return { tag: seg }

  const tag = seg.slice(0, bracketIdx)
  const attrPart = seg.slice(bracketIdx + 1, seg.lastIndexOf("]"))
  // Match patterns like: attr^='value', attr='value', attr$='value'
  const m = attrPart.match(/^(\w+)(\^=|\$=|=)['"]?(.*?)['"]?$/)
  if (!m) return { tag }
  return { tag, attrName: m[1], attrOp: m[2], attrValue: m[3] }
}

/**
 * Check if a component matches a single selector segment.
 */
function componentMatchesSegment(
  component: PrimitiveComponent,
  seg: ReturnType<typeof parseSegment>,
): boolean {
  if (component.lowercaseComponentName !== seg.tag) return false
  if (!seg.attrName) return true

  // Check attribute against component.props (raw, before zod stripping)
  const attrVal = (component.props as any)?.[seg.attrName]
  if (attrVal === undefined) return false

  const valStr = String(attrVal)
  switch (seg.attrOp) {
    case "^=":
      return valStr.startsWith(seg.attrValue!)
    case "$=":
      return valStr.endsWith(seg.attrValue!)
    case "=":
      return valStr === seg.attrValue
    default:
      return false
  }
}

/**
 * Check if a component and its ancestor chain match a compound selector
 * (descendant combinator). The last segment must match the component itself,
 * and preceding segments must match ancestors in order (not necessarily
 * immediate parents).
 */
function matchesCompoundSelector(
  component: PrimitiveComponent,
  segments: ReturnType<typeof parseSegment>[],
): boolean {
  // Last segment must match the component itself
  if (!componentMatchesSegment(component, segments[segments.length - 1])) {
    return false
  }

  // Walk up the tree matching remaining segments (right to left)
  let segIdx = segments.length - 2
  let current: PrimitiveComponent | null = component.parent

  while (segIdx >= 0 && current) {
    if (componentMatchesSegment(current, segments[segIdx])) {
      segIdx--
    }
    current = current.parent
  }

  return segIdx < 0
}

/**
 * Resolves a single property from a PcbSx record for a given component.
 *
 * Supports simple selectors like "& silkscreentext" as well as compound
 * descendant selectors like "& footprint[src^='kicad:'] silkscreentext".
 *
 * @param propertyName - The property to look up (e.g. "fontSize")
 * @param resolvedPcbSx - The merged PcbSx from the ancestor chain
 * @param pathFromAmpersand - The simple selector path (e.g. "silkscreentext")
 * @param component - The component to resolve for (enables compound matching)
 */
export function resolvePcbProperty({
  propertyName,
  resolvedPcbSx,
  pathFromAmpersand,
  component,
}: {
  propertyName: string
  resolvedPcbSx: PcbSx | undefined
  pathFromAmpersand: string
  component?: PrimitiveComponent
}): number | string | undefined {
  if (!resolvedPcbSx) return undefined

  let result: number | string | undefined
  let bestSpecificity = 0

  for (const [key, entry] of Object.entries(resolvedPcbSx)) {
    if (!entry || !(propertyName in entry)) continue

    // Remove the "& " prefix
    const selectorBody = key.startsWith("& ") ? key.slice(2) : key

    // Simple exact match (e.g. "silkscreentext")
    if (selectorBody === pathFromAmpersand) {
      const specificity = 1
      if (specificity > bestSpecificity) {
        bestSpecificity = specificity
        result = (entry as any)[propertyName]
      }
      continue
    }

    // Compound selector matching requires a component reference
    if (!component) continue

    const segments = selectorBody.split(/\s+/).map(parseSegment)
    if (segments.length < 2) continue

    if (matchesCompoundSelector(component, segments)) {
      // More segments = more specific
      const specificity = segments.length
      if (specificity > bestSpecificity) {
        bestSpecificity = specificity
        result = (entry as any)[propertyName]
      }
    }
  }

  return result
}
