import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("subcircuit caching retains standalone oval and pill silkscreen", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board width={25} height={16} routingDisabled schematicDisabled>
      <subcircuit name="S1" pcbX={2} pcbY={1} _subcircuitCachingEnabled>
        <silkscreenoval radiusX={3} radiusY={1} pcbX={-5} pcbRotation={30} />
        <silkscreenpill
          width={6}
          height={2}
          pcbX={4}
          pcbRotation={-25}
          layer="bottom"
        />
      </subcircuit>
      <pcbnotetext
        text="Cached standalone oval / pill"
        pcbY={6}
        fontSize={0.6}
      />
    </board>,
  )
  await circuit.renderUntilSettled()
  expect(circuit.db.pcb_silkscreen_oval.list()).toHaveLength(1)
  expect(circuit.db.pcb_silkscreen_pill.list()).toHaveLength(1)
  const [oval] = circuit.db.pcb_silkscreen_oval.list()
  const [pill] = circuit.db.pcb_silkscreen_pill.list()
  expect(oval).toMatchObject({ radius_x: 3, radius_y: 1, layer: "top" })
  expect(pill).toMatchObject({ width: 6, height: 2, layer: "bottom" })
  expect(oval.ccw_rotation).toBeCloseTo(30, 6)
  expect(pill.ccw_rotation).toBeCloseTo(-25, 6)
  expect(oval.center.x).toBeCloseTo(-3, 6)
  expect(pill.center.x).toBeCloseTo(6, 6)
  expect(oval.center.y).toBeCloseTo(1, 6)
  expect(pill.center.y).toBeCloseTo(1, 6)
  await expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
