import { breakoutPointProps } from "@tscircuit/props"
import { BaseBreakoutPoint } from "./BaseBreakoutPoint"
import type { Port } from "./Port"
import type { Net } from "./Net"

export class BreakoutPoint extends BaseBreakoutPoint<
  typeof breakoutPointProps
> {
  get config() {
    return {
      componentName: "BreakoutPoint",
      zodProps: breakoutPointProps,
    }
  }

  doInitialPortMatching(): void {
    this._matchConnection()
  }

  doInitialSourceTraceRender(): void {
    const port = this.matchedPort
    // Authored traces render their own source records during this phase.
    if (!port || port._getDirectlyConnectedTraces().length > 0) return
    if (this._getSourceTraceIdForPort(port)) return

    const { db } = this.root!
    this.matchedSourceTraceId = db.source_trace.insert({
      connected_source_port_ids: [port.source_port_id!],
      connected_source_net_ids: [],
      subcircuit_id: this.getSubcircuit().subcircuit_id!,
    }).source_trace_id
  }

  _matchConnection(): void {
    if (this.matchedPort) return
    const { connection } = this._parsedProps
    const subcircuit = this.getSubcircuit()
    if (!subcircuit) return
    this.matchedPort = subcircuit.selectOne(connection, {
      type: "port",
    }) as Port
    if (!this.matchedPort) {
      this.matchedNet = subcircuit.selectOne(connection, { type: "net" }) as Net
    }
    if (!this.matchedPort && !this.matchedNet) {
      this.renderError(`Could not find connection target "${connection}"`)
    }
  }

  doInitialPcbPrimitiveRender(): void {
    this._renderPcbBreakoutPoint()
  }
}
