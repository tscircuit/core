import { Port } from "lib/components/primitive-components/Port"

export function getPortFromHints(hints: string[]): Port | null {
  const pinNumber = hints.find((p) => /^(pin)?\d+$/.test(p))
  if (!pinNumber) return null
  return new Port({
    pinNumber: Number.parseInt(pinNumber.replace(/^pin/, "")),
    aliases: hints.filter((p) => p !== pinNumber),
  })
}
