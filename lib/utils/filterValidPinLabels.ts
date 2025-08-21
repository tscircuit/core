import { chipProps } from "@tscircuit/props"

/**
 * Filters out invalid pin labels while preserving valid ones.
 * This allows components to render even if some pin labels are invalid.
 *
 * Uses the actual chipProps zod schema to validate pin labels,
 * ensuring consistency with the real validation logic.
 */
export function filterValidPinLabels(
  pinLabels: Record<string, string | string[] | readonly string[]> | undefined,
): Record<string, string | string[]> | undefined {
  if (!pinLabels) return pinLabels

  const validPinLabels: Record<string, string | string[]> = {}

  for (const [pin, labelOrLabels] of Object.entries(pinLabels)) {
    const labels: string[] = Array.isArray(labelOrLabels)
      ? (labelOrLabels as string[]).slice() // Convert readonly to mutable
      : [labelOrLabels as string]
    const validLabels: string[] = []

    for (const label of labels) {
      if (isValidPinLabel(pin, label)) {
        validLabels.push(label)
      } else {
        console.warn(`Skipping invalid pin label: ${pin} = "${label}"`)
      }
    }

    // Only include this pin if it has at least one valid label
    if (validLabels.length > 0) {
      validPinLabels[pin] = Array.isArray(labelOrLabels)
        ? validLabels
        : validLabels[0]
    }
  }

  return Object.keys(validPinLabels).length > 0 ? validPinLabels : undefined
}

/**
 * Checks if a pin label is valid using the actual chipProps zod schema.
 * This ensures we use the same validation logic as the component itself.
 */
function isValidPinLabel(pin: string, label: string): boolean {
  try {
    // HACK: This is a hack to check if a pin label is valid using the actual chipProps zod schema.
    const testProps = {
      name: "test",
      footprint: "test",
      pinLabels: { [pin]: label },
    }

    const result = chipProps.safeParse(testProps)
    return result.success
  } catch (error) {
    return false
  }
}
