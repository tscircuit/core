import { expect, it } from "bun:test"
import { InvalidProps } from "lib/errors/InvalidProps"
import "lib/register-catalogue"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

it("Chip with pinrow footprint", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="20mm" height="10mm">
      <chip name="U1" footprint="pinrow8" />
      <chip name="U2" footprint="pinrow8" />
      <trace from=".U1 > .pin1" to=".U2 > .pin1" />
      <schematicbox
        height={2}
        width={2}
        strokeStyle="dashed"
        schX={0}
        schY={0}
        overlay={[".U1 > .pin1", ".U1 > .pin2"]}
      />
    </board>,
  )

  circuit.render()
  console.log(
    circuit.getCircuitJson().find((el) => el.type === "schematic_box"),
  )
})
