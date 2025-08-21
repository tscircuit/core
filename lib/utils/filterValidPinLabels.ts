import { chipProps } from "@tscircuit/props"

/**
 * Sanitizes pin labels by replacing invalid ones with "INVALID_NAME".
 * This allows components to render even if some pin labels are invalid,
 * while providing clear visual feedback about problematic labels.
 *
 * Uses the actual chipProps zod schema to validate pin labels,
 * ensuring consistency with the real validation logic.
 */
export function sanitizePinLabels(
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
        console.warn(
          `Invalid pin label: ${pin} = "${label}" - replacing with "INVALID_NAME"`,
        )
        validLabels.push("INVALID_NAME")
      }
    }

    // Always include the pin since we replace invalid labels with "INVALID_NAME"
    validPinLabels[pin] = Array.isArray(labelOrLabels)
      ? validLabels
      : validLabels[0]
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
