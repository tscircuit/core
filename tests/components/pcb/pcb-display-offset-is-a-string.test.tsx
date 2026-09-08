import { expect, test } from "bun:test"
import { pcb_component, pcb_group } from "circuit-json"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("display_offset_x/y are display strings, not raw numbers", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="40mm" height="40mm" routingDisabled>
      <resistor
        name="R1"
        resistance="1k"
        footprint="0402"
        pcbX="3mm"
        pcbY="2mm"
      />
      <group name="G1" pcbX={-4} pcbY="1mm">
        <resistor name="R2" resistance="1k" footprint="0402" />
      </group>
    </board>,
  )

  await circuit.renderUntilSettled()

  const components = circuit.db.pcb_component.list()
  const groups = circuit.db.pcb_group.list()

  expect(components.length).toBeGreaterThan(0)
  expect(groups.length).toBeGreaterThan(0)

  for (const component of components) {
    if (component.display_offset_x !== undefined) {
      expect(typeof component.display_offset_x).toBe("string")
    }
    if (component.display_offset_y !== undefined) {
      expect(typeof component.display_offset_y).toBe("string")
    }
    expect(pcb_component.safeParse(component).success).toBe(true)
  }

  const r1WithOffset = components.find(
    (c) =>
      typeof c.display_offset_x === "string" &&
      c.display_offset_x.includes("3"),
  )
  expect(r1WithOffset?.display_offset_x).toBe("3mm")
  expect(r1WithOffset?.display_offset_y).toBe("2mm")

  for (const group of groups) {
    if (group.display_offset_x !== undefined) {
      expect(typeof group.display_offset_x).toBe("string")
    }
    if (group.display_offset_y !== undefined) {
      expect(typeof group.display_offset_y).toBe("string")
    }
    expect(pcb_group.safeParse(group).success).toBe(true)
  }
})
