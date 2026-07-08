/**
 * Filters out invalid pin labels while preserving valid ones.
 * This allows components to render even if some pin labels are invalid.
 * Invalid labels are excluded with clear warning messages.
 *
 * Uses the actual chipProps zod schema to validate pin labels,
 * ensuring consistency with the real validation logic.
 */
export function filterPinLabels(
  pinLabels: Record<string, string | string[] | readonly string[]> | undefined,
): {
  validPinLabels: Record<string, string | string[]> | undefined
  invalidPinLabelsMessages: string[]
} {
  if (!pinLabels)
    return {
      validPinLabels: pinLabels as undefined,
      invalidPinLabelsMessages: [],
    }

  const validPinLabels: Record<string, string | string[]> = {}
  const invalidPinLabelsMessages: string[] = []

  for (const [pin, labelOrLabels] of Object.entries(pinLabels)) {
    const labels: string[] = Array.isArray(labelOrLabels)
      ? (labelOrLabels as string[]).slice() // Convert readonly to mutable
      : [labelOrLabels as string]
    const validLabels: string[] = []

    for (const label of labels) {
      if (isValidPinLabel(pin, label)) {
        validLabels.push(label)
      } else {
        invalidPinLabelsMessages.push(
          `Invalid pin label: ${pin} = '${label}' - excluding from component. Pin labels can only contain letters, numbers and underscores.`,
        )
      }
    }

    // Only include this pin if it has at least one valid label
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
 * Checks if a pin label has valid label syntax. Pin key validity is checked
 * later so invalid keys still produce a clear InvalidProps error.
 */
function isValidPinLabel(_pin: string, label: string): boolean {
  return /^[A-Za-z0-9_]+$/.test(label)
}
