import { expect, test } from "bun:test"
import type { PcbGroup } from "circuit-json"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import { renderToCircuitJson } from "tests/fixtures/renderToCircuitJson"

test("subcircuit-circuit-json11 - pcbAnchorAlignment positions autosized circuitJson subcircuit", async () => {
  const { circuit } = getTestFixture()

  const subcircuitCircuitJson = await renderToCircuitJson(
    <group name="G1">
      <resistor name="R1" resistance="1k" footprint="0402" pcbX={0} pcbY={0} />
      <resistor name="R2" resistance="1k" footprint="0402" pcbX={4} pcbY={2} />
    </group>,
  )

  circuit.add(
    <board width="30mm" height="30mm">
      <subcircuit
        name="S1"
        circuitJson={subcircuitCircuitJson}
        pcbX={10}
        pcbY={15}
        pcbAnchorAlignment="top_left"
      />
    </board>,
  )

  await circuit.renderUntilSettled()

  const pcbGroup = circuit.db.pcb_group
    .list()
    .find((group) => group.name === "S1") as PcbGroup | undefined

  expect(pcbGroup).toBeDefined()
  expect(pcbGroup?.anchor_position).toEqual({ x: 10, y: 15 })
  expect(pcbGroup?.anchor_alignment).toBe("top_left")

  const topLeft = {
    x: pcbGroup!.center.x - pcbGroup!.width / 2,
    y: pcbGroup!.center.y + pcbGroup!.height / 2,
  }

  expect(topLeft.x).toBeCloseTo(10, 6)
  expect(topLeft.y).toBeCloseTo(15, 6)
})
