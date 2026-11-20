import { computeLocalSkew } from "lib/utils/local-skew/compute-local-skew"
import type { PcbDifferentialPairLocalSkew } from "lib/utils/local-skew/pcb-differential-pair-local-skew"
import type { Group } from "./Group"

export function Group_doInitialPcbDifferentialPairLocalSkewRender(
  group: Pick<Group, "root">,
) {
  if (group.root?.firstChild !== group || group.root.pcbDisabled) return
  const { db } = group.root
  const phaseName = "PcbDifferentialPairLocalSkewRender"

  // The Circuit JSON database supports new element tables by name at runtime.
  const { pcb_differential_pair_local_skew: localSkewTable } =
    db as typeof db & {
      pcb_differential_pair_local_skew: {
        list(): PcbDifferentialPairLocalSkew[]
        insert(pair: PcbDifferentialPairLocalSkew): void
        delete(
          id: PcbDifferentialPairLocalSkew["pcb_differential_pair_local_skew_id"],
        ): void
      }
    }
  for (const pair of localSkewTable.list()) {
    localSkewTable.delete(pair.pcb_differential_pair_local_skew_id)
  }
  for (const error of db.source_runtime_error.list({ phase_name: phaseName })) {
    db.source_runtime_error.delete(error.source_runtime_error_id)
  }
  if (!db.source_bus.list().some((bus) => bus.differential_pair)) return

  const pairs = computeLocalSkew(db.toArray(), (bus) => {
    db.source_runtime_error.insert({
      error_type: "source_runtime_error",
      phase_name: phaseName,
      message: `Could not calculate local skew for differential pair "${bus.name || "unnamed pair"}".`,
    })
  })
  for (const pair of pairs) localSkewTable.insert(pair)
}
