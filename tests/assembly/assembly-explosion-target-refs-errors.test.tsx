import { expect, test } from "bun:test"
import { assembly } from "lib"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("rendering validates every plural target, including later stages", async () => {
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
    const invalid =
      typeof targetRefs === "string" || targetRefs[1] === "missing"
        ? "missing"
        : "DUPLICATE"
    const matches = invalid === "missing" ? 0 : 2
    await expect(circuit.renderUntilSettled()).rejects.toThrow(
      `Explosion stage "DEVICE.later" target "${invalid}" matched ${matches} assembly parts; expected one`,
    )
  }
})
