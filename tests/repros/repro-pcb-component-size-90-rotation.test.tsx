import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("pcb_component width/height reflect a 90 degree component rotation", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board width="10mm" height="10mm">
      <chip
        name="U1"
        pcbRotation={90}
        footprint={
          <footprint>
            <smtpad
              pcbX={0}
              pcbY={0}
              layer="top"
              shape="rect"
              width="1mm"
              height="0.4mm"
              portHints={["pin1"]}
            />
          </footprint>
        }
      />
    </board>,
  )
  await circuit.renderUntilSettled()
  const pcbComponent = circuit
    .getCircuitJson()
    .find((e: any) => e.type === "pcb_component") as any
  // A 1.0mm x 0.4mm pad rotated 90deg occupies 0.4mm wide x 1.0mm tall.
  expect(pcbComponent.width).toBeCloseTo(0.4, 5)
  expect(pcbComponent.height).toBeCloseTo(1.0, 5)
})
