import { expect, test } from "bun:test"
import { CC2745R10 } from "@tsci/tscircuit.ti"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("repro164: CC2745R10 power pin connections", async () => {
  const { circuit } = getTestFixture()
  circuit.pcbDisabled = true

  circuit.add(
    <CC2745R10
      name="U1"
      connections={{
        pin1: "net.VDDR",
        pin2: "net.VDDR",
        pin34: "net.VDDR",
        pin18: "net.VDDS",
        pin29: "net.VDDS",
        pin31: "net.VDDS",
        pin38: "net.VDDS",
        pin28: "net.VDDD",
        pin9: "net.VDDIO",
        pin17: "net.VDDIO",
      }}
    />,
  )

  await circuit.renderUntilSettled()

  expect(circuit).toMatchSchematicSnapshot(import.meta.path)
})
