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
    this._matchConnection()
    this._renderPcbBreakoutPoint()
  }
}
