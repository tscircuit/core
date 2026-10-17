import { netLabelProps } from "@tscircuit/props"
import { distance } from "circuit-json"
import { z } from "zod"
import { PrimitiveComponent } from "../base-components/PrimitiveComponent"
import { Port } from "./Port"
import { Trace } from "./Trace/Trace"
import { Net } from "./Net"
import { createNetsFromProps } from "lib/utils/components/createNetsFromProps"
import { computeSchematicNetLabelCenter } from "lib/utils/schematic/computeSchematicNetLabelCenter"
import {
  applyToPoint,
  identity,
  translate,
  type Matrix,
} from "transformation-matrix"
import { calculateElbow } from "calculate-elbow"
import { convertFacingDirectionToElbowDirection } from "lib/utils/schematic/convertFacingDirectionToElbowDirection"
import { getEnteringEdgeFromDirection } from "lib/utils/schematic/getEnteringEdgeFromDirection"

const extendedNetLabelProps = netLabelProps.extend({
  schLabelType: z.enum(["anchor", "text", "none"]).optional(),
  displayLabel: z.string().optional(),
  schAnchorSymbol: z
    .enum([
      "GND",
      "EARTH_GND",
      "CHASSIS_GND",
      "VCC",
      "PORT_IN",
      "PORT_OUT",
      "PORT_BIDI",
      "NONE",
    ])
    .optional(),
  schAnchorSide: z.enum(["top", "bottom", "left", "right"]).optional(),
  schTextPosition: z.number().min(0).max(1).optional(),
  schTextGap: distance.optional(),
})

const LEAD_OUT_DISTANCE_MM = 2.54
const INLINE_NET_LABEL_COLOR = "rgb(132, 0, 0)"

export class NetLabel extends PrimitiveComponent<typeof extendedNetLabelProps> {
  source_net_label_id?: string
  schematic_net_label_id?: string

  get config() {
    return {
      componentName: "NetLabel",
      zodProps: extendedNetLabelProps,
    }
  }

  _getDisplayLabelText(): string {
    const { _parsedProps: props } = this
    return props.displayLabel ?? this._getNetName()
  }

  _getAnchorSide(): "top" | "bottom" | "left" | "right" {
    const { _parsedProps: props } = this
    if (props.schAnchorSide) return props.schAnchorSide
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
    if (port.facingDirection) {
      return getEnteringEdgeFromDirection(port.facingDirection as any)
    }

    const connectedPortPosition = port._getGlobalSchematicPositionBeforeLayout()

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

    if (
      props.schLabelType === "text" ||
      props.schLabelType === "none" ||
      (props.schX === undefined && props.schY === undefined)
    ) {
      const connectedPorts = this._getConnectedPorts()
      if (connectedPorts.length > 0) {
        const portPos =
          connectedPorts[0]._getGlobalSchematicPositionBeforeLayout()
        const parentCenter = applyToPoint(
          this.parent?.computeSchematicGlobalTransform?.() ?? identity(),
          { x: 0, y: 0 },
        )
        return translate(portPos.x - parentCenter.x, portPos.y - parentCenter.y)
      }
      if (props.schLabelType === "text" || props.schLabelType === "none") {
        return identity()
      }
    }

    return super.computeSchematicPropsTransform()
  }

