import type { SourcePort } from "circuit-json"
import { GROUND_NET_REGEX } from "lib/utils/gnd-power-net-regex"

export const sourcePortIsGround = (sourcePort: SourcePort): boolean =>
  sourcePort.provides_ground === true ||
  sourcePort.requires_ground === true ||
  (sourcePort.port_hints?.some((portHint) => GROUND_NET_REGEX.test(portHint)) ??
    false)
