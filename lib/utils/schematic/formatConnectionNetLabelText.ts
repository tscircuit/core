const GENERIC_PIN_NAME_RE = /^(?:pin)?(\d+)$/i

export const formatConnectionNetLabelText = ({
  componentName,
  portName,
}: {
  componentName?: string
  portName?: string
}): string | undefined => {
  if (!componentName || !portName) return undefined

  const genericPinMatch = portName.match(GENERIC_PIN_NAME_RE)
  if (genericPinMatch) {
    return `${componentName}_${genericPinMatch[1]}`
  }

  if (
    componentName.endsWith(`_${portName}`) ||
    componentName.endsWith(`-${portName}`)
  ) {
    return componentName
  }

  return `${componentName}_${portName}`
}
