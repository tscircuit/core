import {
  type CableConnector,
  getBulletConnector,
  parseConnectorString,
} from "@tscircuit/cableprinter"
import type { ParsedConnectorProps } from "@tscircuit/props"

/** Resolve known physical mating interfaces without changing authored standards. */
export function resolveConnectorModel(
  model: string | undefined,
): CableConnector | undefined {
  if (!model) return undefined
  try {
    return parseConnectorString(model)
  } catch {
    return undefined
  }
}

export function resolveConnectorModelProps(
  props: ParsedConnectorProps,
): ParsedConnectorProps {
  const connector = resolveConnectorModel(props.model)
  return connector && "pinCount" in connector
    ? { ...props, pinCount: props.pinCount ?? connector.pinCount }
    : props
}

/** Resolve the cable end that mates with a physical connector. */
export function getMatingConnector(connector: CableConnector): CableConnector {
  if (connector.kind === "bullet_male" || connector.kind === "bullet_female")
    return getBulletConnector({
      diameter: connector.diameter,
      pinCount: connector.pinCount,
      gender: connector.kind === "bullet_male" ? "female" : "male",
    })
  return connector
}
