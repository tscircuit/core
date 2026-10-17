import { netLabelProps } from "@tscircuit/props"
import { calculateElbow } from "calculate-elbow"
import { createNetsFromProps } from "lib/utils/components/createNetsFromProps"
import { computeSchematicNetLabelCenter } from "lib/utils/schematic/computeSchematicNetLabelCenter"
import { convertFacingDirectionToElbowDirection } from "lib/utils/schematic/convertFacingDirectionToElbowDirection"
import { getEnteringEdgeFromDirection } from "lib/utils/schematic/getEnteringEdgeFromDirection"
import {
  type Matrix,
  applyToPoint,
  identity,
  translate,
} from "transformation-matrix"
import { PrimitiveComponent } from "../base-components/PrimitiveComponent"
import { Net } from "./Net"
import { Port } from "./Port"
import { Trace } from "./Trace/Trace"

export class NetLabel extends PrimitiveComponent<typeof netLabelProps> {
  source_net_label_id?: string
  schematic_net_label_id?: string

  get config() {
    return {
      componentName: "NetLabel",
      zodProps: netLabelProps,
    }
  }

  _getPortSchematicPositionBeforeLayout(port: Port): { x: number; y: number } {
    if (port.schematic_port_id) {
      const schematicPort = this.root?.db.schematic_port.get(
        port.schematic_port_id,
      )
      if (schematicPort?.center) {
        return schematicPort.center
      }
    }
    return port._getGlobalSchematicPositionBeforeLayout()
  }

  _getPortFacingDirection(
    port: Port,
  ): "up" | "down" | "left" | "right" | undefined {
    if (port.facingDirection) return port.facingDirection
    if (port.schematic_port_id) {
      const schematicPort = this.root?.db.schematic_port.get(
        port.schematic_port_id,
      )
      if (schematicPort?.facing_direction) {
        return schematicPort.facing_direction
      }
    }
    return undefined
  }

  _getAnchorSide(): "top" | "bottom" | "left" | "right" {
    const { _parsedProps: props } = this
    if (props.anchorSide) return props.anchorSide

    const connectsTo = this._resolveConnectsTo()
    if (!connectsTo) return "right"

    const net = this.getSubcircuit().selectOne(
      `net.${this._getNetName()!}`,
    ) as Net | null
    let sourceNet
    if (net?.source_net_id) {
      sourceNet = this.root?.db.source_net.get(net.source_net_id)
    }
    if (sourceNet?.is_ground) return "top"
    if (sourceNet?.is_power) return "bottom"

    // Get relative position of the net label and the thing(s) it connects
    // to
    const anchorPos = this._getGlobalSchematicPositionBeforeLayout()

    const connectedPorts = this._getConnectedPorts()
    if (connectedPorts.length === 0) return "right"

    const port = connectedPorts[0]
    const portFacingDirection = this._getPortFacingDirection(port)
    if (portFacingDirection) {
      return getEnteringEdgeFromDirection(portFacingDirection as any)
    }

    const connectedPortPosition =
      this._getPortSchematicPositionBeforeLayout(port)

    const dx = connectedPortPosition.x - anchorPos.x
    const dy = connectedPortPosition.y - anchorPos.y

    if (Math.abs(dx) > Math.abs(dy)) {
      if (dx > 0) return "right"
      if (dx < 0) return "left"
    } else {
      if (dy > 0) return "top"
      if (dy < 0) return "bottom"
    }

    return "right"
  }

  _getConnectedPorts(): Port[] {
    const connectsTo = this._resolveConnectsTo()
    if (!connectsTo) return []

    const connectedPorts: Port[] = []
    for (const connection of connectsTo) {
      const port = this.getSubcircuit().selectOne(connection) as Port
      if (port) {
        connectedPorts.push(port)
      }
    }

    return connectedPorts
  }

