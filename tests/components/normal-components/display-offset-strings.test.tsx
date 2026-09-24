import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("display_offset_x/y are emitted as strings", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="20mm" height="20mm">
      <group name="G1" pcbX={-5} pcbY={2}>
        <resistor name="R1" resistance="1k" footprint="0402" pcbX="3mm" />
      </group>
    </board>,
  )

  await circuit.renderUntilSettled()

  const circuitJson = circuit.getCircuitJson()
  const pcbComponent = circuitJson.find(
    (e: any) => e.type === "pcb_component",
  ) as any
  const pcbGroup = circuitJson.find(
    (e: any) => e.type === "pcb_group" && e.name === "G1",
  ) as any

  expect(typeof pcbComponent.display_offset_x).toBe("string")
  expect(pcbComponent.display_offset_x).toBe("3mm")
  expect(pcbGroup.display_offset_x).toBe("-5mm")
  expect(pcbGroup.display_offset_y).toBe("2mm")
})
