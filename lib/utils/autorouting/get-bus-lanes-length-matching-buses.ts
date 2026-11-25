import {
  busLengthReports,
  type Bus,
  type SimpleRouteJson as BusLanesInput,
} from "@tscircuit/bus-lanes-solver"
import type { SimpleRouteBus } from "./SimpleRouteJson"

/** Compile the public combined-member range into the solver's native goals.
 * Completed reference lengths follow the selected board-world endpoint paths
 * in mm (+X right, +Y up), excluding via depth and unrelated branch copper. */
export function getBusLanesLengthMatchingBuses(
  bus: SimpleRouteBus,
  input: BusLanesInput,
): Bus[] {
  const { lengthMatchToConnectionNames, ...memberBus } = bus
  if (!lengthMatchToConnectionNames?.length || bus.maxLengthSkew === undefined)
    return [memberBus]
  const activeNames = new Set(
    input.connections.map((connection) => connection.name),
  )
  const pendingReferences = lengthMatchToConnectionNames.filter((name) =>
    activeNames.has(name),
  )
  const fixedReferences = lengthMatchToConnectionNames.filter(
    (name) => !activeNames.has(name),
  )
  // A comparison adds timing references, not ownership: widths, layer choices
  // and absolute length bounds continue to apply only to the declared members.
  const { maxLengthSkew, ...ownedRoutingBus } = memberBus
  const pendingBus: Bus = {
    busId: `${bus.busId}_length_match`,
    name: bus.name,
    maxLengthSkew,
    lengthMatchingPaths: bus.lengthMatchingPaths,
    connectionNames: [
      ...new Set([...bus.connectionNames, ...pendingReferences]),
    ],
  }
  if (!fixedReferences.length) return [ownedRoutingBus, pendingBus]
  const [fixedReport] = busLengthReports(
    {
      ...input,
      buses: [
        {
          ...memberBus,
          connectionNames: fixedReferences,
          minLength: undefined,
          maxLength: undefined,
        },
      ],
    },
    [],
  )
  if (!fixedReport.matched) {
    throw new Error(
      `Bus "${bus.name ?? "unnamed bus"}" requires completed lengthMatchTo paths within maxLengthSkew`,
    )
  }
  // The member range, fixed reference range, and member-to-reference bounds
  // together enforce the declared range across the complete comparison set.
  return [
    ownedRoutingBus,
    pendingBus,
    {
      busId: `${bus.busId}_fixed_length_match`,
      name: bus.name,
      connectionNames: pendingBus.connectionNames,
      maxLengthSkew: bus.maxLengthSkew,
      skewReference: "references",
      referenceConnectionNames: fixedReferences,
      lengthMatchingPaths: bus.lengthMatchingPaths,
    },
  ]
}
