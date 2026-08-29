/**
 * Converts identifier-safe polarity suffixes into conventional schematic
 * display symbols. The source pin label remains unchanged for selectors and
 * connectivity.
 */
export const formatPinLabelForSchematicDisplay = (pinLabel: string) =>
  pinLabel.replace(/_POS$/i, "+").replace(/_NEG$/i, "-")
