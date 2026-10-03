import { expect, test } from "bun:test"
import { assembly } from "lib"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("motor wire terminations retain shaft-flat mounting references", () => {
  for (const [wireConnection, suffix] of [
    ["none", "nowires"],
    ["stubs", "wirestubs"],
    ["jst-ph-6", "jstph6"],
  ] as const) {
    const { circuit } = getTestFixture()
    circuit.add(
      <assembly.device>
        <assembly.motor
          name="MOTOR"
          standard="nema17"
          wireConnection={wireConnection}
        />
        <board
          width={42}
          height={42}
          mountedTo="MOTOR.backface"
          mountRotation="MOTOR.shaftflat"
          routingDisabled
        />
      </assembly.device>,
    )
    circuit.render()
    expect(circuit.db.cad_component.list()[0]!.model_glb_url).toBe(
      `https://modelcdn.tscircuit.com/jscad_models/nema17_${suffix}.glb`,
    )
  }
})