  computeSchematicPropsTransform(): Matrix {
    const { _parsedProps: props } = this

    if (props.schX === undefined && props.schY === undefined) {
      const connectedPorts = this._getConnectedPorts()
      if (connectedPorts.length > 0) {
        const portPos = this._getPortSchematicPositionBeforeLayout(
          connectedPorts[0],
        )
        const parentCenter = applyToPoint(
          this.parent?.computeSchematicGlobalTransform?.() ?? identity(),
          { x: 0, y: 0 },
        )
        return translate(portPos.x - parentCenter.x, portPos.y - parentCenter.y)
      }
    }

    return super.computeSchematicPropsTransform()
  }

  doInitialSchematicPrimitiveRender(): void {
    if (this.root?.schematicDisabled) return
    if (this.getCollapsedSchematicBoxAncestor()) return
    const { db } = this.root!
    const { _parsedProps: props } = this

    // Inline labels are placed by the schematic trace solver. If it cannot
    // find a collision-free inline placement, it emits the anchored fallback.
    if (
      props.inline &&
      this.root?._featureMspSchematicTraceRouting &&
      this._getConnectedPorts().length > 0
    ) {
      return
    }

    const anchorPos = this._getGlobalSchematicPositionBeforeLayout()

    const net = this.getSubcircuit()!.selectOne(
      `net.${this._getNetName()!}`,
    )! as Net

    const anchorSide = this._getAnchorSide()
    const center = computeSchematicNetLabelCenter({
      anchor_position: anchorPos,
      anchor_side: anchorSide,
      text: props.net!,
    })

    const netLabel = db.schematic_net_label.insert({
      text: props.net!,
      source_net_id: net.source_net_id!,
      anchor_position: anchorPos,
      center,
      anchor_side: anchorSide,
      schematic_sheet_id: this._resolveSchematicSheetId(),
    })

    this.source_net_label_id = netLabel.source_net_id
    this.schematic_net_label_id = netLabel.schematic_net_label_id
  }

  _resolveConnectsTo(): string[] | undefined {
    const { _parsedProps: props } = this

    const connectsTo = props.connectsTo ?? props.connection

    if (Array.isArray(connectsTo)) {
      return connectsTo
    }

    if (typeof connectsTo === "string") {
      return [connectsTo]
    }

    return undefined
  }

  _getNetName(): string {
    const { _parsedProps: props } = this
    return props.net!
  }

  doInitialCreateNetsFromProps(): void {
    const { _parsedProps: props } = this
    if (props.net) {
      createNetsFromProps(this, [`net.${props.net}`])
    }
  }

  doInitialCreateTracesFromNetLabels(): void {
    const connectsTo = this._resolveConnectsTo()
    if (!connectsTo) return

    // TODO check if connection is already represented by a trace in the
    // subcircuit

    for (const connection of connectsTo) {
      this.add(
        new Trace({
          from: connection,
          to: `net.${this._getNetName()}`,
        }),
      )
    }
  }

