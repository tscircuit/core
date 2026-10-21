import { expect, test } from "bun:test"
import { assembly, getAssemblyExplosion } from "lib"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("every plural target is validated even when its stage or progress is not displayed", async () => {
  for (const targetRefs of [
    "A, missing",
    ["A", "missing"],
    ["A", "DUPLICATE"],
  ]) {
    const { circuit } = getTestFixture()
    circuit.add(
      <assembly.device name="DEVICE">
        <assembly.part
          name="A"
          cadModel={{ jscad: { type: "cuboid", size: [4, 4, 4] } }}
        />
        <assembly.part name="DUPLICATE" />
        <assembly.part name="DUPLICATE" />
        <assembly.explosion.stage name="first" />
        <assembly.explosion.stage name="later">
          <assembly.explosion.move targetRefs={targetRefs} offZ="10mm" />
        </assembly.explosion.stage>
      </assembly.device>,
    )
    await circuit.renderUntilSettled()
    const assembled = structuredClone(circuit.getCircuitJson())
    const invalid =
      typeof targetRefs === "string" || targetRefs[1] === "missing"
        ? "missing"
        : "DUPLICATE"
    const matches = invalid === "missing" ? 0 : 2
    for (const options of [
      { throughStageRef: "DEVICE.first" },
      { throughStageRef: "DEVICE.later", stageProgress: 0 },
    ]) {
      expect(() => getAssemblyExplosion(circuit, options)).toThrow(
        `Explosion stage "DEVICE.later" target "${invalid}" matched ${matches} assembly parts; expected one`,
      )
      expect(circuit.getCircuitJson()).toEqual(assembled)
    }
  }
})
