import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test.each([
  { layers: 2, thickness: 1.6, material: "fr4" },
  { layers: 6, thickness: 1.6, material: "fr4" },
  { layers: 4, thickness: 1.2, material: "fr4" },
  { layers: 4, thickness: 1.6, material: "flex" },
  { layers: 4, thickness: 1.6, material: "fr1" },
  { layers: 6, thickness: 1.2, material: "flex" },
] as const)(
  "unsupported construction %j emits no stackup or error",
  async (construction) => {
    const { circuit } = getTestFixture()
    circuit.add(
      <board
        width={20}
        height={20}
        fabricatorPreset="jlcpcb_standard"
        {...construction}
      />,
    )
    await circuit.renderUntilSettled()
    expect(circuit.db.pcb_stackup.list()).toHaveLength(0)
    expect(circuit.db.pcb_placement_error.list()).toHaveLength(0)
  },
)
