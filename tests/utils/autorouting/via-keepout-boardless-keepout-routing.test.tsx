import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("boardless group supports routing and must enforce its own keepout", async () => {
  for (const withKeepout of [false, true]) {
    const { circuit } = getTestFixture()
    circuit.schematicDisabled = true
    circuit.add(
      <group
        name="standalone"
        subcircuit
        width={30}
        height={20}
        pcbX={0}
        pcbY={0}
      >
        {withKeepout && (
          <keepout
            shape="rect"
            width={100}
            height={100}
            allowTraces
            allowPlacements
            layers={["top", "bottom"]}
          />
        )}
        <resistor name="R1" resistance="1k" footprint="1206" pcbX={-4} />
        <resistor
          name="R2"
          resistance="1k"
          footprint="1206"
          pcbX={4}
          layer="bottom"
        />
        <trace from=".R1 > .pin1" to=".R2 > .pin1" />
      </group>,
    )
    await circuit.renderUntilSettled()
    const vias = circuit.db.pcb_via.list()
    const violations = withKeepout
      ? vias.filter(
          (v) =>
            Math.hypot(
              Math.max(Math.abs(v.x) - 50, 0),
              Math.max(Math.abs(v.y) - 50, 0),
            ) <
            v.outer_diameter / 2,
        )
      : []
    if (!withKeepout) {
      expect(circuit.db.pcb_trace.list()).toHaveLength(1)
      expect(vias.length).toBeGreaterThan(0)
    }
    expect(violations).toEqual([])
  }
})
