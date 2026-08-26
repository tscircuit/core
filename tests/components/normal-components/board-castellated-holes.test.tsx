import { expect, test } from "bun:test"
import type { BoardOutlinePoint } from "@tscircuit/props"
import { getFullConnectivityMapFromCircuitJson } from "circuit-json-to-connectivity-map"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("board outline points render castellated holes with optional connectivity", async () => {
  const { circuit } = getTestFixture()
  const outline = [
    { x: -6, y: -5 },
    { x: 6, y: -5 },
    {
      x: 6,
      y: 0,
      isCastellatedHole: true,
      holeDiameter: "1mm",
      padDiameter: "1.5mm",
    },
    { x: 6, y: 5 },
    { x: -6, y: 5 },
    {
      x: -6,
      y: 0,
      isCastellatedHole: true,
      holeDiameter: "0.8mm",
      padDiameter: "1.2mm",
      connectsTo: [".U1 > .GND", "net.GND"],
    },
  ] satisfies BoardOutlinePoint[]

  circuit.add(
    <board outlineOffsetX="1mm" outlineOffsetY="2mm" outline={outline}>
      <chip
        name="U1"
        pinLabels={{ pin1: ["GND"] }}
        footprint={
          <footprint>
            <smtpad
              portHints={["pin1"]}
              pcbX={0}
              pcbY={0}
              width="2mm"
              height="2mm"
              shape="rect"
            />
          </footprint>
        }
      />
      <pcbnotetext
        pcbY="-3mm"
        fontSize="0.45mm"
        text="CASTELLATED BOARD EDGE HOLES"
      />
    </board>,
  )

  await circuit.renderUntilSettled()

  const circuitJson = circuit.getCircuitJson()
  const pcbBoard = circuit.db.pcb_board.list()[0]
  const platedHoles = circuit.db.pcb_plated_hole
    .list()
    .sort((a, b) => a.x - b.x)
  const pcbPorts = circuit.db.pcb_port.list()
  const castellatedSourcePort = circuit.db.source_port
    .list()
    .find((port) => port.name === "castellated_hole_6")
  const chipSourcePort = circuit.db.source_port
    .list()
    .find((port) => port.port_hints?.includes("GND"))
  const sourceNet = circuit.db.source_net
    .list()
    .find((net) => net.name === "GND")
  const sourceTrace = circuit.db.source_trace
    .list()
    .find((trace) =>
      trace.connected_source_port_ids.includes(
        castellatedSourcePort?.source_port_id ?? "",
      ),
    )
  const pcbPad = circuit.db.pcb_smtpad.list()[0]
  const fullConnectivityMap = getFullConnectivityMapFromCircuitJson(circuitJson)

  expect(pcbBoard.outline).toEqual([
    { x: -5, y: -3 },
    { x: 7, y: -3 },
    { x: 7, y: 2 },
    { x: 7, y: 7 },
    { x: -5, y: 7 },
    { x: -5, y: 2 },
  ])
  expect(platedHoles).toHaveLength(2)
  expect(platedHoles[0]).toMatchObject({
    x: -5,
    y: 2,
    hole_diameter: 0.8,
    outer_diameter: 1.2,
    layers: ["top", "bottom"],
  })
  expect(platedHoles[1]).toMatchObject({
    x: 7,
    y: 2,
    hole_diameter: 1,
    outer_diameter: 1.5,
    layers: ["top", "bottom"],
  })
  expect(platedHoles[0].pcb_port_id).toBeDefined()
  expect(platedHoles[1].pcb_port_id).toBeUndefined()
  expect(pcbPorts).toHaveLength(2)
  expect(
    pcbPorts.find(
      (port) => port.source_port_id === castellatedSourcePort?.source_port_id,
    ),
  ).toMatchObject({
    x: -5,
    y: 2,
    layers: ["top", "bottom"],
    is_board_pinout: true,
  })
  expect(sourceTrace?.connected_source_port_ids).toEqual(
    expect.arrayContaining([
      castellatedSourcePort!.source_port_id,
      chipSourcePort!.source_port_id,
    ]),
  )
  expect(sourceTrace?.connected_source_net_ids).toContain(
    sourceNet!.source_net_id,
  )
  expect(
    fullConnectivityMap.areAllIdsConnected([
      castellatedSourcePort!.source_port_id,
      chipSourcePort!.source_port_id,
      sourceNet!.source_net_id,
      platedHoles[0].pcb_plated_hole_id,
      pcbPad.pcb_smtpad_id,
    ]),
  ).toBe(true)
  expect(circuit.db.pcb_placement_error.list()).toHaveLength(0)
  expect(circuit.db.pcb_autorouting_error.list()).toHaveLength(0)
  expect(circuit.db.pcb_trace_error.list()).toHaveLength(0)
  expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
