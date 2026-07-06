import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("example42: switch pinLabels render on schematic", async () => {
  const { circuit } = getTestFixture()
  circuit.pcbDisabled = true

  circuit.add(
    <board width="24mm" height="16mm">
      <switch
        name="SW1"
        type="spst"
        schX={-3}
        schY={1}
        pinLabels={{
          pin1: "IN",
          pin2: "OUT",
        }}
      />
      <switch
        name="SW2"
        type="spdt"
        schX={1.5}
        schY={1}
        pinLabels={{
          pin1: "COM",
          pin2: "NC",
          pin3: "NO",
        }}
      />
      <switch
        name="SW3"
        type="dpst"
        schX={-3}
        schY={-1.5}
        pinLabels={{
          pin1: "A1",
          pin2: "A2",
          pin3: "B1",
          pin4: "B2",
        }}
      />
      <switch
        name="SW4"
        type="dpdt"
        schX={1.5}
        schY={-1.5}
        pinLabels={{
          pin1: "A_COM",
          pin2: "A_NC",
          pin3: "A_NO",
          pin4: "B_COM",
          pin5: "B_NC",
          pin6: "B_NO",
        }}
      />
      <trace from=".SW1 > .IN" to=".SW2 > .COM" />
      <trace from=".SW1 > .OUT" to=".SW2 > .NO" />
      <trace from=".SW3 > .A1" to=".SW4 > .A_COM" />
      <trace from=".SW3 > .A2" to=".SW4 > .A_NO" />
      <trace from=".SW3 > .B1" to=".SW4 > .B_COM" />
      <trace from=".SW3 > .B2" to=".SW4 > .B_NO" />
    </board>,
  )

  await circuit.renderUntilSettled()

  expect(circuit).toMatchSchematicSnapshot(import.meta.path)
})
