import { SchematicTracePipelineSolver } from "@tscircuit/schematic-trace-solver"
import { expect, test } from "bun:test"
import type { AnyCircuitElement } from "circuit-json"
import inputProblem from "./assets/icm20948-shared-ground-label-input.json"
import "tests/fixtures/extend-expect-circuit-snapshot"

const directionProps = {
  "x+": { facing_direction: "right", side_of_component: "right" },
  "x-": { facing_direction: "left", side_of_component: "left" },
  "y+": { facing_direction: "up", side_of_component: "top" },
  "y-": { facing_direction: "down", side_of_component: "bottom" },
} as const

const createSchematicCircuitJson = (
  solver: SchematicTracePipelineSolver,
): AnyCircuitElement[] => {
  const circuitJson: AnyCircuitElement[] = []
  const sourcePortIdByPinId = new Map<string, string>()
  const schematicPortIdByPinId = new Map<string, string>()

  for (const [chipIndex, chip] of inputProblem.chips.entries()) {
    const sourceComponentId = `source_component_${chipIndex}`
    circuitJson.push({
      type: "source_component",
      ftype: "simple_chip",
      source_component_id: sourceComponentId,
      name: chip.chipId === "schematic_component_23" ? "U4" : "",
    } as AnyCircuitElement)
    circuitJson.push({
      type: "schematic_component",
      schematic_component_id: chip.chipId,
      source_component_id: sourceComponentId,
      center: chip.center,
      size: { width: chip.width, height: chip.height },
      is_box_with_pins: true,
    } as AnyCircuitElement)

    for (const [pinIndex, pin] of chip.pins.entries()) {
      const sourcePortId = `source_port_${chipIndex}_${pinIndex}`
      sourcePortIdByPinId.set(pin.pinId, sourcePortId)
      schematicPortIdByPinId.set(pin.pinId, pin.pinId)
      const direction =
        pin._facingDirection ?? (pin.x < chip.center.x ? "x-" : "x+")
      circuitJson.push({
        type: "source_port",
        source_port_id: sourcePortId,
        source_component_id: sourceComponentId,
        name: pin.displayName ?? "",
      } as AnyCircuitElement)
      circuitJson.push({
        type: "schematic_port",
        schematic_port_id: pin.pinId,
        source_port_id: sourcePortId,
        schematic_component_id: chip.chipId,
        center: { x: pin.x, y: pin.y },
        ...directionProps[direction],
        distance_from_component_edge: 0,
        display_pin_label: pin.displayName,
      } as AnyCircuitElement)
    }
  }

  const netIds = new Set([
    ...inputProblem.directConnections.map((connection) => connection.netId),
    ...inputProblem.netConnections.map((connection) => connection.netId),
  ])
  for (const netId of netIds) {
    circuitJson.push({
      type: "source_net",
      source_net_id: `source_net_${netId}`,
      name: netId,
      member_source_group_ids: [],
      is_ground: netId === "GND",
      is_power: netId === "V3V3",
    } as AnyCircuitElement)
  }

  const output = solver.netLabelToTraceSolver!
  for (const [traceIndex, trace] of output.outputTraces.entries()) {
    const sourceTraceId = `source_trace_${traceIndex}`
    const tracePinIds = trace.pinIds ?? trace.pins.map((pin) => pin.pinId)
    circuitJson.push({
      type: "source_trace",
      source_trace_id: sourceTraceId,
      connected_source_port_ids: tracePinIds
        .map((pinId) => sourcePortIdByPinId.get(pinId))
        .filter(Boolean),
      connected_source_net_ids: trace.userNetId
        ? [`source_net_${trace.userNetId}`]
        : [],
    } as AnyCircuitElement)
    circuitJson.push({
      type: "schematic_trace",
      schematic_trace_id: `schematic_trace_${traceIndex}`,
      source_trace_id: sourceTraceId,
      junctions: [],
      edges: trace.tracePath.slice(0, -1).map((point, pointIndex) => ({
        from: point,
        to: trace.tracePath[pointIndex + 1]!,
        from_schematic_port_id:
          pointIndex === 0
            ? schematicPortIdByPinId.get(tracePinIds[0]!)
            : undefined,
        to_schematic_port_id:
          pointIndex === trace.tracePath.length - 2
            ? schematicPortIdByPinId.get(tracePinIds.at(-1)!)
            : undefined,
      })),
    } as AnyCircuitElement)
  }

  for (const [labelIndex, label] of output.outputNetLabelPlacements.entries()) {
    const anchorSide = {
      "x+": "left",
      "x-": "right",
      "y+": "bottom",
      "y-": "top",
    }[label.orientation]
    circuitJson.push({
      type: "schematic_net_label",
      schematic_net_label_id: `schematic_net_label_${labelIndex}`,
      source_net_id: `source_net_${label.netId}`,
      center: label.center,
      anchor_position: label.anchorPoint,
      anchor_side: anchorSide,
      text: label.netId,
      symbol_name:
        label.netId === "GND" && label.orientation === "y-"
          ? "rail_down"
          : undefined,
    } as AnyCircuitElement)
  }

  return circuitJson
}

test("ICM-20948 pins 9 and 11 share a downward GND label without overlap", async () => {
  const solver = new SchematicTracePipelineSolver(inputProblem as any)

  solver.solve()

  const groundLabel =
    solver.netLabelToTraceSolver!.outputNetLabelPlacements.find((label) =>
      label.pinIds.includes("schematic_port_115"),
    )!

  expect(groundLabel.pinIds).toContain("schematic_port_117")
  expect(groundLabel.orientation).toBe("y-")

  expect(createSchematicCircuitJson(solver)).toMatchSchematicSnapshot(
    import.meta.path,
  )
})