  doInitialSchematicTraceRender(): void {
    if (!this.root?._featureMspSchematicTraceRouting) return
    if (this.root?.schematicDisabled) return
    if (this.getCollapsedSchematicBoxAncestor()) return
    if (this._parsedProps.inline) return
    const { schX, schY } = this._parsedProps
    const { db } = this.root!
    if (schX === undefined && schY === undefined) {
      for (const port of this._getConnectedPorts()) {
        if (
          port.schematic_port_id &&
          port.parent?.componentName === "SchematicSymbol"
        ) {
          db.schematic_port.update(port.schematic_port_id, {
            is_connected: true,
          })
        }
      }
      return
    }

    const connectsTo = this._resolveConnectsTo()
    if (!connectsTo || connectsTo.length === 0) return

    // Determine the anchor position and orientation at the net label
    const anchorPos = this._getGlobalSchematicPositionBeforeLayout()
    const anchorSide = this._getAnchorSide()
    const sideToAxisDir: Record<
      "left" | "right" | "top" | "bottom",
      "x+" | "x-" | "y+" | "y-"
    > = {
      left: "x-",
      right: "x+",
      top: "y+",
      bottom: "y-",
    }
    const anchorFacing = sideToAxisDir[anchorSide]

    // Resolve the target net to find a matching source_trace (port <-> net)
    const net = this.getSubcircuit().selectOne(
      `net.${this._getNetName()!}`,
    ) as Net | null

    for (const connection of connectsTo) {
      const port = this.getSubcircuit().selectOne(connection, {
        type: "port",
      }) as Port | null
      if (!port || !port.schematic_port_id) continue

      const portPos = port._getGlobalSchematicPositionAfterLayout()

      // If a schematic trace for this specific schematic port already exists, skip
      let existingTraceForThisConnection = false
      if (net?.source_net_id) {
        const candidateSourceTraceIds = new Set(
          db.source_trace
            .list()
            .filter(
              (st) =>
                st.connected_source_net_ids?.includes(net.source_net_id!) &&
                st.connected_source_port_ids?.includes(
                  port.source_port_id ?? "",
                ),
            )
            .map((st) => st.source_trace_id),
        )
        if (candidateSourceTraceIds.size > 0) {
          existingTraceForThisConnection = db.schematic_trace
            .list()
            .some(
              (t) =>
                t.source_trace_id !== undefined &&
                candidateSourceTraceIds.has(t.source_trace_id) &&
                t.edges.some(
                  (edge) =>
                    (Math.abs(edge.from.x - portPos.x) < 1e-3 &&
                      Math.abs(edge.from.y - portPos.y) < 1e-3) ||
                    (Math.abs(edge.to.x - portPos.x) < 1e-3 &&
                      Math.abs(edge.to.y - portPos.y) < 1e-3),
                ),
            )
        }
        if (existingTraceForThisConnection) {
          db.schematic_port.update(port.schematic_port_id, {
            is_connected: true,
          })
          continue
        }
      }

      if (
        Math.abs(portPos.x - anchorPos.x) < 1e-6 &&
        Math.abs(portPos.y - anchorPos.y) < 1e-6
      ) {
        db.schematic_port.update(port.schematic_port_id, { is_connected: true })
        continue
      }

      const portFacing =
        convertFacingDirectionToElbowDirection(
          (this._getPortFacingDirection(port) as any) ?? "right",
        ) ?? "x+"

      const path = calculateElbow(
        {
          x: portPos.x,
          y: portPos.y,
          facingDirection: portFacing,
        },
        {
          x: anchorPos.x,
          y: anchorPos.y,
          facingDirection: anchorFacing,
        },
      )

      if (!Array.isArray(path) || path.length < 2) {
        db.schematic_port.update(port.schematic_port_id, { is_connected: true })
        continue
      }

      const edges = []
      for (let i = 0; i < path.length - 1; i++) {
        edges.push({
          from: { x: path[i]!.x, y: path[i]!.y },
          to: { x: path[i + 1]!.x, y: path[i + 1]!.y },
        })
      }

      // Try to associate the schematic trace with a matching source_trace (port <-> net)
      let source_trace_id: string | undefined
      let subcircuit_connectivity_map_key: string | undefined
      if (net?.source_net_id && port.source_port_id) {
        const st = db.source_trace
          .list()
          .find(
            (s) =>
              s.connected_source_net_ids?.includes(net.source_net_id!) &&
              s.connected_source_port_ids?.includes(port.source_port_id!),
          )
        source_trace_id = st?.source_trace_id
        subcircuit_connectivity_map_key =
          st?.subcircuit_connectivity_map_key ||
          db.source_net.get(net.source_net_id!)?.subcircuit_connectivity_map_key
      }

      db.schematic_trace.insert({
        source_trace_id: source_trace_id!,
        edges,
        junctions: [],
        subcircuit_connectivity_map_key,
        schematic_sheet_id: this._resolveSchematicSheetId(),
      })

      // Mark the schematic port as connected
      db.schematic_port.update(port.schematic_port_id, { is_connected: true })
    }
  }
}
