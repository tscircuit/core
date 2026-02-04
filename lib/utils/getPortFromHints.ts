import { Port } from "lib/components/primitive-components/Port"

export const getPinNumberFromLabels = (labels: string[]) => {
  const pinNumber = labels.find((p) => /^(pin)?\d+$/.test(p))
  if (!pinNumber) return null
  return Number.parseInt(pinNumber.replace(/^pin/, ""))
}

export function getPortFromHints(
  hints: string[],
  opts?: { additionalAliases?: Record<string, string[]> },
): Port | null {
  const pinNumber = getPinNumberFromLabels(hints)
  if (!pinNumber) return null
  const aliasesFromHints = hints.filter(
    (p) =>
      p.toString() !== pinNumber.toString() &&
      p !== `pin${pinNumber}` &&
      p.trim() !== "",
  )

  const aliases = [
    ...aliasesFromHints,
    ...(opts?.additionalAliases?.[`pin${pinNumber}`] ?? []),
  ]

  return new Port({
    pinNumber,
    aliases,
  })
}
