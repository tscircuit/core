import type { SimpleRouteBus, SrjConnectionName } from "./SimpleRouteJson"

export function getLengthConstrainedBusConnectionNames(
  buses: SimpleRouteBus[],
): Set<SrjConnectionName> {
  const connectionNames = new Set<SrjConnectionName>()
  for (const bus of buses) {
    if (
      bus.minLength === undefined &&
      bus.maxLength === undefined &&
      bus.maxLengthSkew === undefined
    )
      continue
    for (const name of bus.connectionNames) connectionNames.add(name)
    for (const name of bus.lengthMatchToConnectionNames ?? [])
      connectionNames.add(name)
  }
  return connectionNames
}
