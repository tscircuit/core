import { expect, test } from "bun:test"
import { assembly } from "lib"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("shaft-flat references require a D shaft and wire termination remains in the model spec", () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <assembly.device>
      <assembly.motor
        name="ROUND"
        model="nema17_round"
        motorRotation="calc(shaftflat+90deg)"
      />
    </assembly.device>,
  )
  expect(() => circuit.render()).toThrow("has no shaftflat reference")
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
          motorRotation="90deg"
        />
      </assembly.device>,
    )
    circuit.render()
    const cad = circuit.db.cad_component.list()[0]!
    expect(cad.model_glb_url).toBe(
      `https://modelcdn.tscircuit.com/jscad_models/nema17_${suffix}.glb`,
    )
    expect(cad.rotation!.z).toBeCloseTo(90, 5)
  }
})
