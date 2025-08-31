import { chipProps } from "@tscircuit/props"

/**
 * Filters out invalid pin labels while preserving valid ones.
 * This allows components to render even if some pin labels are invalid.
 * Invalid labels are excluded with clear warning messages.
 *
 * Uses the actual chipProps zod schema to validate pin labels,
 * ensuring consistency with the real validation logic.
 */
export function filterPinLabels(
  pinLabels:
    | Record<string, string | string[] | readonly string[]>
    | string[]
    | readonly string[]
    | undefined,
): {
  validPinLabels: Record<string, string | string[]> | string[] | undefined
  invalidPinLabelsMessages: string[]
} {
  if (!pinLabels) {
    return {
      validPinLabels: pinLabels as undefined,
      invalidPinLabelsMessages: [],
    }
  }

  const invalidPinLabelsMessages: string[] = []

  // Handle array-style pinLabels
  if (Array.isArray(pinLabels)) {
    const validLabels: Array<string | undefined> = Array(pinLabels.length)
    pinLabels.forEach((label, index) => {
      const pinKey = `pin${index + 1}`
      if (isValidPinLabel(pinKey, label)) {
        validLabels[index] = label
      } else {
        invalidPinLabelsMessages.push(
          `Invalid pin label: ${pinKey} = '${label}' - excluding from component. Please use a valid pin label.`,
        )
      }
    })

    return {
      validPinLabels: validLabels.some(Boolean)
        ? (validLabels as string[])
        : undefined,
      invalidPinLabelsMessages,
    }
  }

  // Handle object-style pinLabels
  const validPinLabels: Record<string, string | string[]> = {}
  for (const [pin, labelOrLabels] of Object.entries(pinLabels)) {
    const labels: string[] = Array.isArray(labelOrLabels)
      ? (labelOrLabels as string[]).slice()
      : [labelOrLabels as string]
    const validLabels: string[] = []

    for (const label of labels) {
      if (isValidPinLabel(pin, label)) {
        validLabels.push(label)
      } else {
        invalidPinLabelsMessages.push(
          `Invalid pin label: ${pin} = '${label}' - excluding from component. Please use a valid pin label.`,
        )
      }
    }

    if (validLabels.length > 0) {
      validPinLabels[pin] = Array.isArray(labelOrLabels)
        ? validLabels
        : validLabels[0]
    }
  }

  return {
    validPinLabels:
      Object.keys(validPinLabels).length > 0 ? validPinLabels : undefined,
    invalidPinLabelsMessages,
  }
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
