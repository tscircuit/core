import { expect, it } from "bun:test"
import { InvalidProps } from "lib/errors/InvalidProps"
import "lib/register-catalogue"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

it("Chip with pinrow footprint", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="10mm" height="10mm">
      <chip name="U1" footprint={"soic8"} />
      <chip name="U2" footprint={"soic8"} schX={2} />
      <schematicbox
        height={0}
        width={2}
        overlay={[".U1 > .pin1", ".U1 > .pin2", ".U1 > .pin3", ".U1 > .pin4"]}
        schX={0}
        schY={0}
      />
    </board>,
  )

  circuit.render()
  console.log(
    circuit.getCircuitJson().find((el) => el.type === "schematic_box"),
  )
})
