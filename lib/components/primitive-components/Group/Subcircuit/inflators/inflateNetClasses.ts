import type { SourceNet, SourceNetClass } from "circuit-json"
import { PrimitiveComponent } from "lib/components/base-components/PrimitiveComponent"
import { Net } from "lib/components/primitive-components/Net"
import type { InflatorContext } from "../InflatorFn"
import { getInflatedNetClassContext } from "./getInflatedNetClassContext"

type SourceNetId = SourceNet["source_net_id"]
type SourceNetClassId = SourceNetClass["source_net_class_id"]

/** Restore class metadata after the ordinary Net instances allocate source IDs,
 * following the same deferred-record pattern as inflateSimulation. */
class InflatedNetClasses extends PrimitiveComponent {
  constructor(
    private inflationContext: InflatorContext,
    private netsByOriginalId: Map<SourceNetId, Net>,
  ) {
    super({})
  }

  get config() {
    return { ...super.config, componentName: "InflatedNetClasses" }
  }

  doInitialSourceAddConnectivityMapKey() {
    const { injectionDb, subcircuit } = this.inflationContext
    const { db } = subcircuit.root!
    const restoredClassIds = new Map<SourceNetClassId, SourceNetClassId>()
    for (const netClass of injectionDb.source_net_class.list()) {
      const { source_net_class_id, subcircuit_id, ...definition } = netClass
      const context = getInflatedNetClassContext(
        this.inflationContext,
        subcircuit_id,
      )
      const restoredClass = db.source_net_class.insert({
        ...definition,
        subcircuit_id:
          subcircuit_id === undefined
            ? undefined
            : context.subcircuit.subcircuit_id!,
      })
      restoredClassIds.set(
        source_net_class_id,
        restoredClass.source_net_class_id,
      )
    }
    for (const sourceNet of injectionDb.source_net.list()) {
      const net = this.netsByOriginalId.get(sourceNet.source_net_id)!
      const source_net_class_ids = sourceNet.source_net_class_ids?.map(
        (classId) => {
          const restoredId = restoredClassIds.get(classId)
          if (!restoredId)
            throw new Error(
              `Cannot restore net "${sourceNet.name}": its net class definition is missing`,
            )
          return restoredId
        },
      )
      const classWidth = source_net_class_ids
        ?.map((id) => db.source_net_class.get(id)!)
        .find((netClass) => netClass.trace_width !== undefined)?.trace_width
      db.source_net.update(net.source_net_id!, {
        source_net_class_ids,
        trace_width: sourceNet.trace_width ?? classWidth,
      })
    }
  }
}

export function inflateNetClasses(context: InflatorContext) {
  if (context.injectionDb.source_net_class.list().length === 0) {
    const classedNet = context.injectionDb.source_net
      .list()
      .find((net) => net.source_net_class_ids?.length)
    if (classedNet)
      throw new Error(
        `Cannot restore net "${classedNet.name}": its net class definition is missing`,
      )
    return
  }
  const netsByOriginalId = new Map<SourceNetId, Net>()
  // Net records can be unused or referenced only by a class, so reconstructing
  // them solely from trace selectors loses both width and class membership.
  for (const sourceNet of context.injectionDb.source_net.list()) {
    const net = new Net({
      name: sourceNet.name,
      nominalTraceWidth: sourceNet.trace_width,
      isPowerNet: sourceNet.is_power,
      isGroundNet: sourceNet.is_ground,
    })
    const netContext = getInflatedNetClassContext(
      context,
      sourceNet.subcircuit_id,
    )
    netContext.subcircuit.add(net)
    netsByOriginalId.set(sourceNet.source_net_id, net)
  }
  context.subcircuit.add(new InflatedNetClasses(context, netsByOriginalId))
}
