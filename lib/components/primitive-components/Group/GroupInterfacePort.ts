import type { Port as ChildPort, PortProps } from "../Port/Port"
import { Port } from "../Port/Port"

// A lightweight port wrapper used when a group is rendered as a single
// schematic box. It mirrors an existing child port so the schematic keeps a
// pin, without duplicating the underlying source/pcb bookkeeping handled by
// the child component itself.

export class GroupInterfacePort extends Port {
  private _targetPorts: ChildPort[]
  private _targetSelectors: string[]

  constructor(
    props: PortProps,
    opts: { targetPorts: ChildPort[]; targetSelectors: string[] },
  ) {
    super(props)
    this._targetPorts = opts.targetPorts
    this._targetSelectors = opts.targetSelectors
  }

  get targetPorts(): ChildPort[] {
    return this._targetPorts
  }

  get targetSelectors(): string[] {
    return this._targetSelectors
  }

  doInitialSourceRender(): void {
    const primaryTarget = this._targetPorts[0]
    if (!primaryTarget?.source_port_id) return
    this.source_port_id = primaryTarget.source_port_id
    this.source_component_id = primaryTarget.source_component_id
    this.subcircuit_connectivity_map_key =
      primaryTarget.subcircuit_connectivity_map_key ?? null
  }

  doInitialSourceParentAttachment(): void {
    // Group interface ports proxy an existing child port. The child already
    // performed the source-port attachment, so running the base logic would
    // fail (the parent group has no source_component_id) and duplicate work.
  }

  doInitialPcbPortRender(): void {
    // Likewise the PCB primitives belong to the child component. Emitting a
    // second pcb_port here would attempt to attach to the group (which has no
    // pcb_component_id) and either throw or double-create pads.
  }
}
