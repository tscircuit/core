import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("repro: trace path with more than two ports", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="16mm" height="12mm">
      <chip
        name="mcu"
        footprint="soic8"
        pinLabels={{
          pin1: "AUX",
          pin2: "SWDIO",
        }}
        schPinArrangement={{
          rightSide: {
            direction: "top-to-bottom",
            pins: ["SWDIO", "pin1"],
          },
        }}
        pcbX={-4}
        schX={-2}
      />
      <pinheader name="J_DEBUG" pinCount={1} pcbX={4} schX={2} />
      <trace path={[".mcu .SWDIO", ".J_DEBUG .pin1", ".mcu .pin1"]} />
      <schematictext
        text="ONE TRACE PATH: SWDIO - J_DEBUG - AUX"
        fontSize={0.25}
        schY={1.5}
      />
      <pcbnotetext
        text="ONE TRACE PATH: SWDIO - J_DEBUG - AUX"
        fontSize={0.6}
        pcbY={-5}
      />
    </board>,
  )

  await circuit.renderUntilSettled()

  expect(circuit).toMatchSchematicSnapshot(import.meta.path)
  expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