  doInitialSchematicPrimitiveRender(): void {
    if (this.root?.schematicDisabled) return
    if (this.getCollapsedSchematicBoxAncestor()) return
    const { db } = this.root!
    const { _parsedProps: props } = this

    if (props.schLabelType === "none" || props.schLabelType === "text") {
      return
    }

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
    const labelText = this._getDisplayLabelText()
    const center = computeSchematicNetLabelCenter({
      anchor_position: anchorPos,
      anchor_side: anchorSide,
      text: labelText,
    })

    const netLabel = db.schematic_net_label.insert({
      text: labelText,
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
    if (props.net) return props.net
    const connectsTo = this._resolveConnectsTo() ?? []
    const netSelector = connectsTo.find((c) => c.startsWith("net."))
    if (netSelector) return netSelector.slice(4)
    if (props.displayLabel) return props.displayLabel
    if (connectsTo[0]) {
      return connectsTo[0].replace(/[^a-zA-Z0-9_]/g, "_")
    }
    return "unnamed_net"
  }

  doInitialCreateNetsFromProps(): void {
    const { _parsedProps: props } = this
    const netName =
      props.net ?? (this._resolveConnectsTo() ? this._getNetName() : undefined)
    if (netName) {
      createNetsFromProps(this, [`net.${netName}`])
    }
  }

  doInitialCreateTracesFromNetLabels(): void {
    const connectsTo = this._resolveConnectsTo()
    if (!connectsTo) return

    // TODO check if connection is already represented by a trace in the
    // subcircuit

    const targetNetSelector = `net.${this._getNetName()}`
    for (const connection of connectsTo) {
      if (connection === targetNetSelector) continue
      this.add(
        new Trace({
          from: connection,
          to: targetNetSelector,
        }),
      )
    }
  }

  doInitialSchematicTraceRender(): void {
    if (!this.root?._featureMspSchematicTraceRouting) return
    if (this.root?.schematicDisabled) return
    if (this.getCollapsedSchematicBoxAncestor()) return
    if (this._parsedProps.inline) return
    if (
      this._parsedProps.schLabelType === "none" ||
      this._parsedProps.schLabelType === "text"
    ) {
      return
    }
    const { schX, schY } = this._parsedProps
    if (schX === undefined && schY === undefined) return

    const { db } = this.root!
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

      // If a schematic trace for this connection already exists, skip
      let existingTraceForThisConnection = false
      if (net?.source_net_id) {
        const candidateSourceTrace = db.source_trace
          .list()
          .find(
            (st) =>
              st.connected_source_net_ids?.includes(net.source_net_id!) &&
              st.connected_source_port_ids?.includes(port.source_port_id ?? ""),
          )
        if (candidateSourceTrace) {
          existingTraceForThisConnection = db.schematic_trace
            .list()
            .some(
              (t) => t.source_trace_id === candidateSourceTrace.source_trace_id,
            )
        }
        if (existingTraceForThisConnection) continue
      }

      const portPos = port._getGlobalSchematicPositionAfterLayout()
      const portFacing =
        convertFacingDirectionToElbowDirection(
          (port.facingDirection as any) ?? "right",
        ) ?? "x+"

      let path: { x: number; y: number }[]
      if (this._parsedProps.schAnchorSide && anchorFacing === portFacing) {
        const leadOutOffset = {
          "x+": { x: LEAD_OUT_DISTANCE_MM, y: 0 },
          "x-": { x: -LEAD_OUT_DISTANCE_MM, y: 0 },
          "y+": { x: 0, y: LEAD_OUT_DISTANCE_MM },
          "y-": { x: 0, y: -LEAD_OUT_DISTANCE_MM },
        }[portFacing]
        const waypoint = {
          x: portPos.x + leadOutOffset.x,
          y: portPos.y + leadOutOffset.y,
        }
        const elbowFromWaypoint = calculateElbow(
          {
            x: waypoint.x,
            y: waypoint.y,
            facingDirection: portFacing,
          },
          {
            x: anchorPos.x,
            y: anchorPos.y,
            facingDirection: anchorFacing,
          },
        )
        path = [portPos, ...elbowFromWaypoint]
      } else {
        path = calculateElbow(
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
      }

      if (!Array.isArray(path) || path.length < 2) continue

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

  doInitialSchematicReplaceNetLabelsWithSymbols(): void {
    if (this.root?.schematicDisabled) return
    if (this.getCollapsedSchematicBoxAncestor()) return
    const { db } = this.root!
    const { _parsedProps: props } = this

    const net = this.getSubcircuit()?.selectOne(
      `net.${this._getNetName()}`,
    ) as Net | null
    const sourceNetId = net?.source_net_id

    if (props.schLabelType === "none") {
      for (const nl of db.schematic_net_label.list()) {
        if (
          nl.schematic_net_label_id === this.schematic_net_label_id ||
          (sourceNetId && nl.source_net_id === sourceNetId)
        ) {
          db.schematic_net_label.delete(nl.schematic_net_label_id)
        }
      }
      return
    }

    if (props.schLabelType === "text") {
      for (const nl of db.schematic_net_label.list()) {
        if (
          nl.schematic_net_label_id === this.schematic_net_label_id ||
          (sourceNetId && nl.source_net_id === sourceNetId)
        ) {
          db.schematic_net_label.delete(nl.schematic_net_label_id)
        }
      }

      const sourceNet = sourceNetId ? db.source_net.get(sourceNetId) : undefined
      const connKey = sourceNet?.subcircuit_connectivity_map_key
      const connectedPorts = this._getConnectedPorts()
      const candidateSourceTraces = db.source_trace.list().filter((st) => {
        if (sourceNetId && st.connected_source_net_ids?.includes(sourceNetId)) {
          return true
        }
        if (connKey && st.subcircuit_connectivity_map_key === connKey) {
          return true
        }
        return connectedPorts.some(
          (p) =>
            p.source_port_id &&
            st.connected_source_port_ids?.includes(p.source_port_id),
        )
      })
      const candidateSourceTraceIds = new Set(
        candidateSourceTraces.map((st) => st.source_trace_id),
      )

      const matchingSchematicTrace = db.schematic_trace.list().find((st) => {
        if (
          st.source_trace_id &&
          candidateSourceTraceIds.has(st.source_trace_id)
        ) {
          return true
        }
        if (connKey && st.subcircuit_connectivity_map_key === connKey) {
          return true
        }
        return false
      })

      const normalizedOffset = props.schTextPosition ?? 0.5
      const gap = props.schTextGap ?? 0
      let position = this._getGlobalSchematicPositionBeforeLayout()
      let rotation = 0

      if (matchingSchematicTrace && matchingSchematicTrace.edges.length > 0) {
        const segments = matchingSchematicTrace.edges.map((edge) => {
          const dx = edge.to.x - edge.from.x
          const dy = edge.to.y - edge.from.y
          return {
            from: edge.from,
            to: edge.to,
            dx,
            dy,
            length: Math.hypot(dx, dy),
          }
        })
        const totalLength = segments.reduce((sum, s) => sum + s.length, 0)
        if (totalLength > 0) {
          const targetDistance = normalizedOffset * totalLength
          let accumulated = 0
          let chosen = segments[segments.length - 1]!
          let localDist = chosen.length
          for (const seg of segments) {
            if (accumulated + seg.length >= targetDistance) {
              chosen = seg
              localDist = targetDistance - accumulated
              break
            }
            accumulated += seg.length
          }
          const t = chosen.length > 0 ? localDist / chosen.length : 0
          const baseX = chosen.from.x + chosen.dx * t
          const baseY = chosen.from.y + chosen.dy * t
          const isVertical = Math.abs(chosen.dy) > Math.abs(chosen.dx)
          const normalX = chosen.length > 0 ? -chosen.dy / chosen.length : 0
          const normalY = chosen.length > 0 ? chosen.dx / chosen.length : 1
          position = {
            x: baseX + normalX * gap,
            y: baseY + normalY * gap,
          }
          rotation = isVertical ? -90 : 0
        }
      } else if (connectedPorts.length > 0) {
        const portPos =
          connectedPorts[0]!._getGlobalSchematicPositionAfterLayout()
        position = {
          x: portPos.x,
          y: portPos.y + gap,
        }
      }

      db.schematic_text.insert({
        text: this._getDisplayLabelText(),
        source_trace_id:
          matchingSchematicTrace?.source_trace_id ??
          candidateSourceTraces[0]?.source_trace_id,
        position,
        rotation,
        anchor: "center",
        font_size: 0.18,
        color: INLINE_NET_LABEL_COLOR,
        schematic_sheet_id: this._resolveSchematicSheetId(),
      })
      return
    }

    const dbLabel =
      (this.schematic_net_label_id
        ? db.schematic_net_label.get(this.schematic_net_label_id)
        : undefined) ??
      (sourceNetId
        ? db.schematic_net_label
            .list()
            .find((nl) => nl.source_net_id === sourceNetId)
        : undefined)

    if (!dbLabel) return

    const updates: Record<string, any> = {}
    const effectiveSide =
      props.schAnchorSide ?? props.anchorSide ?? dbLabel.anchor_side
    const effectiveText =
      props.displayLabel !== undefined ? props.displayLabel : dbLabel.text

    if (
      props.displayLabel !== undefined &&
      dbLabel.text !== props.displayLabel
    ) {
      updates.text = props.displayLabel
    }
    if (
      props.schAnchorSide !== undefined &&
      dbLabel.anchor_side !== props.schAnchorSide
    ) {
      updates.anchor_side = props.schAnchorSide
    }
    if (updates.text !== undefined || updates.anchor_side !== undefined) {
      updates.center = computeSchematicNetLabelCenter({
        anchor_position: dbLabel.anchor_position!,
        anchor_side: effectiveSide,
        text: effectiveText,
      })
    }

    if (props.schAnchorSymbol !== undefined) {
      const symbolMap: Record<string, string | undefined> = {
        NONE: undefined,
        GND: "rail_down",
        EARTH_GND: "rail_down",
        CHASSIS_GND: "rail_down",
        VCC: "rail_up",
        PORT_IN: "port_in",
        PORT_OUT: "port_out",
        PORT_BIDI: "port_bidi",
      }
      updates.symbol_name = symbolMap[props.schAnchorSymbol]
    }

    if (Object.keys(updates).length > 0) {
      db.schematic_net_label.update(dbLabel.schematic_net_label_id, updates)
    }
  }
}
