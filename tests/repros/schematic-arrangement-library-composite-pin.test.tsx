import { expect, test } from "bun:test"
import type { AnyCircuitElement } from "circuit-json"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

// Same pad layout as jlcpcb:C456012 (USB-C 6P): four shell holes share pin7
const usbC6pFootprint: AnyCircuitElement[] = [
  {
    type: "source_component",
    source_component_id: "source_component_0",
    ftype: "simple_chip",
    name: "U1",
  },
  {
    type: "pcb_component",
    pcb_component_id: "pcb_component_0",
    source_component_id: "source_component_0",
    center: { x: 0, y: 0 },
    width: 8.7,
    height: 4.7,
    layer: "top",
    rotation: 0,
    obstructs_within_bounds: true,
  },
  ...[-2.7, -1.5, -0.5, 0.5, 1.5, 2.7].map(
    (x, index): AnyCircuitElement => ({
      type: "pcb_smtpad",
      pcb_smtpad_id: `pcb_smtpad_${index}`,
      pcb_component_id: "pcb_component_0",
      shape: "rect",
      x,
      y: 1.75,
      width: 0.7,
      height: 1.2,
      layer: "top",
      port_hints: [`pin${index + 8}`],
    }),
  ),
  ...[
    { x: -4.32, y: 1.5 },
    { x: 4.32, y: 1.5 },
    { x: -4.32, y: -2.3 },
    { x: 4.32, y: -2.3 },
  ].map(
    ({ x, y }, index): AnyCircuitElement => ({
      type: "pcb_plated_hole",
      pcb_plated_hole_id: `pcb_plated_hole_${index}`,
      pcb_component_id: "pcb_component_0",
      shape: "pill",
      x,
      y,
      outer_width: 1.1,
      outer_height: 1.9,
      hole_width: 0.6,
      hole_height: 1.4,
      ccw_rotation: 0,
      layers: ["top", "bottom"],
      port_hints: ["pin7"],
    }),
  ),
]

test("schematic pin arrangement keeps a port on every shell hole of a library footprint", async () => {
  const { circuit } = getTestFixture({
    platform: {
      footprintLibraryMap: {
        jlcpcb: async () => ({ footprintCircuitJson: usbC6pFootprint }),
      },
    },
  })

  circuit.add(
    <board width={20} height={12} routingDisabled>
      <chip
        name="J1"
        footprint="jlcpcb:C456012"
        pinLabels={{
          pin7: "SHELL",
          pin8: "GND1",
          pin9: "VBUS1",
          pin10: "CC1",
          pin11: "CC2",
          pin12: "VBUS2",
          pin13: "GND2",
        }}
        schPinArrangement={{
          leftSide: {
            direction: "top-to-bottom",
            pins: ["VBUS1", "VBUS2", "CC1", "CC2", "GND1", "GND2", "SHELL"],
          },
        }}
        connections={{ SHELL: "net.GND", GND1: "net.GND", GND2: "net.GND" }}
      />
      <pcbnotetext
        text="Library USB-C footprint: four shell holes share pin7 (SHELL)"
        pcbY={4.5}
        fontSize={0.45}
      />
      <pcbnotetext
        text="SHELL is in schPinArrangement, every shell hole keeps a port"
        pcbY={-4.5}
        fontSize={0.45}
      />
    </board>,
  )

  await circuit.renderUntilSettled()

  const shellHoles = circuit.db.pcb_plated_hole.list()
  expect(shellHoles.filter((hole) => hole.pcb_port_id)).toHaveLength(4)
  expect(new Set(shellHoles.map((hole) => hole.pcb_port_id)).size).toBe(4)

  const shellSourcePortIds = circuit.db.pcb_port
    .list()
    .filter((pcbPort) =>
      shellHoles.some((hole) => hole.pcb_port_id === pcbPort.pcb_port_id),
    )
    .map((pcbPort) => pcbPort.source_port_id)
  const shellInternalConnection =
    circuit.db.source_component_internal_connection
      .list()
      .find((connection) =>
        connection.source_port_ids.includes(shellSourcePortIds[0]),
      )
  expect(shellInternalConnection?.source_port_ids.toSorted()).toEqual(
    shellSourcePortIds.toSorted(),
  )
  expect(circuit.db.source_ambiguous_port_reference.list()).toHaveLength(0)
  expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
