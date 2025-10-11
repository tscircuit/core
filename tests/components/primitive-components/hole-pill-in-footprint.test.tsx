import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("Pill-shaped hole in a footprint", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="20mm" height="20mm">
      <chip
        name="U1"
        footprint={
          <footprint>
            <hole shape="pill" width="3mm" height="6mm" pcbX="0mm" pcbY="0mm" />
            <hole shape="pill" width="2mm" height="4mm" pcbX="5mm" pcbY="0mm" />
            <smtpad
              portHints={["1"]}
              pcbX="-5mm"
              pcbY="0mm"
              shape="rect"
              width="1mm"
              height="1mm"
            />
          </footprint>
        }
      />
    </board>,
  )

  circuit.render()

  const pcbHoles = circuit.db.pcb_hole.list()

  expect(pcbHoles.length).toBe(2)

  // First hole
  expect(pcbHoles[0].hole_shape).toBe("oval")
  expect((pcbHoles[0] as any).hole_width).toBe(3)
  expect((pcbHoles[0] as any).hole_height).toBe(6)

  // Second hole
  expect(pcbHoles[1].hole_shape).toBe("oval")
  expect((pcbHoles[1] as any).hole_width).toBe(2)
  expect((pcbHoles[1] as any).hole_height).toBe(4)

  expect(circuit.getCircuitJson()).toMatchPcbSnapshot(import.meta.path)
})
