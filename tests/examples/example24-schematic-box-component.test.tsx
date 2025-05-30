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
        paddingTop={0.6}
        overlay={[".U1 > .pin1", ".U1 > .pin2", ".U1 > .pin3", ".U1 > .pin4"]}
        schX={0}
        schY={0}
      />
      <schematicbox
        padding={0.2}
        strokeStyle="dashed"
        overlay={[
          ".U2 > .pin1",
          ".U2 > .pin2",
          ".U2 > .pin3",
          ".U2 > .pin4",
          ".U1 > .pin5",
          ".U1 > .pin6",
          ".U1 > .pin7",
          ".U1 > .pin8",
        ]}
        schX={0}
        schY={0}
      />
      <schematicbox
        paddingRight={0.2}
        paddingLeft={0.2}
        strokeStyle="dashed"
        schX={0}
        schY={0}
      />
    </board>,
  )

  circuit.render()
  console.log(
    circuit.getCircuitJson().filter((c) => c.type === "schematic_box"),
  )
})
