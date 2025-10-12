import { expect, test } from "bun:test"
import { getTestFixture } from "../fixtures/get-test-fixture"

test("unnamed chips receive sequential unnamed_chip fallback names", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="15mm" height="10mm">
      {/* @ts-expect-error - Testing unnamed chip fallback naming */}
      <chip
        footprint="soic8"
        schHeight={2}
        schWidth={2}
        pinLabels={{
          pin1: ["A1"],
          pin2: ["A2"],
        }}
      />

      {/* @ts-expect-error - Testing unnamed chip fallback naming */}
      <chip
        schHeight={2}
        schWidth={2}
        footprint="pinrow8"
        pinLabels={{
          pin1: ["A1"],
          pin2: ["A2"],
        }}
      />
      <trace from=".unnamed_chip1 > .pin1" to="unnamed_chip2 > .pin1" />
    </board>,
  )

  await circuit.renderUntilSettled()

  const circuitJson = circuit.getCircuitJson()

  // Explicitly check the names of the created source components.
  const sourceComponents = circuitJson.filter(
    (e: any) => e.type === "source_component" && e.ftype === "simple_chip",
  )
  const names = sourceComponents.map((c: any) => c.name).sort()

  expect(sourceComponents).toHaveLength(2)
  expect(names).toEqual(["unnamed_chip1", "unnamed_chip2"])
})
