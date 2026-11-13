import { expect, test } from "bun:test"
import type { AnyCircuitElement } from "circuit-json"
import { convertCircuitJsonToPickAndPlaceCsv } from "circuit-json-to-pnp-csv"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("normal placement export uses the assembly orientation from the parts engine", async () => {
  const supplierPart: AnyCircuitElement[] = [
    {
      type: "pcb_component",
      pcb_component_id: "pcb_component_1",
      source_component_id: "source_component_1",
      center: { x: 0, y: 0 },
      width: 4,
      height: 4,
      layer: "top",
      rotation: 0,
      obstructs_within_bounds: true,
      pin1_location: "leftside_top",
      supplier_pin1_location_map: { jlcpcb: "bottomside_left" },
    },
    {
      type: "pcb_smtpad",
      shape: "rect",
      pcb_smtpad_id: "pcb_smtpad_1",
      pcb_component_id: "pcb_component_1",
      x: -2,
      y: 1,
      width: 0.5,
      height: 0.3,
      layer: "top",
      port_hints: ["pin1"],
    },
  ]
  const { circuit } = getTestFixture()
  circuit.add(
    <board
      width={10}
      height={10}
      routingDisabled
      partsEngine={{
        findPart: () => ({}),
        fetchPartCircuitJson: () => supplierPart,
      }}
    >
      <chip
        name="U1"
        pcbRotation={270}
        supplierPartNumbers={{ jlcpcb: ["C123"] }}
        footprint={
          <footprint>
            <smtpad
              portHints={["pin1"]}
              pcbX={-1}
              pcbY={-2}
              width={0.3}
              height={0.5}
              shape="rect"
            />
            <smtpad
              portHints={["pin2"]}
              pcbX={1}
              pcbY={-2}
              width={0.3}
              height={0.5}
              shape="rect"
            />
            <smtpad
              portHints={["pin3"]}
              pcbX={1}
              pcbY={2}
              width={0.3}
              height={0.5}
              shape="rect"
            />
            <smtpad
              portHints={["pin4"]}
              pcbX={-1}
              pcbY={2}
              width={0.3}
              height={0.5}
              shape="rect"
            />
          </footprint>
        }
      />
    </board>,
  )
  await circuit.renderUntilSettled()

  const placedComponent = circuit.db.pcb_component.list()[0]!
  expect(placedComponent.supplier_pin1_location_map).toEqual({
    jlcpcb: "bottomside_left",
  })
  expect(
    convertCircuitJsonToPickAndPlaceCsv(circuit.getCircuitJson(), {
      supplier: "jlcpcb",
    }),
  ).toContain("U1,0.000,0.000,top,270")
})
