import { expect, test } from "bun:test"
import type { AnyCircuitElement } from "circuit-json"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

const c19268734CircuitJson: AnyCircuitElement[] = [
  {
    type: "source_component",
    ftype: "simple_chip",
    source_component_id: "source_component_1",
    name: "U1",
  },
  {
    type: "pcb_component",
    pcb_component_id: "pcb_component_1",
    source_component_id: "source_component_1",
    center: { x: 0, y: 0 },
    layer: "top",
    rotation: 0,
    width: 6.68,
    height: 1.6,
    obstructs_within_bounds: true,
  },
  ...([-2.54, 0, 2.54] as const).flatMap((x, index) => {
    const pinNumber = index + 1
    return [
      {
        type: "source_port" as const,
        source_port_id: `source_port_${pinNumber}`,
        source_component_id: "source_component_1",
        name: `pin${pinNumber}`,
        pin_number: pinNumber,
        port_hints: [],
      },
      {
        type: "pcb_plated_hole" as const,
        shape: "circle" as const,
        outer_diameter: 1.6,
        hole_diameter: 1.1,
        x,
        y: 0,
        layers: ["top" as const],
        port_hints: [`pin${pinNumber}`],
        pcb_component_id: "pcb_component_1",
        pcb_port_id: `pcb_port_${pinNumber}`,
        pcb_plated_hole_id: `pcb_plated_hole_${pinNumber}`,
      },
    ]
  }),
]

test("jlcpcb connector footprint falls back to parts engine", async () => {
  const { circuit } = getTestFixture({
    platform: {
      routingDisabled: true,
      partsEngine: {
        findPart: async () => ({}),
        fetchPartCircuitJson: async ({ supplierPartNumber }) => {
          expect(supplierPartNumber).toBe("C19268734")
          await new Promise((resolve) => setTimeout(resolve, 100))
          return c19268734CircuitJson
        },
      },
    },
  })

  circuit.add(
    <board width={20} height={20}>
      <connector
        name="J1"
        manufacturerPartNumber="XDM254-1-03-W-8.5-G0"
        supplierPartNumbers={{ jlcpcb: ["C19268734"] }}
        pinLabels={{ pin1: "P1", pin2: "P2", pin3: "P3" }}
        footprint="jlcpcb:C19268734"
      />
      <pcbnotetext
        pcbY={-3}
        fontSize={0.7}
        text="JLCPCB fallback: 3 plated holes"
      />
    </board>,
  )

  await circuit.renderUntilSettled()

  expect(circuit.db.external_footprint_load_error.list()).toHaveLength(0)
  expect(circuit.db.pcb_plated_hole.list()).toHaveLength(3)
  expect(circuit.db.pcb_port.list()).toHaveLength(3)
  expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
