import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

const distance = (a: { x: number; y: number }, b: { x: number; y: number }) =>
  Math.hypot(a.x - b.x, a.y - b.y)

test("DEBUG: Group constraint solving", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board pcbPack width="60mm" height="20mm">
      <group name="group1">
        <resistor name="R1" resistance="1k" footprint="0402" />
      </group>

      <group name="group2">
        <resistor name="R2" resistance="1k" footprint="0402" />
      </group>

      <group name="group3">
        <resistor name="R3" resistance="1k" footprint="0603" />
      </group>

      <constraint
        pcb
        xDist="20mm"
        left="group1"
        right="group2"
        centerToCenter
      />
    </board>,
  )

  await circuit.renderUntilSettled()
  const g1 = circuit.db.pcb_group.getWhere({ name: "group1" })
  const g2 = circuit.db.pcb_group.getWhere({ name: "group2" })

  const centerDist = distance(g1!.center, g2!.center)
  console.log(`\nDistance: ${centerDist.toFixed(2)}mm`)
  expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
