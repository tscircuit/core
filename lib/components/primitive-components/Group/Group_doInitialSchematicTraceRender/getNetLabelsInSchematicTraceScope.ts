import type { NetLabel } from "../../NetLabel"
import type { Group } from "../Group"

export const getNetLabelsInSchematicTraceScope = (
  group: Group<any>,
): NetLabel[] => {
  return [
    ...new Set([
      ...group.selectAll<NetLabel>("netlabel"),
      ...(group._getBoard()?.selectAll<NetLabel>("netlabel") ?? []),
    ]),
  ]
}
