import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("pcbvia inserts computed PCB geometry without high-level via artifacts", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width={10} height={10}>
      <pcbvia
        pcbX={1.25}
        pcbY={-2.5}
        holeDiameter={0.3}
        outerDiameter={0.7}
        layers={["top", "bottom"]}
        fromLayer="top"
        toLayer="bottom"
        netIsAssignable={false}
        tentedOnTop
        tentedOnBottom={false}
      />
    </board>,
  )

  circuit.render()

  expect(circuit.db.pcb_via.list()).toEqual([
    expect.objectContaining({
      x: 1.25,
      y: -2.5,
      hole_diameter: 0.3,
      outer_diameter: 0.7,
      layers: ["top", "bottom"],
      from_layer: "top",
      to_layer: "bottom",
      net_is_assignable: false,
      tented_on_top: true,
      tented_on_bottom: false,
    }),
  ])
  expect(circuit.db.source_manually_placed_via.list()).toHaveLength(0)
  expect(circuit.db.source_component.list()).toHaveLength(0)
  expect(circuit.db.pcb_component.list()).toHaveLength(0)
})
