import { expect, test } from "bun:test"
import { systemblock } from "lib"
import { convertCircuitJsonToSystemSvg } from "circuit-to-svg"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import { assertSystemGeometry } from "./assert-system-geometry"

test("all four page directions map to page-centered +Y-up geometry", async () => {
  for (const direction of ["right", "left", "down", "up"] as const) {
    const { circuit } = getTestFixture()
    circuit.add(
      <systemblock.page name={direction} direction={direction}>
        <systemblock.group
          name="pipeline"
          displayName={`Signal flow: ${direction}`}
        >
          <systemblock.component
            name="input"
            displayName="Analog input"
            description="Acquire the signal"
          />
          <systemblock.component
            name="filter"
            displayName="Filter"
            description="Remove noise"
          />
          <systemblock.component
            name="output"
            displayName="Digital output"
            description="Publish the measurement"
          />
        </systemblock.group>
        <systemblock.connection from="input" to="filter" label="Samples" />
        <systemblock.connection
          from="filter"
          to="output"
          label="Filtered data"
        />
      </systemblock.page>,
    )
    circuit.render()
    assertSystemGeometry(circuit.getCircuitJson())
    for (const connection of circuit.db.system_block_connection.list()) {
      expect(connection.route).toHaveLength(2)
    }
    const blocks = circuit.db.system_block_component.list()
    const first = blocks.find((block) => block.name === "input")!
    const last = blocks.find((block) => block.name === "output")!
    const delta =
      direction === "right" || direction === "left"
        ? last.center.x - first.center.x
        : last.center.y - first.center.y
    expect(
      delta * (direction === "left" || direction === "down" ? -1 : 1),
    ).toBeGreaterThan(0)
    await expect(
      convertCircuitJsonToSystemSvg(circuit.getCircuitJson(), {
        width: direction === "up" || direction === "down" ? 500 : 1000,
      }),
    ).toMatchSvgSnapshot(import.meta.path, `system-blocks-${direction}`)
  }
})
